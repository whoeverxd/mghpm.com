import "server-only";

import { randomBytes } from "node:crypto";
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { normalizeMembership, type PortalLane, type StaffRole } from "@/lib/access/membership";
import type { OrganizationRole } from "@/lib/auth/organization";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { personDocumentSchema } from "@/lib/people/schema";
import { hasActiveRelationship, normalizePersonIdentity } from "@/lib/people/relationships";
import { normalizePersonEmail } from "@/lib/people/search-index";
import { canManageRole, portalRoles, type PortalRole } from "./roles";
import {
  memberDocumentSchema,
  type MemberDocument,
  type MemberCreateInput,
  type MemberUpdateInput,
} from "./schema";
import { auditEventFields } from "@/lib/audit/area";

export const MEMBER_LIST_LIMIT = 500;

export class MemberAlreadyExistsError extends Error {
  constructor() {
    super("This account already belongs to the organization.");
    this.name = "MemberAlreadyExistsError";
  }
}

export class MemberNotFoundError extends Error {
  constructor() {
    super("The member does not exist in the active organization.");
    this.name = "MemberNotFoundError";
  }
}

export class MemberPermissionError extends Error {
  constructor(readonly reason: "role" | "self" | "status") {
    super("The actor cannot manage this membership.");
    this.name = "MemberPermissionError";
  }
}

export class MemberPersonLinkError extends Error {
  constructor(readonly reason: "missing" | "type" | "email" | "linked" | "relationship") {
    super(`The people record cannot be linked: ${reason}.`);
    this.name = "MemberPersonLinkError";
  }
}

export type OrganizationMember = {
  uid: string;
  email: string | null;
  displayName: string | null;
  staffRole: StaffRole | null;
  portals: PortalLane[];
  portalPersonIds: Partial<Record<PortalLane, string>>;
  portalPersonNames: Partial<Record<PortalLane, string | null>>;
  status: MemberDocument["status"];
  lastSignInTime: string | null;
};

type Actor = { uid: string; role: OrganizationRole };

function getOrganizationReference(organizationId: string) {
  return getFirebaseAdminFirestore().collection("organizations").doc(organizationId);
}

function parseMember(organizationId: string, uid: string, data: unknown) {
  const parsed = memberDocumentSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid membership document in the active organization.", {
      organizationId,
      uid,
      issues: parsed.error.issues,
    });
    throw new Error("A membership record is incomplete or invalid.");
  }
  return parsed.data;
}

function hasAuthErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

async function getAuthUsers(uids: string[]) {
  const users = new Map<string, UserRecord>();
  for (let index = 0; index < uids.length; index += 100) {
    const result = await getFirebaseAdminAuth().getUsers(
      uids.slice(index, index + 100).map((uid) => ({ uid })),
    );
    for (const user of result.users) users.set(user.uid, user);
  }
  return users;
}

/**
 * Accounts created by an admin can report a sign-in time equal to their
 * creation time without ever signing in, so that value is ignored.
 */
function getLastActivity(user: UserRecord) {
  const { creationTime, lastRefreshTime, lastSignInTime } = user.metadata;
  if (lastRefreshTime) return lastRefreshTime;
  return lastSignInTime && lastSignInTime !== creationTime ? lastSignInTime : null;
}

export async function listOrganizationMembers(organizationId: string) {
  const organizationReference = getOrganizationReference(organizationId);
  const snapshot = await organizationReference
    .collection("memberships")
    .limit(MEMBER_LIST_LIMIT)
    .get();
  const memberships = snapshot.docs.map((document) => ({
    uid: document.id,
    ...normalizeMembership(parseMember(organizationId, document.id, document.data())),
  }));

  const personIds = [
    ...new Set(memberships.flatMap((membership) => Object.values(membership.portalPersonIds))),
  ];
  const [users, personSnapshots] = await Promise.all([
    getAuthUsers(memberships.map((membership) => membership.uid)),
    personIds.length
      ? getFirebaseAdminFirestore().getAll(
          ...personIds.map((id) => organizationReference.collection("people").doc(id)),
        )
      : [],
  ]);
  const personNames = new Map(
    personSnapshots.map((person) => [person.id, String(person.get("name") ?? "")]),
  );

  const members = memberships.map((membership): OrganizationMember => {
    const user = users.get(membership.uid);
    return {
      uid: membership.uid,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      staffRole: membership.staffRole,
      portals: membership.portals,
      portalPersonIds: membership.portalPersonIds,
      portalPersonNames: Object.fromEntries(
        Object.entries(membership.portalPersonIds).map(([lane, id]) => [
          lane,
          personNames.get(id) || null,
        ]),
      ),
      status: membership.status as MemberDocument["status"],
      lastSignInTime: user ? getLastActivity(user) : null,
    };
  });

  return members.sort((left, right) =>
    (left.displayName ?? left.email ?? "").localeCompare(right.displayName ?? right.email ?? "", "es"),
  );
}

export async function getOrganizationMember(organizationId: string, uid: string) {
  const members = await listOrganizationMembers(organizationId);
  return members.find((member) => member.uid === uid) ?? null;
}

/**
 * Finds the Firebase Auth account for the email or creates one with a random
 * password; the person sets their own password through the reset email.
 */
async function getOrCreateAuthUser(email: string, displayName: string) {
  const auth = getFirebaseAdminAuth();
  try {
    return { user: await auth.getUserByEmail(email), created: false };
  } catch (error) {
    if (!hasAuthErrorCode(error, "auth/user-not-found")) throw error;
  }

  try {
    const user = await auth.createUser({
      email,
      displayName,
      password: randomBytes(24).toString("base64url"),
      emailVerified: false,
    });
    return { user, created: true };
  } catch (error) {
    if (!hasAuthErrorCode(error, "auth/email-already-exists")) throw error;
    return { user: await auth.getUserByEmail(email), created: false };
  }
}

type PortalSelection = Record<PortalRole, string>;

/** Checks that a people record may back the portal for this account; throws MemberPersonLinkError. */
function assertPersonLinkable(
  snapshot: DocumentSnapshot | undefined,
  portal: PortalRole,
  email: string,
  uid: string,
) {
  const person = personDocumentSchema.safeParse(snapshot?.data());
  if (!snapshot?.exists || !person.success || person.data.archived) {
    throw new MemberPersonLinkError("missing");
  }
  const { relationships } = normalizePersonIdentity(person.data);
  if (!hasActiveRelationship(relationships, portal)) throw new MemberPersonLinkError("relationship");
  if (person.data.emailKey !== email) throw new MemberPersonLinkError("email");
  if (person.data.accountUid && person.data.accountUid !== uid) {
    throw new MemberPersonLinkError("linked");
  }
}

/** Keeps only the portals that have a person selected. */
function portalMap(selection: PortalSelection) {
  return Object.fromEntries(
    portalRoles.flatMap((portal) => (selection[portal] ? [[portal, selection[portal]]] : [])),
  ) as Partial<Record<PortalLane, string>>;
}

const isManagedPortal = (lane: string) => (portalRoles as readonly string[]).includes(lane);

export async function createOrganizationMember(
  organizationId: string,
  actor: Actor,
  input: MemberCreateInput,
) {
  if (input.staffRole && !canManageRole(actor.role, input.staffRole)) {
    throw new MemberPermissionError("role");
  }

  const db = getFirebaseAdminFirestore();
  const organizationReference = getOrganizationReference(organizationId);
  const peopleCollection = organizationReference.collection("people");
  const auditReference = organizationReference.collection("auditEvents").doc();
  const timestamp = FieldValue.serverTimestamp();
  const email = normalizePersonEmail(input.email);
  const portalPersonIds = portalMap(input.portals);
  const portals = Object.keys(portalPersonIds) as PortalLane[];

  const { user, created } = await getOrCreateAuthUser(email, input.displayName);
  const membershipReference = organizationReference.collection("memberships").doc(user.uid);

  try {
    await db.runTransaction(async (transaction) => {
      const personIds = [...new Set(Object.values(portalPersonIds))];
      const [membership, ...personSnapshots] = await Promise.all([
        transaction.get(membershipReference),
        ...personIds.map((id) => transaction.get(peopleCollection.doc(id))),
      ]);
      if (membership.exists) throw new MemberAlreadyExistsError();

      const snapshots = new Map(personIds.map((id, index) => [id, personSnapshots[index]]));
      for (const portal of portalRoles) {
        const personId = input.portals[portal];
        if (personId) assertPersonLinkable(snapshots.get(personId), portal, email, user.uid);
      }
      for (const id of personIds) {
        transaction.update(peopleCollection.doc(id), {
          accountUid: user.uid,
          updatedAt: timestamp,
          updatedBy: actor.uid,
        });
      }

      transaction.create(membershipReference, {
        userUid: user.uid,
        organizationId,
        staffRole: input.staffRole || null,
        portals,
        portalPersonIds,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: actor.uid,
        updatedBy: actor.uid,
      });
      transaction.create(auditReference, auditEventFields({
        organizationId,
        action: "member.created",
        actorUid: actor.uid,
        targetId: user.uid,
        staffRole: input.staffRole || null,
        portals,
        createdAt: timestamp,
      }));
      if (portals.length > 0) {
        transaction.create(organizationReference.collection("auditEvents").doc(), auditEventFields({
          organizationId,
          action: "member.portals_changed",
          actorUid: actor.uid,
          targetId: user.uid,
          before: {},
          after: portalPersonIds,
          createdAt: timestamp,
        }));
      }
    });
  } catch (error) {
    if (created) {
      await getFirebaseAdminAuth().deleteUser(user.uid).catch((cleanupError: unknown) => {
        console.error("Unable to remove an Auth user after a failed membership.", cleanupError);
      });
    }
    throw error;
  }

  return { uid: user.uid, email, accountCreated: created };
}

export async function updateOrganizationMember(
  organizationId: string,
  actor: Actor,
  uid: string,
  input: MemberUpdateInput,
) {
  if (uid === actor.uid) throw new MemberPermissionError("self");

  const db = getFirebaseAdminFirestore();
  const organizationReference = getOrganizationReference(organizationId);
  const membershipReference = organizationReference.collection("memberships").doc(uid);
  const peopleCollection = organizationReference.collection("people");
  const timestamp = FieldValue.serverTimestamp();
  const nextStaffRole = input.staffRole || null;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(membershipReference);
    if (!snapshot.exists) throw new MemberNotFoundError();

    const current = normalizeMembership(parseMember(organizationId, uid, snapshot.data()));
    if (current.staffRole && !canManageRole(actor.role, current.staffRole)) {
      throw new MemberPermissionError("role");
    }
    if (nextStaffRole && !canManageRole(actor.role, nextStaffRole)) {
      throw new MemberPermissionError("role");
    }

    // Staff only toggles active ↔ suspended; other statuses belong to invitation/verification flows.
    const isManagedStatus = (status: string) => status === "active" || status === "suspended";
    if (
      input.status !== current.status &&
      (!isManagedStatus(current.status) || !isManagedStatus(input.status))
    ) {
      throw new MemberPermissionError("status");
    }

    // Portals other than owner/tenant (applicant, guest) belong to other flows and are kept as they are.
    const keptIds = Object.fromEntries(
      Object.entries(current.portalPersonIds).filter(([lane]) => !isManagedPortal(lane)),
    ) as Partial<Record<PortalLane, string>>;
    const managedBefore = portalMap({
      owner: current.portalPersonIds.owner ?? "",
      tenant: current.portalPersonIds.tenant ?? "",
    });
    const managedAfter = portalMap(input.portals);
    const nextPortalIds = { ...managedAfter, ...keptIds };
    const nextPortals = [
      ...Object.keys(managedAfter),
      ...current.portals.filter((lane) => !isManagedPortal(lane)),
    ] as PortalLane[];

    const portalsChanged = portalRoles.some(
      (portal) => (managedBefore[portal] ?? "") !== (managedAfter[portal] ?? ""),
    );
    const staffRoleChanged = nextStaffRole !== current.staffRole;
    const statusChanged = input.status !== current.status;

    // Reads first: every person that gets linked or unlinked.
    const linkedBefore = new Set(Object.values(current.portalPersonIds));
    const linkedAfter = new Set(Object.values(nextPortalIds));
    const touchedIds = [
      ...new Set([
        ...portalRoles.flatMap((portal) => {
          const id = managedAfter[portal];
          return id && id !== managedBefore[portal] ? [id] : [];
        }),
        ...[...linkedBefore].filter((id) => !linkedAfter.has(id)),
      ]),
    ];
    const needsEmail = portalRoles.some(
      (portal) => managedAfter[portal] && managedAfter[portal] !== managedBefore[portal],
    );
    const accountEmail = needsEmail
      ? normalizePersonEmail((await getFirebaseAdminAuth().getUser(uid)).email ?? "")
      : "";
    const personSnapshots = new Map(
      await Promise.all(
        touchedIds.map(async (id) => [id, await transaction.get(peopleCollection.doc(id))] as const),
      ),
    );

    for (const portal of portalRoles) {
      const personId = managedAfter[portal];
      if (personId && personId !== managedBefore[portal]) {
        assertPersonLinkable(personSnapshots.get(personId), portal, accountEmail, uid);
      }
    }

    if (!portalsChanged && !staffRoleChanged && !statusChanged) return;

    for (const id of touchedIds) {
      const person = personSnapshots.get(id);
      if (!person?.exists) continue;
      const accountUid: unknown = person.get("accountUid");
      if (linkedAfter.has(id) && accountUid !== uid) {
        transaction.update(peopleCollection.doc(id), {
          accountUid: uid,
          updatedAt: timestamp,
          updatedBy: actor.uid,
        });
      } else if (!linkedAfter.has(id) && accountUid === uid) {
        transaction.update(peopleCollection.doc(id), {
          accountUid: null,
          updatedAt: timestamp,
          updatedBy: actor.uid,
        });
      }
    }

    transaction.update(membershipReference, {
      staffRole: nextStaffRole,
      portals: nextPortals,
      portalPersonIds: nextPortalIds,
      status: input.status,
      role: FieldValue.delete(),
      personId: FieldValue.delete(),
      updatedAt: timestamp,
      updatedBy: actor.uid,
    });

    const events: { action: string; [key: string]: unknown }[] = [];
    if (staffRoleChanged) {
      events.push({
        action: "member.role_changed",
        staffRole: nextStaffRole,
        previousStaffRole: current.staffRole,
      });
    }
    if (portalsChanged) {
      events.push({ action: "member.portals_changed", before: managedBefore, after: managedAfter });
    }
    if (statusChanged) {
      events.push({ action: input.status === "suspended" ? "member.suspended" : "member.reactivated" });
    }
    for (const event of events) {
      transaction.create(organizationReference.collection("auditEvents").doc(), auditEventFields({
        organizationId,
        actorUid: actor.uid,
        targetId: uid,
        createdAt: timestamp,
        ...event,
      }));
    }
  });
}
