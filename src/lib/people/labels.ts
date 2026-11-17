import type { EntityType, PersonKind, RelationshipType } from "./relationships";
import type { PersonRelationshipFilter, PersonStatus } from "./search-index";

export const personKindLabels: Record<PersonKind, string> = {
  individual: "Persona individual",
  entity: "Entidad",
};

export const entityTypeLabels: Record<EntityType, string> = {
  trust: "Fideicomiso",
  company: "Empresa",
  co_ownership: "Copropiedad",
  other: "Otra",
};

export const relationshipLabels: Record<RelationshipType, string> = {
  owner: "Propietario",
  tenant: "Inquilino",
  applicant: "Solicitante",
  guest: "Huésped",
  owner_prospect: "Propietario potencial",
};

export const relationshipPluralLabels: Record<RelationshipType, string> = {
  owner: "Propietarios",
  tenant: "Inquilinos",
  applicant: "Solicitantes",
  guest: "Huéspedes",
  owner_prospect: "Propietarios potenciales",
};

const statusLabels: Record<PersonRelationshipFilter, Record<PersonStatus, string>> = {
  owner: {
    active: "Activo",
    pending: "En incorporación",
    inactive: "Inactivo",
  },
  tenant: {
    active: "Activo",
    pending: "Mudanza pendiente",
    inactive: "Mudado",
  },
};

export function getPersonStatusLabel(relationship: PersonRelationshipFilter, status: PersonStatus) {
  return statusLabels[relationship][status];
}

/** Status labels for filters and rows that may span several relationships. */
export const genericPersonStatusLabels: Record<PersonStatus, string> = {
  active: "Activo",
  pending: "Pendiente / en incorporación",
  inactive: "Inactivo / mudado",
};
