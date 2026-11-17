import { Compass, Heart, LogIn } from "lucide-react";
import Link from "next/link";
import {
  formatText,
  getStaysPath,
  type StaysDictionary,
  type StaysLocale,
} from "@/lib/stays/i18n";
import styles from "./stays.module.css";

export function StaysFooter({
  dictionary,
  locale,
}: {
  dictionary: StaysDictionary;
  locale: StaysLocale;
}) {
  const { home, nav } = dictionary;
  const base = getStaysPath(locale);
  const columns = [
    {
      title: home.footerStays,
      links: [
        { label: nav.explore, href: `${base}#estancias` },
        { label: nav.destinations, href: `${base}#destinos` },
        { label: nav.favorites, href: `${base}?saved=1#estancias` },
      ],
    },
    {
      title: home.footerAccess,
      links: [
        { label: nav.signIn, href: "/acceder" },
        { label: home.hostSecondary, href: "/" },
        { label: nav.staff, href: "/login" },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <strong>MGH STAYS</strong>
          <small>{nav.tagline}</small>
        </div>
        {columns.map((column) => (
          <div className={styles.footerColumn} key={column.title}>
            <span>{column.title}</span>
            {column.links.map((link) => (
              <Link href={link.href} key={link.label}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p className={styles.footerRights}>
        {formatText(home.rights, { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}

/** Bottom navigation shown only on phones (see .mobileTabs in the CSS). */
export function StaysMobileTabs({
  dictionary,
  locale,
}: {
  dictionary: StaysDictionary;
  locale: StaysLocale;
}) {
  const base = getStaysPath(locale);
  const tabs = [
    { label: dictionary.nav.explore, href: `${base}#estancias`, icon: Compass },
    { label: dictionary.nav.favorites, href: `${base}?saved=1#estancias`, icon: Heart },
    { label: dictionary.nav.signIn, href: "/acceder", icon: LogIn },
  ];
  return (
    <nav aria-label={dictionary.nav.label} className={styles.mobileTabs}>
      {tabs.map(({ label, href, icon: Icon }) => (
        <Link href={href} key={href}>
          <Icon aria-hidden="true" size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
