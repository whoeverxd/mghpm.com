"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestCsrfToken } from "@/components/auth/client-security";
import { locales, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "./i18n-provider";
import styles from "./locale-switch.module.css";

/** ES | EN selector: saves the preference (cookie + user profile) and re-renders. */
export function LocaleSwitch({ className }: { className?: string }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function choose(next: Locale) {
    if (next === locale || busy) return;
    setBusy(true);
    setError(false);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/preferences/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ locale: next }),
      });
      if (!response.ok) throw new Error(`Locale preference failed with ${response.status}`);
      router.refresh();
    } catch (cause) {
      console.error("Unable to save the language preference.", cause);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div aria-label={t.localeSwitch.label} className={`${styles.switch} ${className ?? ""}`} role="group">
      {locales.map((option) => (
        <button
          aria-label={t.localeSwitch.options[option].name}
          aria-pressed={option === locale}
          className={styles.option}
          disabled={busy}
          key={option}
          lang={option}
          onClick={() => void choose(option)}
          type="button"
        >
          {t.localeSwitch.options[option].short}
        </button>
      ))}
      {error && (
        <span className={styles.error} role="alert">
          {t.localeSwitch.error}
        </span>
      )}
    </div>
  );
}
