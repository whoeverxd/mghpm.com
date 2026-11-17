import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { PropertyForm } from "@/components/properties/property-form";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { getPropertyFormValues } from "@/lib/properties/form-values";
import { getOrganizationProperty } from "@/lib/properties/records";
import styles from "../../form-page.module.css";

export const metadata: Metadata = {
  title: "Editar propiedad",
};

const propertyIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

type EditPropertyPageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const { propertyId } = await params;
  if (!propertyIdSchema.safeParse(propertyId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const hasWriteAccess = can(access.activeOrganization.role, "properties", "update");
  const property = hasWriteAccess
    ? await getOrganizationProperty(
        access.activeOrganization.organizationId,
        propertyId,
      )
    : null;

  if (hasWriteAccess && !property) notFound();

  const initialValues = property ? getPropertyFormValues(property) : undefined;

  return (
    <AdminShell
      activeOrganizationId={access.activeOrganization.organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
      crumbNames={{ propertyId: property?.name ?? "" }}
    >
      {!hasWriteAccess ? (
        <PropertyAccessDenied />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>GESTIÓN DE PROPIEDADES</p>
            <h1>Editar propiedad</h1>
            <p>Actualiza la información principal de {property?.name}.</p>
          </div>
          {property && (
            <PropertyForm initialValues={initialValues} propertyId={propertyId} />
          )}
        </section>
      )}
    </AdminShell>
  );
}
