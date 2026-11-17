import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ClientTexts } from "@/components/i18n/client-texts";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";
import { getSessionUser } from "@/lib/auth/session";
import { getOrganizationAccess } from "@/lib/auth/organization";
import { getI18n } from "@/lib/i18n/server";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.metaTitle };
}

export default async function OrganizationOnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const access = await getOrganizationAccess(user.uid);
  if (access.memberships.length > 0) {
    redirect(access.activeOrganization ? "/admin" : "/espacios");
  }

  const { t } = await getI18n();
  const canBootstrap =
    Boolean(process.env.FIREBASE_BOOTSTRAP_ADMIN_UID) &&
    user.uid === process.env.FIREBASE_BOOTSTRAP_ADMIN_UID;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <Image src="/logo-mark.png" alt="" width={46} height={46} />
          <span>MGHPM Property Management</span>
        </div>
        {canBootstrap ? (
          <>
            <p className={styles.eyebrow}>{t.onboarding.setupEyebrow}</p>
            <h1>{t.onboarding.setupTitle}</h1>
            <p className={styles.description}>{t.onboarding.setupBody}</p>
            <ClientTexts namespaces={["onboarding"]}>
              <CreateOrganizationForm />
            </ClientTexts>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>{t.onboarding.inviteEyebrow}</p>
            <h1>{t.onboarding.inviteTitle}</h1>
            <p className={styles.description}>{t.onboarding.inviteBody}</p>
            <p className={styles.account}>{user.email}</p>
          </>
        )}
      </section>
    </main>
  );
}
