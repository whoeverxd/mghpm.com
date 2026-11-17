import { normalizePropertySearch } from "@/lib/properties/search-index";
import type { RelationshipType } from "./relationships";

/** Relationships the directory tabs and filters can narrow by. */
export const personRelationshipFilters = ["owner", "tenant"] as const;
export const personStatuses = ["active", "pending", "inactive"] as const;

export type PersonRelationshipFilter = (typeof personRelationshipFilters)[number];
export type PersonStatus = (typeof personStatuses)[number];

export type PersonSearchFilters = {
  search: string;
  relationship: PersonRelationshipFilter | "";
  status: PersonStatus | "";
  includeArchived: boolean;
};

export type PersonSearchIndexInput = {
  relationshipTypes: readonly RelationshipType[];
  name: string;
  email: string;
  phone: string;
  contactName: string;
  status: PersonStatus;
  archived: boolean;
};

export const normalizePersonSearch = normalizePropertySearch;

export function normalizePersonEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getPersonFilterKey(
  filters: Pick<PersonSearchFilters, "relationship" | "status" | "includeArchived">,
) {
  return [
    `relationship=${filters.relationship || "*"}`,
    `status=${filters.status || "*"}`,
    `archived=${filters.includeArchived ? "*" : "false"}`,
  ].join("&");
}

export function getPersonSearchKey(filters: PersonSearchFilters, search: string) {
  return `${getPersonFilterKey(filters)}&search=${encodeURIComponent(
    normalizePersonSearch(search),
  )}`;
}

/**
 * Builds the facet keys (relationship × status × archived, each also as "*") and the
 * prefix search keys for name, email, phone digits and owner contact.
 */
export function createPersonSearchIndex(person: PersonSearchIndexInput) {
  const filterKeys: string[] = [];
  for (const indexedRelationship of [...new Set(person.relationshipTypes), "*"]) {
    for (const indexedStatus of [person.status, "*"]) {
      for (const indexedArchived of [String(person.archived), "*"]) {
        filterKeys.push(
          [
            `relationship=${indexedRelationship}`,
            `status=${indexedStatus}`,
            `archived=${indexedArchived}`,
          ].join("&"),
        );
      }
    }
  }

  const terms = new Set<string>();
  for (const field of [person.name, person.contactName, person.email]) {
    const normalized = normalizePersonSearch(field);
    if (!normalized) continue;
    terms.add(normalized);
    for (const term of normalized.split(/[\s/_.@+-]+/u)) {
      if (term) terms.add(term);
    }
  }
  const phoneDigits = person.phone.replace(/\D/gu, "");
  if (phoneDigits) terms.add(phoneDigits);

  const searchPrefixes = new Set<string>();
  for (const term of terms) {
    const characters = Array.from(term);
    for (let length = 1; length <= characters.length; length += 1) {
      searchPrefixes.add(characters.slice(0, length).join(""));
    }
  }

  return {
    searchName: normalizePersonSearch(person.name),
    filterKeys,
    searchKeys: filterKeys.flatMap((filterKey) =>
      Array.from(searchPrefixes, (prefix) =>
        `${filterKey}&search=${encodeURIComponent(prefix)}`,
      ),
    ),
  };
}
