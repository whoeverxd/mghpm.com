import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityList } from "@/components/people/activity-list";
import { PersonHeader } from "@/components/people/person-header";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { listRecentAuditEvents } from "@/lib/audit/recent";
import { leaseStatusLabels } from "@/lib/leases/labels";
import { listTenantLeases } from "@/lib/leases/list";
import { formatLeaseDate, formatMinorUnits } from "@/lib/leases/terms";
import { getOrganizationPerson } from "@/lib/people/records";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "@/components/people/people-detail.module.css";

export const metadata: Metadata = {
  title: "Inquilino",
};

type TenantPageProps = {
  params: Promise<{ personId: string }>;
};

export default async function TenantViewPage({ params }: TenantPageProps) {
  const { personId } = await params;
  if (!recordIdSchema.safeParse(personId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;
  const role = access.activeOrganization.role;
  const organizationId = access.activeOrganization.organizationId;

  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };

  if (!can(role, "people", "view") || !can(role, "leases", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar contratos." />
      </AdminShell>
    );
  }

  // Active or ended: the relationship record is enough to open the view.
  const person = await getOrganizationPerson(organizationId, personId);
  if (!person || !person.relationships.tenant) notFound();

  const [leases, activity] = await Promise.all([
    listTenantLeases(organizationId, person.id),
    listRecentAuditEvents(organizationId, person.id),
  ]);
  const activeLease = leases.find((lease) => lease.status === "active") ?? null;

  return (
    <AdminShell {...shellProps} crumbNames={{ personId: person?.name ?? "" }}>
      <section aria-label="Inquilino" className={styles.content}>
        <PersonHeader canEdit={can(role, "people", "update")} person={person} section="tenant" />

        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <span>Renta</span>
            <strong>
              {activeLease ? formatMinorUnits(activeLease.rentMinor, activeLease.currency) : "—"}
            </strong>
          </div>
          <div className={styles.kpi}>
            <span>Fin del contrato</span>
            <strong>{activeLease ? formatLeaseDate(activeLease.endDate) : "—"}</strong>
          </div>
          <div className={styles.kpi}>
            <span>Depósito</span>
            <strong>
              {activeLease
                ? formatMinorUnits(activeLease.securityDepositMinor, activeLease.currency)
                : "—"}
            </strong>
          </div>
        </div>

        <section aria-labelledby="leases-title" className={styles.card}>
          <h2 id="leases-title">Contratos</h2>
          {leases.length === 0 ? (
            <p className={styles.empty}>Esta persona aún no tiene contratos.</p>
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Contrato</th>
                    <th scope="col">Propiedad / unidad</th>
                    <th scope="col">Inicio</th>
                    <th scope="col">Fin</th>
                    <th className={styles.numeric} scope="col">Renta</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((lease) => (
                    <tr key={lease.id}>
                      <td>
                        <Link
                          className={styles.link}
                          href={`/admin/leases/${encodeURIComponent(lease.id)}`}
                        >
                          {lease.code}
                        </Link>
                      </td>
                      <td>
                        {lease.propertyName} · {lease.unitLabel}
                      </td>
                      <td>{formatLeaseDate(lease.startDate)}</td>
                      <td>{formatLeaseDate(lease.endDate)}</td>
                      <td className={styles.numeric}>
                        {formatMinorUnits(lease.rentMinor, lease.currency)}
                      </td>
                      <td>{leaseStatusLabels[lease.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ActivityList entries={activity} />
      </section>
    </AdminShell>
  );
}
