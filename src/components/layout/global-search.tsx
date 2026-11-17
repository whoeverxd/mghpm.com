"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { interpolate } from "@/lib/i18n/locales";
import type { SearchGroup } from "@/lib/search/global";
import { cleanSearchText, SEARCH_MAX_LENGTH, searchPageHref } from "@/lib/search/modules";
import styles from "./admin-shell.module.css";

const DEBOUNCE_MS = 250;

type Status = "idle" | "loading" | "done" | "error";

const subscribeNoop = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.platform);

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Top-bar search over properties, people and leases (paso 4C). */
export function GlobalSearch() {
  const router = useRouter();
  const { t } = useI18n();
  const listId = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const apple = useSyncExternalStore(subscribeNoop, isApplePlatform, () => false);

  const items = groups.flatMap((group) => group.items);
  const query = cleanSearchText(value);

  // Ctrl/⌘+K anywhere, or "/" outside text fields, focuses the search.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const shortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (shortcut || (event.key === "/" && !isTypingTarget(event.target))) {
        event.preventDefault();
        setExpanded(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestRef.current?.abort();
    },
    [],
  );

  async function runSearch(text: string) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Search failed with ${response.status}`);
      const body = (await response.json()) as { groups: SearchGroup[] };
      setGroups(body.groups);
      setActive(-1);
      setStatus("done");
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Global search request failed.", error);
      setStatus("error");
    }
  }

  function onChange(next: string) {
    setValue(next);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    const text = cleanSearchText(next);
    if (!text) {
      requestRef.current?.abort();
      setGroups([]);
      setStatus("idle");
      return;
    }
    timerRef.current = setTimeout(() => void runSearch(text), DEBOUNCE_MS);
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function go(href: string) {
    close();
    setExpanded(false);
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      // Cycles through -1 (the input itself) and every option.
      setActive((current) => {
        const next = current + step;
        if (next < -1) return items.length - 1;
        return next >= items.length ? -1 : next;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && items[active]) go(items[active].href);
      else if (query) go(searchPageHref(query));
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        close();
      } else {
        setExpanded(false);
        inputRef.current?.blur();
      }
    }
  }

  const showPanel = open && Boolean(query);
  const optionId = (index: number) => `${listId}-option-${index}`;
  const offsets = groups.map((_, groupIndex) =>
    groups.slice(0, groupIndex).reduce((sum, group) => sum + group.items.length, 0),
  );

  return (
    <div className={styles.search} data-expanded={expanded} ref={rootRef}>
      <button
        aria-label={t.search.toggle}
        className={styles.searchToggle}
        onClick={() => {
          setExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        type="button"
      >
        <Search aria-hidden="true" size={18} />
      </button>
      <div className={styles.searchBox} role="search">
        <Search aria-hidden="true" className={styles.searchIcon} size={16} />
        <input
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          aria-label={t.search.inputLabel}
          autoComplete="off"
          maxLength={SEARCH_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t.search.placeholder}
          ref={inputRef}
          role="combobox"
          type="search"
          value={value}
        />
        <kbd className={styles.searchShortcut}>{apple ? t.search.shortcut.apple : t.search.shortcut.other}</kbd>
        <button
          aria-label={t.search.close}
          className={styles.searchClose}
          onClick={() => {
            close();
            setExpanded(false);
          }}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      <div className={styles.searchPanel} hidden={!showPanel}>
        <div aria-label={t.search.results} id={listId} role="listbox">
          {groups.map((group, groupIndex) => (
            <div aria-label={t.search.modules[group.module]} key={group.module} role="group">
              <p className={styles.searchGroupTitle}>{t.search.modules[group.module]}</p>
              {group.unavailable ? (
                <p className={styles.searchNote}>{t.search.unavailable}</p>
              ) : group.items.length === 0 ? (
                <p className={styles.searchNote}>{t.search.noResultsInGroup}</p>
              ) : (
                group.items.map((item, itemIndex) => {
                  const current = offsets[groupIndex]! + itemIndex;
                  return (
                    <Link
                      aria-selected={current === active}
                      className={styles.searchOption}
                      href={item.href}
                      id={optionId(current)}
                      key={`${group.module}-${item.id}`}
                      onClick={() => {
                        close();
                        setExpanded(false);
                      }}
                      onMouseEnter={() => setActive(current)}
                      role="option"
                    >
                      <span className={styles.searchOptionLabel}>{item.label}</span>
                      {item.sublabel && <span className={styles.searchOptionSub}>{item.sublabel}</span>}
                    </Link>
                  );
                })
              )}
            </div>
          ))}
        </div>
        <p aria-live="polite" className={styles.searchStatus}>
          {status === "loading"
            ? t.search.searching
            : status === "error"
              ? t.search.error
              : status === "done" && items.length === 0 && groups.every((group) => !group.unavailable)
                ? interpolate(t.search.noResultsFor, { query })
                : ""}
        </p>
        <Link
          className={styles.searchAll}
          href={searchPageHref(query)}
          onClick={() => {
            close();
            setExpanded(false);
          }}
        >
          {t.search.seeAll}
        </Link>
      </div>
    </div>
  );
}
