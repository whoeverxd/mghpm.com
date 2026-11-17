import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ScrollText } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { ownershipStatusLabels } from "@/lib/ownerships/labels";
import { listOwnerships, OwnershipsIndexUnavailableError } from "@/lib/ownerships/list";
import { ownershipListFilters, parseOwnershipListFilter } from "@/lib/ownerships/list-filters";
import { getPersonSummaries, getPropertySummaries } from "@/lib/ownerships/lookups";
import type { OwnershipStatus } from "@/lib/ownerships/rules";
import listStyles from "../properties/page.module.css";

export const metadata: Metadata = { title: "Titularidades" };

const statusClasses = {
  not_started: "status_draft",
  documents_pending: "status_maintenance",
  in_review: "status_maintenance",
  verified: "status_active",
  rejected: "status_inactive",
} as const satisfies Record<OwnershipStatus, string>;

type OwnershipsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnershipsPage({ searchParams }: OwnershipsPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const { user, activeOrganization } = gate;
  const organizationId = activeOrganization.organizationId;
  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: gate.memberships,
    userEmail: user.email,
    userName: user.name,
  };
  if (!can(activeOrganization.role, "ownerships", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const query = await searchParams;
  const filter = parseOwnershipListFilter(query.estado);
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  let page;
  try {
    page = await listOwnerships(organizationId, filter, cursor);
  } catch (error) {
    if (!(error instanceof OwnershipsIndexUnavailableError)) throw error;
    return (
      <AdminShell {...shellProps}>
        <section className={listStyles.content}>
          <div className={listStyles.stateCard} role="status">
            <h1>Titularidades</h1>
            <p>
              {error.reason === "building"
                ? "El índice de titularidades se está creando. Vuelve a intentarlo en unos minutos."
                : "Falta un índice de Firestore para esta vista. Avísale al administrador del sistema."}
            </p>
          </div>
        </section>
      </AdminShell>
    );
  }
  const [properties, people] = await Promise.all([
    getPropertySummaries(organizationId, page.rows.map((row) => row.propertyId)),
    getPersonSummaries(organizationId, page.rows.map((row) => row.personId)),
  ]);

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <div>
            <p className={listStyles.eyebrow}>CARTERA</p>
            <h1>Titularidades</h1>
            <p>Quién es dueño de cada propiedad, en qué porcentaje y en qué estado de verificación.</p>
          </div>
          {can(activeOrganization.role, "ownerships", "create") && (
            <div className={listStyles.headingActions}>
              <Link className={listStyles.applyButton} href="/admin/ownerships/new">
                <Plus aria-hidden="true" size={16} /> Nueva titularidad
              </Link>
            </div>
          )}
        </div>

        <section aria-label="Titularidades" className={listStyles.listCard}>
          <form action="/admin/ownerships" className={listStyles.filters} method="get">
            <label className={listStyles.filterField}>
              <span>Estado</span>
              <select defaultValue={filter} name="estado">
                {Object.entries(ownershipListFilters).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={listStyles.filterActions}>
              <button className={listStyles.applyButton} type="submit">
                Aplicar
              </button>
              <Link className={listStyles.resetLink} href="/admin/ownerships">
                Limpiar
              </Link>
            </div>
          </form>

          {page.rows.length > 0 ? (
            <div className={listStyles.tableScroller}>
              <table className={listStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">Propiedad</th>
                    <th scope="col">Titular</th>
                    <th scope="col">%</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Inicio</th>
                    <th scope="col">Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/admin/ownerships/${encodeURIComponent(row.id)}`}>
                          {properties.get(row.propertyId)?.name ?? "Propiedad no disponible"}
                        </Link>
                      </td>
                      <td>{people.get(row.personId)?.name ?? "Persona no disponible"}</td>
                      <td className={listStyles.numericCell}>{row.pct}%</td>
                      <td>
                        {row.active ? (
                          <span className={`${listStyles.statusBadge} ${listStyles[statusClasses[row.status]]}`}>
                            {ownershipStatusLabels[row.status]}
                          </span>
                        ) : (
                          <span className={`${listStyles.statusBadge} ${listStyles.status_inactive}`}>Finalizada</span>
                        )}
                      </td>
                      <td>{row.startDate}</td>
                      <td>{row.endDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={listStyles.emptyState}>
              <span className={listStyles.stateIcon}>
                <ScrollText aria-hidden="true" size={23} />
              </span>
              <h3>No hay titularidades en esta vista</h3>
              <p>Cambia el filtro o registra una titularidad nueva.</p>
            </div>
          )}

          {(cursor || page.nextCursor) && (
            <nav aria-label="Paginación" className={listStyles.pagination}>
              {cursor && (
                <Link className={listStyles.pageButton} href={`/admin/ownerships?estado=${filter}`}>
                  Primera página
                </Link>
              )}
              {page.nextCursor && (
                <Link
                  className={listStyles.pageButton}
                  href={`/admin/ownerships?estado=${filter}&cursor=${encodeURIComponent(page.nextCursor)}`}
                >
                  Siguiente página
                </Link>
              )}
            </nav>
          )}
        </section>
      </section>
    </AdminShell>
  );
}
