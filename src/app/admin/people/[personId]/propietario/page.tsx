import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { ActivityList } from "@/components/people/activity-list";
import { PersonHeader } from "@/components/people/person-header";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { listRecentAuditEvents } from "@/lib/audit/recent";
import { getPropertySummaries } from "@/lib/ownerships/lookups";
import { listPersonOwnerships } from "@/lib/ownerships/records";
import { ownershipStatusLabels } from "@/lib/ownerships/labels";
import { getOrganizationPerson } from "@/lib/people/records";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "@/components/people/people-detail.module.css";

export const metadata: Metadata = {
  title: "Propietario",
};

type OwnerPageProps = {
  params: Promise<{ personId: string }>;
};

const dateFormat = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" });

function toDate(value: unknown) {
  const candidate = value as { toDate?: () => Date } | null | undefined;
  return typeof candidate?.toDate === "function" ? candidate.toDate() : null;
}

export default async function OwnerViewPage({ params }: OwnerPageProps) {
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

  if (!can(role, "people", "view") || !can(role, "ownerships", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar titularidades." />
      </AdminShell>
    );
  }

  const person = await getOrganizationPerson(organizationId, personId);
  if (!person || !person.relationships.owner) notFound();

  const [ownerships, activity] = await Promise.all([
    listPersonOwnerships(organizationId, [person.id]),
    listRecentAuditEvents(organizationId, person.id),
  ]);
  const properties = await getPropertySummaries(
    organizationId,
    ownerships.map((ownership) => ownership.propertyId),
  );
  const active = ownerships.filter((ownership) => ownership.active);
  const verified = active.filter((ownership) => ownership.status === "verified");
  const inReview = active.filter((ownership) => ownership.status === "in_review");
  const rows = [...ownerships].sort((left, right) => Number(right.active) - Number(left.active));

  return (
    <AdminShell {...shellProps} crumbNames={{ personId: person?.name ?? "" }}>
      <section aria-label="Propietario" className={styles.content}>
        <PersonHeader canEdit={can(role, "people", "update")} person={person} section="owner" />

        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <span>Titularidades activas</span>
            <strong>{active.length}</strong>
          </div>
          <div className={styles.kpi}>
            <span>Verificadas</span>
            <strong>{verified.length}</strong>
          </div>
          <div className={styles.kpi}>
            <span>Pendientes de revisión</span>
            <strong>{inReview.length}</strong>
          </div>
        </div>

        <section aria-labelledby="ownerships-title" className={styles.card}>
          <div className={styles.sectionHeading}>
            <h2 id="ownerships-title">Titularidades</h2>
            {can(role, "ownerships", "create") && (
              <Link
                className={styles.primaryButton}
                href={`/admin/ownerships/new?personId=${encodeURIComponent(person.id)}`}
              >
                <Plus aria-hidden="true" size={16} />
                Agregar propiedad
              </Link>
            )}
          </div>
          {rows.length === 0 ? (
            <p className={styles.empty}>Esta persona aún no tiene propiedades asignadas.</p>
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Propiedad</th>
                    <th className={styles.numeric} scope="col">%</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Última revisión</th>
                    <th scope="col">
                      <span style={{ position: "absolute", left: -9999 }}>Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((ownership) => {
                    const property = properties.get(ownership.propertyId);
                    const reviewedAt = toDate(ownership.reviewedAt);
                    return (
                      <tr key={ownership.id}>
                        <td>
                          {property ? (
                            <Link
                              className={styles.link}
                              href={`/admin/properties/${encodeURIComponent(property.id)}`}
                            >
                              {property.name}
                            </Link>
                          ) : (
                            "Propiedad no disponible"
                          )}
                          {property?.archived && <small> · propiedad archivada</small>}
                        </td>
                        <td className={styles.numeric}>{ownership.pct} %</td>
                        <td>
                          {ownershipStatusLabels[ownership.status]}
                          {!ownership.active && <small> · Finalizada</small>}
                        </td>
                        <td>{reviewedAt ? dateFormat.format(reviewedAt) : "—"}</td>
                        <td>
                          <Link
                            className={styles.link}
                            href={`/admin/ownerships/${encodeURIComponent(ownership.id)}`}
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
