"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import type { UnitGenerationFormValues } from "@/lib/properties/unit-generation";
import {
  UnitGenerationFields,
  validateUnitGeneration,
  type UnitGenerationErrors,
  type UnitGenerationField,
} from "./unit-generation-fields";
import styles from "./property-form.module.css";

type UnitGenerationFormProps = {
  propertyId: string;
  initialValues: UnitGenerationFormValues;
};

export function UnitGenerationForm({ propertyId, initialValues }: UnitGenerationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<UnitGenerationErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unitsHref = `/admin/properties/${encodeURIComponent(propertyId)}?tab=units`;

  function update<K extends UnitGenerationField>(field: K, value: UnitGenerationFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const { data, errors: nextErrors } = validateUnitGeneration(values);
    setErrors(nextErrors);
    if (!data) {
      setError("Revisa los campos marcados antes de generar las unidades.");
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(
        `/api/properties/${encodeURIComponent(propertyId)}/units/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          parsedBody.success ? parsedBody.data.error : "No se pudieron generar las unidades.",
        );
      }

      router.replace(unitsHref);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron generar las unidades.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <section aria-labelledby="unit-generation-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="unit-generation-heading">Numeración y valores</h2>
          <p>Los campos con * son obligatorios.</p>
        </div>
        <UnitGenerationFields errors={errors} onChange={update} values={values} />
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <Link className={styles.cancel} href={unitsHref}>
          Cancelar
        </Link>
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? "Generando…" : "Generar unidades"}
        </button>
      </div>
    </form>
  );
}
