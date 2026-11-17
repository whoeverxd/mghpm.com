import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";
import { PersonForm } from "@/components/people/person-form";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { listRepresentativeOptions } from "@/lib/people/list";
import { listPropertyOptions, PROPERTY_OPTION_LIMIT } from "@/lib/properties/list";
import styles from "../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Nueva persona",
};

type NewPersonPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewPersonPage({ searchParams }: NewPersonPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const hasWriteAccess = can(access.activeOrganization.role, "people", "create");
  const requestedType = (await searchParams).type;
  // 2A-2 Task 10: `type` stays as an alias that preselects the relationship checkbox.
  const type = requestedType === "tenant" ? "tenant" : "owner";
  const [propertyOptions, representativeOptions] = hasWriteAccess
    ? await Promise.all([
        listPropertyOptions(access.activeOrganization.organizationId),
        listRepresentativeOptions(access.activeOrganization.organizationId),
      ])
    : [[], []];

  return (
    <AdminShell
      activeOrganizationId={access.activeOrganization.organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
    >
      {!hasWriteAccess ? (
        <PropertyAccessDenied message="Tu rol no tiene permiso para administrar personas." />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>PERSONAS</p>
            <h1>Nueva persona</h1>
            <p>Registra un propietario o un inquilino existente en la organización activa.</p>
          </div>
          <PersonForm
            initialValues={{
              kind: "individual",
              name: "",
              email: "",
              phone: "",
              status: type === "owner" ? "pending" : "active",
              contactName: "",
              entityType: "",
              taxId: "",
              representativeId: "",
              owner: type === "owner",
              tenant: type === "tenant",
              propertyId: "",
              unitId: "",
            }}
            propertyOptions={propertyOptions}
            propertyOptionsTruncated={propertyOptions.length >= PROPERTY_OPTION_LIMIT}
            representativeOptions={representativeOptions}
          />
        </section>
      )}
    </AdminShell>
  );
}
