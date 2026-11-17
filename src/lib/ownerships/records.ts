import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type Transaction,
} from "firebase-admin/firestore";
import { can } from "@/lib/access/permissions";
import type { OrganizationRole } from "@/lib/auth/organization-schema";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { parsePerson, PersonRecordNotFoundError } from "@/lib/people/records";
import {
  activeRelationshipTypes,
  hasActiveRelationship,
  upsertRelationship,
} from "@/lib/people/relationships";
import { createPersonSearchIndex } from "@/lib/people/search-index";
import { PropertyRecordNotFoundError } from "@/lib/properties/records";
import { propertyDocumentSchema } from "@/lib/properties/schema";
import { availablePct, canTransition, ownershipChecks, roundPct, type OwnershipStatus } from "./rules";
import {
  ownershipDocumentSchema,
  type OwnershipDocument,
  type OwnershipInput,
  type OwnershipUpdateInput,
} from "./schema";
import { auditEventFields } from "@/lib/audit/area";

export class OwnershipConflictError extends Error {
  constructor(
    readonly reason: "duplicate" | "over_100",
    readonly available: number = 0,
  ) {
    super(
      reason === "duplicate"
        ? "The person already has an active ownership on this property."
        : "The active ownerships would exceed 100%.",
    );
    this.name = "OwnershipConflictError";
  }
}

export class OwnershipPropertyArchivedError extends Error {
  constructor() {
    super("Owners cannot be added to an archived property.");
    this.name = "OwnershipPropertyArchivedError";
  }
}

export class OwnershipNotFoundError extends Error {
  constructor() {
    super("The ownership does not exist in the active organization.");
    this.name = "OwnershipNotFoundError";
  }
}

export class OwnershipEndedError extends Error {
  constructor() {
    super("An ended ownership cannot be changed.");
    this.name = "OwnershipEndedError";
  }
}

export class OwnershipTransitionError extends Error {
  constructor(
    readonly from: OwnershipStatus,
    readonly to: OwnershipStatus,
  ) {
    super(`An ownership cannot move from ${from} to ${to}.`);
    this.name = "OwnershipTransitionError";
  }
}

export class OwnershipReviewForbiddenError extends Error {
  constructor(readonly reason: "role" | "own_record") {
    super("The actor cannot review this ownership.");
    this.name = "OwnershipReviewForbiddenError";
  }
}

export type Ownership = OwnershipDocument & { id: string };

function getOrganizationReference(organizationId: string) {
  return getFirebaseAdminFirestore().collection("organizations").doc(organizationId);
}

function getOwnershipsCollection(organizationId: string) {
  return getOrganizationReference(organizationId).collection("ownerships");
}

export function parseOwnership(organizationId: string, id: string, data: unknown): Ownership {
  const parsed = ownershipDocumentSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid ownership document in the active organization.", {
      organizationId,
      ownershipId: id,
      issues: parsed.error.issues,
    });
    throw new Error("An ownership record is incomplete or invalid.");
  }
  return { id, ...parsed.data };
}

const emptyChecks = {
  deedOnFile: false,
  recordMatches: false,
  ownerIdentity: false,
  entityGoodStanding: false,
  coOwnerAuthorization: false,
  managementAgreement: false,
};

const titleFields = [
  "pct",
  "titleOwner",
  "titleNumber",
  "registryNumber",
  "cadastralNumber",
  "registryAddress",
] as const;

/** Reads the property and its active ownerships (all reads before any write). */
async function readPropertyOwnerships(
  transaction: Transaction,
  organizationId: string,
  propertyId: string,
) {
  const propertyReference = getOrganizationReference(organizationId)
    .collection("properties")
    .doc(propertyId);
  const [propertySnapshot, activeSnapshot] = await Promise.all([
    transaction.get(propertyReference),
    transaction.get(
      getOwnershipsCollection(organizationId)
        .where("propertyId", "==", propertyId)
        .where("active", "==", true),
    ),
  ]);
  const property = propertyDocumentSchema.safeParse(propertySnapshot.data());
  if (!propertySnapshot.exists || !property.success) throw new PropertyRecordNotFoundError();

  return {
    propertyReference,
    propertyArchived: property.data.archived,
    active: activeSnapshot.docs.map((document) =>
      parseOwnership(organizationId, document.id, document.data()),
    ),
  };
}

function writePropertyProjection(
  transaction: Transaction,
  propertyReference: DocumentReference,
  active: { personId: string; pct: number }[],
  userUid: string,
) {
  const totalHundredths = active.reduce((sum, item) => sum + Math.round(item.pct * 100), 0);
  transaction.update(propertyReference, {
    ownerPersonIds: [...new Set(active.map((item) => item.personId))],
    ownershipTotalPct: totalHundredths / 100,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userUid,
  });
}

function writeAudit(
  transaction: Transaction,
  organizationId: string,
  userUid: string,
  action: string,
  targetId: string,
  extra: Record<string, unknown> = {},
) {
  transaction.create(getOrganizationReference(organizationId).collection("auditEvents").doc(), auditEventFields({
    organizationId,
    action,
    actorUid: userUid,
    targetId,
    createdAt: FieldValue.serverTimestamp(),
    ...extra,
  }));
}

export async function createOwnership(
  organizationId: string,
  userUid: string,
  input: OwnershipInput,
) {
  const db = getFirebaseAdminFirestore();
  const ownershipReference = getOwnershipsCollection(organizationId).doc();
  const personReference = getOrganizationReference(organizationId)
    .collection("people")
    .doc(input.personId);

  await db.runTransaction(async (transaction) => {
    const [personSnapshot, links] = await Promise.all([
      transaction.get(personReference),
      readPropertyOwnerships(transaction, organizationId, input.propertyId),
    ]);
    if (links.propertyArchived) throw new OwnershipPropertyArchivedError();
    if (!personSnapshot.exists) throw new PersonRecordNotFoundError();
    const person = parsePerson(organizationId, personSnapshot.id, personSnapshot.data());
    if (person.archived) throw new PersonRecordNotFoundError();

    if (links.active.some((item) => item.personId === input.personId)) {
      throw new OwnershipConflictError("duplicate");
    }
    const available = availablePct(links.active.map((item) => item.pct));
    if (input.pct > available) throw new OwnershipConflictError("over_100", available);

    const timestamp = FieldValue.serverTimestamp();
    transaction.create(ownershipReference, {
      personId: input.personId,
      propertyId: input.propertyId,
      pct: input.pct,
      startDate: input.startDate,
      titleOwner: input.titleOwner,
      titleNumber: input.titleNumber,
      registryNumber: input.registryNumber,
      cadastralNumber: input.cadastralNumber,
      registryAddress: input.registryAddress,
      status: "not_started",
      checks: emptyChecks,
      reviewerUid: null,
      reviewedAt: null,
      rejectionReason: null,
      active: true,
      endedAt: null,
      organizationId,
      createdAt: timestamp,
      createdBy: userUid,
      updatedAt: timestamp,
      updatedBy: userUid,
    });
    writePropertyProjection(
      transaction,
      links.propertyReference,
      [...links.active, { personId: input.personId, pct: input.pct }],
      userUid,
    );

    const relationships = upsertRelationship(person.relationships, "owner", Timestamp.now());
    const relationshipTypes = activeRelationshipTypes(relationships);
    transaction.update(personReference, {
      kind: person.kind,
      relationships,
      relationshipTypes,
      ...createPersonSearchIndex({ ...person, relationshipTypes }),
      updatedAt: timestamp,
      updatedBy: userUid,
    });
    if (!hasActiveRelationship(person.relationships, "owner")) {
      writeAudit(transaction, organizationId, userUid, "person.relationship_added", person.id, {
        relationship: "owner",
      });
    }
    writeAudit(transaction, organizationId, userUid, "ownership.created", ownershipReference.id, {
      personId: input.personId,
      propertyId: input.propertyId,
      pct: input.pct,
    });
  });

  return ownershipReference.id;
}

export async function updateOwnership(
  organizationId: string,
  userUid: string,
  ownershipId: string,
  input: OwnershipUpdateInput,
) {
  const db = getFirebaseAdminFirestore();
  const ownershipReference = getOwnershipsCollection(organizationId).doc(ownershipId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ownershipReference);
    if (!snapshot.exists) throw new OwnershipNotFoundError();
    const current = parseOwnership(organizationId, ownershipId, snapshot.data());
    if (!current.active) throw new OwnershipEndedError();

    const links = await readPropertyOwnerships(transaction, organizationId, current.propertyId);
    const others = links.active.filter((item) => item.id !== ownershipId);
    const pctChanged = roundPct(input.pct) !== roundPct(current.pct);
    if (pctChanged) {
      const available = availablePct(others.map((item) => item.pct));
      if (input.pct > available) throw new OwnershipConflictError("over_100", available);
    }

    const titleChanged = titleFields.some((field) => input[field] !== current[field]);
    // Unticking evidence on a verified record must also send it back to review.
    const checksChanged = ownershipChecks.some((check) => input.checks[check] !== current.checks[check]);
    const reopen = current.status === "verified" && (titleChanged || checksChanged);

    transaction.update(ownershipReference, {
      pct: input.pct,
      startDate: input.startDate,
      titleOwner: input.titleOwner,
      titleNumber: input.titleNumber,
      registryNumber: input.registryNumber,
      cadastralNumber: input.cadastralNumber,
      registryAddress: input.registryAddress,
      checks: input.checks,
      ...(reopen ? { status: "in_review", reviewerUid: null, reviewedAt: null } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    if (pctChanged) {
      writePropertyProjection(
        transaction,
        links.propertyReference,
        [...others, { personId: current.personId, pct: input.pct }],
        userUid,
      );
    }
    writeAudit(transaction, organizationId, userUid, "ownership.updated", ownershipId, {
      personId: current.personId,
      propertyId: current.propertyId,
    });
    if (reopen) {
      writeAudit(transaction, organizationId, userUid, "ownership.status_changed", ownershipId, {
        from: "verified",
        to: "in_review",
        reason: "Datos modificados",
      });
    }
  });
}

export async function changeOwnershipStatus(
  organizationId: string,
  actor: { uid: string; role: OrganizationRole },
  ownershipId: string,
  to: OwnershipStatus,
  reason?: string,
) {
  const db = getFirebaseAdminFirestore();
  const ownershipReference = getOwnershipsCollection(organizationId).doc(ownershipId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ownershipReference);
    if (!snapshot.exists) throw new OwnershipNotFoundError();
    const current = parseOwnership(organizationId, ownershipId, snapshot.data());
    if (!current.active) throw new OwnershipEndedError();
    if (!canTransition(current.status, to)) throw new OwnershipTransitionError(current.status, to);
    // Guarded here too, not only by the route schema.
    if (to === "rejected" && !reason?.trim()) throw new OwnershipTransitionError(current.status, to);

    const reviewing = to === "verified" || to === "rejected";
    if (reviewing) {
      if (!can(actor.role, "ownerships", "review")) throw new OwnershipReviewForbiddenError("role");
      if (current.createdBy === actor.uid) throw new OwnershipReviewForbiddenError("own_record");
    }

    transaction.update(ownershipReference, {
      status: to,
      reviewerUid: reviewing ? actor.uid : null,
      reviewedAt: reviewing ? FieldValue.serverTimestamp() : null,
      rejectionReason: to === "rejected" ? (reason ?? null) : null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    });
    writeAudit(transaction, organizationId, actor.uid, "ownership.status_changed", ownershipId, {
      from: current.status,
      to,
      reason: reason ?? null,
    });
  });
}

export async function endOwnership(
  organizationId: string,
  userUid: string,
  ownershipId: string,
  endDate?: string,
) {
  const db = getFirebaseAdminFirestore();
  const ownershipReference = getOwnershipsCollection(organizationId).doc(ownershipId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ownershipReference);
    if (!snapshot.exists) throw new OwnershipNotFoundError();
    const current = parseOwnership(organizationId, ownershipId, snapshot.data());
    if (!current.active) throw new OwnershipEndedError();

    const links = await readPropertyOwnerships(transaction, organizationId, current.propertyId);
    transaction.update(ownershipReference, {
      active: false,
      endedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    writePropertyProjection(
      transaction,
      links.propertyReference,
      links.active.filter((item) => item.id !== ownershipId),
      userUid,
    );
    writeAudit(transaction, organizationId, userUid, "ownership.ended", ownershipId, {
      personId: current.personId,
      propertyId: current.propertyId,
      ...(endDate ? { endDate } : {}),
    });
  });
}

export async function getOwnership(organizationId: string, ownershipId: string) {
  const snapshot = await getOwnershipsCollection(organizationId).doc(ownershipId).get();
  if (!snapshot.exists) return null;
  return parseOwnership(organizationId, snapshot.id, snapshot.data());
}

const LIST_LIMIT = 200;

/** Ownerships of one or more people (a representative sees the entities they represent). */
export async function listPersonOwnerships(
  organizationId: string,
  personIds: string[],
  options: { activeOnly?: boolean } = {},
) {
  if (personIds.length === 0) return [];
  const results: Ownership[] = [];
  // Firestore "in" queries accept at most 30 values.
  for (let index = 0; index < personIds.length; index += 30) {
    let query = getOwnershipsCollection(organizationId).where(
      "personId",
      "in",
      personIds.slice(index, index + 30),
    );
    if (options.activeOnly) query = query.where("active", "==", true);
    const snapshot = await query.limit(LIST_LIMIT).get();
    results.push(
      ...snapshot.docs.map((document) =>
        parseOwnership(organizationId, document.id, document.data()),
      ),
    );
  }
  return results;
}

export async function listPropertyOwnerships(
  organizationId: string,
  propertyId: string,
  options: { activeOnly?: boolean } = {},
) {
  let query = getOwnershipsCollection(organizationId).where("propertyId", "==", propertyId);
  if (options.activeOnly) query = query.where("active", "==", true);
  const snapshot = await query.limit(LIST_LIMIT).get();
  return snapshot.docs.map((document) =>
    parseOwnership(organizationId, document.id, document.data()),
  );
}
