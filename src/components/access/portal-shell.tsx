import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import { getLaneHomePath, type Lane } from "@/lib/access/permissions";
import { getI18n } from "@/lib/i18n/server";
import styles from "./portal-shell.module.css";

const laneLinks: Partial<Record<Exclude<Lane, "admin">, { href: string; label: "ownerProperties" | "tenantLease" }>> = {
  owner: { href: "/propietario/propiedades", label: "ownerProperties" },
  tenant: { href: "/inquilino/contrato", label: "tenantLease" },
};

type PortalShellProps = {
  lane: Exclude<Lane, "admin">;
  organizationName: string;
  userName: string | null;
  userEmail: string | null;
  canSwitch: boolean;
  children: React.ReactNode;
};

/** External portal frame: own navigation only, never the internal admin menu. */
export async function PortalShell({ lane, organizationName, userName, userEmail, canSwitch, children }: PortalShellProps) {
  const { t } = await getI18n();
  const home = getLaneHomePath(lane);
  const laneLink = laneLinks[lane];
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href={home}>
            <Image alt="" height={34} src="/logo-mark.png" width={34} />
            <span>
              <strong>{t.lanes[lane]}</strong>
              <small>{organizationName}</small>
            </span>
          </Link>
          <nav aria-label={t.portal.navigation} className={styles.nav}>
            <Link href={home}>{t.portal.home}</Link>
            {laneLink && <Link href={laneLink.href}>{t.portal[laneLink.label]}</Link>}
            <Link href={`${home}/perfil`}>{t.portal.profile}</Link>
          </nav>
          <div className={styles.account}>
            {canSwitch && (
              <Link className={styles.switch} href="/espacios">
                {t.portal.switchWorkspace}
              </Link>
            )}
            <LocaleSwitch />
            <span className={styles.user}>{userName ?? userEmail}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
