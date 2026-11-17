import type { OwnershipStatus } from "./rules";

/** `?estado=` values of the ownerships list. Every filter but "finalizadas" lists active ones. */
export const ownershipListFilters = {
  activas: { label: "Activas", status: null },
  "sin-iniciar": { label: "Sin iniciar", status: "not_started" },
  "documentos-pendientes": { label: "Documentos pendientes", status: "documents_pending" },
  "en-revision": { label: "En revisión", status: "in_review" },
  verificadas: { label: "Verificadas", status: "verified" },
  rechazadas: { label: "Rechazadas", status: "rejected" },
  finalizadas: { label: "Finalizadas", status: null },
} as const satisfies Record<string, { label: string; status: OwnershipStatus | null }>;

export type OwnershipListFilter = keyof typeof ownershipListFilters;

export function parseOwnershipListFilter(value: unknown): OwnershipListFilter {
  return typeof value === "string" && Object.hasOwn(ownershipListFilters, value)
    ? (value as OwnershipListFilter)
    : "activas";
}
