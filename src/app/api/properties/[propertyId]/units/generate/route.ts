import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { recordIdSchema } from "@/lib/properties/schema";
import { getUnitErrorResponse } from "@/lib/properties/unit-api";
import { unitGenerationSchema } from "@/lib/properties/unit-generation";
import { createPropertyUnits } from "@/lib/properties/units";

export const dynamic = "force-dynamic";

type GenerateUnitsRouteContext = {
  params: Promise<{ propertyId: string }>;
};

/** Creates a numbered batch of units in an existing property. */
export async function POST(request: Request, { params }: GenerateUnitsRouteContext) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: "La propiedad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("properties", "create", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, unitGenerationSchema);
  if ("response" in body) return body.response;

  try {
    const createdCount = await createPropertyUnits(
      access.organizationId,
      propertyId,
      access.userUid,
      body.data,
    );
    return NextResponse.json({ createdCount }, { status: 201 });
  } catch (error) {
    return getUnitErrorResponse(error, "Unable to generate units in the active organization.");
  }
}
