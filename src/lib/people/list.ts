import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getIndexUnavailableReason } from "@/lib/properties/list";
import { parsePerson, type Person } from "./records";
import type { RelationshipType } from "./relationships";
import {
  getPersonFilterKey,
  getPersonSearchKey,
  normalizePersonSearch,
  personRelationshipFilters,
  type PersonRelationshipFilter,
  type PersonSearchFilters,
} from "./search-index";

export const PEOPLE_PAGE_SIZE = 20;

export type PersonLink = {
  propertyId: string;
  propertyName: string | null;
  unitLabel: string | null;
};

export type ListedPerson = Person & { link: PersonLink | null };

export type PeopleListPage = {
  people: ListedPerson[];
  totalCount: number;
  relationshipCounts: Record<PersonRelationshipFilter, number>;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  previousCursor: string | null;
  nextCursor: string | null;
};

export class PeopleIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore people index is not ready.", options);
    this.name = "PeopleIndexUnavailableError";
  }
}

/**
 * Resolves tenant links to display names at read time instead of keeping
 * copies on the person, so renaming a property or unit never leaves stale
 * labels. Reads at most two documents per listed person.
 */
export async function resolvePersonLinks(organizationId: string, people: Person[]) {
  const db = getFirebaseAdminFirestore();
  const properties = db.collection("organizations").doc(organizationId).collection("properties");
  const propertyIds = [...new Set(people.flatMap((person) => person.propertyId ?? []))];
  const unitPaths = [
    ...new Set(
      people.flatMap((person) =>
        person.propertyId && person.unitId ? `${person.propertyId}/units/${person.unitId}` : [],
      ),
    ),
  ];
  const references = [
    ...propertyIds.map((id) => properties.doc(id)),
    ...unitPaths.map((path) => properties.doc(path)),
  ];
  const snapshots = references.length ? await db.getAll(...references) : [];
  const names = new Map<string, string>();
  for (const snapshot of snapshots) {
    const data = snapshot.data();
    const label = snapshot.ref.parent.id === "units" ? data?.label : data?.name;
    if (typeof label === "string") names.set(snapshot.ref.path, label);
  }

  return people.map((person): ListedPerson => ({
    ...person,
    link: person.propertyId
      ? {
          propertyId: person.propertyId,
          propertyName: names.get(properties.doc(person.propertyId).path) ?? null,
          unitLabel: person.unitId
            ? names.get(properties.doc(`${person.propertyId}/units/${person.unitId}`).path) ?? null
            : null,
        }
      : null,
  }));
}

export async function listOrganizationPeople(
  organizationId: string,
  filters: PersonSearchFilters,
  page: number,
  cursor: string | undefined,
  direction: "next" | "previous" | undefined,
): Promise<PeopleListPage> {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("people");

  const filterKey = getPersonFilterKey(filters);
  const normalizedSearch = normalizePersonSearch(filters.search);
  const searchKey = normalizedSearch ? getPersonSearchKey(filters, normalizedSearch) : null;
  const query = collection
    .where(searchKey ? "searchKeys" : "filterKeys", "array-contains", searchKey ?? filterKey)
    .orderBy("searchName");

  const totalCountPromise = query.count().get();
  // Counts and filters use the relationship facet of filterKeys (the same one that
  // mirrors relationshipTypes) because Firestore allows one array-contains per query.
  const relationshipCountPromises = personRelationshipFilters.map((relationship) =>
    collection
      .where("filterKeys", "array-contains", getPersonFilterKey({
        relationship,
        status: "",
        includeArchived: false,
      }))
      .count()
      .get(),
  );
  let pageQuery = query.limit(PEOPLE_PAGE_SIZE + 1);
  if (cursor && direction) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (!cursorSnapshot.exists) {
      throw new Error("The people list cursor is no longer available.");
    }
    const cursorPerson = parsePerson(organizationId, cursorSnapshot.id, cursorSnapshot.data());
    if (
      searchKey
        ? !cursorPerson.searchKeys.includes(searchKey)
        : !cursorPerson.filterKeys.includes(filterKey)
    ) {
      throw new Error("The people list cursor does not match the current filters.");
    }

    pageQuery =
      direction === "next"
        ? pageQuery.startAfter(cursorSnapshot)
        : query.endBefore(cursorSnapshot).limitToLast(PEOPLE_PAGE_SIZE + 1);
  }

  const [snapshot, countSnapshot, ...relationshipCountSnapshots] = await Promise.all([
    pageQuery.get(),
    totalCountPromise,
    ...relationshipCountPromises,
  ]).catch((error: unknown) => {
    const indexReason = getIndexUnavailableReason(error);
    if (indexReason) throw new PeopleIndexUnavailableError(indexReason, { cause: error });
    throw error;
  });
  const totalCount = countSnapshot.data().count;
  const totalPages = Math.max(1, Math.ceil(totalCount / PEOPLE_PAGE_SIZE));
  const hasExtraPage = snapshot.docs.length > PEOPLE_PAGE_SIZE;
  const pageDocuments =
    direction === "previous" && hasExtraPage
      ? snapshot.docs.slice(1)
      : snapshot.docs.slice(0, PEOPLE_PAGE_SIZE);

  const people = pageDocuments.map((document) => {
    const person = parsePerson(organizationId, document.id, document.data());
    if (
      !person.filterKeys.includes(filterKey) ||
      person.searchName !== normalizePersonSearch(person.name) ||
      (searchKey && !person.searchKeys.includes(searchKey))
    ) {
      console.error("Person search index is inconsistent.", {
        organizationId,
        personId: document.id,
      });
      throw new Error("A person record has an outdated search index.");
    }
    return person;
  });

  return {
    people: await resolvePersonLinks(organizationId, people),
    totalCount,
    relationshipCounts: Object.fromEntries(
      personRelationshipFilters.map((relationship, index) => [
        relationship,
        relationshipCountSnapshots[index].data().count,
      ]),
    ) as Record<PersonRelationshipFilter, number>,
    page,
    totalPages,
    hasPreviousPage: page > 1 && people.length > 0,
    hasNextPage: direction === "previous" ? page < totalPages : hasExtraPage,
    previousCursor: people[0]?.id ?? null,
    nextCursor: people.at(-1)?.id ?? null,
  };
}

export const PERSON_ACCOUNT_OPTION_LIMIT = 500;

export type PersonAccountOption = {
  id: string;
  name: string;
  email: string;
  relationshipTypes: RelationshipType[];
};

/** Non-archived owners and tenants without an account, for granting access (people with both appear once). */
export async function listPersonAccountOptions(organizationId: string) {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("people");
  const snapshots = await Promise.all(
    personRelationshipFilters.map((relationship) =>
      collection
        .where("filterKeys", "array-contains", getPersonFilterKey({
          relationship,
          status: "",
          includeArchived: false,
        }))
        .orderBy("searchName")
        .limit(PERSON_ACCOUNT_OPTION_LIMIT)
        .get(),
    ),
  );

  const options = new Map<string, PersonAccountOption>();
  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      const person = parsePerson(organizationId, document.id, document.data());
      if (person.accountUid || options.has(person.id)) continue;
      options.set(person.id, {
        id: person.id,
        name: person.name,
        email: person.email,
        relationshipTypes: person.relationshipTypes,
      });
    }
  }
  return [...options.values()];
}

export const REPRESENTATIVE_OPTION_LIMIT = 500;

export type RepresentativeOption = { id: string; name: string; email: string };

/** Non-archived individuals by name, for the entity representative picker. */
export async function listRepresentativeOptions(organizationId: string): Promise<RepresentativeOption[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("people")
    .where(
      "filterKeys",
      "array-contains",
      getPersonFilterKey({ relationship: "", status: "", includeArchived: false }),
    )
    .orderBy("searchName")
    .limit(REPRESENTATIVE_OPTION_LIMIT)
    .get();
  return snapshot.docs
    .map((document) => parsePerson(organizationId, document.id, document.data()))
    .filter((person) => person.kind === "individual")
    .map((person) => ({ id: person.id, name: person.name, email: person.email }));
}

/** Entities (non-archived) that this person represents. */
export async function listRepresentedEntities(organizationId: string, personId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("people")
    .where("representativeId", "==", personId)
    .limit(100)
    .get();
  return snapshot.docs
    .map((document) => parsePerson(organizationId, document.id, document.data()))
    .filter((person) => !person.archived);
}
