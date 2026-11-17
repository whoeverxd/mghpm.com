import "server-only";

import type { DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { OrganizationRole } from "@/lib/auth/organization-schema";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getLeaseSearchKey } from "@/lib/leases/search-index";
import { getPersonSearchKey } from "@/lib/people/search-index";
import { getPropertySearchKey } from "@/lib/properties/search-index";
import { cleanSearchText, searchListHref, searchModulesFor, type SearchModule } from "./modules";

export type SearchItem = { id: string; label: string; sublabel: string; href: string };

export type SearchGroup = {
  module: SearchModule;
  listHref: string;
  items: SearchItem[];
  /** True when this module could not be searched (e.g. its index is not ready). */
  unavailable: boolean;
};

const text = (document: QueryDocumentSnapshot, field: string) => {
  const value = document.get(field);
  return typeof value === "string" ? value : "";
};

const joined = (...parts: string[]) => parts.filter(Boolean).join(" · ");

/** Uses the same prefix keys and indexes as each module's list. */
async function searchModule(
  organization: DocumentReference,
  module: SearchModule,
  query: string,
  limit: number,
): Promise<SearchItem[]> {
  if (module === "properties") {
    const key = getPropertySearchKey(
      { search: query, status: "", occupancy: "", type: "", includeArchived: false },
      query,
    );
    const snapshot = await organization
      .collection("properties")
      .where("searchKeys", "array-contains", key)
      .orderBy("searchName")
      .limit(limit)
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      label: text(document, "name"),
      sublabel: joined(text(document, "code"), text(document, "city")),
      href: `/admin/properties/${encodeURIComponent(document.id)}`,
    }));
  }

  if (module === "people") {
    const key = getPersonSearchKey(
      { search: query, relationship: "", status: "", includeArchived: false },
      query,
    );
    const snapshot = await organization
      .collection("people")
      .where("searchKeys", "array-contains", key)
      .orderBy("searchName")
      .limit(limit)
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      label: text(document, "name"),
      sublabel: text(document, "email"),
      href: `/admin/people/${encodeURIComponent(document.id)}`,
    }));
  }

  const snapshot = await organization
    .collection("leases")
    .where("searchKeys", "array-contains", getLeaseSearchKey("", query))
    .orderBy("code", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((document) => ({
    id: document.id,
    label: text(document, "code"),
    sublabel: joined(
      text(document, "tenantName"),
      [text(document, "propertyName"), text(document, "unitLabel")].filter(Boolean).join(" "),
    ),
    href: `/admin/leases/${encodeURIComponent(document.id)}`,
  }));
}

/** One group per module the role can view; a failing module does not hide the others. */
export async function searchEverything(
  organizationId: string,
  role: OrganizationRole | null,
  value: unknown,
  limit: number,
): Promise<SearchGroup[]> {
  const query = cleanSearchText(value);
  if (!query) return [];
  const organization = getFirebaseAdminFirestore().collection("organizations").doc(organizationId);

  return Promise.all(
    searchModulesFor(role).map(async ({ module }) => {
      const group = { module, listHref: searchListHref(module, query) };
      try {
        return { ...group, items: await searchModule(organization, module, query, limit), unavailable: false };
      } catch (error) {
        console.error("Global search failed for one module.", { organizationId, module, error });
        return { ...group, items: [], unavailable: true };
      }
    }),
  );
}
