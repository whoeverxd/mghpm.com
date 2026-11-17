import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export { auditActionLabels, getAuditActionLabel } from "./labels";

export type AuditEntry = {
  id: string;
  action: string;
  actorUid: string;
  createdAt: Date | null;
  from: string | null;
  to: string | null;
  reason: string | null;
};

/**
 * Latest audit events of one record, newest first. Needs the `auditEvents`
 * index on `targetId` + `createdAt desc`; returns null when it is unavailable
 * so the page can still render.
 */
export async function listRecentAuditEvents(
  organizationId: string,
  targetId: string,
  limit = 20,
): Promise<AuditEntry[] | null> {
  try {
    const snapshot = await getFirebaseAdminFirestore()
      .collection("organizations")
      .doc(organizationId)
      .collection("auditEvents")
      .where("targetId", "==", targetId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map((document) => {
      const data = document.data();
      const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
      return {
        id: document.id,
        action: String(data.action ?? ""),
        actorUid: String(data.actorUid ?? ""),
        createdAt: typeof createdAt?.toDate === "function" ? createdAt.toDate() : null,
        from: typeof data.from === "string" ? data.from : null,
        to: typeof data.to === "string" ? data.to : null,
        reason: typeof data.reason === "string" ? data.reason : null,
      };
    });
  } catch (error) {
    console.error("Unable to read recent audit events.", { organizationId, targetId, error });
    return null;
  }
}
