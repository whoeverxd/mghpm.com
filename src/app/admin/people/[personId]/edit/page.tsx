import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PersonArchiveButton } from "@/components/people/person-archive-button";
import { PersonForm } from "@/components/people/person-form";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { relationshipLabels } from "@/lib/people/labels";
import { listRepresentativeOptions } from "@/lib/people/list";
import { getOrganizationPerson } from "@/lib/people/records";
import { can } from "@/lib/access/permissions";
import { listPropertyOptions, PROPERTY_OPTION_LIMIT } from "@/lib/properties/list";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "../../../properties/form-page.module.css";
import formStyles from "@/components/properties/property-form.module.css";

export const metadata: Metadata = {
  title: "Editar persona",
};

type EditPersonPageProps = {
  params: Promise<{ personId: string }>;
};

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const { personId } = await params;
  if (!recordIdSchema.safeParse(personId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const organizationId = access.activeOrganization.organizationId;
  const hasWriteAccess = can(access.activeOrganization.role, "people", "update");
  const [person, propertyOptions, representativeOptions] = hasWriteAccess
    ? await Promise.all([
        getOrganizationPerson(organizationId, personId),
        listPropertyOptions(organizationId),
        listRepresentativeOptions(organizationId),
      ])
    : [null, [], []];
  if (hasWriteAccess && !person) notFound();

  return (
    <AdminShell
      activeOrganizationId={organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
      crumbNames={{ personId: person?.name ?? "" }}
    >
      {!hasWriteAccess || !person ? (
        <PropertyAccessDenied message="Tu rol no tiene permiso para administrar personas." />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{(person.relationshipTypes.map((type) => relationshipLabels[type]).join(" · ") || "Persona").toUpperCase()}</p>
            <h1>{person.name}</h1>
            <p>
              {person.archived
                ? "Este registro está archivado. Restáuralo para editarlo."
                : "Actualiza los datos de contacto y el estado del registro."}
            </p>
          </div>
          {person.archived ? (
            <div className={formStyles.actions}>
              <Link className={formStyles.cancel} href="/admin/people?archived=1">
                Volver al directorio
              </Link>
            </div>
          ) : (
            <PersonForm
              initialValues={{
                kind: person.kind,
                name: person.name,
                email: person.email,
                phone: person.phone,
                status: person.status,
                contactName: person.contactName,
                entityType: person.entityType ?? "",
                taxId: person.taxId ?? "",
                representativeId: person.representativeId ?? "",
                owner: person.relationshipTypes.includes("owner"),
                tenant: person.relationshipTypes.includes("tenant"),
                propertyId: person.propertyId ?? "",
                unitId: person.unitId ?? "",
              }}
              personId={person.id}
              propertyOptions={propertyOptions}
              propertyOptionsTruncated={propertyOptions.length >= PROPERTY_OPTION_LIMIT}
              representativeOptions={representativeOptions}
            />
          )}
          {!person.archived && (
            <section className={formStyles.section} aria-labelledby="person-access-heading">
              <div className={formStyles.sectionHeading}>
                <h2 id="person-access-heading">Acceso a la plataforma</h2>
                <p>
                  {person.accountUid
                    ? "Esta persona tiene una cuenta de acceso. Su correo no puede cambiarse mientras la tenga."
                    : "Esta persona aún no tiene cuenta. Puedes crearla y enviarle el correo para definir su contraseña."}
                </p>
              </div>
              <div className={formStyles.actions} style={{ padding: "16px 22px" }}>
                <Link
                  className={formStyles.submit}
                  href={
                    person.accountUid
                      ? `/admin/users/${encodeURIComponent(person.accountUid)}/edit`
                      : `/admin/users/new?personId=${encodeURIComponent(person.id)}`
                  }
                >
                  {person.accountUid ? "Administrar acceso" : "Dar acceso"}
                </Link>
              </div>
            </section>
          )}
          <PersonArchiveButton
            archived={person.archived}
            personId={person.id}
            personName={person.name}
          />
        </section>
      )}
    </AdminShell>
  );
}
