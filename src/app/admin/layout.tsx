import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { adminNamespaces, ClientTexts } from "@/components/i18n/client-texts";
import { requireLane } from "@/lib/access/authorize";

/** Guards every /admin page: staff lane only. Pages still render their own AdminShell. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const access = await requireLane("admin");
  if (access.kind === "unauthenticated") {
    redirect(access.sessionExpired ? "/acceder?motivo=sesion-expirada" : "/acceder");
  }
  if (access.kind === "no_workspace") redirect("/espacios");
  if (access.kind === "account_blocked") return <AccessState kind="account_blocked" />;
  if (access.kind === "forbidden") return <AccessState kind="forbidden" />;
  return <ClientTexts namespaces={adminNamespaces}>{children}</ClientTexts>;
}
