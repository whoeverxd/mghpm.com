export const propertyStatuses = ["active", "inactive", "draft"] as const;
export const propertyOccupancies = ["vacant", "occupied", "maintenance"] as const;
export const propertyTypes = [
  "residential",
  "commercial",
  "industrial",
  "mixed",
  "land",
  "apartment_condo",
] as const;

export type PropertyStatus = (typeof propertyStatuses)[number];
export type PropertyOccupancy = (typeof propertyOccupancies)[number];
export type PropertyType = (typeof propertyTypes)[number];

export type PropertySearchFilters = {
  search: string;
  status: PropertyStatus | "";
  occupancy: PropertyOccupancy | "";
  type: PropertyType | "";
  includeArchived: boolean;
};

export type PropertySearchIndexInput = {
  name: string;
  code: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  status: PropertyStatus;
  occupancy: PropertyOccupancy;
  archived: boolean;
};

export function normalizePropertySearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function getPropertyFilterKey(filters: PropertySearchFilters) {
  return [
    `status=${filters.status || "*"}`,
    `occupancy=${filters.occupancy || "*"}`,
    `type=${filters.type || "*"}`,
    `archived=${filters.includeArchived ? "*" : "false"}`,
  ].join("&");
}

export function getPropertySearchKey(
  filters: PropertySearchFilters,
  search: string,
) {
  return `${getPropertyFilterKey(filters)}&search=${encodeURIComponent(
    normalizePropertySearch(search),
  )}`;
}

export function createPropertySearchIndex(
  property: PropertySearchIndexInput,
) {
  const statuses = [property.status, "*"];
  const occupancies = [property.occupancy, "*"];
  const types = [property.type, "*"];
  const archiveStates = [String(property.archived), "*"];
  const filterKeys: string[] = [];

  for (const indexedStatus of statuses) {
    for (const indexedOccupancy of occupancies) {
      for (const indexedType of types) {
        for (const indexedArchived of archiveStates) {
          filterKeys.push(
            [
              `status=${indexedStatus}`,
              `occupancy=${indexedOccupancy}`,
              `type=${indexedType}`,
              `archived=${indexedArchived}`,
            ].join("&"),
          );
        }
      }
    }
  }

  const searchPrefixes = new Set<string>();
  const searchFields = [
    property.name,
    property.code,
    property.type,
    property.address,
    property.city,
    property.state,
  ];

  for (const field of searchFields) {
    const normalized = normalizePropertySearch(field);
    const terms = new Set([
      normalized,
      ...normalized.split(/[\s/_-]+/u).filter(Boolean),
    ]);

    for (const term of terms) {
      const characters = Array.from(term);
      for (let length = 1; length <= characters.length; length += 1) {
        searchPrefixes.add(characters.slice(0, length).join(""));
      }
    }
  }

  return {
    searchName: normalizePropertySearch(property.name),
    filterKeys,
    searchKeys: filterKeys.flatMap((filterKey) =>
      Array.from(searchPrefixes, (prefix) =>
        `${filterKey}&search=${encodeURIComponent(prefix)}`,
      ),
    ),
  };
}
