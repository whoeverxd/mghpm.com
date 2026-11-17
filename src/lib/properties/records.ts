import { auditEventFields } from "@/lib/audit/area";
import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getPropertyDocumentFields } from "./form-values";
import { createPropertySearchIndex } from "./search-index";
import { buildGeneratedUnitFields, type UnitGenerationInput } from "./unit-generation";
import {
  propertyDocumentSchema,
  type PropertyInput,
} from "./schema";

export class PropertyCodeConflictError extends Error {
  constructor() {
    super("A property with this code already exists in the organization.");
    this.name = "PropertyCodeConflictError";
  }
}

export class PropertyRecordNotFoundError extends Error {
  constructor() {
    super("The property record does not exist in the active organization.");
    this.name = "PropertyRecordNotFoundError";
  }
}

function getPropertyCodeReservationId(code: string) {
  return createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}

export async function getOrganizationProperty(
  organizationId: string,
  propertyId: string,
) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties")
    .doc(propertyId)
    .get();

  if (!snapshot.exists) return null;

  const parsed = propertyDocumentSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    console.error("Invalid property document in the active organization.", {
      organizationId,
      propertyId,
      issues: parsed.error.issues,
    });
    throw new Error("A property record is incomplete or invalid.");
  }

  return { id: snapshot.id, ...parsed.data };
}

/**
 * Creates the property and, when `unitGeneration` is given, its first batch of
 * available units in the same transaction, so the counters start consistent.
 */
export async function createOrganizationProperty(
  organizationId: string,
  userUid: string,
  input: PropertyInput,
  unitGeneration: UnitGenerationInput | null = null,
) {
  const db = getFirebaseAdminFirestore();
  const organizationReference = db.collection("organizations").doc(organizationId);
  const properties = organizationReference.collection("properties");
  const propertyReference = properties.doc();
  const reservationReference = organizationReference
    .collection("propertyCodes")
    .doc(getPropertyCodeReservationId(input.code));
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();
  const generatedUnits = unitGeneration ? buildGeneratedUnitFields(unitGeneration) : [];
  const index = createPropertySearchIndex({
    name: input.name,
    code: input.code,
    type: input.type,
    address: input.address,
    city: input.city,
    state: input.state,
    status: input.status,
    occupancy: "vacant",
    archived: false,
  });

  await db.runTransaction(async (transaction) => {
    const [duplicates, reservation] = await Promise.all([
      transaction.get(properties.where("code", "==", input.code).limit(1)),
      transaction.get(reservationReference),
    ]);
    if (!duplicates.empty || reservation.exists) {
      throw new PropertyCodeConflictError();
    }

    transaction.create(propertyReference, {
      ...getPropertyDocumentFields(input),
      organizationId,
      archived: false,
      occupancyStatus: "vacant",
      unitCount: generatedUnits.length,
      occupiedUnitCount: 0,
      ...index,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userUid,
      updatedBy: userUid,
    });
    for (const fields of generatedUnits) {
      transaction.create(propertyReference.collection("units").doc(), {
        ...fields,
        archived: false,
        organizationId,
        propertyId: propertyReference.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userUid,
        updatedBy: userUid,
      });
    }
    transaction.create(reservationReference, {
      propertyId: propertyReference.id,
      code: input.code,
      createdAt: timestamp,
    });
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: "property.created",
      actorUid: userUid,
      targetId: propertyReference.id,
      unitCount: generatedUnits.length,
      createdAt: timestamp,
    }));
  });

  return propertyReference.id;
}

export async function updateOrganizationProperty(
  organizationId: string,
  propertyId: string,
  userUid: string,
  input: PropertyInput,
) {
  const db = getFirebaseAdminFirestore();
  const organizationReference = db.collection("organizations").doc(organizationId);
  const properties = organizationReference.collection("properties");
  const propertyReference = properties.doc(propertyId);
  const reservationReference = organizationReference
    .collection("propertyCodes")
    .doc(getPropertyCodeReservationId(input.code));
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const [propertySnapshot, duplicates, reservation] = await Promise.all([
      transaction.get(propertyReference),
      transaction.get(properties.where("code", "==", input.code).limit(2)),
      transaction.get(reservationReference),
    ]);
    if (!propertySnapshot.exists) throw new PropertyRecordNotFoundError();

    const parsedCurrent = propertyDocumentSchema.safeParse(propertySnapshot.data());
    if (!parsedCurrent.success) {
      console.error("Invalid property document during update.", {
        organizationId,
        propertyId,
        issues: parsedCurrent.error.issues,
      });
      throw new Error("A property record is incomplete or invalid.");
    }

    if (duplicates.docs.some((document) => document.id !== propertyId)) {
      throw new PropertyCodeConflictError();
    }
    if (
      reservation.exists &&
      reservation.data()?.propertyId !== propertyId
    ) {
      throw new PropertyCodeConflictError();
    }

    const previousReservationReference = organizationReference
      .collection("propertyCodes")
      .doc(getPropertyCodeReservationId(parsedCurrent.data.code));
    const previousReservation =
      previousReservationReference.path === reservationReference.path
        ? reservation
        : await transaction.get(previousReservationReference);
    if (
      previousReservation.exists &&
      previousReservation.data()?.propertyId !== propertyId
    ) {
      console.error("Property code reservation points to a different property.", {
        organizationId,
        propertyId,
      });
      throw new Error("A property code reservation is inconsistent.");
    }

    const index = createPropertySearchIndex({
      name: input.name,
      code: input.code,
      type: input.type,
      address: input.address,
      city: input.city,
      state: input.state,
      status: input.status,
      occupancy: parsedCurrent.data.occupancyStatus,
      archived: parsedCurrent.data.archived,
    });

    transaction.update(propertyReference, {
      ...getPropertyDocumentFields(input),
      ...index,
      updatedAt: timestamp,
      updatedBy: userUid,
    });
    if (!reservation.exists) {
      transaction.create(reservationReference, {
        propertyId,
        code: input.code,
        createdAt: timestamp,
      });
    }
    if (
      previousReservationReference.path !== reservationReference.path &&
      previousReservation.exists
    ) {
      transaction.delete(previousReservationReference);
    }
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: "property.updated",
      actorUid: userUid,
      targetId: propertyId,
      createdAt: timestamp,
    }));
  });
}
