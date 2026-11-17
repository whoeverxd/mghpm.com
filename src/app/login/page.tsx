import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ClientTexts } from "@/components/i18n/client-texts";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import { getSessionUser } from "@/lib/auth/session";
import { lanes, type Lane } from "@/lib/access/permissions";
import { getI18n } from "@/lib/i18n/server";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.login.metaTitle };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const requested = (await searchParams).acceso;
  const lane =
    typeof requested === "string" && (lanes as readonly string[]).includes(requested)
      ? (requested as Lane)
      : undefined;

  const { t } = await getI18n();
  const user = await getSessionUser();
  if (user) {
    redirect(lane ? `/espacios?acceso=${lane}` : "/espacios");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.brand}>
          <Image
            src="/logo-mark.png"
            alt=""
            width={52}
            height={52}
            priority
          />
          <div>
            <p className={styles.brandName}>My Global Hub</p>
            <p className={styles.brandProduct}>Property Management</p>
          </div>
        </div>

        <div className={styles.heading}>
          <p className={styles.eyebrow}>
            {lane ? t.lanes[lane].toUpperCase() : "MY GLOBAL HUB"}
          </p>
          <h1 id="login-title">{t.login.title}</h1>
          <p>{t.login.subtitle}</p>
        </div>

        <ClientTexts namespaces={["login"]}>
          <LoginForm lane={lane} />
        </ClientTexts>

        <footer className={styles.footer}>
          <span>{t.login.secure}</span>
          <span aria-hidden="true">·</span>
          <LocaleSwitch />
        </footer>
      </section>
      <p className={styles.copyright}>© {new Date().getFullYear()} My Global Hub</p>
    </main>
  );
}
