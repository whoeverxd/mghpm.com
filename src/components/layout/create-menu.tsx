"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  Building2,
  ChevronDown,
  DoorOpen,
  FileSignature,
  KeyRound,
  Plus,
  ScrollText,
  UserPlus,
} from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { CreateMenuItem } from "@/lib/access/create-menu";
import styles from "./admin-shell.module.css";

const icons: Record<string, typeof Plus> = {
  "/admin/properties/new": Building2,
  "/admin/properties/[propertyId]/units/new": DoorOpen,
  "/admin/people/new": UserPlus,
  "/admin/leases/new": FileSignature,
  "/admin/ownerships/new": ScrollText,
  "/admin/users/new": KeyRound,
};

/** "+ Nuevo" button of the admin top bar. Items stay in the HTML (hidden) while closed. */
export function CreateMenu({ items }: { items: CreateMenuItem[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (items.length === 0) return null;

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const links = [...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const index = links.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      links[(index + step + links.length) % links.length]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.createMenu} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.createMenu.button}
        className={styles.createButton}
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        type="button"
      >
        <Plus aria-hidden="true" size={16} />
        <span className={styles.createLabel}>{t.createMenu.button}</span>
        <ChevronDown aria-hidden="true" className={styles.createLabel} size={14} />
      </button>
      <div
        aria-label={t.createMenu.menu}
        className={styles.createList}
        data-create-menu=""
        hidden={!open}
        id={menuId}
        onKeyDown={onMenuKeyDown}
        ref={menuRef}
        role="menu"
      >
        {items.map((item) => {
          const Icon = icons[item.key] ?? Plus;
          return (
            <Link
              className={styles.createItem}
              href={item.href}
              key={item.key}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <Icon aria-hidden="true" size={16} />
              {t.createMenu.items[item.name]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
