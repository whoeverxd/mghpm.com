/** Areas of the audit viewer. Every audit event stores one, derived from its action. */
export const auditAreas = ["properties", "people", "leases", "ownerships", "access", "stays"] as const;
export type AuditArea = (typeof auditAreas)[number];

export const auditAreaLabels: Record<AuditArea, string> = {
  properties: "Propiedades",
  people: "Personas",
  leases: "Contratos",
  ownerships: "Titularidades",
  access: "Usuarios y accesos",
  stays: "Estadías",
};

const areaByPrefix = {
  property: "properties",
  unit: "properties",
  person: "people",
  lease: "leases",
  ownership: "ownerships",
  member: "access",
  workspace: "access",
  organization: "access",
  stay_inquiry: "stays",
} as const satisfies Record<string, AuditArea>;

export const auditActionPrefixes = Object.keys(areaByPrefix);

export function auditArea(action: string): AuditArea {
  const prefix = action.split(".")[0] ?? "";
  if (!Object.hasOwn(areaByPrefix, prefix)) {
    throw new Error(`Unknown audit action "${action}": add its prefix to areaByPrefix.`);
  }
  return areaByPrefix[prefix as keyof typeof areaByPrefix];
}

/** Use for every audit event write: adds `area` so the viewer can filter by it. */
export function auditEventFields<T extends { action: string }>(fields: T): T & { area: AuditArea } {
  return { ...fields, area: auditArea(fields.action) };
}
