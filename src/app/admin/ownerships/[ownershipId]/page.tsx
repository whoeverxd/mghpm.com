import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { OwnershipForm } from "@/components/ownerships/ownership-form";
import { OwnershipReview, type ReviewAction } from "@/components/ownerships/ownership-review";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { listRecentAuditEvents } from "@/lib/audit/recent";
import { ownershipStatusLabels } from "@/lib/ownerships/labels";
import { getPersonSummaries, getPropertySummaries } from "@/lib/ownerships/lookups";
import { getOwnership } from "@/lib/ownerships/records";
import { canTransition, type OwnershipStatus } from "@/lib/ownerships/rules";
import { recordIdSchema } from "@/lib/properties/schema";
import peopleStyles from "@/components/people/people-detail.module.css";
import styles from "@/components/ownerships/ownerships.module.css";
import formPageStyles from "../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Titularidad",
};

type OwnershipPageProps = {
  params: Promise<{ ownershipId: string }>;
};

const dateFormat = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" });

const statusActionLabels = (from: OwnershipStatus, to: OwnershipStatus) => {
  if (to === "documents_pending") return "Marcar documentos pendientes";
  if (to === "in_review") return from === "rejected" || from === "verified" ? "Reabrir revisión" : "Pasar a revisión";
  if (to === "verified") return "Aprobar";
  return "Rechazar";
};

export default async function OwnershipPage({ params }: OwnershipPageProps) {
  const { ownershipId } = await params;
  if (!recordIdSchema.safeParse(ownershipId).success) notFound();

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

  if (!can(role, "ownerships", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar titularidades." />
      </AdminShell>
    );
  }

  const ownership = await getOwnership(organizationId, ownershipId);
  if (!ownership) notFound();

  const [people, properties, events] = await Promise.all([
    getPersonSummaries(organizationId, [ownership.personId]),
    getPropertySummaries(organizationId, [ownership.propertyId]),
    listRecentAuditEvents(organizationId, ownership.id, 50),
  ]);
  const person = people.get(ownership.personId);
  const property = properties.get(ownership.propertyId);
  const history = (events ?? []).filter((event) => event.action === "ownership.status_changed");

  const canUpdate = ownership.active && can(role, "ownerships", "update");
  const canReview = ownership.active && can(role, "ownerships", "review");
  const ownRecord = ownership.createdBy === user.uid;

  const actions: ReviewAction[] = [];
  let reviewBlocked = false;
  if (canUpdate) {
    for (const to of ["documents_pending", "in_review", "verified", "rejected"] as const) {
      if (!canTransition(ownership.status, to)) continue;
      if (to === "verified" || to === "rejected") {
        if (!canReview) continue;
        if (ownRecord) {
          reviewBlocked = true;
          continue;
        }
      }
      actions.push({ to, label: statusActionLabels(ownership.status, to) });
    }
  }

  const initialValues = {
    pct: String(ownership.pct),
    startDate: ownership.startDate,
    titleOwner: ownership.titleOwner,
    titleNumber: ownership.titleNumber,
    registryNumber: ownership.registryNumber,
    cadastralNumber: ownership.cadastralNumber,
    registryAddress: ownership.registryAddress,
  };
  // Remount both client panels whenever the stored record changes.
  const version = JSON.stringify([initialValues, ownership.checks, ownership.status, ownership.active]);

  return (
    <AdminShell {...shellProps} crumbNames={{ ownershipId: person?.name ?? "" }}>
      <section aria-label="Titularidad" className={formPageStyles.content}>
        <div className={formPageStyles.heading}>
          <p className={formPageStyles.eyebrow}>TITULARIDAD</p>
          <h1>
            {person ? (
              <Link className={peopleStyles.link} href={`/admin/people/${encodeURIComponent(person.id)}/propietario`}>
                {person.name}
              </Link>
            ) : (
              "Persona no disponible"
            )}{" "}
            ·{" "}
            {property ? (
              <Link className={peopleStyles.link} href={`/admin/properties/${encodeURIComponent(property.id)}?tab=owners`}>
                {property.name}
              </Link>
            ) : (
              "Propiedad no disponible"
            )}
          </h1>
          <div className={peopleStyles.badges}>
            <span className={peopleStyles.badge}>{ownership.pct} %</span>
            <span className={peopleStyles.badge}>{ownershipStatusLabels[ownership.status]}</span>
            {!ownership.active && <span className={peopleStyles.badge}>Finalizada</span>}
            {property?.archived && <span className={peopleStyles.badge}>Propiedad archivada</span>}
          </div>
          {ownership.status === "rejected" && ownership.rejectionReason && (
            <p>Motivo del rechazo: {ownership.rejectionReason}</p>
          )}
        </div>

        <div className={styles.stack}>
          {canUpdate && (
            <OwnershipForm
              cancelHref={person ? `/admin/people/${encodeURIComponent(person.id)}/propietario` : "/admin/people"}
              checks={ownership.checks}
              initialValues={initialValues}
              key={`form-${version}`}
              ownershipId={ownership.id}
            />
          )}

          <OwnershipReview
            actions={actions}
            canEditChecks={canUpdate}
            canEnd={ownership.active && can(role, "ownerships", "archive")}
            checks={ownership.checks}
            fields={initialValues}
            key={`review-${version}`}
            ownershipId={ownership.id}
            reviewBlocked={reviewBlocked}
          />

          <section aria-labelledby="history-title" className={styles.panel}>
            <div className={styles.panelHeading}>
              <h2 id="history-title">Historial de revisiones</h2>
            </div>
            {events === null ? (
              <p className={styles.note}>No se pudo cargar el historial.</p>
            ) : history.length === 0 ? (
              <p className={styles.note}>Aún no hay cambios de estado.</p>
            ) : (
              <ul className={styles.history}>
                {history.map((event) => (
                  <li key={event.id}>
                    <span>
                      {event.from ? ownershipStatusLabels[event.from as OwnershipStatus] ?? event.from : "—"} →{" "}
                      {event.to ? ownershipStatusLabels[event.to as OwnershipStatus] ?? event.to : "—"}
                      {event.reason && <small> · {event.reason}</small>}
                    </span>
                    <small>{event.createdAt ? dateFormat.format(event.createdAt) : "—"}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
