import { auditEventFields } from "@/lib/audit/area";
import "server-only";

import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { parsePerson, type Person } from "@/lib/people/records";
import {
  activeRelationshipTypes,
  endRelationship,
  hasActiveRelationship,
  upsertRelationship,
  type Relationships,
} from "@/lib/people/relationships";
import { createPersonSearchIndex } from "@/lib/people/search-index";
import { propertyDocumentSchema } from "@/lib/properties/schema";
import { parseMoneyToMinorUnits, unitDocumentSchema } from "@/lib/properties/unit-schema";
import {
  readPropertyUnitsInTransaction,
  writePropertyUnitProjection,
} from "@/lib/properties/units";
import {
  leaseDocumentSchema,
  type LeaseDocument,
  type LeaseInput,
  type LeaseStatus,
  type LeaseStatusAction,
} from "./schema";
import { createLeaseSearchIndex } from "./search-index";
import { getTodayInTimeZone } from "./terms";

export class LeaseRecordNotFoundError extends Error {
  constructor() {
    super("The lease does not exist in the active organization.");
    this.name = "LeaseRecordNotFoundError";
  }
}

export class LeaseLinkInvalidError extends Error {
  constructor(readonly target: "property" | "unit" | "tenant" | "renewal") {
    super(`The lease ${target} is missing, archived or not eligible.`);
    this.name = "LeaseLinkInvalidError";
  }
}

export class LeaseStatusTransitionError extends Error {
  constructor(readonly from: LeaseStatus) {
    super(`The requested change is not allowed for a ${from} lease.`);
    this.name = "LeaseStatusTransitionError";
  }
}

export class LeaseOverlapError extends Error {
  constructor(readonly conflictingCode: string) {
    super("Another pending or active lease overlaps these dates on the unit.");
    this.name = "LeaseOverlapError";
  }
}

export class LeaseUnitUnavailableError extends Error {
  constructor(readonly reason: "other-lease" | "manual-occupied") {
    super("The unit cannot be occupied by this lease.");
    this.name = "LeaseUnitUnavailableError";
  }
}

export class LeaseDateRuleError extends Error {
  constructor(readonly rule: "termination-future" | "not-ended") {
    super("The lease dates do not allow this change.");
    this.name = "LeaseDateRuleError";
  }
}

export type Lease = LeaseDocument & { id: string };

/** Statuses that hold the unit's dates and block overlapping leases. */
const blockingStatuses: ReadonlySet<LeaseStatus> = new Set(["pending", "active"]);
const UNIT_LEASE_SCAN_LIMIT = 200;

function getOrganizationReference(organizationId: string) {
  return getFirebaseAdminFirestore().collection("organizations").doc(organizationId);
}

function getLeasesCollection(organizationId: string) {
  return getOrganizationReference(organizationId).collection("leases");
}

export function parseLease(organizationId: string, leaseId: string, data: unknown): Lease {
  const parsed = leaseDocumentSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid lease document in the active organization.", {
      organizationId,
      leaseId,
      issues: parsed.error.issues,
    });
    throw new Error("A lease record is incomplete or invalid.");
  }

  return { id: leaseId, ...parsed.data };
}

export async function getOrganizationLease(organizationId: string, leaseId: string) {
  const snapshot = await getLeasesCollection(organizationId).doc(leaseId).get();
  if (!snapshot.exists) return null;

  return parseLease(organizationId, snapshot.id, snapshot.data());
}

function toMinor(value: string) {
  return parseMoneyToMinorUnits(value) ?? 0;
}

function toLeaseFields(input: LeaseInput) {
  return {
    source: input.source,
    renewOfLeaseId: input.source === "renewal" ? input.renewOfLeaseId || null : null,
    propertyId: input.propertyId,
    unitId: input.unitId,
    tenantId: input.tenantId,
    parties: input.parties,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    possessionDate: input.possessionDate || null,
    moveInDate: input.moveInDate || null,
    renewalType: input.renewalType,
    noticeDays: input.noticeDays,
    currency: input.currency,
    rentMinor: toMinor(input.rent),
    dueDay: input.dueDay,
    graceDays: input.graceDays,
    lateFeeRule: input.lateFeeRule,
    lateFeeFlatMinor: input.lateFeeRule === "flat" ? toMinor(input.lateFeeFlat) : 0,
    firstRentDueDate: input.firstRentDueDate || input.startDate || null,
    prorateFirstPeriod: input.prorateFirstPeriod,
    securityDepositMinor: toMinor(input.securityDeposit),
    additionalDepositMinor: toMinor(input.additionalDeposit),
    petDepositMinor: toMinor(input.petDeposit),
    advanceRentMinor: toMinor(input.advanceRent),
    otherChargeLabel: toMinor(input.otherCharge) > 0 ? input.otherChargeLabel : "",
    otherChargeMinor: toMinor(input.otherCharge),
    collectFirstMonthRent: input.collectFirstMonthRent,
    utilities: input.utilities,
  };
}

type LeaseFields = ReturnType<typeof toLeaseFields>;

function getLeaseIndex(
  lease: Pick<Lease, "code" | "currency" | "tenantName" | "propertyName" | "unitLabel">,
  status: LeaseStatus,
) {
  return createLeaseSearchIndex({ ...lease, status });
}

function datesOverlap(
  left: { startDate: string | null; endDate: string | null },
  right: { startDate: string | null; endDate: string | null },
) {
  if (!left.startDate || !left.endDate || !right.startDate || !right.endDate) return false;
  return left.startDate <= right.endDate && right.startDate <= left.endDate;
}

/**
 * Reads, inside the transaction, everything a lease points to and checks it
 * belongs to the organization: property and unit not archived, primary
 * tenant is a non-archived tenant record, and the renewed lease (if any) is
 * active on the same unit. Also returns the unit's other leases for the
 * overlap check. All reads happen before any write.
 */
async function readLeaseLinks(
  transaction: Transaction,
  organizationId: string,
  fields: LeaseFields,
  leaseId: string | null,
) {
  const organizationReference = getOrganizationReference(organizationId);
  const propertyReference = organizationReference.collection("properties").doc(fields.propertyId);
  const [propertySnapshot, unitSnapshot, personSnapshot, renewedSnapshot, unitLeaseSnapshots] =
    await Promise.all([
      transaction.get(propertyReference),
      transaction.get(propertyReference.collection("units").doc(fields.unitId)),
      transaction.get(organizationReference.collection("people").doc(fields.tenantId)),
      fields.renewOfLeaseId
        ? transaction.get(getLeasesCollection(organizationId).doc(fields.renewOfLeaseId))
        : null,
      transaction.get(
        getLeasesCollection(organizationId)
          .where("unitId", "==", fields.unitId)
          .limit(UNIT_LEASE_SCAN_LIMIT),
      ),
    ]);

  const property = propertyDocumentSchema.safeParse(propertySnapshot.data());
  if (!propertySnapshot.exists || !property.success || property.data.archived) {
    throw new LeaseLinkInvalidError("property");
  }
  const unit = unitDocumentSchema.safeParse(unitSnapshot.data());
  if (!unitSnapshot.exists || !unit.success || unit.data.archived) {
    throw new LeaseLinkInvalidError("unit");
  }
  if (!personSnapshot.exists) throw new LeaseLinkInvalidError("tenant");
  const tenant = parsePerson(organizationId, personSnapshot.id, personSnapshot.data());
  // Any non-archived individual may be a tenant; activating the lease creates the relationship.
  if (tenant.kind !== "individual" || tenant.archived) throw new LeaseLinkInvalidError("tenant");

  if (renewedSnapshot) {
    if (!renewedSnapshot.exists) throw new LeaseLinkInvalidError("renewal");
    const renewed = parseLease(organizationId, renewedSnapshot.id, renewedSnapshot.data());
    if (
      renewed.id === leaseId ||
      renewed.status !== "active" ||
      renewed.propertyId !== fields.propertyId ||
      renewed.unitId !== fields.unitId ||
      // A renewal continues the same tenancy; another tenant needs a new lease, otherwise
      // the previous tenant would keep an active relationship (and portal access).
      renewed.tenantId !== fields.tenantId
    ) {
      throw new LeaseLinkInvalidError("renewal");
    }
  }

  return {
    propertyName: property.data.name,
    unitLabel: unit.data.label,
    tenant,
    unitLeases: unitLeaseSnapshots.docs.map((document) =>
      parseLease(organizationId, document.id, document.data()),
    ),
  };
}

function assertNoOverlap(
  unitLeases: Lease[],
  leaseId: string | null,
  dates: { startDate: string | null; endDate: string | null },
) {
  const conflict = unitLeases.find(
    (other) =>
      other.id !== leaseId && blockingStatuses.has(other.status) && datesOverlap(other, dates),
  );
  if (conflict) throw new LeaseOverlapError(conflict.code);
}

function writeAudit(
  transaction: Transaction,
  organizationId: string,
  userUid: string,
  action: string,
  leaseId: string,
  extra: Record<string, unknown> = {},
) {
  transaction.create(getOrganizationReference(organizationId).collection("auditEvents").doc(), auditEventFields({
    organizationId,
    action,
    actorUid: userUid,
    targetId: leaseId,
    createdAt: FieldValue.serverTimestamp(),
    ...extra,
  }));
}

/**
 * Creates a lease as a draft or as pending activation (Create Lease). The
 * code comes from a per-organization counter updated in the same
 * transaction, so codes are sequential and never reused.
 */
export async function createOrganizationLease(
  organizationId: string,
  userUid: string,
  input: LeaseInput,
) {
  const db = getFirebaseAdminFirestore();
  const leaseReference = getLeasesCollection(organizationId).doc();
  const counterReference = getOrganizationReference(organizationId)
    .collection("counters")
    .doc("leases");
  const timestamp = FieldValue.serverTimestamp();
  const fields = toLeaseFields(input);
  const status: LeaseStatus = input.intent === "pending" ? "pending" : "draft";

  await db.runTransaction(async (transaction) => {
    const [links, counter] = await Promise.all([
      readLeaseLinks(transaction, organizationId, fields, null),
      transaction.get(counterReference),
    ]);
    if (status === "pending") assertNoOverlap(links.unitLeases, null, fields);

    const sequence = Number(counter.data()?.next ?? 1);
    const code = `L-${new Date().getUTCFullYear()}-${String(sequence).padStart(4, "0")}`;
    const names = {
      propertyName: links.propertyName,
      unitLabel: links.unitLabel,
      tenantName: links.tenant.name,
    };

    transaction.set(counterReference, { next: sequence + 1 }, { merge: true });
    transaction.create(leaseReference, {
      ...fields,
      ...names,
      code,
      status,
      closedOn: null,
      closeReason: null,
      ...getLeaseIndex({ ...names, code, currency: fields.currency }, status),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userUid,
      updatedBy: userUid,
    });
    writeAudit(transaction, organizationId, userUid, "lease.created", leaseReference.id, {
      leaseStatus: status,
    });
  });

  return leaseReference.id;
}

/**
 * Drafts and pending leases can be edited; a draft can be promoted to
 * pending, but pending never goes back to draft. Active and closed leases
 * are not edited here, so contracted terms never change silently.
 */
export async function updateOrganizationLease(
  organizationId: string,
  leaseId: string,
  userUid: string,
  input: LeaseInput,
) {
  const db = getFirebaseAdminFirestore();
  const leaseReference = getLeasesCollection(organizationId).doc(leaseId);
  const fields = toLeaseFields(input);

  await db.runTransaction(async (transaction) => {
    const leaseSnapshot = await transaction.get(leaseReference);
    if (!leaseSnapshot.exists) throw new LeaseRecordNotFoundError();
    const current = parseLease(organizationId, leaseId, leaseSnapshot.data());
    if (current.status !== "draft" && current.status !== "pending") {
      throw new LeaseStatusTransitionError(current.status);
    }
    if (current.status === "pending" && input.intent === "draft") {
      throw new LeaseStatusTransitionError(current.status);
    }
    const links = await readLeaseLinks(transaction, organizationId, fields, leaseId);

    const status: LeaseStatus = input.intent === "pending" ? "pending" : "draft";
    if (status === "pending") assertNoOverlap(links.unitLeases, leaseId, fields);
    const names = {
      propertyName: links.propertyName,
      unitLabel: links.unitLabel,
      tenantName: links.tenant.name,
    };

    transaction.update(leaseReference, {
      ...fields,
      ...names,
      status,
      ...getLeaseIndex({ ...names, code: current.code, currency: fields.currency }, status),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    writeAudit(
      transaction,
      organizationId,
      userUid,
      current.status === "draft" && status === "pending" ? "lease.submitted" : "lease.updated",
      leaseId,
    );
  });
}

/**
 * Writes the tenant's top-level link, status and relationships together, keeps
 * the directory index in sync and audits a tenant relationship that started or
 * ended. The caller decides the next relationships.
 */
function writeTenantProjection(
  transaction: Transaction,
  organizationId: string,
  tenant: Person,
  changes: Pick<Person, "status" | "propertyId" | "unitId"> & { relationships: Relationships },
  userUid: string,
) {
  const { relationships, ...link } = changes;
  const relationshipTypes = activeRelationshipTypes(relationships);
  const organizationReference = getOrganizationReference(organizationId);
  transaction.update(organizationReference.collection("people").doc(tenant.id), {
    ...link,
    kind: tenant.kind,
    relationships,
    relationshipTypes,
    ...createPersonSearchIndex({ ...tenant, status: link.status, relationshipTypes }),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userUid,
  });

  const was = hasActiveRelationship(tenant.relationships, "tenant");
  const is = hasActiveRelationship(relationships, "tenant");
  if (was !== is) {
    transaction.create(organizationReference.collection("auditEvents").doc(), auditEventFields({
      organizationId,
      action: is ? "person.relationship_added" : "person.relationship_ended",
      actorUid: userUid,
      targetId: tenant.id,
      relationship: "tenant",
      createdAt: FieldValue.serverTimestamp(),
    }));
  }
}

/**
 * Activation makes the lease the source of occupancy: the unit becomes
 * occupied (and locked while the lease is active), the property projection
 * is refreshed and the primary tenant is marked active on that unit. A
 * renewal takes over the unit from the lease it renews, which expires.
 */
async function activateLease(
  transaction: Transaction,
  organizationId: string,
  current: Lease,
  userUid: string,
) {
  const organizationReference = getOrganizationReference(organizationId);
  const [propertyUnits, personSnapshot, renewedSnapshot, unitLeaseSnapshots] = await Promise.all([
    readPropertyUnitsInTransaction(transaction, organizationId, current.propertyId),
    transaction.get(organizationReference.collection("people").doc(current.tenantId)),
    current.renewOfLeaseId
      ? transaction.get(getLeasesCollection(organizationId).doc(current.renewOfLeaseId))
      : null,
    transaction.get(
      getLeasesCollection(organizationId)
        .where("unitId", "==", current.unitId)
        .limit(UNIT_LEASE_SCAN_LIMIT),
    ),
  ]);

  if (propertyUnits.property.archived) throw new LeaseLinkInvalidError("property");
  const unit = propertyUnits.units.find((candidate) => candidate.id === current.unitId);
  if (!unit || unit.archived) throw new LeaseLinkInvalidError("unit");
  if (!personSnapshot.exists) throw new LeaseLinkInvalidError("tenant");
  const tenant = parsePerson(organizationId, personSnapshot.id, personSnapshot.data());
  // Any non-archived individual may be a tenant; activating the lease creates the relationship.
  if (tenant.kind !== "individual" || tenant.archived) throw new LeaseLinkInvalidError("tenant");
  assertNoOverlap(
    unitLeaseSnapshots.docs.map((document) =>
      parseLease(organizationId, document.id, document.data()),
    ),
    current.id,
    current,
  );

  const renewed =
    renewedSnapshot?.exists
      ? parseLease(organizationId, renewedSnapshot.id, renewedSnapshot.data())
      : null;
  const takesOverRenewal =
    renewed?.status === "active" && unit.activeLeaseId === renewed.id;
  if (unit.activeLeaseId && !takesOverRenewal) {
    throw new LeaseUnitUnavailableError("other-lease");
  }
  if (!unit.activeLeaseId && unit.status === "occupied") {
    throw new LeaseUnitUnavailableError("manual-occupied");
  }

  const unitReference = propertyUnits.propertyReference.collection("units").doc(unit.id);
  transaction.update(unitReference, {
    status: "occupied",
    activeLeaseId: current.id,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userUid,
  });
  writePropertyUnitProjection(
    transaction,
    propertyUnits,
    propertyUnits.units.map((candidate) =>
      candidate.id === unit.id
        ? { ...candidate, status: "occupied", activeLeaseId: current.id }
        : candidate,
    ),
    userUid,
  );
  writeTenantProjection(
    transaction,
    organizationId,
    tenant,
    {
      status: "active",
      propertyId: current.propertyId,
      unitId: current.unitId,
      relationships: upsertRelationship(tenant.relationships, "tenant", Timestamp.now(), {
        propertyId: current.propertyId,
        unitId: current.unitId,
      }),
    },
    userUid,
  );
  transaction.update(getLeasesCollection(organizationId).doc(current.id), {
    status: "active",
    ...getLeaseIndex(current, "active"),
    activatedAt: FieldValue.serverTimestamp(),
    activatedBy: userUid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userUid,
  });
  writeAudit(transaction, organizationId, userUid, "lease.activated", current.id, {
    propertyId: current.propertyId,
    unitId: current.unitId,
  });

  if (renewed && takesOverRenewal) {
    transaction.update(getLeasesCollection(organizationId).doc(renewed.id), {
      status: "expired",
      closedOn: renewed.endDate,
      closeReason: `Renovado por ${current.code}`,
      ...getLeaseIndex(renewed, "expired"),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    writeAudit(transaction, organizationId, userUid, "lease.expired", renewed.id, {
      renewedBy: current.id,
    });
  }
}

/**
 * Terminating or expiring an active lease releases the unit (when this lease
 * holds it) and moves the tenant out unless another active lease keeps them.
 */
async function closeActiveLease(
  transaction: Transaction,
  organizationId: string,
  current: Lease,
  userUid: string,
  closing: { status: "terminated" | "expired"; closedOn: string; reason: string | null },
) {
  const organizationReference = getOrganizationReference(organizationId);
  const [propertyUnits, personSnapshot, tenantLeaseSnapshots] = await Promise.all([
    readPropertyUnitsInTransaction(transaction, organizationId, current.propertyId),
    transaction.get(organizationReference.collection("people").doc(current.tenantId)),
    transaction.get(
      getLeasesCollection(organizationId)
        .where("tenantId", "==", current.tenantId)
        .limit(UNIT_LEASE_SCAN_LIMIT),
    ),
  ]);

  const unit = propertyUnits.units.find((candidate) => candidate.id === current.unitId);
  if (unit && unit.activeLeaseId === current.id) {
    transaction.update(propertyUnits.propertyReference.collection("units").doc(unit.id), {
      status: "available",
      activeLeaseId: null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    writePropertyUnitProjection(
      transaction,
      propertyUnits,
      propertyUnits.units.map((candidate) =>
        candidate.id === unit.id
          ? { ...candidate, status: "available", activeLeaseId: null }
          : candidate,
      ),
      userUid,
    );
  }

  if (personSnapshot.exists) {
    const tenant = parsePerson(organizationId, personSnapshot.id, personSnapshot.data());
    const otherActiveLease = tenantLeaseSnapshots.docs.some(
      (document) => document.id !== current.id && document.data().status === "active",
    );
    const linkedToThisUnit = tenant.unitId === current.unitId;
    if (!otherActiveLease || linkedToThisUnit) {
      const propertyId = linkedToThisUnit ? null : tenant.propertyId;
      const unitId = linkedToThisUnit ? null : tenant.unitId;
      writeTenantProjection(
        transaction,
        organizationId,
        tenant,
        {
          status: otherActiveLease ? tenant.status : "inactive",
          propertyId,
          unitId,
          // The tenant relationship ends only when no other active lease keeps it.
          relationships: otherActiveLease
            ? upsertRelationship(tenant.relationships, "tenant", Timestamp.now(), {
                propertyId,
                unitId,
              })
            : endRelationship(tenant.relationships, "tenant", Timestamp.now()),
        },
        userUid,
      );
    }
  }

  transaction.update(getLeasesCollection(organizationId).doc(current.id), {
    status: closing.status,
    closedOn: closing.closedOn,
    closeReason: closing.reason,
    ...getLeaseIndex(current, closing.status),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userUid,
  });
  writeAudit(
    transaction,
    organizationId,
    userUid,
    closing.status === "terminated" ? "lease.terminated" : "lease.expired",
    current.id,
    closing.reason ? { reason: closing.reason, effectiveDate: closing.closedOn } : {},
  );
}

export async function changeOrganizationLeaseStatus(
  organizationId: string,
  leaseId: string,
  userUid: string,
  timeZone: string,
  change: LeaseStatusAction,
) {
  const db = getFirebaseAdminFirestore();
  const leaseReference = getLeasesCollection(organizationId).doc(leaseId);
  const today = getTodayInTimeZone(timeZone);

  await db.runTransaction(async (transaction) => {
    const leaseSnapshot = await transaction.get(leaseReference);
    if (!leaseSnapshot.exists) throw new LeaseRecordNotFoundError();
    const current = parseLease(organizationId, leaseId, leaseSnapshot.data());

    switch (change.action) {
      case "activate":
        if (current.status !== "pending") throw new LeaseStatusTransitionError(current.status);
        return activateLease(transaction, organizationId, current, userUid);
      case "terminate":
        if (current.status !== "active") throw new LeaseStatusTransitionError(current.status);
        if (change.effectiveDate > today) throw new LeaseDateRuleError("termination-future");
        return closeActiveLease(transaction, organizationId, current, userUid, {
          status: "terminated",
          closedOn: change.effectiveDate,
          reason: change.reason,
        });
      case "expire":
        if (current.status !== "active") throw new LeaseStatusTransitionError(current.status);
        if (!current.endDate || current.endDate >= today) {
          throw new LeaseDateRuleError("not-ended");
        }
        return closeActiveLease(transaction, organizationId, current, userUid, {
          status: "expired",
          closedOn: current.endDate,
          reason: null,
        });
      case "cancel":
        if (current.status !== "draft" && current.status !== "pending") {
          throw new LeaseStatusTransitionError(current.status);
        }
        transaction.update(leaseReference, {
          status: "cancelled",
          closedOn: today,
          closeReason: change.reason,
          ...getLeaseIndex(current, "cancelled"),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: userUid,
        });
        writeAudit(transaction, organizationId, userUid, "lease.cancelled", leaseId, {
          reason: change.reason,
        });
    }
  });
}
