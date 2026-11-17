import "server-only";

import { z } from "zod";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import {
  getPropertyFilterKey,
  getPropertySearchKey,
  normalizePropertySearch,
  type PropertySearchFilters,
} from "./search-index";
import { propertyDocumentSchema } from "./schema";

export const PROPERTY_PAGE_SIZE = 20;

export type PropertyListFilters = PropertySearchFilters;

export type ListedProperty = z.infer<typeof propertyDocumentSchema> & {
  id: string;
};

export type PropertyListPage = {
  properties: ListedProperty[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  previousCursor: string | null;
  nextCursor: string | null;
};

export class PropertyIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore property index is not ready.", options);
    this.name = "PropertyIndexUnavailableError";
  }
}

export function getIndexUnavailableReason(
  error: unknown,
): "building" | "missing" | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = error.code;
  if (code !== 9 && code !== "failed-precondition") return null;
  if (!("message" in error) || typeof error.message !== "string") return null;
  if (!/requires an index/i.test(error.message)) return null;

  return /currently building/i.test(error.message) ? "building" : "missing";
}

export async function listOrganizationProperties(
  organizationId: string,
  filters: PropertyListFilters,
  page: number,
  cursor: string | undefined,
  direction: "next" | "previous" | undefined,
): Promise<PropertyListPage> {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties");

  const normalizedSearch = normalizePropertySearch(filters.search);
  const searchKey = normalizedSearch
    ? getPropertySearchKey(filters, normalizedSearch)
    : null;
  const query = collection
    .where(searchKey ? "searchKeys" : "filterKeys", "array-contains", searchKey ?? getPropertyFilterKey(filters))
    .orderBy("searchName");

  const totalCountPromise = query.count().get();
  let pageQuery = query.limit(PROPERTY_PAGE_SIZE + 1);
  if (cursor && direction) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (!cursorSnapshot.exists) {
      throw new Error("The property list cursor is no longer available.");
    }
    const parsedCursor = propertyDocumentSchema.safeParse(cursorSnapshot.data());
    if (
      !parsedCursor.success ||
      (searchKey
        ? !parsedCursor.data.searchKeys.includes(searchKey)
        : !parsedCursor.data.filterKeys.includes(getPropertyFilterKey(filters)))
    ) {
      throw new Error("The property list cursor does not match the current filters.");
    }

    pageQuery =
      direction === "next"
        ? pageQuery.startAfter(cursorSnapshot)
        : query.endBefore(cursorSnapshot).limitToLast(PROPERTY_PAGE_SIZE + 1);
  }

  const [snapshot, countSnapshot] = await Promise.all([
    pageQuery.get(),
    totalCountPromise,
  ]).catch((error: unknown) => {
    const indexReason = getIndexUnavailableReason(error);
    if (indexReason) {
      throw new PropertyIndexUnavailableError(indexReason, { cause: error });
    }

    throw error;
  });
  const totalCount = countSnapshot.data().count;
  const totalPages = Math.max(1, Math.ceil(totalCount / PROPERTY_PAGE_SIZE));
  const hasExtraPage = snapshot.docs.length > PROPERTY_PAGE_SIZE;
  const pageDocuments =
    direction === "previous" && hasExtraPage
      ? snapshot.docs.slice(1)
      : snapshot.docs.slice(0, PROPERTY_PAGE_SIZE);

  const properties = pageDocuments.map((document) => {
    const parsedProperty = propertyDocumentSchema.safeParse(document.data());
    if (!parsedProperty.success) {
      console.error("Invalid property document in the active organization.", {
        organizationId,
        propertyId: document.id,
        issues: parsedProperty.error.issues,
      });
      throw new Error("A property record is incomplete or invalid.");
    }

    if (!parsedProperty.data.filterKeys.includes(getPropertyFilterKey(filters))) {
      console.error("Property filter index is inconsistent.", {
        organizationId,
        propertyId: document.id,
      });
      throw new Error("A property record has an outdated filter index.");
    }

    if (
      parsedProperty.data.searchName !==
      normalizePropertySearch(parsedProperty.data.name)
    ) {
      console.error("Property search index is inconsistent.", {
        organizationId,
        propertyId: document.id,
      });
      throw new Error("A property record has an outdated search index.");
    }

    if (
      searchKey &&
      !parsedProperty.data.searchKeys.includes(searchKey)
    ) {
      console.error("Property search index is inconsistent.", {
        organizationId,
        propertyId: document.id,
      });
      throw new Error("A property record has an outdated search index.");
    }

    return { id: document.id, ...parsedProperty.data };
  });

  return {
    properties,
    totalCount,
    page,
    totalPages,
    hasPreviousPage: page > 1 && properties.length > 0,
    hasNextPage:
      direction === "previous"
        ? page < totalPages
        : hasExtraPage,
    previousCursor: properties[0]?.id ?? null,
    nextCursor: properties.at(-1)?.id ?? null,
  };
}

export const PROPERTY_OPTION_LIMIT = 500;

/** Active properties for pickers, ordered by name and capped at the limit. */
export async function listPropertyOptions(organizationId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties")
    .where("filterKeys", "array-contains", getPropertyFilterKey({
      search: "",
      status: "",
      occupancy: "",
      type: "",
      includeArchived: false,
    }))
    .orderBy("searchName")
    .limit(PROPERTY_OPTION_LIMIT)
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,
    name: String(document.get("name")),
    code: String(document.get("code")),
  }));
}
