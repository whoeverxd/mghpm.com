import type { OwnershipCheck, OwnershipStatus } from "./rules";

export const ownershipStatusLabels: Record<OwnershipStatus, string> = {
  not_started: "Sin iniciar",
  documents_pending: "Documentos pendientes",
  in_review: "En revisión",
  verified: "Verificada",
  rejected: "Rechazada",
};

export const ownershipCheckLabels: Record<OwnershipCheck, string> = {
  deedOnFile: "Escritura o título en archivo",
  recordMatches: "El registro coincide con el título",
  ownerIdentity: "Identidad del propietario verificada",
  entityGoodStanding: "Entidad al día (si aplica)",
  coOwnerAuthorization: "Autorización de copropietarios (si aplica)",
  managementAgreement: "Acuerdo de administración firmado",
};
