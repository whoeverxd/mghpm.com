"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import styles from "./admin-shell.module.css";

/** Avatar in the top-right corner; opens the account menu (language, sign out). */
export function UserMenu({ name, email }: { name: string; email: string | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initial = name.slice(0, 1).toUpperCase() || "U";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.userMenu} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t.shell.accountMenu}: ${name}`}
        className={styles.avatarButton}
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        title={name}
        type="button"
      >
        {initial}
      </button>
      <div className={styles.userPanel} data-user-menu="" hidden={!open} id={panelId}>
        <div className={styles.userIdentity}>
          <span className={styles.userAvatarLarge} aria-hidden="true">
            {initial}
          </span>
          <span className={styles.userText}>
            <strong>{name}</strong>
            {email && email !== name && <small>{email}</small>}
          </span>
        </div>
        <div className={styles.userRow}>
          <span>{t.shell.language}</span>
          <LocaleSwitch />
        </div>
        <div className={styles.userLogout}>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
