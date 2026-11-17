"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  FileSignature,
  History,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";
import type { OrganizationMembership } from "@/lib/auth/organization";
import { buildBreadcrumbs } from "@/lib/access/breadcrumbs";
import { buildCreateMenu } from "@/lib/access/create-menu";
import { can } from "@/lib/access/permissions";
import { adminNavigation, adminNavigationSections } from "@/lib/access/route-permissions";
import styles from "./admin-shell.module.css";
import { CreateMenu } from "./create-menu";
import { GlobalSearch } from "./global-search";
import { UserMenu } from "./user-menu";

const navigationIcons: Record<(typeof adminNavigation)[number]["href"], typeof LayoutDashboard> = {
  "/admin": LayoutDashboard,
  "/admin/properties": Building2,
  "/admin/ownerships": ScrollText,
  "/admin/people": Users,
  "/admin/leases": FileSignature,
  "/admin/stay-inquiries": Inbox,
  "/admin/users": KeyRound,
  "/admin/audit": History,
};

type AdminShellProps = {
  activeOrganizationId: string;
  organizations: OrganizationMembership[];
  userEmail: string | null;
  userName: string | null;
  /** Names for the `{param}` placeholders of the breadcrumb (e.g. `{ propertyId: "Torre A" }`). */
  crumbNames?: Record<string, string>;
  children: React.ReactNode;
};

export function AdminShell({
  activeOrganizationId,
  organizations,
  userEmail,
  userName,
  crumbNames,
  children,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const displayName = userName ?? userEmail ?? t.shell.userFallback;
  const activeRole = organizations.find(
    (organization) => organization.organizationId === activeOrganizationId,
  )?.role;
  const crumbs = buildBreadcrumbs(pathname, crumbNames ?? {}, { routes: t.routes, ...t.breadcrumbs });
  const sections = adminNavigationSections
    .map((section) => ({
      key: section.key,
      items: section.items.filter((item) => can(activeRole ?? null, item.module, "view")),
    }))
    .filter((section) => section.items.length > 0);
  const isCurrent = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={styles.shell} data-collapsed={collapsed}>
      <a className={styles.skipLink} href="#main-content">
        {t.shell.skipToContent}
      </a>

      {mobileOpen && (
        <button
          aria-label={t.shell.closeNavigation}
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <aside
        aria-label={t.shell.mainNavigation}
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brandRow}>
          <Link
            aria-label={t.shell.brandHome}
            className={styles.brand}
            href="/admin"
            onClick={() => setMobileOpen(false)}
          >
            <Image alt="" height={36} src="/logo-mark.png" width={36} />
            <span className={styles.brandName}>MGHPM</span>
          </Link>
          <button
            aria-label={t.shell.closeNavigation}
            className={styles.closeButton}
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className={styles.orgBlock}>
          <span className={styles.orgLabel}>{t.workspaces.organization}</span>
          <OrganizationSwitcher
            activeOrganizationId={activeOrganizationId}
            organizations={organizations}
          />
        </div>

        <nav className={styles.navigation}>
          {sections.map((section) => (
            <div className={styles.navSection} key={section.key}>
              <p className={styles.navSectionTitle}>{t.nav.sections[section.key]}</p>
              {section.items.map(({ href }) => {
                const Icon = navigationIcons[href];
                const label = t.routes[href];
                return (
                  <Link
                    aria-current={isCurrent(href) ? "page" : undefined}
                    className={styles.navItem}
                    href={href}
                    key={href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? label : undefined}
                  >
                    <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                    <span className={styles.navLabel}>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbArea}>
            <button
              aria-label={mobileOpen ? t.shell.closeNavigation : t.shell.openNavigation}
              aria-expanded={mobileOpen}
              className={styles.mobileMenuButton}
              onClick={() => setMobileOpen((value) => !value)}
              type="button"
            >
              {mobileOpen ? (
                <X aria-hidden="true" size={20} />
              ) : (
                <Menu aria-hidden="true" size={20} />
              )}
            </button>
            <button
              aria-label={collapsed ? t.shell.expandNavigation : t.shell.collapseNavigation}
              aria-expanded={!collapsed}
              className={styles.desktopMenuButton}
              onClick={() => setCollapsed((value) => !value)}
              type="button"
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" size={18} />
              ) : (
                <PanelLeftClose aria-hidden="true" size={18} />
              )}
            </button>
            <nav aria-label={t.shell.breadcrumbs} className={styles.breadcrumb}>
              <ol>
                {crumbs.length > 2 && (
                  <li aria-hidden="true" className={styles.crumbEllipsis}>
                    …
                  </li>
                )}
                {crumbs.map((crumb, index) => (
                  <li
                    className={index < crumbs.length - 2 ? styles.crumbCollapsible : undefined}
                    key={`${index}-${crumb.label}`}
                  >
                    {crumb.href ? (
                      <Link href={crumb.href} title={crumb.label}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current="page" title={crumb.label}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className={styles.userActions}>
            {/* Global search (4C) and "+ Nuevo" (4B). */}
            <div className={styles.topbarTools}>
              <GlobalSearch />
              <CreateMenu items={buildCreateMenu(pathname, activeRole ?? null)} />
            </div>
            <UserMenu email={userEmail} name={displayName} />
          </div>
        </header>

        <main className={styles.pageContent} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
