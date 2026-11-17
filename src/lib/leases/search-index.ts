import { normalizePropertySearch } from "@/lib/properties/search-index";
import type { UnitCurrency } from "@/lib/properties/unit-schema";
import type { LeaseStatus } from "./schema";

/** List views: one per status plus "expiring" (active, ending within 90 days). */
export const leaseViews = [
  "active",
  "pending",
  "expiring",
  "draft",
  "expired",
  "terminated",
  "cancelled",
] as const;

export type LeaseView = (typeof leaseViews)[number];

export const EXPIRING_WINDOW_DAYS = 90;

export type LeaseSearchIndexInput = {
  code: string;
  status: LeaseStatus;
  currency: UnitCurrency;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
};

export const normalizeLeaseSearch = normalizePropertySearch;

export function getLeaseFilterKey(status: LeaseStatus | "") {
  return `status=${status || "*"}`;
}

/** Facet used to total rent and deposits per currency without mixing them. */
export function getLeaseCurrencyFilterKey(status: LeaseStatus, currency: UnitCurrency) {
  return `${getLeaseFilterKey(status)}&currency=${currency}`;
}

export function getLeaseSearchKey(status: LeaseStatus | "", search: string) {
  return `${getLeaseFilterKey(status)}&search=${encodeURIComponent(
    normalizeLeaseSearch(search),
  )}`;
}

/**
 * Builds status facets (also as "*"), per-currency facets and prefix search
 * keys for the lease code, tenant, property and unit. Names are copies taken
 * when the lease is saved: they identify the parties as contracted.
 */
export function createLeaseSearchIndex(lease: LeaseSearchIndexInput) {
  const statusKeys = [getLeaseFilterKey(lease.status), getLeaseFilterKey("")];
  const filterKeys = [
    ...statusKeys,
    getLeaseCurrencyFilterKey(lease.status, lease.currency),
  ];

  const terms = new Set<string>();
  for (const field of [lease.code, lease.tenantName, lease.propertyName, lease.unitLabel]) {
    const normalized = normalizeLeaseSearch(field);
    if (!normalized) continue;
    terms.add(normalized);
    for (const term of normalized.split(/[\s/_.@+-]+/u)) {
      if (term) terms.add(term);
    }
  }

  const searchPrefixes = new Set<string>();
  for (const term of terms) {
    const characters = Array.from(term);
    for (let length = 1; length <= characters.length; length += 1) {
      searchPrefixes.add(characters.slice(0, length).join(""));
    }
  }

  return {
    filterKeys,
    searchKeys: statusKeys.flatMap((statusKey) =>
      Array.from(searchPrefixes, (prefix) =>
        `${statusKey}&search=${encodeURIComponent(prefix)}`,
      ),
    ),
  };
}
