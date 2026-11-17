import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Home, KeyRound, Luggage, UserPlus } from "lucide-react";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import { getI18n } from "@/lib/i18n/server";
import styles from "@/components/access/access-state.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.accessChooser.metaTitle };
}

const items = [
  { lane: "admin", href: "/login?acceso=admin", icon: Briefcase },
  { lane: "owner", href: "/login?acceso=owner", icon: Home },
  { lane: "tenant", href: "/login?acceso=tenant", icon: KeyRound },
  { lane: "applicant", href: null, icon: UserPlus },
  { lane: "guest", href: null, icon: Luggage },
] as const;

export default async function AccessChooserPage({ searchParams }: PageProps<"/acceder">) {
  const params = await searchParams;
  const { t } = await getI18n();
  const expired = params.motivo === "sesion-expirada";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{t.accessChooser.title}</h1>
        {expired && <p role="status">{t.accessChooser.expired}</p>}
        <ul className={styles.choices}>
          {items.map(({ lane, href, icon: Icon }) => (
            <li key={lane}>
              {href ? (
                <Link className={styles.choice} href={href}>
                  <Icon aria-hidden="true" size={18} /> {t.accessChooser.items[lane]}
                </Link>
              ) : (
                <span aria-disabled="true" className={`${styles.choice} ${styles.choiceDisabled}`}>
                  <Icon aria-hidden="true" size={18} /> {t.accessChooser.items[lane]} · {t.accessChooser.soon}
                </span>
              )}
            </li>
          ))}
        </ul>
        <LocaleSwitch />
      </section>
    </main>
  );
}
