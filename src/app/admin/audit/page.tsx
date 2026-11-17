import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { auditAreaLabels, auditAreas, type AuditArea } from "@/lib/audit/area";
import { getAuditActionLabel } from "@/lib/audit/labels";
import { AuditIndexUnavailableError, getActorNames, listAuditEvents } from "@/lib/audit/list";
import listStyles from "../properties/page.module.css";

export const metadata: Metadata = { title: "Auditoría" };

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
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
  if (!can(activeOrganization.role, "audit", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const query = await searchParams;
  const area = (auditAreas as readonly unknown[]).includes(query.area) ? (query.area as AuditArea) : null;
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  let page;
  try {
    page = await listAuditEvents(organizationId, area, cursor);
  } catch (error) {
    if (!(error instanceof AuditIndexUnavailableError)) throw error;
    return (
      <AdminShell {...shellProps}>
        <section className={listStyles.content}>
          <div className={listStyles.stateCard} role="status">
            <h1>Auditoría</h1>
            <p>
              {error.reason === "building"
                ? "El índice de auditoría se está creando. Vuelve a intentarlo en unos minutos."
                : "Falta un índice de Firestore para esta vista. Avísale al administrador del sistema."}
            </p>
          </div>
        </section>
      </AdminShell>
    );
  }
  const actors = await getActorNames(page.rows.map((row) => row.actorUid));
  const dateFormatter = new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: activeOrganization.timeZone,
  });
  const areaQuery = area ? `area=${area}` : "";

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <div>
            <p className={listStyles.eyebrow}>ADMINISTRACIÓN</p>
            <h1>Auditoría</h1>
            <p>Cada cambio registrado en la organización, del más reciente al más antiguo.</p>
          </div>
        </div>

        <section aria-label="Eventos de auditoría" className={listStyles.listCard}>
          <form action="/admin/audit" className={listStyles.filters} method="get">
            <label className={listStyles.filterField}>
              <span>Área</span>
              <select defaultValue={area ?? ""} name="area">
                <option value="">Todas</option>
                {auditAreas.map((item) => (
                  <option key={item} value={item}>
                    {auditAreaLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <div className={listStyles.filterActions}>
              <button className={listStyles.applyButton} type="submit">
                Aplicar
              </button>
              <Link className={listStyles.resetLink} href="/admin/audit">
                Limpiar
              </Link>
            </div>
          </form>

          {page.rows.length > 0 ? (
            <div className={listStyles.tableScroller}>
              <table className={listStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Usuario</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Área</th>
                    <th scope="col">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.createdAt ? dateFormatter.format(row.createdAt) : "—"}</td>
                      <td>{actors.get(row.actorUid) ?? row.actorUid}</td>
                      <td>
                        {getAuditActionLabel(row.action)}
                        {row.details.length > 0 && (
                          <details>
                            <summary className={listStyles.muted}>Detalle</summary>
                            <dl>
                              {row.details.map((detail) => (
                                <div key={detail.label}>
                                  <dt>{detail.label}</dt>
                                  <dd>{detail.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </details>
                        )}
                      </td>
                      <td>{row.area ? auditAreaLabels[row.area] : "—"}</td>
                      <td>{row.href ? <Link href={row.href}>Abrir</Link> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={listStyles.emptyState}>
              <span className={listStyles.stateIcon}>
                <History aria-hidden="true" size={23} />
              </span>
              <h3>No hay eventos en esta vista</h3>
              <p>Los cambios que haga el equipo aparecerán aquí.</p>
            </div>
          )}

          {(cursor || page.nextCursor) && (
            <nav aria-label="Paginación" className={listStyles.pagination}>
              {cursor && (
                <Link className={listStyles.pageButton} href={`/admin/audit?${areaQuery}`}>
                  Primera página
                </Link>
              )}
              {page.nextCursor && (
                <Link
                  className={listStyles.pageButton}
                  href={`/admin/audit?${areaQuery}${areaQuery ? "&" : ""}cursor=${encodeURIComponent(page.nextCursor)}`}
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
