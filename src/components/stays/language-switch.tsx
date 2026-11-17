"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { staysLocales, switchStaysPath, type StaysLocale } from "@/lib/stays/i18n";
import styles from "./stays.module.css";

/** Links to the same page in each language (/stays ↔ /estancias), keeping the search. */
export function LanguageSwitch({ current, label }: { current: StaysLocale; label: string }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();

  return (
    <div aria-label={label} className={styles.languageSwitch} role="group">
      {staysLocales.map((locale) => (
        <Link
          aria-current={locale === current ? "true" : undefined}
          href={`${switchStaysPath(pathname, locale)}${query ? `?${query}` : ""}`}
          key={locale}
          lang={locale}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
