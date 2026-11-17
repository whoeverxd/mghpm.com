import { NextResponse } from "next/server";
import sharp from "sharp";
import { propertyImageVariants, type PropertyImageVariant } from "@/lib/properties/image-schema";
import { PropertyImageNotFoundError, readPropertyImageFile } from "@/lib/properties/images";
import { recordIdSchema } from "@/lib/properties/schema";
import { getCatalogOrganizationId, propertyHasPublicListing } from "@/lib/stays/catalog";

export const dynamic = "force-dynamic";

type PublicImageRouteContext = {
  params: Promise<{ propertyId: string; imageId: string }>;
};

const notFound = () => NextResponse.json({ error: "Not found." }, { status: 404 });

/** Serves gallery images of properties that have at least one visible stay. */
export async function GET(request: Request, { params }: PublicImageRouteContext) {
  const { propertyId, imageId } = await params;
  const variant = new URL(request.url).searchParams.get("variant") ?? "thumbnail";
  if (
    !recordIdSchema.safeParse(propertyId).success ||
    !recordIdSchema.safeParse(imageId).success ||
    !propertyImageVariants.includes(variant as PropertyImageVariant)
  ) {
    return notFound();
  }

  const organizationId = getCatalogOrganizationId();
  if (!organizationId) return notFound();

  try {
    if (!(await propertyHasPublicListing(propertyId))) return notFound();
    const file = await readPropertyImageFile(
      organizationId,
      propertyId,
      imageId,
      variant as PropertyImageVariant,
    );
    // Originals are stored as uploaded; re-encoding drops EXIF (GPS, camera) before going public.
    const body =
      variant === "original" ? await sharp(file.buffer).rotate().toBuffer() : file.buffer;
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof PropertyImageNotFoundError) return notFound();
    console.error("Unable to read public stay image.", error);
    return NextResponse.json({ error: "Unavailable." }, { status: 500 });
  }
}
