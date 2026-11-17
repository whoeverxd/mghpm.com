import type { OrganizationRole } from "@/lib/auth/organization-schema";

export const lanes = ["admin", "owner", "tenant", "applicant", "guest"] as const;
export type Lane = (typeof lanes)[number];

export const staffModules = [
  "dashboard",
  "properties",
  "people",
  "leases",
  "stay_inquiries",
  "members",
  "ownerships",
  "audit",
] as const;
export type StaffModule = (typeof staffModules)[number];
export type StaffAction = "view" | "create" | "update" | "archive" | "manage" | "review";

const laneByRole: Partial<Record<OrganizationRole, Lane>> = {
  org_owner: "admin",
  admin: "admin",
  manager: "admin",
  operations: "admin",
  owner: "owner",
  tenant: "tenant",
  applicant: "applicant",
  guest: "guest",
};

/** Lane a membership role opens; null means the role grants no access (e.g. vendor). */
export function laneForRole(role: OrganizationRole): Lane | null {
  return laneByRole[role] ?? null;
}

const operate: StaffAction[] = ["view", "create", "update", "archive"];

type Matrix = Partial<Record<StaffModule, StaffAction[]>>;

const fullAccess: Matrix = {
  dashboard: ["view"],
  properties: operate,
  people: operate,
  leases: operate,
  stay_inquiries: operate,
  members: ["view", "manage"],
  ownerships: [...operate, "review"],
  audit: ["view"],
};

// Deny by default: anything not listed here is forbidden.
const staffPermissions: Partial<Record<OrganizationRole, Matrix>> = {
  org_owner: fullAccess,
  admin: fullAccess,
  manager: {
    dashboard: ["view"],
    properties: operate,
    people: operate,
    leases: operate,
    stay_inquiries: operate,
    members: ["view"],
    ownerships: operate,
  },
  operations: {
    dashboard: ["view"],
    properties: ["view"],
    people: ["view"],
    leases: ["view"],
    stay_inquiries: ["view", "update"],
    ownerships: ["view"],
  },
};

export function can(role: OrganizationRole | null, module: StaffModule, action: StaffAction) {
  if (!role) return false;
  return staffPermissions[role]?.[module]?.includes(action) ?? false;
}

export const lanePaths: Record<Lane, string> = {
  admin: "/admin",
  owner: "/propietario",
  tenant: "/inquilino",
  applicant: "/solicitante",
  guest: "/huesped",
};

export function getLaneHomePath(lane: Lane) {
  return lanePaths[lane];
}

export function laneForPathname(pathname: string): Lane | null {
  return (
    lanes.find((lane) => pathname === lanePaths[lane] || pathname.startsWith(`${lanePaths[lane]}/`)) ??
    null
  );
}
