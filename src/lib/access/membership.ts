import type { OrganizationRole } from "@/lib/auth/organization-schema";
import type { Lane } from "./permissions.ts";

export const staffRoles = ["org_owner", "admin", "manager", "operations"] as const;
export const portalLanes = ["owner", "tenant", "applicant", "guest"] as const;
export type StaffRole = (typeof staffRoles)[number];
export type PortalLane = (typeof portalLanes)[number];

export type NormalizedMembership = {
  staffRole: StaffRole | null;
  portals: PortalLane[];
  portalPersonIds: Partial<Record<PortalLane, string>>;
  status: string;
};

type RawMembership = {
  role?: OrganizationRole;
  staffRole?: StaffRole | null;
  portals?: PortalLane[];
  portalPersonIds?: Partial<Record<PortalLane, string>>;
  personId?: string | null;
  status: string;
};

const isStaffRole = (role: string): role is StaffRole => (staffRoles as readonly string[]).includes(role);
const isPortalLane = (role: string): role is PortalLane => (portalLanes as readonly string[]).includes(role);

/** Reads the legacy single `role` and the new staffRole + portals shape. */
export function normalizeMembership(raw: RawMembership): NormalizedMembership {
  if (raw.staffRole !== undefined || raw.portals !== undefined) {
    return {
      staffRole: raw.staffRole ?? null,
      portals: (raw.portals ?? []).filter(isPortalLane),
      portalPersonIds: raw.portalPersonIds ?? {},
      status: raw.status,
    };
  }
  const role = raw.role ?? "";
  return {
    staffRole: isStaffRole(role) ? role : null,
    portals: isPortalLane(role) ? [role] : [],
    portalPersonIds: isPortalLane(role) && raw.personId ? { [role]: raw.personId } : {},
    status: raw.status,
  };
}

/** Lanes a membership grants by itself; portal lanes still need an active relationship (see authorize). */
export function membershipLanes(membership: NormalizedMembership): Lane[] {
  return [...(membership.staffRole ? (["admin"] as Lane[]) : []), ...membership.portals];
}
