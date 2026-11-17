import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getIndexUnavailableReason } from "@/lib/properties/list";
import { ownershipListFilters, type OwnershipListFilter } from "./list-filters";
import { parseOwnership, type Ownership } from "./records";

export const OWNERSHIPS_PAGE_SIZE = 25;

export type OwnershipRow = Ownership & { endDate: string | null };

export class OwnershipsIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore ownerships index is not ready.", options);
    this.name = "OwnershipsIndexUnavailableError";
  }
}

/** One page, newest first. Needs (active, createdAt desc) and (active, status, createdAt desc). */
export async function listOwnerships(organizationId: string, filter: OwnershipListFilter, cursor?: string) {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("ownerships");
  const status = ownershipListFilters[filter].status;
  const base = collection.where("active", "==", filter !== "finalizadas");
  let query = (status ? base.where("status", "==", status) : base)
    .orderBy("createdAt", "desc")
    .limit(OWNERSHIPS_PAGE_SIZE + 1);
  if (cursor) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
  }

  const snapshot = await query.get().catch((error: unknown) => {
    const reason = getIndexUnavailableReason(error);
    if (reason) throw new OwnershipsIndexUnavailableError(reason, { cause: error });
    throw error;
  });
  const documents = snapshot.docs.slice(0, OWNERSHIPS_PAGE_SIZE);
  return {
    rows: documents.map((document): OwnershipRow => {
      const endDate = document.get("endDate");
      return {
        ...parseOwnership(organizationId, document.id, document.data()),
        endDate: typeof endDate === "string" ? endDate : null,
      };
    }),
    nextCursor: snapshot.docs.length > OWNERSHIPS_PAGE_SIZE ? documents.at(-1)!.id : null,
  };
}
