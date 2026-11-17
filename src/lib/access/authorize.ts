import "server-only";

import { cookies } from "next/headers";
import {
  hasOnlyBlockedMemberships,
  listUserOrganizations,
  ORGANIZATION_COOKIE_NAME,
  type OrganizationMembership,
} from "@/lib/auth/organization";
import { getSessionUser, SESSION_COOKIE_NAME, type SessionUser } from "@/lib/auth/session";
import { getOrganizationPerson } from "@/lib/people/records";
import { hasActiveRelationship, normalizePersonIdentity } from "@/lib/people/relationships";
import { can, type Lane, type StaffAction, type StaffModule } from "./permissions";
import { listWorkspaces, resolveWorkspace, type Workspace } from "./workspaces";

export type AccessDenial =
  | { kind: "unauthenticated"; status: 401; message: string; sessionExpired: boolean }
  | { kind: "account_blocked"; status: 403; message: string }
  | { kind: "no_workspace"; status: 409; message: string }
  | { kind: "forbidden"; status: 403; message: string };

export type AccessGrant = {
  kind: "allowed";
  user: SessionUser;
  userUid: string;
  organizationId: string;
  role: OrganizationMembership["role"];
  /** Person behind the portal lane; null for the admin lane. */
  personId: string | null;
  timeZone: string;
  workspace: Workspace<OrganizationMembership>;
  workspaces: Workspace<OrganizationMembership>[];
  memberships: OrganizationMembership[];
};

async function denyWithoutUser(): Promise<AccessDenial> {
  const hadSession = Boolean((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  return {
    kind: "unauthenticated",
    status: 401,
    message: "Inicia sesión para continuar.",
    sessionExpired: hadSession,
  };
}

/** Resolves session → active memberships → workspace for the lane. Denies anything unproven. */
export async function requireLane(lane: Lane): Promise<AccessGrant | AccessDenial> {
  const user = await getSessionUser();
  if (!user) return denyWithoutUser();

  const memberships = await listUserOrganizations(user.uid);
  if (memberships.length === 0 && (await hasOnlyBlockedMemberships(user.uid))) {
    return { kind: "account_blocked", status: 403, message: "Tu acceso está suspendido o deshabilitado." };
  }

  const workspaces = listWorkspaces(memberships);
  if (!workspaces.some((workspace) => workspace.lane === lane)) {
    return { kind: "forbidden", status: 403, message: "No tienes acceso a esta sección." };
  }

  const selected = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value ?? null;
  const workspace = resolveWorkspace(memberships, selected, lane);
  if (!workspace) {
    return { kind: "no_workspace", status: 409, message: "Selecciona un espacio de trabajo para continuar." };
  }

  let role = workspace.role;
  let personId: string | null = null;
  if (lane === "admin") {
    if (!workspace.membership.staffRole) {
      return { kind: "forbidden", status: 403, message: "No tienes acceso a esta sección." };
    }
    role = workspace.membership.staffRole;
  } else {
    // A portal needs the granted lane and an active matching relationship on a non-archived person.
    personId = workspace.membership.portalPersonIds[lane] ?? null;
    // An unreadable person record denies access instead of failing the request.
    const person = personId
      ? await getOrganizationPerson(workspace.organizationId, personId).catch((error: unknown) => {
          console.error("Unable to read the portal person; denying access.", { personId, error });
          return null;
        })
      : null;
    if (!person || person.archived) {
      return { kind: "forbidden", status: 403, message: "No tienes acceso a esta sección." };
    }
    const { relationships } = normalizePersonIdentity(person);
    if (!hasActiveRelationship(relationships, lane)) {
      return { kind: "forbidden", status: 403, message: "No tienes acceso a esta sección." };
    }
  }

  return {
    kind: "allowed",
    user,
    userUid: user.uid,
    organizationId: workspace.organizationId,
    role,
    personId,
    timeZone: workspace.timeZone,
    workspace,
    workspaces,
    memberships,
  };
}

/** Admin lane plus a specific permission from the central table. */
export async function requireStaffPermission(
  module: StaffModule,
  action: StaffAction,
  forbiddenMessage = "Tu rol no tiene permiso para esta acción.",
): Promise<AccessGrant | AccessDenial> {
  const access = await requireLane("admin");
  if (access.kind !== "allowed") return access;
  if (!can(access.role, module, action)) {
    return { kind: "forbidden", status: 403, message: forbiddenMessage };
  }
  return access;
}
