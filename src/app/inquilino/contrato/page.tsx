import type { Metadata } from "next";
import styles from "@/components/access/portal-shell.module.css";
import { requireLane } from "@/lib/access/authorize";
import { leaseStatusLabels } from "@/lib/leases/labels";
import { listTenantLeases } from "@/lib/leases/list";
import { formatLeaseDate, formatMinorUnits } from "@/lib/leases/terms";

export const metadata: Metadata = { title: "Mi contrato" };

export default async function TenantLeasePage() {
  const access = await requireLane("tenant");
  if (access.kind !== "allowed" || !access.personId) return null; // the layout already handled the denial

  const lease = (await listTenantLeases(access.organizationId, access.personId)).find(
    (candidate) => candidate.status === "active",
  );

  return (
    <section className={styles.card}>
      <h1>Mi contrato</h1>
      {lease ? (
        <dl className={styles.details}>
          <dt>Propiedad</dt>
          <dd>{lease.propertyName}</dd>
          <dt>Unidad</dt>
          <dd>{lease.unitLabel}</dd>
          <dt>Inicio</dt>
          <dd>{formatLeaseDate(lease.startDate)}</dd>
          <dt>Fin</dt>
          <dd>{formatLeaseDate(lease.endDate)}</dd>
          <dt>Renta</dt>
          <dd>{formatMinorUnits(lease.rentMinor, lease.currency)}</dd>
          <dt>Depósito</dt>
          <dd>{formatMinorUnits(lease.securityDepositMinor, lease.currency)}</dd>
          <dt>Estado</dt>
          <dd>{leaseStatusLabels[lease.status]}</dd>
        </dl>
      ) : (
        <p>No tienes un contrato activo.</p>
      )}
    </section>
  );
}
