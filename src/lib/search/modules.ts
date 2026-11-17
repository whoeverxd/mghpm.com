import type { OrganizationRole } from "@/lib/auth/organization-schema";
import { can } from "../access/permissions.ts";

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 80;
/** Results per group in the top-bar dropdown and on the results page. */
export const SEARCH_PREVIEW_LIMIT = 5;
export const SEARCH_PAGE_LIMIT = 25;

/** Modules the global search covers, in display order (names: `t.search.modules`). */
export const searchModules = [
  { module: "properties", listPath: "/admin/properties" },
  { module: "people", listPath: "/admin/people" },
  { module: "leases", listPath: "/admin/leases" },
] as const;

export type SearchModule = (typeof searchModules)[number]["module"];

/** The trimmed text (at most 80 characters), or "" when it is not worth searching. */
export function cleanSearchText(value: unknown) {
  if (typeof value !== "string") return "";
  const text = value.trim().slice(0, SEARCH_MAX_LENGTH).trim();
  return Array.from(text).length >= SEARCH_MIN_LENGTH ? text : "";
}

export function searchModulesFor(role: OrganizationRole | null) {
  return searchModules.filter((item) => can(role, item.module, "view"));
}

export function searchPageHref(text: string) {
  return `/admin/buscar?q=${encodeURIComponent(text)}`;
}

export function searchListHref(module: SearchModule, text: string) {
  const path = searchModules.find((item) => item.module === module)!.listPath;
  return `${path}?q=${encodeURIComponent(text)}`;
}
