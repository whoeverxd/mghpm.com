import { z } from "zod";

export const MAX_PROPERTY_IMAGES = 30;
export const MAX_PROPERTY_IMAGE_BYTES = 10 * 1024 * 1024;
export const propertyImageContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const propertyImageVariants = ["original", "thumbnail"] as const;

export type PropertyImageContentType = (typeof propertyImageContentTypes)[number];
export type PropertyImageVariant = (typeof propertyImageVariants)[number];

export const propertyImageDocumentSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailPath: z.string().min(1),
  contentType: z.enum(propertyImageContentTypes),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  originalName: z.string(),
  position: z.number().int().nonnegative(),
});

export type PropertyImageDocument = z.infer<typeof propertyImageDocumentSchema>;

/** Gallery changes: choose the cover and/or the full display order. */
export const propertyImageUpdateSchema = z
  .object({
    coverImageId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/).optional(),
    order: z.array(z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)).max(MAX_PROPERTY_IMAGES).optional(),
  })
  .refine((input) => input.coverImageId !== undefined || input.order !== undefined, {
    message: "Indica la imagen principal o el nuevo orden.",
  });

export function getPropertyImageUrl(
  propertyId: string,
  imageId: string,
  variant: PropertyImageVariant,
) {
  return `/api/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(imageId)}?variant=${variant}`;
}
