"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import {
  unitInputSchema,
  type UnitCurrency,
  type UnitStatus,
} from "@/lib/properties/unit-schema";
import styles from "./property-form.module.css";

export type UnitFormValues = {
  label: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  status: UnitStatus;
  marketRent: string;
  marketRentCurrency: UnitCurrency;
};

export type UnitStayFormValues = {
  published: boolean;
  nightlyRate: string;
  maxGuests: string;
  beds: string;
  minNights: string;
  maxNights: string;
};

export const defaultUnitStayFormValues: UnitStayFormValues = {
  published: false,
  nightlyRate: "",
  maxGuests: "2",
  beds: "1",
  minNights: "1",
  maxNights: "30",
};

type UnitFormProps = {
  propertyId: string;
  unitId?: string;
  defaultCurrency: UnitCurrency;
  initialValues?: UnitFormValues;
  /** Active lease occupying the unit; it locks the status to "occupied". */
  activeLeaseId?: string | null;
  /** Present when the property accepts short stays; shows the "Estancias cortas" section. */
  stay?: { currency: UnitCurrency; initialValues: UnitStayFormValues };
};

export function UnitForm({
  propertyId,
  unitId,
  defaultCurrency,
  initialValues,
  activeLeaseId,
  stay,
}: UnitFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const values = initialValues ?? {
    label: "",
    floor: "",
    bedrooms: "1",
    bathrooms: "1",
    status: "available",
    marketRent: "",
    marketRentCurrency: defaultCurrency,
  };
  const unitsHref = `/admin/properties/${encodeURIComponent(propertyId)}?tab=units`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsedForm = unitInputSchema.safeParse({
      label: formData.get("label"),
      floor: formData.get("floor") ?? "",
      bedrooms: formData.get("bedrooms"),
      bathrooms: formData.get("bathrooms"),
      status: formData.get("status"),
      marketRent: formData.get("marketRent") ?? "",
      marketRentCurrency: formData.get("marketRentCurrency"),
      stay: stay
        ? {
            published: formData.get("stayPublished") === "on",
            nightlyRate: formData.get("nightlyRate") ?? "",
            maxGuests: formData.get("maxGuests"),
            beds: formData.get("beds"),
            minNights: formData.get("minNights"),
            maxNights: formData.get("maxNights"),
          }
        : undefined,
    });
    if (!parsedForm.success) {
      setError(parsedForm.error.issues[0]?.message ?? "Revisa los datos ingresados.");
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const baseUrl = `/api/properties/${encodeURIComponent(propertyId)}/units`;
      const response = await fetch(
        unitId ? `${baseUrl}/${encodeURIComponent(unitId)}` : baseUrl,
        {
          method: unitId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(parsedForm.data),
        },
      );

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          parsedBody.success ? parsedBody.data.error : "No se pudo guardar la unidad.",
        );
      }

      router.replace(unitsHref);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la unidad.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section aria-labelledby="unit-info-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="unit-info-heading">Información de la unidad</h2>
          <p>Los campos con * son obligatorios.</p>
        </div>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Unidad *</span>
            <input
              autoComplete="off"
              maxLength={32}
              name="label"
              placeholder="101, A-2, Principal…"
              required
              defaultValue={values.label}
            />
          </label>
          <label className={styles.field}>
            <span>Piso</span>
            <input autoComplete="off" maxLength={16} name="floor" defaultValue={values.floor} />
          </label>
          <label className={styles.field}>
            <span>Habitaciones *</span>
            <input
              inputMode="numeric"
              max={50}
              min={0}
              name="bedrooms"
              required
              step={1}
              type="number"
              defaultValue={values.bedrooms}
            />
          </label>
          <label className={styles.field}>
            <span>Baños *</span>
            <input
              inputMode="decimal"
              max={50}
              min={0}
              name="bathrooms"
              required
              step={0.5}
              type="number"
              defaultValue={values.bathrooms}
            />
          </label>
          <label className={styles.field}>
            <span>Estado *</span>
            {activeLeaseId ? (
              <>
                <input name="status" type="hidden" value="occupied" />
                <select disabled value="occupied">
                  <option value="occupied">Ocupada por contrato activo</option>
                </select>
              </>
            ) : (
              <select defaultValue={values.status} name="status" required>
                <option value="available">Disponible</option>
                <option value="occupied">Ocupada</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            )}
          </label>
        </div>
      </section>

      <section aria-labelledby="unit-rent-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="unit-rent-heading">Renta de referencia</h2>
          <p>Valor de mercado informativo. No genera cargos ni contratos.</p>
        </div>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Renta mensual</span>
            <input
              autoComplete="off"
              inputMode="decimal"
              maxLength={12}
              name="marketRent"
              pattern="\d{1,9}(\.\d{1,2})?"
              placeholder="0.00"
              defaultValue={values.marketRent}
            />
          </label>
          <label className={styles.field}>
            <span>Moneda</span>
            <select defaultValue={values.marketRentCurrency} name="marketRentCurrency">
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="DOP">DOP — Peso dominicano</option>
            </select>
          </label>
        </div>
      </section>

      {stay && (
        <section aria-labelledby="unit-stay-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2 id="unit-stay-heading">Estancias cortas</h2>
            <p>
              Configura la unidad para el catálogo público. Solo aparece si la unidad está
              disponible, sin contrato activo y la propiedad está activa.
            </p>
          </div>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Tarifa por noche ({stay.currency})</span>
              <input
                autoComplete="off"
                defaultValue={stay.initialValues.nightlyRate}
                inputMode="decimal"
                maxLength={12}
                name="nightlyRate"
                pattern="\d{1,9}(\.\d{1,2})?"
                placeholder="0.00"
              />
            </label>
            <label className={styles.field}>
              <span>Huéspedes máximos *</span>
              <input
                defaultValue={stay.initialValues.maxGuests}
                inputMode="numeric"
                max={30}
                min={1}
                name="maxGuests"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Camas *</span>
              <input
                defaultValue={stay.initialValues.beds}
                inputMode="numeric"
                max={30}
                min={0}
                name="beds"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Estancia mínima (noches) *</span>
              <input
                defaultValue={stay.initialValues.minNights}
                inputMode="numeric"
                max={365}
                min={1}
                name="minNights"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Estancia máxima (noches) *</span>
              <input
                defaultValue={stay.initialValues.maxNights}
                inputMode="numeric"
                max={365}
                min={1}
                name="maxNights"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={styles.field}>
              <span>Catálogo público</span>
              <span className={styles.checkboxOption}>
                <input
                  defaultChecked={stay.initialValues.published}
                  name="stayPublished"
                  type="checkbox"
                />
                Publicar en el catálogo
              </span>
            </label>
          </div>
        </section>
      )}

      <p className={styles.note}>
        {activeLeaseId ? (
          <>
            La ocupación la controla el{" "}
            <Link href={`/admin/leases/${encodeURIComponent(activeLeaseId)}`}>contrato activo</Link>.
            Se libera al terminar o vencer el contrato.
          </>
        ) : (
          "Al activar un contrato la unidad pasa a ocupada automáticamente. Sin contrato, el estado se registra a mano."
        )}
      </p>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <Link className={styles.cancel} href={unitsHref}>
          Cancelar
        </Link>
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? "Guardando…" : unitId ? "Guardar cambios" : "Guardar unidad"}
        </button>
      </div>
    </form>
  );
}
