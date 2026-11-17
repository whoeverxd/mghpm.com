import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, UserCheck, Users } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { RelationshipBadges } from "@/components/people/relationship-badges";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import {
  genericPersonStatusLabels,
  getPersonStatusLabel,
  relationshipPluralLabels,
} from "@/lib/people/labels";
import {
  listOrganizationPeople,
  PeopleIndexUnavailableError,
  type ListedPerson,
} from "@/lib/people/list";
import {
  personRelationshipFilters,
  personStatuses,
  type PersonRelationshipFilter,
  type PersonSearchFilters,
} from "@/lib/people/search-index";
import { can } from "@/lib/access/permissions";
import styles from "../properties/page.module.css";
import peopleStyles from "./people.module.css";

export const metadata: Metadata = {
  title: "Personas",
};

const pageSearchSchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  type: z.union([z.literal(""), z.enum(personRelationshipFilters)]).optional().default(""),
  status: z.union([z.literal(""), z.enum(personStatuses)]).optional().default(""),
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
    context.addIssue({ code: "custom", message: "La primera página no puede tener cursor." });
  }
  if (value.page > 1 && !value.cursor) {
    context.addIssue({ code: "custom", message: "Se necesita un cursor para abrir esta página." });
  }
});

const viewMeta: Record<PersonRelationshipFilter | "", { title: string; description: string; add: string }> = {
  "": {
    title: "Directorio",
    description: "Directorio unificado de propietarios e inquilinos de la organización.",
    add: "Agregar persona",
  },
  owner: {
    title: "Propietarios",
    description: "Personas y entidades propietarias de la cartera.",
    add: "Agregar propietario",
  },
  tenant: {
    title: "Inquilinos",
    description:
      "Perfiles de residentes. Sus condiciones de arrendamiento se registran en Contratos.",
    add: "Agregar inquilino existente",
  },
};

type PeoplePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getPeopleHref(
  filters: PersonSearchFilters,
  pagination?: { page: number; cursor: string; direction: "next" | "previous" },
) {
  const params = new URLSearchParams();
  // 2A-2 Task 10: the URL keeps `type` as an alias; the filter key is `relationship=`.
  if (filters.relationship) params.set("type", filters.relationship);
  if (filters.search) params.set("q", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.includeArchived) params.set("archived", "1");
  if (pagination) {
    params.set("page", String(pagination.page));
    params.set("cursor", pagination.cursor);
    params.set("direction", pagination.direction);
  }
  const query = params.toString();
  return query ? `/admin/people?${query}` : "/admin/people";
}

function getPersonRowStatusLabel(person: ListedPerson) {
  const relationship = personRelationshipFilters.find((type) =>
    person.relationshipTypes.includes(type),
  );
  return relationship
    ? getPersonStatusLabel(relationship, person.status)
    : genericPersonStatusLabels[person.status];
}

function PersonLinkCell({ person }: { person: ListedPerson }) {
  if (!person.link) {
    if (person.contactName) return <span>Contacto: {person.contactName}</span>;
    return person.relationshipTypes.includes("tenant") ? (
      <span className={styles.muted}>Sin unidad vinculada</span>
    ) : (
      <span className={styles.muted}>—</span>
    );
  }

  return (
    <Link
      className={styles.propertyLink}
      href={`/admin/properties/${encodeURIComponent(person.link.propertyId)}`}
    >
      {person.link.propertyName ?? "Propiedad no disponible"}
      {person.unitId && ` • Unidad ${person.link.unitLabel ?? "no disponible"}`}
    </Link>
  );
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const shellProps = {
    activeOrganizationId: access.activeOrganization.organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };

  if (!can(access.activeOrganization.role, "people", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar el directorio de personas." />
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
          <Link className={styles.resetLink} href="/admin/people">
            Limpiar filtros
          </Link>
        </section>
      </AdminShell>
    );
  }

  const search = parsedSearch.data;
  const filters: PersonSearchFilters = {
    search: search.q,
    relationship: search.type,
    status: search.status,
    includeArchived: search.archived === "1",
  };
  const listResult = await listOrganizationPeople(
    access.activeOrganization.organizationId,
    filters,
    search.page,
    search.cursor,
    search.direction,
  ).catch((error: unknown) => {
    if (error instanceof PeopleIndexUnavailableError) return error;
    throw error;
  });

  if (listResult instanceof PeopleIndexUnavailableError) {
    return (
      <AdminShell {...shellProps}>
        <section className={styles.stateCard} role="status">
          <span className={styles.stateIcon}>
            <Users aria-hidden="true" size={23} />
          </span>
          <h1>
            {listResult.reason === "building"
              ? "Estamos preparando la búsqueda"
              : "El índice del directorio aún no está disponible"}
          </h1>
          <p>
            {listResult.reason === "building"
              ? "Firestore está construyendo el índice necesario para consultar el directorio. Vuelve a intentarlo en unos minutos."
              : "El índice requerido todavía no está disponible. Verifica que los índices de Firestore se hayan desplegado en el proyecto."}
          </p>
          <Link className={styles.applyButton} href={getPeopleHref(filters)}>
            Reintentar
          </Link>
        </section>
      </AdminShell>
    );
  }

  const result = listResult;
  const meta = viewMeta[search.type];
  const numberFormat = new Intl.NumberFormat("es-DO");
  const hasFilters = Boolean(search.q || search.status || filters.includeArchived);
  const tabs: { type: PersonRelationshipFilter | ""; label: string; count: number }[] = [
    { type: "", label: "Directorio", count: result.relationshipCounts.owner + result.relationshipCounts.tenant },
    { type: "owner", label: "Propietarios", count: result.relationshipCounts.owner },
    { type: "tenant", label: "Inquilinos", count: result.relationshipCounts.tenant },
  ];

  return (
    <AdminShell {...shellProps}>
      <section aria-label="Directorio de personas" className={styles.content}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>PERSONAS</p>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </div>
          <div className={styles.headingActions}>
            {can(access.activeOrganization.role, "people", "create") && (
              <Link
                className={styles.applyButton}
                href={`/admin/people/new?type=${search.type || "owner"}`}
              >
                {meta.add}
              </Link>
            )}
          </div>
        </div>

        <div className={peopleStyles.kpis}>
          {personRelationshipFilters.map((type) => (
            <div className={peopleStyles.kpi} key={type}>
              <span className={peopleStyles.kpiHeading}>
                {relationshipPluralLabels[type]}
                <span
                  className={`${peopleStyles.kpiIcon} ${
                    type === "owner" ? peopleStyles.kpiIconOwner : ""
                  }`}
                >
                  {type === "owner" ? (
                    <UserCheck aria-hidden="true" size={16} />
                  ) : (
                    <Users aria-hidden="true" size={16} />
                  )}
                </span>
              </span>
              <strong>{numberFormat.format(result.relationshipCounts[type])}</strong>
              <small>Activos en el directorio</small>
            </div>
          ))}
        </div>

        <section className={styles.listCard} aria-labelledby="people-list-title">
          <nav aria-label="Tipo de persona" className={peopleStyles.tabs}>
            {tabs.map((tab) => (
              <Link
                aria-current={tab.type === search.type ? "page" : undefined}
                className={peopleStyles.tab}
                href={getPeopleHref({ ...filters, relationship: tab.type, status: "" })}
                key={tab.type || "all"}
              >
                {tab.label}
                <span className={peopleStyles.tabCount}>{numberFormat.format(tab.count)}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.cardHeading}>
            <div>
              <h2 id="people-list-title">{meta.title}</h2>
              <p>
                {numberFormat.format(result.totalCount)}{" "}
                {result.totalCount === 1 ? "registro coincide" : "registros coinciden"} con
                los filtros.
              </p>
            </div>
          </div>

          <form action="/admin/people" className={styles.filters} method="get">
            {search.type && <input name="type" type="hidden" value={search.type} />}
            <label className={styles.searchBox}>
              <Search aria-hidden="true" size={17} />
              <span className={styles.visuallyHidden}>Buscar personas</span>
              <input
                autoComplete="off"
                defaultValue={search.q}
                maxLength={80}
                name="q"
                placeholder="Buscar por nombre, correo o teléfono…"
                type="search"
              />
            </label>

            <label className={styles.filterField}>
              <span>Estado</span>
              <select defaultValue={search.status} name="status">
                <option value="">Todos los estados</option>
                {personStatuses.map((status) => (
                  <option key={status} value={status}>
                    {search.type
                      ? getPersonStatusLabel(search.type, status)
                      : genericPersonStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.archivedToggle}>
              <input
                defaultChecked={filters.includeArchived}
                name="archived"
                type="checkbox"
                value="1"
              />
              Incluir archivados
            </label>

            <div className={styles.filterActions}>
              <button className={styles.applyButton} type="submit">
                Aplicar filtros
              </button>
              <Link
                className={styles.resetLink}
                href={search.type ? `/admin/people?type=${search.type}` : "/admin/people"}
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Contacto</th>
                  <th scope="col">Relación</th>
                  <th scope="col">
                    {search.type === "owner"
                      ? "Persona de contacto"
                      : search.type === "tenant"
                        ? "Propiedad / unidad"
                        : "Vinculado a"}
                  </th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.people.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className={styles.propertyCell}>
                        <span className={styles.propertyIcon}>
                          {person.relationshipTypes.includes("owner") ? (
                            <UserCheck aria-hidden="true" size={19} />
                          ) : (
                            <Users aria-hidden="true" size={19} />
                          )}
                        </span>
                        <span>
                          <strong>
                            <Link
                              className={styles.propertyLink}
                              href={`/admin/people/${encodeURIComponent(person.id)}`}
                            >
                              {person.name}
                            </Link>
                          </strong>
                          {(person.archived || person.accountUid) && (
                            <small>
                              {person.archived ? (
                                <span className={styles.archivedBadge}>Archivado</span>
                              ) : (
                                "Con acceso"
                              )}
                            </small>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={peopleStyles.contactCell}>
                        <span>{person.email}</span>
                        <small>{person.phone || "Sin teléfono"}</small>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
                        <RelationshipBadges
                          kind={person.kind}
                          relationshipTypes={person.relationshipTypes}
                        />
                        {person.relationshipTypes.length === 0 && person.kind !== "entity" && (
                          <span className={styles.muted}>Sin relación</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <PersonLinkCell person={person} />
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          person.status === "pending"
                            ? peopleStyles.status_pending
                            : styles[`status_${person.status}`]
                        }`}
                      >
                        {getPersonRowStatusLabel(person)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.people.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.stateIcon}>
                <Users aria-hidden="true" size={23} />
              </span>
              <h3>
                {result.totalCount === 0 && !hasFilters
                  ? "Aún no hay registros"
                  : "No se encontraron personas"}
              </h3>
              <p>
                {result.totalCount === 0 && !hasFilters
                  ? "Los propietarios e inquilinos aparecerán aquí cuando se registren."
                  : "Prueba con otros términos o elimina algunos filtros."}
              </p>
              {hasFilters && (
                <Link
                  className={styles.resetLink}
                  href={search.type ? `/admin/people?type=${search.type}` : "/admin/people"}
                >
                  Limpiar filtros
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
                    href={getPeopleHref(filters, {
                      page: result.page - 1,
                      cursor: result.previousCursor,
                      direction: "previous",
                    })}
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
                    href={getPeopleHref(filters, {
                      page: result.page + 1,
                      cursor: result.nextCursor,
                      direction: "next",
                    })}
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
          Los datos de contacto son visibles solo para administradores de la
          organización activa. Proveedores y personal se agregarán con sus módulos.
        </p>
      </section>
    </AdminShell>
  );
}
