"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useState, type FormEvent, type ReactElement } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { emptyPropertyFormValues } from "@/lib/properties/form-values";
import {
  propertyAmenityLabels,
  propertyCountryLabels,
  propertyRentalCategoryLabels,
  propertyStatusLabels,
  propertyTypeLabels,
} from "@/lib/properties/labels";
import {
  propertyAmenities,
  propertyInputSchema,
  type PropertyInput,
} from "@/lib/properties/schema";
import {
  getDefaultUnitGenerationValues,
  type UnitGenerationFormValues,
} from "@/lib/properties/unit-generation";
import { PropertyLocationPicker } from "./property-location-picker";
import {
  summarizeUnitGeneration,
  UnitGenerationFields,
  validateUnitGeneration,
  type UnitGenerationErrors,
  type UnitGenerationField,
} from "./unit-generation-fields";
import styles from "./property-form.module.css";

export type PropertyFormValues = PropertyInput;
type FieldName = keyof PropertyFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

type PropertyFormProps = {
  propertyId?: string;
  initialValues?: PropertyFormValues;
};

type StepKey = "info" | "address" | "rental" | "units" | "review";
type WizardStep = { key: StepKey; title: string; description: string; fields: FieldName[] };

const dataSteps: WizardStep[] = [
  {
    key: "info",
    title: "Información",
    description: "Identidad, estado y categoría de renta de la propiedad.",
    fields: ["name", "code", "type", "status", "rentalCategory", "managementStartDate", "description"],
  },
  {
    key: "address",
    title: "Dirección y ubicación",
    description: "Busca la dirección en Google para completar los campos y fijar el pin en el mapa.",
    fields: ["address", "city", "state", "postalCode", "country", "location"],
  },
  {
    key: "rental",
    title: "Renta y servicios",
    description: "Valores de referencia; los montos reales se definen en cada contrato.",
    fields: [
      "currency",
      "startingRent",
      "securityDeposit",
      "cleaningFee",
      "electricityIncluded",
      "electricityMeterRequired",
      "waterIncluded",
      "internetIncluded",
      "electricityMeterNumber",
      "initialMeterReading",
      "electricityRatePerKwh",
      "amenities",
    ],
  },
];
const unitsStep: WizardStep = {
  key: "units",
  title: "Unidades",
  description:
    "Crea las unidades de la propiedad de una vez con una numeración. Puedes omitir este paso y agregarlas después desde el detalle.",
  fields: [],
};
const reviewStep: WizardStep = {
  key: "review",
  title: "Revisión",
  description: "Confirma la información antes de guardar.",
  fields: [],
};
// Units are generated only when the property is created; later batches use the detail page.
const createSteps = [...dataSteps, unitsStep, reviewStep];
const editSteps = [...dataSteps, reviewStep];

function validate(values: PropertyFormValues) {
  const parsed = propertyInputSchema.safeParse(values);
  if (parsed.success) return { data: parsed.data, errors: {} as FieldErrors };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as FieldName | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { data: null, errors };
}

function errorsForStep(
  steps: WizardStep[],
  errors: FieldErrors,
  unitErrors: UnitGenerationErrors,
  step: number,
): string[] {
  if (steps[step].key === "units") return Object.keys(unitErrors).filter((field) => unitErrors[field as UnitGenerationField]);
  return steps[step].fields.filter((field) => errors[field]);
}

function formatMoney(value: string, currency: string) {
  if (!value) return "—";
  return new Intl.NumberFormat("es-DO", { style: "currency", currency }).format(Number(value));
}

function yesNo(value: boolean) {
  return value ? "Sí" : "No";
}

export function PropertyForm({
  propertyId,
  initialValues = emptyPropertyFormValues,
}: PropertyFormProps) {
  const router = useRouter();
  const isEdit = Boolean(propertyId);
  const steps = isEdit ? editSteps : createSteps;
  const REVIEW_STEP = steps.length - 1;
  const UNITS_STEP = steps.indexOf(unitsStep);
  const [values, setValues] = useState<PropertyFormValues>(initialValues);
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(isEdit ? REVIEW_STEP : 0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [createUnits, setCreateUnits] = useState(false);
  const [unitValues, setUnitValues] = useState(getDefaultUnitGenerationValues);
  const [unitErrors, setUnitErrors] = useState<UnitGenerationErrors>({});
  const [unitRentTouched, setUnitRentTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends FieldName>(field: K, value: PropertyFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function updateUnit<K extends UnitGenerationField>(field: K, value: UnitGenerationFormValues[K]) {
    setUnitValues((current) => ({ ...current, [field]: value }));
    setUnitErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    if (field === "marketRent" || field === "marketRentCurrency") setUnitRentTouched(true);
  }

  function goTo(nextStep: number) {
    // The units' reference rent follows the property's starting rent until edited.
    if (nextStep === UNITS_STEP && !unitRentTouched) {
      setUnitValues((current) => ({
        ...current,
        marketRent: values.startingRent,
        marketRentCurrency: values.currency,
      }));
    }
    setStep(nextStep);
    setFurthestStep((current) => Math.max(current, nextStep));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateUnits() {
    if (!createUnits) return { data: null, errors: {} as UnitGenerationErrors };
    return validateUnitGeneration(unitValues);
  }

  function next() {
    if (step === UNITS_STEP) {
      const { errors: nextUnitErrors } = validateUnits();
      setUnitErrors(nextUnitErrors);
      if (Object.keys(nextUnitErrors).length === 0) goTo(step + 1);
      return;
    }
    const { errors: nextErrors } = validate(values);
    const stepErrors = errorsForStep(steps, nextErrors, unitErrors, step);
    if (stepErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    goTo(step + 1);
  }

  async function save(asDraft: boolean) {
    setError(null);
    const candidate = asDraft ? { ...values, status: "draft" as const } : values;
    const { data, errors: nextErrors } = validate(candidate);
    const units = isEdit ? { data: null, errors: {} } : validateUnits();
    if (!data || Object.keys(units.errors).length > 0) {
      setErrors(nextErrors);
      setUnitErrors(units.errors);
      const firstStep = steps.findIndex(
        (_, index) => errorsForStep(steps, nextErrors, units.errors, index).length > 0,
      );
      if (firstStep >= 0 && firstStep !== step) goTo(firstStep);
      setError("Revisa los campos marcados antes de guardar.");
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(
        propertyId ? `/api/properties/${encodeURIComponent(propertyId)}` : "/api/properties",
        {
          method: propertyId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(isEdit ? data : { ...data, unitGeneration: units.data }),
        },
      );

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const parsedBody = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          parsedBody.success
            ? parsedBody.data.error
            : "No se pudo guardar la propiedad.",
        );
      }

      const body: unknown = await response.json().catch(() => null);
      const parsedBody = z.object({ propertyId: z.string().min(1) }).safeParse(body);
      router.replace(
        parsedBody.success
          ? `/admin/properties/${encodeURIComponent(parsedBody.data.propertyId)}`
          : "/admin/properties",
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la propiedad.");
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < REVIEW_STEP) next();
    else void save(false);
  }

  function fieldError(field: FieldName) {
    const message = errors[field];
    return message ? (
      <small className={styles.fieldError} id={`${field}-error`}>
        {message}
      </small>
    ) : null;
  }

  function invalidProps(field: FieldName) {
    return errors[field]
      ? { "aria-invalid": true, "aria-describedby": `${field}-error` }
      : {};
  }

  function textField(
    field: FieldName,
    label: string,
    options: {
      required?: boolean;
      wide?: boolean;
      maxLength?: number;
      autoComplete?: string;
      inputMode?: "decimal" | "text";
      placeholder?: string;
      type?: string;
    } = {},
  ) {
    return (
      <label className={`${styles.field} ${options.wide ? styles.wideField : ""}`}>
        <span>
          {label}
          {options.required && " *"}
        </span>
        <input
          autoComplete={options.autoComplete ?? "off"}
          inputMode={options.inputMode}
          maxLength={options.maxLength}
          onChange={(event) => update(field, event.target.value as never)}
          placeholder={options.placeholder}
          type={options.type ?? "text"}
          value={values[field] as string}
          {...invalidProps(field)}
        />
        {fieldError(field)}
      </label>
    );
  }

  function toggle(field: FieldName, label: string, hint: string) {
    return (
      <label className={styles.toggleRow}>
        <span>
          <strong>{label}</strong>
          <small>{hint}</small>
        </span>
        <input
          checked={values[field] as boolean}
          className={styles.switch}
          onChange={(event) => update(field, event.target.checked as never)}
          role="switch"
          type="checkbox"
        />
      </label>
    );
  }

  const addressRequired = values.status !== "draft";

  function unitReviewRows(): [string, string][] {
    if (!createUnits) return [["Unidades", "No se crearán unidades ahora"]];
    const parsed = validateUnitGeneration(unitValues).data;
    if (!parsed) return [["Unidades", "Revisa la numeración"]];
    return [
      ["Unidades", summarizeUnitGeneration(parsed)],
      ["Distribución", `${parsed.bedrooms} hab. · ${parsed.bathrooms} baños`],
      ["Renta de referencia", formatMoney(parsed.marketRent, parsed.marketRentCurrency)],
    ];
  }

  const stepContent: ReactElement[] = [
    <div className={styles.fields} key="info">
      {textField("name", "Nombre de la propiedad", {
        required: true,
        maxLength: 120,
        autoComplete: "organization",
      })}
      <label className={styles.field}>
        <span>Código interno *</span>
        <input
          autoComplete="off"
          maxLength={32}
          onChange={(event) => update("code", event.target.value.toUpperCase())}
          placeholder="Ej. TORRE-A"
          value={values.code}
          {...invalidProps("code")}
        />
        {fieldError("code")}
      </label>
      <label className={styles.field}>
        <span>Tipo de propiedad *</span>
        <select
          onChange={(event) => update("type", event.target.value as PropertyFormValues["type"])}
          value={values.type}
        >
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>Estado del registro *</span>
        <select
          onChange={(event) => update("status", event.target.value as PropertyFormValues["status"])}
          value={values.status}
        >
          {Object.entries(propertyStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <small className={styles.hint}>
          Un borrador puede guardarse sin dirección completa.
        </small>
      </label>
      <label className={styles.field}>
        <span>Categoría de renta *</span>
        <select
          onChange={(event) =>
            update("rentalCategory", event.target.value as PropertyFormValues["rentalCategory"])
          }
          value={values.rentalCategory}
        >
          {Object.entries(propertyRentalCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      {textField("managementStartDate", "Inicio de la administración", { type: "date" })}
      <label className={`${styles.field} ${styles.wideField}`}>
        <span>Descripción</span>
        <textarea
          maxLength={2000}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Notas internas: características, accesos, observaciones…"
          rows={4}
          value={values.description}
          {...invalidProps("description")}
        />
        {fieldError("description")}
      </label>
    </div>,

    <div className={styles.stepBody} key="address">
      <PropertyLocationPicker
        country={values.country}
        location={values.location}
        onLocationChange={(location) => update("location", location)}
        onPlaceSelected={(address, location) => {
          setValues((current) => ({
            ...current,
            ...address,
            country: address.country || current.country,
            location,
          }));
          setErrors({});
        }}
      />
      <div className={styles.fields}>
        {textField("address", "Dirección", {
          required: addressRequired,
          wide: true,
          maxLength: 200,
          autoComplete: "street-address",
        })}
        {textField("city", "Ciudad", {
          required: addressRequired,
          maxLength: 100,
          autoComplete: "address-level2",
        })}
        {textField("state", "Provincia / estado", {
          required: addressRequired,
          maxLength: 100,
          autoComplete: "address-level1",
        })}
        {textField("postalCode", "Código postal", { maxLength: 20, autoComplete: "postal-code" })}
        <label className={styles.field}>
          <span>País{addressRequired && " *"}</span>
          <select
            onChange={(event) => update("country", event.target.value as PropertyFormValues["country"])}
            value={values.country}
            {...invalidProps("country")}
          >
            <option value="">Selecciona un país</option>
            {Object.entries(propertyCountryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {fieldError("country")}
        </label>
      </div>
    </div>,

    <div className={styles.stepBody} key="rental">
      <fieldset className={styles.group}>
        <legend>Referencia financiera</legend>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Moneda</span>
            <select
              onChange={(event) =>
                update("currency", event.target.value as PropertyFormValues["currency"])
              }
              value={values.currency}
            >
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="DOP">DOP — Peso dominicano</option>
            </select>
          </label>
          {textField("startingRent", "Renta mensual inicial", { inputMode: "decimal", placeholder: "0.00" })}
          {textField("securityDeposit", "Depósito de seguridad", { inputMode: "decimal", placeholder: "0.00" })}
          {textField("cleaningFee", "Cargo de limpieza", { inputMode: "decimal", placeholder: "0.00" })}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Servicios y electricidad</legend>
        <div className={styles.toggles}>
          {toggle("electricityIncluded", "Electricidad incluida", "La renta cubre el consumo eléctrico.")}
          {toggle("electricityMeterRequired", "Requiere medidor eléctrico", "Se registra el número y la lectura inicial.")}
          {toggle("waterIncluded", "Agua incluida", "La renta cubre el servicio de agua.")}
          {toggle("internetIncluded", "Internet incluido", "La renta cubre el servicio de internet.")}
        </div>
        <div className={styles.fields}>
          {values.electricityMeterRequired && (
            <>
              {textField("electricityMeterNumber", "Número de medidor", { maxLength: 40 })}
              {textField("initialMeterReading", "Lectura inicial (kWh)", { inputMode: "decimal" })}
            </>
          )}
          {textField("electricityRatePerKwh", `Tarifa por kWh (${values.currency})`, {
            inputMode: "decimal",
            placeholder: "0.0000",
          })}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Amenidades</legend>
        <div className={styles.chips}>
          {propertyAmenities.map((amenity) => {
            const selected = values.amenities.includes(amenity);
            return (
              <button
                aria-pressed={selected}
                className={styles.chip}
                key={amenity}
                onClick={() =>
                  update(
                    "amenities",
                    selected
                      ? values.amenities.filter((item) => item !== amenity)
                      : [...values.amenities, amenity],
                  )
                }
                type="button"
              >
                {selected && <Check aria-hidden="true" size={14} />}
                {propertyAmenityLabels[amenity]}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>,

    <div className={styles.stepBody} key="units">
      <div className={styles.toggles}>
        <label className={styles.toggleRow}>
          <span>
            <strong>Crear unidades automáticamente</strong>
            <small>Se crean junto con la propiedad, todas disponibles.</small>
          </span>
          <input
            checked={createUnits}
            className={styles.switch}
            onChange={(event) => {
              setCreateUnits(event.target.checked);
              setUnitErrors({});
            }}
            role="switch"
            type="checkbox"
          />
        </label>
      </div>
      {createUnits && (
        <UnitGenerationFields errors={unitErrors} onChange={updateUnit} values={unitValues} />
      )}
    </div>,

    <div className={styles.review} key="review">
      {[
        {
          step: 0,
          rows: [
            ["Nombre", values.name || "—"],
            ["Código interno", values.code || "—"],
            ["Tipo", propertyTypeLabels[values.type]],
            ["Estado", propertyStatusLabels[values.status]],
            ["Categoría de renta", propertyRentalCategoryLabels[values.rentalCategory]],
            ["Inicio de la administración", values.managementStartDate || "—"],
            ["Descripción", values.description || "—"],
          ],
        },
        {
          step: 1,
          rows: [
            ["Dirección", values.address || "—"],
            ["Ciudad", values.city || "—"],
            ["Provincia / estado", values.state || "—"],
            ["Código postal", values.postalCode || "—"],
            ["País", values.country ? propertyCountryLabels[values.country] : "—"],
            [
              "Coordenadas",
              values.location
                ? `${values.location.lat.toFixed(6)}, ${values.location.lng.toFixed(6)}`
                : "Sin ubicación",
            ],
          ],
        },
        {
          step: 2,
          rows: [
            ["Renta mensual inicial", formatMoney(values.startingRent, values.currency)],
            ["Depósito de seguridad", formatMoney(values.securityDeposit, values.currency)],
            ["Cargo de limpieza", formatMoney(values.cleaningFee, values.currency)],
            ["Electricidad incluida", yesNo(values.electricityIncluded)],
            [
              "Medidor eléctrico",
              values.electricityMeterRequired
                ? `Sí${values.electricityMeterNumber ? ` · ${values.electricityMeterNumber}` : ""}`
                : "No",
            ],
            ["Agua incluida", yesNo(values.waterIncluded)],
            ["Internet incluido", yesNo(values.internetIncluded)],
            [
              "Amenidades",
              values.amenities.length
                ? values.amenities.map((amenity) => propertyAmenityLabels[amenity]).join(", ")
                : "—",
            ],
          ],
        },
        ...(UNITS_STEP >= 0 ? [{ step: UNITS_STEP, rows: unitReviewRows() }] : []),
      ].map((section) => {
        const hasErrors = errorsForStep(steps, errors, unitErrors, section.step).length > 0;
        return (
          <section className={styles.reviewCard} key={section.step}>
            <header>
              <h3>
                {section.step + 1}. {steps[section.step].title}
              </h3>
              <button className={styles.linkButton} onClick={() => goTo(section.step)} type="button">
                <Pencil aria-hidden="true" size={13} />
                Editar
              </button>
            </header>
            {hasErrors && (
              <p className={styles.fieldError}>Este paso tiene campos por corregir.</p>
            )}
            <dl>
              {section.rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>,
  ];

  const cancelHref = propertyId ? `/admin/properties/${encodeURIComponent(propertyId)}` : "/admin/properties";

  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <ol aria-label="Pasos del formulario" className={styles.stepper}>
        {steps.map((item, index) => {
          const reachable = index <= furthestStep;
          const hasErrors = errorsForStep(steps, errors, unitErrors, index).length > 0;
          const state =
            index === step
              ? "current"
              : hasErrors
                ? "error"
                : isEdit || index < furthestStep
                  ? "done"
                  : "upcoming";
          return (
            <li key={item.title}>
              <button
                aria-current={index === step ? "step" : undefined}
                className={styles.stepButton}
                data-state={state}
                disabled={!reachable || busy}
                onClick={() => goTo(index)}
                type="button"
              >
                <span className={styles.stepNumber}>
                  {state === "done" ? <Check aria-hidden="true" size={14} /> : index + 1}
                </span>
                <span className={styles.stepLabel}>{item.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="property-step-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.stepCount}>
            Paso {step + 1} de {steps.length}
          </p>
          <h2 id="property-step-heading">{steps[step].title}</h2>
          <p>{steps[step].description}{step < REVIEW_STEP && " Los campos con * son obligatorios."}</p>
        </div>
        {stepContent.find((content) => content.key === steps[step].key)}
      </section>

      {step === REVIEW_STEP && (
        <p className={styles.note}>
          {isEdit
            ? "Las unidades se agregan o generan desde el detalle de la propiedad."
            : "Después podrás agregar o generar más unidades desde el detalle de la propiedad."}{" "}
          Propietarios, inquilinos, proveedores, comunicaciones e imágenes se agregarán cuando sus
          módulos estén listos.
        </p>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <Link className={styles.cancel} href={cancelHref}>
          Cancelar
        </Link>
        <span className={styles.actionsSpacer} />
        {!isEdit && (
          <button
            className={styles.secondary}
            disabled={busy}
            onClick={() => void save(true)}
            type="button"
          >
            Guardar borrador
          </button>
        )}
        {isEdit && step < REVIEW_STEP && (
          <button
            className={styles.secondary}
            disabled={busy}
            onClick={() => void save(false)}
            type="button"
          >
            Guardar cambios
          </button>
        )}
        {step > 0 && (
          <button className={styles.secondary} disabled={busy} onClick={() => goTo(step - 1)} type="button">
            <ChevronLeft aria-hidden="true" size={16} />
            Anterior
          </button>
        )}
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? (
            "Guardando…"
          ) : step < REVIEW_STEP ? (
            <>
              Siguiente
              <ChevronRight aria-hidden="true" size={16} />
            </>
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Crear propiedad"
          )}
        </button>
      </div>
    </form>
  );
}
