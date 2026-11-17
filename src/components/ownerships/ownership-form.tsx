"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { ownershipChecks, type OwnershipCheck } from "@/lib/ownerships/rules";
import styles from "@/components/properties/property-form.module.css";
import ownershipStyles from "./ownerships.module.css";

export type OwnershipFormValues = {
  pct: string;
  startDate: string;
  titleOwner: string;
  titleNumber: string;
  registryNumber: string;
  cadastralNumber: string;
  registryAddress: string;
};

export type OwnershipFormOption = { id: string; label: string };

type OwnershipFormProps = {
  /** Present when editing; creation leaves it out. */
  ownershipId?: string;
  initialValues: OwnershipFormValues;
  /** Evidence checks, sent unchanged on edit (the review panel edits them). */
  checks?: Record<OwnershipCheck, boolean>;
  /** Creation: a fixed person or property, or the options to pick from. */
  fixedPerson?: OwnershipFormOption;
  fixedProperty?: OwnershipFormOption;
  personOptions?: OwnershipFormOption[];
  propertyOptions?: OwnershipFormOption[];
  /** Percentage still free per property id. */
  availableByProperty?: Record<string, number>;
  cancelHref: string;
};

const errorBodySchema = z.object({ error: z.string() });
const createdSchema = z.object({ ownershipId: z.string() });

export function OwnershipForm({
  ownershipId,
  initialValues,
  checks,
  fixedPerson,
  fixedProperty,
  personOptions = [],
  propertyOptions = [],
  availableByProperty = {},
  cancelHref,
}: OwnershipFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [propertyId, setPropertyId] = useState(fixedProperty?.id ?? "");
  const editing = Boolean(ownershipId);
  const available = propertyId ? availableByProperty[propertyId] : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "");
    const fields = {
      pct: text("pct"),
      startDate: text("startDate"),
      titleOwner: text("titleOwner"),
      titleNumber: text("titleNumber"),
      registryNumber: text("registryNumber"),
      cadastralNumber: text("cadastralNumber"),
      registryAddress: text("registryAddress"),
    };
    const personId = fixedPerson?.id ?? text("personId");
    if (!editing && (!personId || !(fixedProperty?.id ?? propertyId))) {
      setError("Selecciona la persona y la propiedad.");
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(
        editing ? `/api/ownerships/${encodeURIComponent(ownershipId ?? "")}` : "/api/ownerships",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
          body: JSON.stringify(
            editing
              ? { ...fields, checks: checks ?? Object.fromEntries(ownershipChecks.map((check) => [check, false])) }
              : { ...fields, personId, propertyId: fixedProperty?.id ?? propertyId },
          ),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const parsedError = errorBodySchema.safeParse(body);
        throw new Error(parsedError.success ? parsedError.data.error : "No se pudo guardar la titularidad.");
      }

      if (editing) {
        setSaved(true);
        setBusy(false);
        router.refresh();
        return;
      }
      const created = createdSchema.safeParse(body);
      if (!created.success) throw new Error("No se pudo guardar la titularidad.");
      router.replace(`/admin/ownerships/${encodeURIComponent(created.data.ownershipId)}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la titularidad.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section aria-labelledby="ownership-data-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="ownership-data-heading">{editing ? "Datos de la titularidad" : "Nueva titularidad"}</h2>
          <p>Los campos con * son obligatorios. Los datos del título son internos y no se muestran en los portales.</p>
        </div>
        <div className={styles.fields}>
          {!editing && (
            <>
              <label className={styles.field}>
                <span>Persona *</span>
                {fixedPerson ? (
                  <input disabled readOnly value={fixedPerson.label} />
                ) : (
                  <select defaultValue="" name="personId" required>
                    <option value="">Selecciona…</option>
                    {personOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className={styles.field}>
                <span>Propiedad *</span>
                {fixedProperty ? (
                  <input disabled readOnly value={fixedProperty.label} />
                ) : (
                  <select
                    name="propertyId"
                    onChange={(event) => setPropertyId(event.target.value)}
                    required
                    value={propertyId}
                  >
                    <option value="">Selecciona…</option>
                    {propertyOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </>
          )}
          <label className={styles.field}>
            <span>Porcentaje de titularidad (%) *</span>
            <input
              defaultValue={initialValues.pct}
              inputMode="decimal"
              maxLength={6}
              name="pct"
              placeholder="50"
              required
            />
            {!editing && available !== undefined && (
              <small className={ownershipStyles.available}>
                Disponible en esta propiedad: {available} %
              </small>
            )}
          </label>
          <label className={styles.field}>
            <span>Inicio de la titularidad *</span>
            <input defaultValue={initialValues.startDate} name="startDate" required type="date" />
          </label>
          <label className={styles.field}>
            <span>Titular según el título</span>
            <input defaultValue={initialValues.titleOwner} maxLength={120} name="titleOwner" />
          </label>
          <label className={styles.field}>
            <span>Número de título</span>
            <input defaultValue={initialValues.titleNumber} maxLength={120} name="titleNumber" />
          </label>
          <label className={styles.field}>
            <span>Número de registro</span>
            <input defaultValue={initialValues.registryNumber} maxLength={120} name="registryNumber" />
          </label>
          <label className={styles.field}>
            <span>Número catastral</span>
            <input defaultValue={initialValues.cadastralNumber} maxLength={120} name="cadastralNumber" />
          </label>
          <label className={`${styles.field} ${styles.wideField}`}>
            <span>Dirección registral</span>
            <input defaultValue={initialValues.registryAddress} maxLength={200} name="registryAddress" />
          </label>
        </div>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {saved && <p className={styles.note} role="status">Cambios guardados.</p>}

      <div className={styles.actions}>
        <Link className={styles.cancel} href={cancelHref}>
          {editing ? "Volver" : "Cancelar"}
        </Link>
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear titularidad"}
        </button>
      </div>
    </form>
  );
}
