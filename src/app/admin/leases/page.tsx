import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileSignature, Search } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { leaseStatusLabels, leaseViewLabels } from "@/lib/leases/labels";
import {
  LeasesIndexUnavailableError,
  listOrganizationLeases,
  type LeaseListFilters,
} from "@/lib/leases/list";
import type { Lease } from "@/lib/leases/records";
import {
  EXPIRING_WINDOW_DAYS,
  leaseViews,
  type LeaseView,
} from "@/lib/leases/search-index";
import {
  formatLeaseDate,
  formatMinorUnits,
  getDaysBetween,
  getTodayInTimeZone,
} from "@/lib/leases/terms";
import { can } from "@/lib/access/permissions";
import styles from "../properties/page.module.css";
import peopleStyles from "../people/people.module.css";
import leaseStyles from "@/components/leases/leases.module.css";

export const metadata: Metadata = {
  title: "Contratos",
};

const pageSearchSchema = z
  .object({
    q: z.string().trim().max(80).optional().default(""),
    view: z
      .union([z.literal(""), z.enum(leaseViews)])
      .optional()
      .default(""),
    cursor: z
      .string()
      .min(1)
      .max(256)
      .refine((value) => !value.includes("/"))
      .optional(),
    direction: z.enum(["next", "previous"]).optional(),
    page: z.coerce.number().int().min(1).max(100_000).optional().default(1),
  })
  .superRefine((value, context) => {
    if (Boolean(value.cursor) !== Boolean(value.direction)) {
      context.addIssue({
        code: "custom",
        message: "El cursor y la dirección de página deben enviarse juntos.",
      });
    }
    if (value.page === 1 && value.cursor) {
      context.addIssue({
        code: "custom",
        message: "La primera página no puede tener cursor.",
      });
    }
    if (value.page > 1 && !value.cursor) {
      context.addIssue({
        code: "custom",
        message: "Se necesita un cursor para abrir esta página.",
      });
    }
  });

type LeasesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getLeasesHref(
  filters: LeaseListFilters,
  pagination?: { page: number; cursor: string; direction: "next" | "previous" },
) {
  const params = new URLSearchParams();
  if (filters.view) params.set("view", filters.view);
  if (filters.search) params.set("q", filters.search);
  if (pagination) {
    params.set("page", String(pagination.page));
    params.set("cursor", pagination.cursor);
    params.set("direction", pagination.direction);
  }
  const query = params.toString();
  return query ? `/admin/leases?${query}` : "/admin/leases";
}

function getStatusNote(lease: Lease, today: string) {
  if (lease.status === "active" && lease.endDate) {
    const days = getDaysBetween(today, lease.endDate);
    if (days < 0) return "Fecha de fin cumplida";
    if (days <= EXPIRING_WINDOW_DAYS)
      return `Vence en ${days} ${days === 1 ? "día" : "días"}`;
  }
  if (lease.status === "draft") return "Faltan datos para crear";
  if (lease.status === "pending") return "Activar al firmar";
  return null;
}

export default async function LeasesPage({ searchParams }: LeasesPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const canCreateLease = can(
    access.activeOrganization.role,
    "leases",
    "create",
  );
  const user = gate.user;

  const shellProps = {
    activeOrganizationId: access.activeOrganization.organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };

  if (!can(access.activeOrganization.role, "leases", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar los contratos." />
      </AdminShell>
    );
  }

  const parsedSearch = pageSearchSchema.safeParse(await searchParams);
  if (!parsedSearch.success) {
    return (
      <AdminShell {...shellProps}>
        <section className={styles.stateCard} role="alert">
          <h1>No se pudo aplicar la búsqueda</h1>
          <p>Revisa los filtros e inténtalo de nuevo.</p>
          <Link className={styles.resetLink} href="/admin/leases">
            Limpiar filtros
          </Link>
        </section>
      </AdminShell>
    );
  }

  const search = parsedSearch.data;
  const filters: LeaseListFilters = { view: search.view, search: search.q };
  const today = getTodayInTimeZone(access.activeOrganization.timeZone);
  const listResult = await listOrganizationLeases(
    access.activeOrganization.organizationId,
    filters,
    today,
    search.page,
    search.cursor,
    search.direction,
  ).catch((error: unknown) => {
    if (error instanceof LeasesIndexUnavailableError) return error;
    throw error;
  });

  if (listResult instanceof LeasesIndexUnavailableError) {
    return (
      <AdminShell {...shellProps}>
        <section className={styles.stateCard} role="status">
          <span className={styles.stateIcon}>
            <FileSignature aria-hidden="true" size={23} />
          </span>
          <h1>
            {listResult.reason === "building"
              ? "Estamos preparando la búsqueda"
              : "El índice de contratos aún no está disponible"}
          </h1>
          <p>
            {listResult.reason === "building"
              ? "Firestore está construyendo el índice necesario para consultar los contratos. Vuelve a intentarlo en unos minutos."
              : "El índice requerido todavía no está disponible. Verifica que los índices de Firestore se hayan desplegado en el proyecto."}
          </p>
          <Link className={styles.applyButton} href={getLeasesHref(filters)}>
            Reintentar
          </Link>
        </section>
      </AdminShell>
    );
  }

  const result = listResult;
  const numberFormat = new Intl.NumberFormat("es-DO");
  const viewTitle = search.view
    ? leaseViewLabels[search.view]
    : "Todos los contratos";
  const tabs: { view: LeaseView | ""; label: string }[] = [
    { view: "", label: "Todos" },
    ...leaseViews.map((view) => ({ view, label: leaseViewLabels[view] })),
  ];

  return (
    <AdminShell {...shellProps}>
      <section aria-label="Contratos" className={styles.content}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>ARRENDAMIENTOS</p>
            <h1>Contratos</h1>
            <p>
              Contratos activos, pendientes de activación, borradores, por
              vencer y cerrados. Cada contrato abre su detalle.
            </p>
          </div>
          <div className={styles.headingActions}>
            {canCreateLease && (
              <Link className={styles.applyButton} href="/admin/leases/new">
                Crear contrato
              </Link>
            )}
          </div>
        </div>

        <div className={leaseStyles.kpis}>
          <div className={leaseStyles.kpi}>
            <span>Contratos activos</span>
            <strong>{numberFormat.format(result.viewCounts.active)}</strong>
            <small>{numberFormat.format(result.viewCounts[""])} en total</small>
          </div>
          <div className={leaseStyles.kpi}>
            <span>Renta mensual — USD</span>
            <strong>
              {formatMinorUnits(result.totals.USD.rentMinor, "USD")}
            </strong>
            <small>
              DOP {formatMinorUnits(result.totals.DOP.rentMinor, "DOP")} · nunca
              se suman
            </small>
          </div>
          <div className={leaseStyles.kpi}>
            <span>Vencen en ≤ 90 días</span>
            <strong>{numberFormat.format(result.viewCounts.expiring)}</strong>
            <small>Contratos activos por renovar o cerrar</small>
          </div>
          <div className={leaseStyles.kpi}>
            <span>Pendientes / borradores</span>
            <strong>
              {numberFormat.format(result.viewCounts.pending)} /{" "}
              {numberFormat.format(result.viewCounts.draft)}
            </strong>
            <small>Creado no es activo: se activa desde el detalle</small>
          </div>
          <div className={leaseStyles.kpi}>
            <span>Depósitos pactados — USD</span>
            <strong>
              {formatMinorUnits(result.totals.USD.securityDepositMinor, "USD")}
            </strong>
            <small>
              DOP{" "}
              {formatMinorUnits(result.totals.DOP.securityDepositMinor, "DOP")}{" "}
              · contratos activos
            </small>
          </div>
        </div>

        <section
          className={styles.listCard}
          aria-labelledby="leases-list-title"
        >
          <nav aria-label="Estado del contrato" className={peopleStyles.tabs}>
            {tabs.map((tab) => (
              <Link
                aria-current={tab.view === search.view ? "page" : undefined}
                className={peopleStyles.tab}
                href={getLeasesHref({ view: tab.view, search: search.q })}
                key={tab.view || "all"}
              >
                {tab.label}
                <span className={peopleStyles.tabCount}>
                  {numberFormat.format(result.viewCounts[tab.view])}
                </span>
              </Link>
            ))}
          </nav>

          <div className={styles.cardHeading}>
            <div>
              <h2 id="leases-list-title">{viewTitle}</h2>
              <p>
                {numberFormat.format(result.totalCount)}{" "}
                {result.totalCount === 1
                  ? "contrato coincide"
                  : "contratos coinciden"}{" "}
                con los filtros.
              </p>
            </div>
          </div>

          <form action="/admin/leases" className={styles.filters} method="get">
            {search.view && (
              <input name="view" type="hidden" value={search.view} />
            )}
            <label className={styles.searchBox}>
              <Search aria-hidden="true" size={17} />
              <span className={styles.visuallyHidden}>Buscar contratos</span>
              <input
                autoComplete="off"
                defaultValue={search.q}
                maxLength={80}
                name="q"
                placeholder="Buscar por código, inquilino, propiedad o unidad…"
                type="search"
              />
            </label>
            <div className={styles.filterActions}>
              <button className={styles.applyButton} type="submit">
                Buscar
              </button>
              <Link
                className={styles.resetLink}
                href={
                  search.view
                    ? `/admin/leases?view=${search.view}`
                    : "/admin/leases"
                }
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Contrato</th>
                  <th scope="col">Propiedad / unidad</th>
                  <th scope="col">Inquilino</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Fin</th>
                  <th className={styles.numericCell} scope="col">
                    Renta
                  </th>
                  <th className={styles.numericCell} scope="col">
                    Depósito
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.leases.map((lease) => {
                  const note = getStatusNote(lease, today);
                  return (
                    <tr key={lease.id}>
                      <td>
                        <strong>
                          <Link
                            className={styles.propertyLink}
                            href={`/admin/leases/${encodeURIComponent(lease.id)}`}
                          >
                            {lease.code}
                          </Link>
                        </strong>
                      </td>
                      <td>
                        <div className={peopleStyles.contactCell}>
                          <span>{lease.propertyName}</span>
                          <small>Unidad {lease.unitLabel}</small>
                        </div>
                      </td>
                      <td>{lease.tenantName}</td>
                      <td>
                        <span
                          className={`${leaseStyles.statusBadge} ${
                            leaseStyles[`status_${lease.status}`]
                          }`}
                        >
                          {leaseStatusLabels[lease.status]}
                        </span>
                        {note && (
                          <small className={leaseStyles.statusNote}>
                            {note}
                          </small>
                        )}
                      </td>
                      <td>{formatLeaseDate(lease.startDate)}</td>
                      <td>{formatLeaseDate(lease.endDate)}</td>
                      <td className={styles.numericCell}>
                        {lease.rentMinor > 0
                          ? formatMinorUnits(lease.rentMinor, lease.currency)
                          : "—"}
                      </td>
                      <td className={styles.numericCell}>
                        {lease.securityDepositMinor > 0
                          ? formatMinorUnits(
                              lease.securityDepositMinor,
                              lease.currency,
                            )
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {result.leases.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.stateIcon}>
                <FileSignature aria-hidden="true" size={23} />
              </span>
              <h3>
                {result.viewCounts[""] === 0
                  ? "Aún no hay contratos"
                  : "No se encontraron contratos"}
              </h3>
              <p>
                {result.viewCounts[""] === 0
                  ? "Crea el primer contrato a partir de una unidad y un inquilino registrados."
                  : "Prueba con otros términos o cambia de pestaña."}
              </p>
              {result.viewCounts[""] === 0
                ? canCreateLease && (
                    <Link
                      className={styles.applyButton}
                      href="/admin/leases/new"
                    >
                      Crear contrato
                    </Link>
                  )
                : search.q && (
                    <Link
                      className={styles.resetLink}
                      href={
                        search.view
                          ? `/admin/leases?view=${search.view}`
                          : "/admin/leases"
                      }
                    >
                      Limpiar búsqueda
                    </Link>
                  )}
            </div>
          )}

          {result.totalCount > 0 && (
            <div className={styles.pagination}>
              <span>
                Página {result.page} de {result.totalPages} ·{" "}
                {numberFormat.format(result.totalCount)} resultados
              </span>
              <div className={styles.paginationControls}>
                {result.hasPreviousPage && result.previousCursor ? (
                  <Link
                    aria-label="Página anterior"
                    className={styles.pageButton}
                    href={getLeasesHref(filters, {
                      page: result.page - 1,
                      cursor: result.previousCursor,
                      direction: "previous",
                    })}
                  >
                    <ChevronLeft aria-hidden="true" size={17} />
                    Anterior
                  </Link>
                ) : (
                  <span
                    className={`${styles.pageButton} ${styles.disabledPage}`}
                  >
                    <ChevronLeft aria-hidden="true" size={17} />
                    Anterior
                  </span>
                )}
                {result.hasNextPage && result.nextCursor ? (
                  <Link
                    aria-label="Página siguiente"
                    className={styles.pageButton}
                    href={getLeasesHref(filters, {
                      page: result.page + 1,
                      cursor: result.nextCursor,
                      direction: "next",
                    })}
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" size={17} />
                  </Link>
                ) : (
                  <span
                    className={`${styles.pageButton} ${styles.disabledPage}`}
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" size={17} />
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <p className={styles.scopeNote}>
          Los montos se muestran en la moneda de cada contrato. Cobros, recibos,
          firmas y documentos se agregarán con sus módulos.
        </p>
      </section>
    </AdminShell>
  );
}
