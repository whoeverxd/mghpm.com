"use client";

import { Layers } from "lucide-react";
import {
  describeGeneratedLabels,
  generateUnitLabels,
  unitGenerationSchema,
  unitNumberingLabels,
  type UnitGenerationFormValues,
  type UnitGenerationInput,
} from "@/lib/properties/unit-generation";
import styles from "./property-form.module.css";

export type UnitGenerationField = keyof UnitGenerationFormValues;
export type UnitGenerationErrors = Partial<Record<UnitGenerationField, string>>;

export function validateUnitGeneration(values: UnitGenerationFormValues) {
  const parsed = unitGenerationSchema.safeParse(values);
  if (parsed.success) return { data: parsed.data, errors: {} as UnitGenerationErrors };
  const errors: UnitGenerationErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as UnitGenerationField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { data: null, errors };
}

/** Labels the current values would create, or null while they are invalid. */
export function previewUnitGeneration(values: UnitGenerationFormValues) {
  const parsed = unitGenerationSchema.safeParse(values);
  return parsed.success ? generateUnitLabels(parsed.data).map((unit) => unit.label) : null;
}

export function summarizeUnitGeneration(input: UnitGenerationInput) {
  const labels = generateUnitLabels(input).map((unit) => unit.label);
  return `${labels.length} ${labels.length === 1 ? "unidad" : "unidades"}: ${describeGeneratedLabels(labels)}`;
}

type UnitGenerationFieldsProps = {
  values: UnitGenerationFormValues;
  errors: UnitGenerationErrors;
  onChange: <K extends UnitGenerationField>(field: K, value: UnitGenerationFormValues[K]) => void;
};

export function UnitGenerationFields({ values, errors, onChange }: UnitGenerationFieldsProps) {
  const labels = previewUnitGeneration(values);

  function fieldError(field: UnitGenerationField) {
    const message = errors[field];
    return message ? (
      <small className={styles.fieldError} id={`unit-${field}-error`}>
        {message}
      </small>
    ) : null;
  }

  function invalidProps(field: UnitGenerationField) {
    return errors[field]
      ? { "aria-invalid": true, "aria-describedby": `unit-${field}-error` }
      : {};
  }

  function numberField(
    field: UnitGenerationField,
    label: string,
    options: { min?: number; max?: number; step?: number; hint?: string } = {},
  ) {
    return (
      <label className={styles.field}>
        <span>{label} *</span>
        <input
          inputMode={options.step && options.step < 1 ? "decimal" : "numeric"}
          max={options.max}
          min={options.min ?? 0}
          onChange={(event) => onChange(field, event.target.value as never)}
          step={options.step ?? 1}
          type="number"
          value={values[field] as string}
          {...invalidProps(field)}
        />
        {options.hint && !errors[field] && <small className={styles.hint}>{options.hint}</small>}
        {fieldError(field)}
      </label>
    );
  }

  return (
    <div className={styles.stepBody}>
      <fieldset className={styles.group}>
        <legend>Numeración</legend>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Esquema *</span>
            <select
              onChange={(event) =>
                onChange("numbering", event.target.value as UnitGenerationFormValues["numbering"])
              }
              value={values.numbering}
            >
              {Object.entries(unitNumberingLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Prefijo</span>
            <input
              autoComplete="off"
              maxLength={12}
              onChange={(event) => onChange("prefix", event.target.value)}
              placeholder="Ej. T1-"
              value={values.prefix}
              {...invalidProps("prefix")}
            />
            {!errors.prefix && (
              <small className={styles.hint}>Opcional; se antepone a cada identificación.</small>
            )}
            {fieldError("prefix")}
          </label>

          {values.numbering === "by_floor" ? (
            <>
              {numberField("firstFloor", "Primer piso", { min: 1, max: 200 })}
              {numberField("floorCount", "Cantidad de pisos", { min: 1, max: 200 })}
              {numberField("unitsPerFloor", "Unidades por piso", { min: 1, max: 99 })}
            </>
          ) : (
            <>
              {numberField("count", "Cantidad de unidades", { min: 1, max: 200 })}
              {values.numbering === "numeric" &&
                numberField("startNumber", "Número inicial", { min: 0, max: 999999 })}
              <label className={styles.field}>
                <span>Piso</span>
                <input
                  autoComplete="off"
                  maxLength={16}
                  onChange={(event) => onChange("floor", event.target.value)}
                  value={values.floor}
                  {...invalidProps("floor")}
                />
                {fieldError("floor")}
              </label>
            </>
          )}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Valores por unidad</legend>
        <div className={styles.fields}>
          {numberField("bedrooms", "Habitaciones", { min: 0, max: 50 })}
          {numberField("bathrooms", "Baños", { min: 0, max: 50, step: 0.5 })}
          <label className={styles.field}>
            <span>Renta mensual de referencia</span>
            <input
              autoComplete="off"
              inputMode="decimal"
              maxLength={12}
              onChange={(event) => onChange("marketRent", event.target.value)}
              placeholder="0.00"
              value={values.marketRent}
              {...invalidProps("marketRent")}
            />
            {fieldError("marketRent")}
          </label>
          <label className={styles.field}>
            <span>Moneda</span>
            <select
              onChange={(event) =>
                onChange(
                  "marketRentCurrency",
                  event.target.value as UnitGenerationFormValues["marketRentCurrency"],
                )
              }
              value={values.marketRentCurrency}
            >
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="DOP">DOP — Peso dominicano</option>
            </select>
          </label>
        </div>
        <p className={styles.hint}>
          Todas las unidades se crean disponibles. Después puedes editar cada una por separado.
        </p>
      </fieldset>

      <p aria-live="polite" className={styles.unitPreview}>
        <Layers aria-hidden="true" size={16} />
        {labels ? (
          <span>
            Se {labels.length === 1 ? "creará" : "crearán"} <strong>{labels.length}</strong>{" "}
            {labels.length === 1 ? "unidad" : "unidades"}: {describeGeneratedLabels(labels)}
          </span>
        ) : (
          <span>Completa la numeración para ver las unidades que se crearán.</span>
        )}
      </p>
    </div>
  );
}
