import { auditEventFields } from "@/lib/audit/area";
import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { propertyDocumentSchema } from "@/lib/properties/schema";
import { unitDocumentSchema } from "@/lib/properties/unit-schema";
import {
  activeRelationshipTypes,
  endRelationship,
  hasActiveRelationship,
  normalizePersonIdentity,
  upsertRelationship,
  type PersonKind,
  type RelationshipType,
  type Relationships,
} from "./relationships";
import { createPersonSearchIndex, normalizePersonEmail } from "./search-index";
import {
  personDocumentSchema,
  type PersonDocument,
  type PersonInput,
} from "./schema";

export class PersonEmailConflictError extends Error {
  constructor() {
    super("An active person of this kind already uses this email.");
    this.name = "PersonEmailConflictError";
  }
}

export class PersonRecordNotFoundError extends Error {
  constructor() {
    super("The person does not exist in the active organization.");
    this.name = "PersonRecordNotFoundError";
  }
}

export class PersonActiveLeaseError extends Error {
  constructor() {
    super("The tenant relationship cannot end while the person has an active lease.");
    this.name = "PersonActiveLeaseError";
  }
}

export class PersonRepresentsEntitiesError extends Error {
  constructor() {
    super("The person is the representative of an active entity.");
    this.name = "PersonRepresentsEntitiesError";
  }
}

export class PersonRepresentativeInvalidError extends Error {
  constructor() {
    super("The representative must be an active individual of the same organization.");
    this.name = "PersonRepresentativeInvalidError";
  }
}

export class ArchivedPersonUpdateError extends Error {
  constructor() {
    super("Archived people must be restored before editing.");
    this.name = "ArchivedPersonUpdateError";
  }
}

export class PersonLinkInvalidError extends Error {
  constructor(readonly target: "property" | "unit") {
    super(`The linked ${target} is missing or archived.`);
    this.name = "PersonLinkInvalidError";
  }
}

export class PersonAccountEmailLockedError extends Error {
  constructor() {
    super("The email of a person with an account cannot change.");
    this.name = "PersonAccountEmailLockedError";
  }
}

export class PersonActiveAccountArchiveError extends Error {
  constructor() {
    super("People with an active account cannot be archived.");
    this.name = "PersonActiveAccountArchiveError";
  }
}

export class PersonOpenLeaseArchiveError extends Error {
  constructor() {
    super("Tenants with a pending or active lease cannot be archived.");
    this.name = "PersonOpenLeaseArchiveError";
  }
}

export type Person = Omit<PersonDocument, "createdAt"> & {
  id: string;
  kind: PersonKind;
  relationships: Relationships;
  relationshipTypes: RelationshipType[];
};

function getOrganizationReference(organizationId: string) {
  return getFirebaseAdminFirestore().collection("organizations").doc(organizationId);
}

function getReservationReferenceByKey(organizationId: string, key: string) {
  const id = createHash("sha256").update(key).digest("hex");
  return getOrganizationReference(organizationId).collection("personEmails").doc(id);
}

/** One reservation per (kind, normalized email) among non-archived people. */
function getEmailReservationReference(
  organizationId: string,
  kind: PersonKind,
  emailKey: string,
) {
  return getReservationReferenceByKey(organizationId, `${kind}:${emailKey}`);
}

/** Pre-2A-2 reservations were keyed by (owner|tenant type, email); they are released on save. */
function getLegacyReservationReference(organizationId: string, person: Person) {
  return person.type
    ? getReservationReferenceByKey(organizationId, `${person.type}:${person.emailKey}`)
    : null;
}

export function parsePerson(organizationId: string, personId: string, data: unknown): Person {
  const parsed = personDocumentSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid person document in the active organization.", {
      organizationId,
      personId,
      issues: parsed.error.issues,
    });
    throw new Error("A person record is incomplete or invalid.");
  }

  // createdAt only dates legacy relationships; it is not part of the Person shape.
  const { createdAt, ...document } = parsed.data;
  const { kind, relationships } = normalizePersonIdentity({ ...document, createdAt });
  return {
    id: personId,
    ...document,
    kind,
    relationships,
    relationshipTypes: activeRelationshipTypes(relationships),
  };
}

export async function getOrganizationPerson(organizationId: string, personId: string) {
  const snapshot = await getOrganizationReference(organizationId)
    .collection("people")
    .doc(personId)
    .get();
  if (!snapshot.exists) return null;

  return parsePerson(organizationId, snapshot.id, snapshot.data());
}

/**
 * Checks inside the transaction that a tenant's property (and unit, when
 * given) exist in the same organization and are not archived. Linking does
 * not change the unit's occupancy; leases will own that.
 */
async function assertTenantLink(
  transaction: Transaction,
  organizationId: string,
  propertyId: string | null,
  unitId: string | null,
) {
  if (!propertyId) return;

  const propertyReference = getOrganizationReference(organizationId)
    .collection("properties")
    .doc(propertyId);
  const [propertySnapshot, unitSnapshot] = await Promise.all([
    transaction.get(propertyReference),
    unitId ? transaction.get(propertyReference.collection("units").doc(unitId)) : null,
  ]);

  const property = propertyDocumentSchema.safeParse(propertySnapshot.data());
  if (!propertySnapshot.exists || !property.success || property.data.archived) {
    throw new PersonLinkInvalidError("property");
  }
  if (unitSnapshot) {
    const unit = unitDocumentSchema.safeParse(unitSnapshot.data());
    if (!unitSnapshot.exists || !unit.success || unit.data.archived) {
      throw new PersonLinkInvalidError("unit");
    }
  }
}

function toPersonFields(input: PersonInput) {
  const entity = input.kind === "entity";
  return {
    kind: input.kind,
    name: input.name,
    email: input.email,
    emailKey: normalizePersonEmail(input.email),
    phone: input.phone,
    contactName: entity ? input.contactName : "",
    entityType: entity ? input.entityType || null : null,
    taxId: entity ? input.taxId || null : null,
    representativeId: entity ? input.representativeId || null : null,
    status: input.status,
  };
}

/** A representative must be an active individual of the same organization, other than the person. */
async function assertRepresentative(
  transaction: Transaction,
  organizationId: string,
  representativeId: string | null,
  personId: string | null,
) {
  if (!representativeId) return;
  if (representativeId === personId) throw new PersonRepresentativeInvalidError();

  const snapshot = await transaction.get(
    getOrganizationReference(organizationId).collection("people").doc(representativeId),
  );
  if (!snapshot.exists) throw new PersonRepresentativeInvalidError();
  const parsedRepresentative = personDocumentSchema.safeParse(snapshot.data());
  if (!parsedRepresentative.success) throw new PersonRepresentativeInvalidError();
  const representative = parsePerson(organizationId, snapshot.id, parsedRepresentative.data);
  if (representative.kind !== "individual" || representative.archived) {
    throw new PersonRepresentativeInvalidError();
  }
}

/** A person who represents active entities cannot become an entity or be archived. */
async function assertNotRepresentative(
  transaction: Transaction,
  organizationReference: ReturnType<typeof getOrganizationReference>,
  personId: string,
) {
  const represented = await transaction.get(
    organizationReference
      .collection("people")
      .where("representativeId", "==", personId)
      .where("archived", "==", false)
      .limit(1),
  );
  if (!represented.empty) throw new PersonRepresentsEntitiesError();
}

/**
 * Applies the owner/tenant checkboxes on top of the current relationships.
 * Other relationships (applicant, guest, owner_prospect) are left alone.
 */
function applyRelationshipInput(current: Relationships, input: PersonInput, now: Timestamp) {
  let next = current;
  next = input.relationships.owner
    ? upsertRelationship(next, "owner", now)
    : endRelationship(next, "owner", now);
  next = input.relationships.tenant
    ? upsertRelationship(next, "tenant", now, {
        propertyId: input.tenantPropertyId || null,
        unitId: input.tenantUnitId || null,
      })
    : endRelationship(next, "tenant", now);

  const added: RelationshipType[] = [];
  const ended: RelationshipType[] = [];
  for (const type of ["owner", "tenant"] as const) {
    const was = hasActiveRelationship(current, type);
    const is = hasActiveRelationship(next, type);
    if (!was && is) added.push(type);
    if (was && !is) ended.push(type);
  }

  return { next, added, ended };
}

/** The tenant property/unit also live at the top level of the document (read by directory and leases). */
function getTenantLink(relationships: Relationships) {
  const tenant = relationships.tenant;
  return tenant?.status === "active"
    ? { propertyId: tenant.propertyId ?? null, unitId: tenant.unitId ?? null }
    : { propertyId: null, unitId: null };
}

export async function createOrganizationPerson(
  organizationId: string,
  userUid: string,
  input: PersonInput,
) {
  const db = getFirebaseAdminFirestore();
  const organizationReference = getOrganizationReference(organizationId);
  const personReference = organizationReference.collection("people").doc();
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();
  const fields = toPersonFields(input);
  const reservationReference = getEmailReservationReference(
    organizationId,
    fields.kind,
    fields.emailKey,
  );
  const { next: relationships, added } = applyRelationshipInput({}, input, Timestamp.now());
  const relationshipTypes = activeRelationshipTypes(relationships);
  const tenantLink = getTenantLink(relationships);

  await db.runTransaction(async (transaction) => {
    const reservation = await transaction.get(reservationReference);
    if (reservation.exists) throw new PersonEmailConflictError();
    await assertTenantLink(transaction, organizationId, tenantLink.propertyId, tenantLink.unitId);
    await assertRepresentative(transaction, organizationId, fields.representativeId, null);

    transaction.create(personReference, {
      ...fields,
      ...tenantLink,
      relationships,
      relationshipTypes,
      ...createPersonSearchIndex({ ...fields, relationshipTypes, archived: false }),
      archived: false,
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userUid,
      updatedBy: userUid,
    });
    transaction.create(reservationReference, {
      personId: personReference.id,
      type: fields.kind,
      createdAt: timestamp,
    });
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: "person.created",
      actorUid: userUid,
      targetId: personReference.id,
      personKind: fields.kind,
      relationshipTypes,
      createdAt: timestamp,
    }));
    for (const relationship of added) {
      transaction.create(organizationReference.collection("auditEvents").doc(), auditEventFields({
        organizationId,
        action: "person.relationship_added",
        actorUid: userUid,
        targetId: personReference.id,
        relationship,
        createdAt: timestamp,
      }));
    }
  });

  return personReference.id;
}

export async function updateOrganizationPerson(
  organizationId: string,
  personId: string,
  userUid: string,
  input: PersonInput,
) {
  const db = getFirebaseAdminFirestore();
  const organizationReference = getOrganizationReference(organizationId);
  const personReference = organizationReference.collection("people").doc(personId);
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();
  const fields = toPersonFields(input);
  const reservationReference = getEmailReservationReference(
    organizationId,
    fields.kind,
    fields.emailKey,
  );

  await db.runTransaction(async (transaction) => {
    const personSnapshot = await transaction.get(personReference);
    if (!personSnapshot.exists) throw new PersonRecordNotFoundError();

    const current = parsePerson(organizationId, personId, personSnapshot.data());
    if (current.archived) throw new ArchivedPersonUpdateError();
    if (current.accountUid && current.emailKey !== fields.emailKey) {
      throw new PersonAccountEmailLockedError();
    }

    const currentReservationReference = getEmailReservationReference(
      organizationId,
      current.kind,
      current.emailKey,
    );
    const legacyReservationReference = getLegacyReservationReference(organizationId, current);
    const [reservation, currentReservation, legacyReservation] = await Promise.all([
      transaction.get(reservationReference),
      currentReservationReference.path === reservationReference.path
        ? null
        : transaction.get(currentReservationReference),
      legacyReservationReference ? transaction.get(legacyReservationReference) : null,
    ]);
    if (reservation.exists && reservation.data()?.personId !== personId) {
      throw new PersonEmailConflictError();
    }
    // A legacy pair (owner + tenant) may share one reservation that belongs to the other
    // person; it is not ours to delete and must not block fixing our own email or kind.
    const ownsCurrentReservation =
      !!currentReservation?.exists && currentReservation.data()?.personId === personId;

    const { next: relationships, added, ended } = applyRelationshipInput(
      current.relationships,
      input,
      Timestamp.now(),
    );
    if (ended.includes("tenant")) {
      const activeLeases = await transaction.get(
        organizationReference
          .collection("leases")
          .where("tenantId", "==", personId)
          .where("status", "==", "active")
          .limit(1),
      );
      if (!activeLeases.empty) throw new PersonActiveLeaseError();
    }
    if (fields.kind === "entity" && current.kind !== "entity") {
      await assertNotRepresentative(transaction, organizationReference, personId);
    }
    const relationshipTypes = activeRelationshipTypes(relationships);
    const tenantLink = getTenantLink(relationships);
    await assertTenantLink(transaction, organizationId, tenantLink.propertyId, tenantLink.unitId);
    await assertRepresentative(transaction, organizationId, fields.representativeId, personId);

    transaction.update(personReference, {
      ...fields,
      ...tenantLink,
      type: FieldValue.delete(),
      relationships,
      relationshipTypes,
      ...createPersonSearchIndex({ ...fields, relationshipTypes, archived: false }),
      updatedAt: timestamp,
      updatedBy: userUid,
    });
    if (!reservation.exists) {
      transaction.create(reservationReference, {
        personId,
        type: fields.kind,
        createdAt: timestamp,
      });
    }
    if (ownsCurrentReservation) transaction.delete(currentReservationReference);
    if (
      legacyReservationReference &&
      legacyReservation?.exists &&
      legacyReservation.data()?.personId === personId
    ) {
      transaction.delete(legacyReservationReference);
    }
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: "person.updated",
      actorUid: userUid,
      targetId: personId,
      personKind: fields.kind,
      relationshipTypes,
      createdAt: timestamp,
    }));
    for (const [action, types] of [
      ["person.relationship_added", added],
      ["person.relationship_ended", ended],
    ] as const) {
      for (const relationship of types) {
        transaction.create(organizationReference.collection("auditEvents").doc(), auditEventFields({
          organizationId,
          action,
          actorUid: userUid,
          targetId: personId,
          relationship,
          createdAt: timestamp,
        }));
      }
    }
  });
}

/**
 * Archiving releases the email reservation so the address can be reused;
 * restoring claims it again and fails if another active record took it.
 */
export async function setOrganizationPersonArchived(
  organizationId: string,
  personId: string,
  userUid: string,
  archived: boolean,
) {
  const db = getFirebaseAdminFirestore();
  const organizationReference = getOrganizationReference(organizationId);
  const personReference = organizationReference.collection("people").doc(personId);
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const personSnapshot = await transaction.get(personReference);
    if (!personSnapshot.exists) throw new PersonRecordNotFoundError();

    const current = parsePerson(organizationId, personId, personSnapshot.data());
    const reservationReference = getEmailReservationReference(
      organizationId,
      current.kind,
      current.emailKey,
    );
    const legacyReservationReference = getLegacyReservationReference(organizationId, current);
    const [reservation, legacyReservation, membership, tenantLeases] = await Promise.all([
      transaction.get(reservationReference),
      archived && legacyReservationReference ? transaction.get(legacyReservationReference) : null,
      archived && current.accountUid
        ? transaction.get(organizationReference.collection("memberships").doc(current.accountUid))
        : null,
      archived
        ? transaction.get(
            organizationReference.collection("leases").where("tenantId", "==", personId).limit(200),
          )
        : null,
    ]);
    if (membership?.exists && membership.data()?.status === "active") {
      throw new PersonActiveAccountArchiveError();
    }
    if (
      tenantLeases?.docs.some((lease) => ["pending", "active"].includes(lease.data().status))
    ) {
      throw new PersonOpenLeaseArchiveError();
    }
    if (archived) await assertNotRepresentative(transaction, organizationReference, personId);
    const reservedByOther =
      reservation.exists && reservation.data()?.personId !== personId;

    if (archived) {
      if (reservation.exists && !reservedByOther) {
        transaction.delete(reservationReference);
      }
      if (
        legacyReservationReference &&
        legacyReservation?.exists &&
        legacyReservation.data()?.personId === personId
      ) {
        transaction.delete(legacyReservationReference);
      }
    } else {
      if (reservedByOther) throw new PersonEmailConflictError();
      if (!reservation.exists) {
        transaction.create(reservationReference, {
          personId,
          type: current.kind,
          createdAt: timestamp,
        });
      }
    }

    transaction.update(personReference, {
      archived,
      kind: current.kind,
      relationships: current.relationships,
      relationshipTypes: current.relationshipTypes,
      ...createPersonSearchIndex({ ...current, archived }),
      updatedAt: timestamp,
      updatedBy: userUid,
    });
    transaction.create(auditReference, auditEventFields({
      organizationId,
      action: archived ? "person.archived" : "person.restored",
      actorUid: userUid,
      targetId: personId,
      personKind: current.kind,
      createdAt: timestamp,
    }));
  });
}
