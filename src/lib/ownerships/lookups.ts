import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

function organizationReference(organizationId: string) {
  return getFirebaseAdminFirestore().collection("organizations").doc(organizationId);
}

export type PropertySummary = {
  id: string;
  name: string;
  code: string;
  city: string;
  archived: boolean;
};

export type PersonSummary = { id: string; name: string; archived: boolean };

/** Names for a set of properties (one batched read). Missing ones are simply absent. */
export async function getPropertySummaries(organizationId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const result = new Map<string, PropertySummary>();
  if (unique.length === 0) return result;
  const snapshots = await getFirebaseAdminFirestore().getAll(
    ...unique.map((id) => organizationReference(organizationId).collection("properties").doc(id)),
  );
  for (const snapshot of snapshots) {
    if (!snapshot.exists) continue;
    result.set(snapshot.id, {
      id: snapshot.id,
      name: String(snapshot.get("name") ?? ""),
      code: String(snapshot.get("code") ?? ""),
      city: String(snapshot.get("city") ?? ""),
      archived: snapshot.get("archived") === true,
    });
  }
  return result;
}

export async function getPersonSummaries(organizationId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const result = new Map<string, PersonSummary>();
  if (unique.length === 0) return result;
  const snapshots = await getFirebaseAdminFirestore().getAll(
    ...unique.map((id) => organizationReference(organizationId).collection("people").doc(id)),
  );
  for (const snapshot of snapshots) {
    if (!snapshot.exists) continue;
    result.set(snapshot.id, {
      id: snapshot.id,
      name: String(snapshot.get("name") ?? ""),
      archived: snapshot.get("archived") === true,
    });
  }
  return result;
}

const OPTION_LIMIT = 500;

export type OwnerCandidate = { id: string; name: string; kind: string };

/** Non-archived people (individuals and entities) by name, for the ownership picker. */
export async function listOwnerCandidates(organizationId: string): Promise<OwnerCandidate[]> {
  const snapshot = await organizationReference(organizationId)
    .collection("people")
    .where("archived", "==", false)
    .limit(OPTION_LIMIT)
    .get();
  return snapshot.docs
    .map((document) => ({
      id: document.id,
      name: String(document.get("name") ?? ""),
      kind: document.get("kind") === "entity" || document.get("contactName") ? "entity" : "individual",
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

/** Percentage already assigned to each active property (from the property projection). */
export async function listOwnershipTotals(organizationId: string) {
  const snapshot = await organizationReference(organizationId)
    .collection("properties")
    .where("archived", "==", false)
    .limit(OPTION_LIMIT)
    .get();
  const totals: Record<string, number> = {};
  for (const document of snapshot.docs) {
    const total = document.get("ownershipTotalPct");
    totals[document.id] = typeof total === "number" ? total : 0;
  }
  return totals;
}
