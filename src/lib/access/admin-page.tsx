import "server-only";

import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { requireLane } from "@/lib/access/authorize";

/**
 * Page-level guard for /admin. Next renders page segments even when the layout
 * returns early, so every page must repeat the layout's handling: redirects for
 * unauthenticated / no_workspace, and the same AccessState screen for denials.
 * Usage: `const gate = await requireAdminPage(); if (!gate.ok) return gate.denied;`
 */
export async function requireAdminPage() {
  const access = await requireLane("admin");
  if (access.kind === "unauthenticated") {
    redirect(access.sessionExpired ? "/acceder?motivo=sesion-expirada" : "/acceder");
  }
  if (access.kind === "no_workspace") redirect("/espacios");
  if (access.kind === "account_blocked") {
    return { ok: false as const, denied: (<AccessState kind="account_blocked" />) as ReactElement };
  }
  if (access.kind === "forbidden") {
    return { ok: false as const, denied: (<AccessState kind="forbidden" />) as ReactElement };
  }
  return {
    ok: true as const,
    user: access.user,
    memberships: access.memberships,
    activeOrganization: access.workspace,
    role: access.role,
  };
}
