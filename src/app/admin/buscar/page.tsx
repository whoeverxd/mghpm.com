import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { interpolate } from "@/lib/i18n/locales";
import { getI18n } from "@/lib/i18n/server";
import { searchEverything } from "@/lib/search/global";
import { cleanSearchText, SEARCH_MIN_LENGTH, SEARCH_PAGE_LIMIT } from "@/lib/search/modules";
import listStyles from "../properties/page.module.css";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.search.page.title };
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const { user, activeOrganization } = gate;
  const shellProps = {
    activeOrganizationId: activeOrganization.organizationId,
    organizations: gate.memberships,
    userEmail: user.email,
    userName: user.name,
  };
  if (!can(activeOrganization.role, "dashboard", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const { t } = await getI18n();
  const text = t.search.page;
  const { q } = await searchParams;
  const raw = typeof q === "string" ? q : "";
  const query = cleanSearchText(raw);
  const groups = query
    ? await searchEverything(activeOrganization.organizationId, activeOrganization.role, query, SEARCH_PAGE_LIMIT)
    : [];
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <div>
            <p className={listStyles.eyebrow}>{text.eyebrow}</p>
            <h1>{text.title}</h1>
            <p>{text.body}</p>
          </div>
        </div>

        <section aria-label={text.sectionLabel} className={listStyles.listCard}>
          <form action="/admin/buscar" className={listStyles.filters} method="get" role="search">
            <label className={listStyles.filterField}>
              <span>{text.field}</span>
              <input defaultValue={raw} maxLength={80} name="q" placeholder={text.fieldPlaceholder} type="search" />
            </label>
            <div className={listStyles.filterActions}>
              <button className={listStyles.applyButton} type="submit">
                {text.submit}
              </button>
            </div>
          </form>

          {!query ? (
            <div className={listStyles.emptyState}>
              <span className={listStyles.stateIcon}>
                <Search aria-hidden="true" size={23} />
              </span>
              <h3>{text.emptyTitle}</h3>
              <p>{interpolate(text.emptyBody, { min: SEARCH_MIN_LENGTH })}</p>
            </div>
          ) : total === 0 && groups.every((group) => !group.unavailable) ? (
            <div className={listStyles.emptyState}>
              <span className={listStyles.stateIcon}>
                <Search aria-hidden="true" size={23} />
              </span>
              <h3>{interpolate(text.noResultsTitle, { query })}</h3>
              <p>{text.noResultsBody}</p>
            </div>
          ) : (
            groups.map((group) => (
              <section aria-labelledby={`group-${group.module}`} data-search-group={group.module} key={group.module}>
                <div className={listStyles.cardHeading}>
                  <h2 id={`group-${group.module}`}>
                    {t.search.modules[group.module]} <span className={styles.count}>({group.items.length})</span>
                  </h2>
                  <Link href={group.listHref}>{text.seeInList}</Link>
                </div>
                {group.unavailable ? (
                  <p className={styles.note} role="status">
                    {interpolate(text.groupUnavailable, { module: t.search.modules[group.module].toLowerCase() })}
                  </p>
                ) : group.items.length === 0 ? (
                  <p className={styles.note}>{t.search.noResultsInGroup}</p>
                ) : (
                  <ul className={styles.results}>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href}>
                          <strong>{item.label}</strong>
                          {item.sublabel && <span className={listStyles.muted}> · {item.sublabel}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </section>
      </section>
    </AdminShell>
  );
}
