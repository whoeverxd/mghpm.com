import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { UnitGenerationForm } from "@/components/properties/unit-generation-form";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { getOrganizationProperty } from "@/lib/properties/records";
import { recordIdSchema } from "@/lib/properties/schema";
import { getDefaultUnitGenerationValues } from "@/lib/properties/unit-generation";
import { formatMinorUnitsAsDecimal } from "@/lib/properties/unit-schema";
import { listPropertyUnits } from "@/lib/properties/units";
import styles from "../../../form-page.module.css";

export const metadata: Metadata = {
  title: "Generar unidades",
};

type GenerateUnitsPageProps = {
  params: Promise<{ propertyId: string }>;
};

/** Next number after the highest purely numeric active label, or 101. */
function suggestStartNumber(labels: string[]) {
  const numbers = labels.filter((label) => /^\d{1,6}$/.test(label)).map(Number);
  return numbers.length > 0 ? Math.min(Math.max(...numbers) + 1, 999_999) : 101;
}

export default async function GenerateUnitsPage({ params }: GenerateUnitsPageProps) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const organizationId = access.activeOrganization.organizationId;
  const hasWriteAccess = can(access.activeOrganization.role, "properties", "create");
  const property = hasWriteAccess ? await getOrganizationProperty(organizationId, propertyId) : null;
  if (hasWriteAccess && !property) notFound();
  const units = property ? await listPropertyUnits(organizationId, propertyId) : [];

  const financial = property?.financialReference;
  const initialValues = getDefaultUnitGenerationValues({
    startNumber: String(
      suggestStartNumber(units.filter((unit) => !unit.archived).map((unit) => unit.label)),
    ),
    marketRent:
      financial?.startingRentMinor != null
        ? formatMinorUnitsAsDecimal(financial.startingRentMinor)
        : "",
    marketRentCurrency: financial?.currency ?? access.activeOrganization.baseCurrency,
  });

  return (
    <AdminShell
      activeOrganizationId={organizationId}
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
            <h1>Generar unidades</h1>
            <p>
              Crea varias unidades de {property.name} de una vez. Si alguna identificación ya
              existe, no se crea ninguna.
            </p>
          </div>
          <UnitGenerationForm initialValues={initialValues} propertyId={property.id} />
        </section>
      )}
    </AdminShell>
  );
}
