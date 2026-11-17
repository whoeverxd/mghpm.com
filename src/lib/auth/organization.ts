import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  normalizeMembership,
  portalLanes,
  staffRoles,
  type NormalizedMembership,
} from "@/lib/access/membership";
import { resolveWorkspace } from "@/lib/access/workspaces";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { organizationRoleSchema, type OrganizationRole } from "./organization-schema";

export { organizationRoleSchema, type OrganizationRole };

export const ORGANIZATION_COOKIE_NAME = "mghpm_organization";

const membershipSchema = z.object({
  userUid: z.string().min(1),
  organizationId: z.string().min(1),
  role: organizationRoleSchema.optional(),
  staffRole: z.enum(staffRoles).nullable().optional(),
  portals: z.array(z.enum(portalLanes)).optional(),
  // partialRecord: a membership only lists the portals it actually has.
  portalPersonIds: z.partialRecord(z.enum(portalLanes), z.string()).optional(),
  status: z.enum(["invited", "pending_verification", "active", "suspended", "disabled", "archived"]),
  personId: z.string().nullable().optional(),
});

const organizationSchema = z.object({
  name: z.string().min(1),
  baseCurrency: z.enum(["USD", "DOP"]),
  supportedCurrencies: z.array(z.enum(["USD", "DOP"])),
  supportedCountries: z.array(z.enum(["US", "DO"])),
  supportedLanguages: z.array(z.enum(["es-DO", "en-US"])),
  defaultTimeZone: z.string().min(1),
});

export type OrganizationMembership = {
  organizationId: string;
  organizationName: string;
  baseCurrency: "USD" | "DOP";
  timeZone: string;
  /** Staff role when the membership has one, otherwise its first portal, otherwise the legacy role. */
  role: OrganizationRole;
  personId: string | null;
  membership: NormalizedMembership;
};

export async function listUserOrganizations(
  userUid: string,
): Promise<OrganizationMembership[]> {
  const db = getFirebaseAdminFirestore();
  const membershipSnapshot = await db
    .collectionGroup("memberships")
    .where("userUid", "==", userUid)
    .get();

  const activeMemberships = membershipSnapshot.docs.flatMap((document) => {
    const membership = membershipSchema.parse(document.data());
    const organizationReference = document.ref.parent.parent;

    if (
      !organizationReference ||
      organizationReference.id !== membership.organizationId ||
      organizationReference.parent.id !== "organizations" ||
      document.ref.parent.id !== "memberships"
    ) {
      throw new Error(`Membership ${document.ref.path} has an invalid organization reference.`);
    }

    if (document.id !== userUid) {
      throw new Error(`Membership ${document.ref.path} is not keyed by its user UID.`);
    }

    return membership.status === "active"
      ? [{ membership, organizationReference }]
      : [];
  });

  if (activeMemberships.length === 0) return [];

  const organizationSnapshots = await db.getAll(
    ...activeMemberships.map(({ organizationReference }) => organizationReference),
  );

  return organizationSnapshots.map((snapshot, index) => {
    if (!snapshot.exists) {
      throw new Error(`Organization ${snapshot.ref.path} referenced by a membership is missing.`);
    }

    const organization = organizationSchema.parse(snapshot.data());
    const membership = activeMemberships[index]?.membership;
    if (!membership) throw new Error("Unable to match an organization to its membership.");

    const normalized = normalizeMembership(membership);
    return {
      organizationId: membership.organizationId,
      organizationName: organization.name,
      baseCurrency: organization.baseCurrency,
      timeZone: organization.defaultTimeZone,
      // The legacy `role` only counts on documents that predate staffRole/portals.
      role:
        normalized.staffRole ??
        normalized.portals[0] ??
        (membership.staffRole === undefined && membership.portals === undefined ? membership.role : undefined) ??
        "vendor",
      personId: membership.personId ?? null,
      membership: normalized,
    };
  });
}

/** True when the user has memberships, none is active and at least one was blocked (suspended, disabled, archived). */
export async function hasOnlyBlockedMemberships(userUid: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collectionGroup("memberships")
    .where("userUid", "==", userUid)
    .get();
  if (snapshot.empty) return false;
  const statuses = snapshot.docs.map((document) => document.get("status"));
  if (statuses.includes("active")) return false;
  return statuses.some((status) => status === "suspended" || status === "disabled" || status === "archived");
}

/**
 * Staff (admin lane) access used by the /admin pages: activeOrganization is set
 * only when the selected or only admin-lane membership resolves.
 */
export async function getOrganizationAccess(userUid: string) {
  const memberships = await listUserOrganizations(userUid);
  const selectedOrganizationId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value ?? null;
  const activeOrganization = resolveWorkspace(memberships, selectedOrganizationId, "admin");
  return { memberships, activeOrganization };
}
