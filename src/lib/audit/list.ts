import "server-only";

import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getIndexUnavailableReason } from "@/lib/properties/list";
import type { AuditArea } from "./area";
import { toAuditRow } from "./format";

export const AUDIT_PAGE_SIZE = 50;

export class AuditIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore audit index is not ready.", options);
    this.name = "AuditIndexUnavailableError";
  }
}

/** Newest first; filtering by area needs the (area, createdAt desc) index. */
export async function listAuditEvents(organizationId: string, area: AuditArea | null, cursor?: string) {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("auditEvents");
  let query = (area ? collection.where("area", "==", area) : collection)
    .orderBy("createdAt", "desc")
    .limit(AUDIT_PAGE_SIZE + 1);
  if (cursor) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
  }
  const snapshot = await query.get().catch((error: unknown) => {
    const reason = getIndexUnavailableReason(error);
    if (reason) throw new AuditIndexUnavailableError(reason, { cause: error });
    throw error;
  });
  const documents = snapshot.docs.slice(0, AUDIT_PAGE_SIZE);
  return {
    rows: documents.map((document) => toAuditRow(document.id, document.data())),
    nextCursor: snapshot.docs.length > AUDIT_PAGE_SIZE ? documents.at(-1)!.id : null,
  };
}

/** Display name (or email) of each actor; unknown uids are left out. */
export async function getActorNames(uids: string[]) {
  const unique = [...new Set(uids.filter(Boolean))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;
  const { users } = await getFirebaseAdminAuth().getUsers(unique.map((uid) => ({ uid })));
  for (const user of users) names.set(user.uid, user.displayName || user.email || user.uid);
  return names;
}
