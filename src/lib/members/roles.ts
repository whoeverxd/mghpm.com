import type { OrganizationRole } from "@/lib/auth/organization-schema";
import type { PortalLane } from "@/lib/access/membership";

/** Internal roles an actor can assign from the users screen. */
export const staffRoles = ["admin", "manager", "operations"] as const;
/** Portals managed from the users screen; each needs a linked person with the matching relationship. */
export const portalRoles = ["owner", "tenant"] as const;
export const memberStatuses = ["active", "suspended"] as const;

export type StaffRole = (typeof staffRoles)[number];
export type PortalRole = (typeof portalRoles)[number];
export type MemberStatus = (typeof memberStatuses)[number];

/** Roles that see the administrative modules (properties, people, users). */
export const managementRoles: ReadonlySet<OrganizationRole> = new Set(["org_owner", "admin"]);

export const roleLabels: Record<OrganizationRole, string> = {
  org_owner: "Titular de la cuenta",
  admin: "Administrador",
  manager: "Gerente de propiedades",
  operations: "Operaciones",
  owner: "Propietario (cliente)",
  tenant: "Inquilino",
  applicant: "Solicitante",
  vendor: "Proveedor",
  guest: "Huésped",
};

export const portalLabels: Record<PortalLane, string> = {
  owner: "Propietario",
  tenant: "Inquilino",
  applicant: "Solicitante",
  guest: "Huésped",
};

export const memberStatusLabels: Record<MemberStatus, string> = {
  active: "Activa",
  suspended: "Suspendida",
};

/** Labels for every stored membership status, including those set by other flows. */
export const allMemberStatusLabels: Record<string, string> = {
  ...memberStatusLabels,
  invited: "Invitada",
  pending_verification: "Pendiente de verificación",
  disabled: "Deshabilitada",
  archived: "Archivada",
};

/**
 * Who may grant or change a staff role: the account holder manages every
 * assignable role, admins manage everything except admins. Nobody manages
 * the account holder.
 */
export function canManageRole(actorRole: OrganizationRole, targetRole: OrganizationRole) {
  if (targetRole === "org_owner") return false;
  if (actorRole === "org_owner") return true;
  return actorRole === "admin" && targetRole !== "admin";
}
