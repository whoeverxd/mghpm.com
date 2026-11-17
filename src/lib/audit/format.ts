import { auditAreas, type AuditArea } from "./area.ts";

export type AuditRow = {
  id: string;
  action: string;
  area: AuditArea | null;
  actorUid: string;
  createdAt: Date | null;
  href: string | null;
  details: { label: string; value: string }[];
};

const detailLabels: [field: string, label: string][] = [
  ["from", "De"],
  ["to", "A"],
  ["status", "Estado"],
  ["reason", "Motivo"],
  ["relationship", "Relación"],
  ["previousStaffRole", "Rol anterior"],
  ["staffRole", "Rol nuevo"],
  ["lane", "Portal"],
];

/** Admin page of the record an event is about, when there is one. */
export function auditTargetHref(action: string, targetId: string, propertyId: string | null) {
  const id = encodeURIComponent(targetId);
  switch (action.split(".")[0]) {
    case "person":
      return `/admin/people/${id}`;
    case "lease":
      return `/admin/leases/${id}`;
    case "ownership":
      return `/admin/ownerships/${id}`;
    case "member":
      return `/admin/users/${id}/edit`;
    case "stay_inquiry":
      return "/admin/stay-inquiries";
    case "property":
      return `/admin/properties/${encodeURIComponent(propertyId ?? targetId)}`;
    case "unit":
      return propertyId ? `/admin/properties/${encodeURIComponent(propertyId)}?tab=units` : null;
    default:
      return null;
  }
}

export function toAuditRow(id: string, data: Record<string, unknown>): AuditRow {
  const action = typeof data.action === "string" ? data.action : "";
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const propertyId = typeof data.propertyId === "string" ? data.propertyId : null;
  return {
    id,
    action,
    area: (auditAreas as readonly unknown[]).includes(data.area) ? (data.area as AuditArea) : null,
    actorUid: typeof data.actorUid === "string" ? data.actorUid : "",
    createdAt: typeof createdAt?.toDate === "function" ? createdAt.toDate() : null,
    href: typeof data.targetId === "string" ? auditTargetHref(action, data.targetId, propertyId) : null,
    details: detailLabels.flatMap(([field, label]) =>
      typeof data[field] === "string" && data[field] ? [{ label, value: data[field] as string }] : [],
    ),
  };
}
