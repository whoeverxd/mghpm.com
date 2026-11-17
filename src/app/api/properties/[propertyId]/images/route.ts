import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { isValidSessionRequest } from "@/lib/auth/request-security";
import { getImageErrorResponse } from "@/lib/properties/image-api";
import {
  MAX_PROPERTY_IMAGE_BYTES,
  propertyImageUpdateSchema,
} from "@/lib/properties/image-schema";
import { addPropertyImage, updatePropertyImages } from "@/lib/properties/images";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type ImagesRouteContext = {
  params: Promise<{ propertyId: string }>;
};

// Multipart overhead allowed on top of the file itself.
const MAX_REQUEST_BYTES = MAX_PROPERTY_IMAGE_BYTES + 64 * 1024;

/** Uploads one image (multipart field "file") to the property gallery. */
export async function POST(request: Request, { params }: ImagesRouteContext) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: "La propiedad seleccionada no es válida." }, { status: 400 });
  }
  if (!isValidSessionRequest(request)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  }
  const access = await requireStaffPermission("properties", "update", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Se esperaba un archivo." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "La imagen supera el máximo de 10 MB." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  }
  if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
    return NextResponse.json({ error: "La imagen supera el máximo de 10 MB." }, { status: 413 });
  }

  try {
    const imageId = await addPropertyImage(access.organizationId, propertyId, access.userUid, {
      buffer: Buffer.from(await file.arrayBuffer()),
      name: file.name,
    });
    return NextResponse.json({ imageId }, { status: 201 });
  } catch (error) {
    return getImageErrorResponse(error, "Unable to upload property image.");
  }
}

/** Sets the cover image and/or the gallery order. */
export async function PATCH(request: Request, { params }: ImagesRouteContext) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: "La propiedad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("properties", "update", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, propertyImageUpdateSchema);
  if ("response" in body) return body.response;

  try {
    await updatePropertyImages(access.organizationId, propertyId, access.userUid, body.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return getImageErrorResponse(error, "Unable to update property images.");
  }
}
