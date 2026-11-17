import type { Metadata } from "next";
import { LeaseForm } from "@/components/leases/lease-form";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { getNewLeaseFormValues } from "@/lib/leases/form-values";
import { listRenewableLeaseOptions, listTenantOptions } from "@/lib/leases/list";
import { can } from "@/lib/access/permissions";
import { listPropertyOptions } from "@/lib/properties/list";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Crear contrato",
};

type NewLeasePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readRecordId(value: string | string[] | undefined) {
  return typeof value === "string" && recordIdSchema.safeParse(value).success ? value : undefined;
}

export default async function NewLeasePage({ searchParams }: NewLeasePageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const organizationId = access.activeOrganization.organizationId;
  const hasWriteAccess = can(access.activeOrganization.role, "leases", "create");
  const params = await searchParams;
  const [propertyOptions, tenantOptions, renewableLeases] = hasWriteAccess
    ? await Promise.all([
        listPropertyOptions(organizationId),
        listTenantOptions(organizationId),
        listRenewableLeaseOptions(organizationId),
      ])
    : [[], [], []];

  return (
    <AdminShell
      activeOrganizationId={organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
    >
      {!hasWriteAccess ? (
        <PropertyAccessDenied message="Tu rol no tiene permiso para administrar contratos." />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>ARRENDAMIENTOS</p>
            <h1>Crear contrato</h1>
            <p>
              Registra las condiciones del contrato. Puedes guardarlo como borrador o
              crearlo pendiente de activación.
            </p>
          </div>
          <LeaseForm
            initialValues={getNewLeaseFormValues(access.activeOrganization.baseCurrency, {
              propertyId: readRecordId(params.propertyId),
              unitId: readRecordId(params.unitId),
              tenantId: readRecordId(params.tenantId),
            })}
            propertyOptions={propertyOptions}
            renewableLeases={renewableLeases}
            tenantOptions={tenantOptions}
          />
        </section>
      )}
    </AdminShell>
  );
}
