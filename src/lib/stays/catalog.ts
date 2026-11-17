import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { listPropertyImages } from "@/lib/properties/images";
import { propertyDocumentSchema } from "@/lib/properties/schema";
import { MAX_UNITS_PER_PROPERTY, unitDocumentSchema } from "@/lib/properties/unit-schema";
import { toPublicListing, type PublicListing } from "./listing";

/** Organization whose inventory the public catalog shows; null disables the catalog. */
export function getCatalogOrganizationId() {
  const organizationId = process.env.PUBLIC_CATALOG_ORGANIZATION_ID?.trim();
  if (!organizationId || !/^[A-Za-z0-9_-]{1,128}$/.test(organizationId)) {
    console.error("PUBLIC_CATALOG_ORGANIZATION_ID is not configured; the stays catalog is empty.");
    return null;
  }
  return organizationId;
}

function getPropertiesCollection(organizationId: string) {
  return getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties");
}

/** Invalid records are skipped and logged so one bad document cannot break the catalog. */
async function readPropertyListings(organizationId: string, propertyId: string, data: unknown) {
  const property = propertyDocumentSchema.safeParse(data);
  if (!property.success) {
    console.error("Skipping invalid property in the stays catalog.", {
      propertyId,
      issues: property.error.issues,
    });
    return [];
  }

  const units = await getPropertiesCollection(organizationId)
    .doc(propertyId)
    .collection("units")
    .where("stay.published", "==", true)
    .limit(MAX_UNITS_PER_PROPERTY)
    .get();

  return units.docs.flatMap((document) => {
    const unit = unitDocumentSchema.safeParse(document.data());
    if (!unit.success) {
      console.error("Skipping invalid unit in the stays catalog.", {
        propertyId,
        unitId: document.id,
        issues: unit.error.issues,
      });
      return [];
    }
    const listing = toPublicListing(propertyId, property.data, document.id, unit.data);
    return listing ? [listing] : [];
  });
}

export async function listPublicListings(): Promise<PublicListing[]> {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return [];

  const properties = await getPropertiesCollection(organizationId)
    .where("status", "==", "active")
    .get();
  const groups = await Promise.all(
    properties.docs.map((document) =>
      readPropertyListings(organizationId, document.id, document.data()),
    ),
  );
  return groups.flat();
}

export async function getPublicListing(propertyId: string, unitId: string) {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return null;

  const propertyReference = getPropertiesCollection(organizationId).doc(propertyId);
  const [propertySnapshot, unitSnapshot] = await Promise.all([
    propertyReference.get(),
    propertyReference.collection("units").doc(unitId).get(),
  ]);
  if (!propertySnapshot.exists || !unitSnapshot.exists) return null;

  const property = propertyDocumentSchema.safeParse(propertySnapshot.data());
  const unit = unitDocumentSchema.safeParse(unitSnapshot.data());
  if (!property.success || !unit.success) return null;
  return toPublicListing(propertyId, property.data, unitId, unit.data);
}

/** Images of a property are public only while it has at least one visible unit. */
export async function propertyHasPublicListing(propertyId: string) {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return false;

  const snapshot = await getPropertiesCollection(organizationId).doc(propertyId).get();
  if (!snapshot.exists) return false;
  return (await readPropertyListings(organizationId, propertyId, snapshot.data())).length > 0;
}

export async function listPublicListingImageIds(propertyId: string) {
  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return [];
  return (await listPropertyImages(organizationId, propertyId)).map((image) => image.id);
}
