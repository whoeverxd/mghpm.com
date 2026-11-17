import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import {
  listOrganizationProperties,
  PropertyIndexUnavailableError,
  type PropertyListFilters,
} from "@/lib/properties/list";
import { normalizePropertySearch } from "@/lib/properties/search-index";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import {
  propertyStatusLabels,
  propertyTypeLabels,
} from "@/lib/properties/labels";
import styles from "./page.module.css";
import { getPropertyImageUrl } from "@/lib/properties/image-schema";

export const metadata: Metadata = {
  title: "Propiedades",
};

const pageSearchSchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  status: z.union([z.literal(""), z.enum(["active", "inactive", "draft"])]).optional().default(""),
  occupancy: z
    .union([z.literal(""), z.enum(["vacant", "occupied", "maintenance"])])
    .optional()
    .default(""),
  type: z
    .union([
      z.literal(""),
      z.enum([
        "residential",
        "commercial",
        "industrial",
        "mixed",
        "land",
        "apartment_condo",
      ]),
    ])
    .optional()
    .default(""),
  archived: z.literal("1").optional(),
  cursor: z.string().min(1).max(256).refine((value) => !value.includes("/")).optional(),
  direction: z.enum(["next", "previous"]).optional(),
  page: z.coerce.number().int().min(1).max(100_000).optional().default(1),
}).superRefine((value, context) => {
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

type PropertiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getPaginationHref(
  filters: PropertyListFilters,
  page: number,
  cursor: string,
  direction: "next" | "previous",
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.occupancy) params.set("occupancy", filters.occupancy);
  if (filters.type) params.set("type", filters.type);
  if (filters.includeArchived) params.set("archived", "1");
  params.set("page", String(page));
  params.set("cursor", cursor);
  params.set("direction", direction);
  return `/admin/properties?${params.toString()}`;
}

function getFilteredPropertiesHref(filters: PropertyListFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.occupancy) params.set("occupancy", filters.occupancy);
  if (filters.type) params.set("type", filters.type);
  if (filters.includeArchived) params.set("archived", "1");
  const query = params.toString();
  return query ? `/admin/properties?${query}` : "/admin/properties";
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  if (!can(access.activeOrganization.role, "properties", "view")) {
    return (
      <AdminShell
        activeOrganizationId={access.activeOrganization.organizationId}
        organizations={access.memberships}
        userEmail={user.email}
        userName={user.name}
      >
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const rawSearchParams = await searchParams;
  const parsedSearch = pageSearchSchema.safeParse(rawSearchParams);
  if (!parsedSearch.success) {
    return (
      <AdminShell
        activeOrganizationId={access.activeOrganization.organizationId}
        organizations={access.memberships}
        userEmail={user.email}
        userName={user.name}
      >
        <section className={styles.stateCard} role="alert">
          <h1>No se pudo aplicar la búsqueda</h1>
          <p>Revisa los filtros e inténtalo de nuevo.</p>
          <Link className={styles.resetLink} href="/admin/properties">
            Limpiar filtros
          </Link>
        </section>
      </AdminShell>
    );
  }

  const search = parsedSearch.data;
  const filters: PropertyListFilters = {
    search: search.q,
    status: search.status,
    occupancy: search.occupancy,
    type: search.type,
    includeArchived: search.archived === "1",
  };
  const listResult = await listOrganizationProperties(
    access.activeOrganization.organizationId,
    filters,
    search.page,
    search.cursor,
    search.direction,
  ).catch((error: unknown) => {
    if (error instanceof PropertyIndexUnavailableError) return error;
    throw error;
  });

  if (listResult instanceof PropertyIndexUnavailableError) {
    const retryHref = getFilteredPropertiesHref(filters);
    return (
      <AdminShell
        activeOrganizationId={access.activeOrganization.organizationId}
        organizations={access.memberships}
        userEmail={user.email}
        userName={user.name}
      >
        <section className={styles.stateCard} role="status">
          <span className={styles.stateIcon}>
            <Building2 aria-hidden="true" size={23} />
          </span>
          <h1>
            {listResult.reason === "building"
              ? "Estamos preparando la búsqueda"
              : "El índice de propiedades aún no está disponible"}
          </h1>
          <p>
            {listResult.reason === "building"
              ? "Firestore está construyendo el índice necesario para consultar las propiedades. Vuelve a intentarlo en unos minutos."
              : "El índice requerido todavía no está disponible. Verifica que los índices de Firestore se hayan desplegado en el proyecto."}
          </p>
          <Link className={styles.applyButton} href={retryHref}>
            Reintentar
          </Link>
        </section>
      </AdminShell>
    );
  }

  const result = listResult;

  return (
    <AdminShell
      activeOrganizationId={access.activeOrganization.organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
    >
      <section aria-label="Administración de propiedades" className={styles.content}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>GESTIÓN DE PROPIEDADES</p>
            <h1>Propiedades</h1>
            <p>Consulta las propiedades registradas en esta organización.</p>
          </div>
          <div className={styles.headingActions}>
            {can(access.activeOrganization.role, "properties", "create") && (
              <Link className={styles.applyButton} href="/admin/properties/new">
                Nueva propiedad
              </Link>
            )}
            <span className={styles.countBadge}>
              {new Intl.NumberFormat("es-DO").format(result.totalCount)}{" "}
              {result.totalCount === 1 ? "propiedad" : "propiedades"}
            </span>
          </div>
        </div>

        <section className={styles.listCard} aria-labelledby="property-list-title">
          <div className={styles.cardHeading}>
            <div>
              <h2 id="property-list-title">Cartera de propiedades</h2>
              <p>Busca y filtra los registros de la organización activa.</p>
            </div>
          </div>

          <form action="/admin/properties" className={styles.filters} method="get">
            <label className={styles.searchBox}>
              <Search aria-hidden="true" size={17} />
              <span className={styles.visuallyHidden}>Buscar por nombre</span>
              <input
                autoComplete="off"
                maxLength={80}
                name="q"
                placeholder="Buscar por nombre, código, dirección o ciudad…"
                defaultValue={search.q}
                type="search"
              />
            </label>

            <label className={styles.filterField}>
              <span>Estado</span>
              <select defaultValue={search.status} name="status">
                <option value="">Todos los estados</option>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="draft">Borrador</option>
              </select>
            </label>

            <label className={styles.filterField}>
              <span>Ocupación</span>
              <select defaultValue={search.occupancy} name="occupancy">
                <option value="">Todos</option>
                <option value="vacant">Disponible</option>
                <option value="occupied">Ocupada</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </label>

            <label className={styles.filterField}>
              <span>Tipo</span>
              <select defaultValue={search.type} name="type">
                <option value="">Todos los tipos</option>
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="industrial">Industrial</option>
                <option value="mixed">Mixto</option>
                <option value="land">Terreno</option>
                <option value="apartment_condo">Apartamento / Condo</option>
              </select>
            </label>

            <label className={styles.archivedToggle}>
              <input
                defaultChecked={filters.includeArchived}
                name="archived"
                type="checkbox"
                value="1"
              />
              Incluir archivadas
            </label>

            <div className={styles.filterActions}>
              <button className={styles.applyButton} type="submit">
                Aplicar filtros
              </button>
              <Link className={styles.resetLink} href="/admin/properties">
                Limpiar
              </Link>
            </div>
          </form>

          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Propiedad</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Dirección</th>
                  <th scope="col">Ciudad / Estado</th>
                  <th className={styles.numericCell} scope="col">
                    Unidades
                  </th>
                  <th scope="col">Ocupación</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.properties.map((property) => {
                  const occupancy =
                    property.unitCount === 0
                      ? null
                      : Math.round(
                          (property.occupiedUnitCount / property.unitCount) * 100,
                        );
                  const hasMaintenanceStatus =
                    property.occupancyStatus === "maintenance";

                  return (
                    <tr key={property.id}>
                      <td>
                        <div className={styles.propertyCell}>
                          {property.coverImageId ? (
                            // Private image served by an authenticated route.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt=""
                              className={styles.propertyThumb}
                              height={40}
                              loading="lazy"
                              src={getPropertyImageUrl(property.id, property.coverImageId, "thumbnail")}
                              width={40}
                            />
                          ) : (
                            <span className={styles.propertyIcon}>
                              <Building2 aria-hidden="true" size={19} />
                            </span>
                          )}
                          <span>
                            <strong>
                              <Link
                                className={styles.propertyLink}
                                href={`/admin/properties/${encodeURIComponent(property.id)}`}
                              >
                                {property.name}
                              </Link>
                            </strong>
                            <small>
                              ID: {property.code}
                              {property.archived && (
                                <span className={styles.archivedBadge}>
                                  Archivada
                                </span>
                              )}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>{propertyTypeLabels[property.type]}</td>
                      <td className={styles.addressCell}>{property.address || "—"}</td>
                      <td>{[property.city, property.state].filter(Boolean).join(", ") || "—"}</td>
                      <td className={styles.numericCell}>{property.unitCount}</td>
                      <td>
                        {occupancy === null ? (
                          <span className={styles.muted}>Sin unidades</span>
                        ) : (
                          <div
                            aria-label={`${occupancy}% de ocupación`}
                            className={styles.occupancy}
                          >
                            <span className={styles.occupancyTrack}>
                              <span style={{ width: `${occupancy}%` }} />
                            </span>
                            <strong>{occupancy}%</strong>
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            hasMaintenanceStatus
                              ? styles.status_maintenance
                              : styles[`status_${property.status}`]
                          }`}
                        >
                          {hasMaintenanceStatus
                            ? "Mantenimiento"
                            : propertyStatusLabels[property.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {result.properties.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.stateIcon}>
                <Building2 aria-hidden="true" size={23} />
              </span>
              <h3>
                {result.totalCount === 0 && !normalizePropertySearch(search.q)
                  ? "Aún no hay propiedades registradas"
                  : "No se encontraron propiedades"}
              </h3>
              <p>
                {result.totalCount === 0 && !normalizePropertySearch(search.q)
                  ? "Las propiedades aparecerán aquí cuando se registren para esta organización."
                  : "Prueba con otros términos o elimina algunos filtros."}
              </p>
              {(search.q ||
                search.status ||
                search.occupancy ||
                search.type ||
                filters.includeArchived) && (
                <Link className={styles.resetLink} href="/admin/properties">
                  Limpiar filtros
                </Link>
              )}
            </div>
          )}

          {result.totalCount > 0 && (
            <div className={styles.pagination}>
              <span>
                Página {result.page} de {result.totalPages} ·{" "}
                {new Intl.NumberFormat("es-DO").format(result.totalCount)}{" "}
                resultados
              </span>
              <div className={styles.paginationControls}>
                {result.hasPreviousPage && result.previousCursor ? (
                  <Link
                    aria-label="Página anterior"
                    className={styles.pageButton}
                    href={getPaginationHref(
                      filters,
                      result.page - 1,
                      result.previousCursor,
                      "previous",
                    )}
                  >
                    <ChevronLeft aria-hidden="true" size={17} />
                    Anterior
                  </Link>
                ) : (
                  <span className={`${styles.pageButton} ${styles.disabledPage}`}>
                    <ChevronLeft aria-hidden="true" size={17} />
                    Anterior
                  </span>
                )}
                {result.hasNextPage && result.nextCursor ? (
                  <Link
                    aria-label="Página siguiente"
                    className={styles.pageButton}
                    href={getPaginationHref(
                      filters,
                      result.page + 1,
                      result.nextCursor,
                      "next",
                    )}
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" size={17} />
                  </Link>
                ) : (
                  <span className={`${styles.pageButton} ${styles.disabledPage}`}>
                    Siguiente
                    <ChevronRight aria-hidden="true" size={17} />
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <p className={styles.scopeNote}>
          Los resultados están limitados a la organización activa. Abre una
          propiedad para consultar su detalle y administrar sus unidades.
        </p>
      </section>
    </AdminShell>
  );
}
