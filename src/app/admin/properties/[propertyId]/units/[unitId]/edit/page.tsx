import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { UnitArchiveButton } from "@/components/properties/unit-archive-button";
import { defaultUnitStayFormValues, UnitForm } from "@/components/properties/unit-form";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { getOrganizationProperty } from "@/lib/properties/records";
import { recordIdSchema } from "@/lib/properties/schema";
import { formatMinorUnitsAsDecimal } from "@/lib/properties/unit-schema";
import { getPropertyUnit } from "@/lib/properties/units";
import { getStayConfigurationIssue } from "@/lib/stays/publishable";
import styles from "../../../../form-page.module.css";

export const metadata: Metadata = {
  title: "Editar unidad",
};

type EditUnitPageProps = {
  params: Promise<{ propertyId: string; unitId: string }>;
};

export default async function EditUnitPage({ params }: EditUnitPageProps) {
  const { propertyId, unitId } = await params;
  if (
    !recordIdSchema.safeParse(propertyId).success ||
    !recordIdSchema.safeParse(unitId).success
  ) {
    notFound();
  }

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const organizationId = access.activeOrganization.organizationId;
  const hasWriteAccess = can(access.activeOrganization.role, "properties", "update");
  const [property, unit] = hasWriteAccess
    ? await Promise.all([
        getOrganizationProperty(organizationId, propertyId),
        getPropertyUnit(organizationId, propertyId, unitId),
      ])
    : [null, null];
  if (hasWriteAccess && (!property || !unit)) notFound();

  return (
    <AdminShell
      activeOrganizationId={organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
      crumbNames={{ propertyId: property?.name ?? "", unitId: unit?.label ?? "" }}
    >
      {!hasWriteAccess || !property || !unit ? (
        <PropertyAccessDenied />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{property.name.toUpperCase()}</p>
            <h1>Editar unidad {unit.label}</h1>
            <p>
              {unit.archived
                ? "Esta unidad está archivada y no cuenta en la ocupación."
                : "Actualiza la distribución, el estado y la renta de referencia."}
            </p>
          </div>
          <UnitForm
            activeLeaseId={unit.activeLeaseId}
            defaultCurrency={access.activeOrganization.baseCurrency}
            initialValues={{
              label: unit.label,
              floor: unit.floor,
              bedrooms: String(unit.bedrooms),
              bathrooms: String(unit.bathrooms),
              status: unit.status,
              marketRent:
                unit.marketRentMinor === null
                  ? ""
                  : formatMinorUnitsAsDecimal(unit.marketRentMinor),
              marketRentCurrency:
                unit.marketRentCurrency ?? access.activeOrganization.baseCurrency,
            }}
            propertyId={property.id}
            stay={
              getStayConfigurationIssue(property) === null && property.financialReference
                ? {
                    currency: property.financialReference.currency,
                    initialValues: unit.stay
                      ? {
                          published: unit.stay.published,
                          nightlyRate:
                            unit.stay.nightlyRateMinor === null
                              ? ""
                              : formatMinorUnitsAsDecimal(unit.stay.nightlyRateMinor),
                          maxGuests: String(unit.stay.maxGuests),
                          beds: String(unit.stay.beds),
                          minNights: String(unit.stay.minNights),
                          maxNights: String(unit.stay.maxNights),
                        }
                      : defaultUnitStayFormValues,
                  }
                : undefined
            }
            unitId={unit.id}
          />
          <UnitArchiveButton
            archived={unit.archived}
            propertyId={property.id}
            unitId={unit.id}
            unitLabel={unit.label}
          />
        </section>
      )}
    </AdminShell>
  );
}
