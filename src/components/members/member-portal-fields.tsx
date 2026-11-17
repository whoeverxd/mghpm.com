"use client";

import type { PersonAccountOption } from "@/lib/people/list";
import { portalLabels, portalRoles, type PortalRole } from "@/lib/members/roles";
import styles from "@/components/properties/property-form.module.css";

export type PortalSelection = Record<PortalRole, { enabled: boolean; personId: string }>;

export const emptyPortalSelection: PortalSelection = {
  owner: { enabled: false, personId: "" },
  tenant: { enabled: false, personId: "" },
};

/** Value sent to the API: a portal without a selected person is not granted. */
export function toPortalInput(selection: PortalSelection) {
  return {
    owner: selection.owner.enabled ? selection.owner.personId : "",
    tenant: selection.tenant.enabled ? selection.tenant.personId : "",
  };
}

/** Name of the first enabled portal that still lacks a person, if any. */
export function findIncompletePortal(selection: PortalSelection) {
  return portalRoles.find((portal) => selection[portal].enabled && !selection[portal].personId);
}

type MemberPortalFieldsProps = {
  options: PersonAccountOption[];
  selection: PortalSelection;
  onChange: (selection: PortalSelection) => void;
};

export function MemberPortalFields({ options, selection, onChange }: MemberPortalFieldsProps) {
  return (
    <section aria-labelledby="member-portals-heading" className={styles.section}>
      <div className={styles.sectionHeading}>
        <h2 id="member-portals-heading">Portales</h2>
        <p>
          Cada portal se vincula a una ficha de Personas con esa relación activa y el mismo
          correo que la cuenta.
        </p>
      </div>
      <div className={styles.fields}>
        {portalRoles.map((portal) => {
          const people = options.filter((option) => option.relationshipTypes.includes(portal));
          const state = selection[portal];
          return (
            <div className={styles.field} key={portal}>
              <label className={styles.choice}>
                <input
                  checked={state.enabled}
                  onChange={(event) =>
                    onChange({
                      ...selection,
                      [portal]: { enabled: event.target.checked, personId: state.personId },
                    })
                  }
                  type="checkbox"
                />
                <span>{portalLabels[portal]}</span>
              </label>
              {state.enabled && (
                <select
                  aria-label={`Ficha de ${portalLabels[portal]}`}
                  onChange={(event) =>
                    onChange({
                      ...selection,
                      [portal]: { enabled: true, personId: event.target.value },
                    })
                  }
                  value={state.personId}
                >
                  <option value="">
                    {people.length ? "Selecciona una ficha…" : "No hay fichas disponibles"}
                  </option>
                  {people.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.email ? `${option.name} — ${option.email}` : option.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
