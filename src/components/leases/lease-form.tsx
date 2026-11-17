"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { PropertyOption } from "@/components/people/person-form";
import {
  leaseLateFeeRuleLabels,
  leasePartyRoleLabels,
  leaseRenewalTypeLabels,
  leaseSourceDescriptions,
  leaseSourceLabels,
  leaseUtilityLabels,
  leaseUtilityPartyLabels,
} from "@/lib/leases/labels";
import {
  leaseGraceDays,
  leaseInputSchema,
  leaseLateFeeRules,
  leaseNoticeDays,
  leasePartyRoles,
  leaseRenewalTypes,
  leaseSources,
  leaseUtilities,
  leaseUtilityParties,
  MAX_LEASE_PARTIES,
  type LeaseFormValues,
} from "@/lib/leases/schema";
import {
  addDays,
  formatMinorUnits,
  getDefaultEndDate,
  getFirstPeriodProrationMinor,
  getTermMonths,
} from "@/lib/leases/terms";
import { formatMinorUnitsAsDecimal, parseMoneyToMinorUnits } from "@/lib/properties/unit-schema";
import formStyles from "@/components/properties/property-form.module.css";
import styles from "./lease-form.module.css";

export type TenantPickerOption = { id: string; name: string; email: string; isTenant: boolean };

export type RenewablePickerOption = {
  id: string;
  code: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  endDate: string | null;
  currency: "USD" | "DOP";
  rentMinor: number;
};

type UnitOption = { id: string; label: string; status: string };

type LeaseFormProps = {
  leaseId?: string;
  status?: "draft" | "pending";
  initialValues: LeaseFormValues;
  propertyOptions: PropertyOption[];
  tenantOptions: TenantPickerOption[];
  renewableLeases: RenewablePickerOption[];
};

const unitListSchema = z.object({
  units: z.array(z.object({ id: z.string(), label: z.string(), status: z.string() })),
});

const unitStatusLabels: Record<string, string> = {
  available: "disponible",
  occupied: "ocupada",
  maintenance: "en mantenimiento",
};

const moneyPattern = String.raw`\d{1,9}(\.\d{1,2})?`;

function toMinor(value: string) {
  return /^\d{1,9}(\.\d{1,2})?$/.test(value) ? parseMoneyToMinorUnits(value) ?? 0 : 0;
}

export function LeaseForm({
  leaseId,
  status,
  initialValues,
  propertyOptions,
  tenantOptions,
  renewableLeases,
}: LeaseFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LeaseFormValues>(initialValues);
  const [busy, setBusy] = useState<"draft" | "pending" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<{ propertyId: string; options: UnitOption[] } | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const unitsLoaded = units?.propertyId === values.propertyId;
  const canSaveDraft = !status || status === "draft";
  const cancelHref = leaseId ? `/admin/leases/${encodeURIComponent(leaseId)}` : "/admin/leases";

  useEffect(() => {
    const propertyId = values.propertyId;
    if (!propertyId) return;
    let cancelled = false;

    fetch(`/api/properties/${encodeURIComponent(propertyId)}/units`)
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        const parsed = unitListSchema.safeParse(body);
        if (!response.ok || !parsed.success) throw new Error();
        if (!cancelled) {
          setUnitsError(null);
          setUnits({ propertyId, options: parsed.data.units });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnitsError("No se pudieron cargar las unidades de la propiedad.");
          setUnits({ propertyId, options: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [values.propertyId]);

  function update<Key extends keyof LeaseFormValues>(key: Key, value: LeaseFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function selectRenewal(renewOfLeaseId: string) {
    const renewed = renewableLeases.find((lease) => lease.id === renewOfLeaseId);
    if (!renewed) {
      update("renewOfLeaseId", "");
      return;
    }
    const startDate = renewed.endDate ? addDays(renewed.endDate, 1) : "";
    setValues((current) => ({
      ...current,
      renewOfLeaseId,
      propertyId: renewed.propertyId,
      unitId: renewed.unitId,
      tenantId: renewed.tenantId,
      currency: renewed.currency,
      rent: formatMinorUnitsAsDecimal(renewed.rentMinor),
      startDate,
      endDate: startDate ? getDefaultEndDate(startDate) : "",
      firstRentDueDate: startDate,
    }));
  }

  const rentMinor = toMinor(values.rent);
  const termMonths =
    values.startDate && values.endDate && values.endDate > values.startDate
      ? getTermMonths(values.startDate, values.endDate)
      : null;
  const proration =
    values.prorateFirstPeriod && values.startDate && rentMinor > 0
      ? getFirstPeriodProrationMinor(rentMinor, values.startDate)
      : null;
  const initialFunds = [
    { label: "Depósito de seguridad", minor: toMinor(values.securityDeposit) },
    { label: "Depósito adicional", minor: toMinor(values.additionalDeposit) },
    { label: "Depósito por mascota", minor: toMinor(values.petDeposit) },
    { label: "Renta por adelantado", minor: toMinor(values.advanceRent) },
    {
      label: values.otherChargeLabel || "Otro cargo inicial",
      minor: toMinor(values.otherCharge),
    },
    ...(values.collectFirstMonthRent
      ? [{ label: "Primer mes de renta", minor: proration ?? rentMinor }]
      : []),
  ];
  const initialFundsTotal = initialFunds.reduce((total, fund) => total + fund.minor, 0);
  const selectedProperty = propertyOptions.find((option) => option.id === values.propertyId);
  const selectedUnit = unitsLoaded
    ? units.options.find((option) => option.id === values.unitId)
    : undefined;
  const selectedTenant = tenantOptions.find((option) => option.id === values.tenantId);

  const pendingCheck = leaseInputSchema.safeParse({ ...values, intent: "pending" });
  const missing = pendingCheck.success
    ? []
    : [...new Set(pendingCheck.error.issues.map((issue) => issue.message))];

  async function save(intent: "draft" | "pending") {
    setError(null);
    const parsed = leaseInputSchema.safeParse({ ...values, intent });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos del contrato.");
      return;
    }

    setBusy(intent);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(
        leaseId ? `/api/leases/${encodeURIComponent(leaseId)}` : "/api/leases",
        {
          method: leaseId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(parsed.data),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          parsedBody.success ? parsedBody.data.error : "No se pudo guardar el contrato.",
        );
      }
      const savedId = leaseId ?? z.object({ leaseId: z.string() }).parse(body).leaseId;

      router.replace(`/admin/leases/${encodeURIComponent(savedId)}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el contrato.");
      setBusy(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("pending");
  }

  const currency = values.currency;
  const money = (minor: number) => formatMinorUnits(minor, currency);

  return (
    <form className={`${formStyles.form} ${styles.layout}`} noValidate onSubmit={submit}>
      <div className={styles.sections}>
        <section aria-labelledby="lease-source-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-source-heading">
              <span className={styles.sectionNumber}>1</span>Origen del contrato
            </h2>
            <p>
              Los contratos desde una solicitud aprobada llegarán con el módulo de
              solicitudes de alquiler.
            </p>
          </div>
          <div className={styles.sourceCards} role="radiogroup" aria-label="Origen del contrato">
            {leaseSources.map((source) => (
              <label className={styles.sourceCard} key={source}>
                <input
                  checked={values.source === source}
                  disabled={Boolean(leaseId) && source !== values.source}
                  name="source"
                  onChange={() =>
                    setValues((current) => ({
                      ...current,
                      source,
                      renewOfLeaseId: source === "renewal" ? current.renewOfLeaseId : "",
                    }))
                  }
                  type="radio"
                  value={source}
                />
                <strong>{leaseSourceLabels[source]}</strong>
                <span>{leaseSourceDescriptions[source]}</span>
              </label>
            ))}
          </div>
          <div className={formStyles.fields}>
            {values.source === "renewal" ? (
              <label className={`${formStyles.field} ${formStyles.wideField}`}>
                <span>Contrato a renovar *</span>
                <select
                  onChange={(event) => selectRenewal(event.target.value)}
                  value={values.renewOfLeaseId}
                >
                  <option value="">
                    {renewableLeases.length ? "Selecciona un contrato activo" : "No hay contratos activos"}
                  </option>
                  {renewableLeases.map((lease) => (
                    <option key={lease.id} value={lease.id}>
                      {`${lease.code} • ${lease.tenantName} • ${lease.propertyName} / ${lease.unitLabel}`}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className={`${formStyles.note} ${formStyles.wideField}`}>
                {values.source === "migration"
                  ? "Registra las condiciones del contrato vigente tal como fueron pactadas."
                  : "Completa las condiciones; el contrato queda pendiente de activación al crearlo."}
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="lease-unit-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-unit-heading">
              <span className={styles.sectionNumber}>2</span>Propiedad y unidad
            </h2>
            <p>Solo propiedades y unidades activas de la organización.</p>
          </div>
          <div className={formStyles.fields}>
            <label className={formStyles.field}>
              <span>Propiedad *</span>
              <select
                disabled={values.source === "renewal"}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    propertyId: event.target.value,
                    unitId: "",
                  }))
                }
                value={values.propertyId}
              >
                <option value="">Selecciona una propiedad</option>
                {values.propertyId && !selectedProperty && (
                  <option value={values.propertyId}>Propiedad archivada o no disponible</option>
                )}
                {propertyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${option.name} (${option.code})`}
                  </option>
                ))}
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Unidad *</span>
              <select
                disabled={!values.propertyId || !unitsLoaded || values.source === "renewal"}
                onChange={(event) => update("unitId", event.target.value)}
                value={values.unitId}
              >
                <option value="">
                  {values.propertyId && !unitsLoaded ? "Cargando unidades…" : "Selecciona una unidad"}
                </option>
                {unitsLoaded && values.unitId && !selectedUnit && (
                  <option value={values.unitId}>Unidad archivada o no disponible</option>
                )}
                {unitsLoaded &&
                  units.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {`${option.label} • ${unitStatusLabels[option.status] ?? option.status}`}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {unitsError && <p className={formStyles.error} role="alert">{unitsError}</p>}
        </section>

        <section aria-labelledby="lease-parties-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-parties-heading">
              <span className={styles.sectionNumber}>3</span>Inquilino y partes del contrato
            </h2>
            <p>
              El inquilino principal debe existir en Personas; al activar el contrato se le asigna la relación de inquilino.{" "}
              <Link href="/admin/people/new?type=tenant">Registrar inquilino</Link>
            </p>
          </div>
          <div className={formStyles.fields}>
            <label className={`${formStyles.field} ${formStyles.wideField}`}>
              <span>Inquilino principal *</span>
              <select
                disabled={values.source === "renewal"}
                onChange={(event) => update("tenantId", event.target.value)}
                value={values.tenantId}
              >
                <option value="">
                  {tenantOptions.length ? "Selecciona un inquilino" : "No hay inquilinos registrados"}
                </option>
                {values.tenantId && !selectedTenant && (
                  <option value={values.tenantId}>Inquilino archivado o no disponible</option>
                )}
                {tenantOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${option.name} • ${option.email}${option.isTenant ? "" : " (sin relación de inquilino)"}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.parties}>
            {values.parties.map((party, index) => (
              <div className={styles.partyRow} key={index}>
                <label className={formStyles.field}>
                  <span>Rol</span>
                  <select
                    onChange={(event) =>
                      update(
                        "parties",
                        values.parties.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, role: event.target.value as typeof item.role }
                            : item,
                        ),
                      )
                    }
                    value={party.role}
                  >
                    {leasePartyRoles.map((role) => (
                      <option key={role} value={role}>
                        {leasePartyRoleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={formStyles.field}>
                  <span>Nombre legal *</span>
                  <input
                    maxLength={120}
                    onChange={(event) =>
                      update(
                        "parties",
                        values.parties.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item,
                        ),
                      )
                    }
                    value={party.name}
                  />
                </label>
                <label className={formStyles.field}>
                  <span>Correo (adultos)</span>
                  <input
                    maxLength={254}
                    onChange={(event) =>
                      update(
                        "parties",
                        values.parties.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, email: event.target.value } : item,
                        ),
                      )
                    }
                    type="email"
                    value={party.email}
                  />
                </label>
                <button
                  aria-label={`Quitar parte ${index + 1}`}
                  className={styles.ghostButton}
                  onClick={() =>
                    update(
                      "parties",
                      values.parties.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            ))}
            {values.parties.length < MAX_LEASE_PARTIES && (
              <button
                className={`${styles.ghostButton} ${styles.addParty}`}
                onClick={() =>
                  update("parties", [
                    ...values.parties,
                    { role: "co_tenant", name: "", email: "" },
                  ])
                }
                type="button"
              >
                <Plus aria-hidden="true" size={15} />
                Agregar parte
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="lease-term-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-term-heading">
              <span className={styles.sectionNumber}>4</span>Plazo del contrato
            </h2>
            <p>Fechas de calendario. No pueden cruzarse con otro contrato pendiente o activo de la unidad.</p>
          </div>
          <div className={formStyles.fields}>
            <label className={formStyles.field}>
              <span>Inicio *</span>
              <input
                onChange={(event) => {
                  const startDate = event.target.value;
                  setValues((current) => ({
                    ...current,
                    startDate,
                    endDate: current.endDate || (startDate ? getDefaultEndDate(startDate) : ""),
                    firstRentDueDate:
                      !current.firstRentDueDate || current.firstRentDueDate === current.startDate
                        ? startDate
                        : current.firstRentDueDate,
                  }));
                }}
                type="date"
                value={values.startDate}
              />
            </label>
            <label className={formStyles.field}>
              <span>Fin *</span>
              <input
                min={values.startDate || undefined}
                onChange={(event) => update("endDate", event.target.value)}
                type="date"
                value={values.endDate}
              />
            </label>
            <div className={styles.computed}>
              <span>Duración</span>
              <output>
                {termMonths === null
                  ? "—"
                  : `${termMonths} ${termMonths === 1 ? "mes" : "meses"}`}
              </output>
            </div>
            <label className={formStyles.field}>
              <span>Tipo de renovación</span>
              <select
                onChange={(event) =>
                  update("renewalType", event.target.value as LeaseFormValues["renewalType"])
                }
                value={values.renewalType}
              >
                {leaseRenewalTypes.map((type) => (
                  <option key={type} value={type}>
                    {leaseRenewalTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Entrega de posesión</span>
              <input
                onChange={(event) => update("possessionDate", event.target.value)}
                type="date"
                value={values.possessionDate}
              />
            </label>
            <label className={formStyles.field}>
              <span>Mudanza</span>
              <input
                onChange={(event) => update("moveInDate", event.target.value)}
                type="date"
                value={values.moveInDate}
              />
            </label>
            <label className={formStyles.field}>
              <span>Preaviso</span>
              <select
                onChange={(event) =>
                  update("noticeDays", Number(event.target.value) as LeaseFormValues["noticeDays"])
                }
                value={values.noticeDays}
              >
                {leaseNoticeDays.map((days) => (
                  <option key={days} value={days}>
                    {days} días
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section aria-labelledby="lease-rent-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-rent-heading">
              <span className={styles.sectionNumber}>5</span>Renta y moneda
            </h2>
            <p>Montos en una sola moneda; los totales por moneda nunca se mezclan.</p>
          </div>
          <div className={formStyles.fields}>
            <label className={formStyles.field}>
              <span>Moneda *</span>
              <select
                onChange={(event) =>
                  update("currency", event.target.value as LeaseFormValues["currency"])
                }
                value={values.currency}
              >
                <option value="DOP">DOP — Peso dominicano</option>
                <option value="USD">USD — Dólar estadounidense</option>
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Renta mensual *</span>
              <input
                inputMode="decimal"
                maxLength={12}
                onChange={(event) => update("rent", event.target.value)}
                pattern={moneyPattern}
                placeholder="0.00"
                value={values.rent}
              />
            </label>
            <label className={formStyles.field}>
              <span>Día de pago</span>
              <select
                onChange={(event) => update("dueDay", Number(event.target.value))}
                value={values.dueDay}
              >
                {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>
                    Día {day}
                  </option>
                ))}
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Período de gracia</span>
              <select
                onChange={(event) =>
                  update("graceDays", Number(event.target.value) as LeaseFormValues["graceDays"])
                }
                value={values.graceDays}
              >
                {leaseGraceDays.map((days) => (
                  <option key={days} value={days}>
                    {days === 0 ? "Sin gracia" : `${days} días`}
                  </option>
                ))}
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Recargo por atraso</span>
              <select
                onChange={(event) =>
                  update("lateFeeRule", event.target.value as LeaseFormValues["lateFeeRule"])
                }
                value={values.lateFeeRule}
              >
                {leaseLateFeeRules.map((rule) => (
                  <option key={rule} value={rule}>
                    {leaseLateFeeRuleLabels[rule]}
                  </option>
                ))}
              </select>
            </label>
            {values.lateFeeRule === "flat" && (
              <label className={formStyles.field}>
                <span>Monto del recargo *</span>
                <input
                  inputMode="decimal"
                  maxLength={12}
                  onChange={(event) => update("lateFeeFlat", event.target.value)}
                  pattern={moneyPattern}
                  placeholder="0.00"
                  value={values.lateFeeFlat}
                />
              </label>
            )}
            <label className={formStyles.field}>
              <span>Primer pago de renta</span>
              <input
                min={values.startDate || undefined}
                onChange={(event) => update("firstRentDueDate", event.target.value)}
                type="date"
                value={values.firstRentDueDate}
              />
            </label>
            <div className={styles.computed}>
              <label className={styles.checkboxField}>
                <input
                  checked={values.prorateFirstPeriod}
                  onChange={(event) => update("prorateFirstPeriod", event.target.checked)}
                  type="checkbox"
                />
                Prorratear el primer período
              </label>
              <output>
                {!values.prorateFirstPeriod
                  ? "Sin prorrateo"
                  : !values.startDate || rentMinor === 0
                    ? "—"
                    : proration === null
                      ? "No hace falta: inicia el día 1"
                      : money(proration)}
              </output>
            </div>
          </div>
        </section>

        <section aria-labelledby="lease-funds-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-funds-heading">
              <span className={styles.sectionNumber}>6</span>Depósitos y fondos iniciales
            </h2>
            <p>
              Condiciones pactadas. Los cobros y recibos se registrarán con el módulo
              de pagos; aquí no se generan cargos.
            </p>
          </div>
          <div className={formStyles.fields}>
            {(
              [
                ["securityDeposit", "Depósito de seguridad"],
                ["additionalDeposit", "Depósito adicional"],
                ["petDeposit", "Depósito por mascota"],
                ["advanceRent", "Renta por adelantado"],
              ] as const
            ).map(([key, label]) => (
              <label className={formStyles.field} key={key}>
                <span>{label}</span>
                <input
                  inputMode="decimal"
                  maxLength={12}
                  onChange={(event) => update(key, event.target.value)}
                  pattern={moneyPattern}
                  placeholder="0.00"
                  value={values[key]}
                />
              </label>
            ))}
            <label className={formStyles.field}>
              <span>Otro cargo inicial (concepto)</span>
              <input
                maxLength={80}
                onChange={(event) => update("otherChargeLabel", event.target.value)}
                value={values.otherChargeLabel}
              />
            </label>
            <label className={formStyles.field}>
              <span>Otro cargo inicial (monto)</span>
              <input
                inputMode="decimal"
                maxLength={12}
                onChange={(event) => update("otherCharge", event.target.value)}
                pattern={moneyPattern}
                placeholder="0.00"
                value={values.otherCharge}
              />
            </label>
            <label className={`${styles.checkboxField} ${formStyles.wideField}`}>
              <input
                checked={values.collectFirstMonthRent}
                onChange={(event) => update("collectFirstMonthRent", event.target.checked)}
                type="checkbox"
              />
              Cobrar el primer mes de renta como fondo inicial
            </label>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Concepto</th>
                  <th className={styles.amount} scope="col">Monto</th>
                </tr>
              </thead>
              <tbody>
                {initialFunds
                  .filter((fund) => fund.minor > 0)
                  .map((fund) => (
                    <tr key={fund.label}>
                      <td>{fund.label}</td>
                      <td className={styles.amount}>{money(fund.minor)}</td>
                    </tr>
                  ))}
                <tr className={styles.totalRow}>
                  <td>Total de fondos iniciales</td>
                  <td className={styles.amount}>{money(initialFundsTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="lease-utilities-heading" className={formStyles.section}>
          <div className={formStyles.sectionHeading}>
            <h2 id="lease-utilities-heading">
              <span className={styles.sectionNumber}>7</span>Servicios y responsabilidades
            </h2>
            <p>Quién paga cada servicio según el contrato.</p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Responsable</th>
                  <th scope="col">Notas</th>
                </tr>
              </thead>
              <tbody>
                {leaseUtilities.map((utility) => (
                  <tr key={utility}>
                    <td>{leaseUtilityLabels[utility]}</td>
                    <td>
                      <select
                        aria-label={`Responsable de ${leaseUtilityLabels[utility]}`}
                        onChange={(event) =>
                          update("utilities", {
                            ...values.utilities,
                            [utility]: {
                              ...values.utilities[utility],
                              party: event.target.value as (typeof leaseUtilityParties)[number],
                            },
                          })
                        }
                        value={values.utilities[utility].party}
                      >
                        {leaseUtilityParties.map((party) => (
                          <option key={party} value={party}>
                            {leaseUtilityPartyLabels[party]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label={`Notas de ${leaseUtilityLabels[utility]}`}
                        maxLength={200}
                        onChange={(event) =>
                          update("utilities", {
                            ...values.utilities,
                            [utility]: { ...values.utilities[utility], notes: event.target.value },
                          })
                        }
                        value={values.utilities[utility].notes}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className={formStyles.note}>
          Seguro del inquilino, plantilla y anexos, firmas y requisitos de mudanza se
          agregarán con sus módulos. Crear el contrato no lo activa: la activación se
          hace desde el detalle y es la que marca la unidad como ocupada.
        </p>
      </div>

      <aside aria-labelledby="lease-summary-heading" className={styles.summary}>
        <h2 id="lease-summary-heading">Resumen</h2>
        <dl className={styles.summaryList}>
          <div>
            <dt>Origen</dt>
            <dd>{leaseSourceLabels[values.source]}</dd>
          </div>
          <div>
            <dt>Unidad</dt>
            <dd>
              {selectedProperty
                ? `${selectedProperty.name}${selectedUnit ? ` / ${selectedUnit.label}` : ""}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Inquilino</dt>
            <dd>{selectedTenant?.name ?? "—"}</dd>
          </div>
          <div>
            <dt>Partes adicionales</dt>
            <dd>{values.parties.length}</dd>
          </div>
          <div>
            <dt>Plazo</dt>
            <dd>{termMonths === null ? "—" : `${termMonths} meses`}</dd>
          </div>
          <div>
            <dt>Renta mensual</dt>
            <dd>{rentMinor > 0 ? money(rentMinor) : "—"}</dd>
          </div>
          <div>
            <dt>Depósito</dt>
            <dd>{money(toMinor(values.securityDeposit))}</dd>
          </div>
          <div>
            <dt>Fondos iniciales</dt>
            <dd>{money(initialFundsTotal)}</dd>
          </div>
        </dl>
        {missing.length > 0 ? (
          <ul aria-label="Requerido para crear" className={styles.missing}>
            {missing.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.ready}>Listo para crear el contrato.</p>
        )}
        {error && <p className={formStyles.error} role="alert">{error}</p>}
        <div className={styles.summaryActions}>
          <button className={formStyles.submit} disabled={busy !== null} type="submit">
            {busy === "pending"
              ? "Guardando…"
              : status === "pending"
                ? "Guardar cambios"
                : "Crear contrato"}
          </button>
          {canSaveDraft && (
            <button
              className={styles.ghostButton}
              disabled={busy !== null}
              onClick={() => void save("draft")}
              type="button"
            >
              {busy === "draft" ? "Guardando…" : "Guardar borrador"}
            </button>
          )}
          <Link className={formStyles.cancel} href={cancelHref}>
            Cancelar
          </Link>
        </div>
      </aside>
    </form>
  );
}
