import type { PropertyDocument } from "@/lib/properties/schema";
import type { UnitDocument } from "@/lib/properties/unit-schema";

export type StayConfigurationIssue = "not_short_term" | "no_currency";
export type StayVisibilityIssue =
  | StayConfigurationIssue
  | "property_inactive"
  | "property_archived"
  | "unit_archived"
  | "unit_leased"
  | "unit_unavailable"
  | "not_published"
  | "no_rate";

type StayProperty = Pick<
  PropertyDocument,
  "status" | "archived" | "rentalCategory" | "financialReference"
>;
type StayUnit = Pick<UnitDocument, "archived" | "status" | "activeLeaseId" | "stay">;

/** Whether the property can carry short-stay listings at all. */
export function getStayConfigurationIssue(
  property: Pick<StayProperty, "rentalCategory" | "financialReference">,
): StayConfigurationIssue | null {
  if (property.rentalCategory !== "short_term" && property.rentalCategory !== "both") {
    return "not_short_term";
  }
  if (!property.financialReference?.currency) return "no_currency";
  return null;
}

/**
 * The single rule for public visibility, shared by the catalog, the public
 * image route and the inquiry API. Returns why a unit is hidden, or null.
 */
export function getStayVisibilityIssue(
  property: StayProperty,
  unit: StayUnit,
): StayVisibilityIssue | null {
  const configurationIssue = getStayConfigurationIssue(property);
  if (configurationIssue) return configurationIssue;
  if (property.status !== "active") return "property_inactive";
  if (property.archived) return "property_archived";
  if (unit.archived) return "unit_archived";
  if (unit.activeLeaseId) return "unit_leased";
  if (unit.status !== "available") return "unit_unavailable";
  if (!unit.stay?.published) return "not_published";
  if (unit.stay.nightlyRateMinor === null) return "no_rate";
  return null;
}
