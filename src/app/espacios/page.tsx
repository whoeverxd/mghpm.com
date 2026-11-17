import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { OrganizationPicker } from "@/components/organizations/organization-picker";
import { getLaneHomePath, lanes, type Lane } from "@/lib/access/permissions";
import { listWorkspaces } from "@/lib/access/workspaces";
import { hasOnlyBlockedMemberships, listUserOrganizations } from "@/lib/auth/organization";
import { getSessionUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import styles from "@/components/access/access-state.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.workspaces.metaTitle };
}

/** Chooses where to go after sign-in, or lets the user switch workspace. */
export default async function WorkspacesPage({ searchParams }: PageProps<"/espacios">) {
  const user = await getSessionUser();
  if (!user) redirect("/acceder");

  const memberships = await listUserOrganizations(user.uid);
  if (memberships.length === 0) {
    if (await hasOnlyBlockedMemberships(user.uid)) return <AccessState kind="account_blocked" />;
    const bootstrapUid = process.env.FIREBASE_BOOTSTRAP_ADMIN_UID;
    if (bootstrapUid && user.uid === bootstrapUid) redirect("/onboarding");
    return <AccessState kind="no_access" />;
  }

  const workspaces = listWorkspaces(memberships);
  const requested = (await searchParams).acceso;
  const lane =
    typeof requested === "string" && (lanes as readonly string[]).includes(requested)
      ? (requested as Lane)
      : null;
  const matching = lane ? workspaces.filter((workspace) => workspace.lane === lane) : workspaces;
  if (matching.length === 1 && matching[0]) redirect(getLaneHomePath(matching[0].lane));
  if (workspaces.length === 0) return <AccessState kind="no_access" />;
  const { t } = await getI18n();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{t.workspaces.title}</h1>
        <p>{t.workspaces.body}</p>
        <OrganizationPicker workspaces={matching.length > 0 ? matching : workspaces} />
      </section>
    </main>
  );
}
