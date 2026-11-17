"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { entityTypeLabels, getPersonStatusLabel, personKindLabels } from "@/lib/people/labels";
import { entityTypes, personKinds, type PersonKind } from "@/lib/people/relationships";
import { personInputSchema } from "@/lib/people/schema";
import { personStatuses, type PersonStatus } from "@/lib/people/search-index";
import styles from "@/components/properties/property-form.module.css";

export type PersonFormValues = {
  kind: PersonKind;
  name: string;
  email: string;
  phone: string;
  status: PersonStatus;
  contactName: string;
  entityType: string;
  taxId: string;
  representativeId: string;
  owner: boolean;
  tenant: boolean;
  propertyId: string;
  unitId: string;
};

export type PropertyOption = { id: string; name: string; code: string };

export type RepresentativeOption = { id: string; name: string; email: string };

type UnitOption = { id: string; label: string };

type PersonFormProps = {
  personId?: string;
  initialValues: PersonFormValues;
  propertyOptions: PropertyOption[];
  propertyOptionsTruncated: boolean;
  representativeOptions: RepresentativeOption[];
};

const unitListSchema = z.object({
  units: z.array(z.object({ id: z.string(), label: z.string() })),
});

export function PersonForm({
  personId,
  initialValues,
  propertyOptions,
  propertyOptionsTruncated,
  representativeOptions,
}: PersonFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<PersonKind>(initialValues.kind);
  const [owner, setOwner] = useState(initialValues.owner);
  const [tenant, setTenant] = useState(initialValues.tenant);
  const [propertyId, setPropertyId] = useState(initialValues.propertyId);
  const [unitId, setUnitId] = useState(initialValues.unitId);
  const [units, setUnits] = useState<{ propertyId: string; options: UnitOption[] } | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const cancelHref = "/admin/people";
  const statusRelationship = tenant && !owner ? "tenant" : "owner";
  const unitsLoaded = units?.propertyId === propertyId;

  useEffect(() => {
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
  }, [propertyId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsedForm = personInputSchema.safeParse({
      kind,
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? "",
      status: formData.get("status"),
      entityType: kind === "entity" ? formData.get("entityType") ?? "" : "",
      taxId: kind === "entity" ? formData.get("taxId") ?? "" : "",
      contactName: kind === "entity" ? formData.get("contactName") ?? "" : "",
      representativeId: kind === "entity" ? formData.get("representativeId") ?? "" : "",
      relationships: { owner, tenant },
      tenantPropertyId: tenant ? propertyId : "",
      tenantUnitId: tenant ? unitId : "",
    });
    if (!parsedForm.success) {
      setError(parsedForm.error.issues[0]?.message ?? "Revisa los datos ingresados.");
      return;
    }

    setBusy(true);
    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch(
        personId ? `/api/people/${encodeURIComponent(personId)}` : "/api/people",
        {
          method: personId ? "PATCH" : "POST",
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
          parsedBody.success ? parsedBody.data.error : "No se pudo guardar el registro.",
        );
      }

      router.replace(cancelHref);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el registro.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section aria-labelledby="person-info-heading" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2 id="person-info-heading">Datos de contacto</h2>
          <p>
            Los campos con * son obligatorios. El correo no puede repetirse entre
            registros activos del mismo tipo (persona o entidad).
          </p>
        </div>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Tipo *</span>
            <select
              name="kind"
              onChange={(event) => {
                const next = event.target.value as PersonKind;
                setKind(next);
                if (next === "entity") setTenant(false);
              }}
              required
              value={kind}
            >
              {personKinds.map((option) => (
                <option key={option} value={option}>
                  {personKindLabels[option]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className={`${styles.field} ${styles.choiceGroup}`}>
            <legend>Relaciones *</legend>
            <div className={styles.choiceOptions}>
              <label className={styles.choice}>
                <input
                  checked={owner}
                  name="relationshipOwner"
                  onChange={(event) => setOwner(event.target.checked)}
                  type="checkbox"
                />
                Propietario
              </label>
              <label className={styles.choice}>
                <input
                  checked={tenant}
                  disabled={kind === "entity"}
                  name="relationshipTenant"
                  onChange={(event) => setTenant(event.target.checked)}
                  type="checkbox"
                />
                Inquilino
              </label>
            </div>
          </fieldset>
          <label className={styles.field}>
            <span>Estado *</span>
            <select defaultValue={initialValues.status} name="status" required>
              {personStatuses.map((status) => (
                <option key={status} value={status}>
                  {getPersonStatusLabel(statusRelationship, status)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{kind === "entity" ? "Razón social *" : "Nombre completo *"}</span>
            <input
              autoComplete="off"
              defaultValue={initialValues.name}
              maxLength={120}
              name="name"
              required
            />
          </label>
          {kind === "entity" && (
            <>
              <label className={styles.field}>
                <span>Tipo de entidad *</span>
                <select defaultValue={initialValues.entityType} name="entityType" required>
                  <option value="">Selecciona…</option>
                  {entityTypes.map((option) => (
                    <option key={option} value={option}>
                      {entityTypeLabels[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>RNC / EIN</span>
                <input
                  autoComplete="off"
                  defaultValue={initialValues.taxId}
                  maxLength={30}
                  name="taxId"
                />
              </label>
              <label className={styles.field}>
                <span>Persona de contacto</span>
                <input
                  autoComplete="off"
                  defaultValue={initialValues.contactName}
                  maxLength={120}
                  name="contactName"
                />
              </label>
              <label className={styles.field}>
                <span>Representante</span>
                <select defaultValue={initialValues.representativeId} name="representativeId">
                  <option value="">Sin representante</option>
                  {initialValues.representativeId &&
                    !representativeOptions.some((option) => option.id === initialValues.representativeId) && (
                      <option value={initialValues.representativeId}>Representante no disponible</option>
                    )}
                  {representativeOptions
                    .filter((option) => option.id !== personId)
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {`${option.name} (${option.email})`}
                      </option>
                    ))}
                </select>
              </label>
            </>
          )}
          <label className={styles.field}>
            <span>Correo electrónico *</span>
            <input
              autoComplete="off"
              defaultValue={initialValues.email}
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label className={styles.field}>
            <span>Teléfono</span>
            <input
              autoComplete="off"
              defaultValue={initialValues.phone}
              inputMode="tel"
              maxLength={30}
              name="phone"
              type="tel"
            />
          </label>
        </div>
      </section>

      {tenant && (
        <section aria-labelledby="person-link-heading" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2 id="person-link-heading">Propiedad y unidad</h2>
            <p>
              Opcional. Al activar un contrato, el inquilino se vincula a su unidad
              automáticamente. Este vínculo manual no cambia la ocupación ni crea un
              contrato.
            </p>
          </div>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Propiedad</span>
              <select
                name="propertyId"
                onChange={(event) => {
                  setPropertyId(event.target.value);
                  setUnitId("");
                }}
                value={propertyId}
              >
                <option value="">Sin propiedad</option>
                {propertyId && !propertyOptions.some((option) => option.id === propertyId) && (
                  <option value={propertyId}>Propiedad archivada o no disponible</option>
                )}
                {propertyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${option.name} (${option.code})`}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Unidad</span>
              <select
                disabled={!propertyId || !unitsLoaded}
                name="unitId"
                onChange={(event) => setUnitId(event.target.value)}
                value={unitId}
              >
                <option value="">
                  {propertyId && !unitsLoaded ? "Cargando unidades…" : "Sin unidad"}
                </option>
                {unitsLoaded &&
                  unitId &&
                  !units.options.some((option) => option.id === unitId) && (
                    <option value={unitId}>Unidad archivada o no disponible</option>
                  )}
                {unitsLoaded &&
                  units.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {unitsError && <p className={styles.error} role="alert">{unitsError}</p>}
        </section>
      )}

      {tenant && !personId && (
        <p className={styles.note}>
          Después de registrar al inquilino, crea su contrato en Contratos para
          registrar fechas, renta y depósitos.
        </p>
      )}
      {propertyOptionsTruncated && tenant && (
        <p className={styles.note}>
          La lista muestra las primeras {propertyOptions.length} propiedades activas
          por nombre.
        </p>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <Link className={styles.cancel} href={cancelHref}>
          Cancelar
        </Link>
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? "Guardando…" : personId ? "Guardar cambios" : "Guardar registro"}
        </button>
      </div>
    </form>
  );
}
