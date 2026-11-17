import { auditEventFields } from "@/lib/audit/area";
import "server-only";

import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { PropertyRecordNotFoundError } from "./records";
import { getStayConfigurationIssue, type StayConfigurationIssue } from "@/lib/stays/publishable";
import { propertyDocumentSchema, type PropertyDocument } from "./schema";
import {
  createPropertySearchIndex,
  normalizePropertySearch,
  type PropertyOccupancy,
} from "./search-index";
import {
  buildGeneratedUnitFields,
  type UnitGenerationInput,
} from "./unit-generation";
import {
  MAX_UNITS_PER_PROPERTY,
  parseMoneyToMinorUnits,
  toUnitStayDocument,
  unitDocumentSchema,
  type UnitDocument,
  type UnitInput,
} from "./unit-schema";

export class UnitRecordNotFoundError extends Error {
  constructor() {
    super("The unit does not exist in the selected property.");
    this.name = "UnitRecordNotFoundError";
  }
}

export class UnitLabelConflictError extends Error {
  /** Labels that already exist, when a batch generation collides. */
  readonly labels: string[];

  constructor(labels: string[] = []) {
    super("An active unit with this label already exists in the property.");
    this.name = "UnitLabelConflictError";
    this.labels = labels;
  }
}

export class UnitLimitReachedError extends Error {
  constructor() {
    super("The property reached the maximum number of units.");
    this.name = "UnitLimitReachedError";
  }
}

export class OccupiedUnitArchiveError extends Error {
  constructor() {
    super("Occupied units cannot be archived.");
    this.name = "OccupiedUnitArchiveError";
  }
}

export class UnitLeaseLockedError extends Error {
  constructor() {
    super("A unit occupied by an active lease must stay occupied.");
    this.name = "UnitLeaseLockedError";
  }
}

export class UnitStayNotConfigurableError extends Error {
  readonly reason: StayConfigurationIssue;

  constructor(reason: StayConfigurationIssue) {
    super("The property cannot publish short stays.");
    this.name = "UnitStayNotConfigurableError";
    this.reason = reason;
  }
}

export type PropertyUnit = UnitDocument & { id: string };

const unitLabelCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

function getPropertyReference(organizationId: string, propertyId: string) {
  return getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties")
    .doc(propertyId);
}

function parseUnit(
  organizationId: string,
  propertyId: string,
  unitId: string,
  data: unknown,
): PropertyUnit {
  const parsed = unitDocumentSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid unit document in the active organization.", {
      organizationId,
      propertyId,
      unitId,
      issues: parsed.error.issues,
    });
    throw new Error("A unit record is incomplete or invalid.");
  }

  return { id: unitId, ...parsed.data };
}

function sortUnits(units: PropertyUnit[]) {
  return units.sort((left, right) =>
    unitLabelCollator.compare(left.label, right.label),
  );
}

/**
 * Property occupancy projection: a property is "vacant" (has availability)
 * while at least one active unit is available or it has no units yet,
 * "maintenance" when no unit is available but some are in maintenance, and
 * "occupied" when every active unit is occupied.
 */
export function summarizePropertyUnits(units: Pick<UnitDocument, "status" | "archived">[]) {
  const activeUnits = units.filter((unit) => !unit.archived);
  const occupiedUnitCount = activeUnits.filter((unit) => unit.status === "occupied").length;
  const hasAvailableUnit = activeUnits.some((unit) => unit.status === "available");
  const hasMaintenanceUnit = activeUnits.some((unit) => unit.status === "maintenance");
  const occupancyStatus: PropertyOccupancy =
    activeUnits.length === 0 || hasAvailableUnit
      ? "vacant"
      : hasMaintenanceUnit
        ? "maintenance"
        : "occupied";

  return {
    unitCount: activeUnits.length,
    occupiedUnitCount,
    occupancyStatus,
  };
}

export async function listPropertyUnits(organizationId: string, propertyId: string) {
  const snapshot = await getPropertyReference(organizationId, propertyId)
    .collection("units")
    .limit(MAX_UNITS_PER_PROPERTY)
    .get();

  return sortUnits(
    snapshot.docs.map((document) =>
      parseUnit(organizationId, propertyId, document.id, document.data()),
    ),
  );
}

export async function getPropertyUnit(
  organizationId: string,
  propertyId: string,
  unitId: string,
) {
  const snapshot = await getPropertyReference(organizationId, propertyId)
    .collection("units")
    .doc(unitId)
    .get();
  if (!snapshot.exists) return null;

  return parseUnit(organizationId, propertyId, snapshot.id, snapshot.data());
}

type UnitMutation = {
  units: PropertyUnit[];
  property: PropertyDocument;
  transaction: Transaction;
};

type UnitMutationResult = {
  unitId: string;
  units: PropertyUnit[];
  action: "unit.created" | "unit.updated" | "unit.archived" | "unit.restored";
};

/**
 * Reads a property and all its units inside a transaction, so callers (unit
 * changes and lease activation/closing) can change units and then refresh
 * the property projection with `writePropertyUnitProjection`.
 */
export async function readPropertyUnitsInTransaction(
  transaction: Transaction,
  organizationId: string,
  propertyId: string,
) {
  const propertyReference = getPropertyReference(organizationId, propertyId);
  const [propertySnapshot, unitSnapshots] = await Promise.all([
    transaction.get(propertyReference),
    transaction.get(propertyReference.collection("units").limit(MAX_UNITS_PER_PROPERTY + 1)),
  ]);
  if (!propertySnapshot.exists) throw new PropertyRecordNotFoundError();

  const parsedProperty = propertyDocumentSchema.safeParse(propertySnapshot.data());
  if (!parsedProperty.success) {
    console.error("Invalid property document during unit change.", {
      organizationId,
      propertyId,
      issues: parsedProperty.error.issues,
    });
    throw new Error("A property record is incomplete or invalid.");
  }

  return {
    propertyReference,
    property: parsedProperty.data,
    units: unitSnapshots.docs.map((document) =>
      parseUnit(organizationId, propertyId, document.id, document.data()),
    ),
  };
}

export function writePropertyUnitProjection(
  transaction: Transaction,
  { propertyReference, property }: Pick<
    Awaited<ReturnType<typeof readPropertyUnitsInTransaction>>,
    "propertyReference" | "property"
  >,
  units: PropertyUnit[],
  userUid: string,
) {
  const summary = summarizePropertyUnits(units);
  const index = createPropertySearchIndex({
    name: property.name,
    code: property.code,
    type: property.type,
    address: property.address,
    city: property.city,
    state: property.state,
    status: property.status,
    occupancy: summary.occupancyStatus,
    archived: property.archived,
  });

  transaction.update(propertyReference, {
    ...summary,
    ...index,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userUid,
  });
}

/**
 * Runs a unit change and refreshes the parent property projection in one
 * transaction. Every unit write also writes the parent property, so
 * concurrent unit changes on the same property serialize on that document;
 * this keeps the label uniqueness check and the counters consistent.
 */
async function mutatePropertyUnits(
  organizationId: string,
  propertyId: string,
  userUid: string,
  mutate: (mutation: UnitMutation) => UnitMutationResult,
) {
  const db = getFirebaseAdminFirestore();
  const organizationReference = db.collection("organizations").doc(organizationId);
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();

  return db.runTransaction(async (transaction) => {
    const propertyUnits = await readPropertyUnitsInTransaction(
      transaction,
      organizationId,
      propertyId,
    );
    const result = mutate({
      units: propertyUnits.units,
      property: propertyUnits.property,
      transaction,
    });

    const changedUnit = result.units.find((unit) => unit.id === result.unitId);
    if (
      changedUnit &&
      !changedUnit.archived &&
      result.units.some(
        (unit) =>
          unit.id !== changedUnit.id &&
          !unit.archived &&
          unit.labelKey === changedUnit.labelKey,
      )
    ) {
      throw new UnitLabelConflictError();
    }

    writePropertyUnitProjection(transaction, propertyUnits, result.units, userUid);
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: result.action,
      actorUid: userUid,
      targetId: result.unitId,
      propertyId,
      createdAt: timestamp,
    }));

    return result.unitId;
  });
}

function toUnitFields(input: UnitInput) {
  const marketRentMinor = parseMoneyToMinorUnits(input.marketRent);
  return {
    label: input.label,
    labelKey: normalizePropertySearch(input.label),
    floor: input.floor,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    status: input.status,
    marketRentMinor,
    marketRentCurrency: marketRentMinor === null ? null : input.marketRentCurrency,
    // Firestore rejects undefined; an omitted stay keeps the stored one.
    ...(input.stay ? { stay: toUnitStayDocument(input.stay) } : {}),
  };
}

/** Publishing needs a short-term property with a currency; saving a draft stay does not. */
function assertStayPublishable(property: PropertyDocument, fields: ReturnType<typeof toUnitFields>) {
  if (!fields.stay?.published) return;
  const issue = getStayConfigurationIssue(property);
  if (issue) throw new UnitStayNotConfigurableError(issue);
}

export async function createPropertyUnit(
  organizationId: string,
  propertyId: string,
  userUid: string,
  input: UnitInput,
) {
  const unitReference = getPropertyReference(organizationId, propertyId)
    .collection("units")
    .doc();
  const timestamp = FieldValue.serverTimestamp();

  return mutatePropertyUnits(organizationId, propertyId, userUid, ({ units, property, transaction }) => {
    if (units.length >= MAX_UNITS_PER_PROPERTY) throw new UnitLimitReachedError();

    const fields = toUnitFields(input);
    assertStayPublishable(property, fields);
    transaction.create(unitReference, {
      ...fields,
      archived: false,
      organizationId,
      propertyId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userUid,
      updatedBy: userUid,
    });

    return {
      unitId: unitReference.id,
      units: [...units, { id: unitReference.id, ...fields, archived: false }],
      action: "unit.created",
    };
  });
}

/**
 * Creates a numbered batch of available units in one transaction. Fails as a
 * whole when any generated label matches an active unit or the property would
 * exceed MAX_UNITS_PER_PROPERTY.
 */
export async function createPropertyUnits(
  organizationId: string,
  propertyId: string,
  userUid: string,
  input: UnitGenerationInput,
) {
  const db = getFirebaseAdminFirestore();
  const unitsCollection = getPropertyReference(organizationId, propertyId).collection("units");
  const auditReference = db
    .collection("organizations")
    .doc(organizationId)
    .collection("auditEvents")
    .doc();
  const timestamp = FieldValue.serverTimestamp();
  const generated = buildGeneratedUnitFields(input);

  return db.runTransaction(async (transaction) => {
    const propertyUnits = await readPropertyUnitsInTransaction(
      transaction,
      organizationId,
      propertyId,
    );
    if (propertyUnits.units.length + generated.length > MAX_UNITS_PER_PROPERTY) {
      throw new UnitLimitReachedError();
    }

    const activeLabelKeys = new Set(
      propertyUnits.units.filter((unit) => !unit.archived).map((unit) => unit.labelKey),
    );
    const conflicts = generated.filter((unit) => activeLabelKeys.has(unit.labelKey));
    if (conflicts.length > 0) {
      throw new UnitLabelConflictError(conflicts.map((unit) => unit.label));
    }

    const created = generated.map((fields) => {
      const unitReference = unitsCollection.doc();
      transaction.create(unitReference, {
        ...fields,
        archived: false,
        organizationId,
        propertyId,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userUid,
        updatedBy: userUid,
      });
      return { id: unitReference.id, ...fields, archived: false };
    });

    writePropertyUnitProjection(
      transaction,
      propertyUnits,
      [...propertyUnits.units, ...created],
      userUid,
    );
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: "unit.batch_created",
      actorUid: userUid,
      targetId: propertyId,
      propertyId,
      unitCount: created.length,
      createdAt: timestamp,
    }));

    return created.length;
  });
}

export async function updatePropertyUnit(
  organizationId: string,
  propertyId: string,
  unitId: string,
  userUid: string,
  input: UnitInput,
) {
  const unitReference = getPropertyReference(organizationId, propertyId)
    .collection("units")
    .doc(unitId);
  const timestamp = FieldValue.serverTimestamp();

  return mutatePropertyUnits(organizationId, propertyId, userUid, ({ units, property, transaction }) => {
    const current = units.find((unit) => unit.id === unitId);
    if (!current) throw new UnitRecordNotFoundError();

    const fields = toUnitFields(input);
    assertStayPublishable(property, fields);
    if (current.activeLeaseId && fields.status !== "occupied") {
      throw new UnitLeaseLockedError();
    }
    transaction.update(unitReference, {
      ...fields,
      updatedAt: timestamp,
      updatedBy: userUid,
    });

    return {
      unitId,
      units: units.map((unit) => (unit.id === unitId ? { ...unit, ...fields } : unit)),
      action: "unit.updated",
    };
  });
}

export async function setPropertyUnitArchived(
  organizationId: string,
  propertyId: string,
  unitId: string,
  userUid: string,
  archived: boolean,
) {
  const unitReference = getPropertyReference(organizationId, propertyId)
    .collection("units")
    .doc(unitId);
  const timestamp = FieldValue.serverTimestamp();

  return mutatePropertyUnits(organizationId, propertyId, userUid, ({ units, transaction }) => {
    const current = units.find((unit) => unit.id === unitId);
    if (!current) throw new UnitRecordNotFoundError();
    if (archived && current.status === "occupied") throw new OccupiedUnitArchiveError();

    transaction.update(unitReference, {
      archived,
      updatedAt: timestamp,
      updatedBy: userUid,
    });

    return {
      unitId,
      units: units.map((unit) => (unit.id === unitId ? { ...unit, archived } : unit)),
      action: archived ? "unit.archived" : "unit.restored",
    };
  });
}
