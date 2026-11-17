import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LeaseStatusActions } from "@/components/leases/lease-status-actions";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import {
  leaseLateFeeRuleLabels,
  leasePartyRoleLabels,
  leaseRenewalTypeLabels,
  leaseSourceLabels,
  leaseStatusLabels,
  leaseUtilityLabels,
  leaseUtilityPartyLabels,
} from "@/lib/leases/labels";
import { getOrganizationLease } from "@/lib/leases/records";
import { leaseUtilities } from "@/lib/leases/schema";
import {
  formatLeaseDate,
  formatMinorUnits,
  getFirstPeriodProrationMinor,
  getTermMonths,
  getTodayInTimeZone,
} from "@/lib/leases/terms";
import { can } from "@/lib/access/permissions";
import { recordIdSchema } from "@/lib/properties/schema";
import detailStyles from "../../properties/[propertyId]/detail.module.css";
import styles from "@/components/leases/leases.module.css";

export const metadata: Metadata = {
  title: "Contrato",
};

type LeasePageProps = {
  params: Promise<{ leaseId: string }>;
};

export default async function LeasePage({ params }: LeasePageProps) {
  const { leaseId } = await params;
  if (!recordIdSchema.safeParse(leaseId).success) notFound();

  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const access = gate;
  const user = gate.user;

  const organizationId = access.activeOrganization.organizationId;
  const hasAccess = can(access.activeOrganization.role, "leases", "view");
  const lease = hasAccess ? await getOrganizationLease(organizationId, leaseId) : null;
  if (hasAccess && !lease) notFound();

  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: access.memberships,
    userEmail: user.email,
    userName: user.name,
  };

  if (!lease) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied message="Tu rol no tiene permiso para consultar los contratos." />
      </AdminShell>
    );
  }

  const today = getTodayInTimeZone(access.activeOrganization.timeZone);
  const money = (minor: number) => formatMinorUnits(minor, lease.currency);
  const termMonths =
    lease.startDate && lease.endDate ? getTermMonths(lease.startDate, lease.endDate) : null;
  const proration =
    lease.prorateFirstPeriod && lease.startDate && lease.rentMinor > 0
      ? getFirstPeriodProrationMinor(lease.rentMinor, lease.startDate)
      : null;
  const initialFunds = [
    ["Depósito de seguridad", lease.securityDepositMinor],
    ["Depósito adicional", lease.additionalDepositMinor],
    ["Depósito por mascota", lease.petDepositMinor],
    ["Renta por adelantado", lease.advanceRentMinor],
    [lease.otherChargeLabel || "Otro cargo inicial", lease.otherChargeMinor],
    ...(lease.collectFirstMonthRent
      ? [["Primer mes de renta", proration ?? lease.rentMinor] as const]
      : []),
  ] as const;
  const initialFundsTotal = initialFunds.reduce((total, [, minor]) => total + minor, 0);

  return (
    <AdminShell {...shellProps} crumbNames={{ leaseId: lease?.code ?? "" }}>
      <section aria-labelledby="lease-title" className={detailStyles.content}>
        <div className={detailStyles.header}>
          <Link className={detailStyles.backLink} href="/admin/leases">
            <ArrowLeft aria-hidden="true" size={15} />
            Volver a contratos
          </Link>
          <div className={detailStyles.headerRow}>
            <div className={detailStyles.titleBlock}>
              <div className={detailStyles.titleLine}>
                <h1 id="lease-title">{lease.code}</h1>
                <span className={`${styles.statusBadge} ${styles[`status_${lease.status}`]}`}>
                  {leaseStatusLabels[lease.status]}
                </span>
              </div>
              <span className={detailStyles.metaLine}>
                {lease.tenantName} ·{" "}
                <Link href={`/admin/properties/${encodeURIComponent(lease.propertyId)}?tab=units`}>
                  {lease.propertyName} / Unidad {lease.unitLabel}
                </Link>{" "}
                · {leaseSourceLabels[lease.source]}
              </span>
            </div>
          </div>
        </div>

        {lease.closeReason && (
          <p className={styles.closeNote}>
            {lease.status === "cancelled"
              ? "Cancelado"
              : lease.status === "terminated"
                ? "Terminado"
                : "Cerrado"}{" "}
            el {formatLeaseDate(lease.closedOn)}. Motivo: {lease.closeReason}
          </p>
        )}
        {lease.status === "expired" && !lease.closeReason && (
          <p className={styles.closeNote}>Vencido el {formatLeaseDate(lease.closedOn)}.</p>
        )}

        {can(access.activeOrganization.role, "leases", "update") && (
          <LeaseStatusActions
            ended={Boolean(lease.endDate && lease.endDate < today)}
            leaseCode={lease.code}
            leaseId={lease.id}
            status={lease.status}
            today={today}
          />
        )}

        <div className={styles.detailGrid}>
          <section className={styles.card} aria-labelledby="lease-term-title">
            <h2 id="lease-term-title">Plazo</h2>
            <dl className={styles.fieldList}>
              <div>
                <dt>Inicio</dt>
                <dd>{formatLeaseDate(lease.startDate)}</dd>
              </div>
              <div>
                <dt>Fin</dt>
                <dd>{formatLeaseDate(lease.endDate)}</dd>
              </div>
              <div>
                <dt>Duración</dt>
                <dd>{termMonths === null ? "—" : `${termMonths} meses`}</dd>
              </div>
              <div>
                <dt>Entrega de posesión</dt>
                <dd>{formatLeaseDate(lease.possessionDate)}</dd>
              </div>
              <div>
                <dt>Mudanza</dt>
                <dd>{formatLeaseDate(lease.moveInDate)}</dd>
              </div>
              <div>
                <dt>Renovación</dt>
                <dd>{leaseRenewalTypeLabels[lease.renewalType]}</dd>
              </div>
              <div>
                <dt>Preaviso</dt>
                <dd>{lease.noticeDays} días</dd>
              </div>
              {lease.renewOfLeaseId && (
                <div>
                  <dt>Renueva</dt>
                  <dd>
                    <Link href={`/admin/leases/${encodeURIComponent(lease.renewOfLeaseId)}`}>
                      Contrato anterior
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className={styles.card} aria-labelledby="lease-rent-title">
            <h2 id="lease-rent-title">Renta</h2>
            <dl className={styles.fieldList}>
              <div>
                <dt>Renta mensual</dt>
                <dd>{lease.rentMinor > 0 ? money(lease.rentMinor) : "—"}</dd>
              </div>
              <div>
                <dt>Día de pago</dt>
                <dd>Día {lease.dueDay}</dd>
              </div>
              <div>
                <dt>Gracia</dt>
                <dd>{lease.graceDays === 0 ? "Sin gracia" : `${lease.graceDays} días`}</dd>
              </div>
              <div>
                <dt>Recargo</dt>
                <dd>
                  {lease.lateFeeRule === "flat"
                    ? `${money(lease.lateFeeFlatMinor)} por pago tardío`
                    : leaseLateFeeRuleLabels[lease.lateFeeRule]}
                </dd>
              </div>
              <div>
                <dt>Primer pago</dt>
                <dd>{formatLeaseDate(lease.firstRentDueDate)}</dd>
              </div>
              <div>
                <dt>Prorrateo inicial</dt>
                <dd>
                  {!lease.prorateFirstPeriod
                    ? "No"
                    : proration === null
                      ? "No hace falta"
                      : money(proration)}
                </dd>
              </div>
            </dl>
          </section>

          <section className={styles.card} aria-labelledby="lease-parties-title">
            <h2 id="lease-parties-title">Partes</h2>
            <dl className={styles.fieldList}>
              <div>
                <dt>Inquilino principal</dt>
                <dd>
                  {can(access.activeOrganization.role, "people", "update") ? (
                    <Link href={`/admin/people/${encodeURIComponent(lease.tenantId)}/edit`}>
                      {lease.tenantName}
                    </Link>
                  ) : (
                    lease.tenantName
                  )}
                </dd>
              </div>
              {lease.parties.map((party, index) => (
                <div key={index}>
                  <dt>{leasePartyRoleLabels[party.role]}</dt>
                  <dd>
                    {party.name}
                    {party.email ? ` · ${party.email}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.card} aria-labelledby="lease-funds-title">
            <h2 id="lease-funds-title">Depósitos y fondos iniciales</h2>
            <dl className={styles.fieldList}>
              {initialFunds
                .filter(([, minor]) => minor > 0)
                .map(([label, minor]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{money(minor)}</dd>
                  </div>
                ))}
              <div>
                <dt>Total</dt>
                <dd>{money(initialFundsTotal)}</dd>
              </div>
            </dl>
          </section>

          <section className={`${styles.card} ${styles.wide}`} aria-labelledby="lease-utilities-title">
            <h2 id="lease-utilities-title">Servicios y responsabilidades</h2>
            <dl className={styles.fieldList}>
              {leaseUtilities.map((utility) => {
                const entry = lease.utilities[utility];
                return (
                  <div key={utility}>
                    <dt>{leaseUtilityLabels[utility]}</dt>
                    <dd>
                      {entry ? leaseUtilityPartyLabels[entry.party] : "—"}
                      {entry?.notes ? ` · ${entry.notes}` : ""}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
