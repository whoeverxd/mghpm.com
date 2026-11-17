import "server-only";

import { AggregateField, type Query, type QueryDocumentSnapshot, type QuerySnapshot } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getPersonFilterKey } from "@/lib/people/search-index";
import { parsePerson } from "@/lib/people/records";
import { getIndexUnavailableReason } from "@/lib/properties/list";
import { unitCurrencies, type UnitCurrency } from "@/lib/properties/unit-schema";
import { parseLease, type Lease } from "./records";
import { leaseStatuses, type LeaseStatus } from "./schema";
import {
  EXPIRING_WINDOW_DAYS,
  getLeaseCurrencyFilterKey,
  getLeaseFilterKey,
  getLeaseSearchKey,
  normalizeLeaseSearch,
  type LeaseView,
} from "./search-index";
import { addDays } from "./terms";

export const LEASES_PAGE_SIZE = 20;

export type LeaseListFilters = {
  view: LeaseView | "";
  search: string;
};

export type LeaseListPage = {
  leases: Lease[];
  totalCount: number;
  viewCounts: Record<LeaseView | "", number>;
  totals: Record<UnitCurrency, { rentMinor: number; securityDepositMinor: number }>;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  previousCursor: string | null;
  nextCursor: string | null;
};

export class LeasesIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore leases index is not ready.", options);
    this.name = "LeasesIndexUnavailableError";
  }
}

function getLeasesCollection(organizationId: string) {
  return getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("leases");
}

/**
 * Status views list newest codes first. "expiring" lists active leases whose
 * end date falls within the next 90 days (in the organization's time zone),
 * soonest first.
 */
function getViewQuery(
  organizationId: string,
  filters: LeaseListFilters,
  today: string,
): { query: Query; key: string; field: "filterKeys" | "searchKeys" } {
  const collection = getLeasesCollection(organizationId);
  const status: LeaseStatus | "" = filters.view === "expiring" ? "active" : filters.view;
  const normalizedSearch = normalizeLeaseSearch(filters.search);
  const field = normalizedSearch ? "searchKeys" : "filterKeys";
  const key = normalizedSearch
    ? getLeaseSearchKey(status, normalizedSearch)
    : getLeaseFilterKey(status);
  const base = collection.where(field, "array-contains", key);

  return {
    field,
    key,
    query:
      filters.view === "expiring"
        ? base
            .where("endDate", ">=", today)
            .where("endDate", "<=", addDays(today, EXPIRING_WINDOW_DAYS))
            .orderBy("endDate")
        : base.orderBy("code", "desc"),
  };
}

export async function listOrganizationLeases(
  organizationId: string,
  filters: LeaseListFilters,
  today: string,
  page: number,
  cursor: string | undefined,
  direction: "next" | "previous" | undefined,
): Promise<LeaseListPage> {
  const collection = getLeasesCollection(organizationId);
  const { query, key, field } = getViewQuery(organizationId, filters, today);

  const statusCountPromises = leaseStatuses.map((status) =>
    collection.where("filterKeys", "array-contains", getLeaseFilterKey(status)).count().get(),
  );
  const allCountPromise = collection
    .where("filterKeys", "array-contains", getLeaseFilterKey(""))
    .count()
    .get();
  const expiringCountPromise = getViewQuery(organizationId, { view: "expiring", search: "" }, today)
    .query.count()
    .get();
  const totalsPromises = unitCurrencies.map((currency) =>
    collection
      .where("filterKeys", "array-contains", getLeaseCurrencyFilterKey("active", currency))
      .aggregate({
        rentMinor: AggregateField.sum("rentMinor"),
        securityDepositMinor: AggregateField.sum("securityDepositMinor"),
      })
      .get(),
  );

  let pageQuery = query.limit(LEASES_PAGE_SIZE + 1);
  if (cursor && direction) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (!cursorSnapshot.exists) throw new Error("The leases list cursor is no longer available.");
    const cursorLease = parseLease(organizationId, cursorSnapshot.id, cursorSnapshot.data());
    if (!cursorLease[field].includes(key)) {
      throw new Error("The leases list cursor does not match the current filters.");
    }

    pageQuery =
      direction === "next"
        ? pageQuery.startAfter(cursorSnapshot)
        : query.endBefore(cursorSnapshot).limitToLast(LEASES_PAGE_SIZE + 1);
  }

  const [snapshot, countSnapshot, allCount, expiringCount, totals, statusCounts] =
    await Promise.all([
      pageQuery.get(),
      query.count().get(),
      allCountPromise,
      expiringCountPromise,
      Promise.all(totalsPromises),
      Promise.all(statusCountPromises),
    ]).catch((error: unknown) => {
      const indexReason = getIndexUnavailableReason(error);
      if (indexReason) throw new LeasesIndexUnavailableError(indexReason, { cause: error });
      throw error;
    });

  const totalCount = countSnapshot.data().count;
  const totalPages = Math.max(1, Math.ceil(totalCount / LEASES_PAGE_SIZE));
  const hasExtraPage = snapshot.docs.length > LEASES_PAGE_SIZE;
  const pageDocuments =
    direction === "previous" && hasExtraPage
      ? snapshot.docs.slice(1)
      : snapshot.docs.slice(0, LEASES_PAGE_SIZE);
  const leases = pageDocuments.map((document) => {
    const lease = parseLease(organizationId, document.id, document.data());
    if (!lease[field].includes(key)) {
      console.error("Lease search index is inconsistent.", {
        organizationId,
        leaseId: document.id,
      });
      throw new Error("A lease record has an outdated search index.");
    }
    return lease;
  });

  return {
    leases,
    totalCount,
    viewCounts: {
      "": allCount.data().count,
      expiring: expiringCount.data().count,
      ...(Object.fromEntries(
        leaseStatuses.map((status, index) => [status, statusCounts[index].data().count]),
      ) as Record<LeaseStatus, number>),
    },
    totals: Object.fromEntries(
      unitCurrencies.map((currency, index) => {
        const data = totals[index].data();
        return [
          currency,
          {
            rentMinor: data.rentMinor ?? 0,
            securityDepositMinor: data.securityDepositMinor ?? 0,
          },
        ];
      }),
    ) as LeaseListPage["totals"],
    page,
    totalPages,
    hasPreviousPage: page > 1 && leases.length > 0,
    hasNextPage: direction === "previous" ? page < totalPages : hasExtraPage,
    previousCursor: leases[0]?.id ?? null,
    nextCursor: leases.at(-1)?.id ?? null,
  };
}

export const LEASE_OPTION_LIMIT = 500;

export type TenantOption = { id: string; name: string; email: string; isTenant: boolean };

/**
 * Non-archived individuals, by name, for the primary tenant picker. People who
 * already have the tenant relationship come first; the lease creates the
 * relationship for the rest on activation.
 */
export async function listTenantOptions(organizationId: string): Promise<TenantOption[]> {
  // There is no "kind" facet, so page through the name-ordered people and keep only
  // individuals until LEASE_OPTION_LIMIT of them are collected (or the people run out).
  const query = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("people")
    .where(
      "filterKeys",
      "array-contains",
      getPersonFilterKey({ relationship: "", status: "", includeArchived: false }),
    )
    .orderBy("searchName")
    .limit(LEASE_OPTION_LIMIT);
  const individuals: ReturnType<typeof parsePerson>[] = [];
  let cursor: QueryDocumentSnapshot | null = null;
  while (individuals.length < LEASE_OPTION_LIMIT) {
    const page: QuerySnapshot = await (cursor ? query.startAfter(cursor) : query).get();
    for (const document of page.docs) {
      const person = parsePerson(organizationId, document.id, document.data());
      if (person.kind === "individual" && individuals.length < LEASE_OPTION_LIMIT) {
        individuals.push(person);
      }
    }
    if (page.docs.length < LEASE_OPTION_LIMIT) break;
    cursor = page.docs[page.docs.length - 1];
  }

  const options = individuals
    .map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      isTenant: person.relationshipTypes.includes("tenant"),
    }));
  return [...options.filter((option) => option.isTenant), ...options.filter((option) => !option.isTenant)];
}

export type RenewableLeaseOption = Pick<
  Lease,
  | "id"
  | "code"
  | "propertyId"
  | "unitId"
  | "tenantId"
  | "tenantName"
  | "propertyName"
  | "unitLabel"
  | "endDate"
  | "currency"
  | "rentMinor"
>;

/** Active leases that a renewal can start from. */
export async function listRenewableLeaseOptions(
  organizationId: string,
): Promise<RenewableLeaseOption[]> {
  const snapshot = await getLeasesCollection(organizationId)
    .where("filterKeys", "array-contains", getLeaseFilterKey("active"))
    .orderBy("code", "desc")
    .limit(LEASE_OPTION_LIMIT)
    .get();

  return snapshot.docs.map((document) => {
    const lease = parseLease(organizationId, document.id, document.data());
    return {
      id: lease.id,
      code: lease.code,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      tenantName: lease.tenantName,
      propertyName: lease.propertyName,
      unitLabel: lease.unitLabel,
      endDate: lease.endDate,
      currency: lease.currency,
      rentMinor: lease.rentMinor,
    };
  });
}

const TENANT_LEASE_LIMIT = 100;

/** Leases of one tenant, newest start first (sorted in memory to avoid a composite index). */
export async function listTenantLeases(organizationId: string, tenantId: string): Promise<Lease[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("leases")
    .where("tenantId", "==", tenantId)
    .limit(TENANT_LEASE_LIMIT)
    .get();
  return snapshot.docs
    .map((document) => parseLease(organizationId, document.id, document.data()))
    .sort((left, right) => (right.startDate ?? "").localeCompare(left.startDate ?? ""));
}
