import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { PortalShell } from "@/components/access/portal-shell";
import { requireLane } from "@/lib/access/authorize";

export default async function TenantPortalLayout({ children }: LayoutProps<"/inquilino">) {
  const access = await requireLane("tenant");
  if (access.kind === "unauthenticated") {
    redirect(access.sessionExpired ? "/acceder?motivo=sesion-expirada" : "/acceder?acceso=tenant");
  }
  if (access.kind === "no_workspace") redirect("/espacios");
  if (access.kind === "account_blocked") return <AccessState kind="account_blocked" />;
  if (access.kind === "forbidden") return <AccessState kind="forbidden" />;

  return (
    <PortalShell
      canSwitch={access.workspaces.length > 1}
      lane="tenant"
      organizationName={access.workspace.organizationName}
      userEmail={access.user.email}
      userName={access.user.name}
    >
      {children}
    </PortalShell>
  );
}
