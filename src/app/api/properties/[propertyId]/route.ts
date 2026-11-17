import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import {
  PropertyCodeConflictError,
  PropertyRecordNotFoundError,
  updateOrganizationProperty,
} from "@/lib/properties/records";
import { propertyInputSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

const propertyIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

type PropertyRouteContext = {
  params: Promise<{ propertyId: string }>;
};

export async function PATCH(request: Request, { params }: PropertyRouteContext) {
  const { propertyId } = await params;
  if (!propertyIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: "La propiedad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission(
    "properties",
    "update",
    "Tu rol no tiene permiso para administrar propiedades.",
  );
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, propertyInputSchema);
  if ("response" in body) return body.response;

  try {
    await updateOrganizationProperty(
      access.organizationId,
      propertyId,
      access.userUid,
      body.data,
    );
    return NextResponse.json({ propertyId });
  } catch (error) {
    if (error instanceof PropertyCodeConflictError) {
      return NextResponse.json(
        { error: "Ya existe una propiedad con ese código en esta organización." },
        { status: 409 },
      );
    }
    if (error instanceof PropertyRecordNotFoundError) {
      return NextResponse.json({ error: "No se encontró la propiedad." }, { status: 404 });
    }

    console.error("Unable to update property in the active organization.", error);
    return NextResponse.json(
      { error: "No se pudo guardar la propiedad. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}
