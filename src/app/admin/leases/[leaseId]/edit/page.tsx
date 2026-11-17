import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LeaseForm } from "@/components/leases/lease-form";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { getLeaseFormValues } from "@/lib/leases/form-values";
import { listRenewableLeaseOptions, listTenantOptions } from "@/lib/leases/list";
import { getOrganizationLease } from "@/lib/leases/records";
import { can } from "@/lib/access/permissions";
import { listPropertyOptions } from "@/lib/properties/list";
import { recordIdSchema } from "@/lib/properties/schema";
import styles from "../../../properties/form-page.module.css";

export const metadata: Metadata = {
  title: "Editar contrato",
};

type EditLeasePageProps = {
  params: Promise<{ leaseId: string }>;
};

export default async function EditLeasePage({ params }: EditLeasePageProps) {
  const { leaseId } = await params;
  if (!recordIdSchema.safeParse(leaseId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const organizationId = access.activeOrganization.organizationId;
  const hasWriteAccess = can(access.activeOrganization.role, "leases", "update");
  const [lease, propertyOptions, tenantOptions, renewableLeases] = hasWriteAccess
    ? await Promise.all([
        getOrganizationLease(organizationId, leaseId),
        listPropertyOptions(organizationId),
        listTenantOptions(organizationId),
        listRenewableLeaseOptions(organizationId),
      ])
    : [null, [], [], []];
  if (hasWriteAccess && !lease) notFound();
  if (lease && lease.status !== "draft" && lease.status !== "pending") {
    redirect(`/admin/leases/${encodeURIComponent(leaseId)}`);
  }

  return (
    <AdminShell
      activeOrganizationId={organizationId}
      organizations={access.memberships}
      userEmail={user.email}
      userName={user.name}
      crumbNames={{ leaseId: lease?.code ?? "" }}
    >
      {!hasWriteAccess || !lease || (lease.status !== "draft" && lease.status !== "pending") ? (
        <PropertyAccessDenied message="Tu rol no tiene permiso para administrar contratos." />
      ) : (
        <section className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>CONTRATO {lease.code}</p>
            <h1>{lease.status === "draft" ? "Continuar borrador" : "Editar contrato"}</h1>
            <p>
              {lease.status === "draft"
                ? "Completa los datos y crea el contrato, o guarda el borrador para seguir después."
                : "El contrato está pendiente de activación; los cambios quedan registrados en la auditoría."}
            </p>
          </div>
          <LeaseForm
            initialValues={getLeaseFormValues(lease)}
            leaseId={lease.id}
            propertyOptions={propertyOptions}
            renewableLeases={renewableLeases.filter((option) => option.id !== lease.id)}
            status={lease.status}
            tenantOptions={tenantOptions}
          />
        </section>
      )}
    </AdminShell>
  );
}
