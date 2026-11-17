import { NextResponse } from "next/server";
import { isValidSessionRequest } from "@/lib/auth/request-security";
import { requireStaffPermission } from "@/lib/access/authorize";
import { getImageErrorResponse } from "@/lib/properties/image-api";
import { propertyImageVariants } from "@/lib/properties/image-schema";
import { deletePropertyImage, readPropertyImageFile } from "@/lib/properties/images";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type ImageRouteContext = {
  params: Promise<{ propertyId: string; imageId: string }>;
};

function parseIds(propertyId: string, imageId: string) {
  return recordIdSchema.safeParse(propertyId).success && recordIdSchema.safeParse(imageId).success;
}

/**
 * Streams an image from the server's private storage folder after checking the
 * session's organization and role; the folder itself is never public.
 */
export async function GET(request: Request, { params }: ImageRouteContext) {
  const { propertyId, imageId } = await params;
  if (!parseIds(propertyId, imageId)) {
    return NextResponse.json({ error: "La imagen seleccionada no es válida." }, { status: 400 });
  }
  const variant = new URL(request.url).searchParams.get("variant") ?? "original";
  if (!propertyImageVariants.includes(variant as (typeof propertyImageVariants)[number])) {
    return NextResponse.json({ error: "Variante no válida." }, { status: 400 });
  }

  const access = await requireStaffPermission(
    "properties",
    "view",
    "Tu rol no tiene permiso para ver propiedades.",
  );
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  try {
    const file = await readPropertyImageFile(
      access.organizationId,
      propertyId,
      imageId,
      variant as (typeof propertyImageVariants)[number],
    );
    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.buffer.length),
        // Image ids are never reused, so the bytes behind a URL never change.
        "Cache-Control": "private, max-age=86400, immutable",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName || "imagen")}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return getImageErrorResponse(error, "Unable to read property image.");
  }
}

export async function DELETE(request: Request, { params }: ImageRouteContext) {
  const { propertyId, imageId } = await params;
  if (!parseIds(propertyId, imageId)) {
    return NextResponse.json({ error: "La imagen seleccionada no es válida." }, { status: 400 });
  }
  if (!isValidSessionRequest(request)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  }

  const access = await requireStaffPermission("properties", "update", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  try {
    await deletePropertyImage(access.organizationId, propertyId, access.userUid, imageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return getImageErrorResponse(error, "Unable to delete property image.");
  }
}
