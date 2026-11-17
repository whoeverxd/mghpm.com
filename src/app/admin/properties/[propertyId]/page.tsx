import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  ImagePlus,
  Layers,
  Pencil,
  Plus,
} from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import {
  propertyAmenityLabels,
  propertyCountryLabels,
  propertyOccupancyLabels,
  propertyRentalCategoryLabels,
  propertyStatusLabels,
  propertyTypeLabels,
  stayVisibilityIssueLabels,
  unitStatusLabels,
} from "@/lib/properties/labels";
import { getOrganizationProperty } from "@/lib/properties/records";
import { recordIdSchema } from "@/lib/properties/schema";
import { getStayVisibilityIssue } from "@/lib/stays/publishable";
import { ownershipStatusLabels } from "@/lib/ownerships/labels";
import { getPersonSummaries } from "@/lib/ownerships/lookups";
import { listPropertyOwnerships } from "@/lib/ownerships/records";
import { availablePct } from "@/lib/ownerships/rules";
import { listPropertyUnits, type PropertyUnit } from "@/lib/properties/units";
import { getPropertyImageUrl } from "@/lib/properties/image-schema";
import { listPropertyImages } from "@/lib/properties/images";
import { PropertyImageManager } from "@/components/properties/property-image-manager";
import listStyles from "../page.module.css";
import styles from "./detail.module.css";

export const metadata: Metadata = {
  title: "Detalle de propiedad",
};

const UNIT_PAGE_SIZE = 20;

const detailSearchSchema = z.object({
  tab: z.enum(["overview", "units", "images", "owners"]).optional().default("overview"),
  archived: z.literal("1").optional(),
  page: z.coerce.number().int().min(1).max(1_000).optional().default(1),
});

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatUnitRent(unit: PropertyUnit) {
  if (unit.marketRentMinor === null || !unit.marketRentCurrency) return null;
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: unit.marketRentCurrency,
  }).format(unit.marketRentMinor / 100);
}

function formatLayout(unit: PropertyUnit) {
  const bedrooms = `${unit.bedrooms} ${unit.bedrooms === 1 ? "hab." : "habs."}`;
  const bathrooms = `${new Intl.NumberFormat("es-DO").format(unit.bathrooms)} ${
    unit.bathrooms === 1 ? "baño" : "baños"
  }`;
  return `${bedrooms} · ${bathrooms}`;
}

function getUnitsHref(propertyId: string, page: number, includeArchived: boolean) {
  const params = new URLSearchParams({ tab: "units" });
  if (includeArchived) params.set("archived", "1");
  if (page > 1) params.set("page", String(page));
  return `/admin/properties/${encodeURIComponent(propertyId)}?${params.toString()}`;
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: PropertyDetailPageProps) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) notFound();

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

  if (!can(access.activeOrganization.role, "properties", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const canEdit = can(access.activeOrganization.role, "properties", "update");
  const organizationId = access.activeOrganization.organizationId;
  const [property, units] = await Promise.all([
    getOrganizationProperty(organizationId, propertyId),
    listPropertyUnits(organizationId, propertyId),
  ]);
  if (!property) notFound();

  const parsedSearch = detailSearchSchema.safeParse(await searchParams);
  const search = parsedSearch.success
    ? parsedSearch.data
    : { tab: "overview" as const, archived: undefined, page: 1 };
  const includeArchived = search.archived === "1";
  const canViewOwners = can(access.activeOrganization.role, "ownerships", "view");
  const showOwners = search.tab === "owners" && canViewOwners;
  const propertyOwnerships = showOwners ? await listPropertyOwnerships(organizationId, propertyId) : [];
  const ownerPeople = showOwners
    ? await getPersonSummaries(
        organizationId,
        propertyOwnerships.map((ownership) => ownership.personId),
      )
    : new Map<string, { id: string; name: string; archived: boolean }>();
  const activeOwnerships = propertyOwnerships.filter((ownership) => ownership.active);
  const assignedPct = 100 - availablePct(activeOwnerships.map((ownership) => ownership.pct));
  const images = search.tab === "images" ? await listPropertyImages(organizationId, propertyId) : [];
  const coverImageId = property.coverImageId ?? null;
  const encodedId = encodeURIComponent(property.id);

  const activeUnits = units.filter((unit) => !unit.archived);
  const archivedUnitCount = units.length - activeUnits.length;
  const availableUnitCount = activeUnits.filter((unit) => unit.status === "available").length;
  const maintenanceUnitCount = activeUnits.filter((unit) => unit.status === "maintenance").length;
  const occupancyPercent =
    property.unitCount === 0
      ? null
      : Math.round((property.occupiedUnitCount / property.unitCount) * 100);

  const visibleUnits = includeArchived ? units : activeUnits;
  const totalUnitPages = Math.max(1, Math.ceil(visibleUnits.length / UNIT_PAGE_SIZE));
  const unitPage = Math.min(search.page, totalUnitPages);
  const pageUnits = visibleUnits.slice(
    (unitPage - 1) * UNIT_PAGE_SIZE,
    unitPage * UNIT_PAGE_SIZE,
  );
  const unitFrom = pageUnits.length === 0 ? 0 : (unitPage - 1) * UNIT_PAGE_SIZE + 1;
  const unitTo = unitFrom === 0 ? 0 : unitFrom + pageUnits.length - 1;

  const tabs = [
    { id: "overview", label: "Resumen", href: `/admin/properties/${encodedId}` },
    { id: "units", label: "Unidades", href: `/admin/properties/${encodedId}?tab=units` },
    {
      id: "images",
      label: property.imageCount ? `Imágenes (${property.imageCount})` : "Imágenes",
      href: `/admin/properties/${encodedId}?tab=images`,
    },
    ...(canViewOwners
      ? [{ id: "owners", label: "Propietarios", href: `/admin/properties/${encodedId}?tab=owners` }]
      : []),
  ] as const;

  const infoFields: [string, ReactNode][] = [
    ["Nombre", property.name],
    ["Código interno", property.code],
    ["Tipo de propiedad", propertyTypeLabels[property.type]],
    ["Estado del registro", propertyStatusLabels[property.status]],
    ["Ocupación", propertyOccupancyLabels[property.occupancyStatus]],
    ["Unidades activas", String(property.unitCount)],
    [
      "Categoría de renta",
      property.rentalCategory ? propertyRentalCategoryLabels[property.rentalCategory] : "—",
    ],
    ["Inicio de la administración", property.managementStartDate || "—"],
    ["Descripción", property.description || "—"],
  ];
  const location = property.location;
  const addressFields: [string, ReactNode][] = [
    ["Dirección", property.address || "—"],
    ["Ciudad", property.city || "—"],
    ["Provincia / estado", property.state || "—"],
    ["Código postal", property.postalCode || "—"],
    ["País", property.country ? propertyCountryLabels[property.country] : "—"],
    [
      "Coordenadas",
      location ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}${
            location.placeId ? `&query_place_id=${encodeURIComponent(location.placeId)}` : ""
          }`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </a>
      ) : (
        "Sin ubicación"
      ),
    ],
  ];
  const financial = property.financialReference;
  const utilities = property.utilities;
  const formatReferenceMoney = (minor: number | null | undefined) =>
    financial && minor !== null && minor !== undefined
      ? new Intl.NumberFormat("es-DO", { style: "currency", currency: financial.currency }).format(
          minor / 100,
        )
      : "—";
  const rentalFields: [string, ReactNode][] = [
    ["Renta mensual inicial", formatReferenceMoney(financial?.startingRentMinor)],
    ["Depósito de seguridad", formatReferenceMoney(financial?.securityDepositMinor)],
    ["Cargo de limpieza", formatReferenceMoney(financial?.cleaningFeeMinor)],
    [
      "Servicios incluidos",
      [
        utilities?.electricityIncluded && "Electricidad",
        utilities?.waterIncluded && "Agua",
        utilities?.internetIncluded && "Internet",
      ]
        .filter(Boolean)
        .join(", ") || "—",
    ],
    [
      "Medidor eléctrico",
      utilities?.electricityMeterRequired
        ? [
            utilities.electricityMeterNumber || "Requerido",
            utilities.initialMeterReading !== null && `lectura inicial ${utilities.initialMeterReading} kWh`,
          ]
            .filter(Boolean)
            .join(" · ")
        : "No requerido",
    ],
    [
      "Tarifa por kWh",
      utilities?.electricityRatePerKwh != null && financial
        ? `${utilities.electricityRatePerKwh} ${financial.currency}`
        : "—",
    ],
    [
      "Amenidades",
      property.amenities?.length
        ? property.amenities.map((amenity) => propertyAmenityLabels[amenity]).join(", ")
        : "—",
    ],
  ];

  return (
    <AdminShell {...shellProps} crumbNames={{ propertyId: property?.name ?? "" }}>
      <section aria-labelledby="property-title" className={styles.content}>
        <div className={styles.header}>
          <Link className={styles.backLink} href="/admin/properties">
            <ArrowLeft aria-hidden="true" size={16} />
            Propiedades
          </Link>
          <div className={styles.headerRow}>
            <div className={styles.titleBlock}>
              <div className={styles.titleLine}>
                <h1 id="property-title">{property.name}</h1>
                <span className={styles.codeChip}>{property.code}</span>
              </div>
              <div className={styles.badges}>
                <span
                  className={`${listStyles.statusBadge} ${
                    styles[`occupancy_${property.occupancyStatus}`]
                  }`}
                >
                  {propertyOccupancyLabels[property.occupancyStatus]}
                </span>
                <span className={`${listStyles.statusBadge} ${styles.typeBadge}`}>
                  {propertyTypeLabels[property.type]}
                </span>
                <span
                  className={`${listStyles.statusBadge} ${
                    listStyles[`status_${property.status}`]
                  }`}
                >
                  {propertyStatusLabels[property.status]}
                </span>
                {property.archived && (
                  <span className={`${listStyles.statusBadge} ${listStyles.status_inactive}`}>
                    Archivada
                  </span>
                )}
                <span className={styles.metaLine}>
                  {[property.address, property.city, property.state].filter(Boolean).join(", ") ||
                    "Sin dirección"}{" "}
                  ·{" "}
                  {property.unitCount} {property.unitCount === 1 ? "unidad" : "unidades"}
                  {occupancyPercent !== null && ` · ${occupancyPercent}% ocupada`}
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <Link className={styles.secondaryButton} href="/admin/properties">
                <ArrowLeft aria-hidden="true" size={16} />
                Volver
              </Link>
              {canEdit && (
                <Link className={styles.primaryButton} href={`/admin/properties/${encodedId}/edit`}>
                  <Pencil aria-hidden="true" size={16} />
                  Editar
                </Link>
              )}
            </div>
          </div>
        </div>

        <nav aria-label="Secciones de la propiedad" className={styles.tabs}>
          {tabs.map((tab) => (
            <Link
              aria-current={search.tab === tab.id ? "page" : undefined}
              className={styles.tab}
              href={tab.href}
              key={tab.id}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {search.tab === "overview" ? (
          <div className={styles.overviewGrid}>
            <div className={styles.mainColumn}>
              {[
                { title: "Información de la propiedad", fields: infoFields },
                { title: "Dirección y ubicación", fields: addressFields },
                { title: "Renta y servicios", fields: rentalFields },
              ].map((section, index) => (
                <section className={styles.card} key={section.title}>
                  <div className={styles.cardTitle}>
                    <span className={styles.sectionNumber}>{index + 1}</span>
                    <h2>{section.title}</h2>
                  </div>
                  <dl className={styles.fieldList}>
                    {section.fields.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <p className={listStyles.scopeNote}>
                Propietarios, inquilinos, contratos, mantenimiento y documentos se mostrarán aquí cuando sus módulos estén implementados.
              </p>
            </div>

            <aside className={styles.railColumn} aria-label="Resumen de ocupación">
              <section className={`${styles.card} ${styles.coverCard}`}>
                {coverImageId ? (
                  <Link className={styles.coverImage} href={`/admin/properties/${encodedId}?tab=images`}>
                    {/* Private image served by an authenticated route. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Imagen principal de ${property.name}`}
                      height={480}
                      src={getPropertyImageUrl(property.id, coverImageId, "thumbnail")}
                      width={640}
                    />
                  </Link>
                ) : (
                  <Link className={styles.coverEmpty} href={`/admin/properties/${encodedId}?tab=images`}>
                    <ImagePlus aria-hidden="true" size={22} />
                    Agregar imágenes
                  </Link>
                )}
                <Link className={styles.railLink} href={`/admin/properties/${encodedId}?tab=images`}>
                  {property.imageCount
                    ? `Ver galería (${property.imageCount})`
                    : "Gestionar imágenes"}
                  <ChevronRight aria-hidden="true" size={15} />
                </Link>
              </section>
              <section className={styles.card}>
                <h2 className={styles.railTitle}>Ocupación</h2>
                <dl className={styles.railList}>
                  <div>
                    <dt>Porcentaje ocupado</dt>
                    <dd>
                      {occupancyPercent === null
                        ? "Sin unidades"
                        : `${occupancyPercent}% · ${property.occupiedUnitCount} / ${property.unitCount}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Disponibles</dt>
                    <dd>{availableUnitCount}</dd>
                  </div>
                  <div>
                    <dt>En mantenimiento</dt>
                    <dd>{maintenanceUnitCount}</dd>
                  </div>
                  <div>
                    <dt>Archivadas</dt>
                    <dd>{archivedUnitCount}</dd>
                  </div>
                </dl>
                <Link className={styles.railLink} href={`/admin/properties/${encodedId}?tab=units`}>
                  Ver unidades
                  <ChevronRight aria-hidden="true" size={15} />
                </Link>
              </section>
            </aside>
          </div>
        ) : showOwners ? (
          <section aria-labelledby="owners-title" className={listStyles.listCard}>
            <div className={styles.unitsHeading}>
              <div>
                <h2 id="owners-title">Propietarios</h2>
                <p>Total asignado: {Math.round(assignedPct * 100) / 100} % de 100 %</p>
              </div>
              <div className={styles.unitsActions}>
                {can(access.activeOrganization.role, "ownerships", "create") && !property.archived && (
                  <Link
                    className={styles.primaryButton}
                    href={`/admin/ownerships/new?propertyId=${encodedId}`}
                  >
                    <Plus aria-hidden="true" size={16} />
                    Agregar propietario
                  </Link>
                )}
              </div>
            </div>
            {propertyOwnerships.length > 0 ? (
              <div className={listStyles.tableScroller}>
                <table className={listStyles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Persona</th>
                      <th className={listStyles.numericCell} scope="col">%</th>
                      <th scope="col">Estado</th>
                      <th scope="col">
                        <span className={listStyles.visuallyHidden}>Detalle</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyOwnerships.map((ownership) => {
                      const owner = ownerPeople.get(ownership.personId);
                      return (
                        <tr key={ownership.id}>
                          <td>
                            {owner ? (
                              <Link
                                className={listStyles.propertyLink}
                                href={`/admin/people/${encodeURIComponent(owner.id)}/propietario`}
                              >
                                {owner.name}
                              </Link>
                            ) : (
                              "Persona no disponible"
                            )}
                          </td>
                          <td className={listStyles.numericCell}>{ownership.pct} %</td>
                          <td>
                            {ownershipStatusLabels[ownership.status]}
                            {!ownership.active && <span className={listStyles.archivedBadge}>Finalizada</span>}
                          </td>
                          <td>
                            <Link
                              className={listStyles.propertyLink}
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
            ) : (
              <div className={listStyles.emptyState}>
                <h3>Esta propiedad aún no tiene propietarios</h3>
                <p>Agrega una titularidad para registrar quién es dueño y en qué porcentaje.</p>
              </div>
            )}
          </section>
        ) : search.tab === "images" ? (
          <section aria-labelledby="images-title" className={`${styles.card} ${styles.imagesCard}`}>
            <h2 id="images-title" className={styles.imagesTitle}>Imágenes</h2>
            <PropertyImageManager
              canEdit={canEdit}
              coverImageId={coverImageId}
              images={images.map((image) => ({
                id: image.id,
                originalName: image.originalName,
                width: image.width,
                height: image.height,
              }))}
              propertyId={property.id}
            />
          </section>
        ) : (
          <section aria-labelledby="units-title" className={listStyles.listCard}>
            <div className={styles.unitsHeading}>
              <div>
                <h2 id="units-title">Unidades</h2>
                <p>
                  {property.unitCount} {property.unitCount === 1 ? "unidad activa" : "unidades activas"} ·{" "}
                  {property.occupiedUnitCount}{" "}
                  {property.occupiedUnitCount === 1 ? "ocupada" : "ocupadas"}
                  {archivedUnitCount > 0 && ` · ${archivedUnitCount} archivadas`}
                </p>
              </div>
              <div className={styles.unitsActions}>
                {archivedUnitCount > 0 && (
                  <Link
                    className={listStyles.resetLink}
                    href={getUnitsHref(property.id, 1, !includeArchived)}
                  >
                    {includeArchived ? "Ocultar archivadas" : "Mostrar archivadas"}
                  </Link>
                )}
                {canEdit && (
                  <>
                    <Link
                      className={styles.secondaryButton}
                      href={`/admin/properties/${encodedId}/units/generate`}
                    >
                      <Layers aria-hidden="true" size={16} />
                      Generar unidades
                    </Link>
                    <Link
                      className={styles.primaryButton}
                      href={`/admin/properties/${encodedId}/units/new`}
                    >
                      <Plus aria-hidden="true" size={16} />
                      Agregar unidad
                    </Link>
                  </>
                )}
              </div>
            </div>

            {pageUnits.length > 0 ? (
              <div className={listStyles.tableScroller}>
                <table className={`${listStyles.table} ${styles.unitsTable}`}>
                  <thead>
                    <tr>
                      <th scope="col">Unidad</th>
                      <th scope="col">Piso</th>
                      <th scope="col">Distribución</th>
                      <th scope="col">Estado</th>
                      <th className={listStyles.numericCell} scope="col">
                        Renta de referencia
                      </th>
                      <th className={listStyles.numericCell} scope="col">
                        <span className={listStyles.visuallyHidden}>Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageUnits.map((unit) => {
                      const rent = formatUnitRent(unit);
                      const stayIssue = unit.stay?.published
                        ? getStayVisibilityIssue(property, unit)
                        : undefined;
                      return (
                        <tr key={unit.id}>
                          <td>
                            <strong className={styles.unitLabel}>{unit.label}</strong>
                            {unit.archived && (
                              <span className={listStyles.archivedBadge}>Archivada</span>
                            )}
                          </td>
                          <td>{unit.floor || "—"}</td>
                          <td>{formatLayout(unit)}</td>
                          <td>
                            <span
                              className={`${listStyles.statusBadge} ${
                                styles[`unit_${unit.status}`]
                              }`}
                            >
                              {unitStatusLabels[unit.status]}
                            </span>
                            {stayIssue !== undefined && (
                              <span
                                className={`${listStyles.statusBadge} ${
                                  stayIssue ? styles.stayHidden : styles.stayPublished
                                }`}
                                title={stayIssue ? stayVisibilityIssueLabels[stayIssue] : undefined}
                              >
                                {stayIssue ? "Publicada · oculta" : "Publicada"}
                              </span>
                            )}
                          </td>
                          <td className={listStyles.numericCell}>
                            {rent ?? <span className={listStyles.muted}>—</span>}
                          </td>
                          <td className={listStyles.numericCell}>
                            {canEdit && (
                              <Link
                                aria-label={`Editar unidad ${unit.label}`}
                                className={styles.iconButton}
                                href={`/admin/properties/${encodedId}/units/${encodeURIComponent(unit.id)}/edit`}
                                title="Editar"
                              >
                                <Pencil aria-hidden="true" size={15} />
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={listStyles.emptyState}>
                <span className={listStyles.stateIcon}>
                  <DoorOpen aria-hidden="true" size={23} />
                </span>
                <h3>Esta propiedad aún no tiene unidades</h3>
                <p>
                  Agrega unidades para registrar su distribución, estado y renta de
                  referencia. La ocupación de la propiedad se calcula a partir de ellas.
                </p>
              </div>
            )}

            {visibleUnits.length > 0 && (
              <div className={listStyles.pagination}>
                <span>
                  Mostrando {unitFrom} – {unitTo} de {visibleUnits.length}{" "}
                  {visibleUnits.length === 1 ? "unidad" : "unidades"}
                </span>
                <div className={listStyles.paginationControls}>
                  {unitPage > 1 ? (
                    <Link
                      aria-label="Página anterior"
                      className={listStyles.pageButton}
                      href={getUnitsHref(property.id, unitPage - 1, includeArchived)}
                    >
                      <ChevronLeft aria-hidden="true" size={17} />
                      Anterior
                    </Link>
                  ) : (
                    <span className={`${listStyles.pageButton} ${listStyles.disabledPage}`}>
                      <ChevronLeft aria-hidden="true" size={17} />
                      Anterior
                    </span>
                  )}
                  {unitPage < totalUnitPages ? (
                    <Link
                      aria-label="Página siguiente"
                      className={listStyles.pageButton}
                      href={getUnitsHref(property.id, unitPage + 1, includeArchived)}
                    >
                      Siguiente
                      <ChevronRight aria-hidden="true" size={17} />
                    </Link>
                  ) : (
                    <span className={`${listStyles.pageButton} ${listStyles.disabledPage}`}>
                      Siguiente
                      <ChevronRight aria-hidden="true" size={17} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <p className={listStyles.scopeNote}>
          <Building2 aria-hidden="true" className={styles.inlineIcon} size={13} />
          Datos limitados a la organización activa. El estado de cada unidad se registra
          manualmente hasta que existan contratos vinculados.
        </p>
      </section>
    </AdminShell>
  );
}
