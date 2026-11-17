import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export async function getDashboardSummary(organizationId: string) {
  const properties = await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties")
    .count()
    .get();

  return {
    propertyCount: properties.data().count,
  };
}
