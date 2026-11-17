import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getStaysPath, type StaysDictionary, type StaysLocale } from "@/lib/stays/i18n";
import { LanguageSwitch } from "./language-switch";
import styles from "./stays.module.css";

export function StaysBrand({ locale, tagline }: { locale: StaysLocale; tagline: string }) {
  return (
    <Link className={styles.brand} href={getStaysPath(locale)}>
      <Image alt="" height={36} src="/logo-mark.png" width={36} />
      <span>
        <strong>MGH STAYS</strong>
        <small>{tagline}</small>
      </span>
    </Link>
  );
}

export function StaysHeader({
  dictionary,
  favoritesCount,
  locale,
}: {
  dictionary: StaysDictionary;
  favoritesCount: number;
  locale: StaysLocale;
}) {
  const t = dictionary.nav;
  const base = getStaysPath(locale);
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <StaysBrand locale={locale} tagline={t.tagline} />
        <nav aria-label={t.label} className={styles.headerNav}>
          <Link aria-current="page" href={base}>
            {t.home}
          </Link>
          <Link href={`${base}#estancias`}>{t.explore}</Link>
          <Link href={`${base}#destinos`}>{t.destinations}</Link>
          <Link href={`${base}?saved=1#estancias`}>
            {t.favorites}
            {favoritesCount > 0 && <span className={styles.navBadge}>{favoritesCount}</span>}
          </Link>
        </nav>
        <div className={styles.headerActions}>
          <Suspense>
            <LanguageSwitch current={locale} label={t.language} />
          </Suspense>
          <Link className={styles.signInLink} href="/acceder">
            {t.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
