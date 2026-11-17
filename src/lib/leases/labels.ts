import type {
  LeasePartyRole,
  LeaseSource,
  LeaseStatus,
  LeaseUtility,
  LeaseUtilityParty,
} from "./schema";
import type { LeaseView } from "./search-index";

export const leaseStatusLabels: Record<LeaseStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente de activación",
  active: "Activo",
  expired: "Vencido",
  terminated: "Terminado",
  cancelled: "Cancelado",
};

export const leaseViewLabels: Record<LeaseView, string> = {
  active: "Activos",
  pending: "Pendientes de activación",
  expiring: "Vencen en ≤ 90 días",
  draft: "Borradores",
  expired: "Vencidos",
  terminated: "Terminados",
  cancelled: "Cancelados",
};

export const leaseSourceLabels: Record<LeaseSource, string> = {
  admin: "Contrato administrativo",
  migration: "Inquilino existente / migración",
  renewal: "Renovación",
};

export const leaseSourceDescriptions: Record<LeaseSource, string> = {
  admin: "Contrato nuevo registrado por la administración.",
  migration: "Contrato vigente de un inquilino que ya ocupa la unidad.",
  renewal: "Nuevo plazo para un contrato activo; empieza el día siguiente a su fin.",
};

export const leasePartyRoleLabels: Record<LeasePartyRole, string> = {
  co_tenant: "Co-inquilino",
  spouse: "Cónyuge",
  guarantor: "Garante",
  authorized_occupant: "Ocupante autorizado",
  minor_occupant: "Ocupante menor de edad",
};

export const leaseRenewalTypeLabels = {
  manual: "Renovación manual requerida",
  fixed: "Plazo fijo",
  automatic: "Renovación automática",
  month_to_month: "Mes a mes al vencer",
} as const;

export const leaseLateFeeRuleLabels = {
  percent_5: "5 % de la renta tras el período de gracia",
  flat: "Monto fijo por pago tardío",
  none: "Sin recargo",
} as const;

export const leaseUtilityLabels: Record<LeaseUtility, string> = {
  electricity: "Electricidad",
  water: "Agua",
  internet: "Internet",
  gas: "Gas",
  hoa: "Cuota de mantenimiento / HOA",
};

export const leaseUtilityPartyLabels: Record<LeaseUtilityParty, string> = {
  tenant: "Inquilino",
  owner: "Propietario",
  manager: "Administración",
  included: "Incluido en la renta",
  shared: "Compartido",
  na: "No aplica",
};
