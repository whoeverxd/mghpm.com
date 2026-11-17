import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ActivityList } from "@/components/people/activity-list";
import { PersonHeader } from "@/components/people/person-header";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { listRecentAuditEvents } from "@/lib/audit/recent";
import { allMemberStatusLabels, portalLabels } from "@/lib/members/roles";
import { listOrganizationMembers } from "@/lib/members/records";
import { entityTypeLabels, personKindLabels } from "@/lib/people/labels";
import { listRepresentedEntities } from "@/lib/people/list";
import { getOrganizationPerson } from "@/lib/people/records";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "@/components/people/people-detail.module.css";

export const metadata: Metadata = {
  title: "Ficha de persona",
};

type PersonPageProps = {
  params: Promise<{ personId: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
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

  if (!can(role, "people", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar el directorio de personas." />
      </AdminShell>
    );
  }

  const person = await getOrganizationPerson(organizationId, personId);
  if (!person) notFound();

  const canViewMembers = can(role, "members", "view");
  const [representative, represented, members, activity] = await Promise.all([
    person.representativeId
      ? getOrganizationPerson(organizationId, person.representativeId)
      : Promise.resolve(null),
    person.kind === "individual"
      ? listRepresentedEntities(organizationId, person.id)
      : Promise.resolve([]),
    canViewMembers ? listOrganizationMembers(organizationId) : Promise.resolve(null),
    listRecentAuditEvents(organizationId, person.id),
  ]);
  const portalAccounts = (members ?? []).filter((member) =>
    Object.values(member.portalPersonIds).includes(person.id),
  );
  const encodedId = encodeURIComponent(person.id);

  const identityFields: [string, ReactNode][] = [
    ["Tipo", personKindLabels[person.kind]],
    ...(person.kind === "entity"
      ? ([
          ["Tipo de entidad", person.entityType ? entityTypeLabels[person.entityType] : "—"],
          ["RNC / EIN", person.taxId || "—"],
          ["Persona de contacto", person.contactName || "—"],
        ] as [string, ReactNode][])
      : []),
    ["Correo electrónico", person.email],
    ["Teléfono", person.phone || "—"],
  ];

  return (
    <AdminShell {...shellProps} crumbNames={{ personId: person?.name ?? "" }}>
      <section aria-label="Ficha de persona" className={styles.content}>
        <PersonHeader
          canEdit={can(role, "people", "update")}
          person={person}
          section="overview"
        />

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>Identidad y contacto</h2>
            <dl className={styles.fieldList}>
              {identityFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.card}>
            <h2>{person.kind === "entity" ? "Representante" : "Representa a"}</h2>
            {person.kind === "entity" ? (
              representative ? (
                <p>
                  <Link
                    className={styles.link}
                    href={`/admin/people/${encodeURIComponent(representative.id)}`}
                  >
                    {representative.name}
                  </Link>
                </p>
              ) : (
                <p className={styles.empty}>Esta entidad no tiene representante.</p>
              )
            ) : represented.length > 0 ? (
              <ul className={styles.activity}>
                {represented.map((entity) => (
                  <li key={entity.id}>
                    <Link className={styles.link} href={`/admin/people/${encodeURIComponent(entity.id)}`}>
                      {entity.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>No representa a ninguna entidad.</p>
            )}
          </section>
        </div>

        {(person.relationships.owner || person.relationships.tenant) && (
          <section aria-labelledby="relations-title" className={styles.card}>
            <h2 id="relations-title">Relaciones</h2>
            <div className={styles.relationCards}>
              {person.relationships.owner && (
                <Link className={styles.relationCard} href={`/admin/people/${encodedId}/propietario`}>
                  <strong>Ver como propietario</strong>
                  <span>Titularidades, porcentajes y verificación.</span>
                </Link>
              )}
              {person.relationships.tenant && (
                <Link className={styles.relationCard} href={`/admin/people/${encodedId}/inquilino`}>
                  <strong>Ver como inquilino</strong>
                  <span>Contratos vigentes e historial.</span>
                </Link>
              )}
            </div>
          </section>
        )}

        {canViewMembers && (
          <section aria-labelledby="portals-title" className={styles.card}>
            <h2 id="portals-title">Acceso a portales</h2>
            {portalAccounts.length === 0 ? (
              <p className={styles.empty}>Ninguna cuenta usa a esta persona para entrar a un portal.</p>
            ) : (
              <ul className={styles.activity}>
                {portalAccounts.map((member) => (
                  <li key={member.uid}>
                    <Link className={styles.link} href={`/admin/users/${encodeURIComponent(member.uid)}/edit`}>
                      {member.displayName ?? member.email ?? member.uid}
                    </Link>
                    <small>
                      {member.portals.map((lane) => portalLabels[lane]).join(", ") || "Sin portales"} ·{" "}
                      {allMemberStatusLabels[member.status] ?? member.status}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <ActivityList entries={activity} />
      </section>
    </AdminShell>
  );
}
