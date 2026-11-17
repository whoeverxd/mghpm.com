import "server-only";

import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { deleteStoredFile, readStoredFile, saveStoredFile } from "@/lib/storage/local-files";
import { PropertyRecordNotFoundError } from "./records";
import {
  MAX_PROPERTY_IMAGES,
  propertyImageDocumentSchema,
  type PropertyImageContentType,
  type PropertyImageDocument,
  type PropertyImageVariant,
} from "./image-schema";
import { propertyDocumentSchema } from "./schema";
import { auditEventFields } from "@/lib/audit/area";

export class InvalidPropertyImageError extends Error {
  constructor() {
    super("The file is not a JPG, PNG or WebP image.");
    this.name = "InvalidPropertyImageError";
  }
}

export class PropertyImageLimitError extends Error {
  constructor() {
    super("The property reached the maximum number of images.");
    this.name = "PropertyImageLimitError";
  }
}

export class PropertyImageNotFoundError extends Error {
  constructor() {
    super("The image does not exist in the selected property.");
    this.name = "PropertyImageNotFoundError";
  }
}

export class PropertyImageOrderError extends Error {
  constructor() {
    super("The new order must list every image of the property exactly once.");
    this.name = "PropertyImageOrderError";
  }
}

export type PropertyImage = PropertyImageDocument & { id: string };

const formatContentTypes: Partial<Record<string, PropertyImageContentType>> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const extensions: Record<PropertyImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_HEIGHT = 480;

function getPropertyReference(organizationId: string, propertyId: string) {
  return getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("properties")
    .doc(propertyId);
}

function parseImage(imageId: string, data: unknown): PropertyImage {
  const parsed = propertyImageDocumentSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid property image document.", { imageId, issues: parsed.error.issues });
    throw new Error("A property image record is incomplete or invalid.");
  }
  return { id: imageId, ...parsed.data };
}

function sortImages(images: PropertyImage[]) {
  return images.sort((left, right) => left.position - right.position);
}

export async function listPropertyImages(organizationId: string, propertyId: string) {
  const snapshot = await getPropertyReference(organizationId, propertyId)
    .collection("images")
    .limit(MAX_PROPERTY_IMAGES)
    .get();
  return sortImages(snapshot.docs.map((document) => parseImage(document.id, document.data())));
}

/**
 * Reads the real image format from its bytes (never the extension or the
 * browser's MIME type) and builds an EXIF-oriented WebP thumbnail.
 */
async function inspectImage(buffer: Buffer) {
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new InvalidPropertyImageError();
  }
  const contentType = metadata.format ? formatContentTypes[metadata.format] : undefined;
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;
  if (!contentType || !width || !height) throw new InvalidPropertyImageError();

  const thumbnail = await sharp(buffer)
    .rotate()
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: "cover" })
    .webp({ quality: 78 })
    .toBuffer();

  return { contentType, width, height, thumbnail };
}

async function readImagesInTransaction(
  transaction: FirebaseFirestore.Transaction,
  organizationId: string,
  propertyId: string,
) {
  const propertyReference = getPropertyReference(organizationId, propertyId);
  const [propertySnapshot, imageSnapshots] = await Promise.all([
    transaction.get(propertyReference),
    transaction.get(propertyReference.collection("images").limit(MAX_PROPERTY_IMAGES + 1)),
  ]);
  if (!propertySnapshot.exists) throw new PropertyRecordNotFoundError();
  const property = propertyDocumentSchema.safeParse(propertySnapshot.data());
  if (!property.success) throw new Error("A property record is incomplete or invalid.");

  return {
    propertyReference,
    property: property.data,
    images: sortImages(
      imageSnapshots.docs.map((document) => parseImage(document.id, document.data())),
    ),
  };
}

function writeAudit(
  transaction: FirebaseFirestore.Transaction,
  organizationId: string,
  propertyId: string,
  userUid: string,
  action: string,
  imageId: string,
) {
  const auditReference = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("auditEvents")
    .doc();
  transaction.create(auditReference, auditEventFields({
    organizationId,
    action,
    actorUid: userUid,
    targetId: imageId,
    propertyId,
    createdAt: FieldValue.serverTimestamp(),
  }));
}

/**
 * Stores the original and its thumbnail in the server's private storage folder, then records
 * the image and the gallery projection on the property in one transaction.
 * If the transaction fails, the uploaded files are removed.
 */
export async function addPropertyImage(
  organizationId: string,
  propertyId: string,
  userUid: string,
  file: { buffer: Buffer; name: string },
) {
  const image = await inspectImage(file.buffer);
  const propertyReference = getPropertyReference(organizationId, propertyId);
  const imageReference = propertyReference.collection("images").doc();
  const basePath = `organizations/${organizationId}/properties/${propertyId}/images/${imageReference.id}`;
  const storagePath = `${basePath}/original.${extensions[image.contentType]}`;
  const thumbnailPath = `${basePath}/thumbnail.webp`;

  // Fail fast before uploading; the transaction re-checks the limit.
  const current = await propertyReference.get();
  if (!current.exists) throw new PropertyRecordNotFoundError();
  if ((current.data()?.imageCount ?? 0) >= MAX_PROPERTY_IMAGES) throw new PropertyImageLimitError();

  await Promise.all([
    saveStoredFile(storagePath, file.buffer),
    saveStoredFile(thumbnailPath, image.thumbnail),
  ]);

  try {
    await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
      const { property, images } = await readImagesInTransaction(
        transaction,
        organizationId,
        propertyId,
      );
      if (images.length >= MAX_PROPERTY_IMAGES) throw new PropertyImageLimitError();

      const timestamp = FieldValue.serverTimestamp();
      transaction.create(imageReference, {
        storagePath,
        thumbnailPath,
        contentType: image.contentType,
        sizeBytes: file.buffer.length,
        width: image.width,
        height: image.height,
        originalName: file.name.slice(0, 200),
        position: images.length === 0 ? 0 : images[images.length - 1].position + 1,
        organizationId,
        propertyId,
        createdAt: timestamp,
        createdBy: userUid,
      } satisfies PropertyImageDocument & Record<string, unknown>);
      transaction.update(propertyReference, {
        imageCount: images.length + 1,
        coverImageId: property.coverImageId ?? imageReference.id,
        updatedAt: timestamp,
        updatedBy: userUid,
      });
      writeAudit(transaction, organizationId, propertyId, userUid, "property.image_added", imageReference.id);
    });
  } catch (error) {
    await Promise.all(
      [storagePath, thumbnailPath].map((path) => deleteStoredFile(path).catch(() => undefined)),
    );
    throw error;
  }

  return imageReference.id;
}

/** Removes the image; when it was the cover, the next image in order takes its place. */
export async function deletePropertyImage(
  organizationId: string,
  propertyId: string,
  userUid: string,
  imageId: string,
) {
  const removed = await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const { propertyReference, property, images } = await readImagesInTransaction(
      transaction,
      organizationId,
      propertyId,
    );
    const image = images.find((item) => item.id === imageId);
    if (!image) throw new PropertyImageNotFoundError();

    const remaining = images.filter((item) => item.id !== imageId);
    transaction.delete(propertyReference.collection("images").doc(imageId));
    transaction.update(propertyReference, {
      imageCount: remaining.length,
      coverImageId:
        property.coverImageId === imageId ? (remaining[0]?.id ?? null) : (property.coverImageId ?? null),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    writeAudit(transaction, organizationId, propertyId, userUid, "property.image_removed", imageId);
    return image;
  });

  // Files go after the commit; an orphaned file is harmless, a broken record is not.
  await Promise.all(
    [removed.storagePath, removed.thumbnailPath].map((path) =>
      deleteStoredFile(path).catch((error: unknown) =>
        console.error("Unable to delete property image file.", { path, error }),
      ),
    ),
  );
}

export async function updatePropertyImages(
  organizationId: string,
  propertyId: string,
  userUid: string,
  update: { coverImageId?: string; order?: string[] },
) {
  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const { propertyReference, images } = await readImagesInTransaction(
      transaction,
      organizationId,
      propertyId,
    );
    const ids = new Set(images.map((image) => image.id));

    if (update.coverImageId !== undefined && !ids.has(update.coverImageId)) {
      throw new PropertyImageNotFoundError();
    }
    if (
      update.order &&
      (update.order.length !== ids.size ||
        new Set(update.order).size !== ids.size ||
        update.order.some((id) => !ids.has(id)))
    ) {
      throw new PropertyImageOrderError();
    }

    update.order?.forEach((id, position) => {
      transaction.update(propertyReference.collection("images").doc(id), { position });
    });
    transaction.update(propertyReference, {
      ...(update.coverImageId !== undefined ? { coverImageId: update.coverImageId } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userUid,
    });
    writeAudit(
      transaction,
      organizationId,
      propertyId,
      userUid,
      update.coverImageId !== undefined ? "property.image_cover_set" : "property.images_reordered",
      update.coverImageId ?? propertyId,
    );
  });
}

export async function readPropertyImageFile(
  organizationId: string,
  propertyId: string,
  imageId: string,
  variant: PropertyImageVariant,
) {
  const snapshot = await getPropertyReference(organizationId, propertyId)
    .collection("images")
    .doc(imageId)
    .get();
  if (!snapshot.exists) throw new PropertyImageNotFoundError();
  const image = parseImage(snapshot.id, snapshot.data());

  const path = variant === "thumbnail" ? image.thumbnailPath : image.storagePath;
  const buffer = await readStoredFile(path);
  return {
    buffer,
    contentType: variant === "thumbnail" ? "image/webp" : image.contentType,
    fileName: image.originalName,
  };
}
