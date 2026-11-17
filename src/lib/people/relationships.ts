export const personKinds = ["individual", "entity"] as const;
export const entityTypes = ["trust", "company", "co_ownership", "other"] as const;
export const relationshipTypes = ["owner", "tenant", "applicant", "guest", "owner_prospect"] as const;

export type PersonKind = (typeof personKinds)[number];
export type EntityType = (typeof entityTypes)[number];
export type RelationshipType = (typeof relationshipTypes)[number];

type RelationshipDate = Date | { toDate(): Date };

export type Relationship = {
  status: "active" | "ended";
  since: RelationshipDate;
  endedAt?: RelationshipDate | null;
  propertyId?: string | null;
  unitId?: string | null;
};

export type Relationships = Partial<Record<RelationshipType, Relationship>>;

/** Active relationship types in a stable order (used for relationshipTypes and badges). */
export function activeRelationshipTypes(relationships: Relationships): RelationshipType[] {
  return relationshipTypes.filter((type) => relationships[type]?.status === "active");
}

export function hasActiveRelationship(relationships: Relationships, type: RelationshipType) {
  return relationships[type]?.status === "active";
}

export function upsertRelationship(
  relationships: Relationships,
  type: RelationshipType,
  since: RelationshipDate,
  extra: Pick<Relationship, "propertyId" | "unitId"> = {},
): Relationships {
  const current = relationships[type];
  return {
    ...relationships,
    [type]: {
      ...current,
      ...extra,
      status: "active",
      since: current?.status === "active" ? current.since : since,
      endedAt: null,
    },
  };
}

export function endRelationship(
  relationships: Relationships,
  type: RelationshipType,
  endedAt: RelationshipDate,
): Relationships {
  const current = relationships[type];
  if (!current || current.status === "ended") return relationships;
  return { ...relationships, [type]: { ...current, status: "ended", endedAt } };
}

type LegacyOrNew = {
  type?: "owner" | "tenant";
  kind?: PersonKind;
  contactName?: string;
  propertyId?: string | null;
  unitId?: string | null;
  relationships?: Relationships;
  createdAt?: RelationshipDate;
};

/**
 * Reads legacy single-type people (type owner|tenant) as the new model.
 * New-format documents are returned unchanged.
 */
export function normalizePersonIdentity(data: LegacyOrNew): { kind: PersonKind; relationships: Relationships } {
  const since = data.createdAt ?? new Date(0);
  // Stored values win; legacy `type` only fills what a partially migrated document lacks.
  const derived: { kind: PersonKind; relationships: Relationships } =
    data.type === "tenant"
      ? {
          kind: "individual",
          relationships: {
            tenant: { status: "active", since, propertyId: data.propertyId ?? null, unitId: data.unitId ?? null },
          },
        }
      : {
          kind: data.contactName ? "entity" : "individual",
          relationships: data.type === "owner" ? { owner: { status: "active", since } } : {},
        };
  return {
    kind: data.kind ?? derived.kind,
    relationships: data.relationships ?? derived.relationships,
  };
}
