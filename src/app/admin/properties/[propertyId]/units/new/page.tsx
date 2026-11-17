import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { defaultUnitStayFormValues, UnitForm } from "@/components/properties/unit-form";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { getOrganizationProperty } from "@/lib/properties/records";
import { recordIdSchema } from "@/lib/properties/schema";
import { getStayConfigurationIssue } from "@/lib/stays/publishable";
import styles from "../../../form-page.module.css";

export const metadata: Metadata = {
  title: "Nueva unidad",
};

type NewUnitPageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function NewUnitPage({ params }: NewUnitPageProps) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const hasWriteAccess = can(access.activeOrganization.role, "properties", "create");
  const property = hasWriteAccess
    ? await getOrganizationProperty(access.activeOrganization.organizationId, propertyId)
    : null;
  if (hasWriteAccess && !property) notFound();

  return (
    <AdminShell
      activeOrganizationId={access.activeOrganization.organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
      crumbNames={{ propertyId: property?.name ?? "" }}
    >
      {!hasWriteAccess || !property ? (
        <PropertyAccessDenied />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{property.name.toUpperCase()}</p>
            <h1>Nueva unidad</h1>
            <p>Registra una unidad en {property.name}.</p>
          </div>
          <UnitForm
            defaultCurrency={access.activeOrganization.baseCurrency}
            propertyId={property.id}
            stay={
              getStayConfigurationIssue(property) === null && property.financialReference
                ? {
                    currency: property.financialReference.currency,
                    initialValues: defaultUnitStayFormValues,
                  }
                : undefined
            }
          />
        </section>
      )}
    </AdminShell>
  );
}
