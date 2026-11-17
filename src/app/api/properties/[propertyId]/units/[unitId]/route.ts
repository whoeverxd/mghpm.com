import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getUnitErrorResponse } from "@/lib/properties/unit-api";
import { recordIdSchema } from "@/lib/properties/schema";
import { unitInputSchema } from "@/lib/properties/unit-schema";
import { updatePropertyUnit } from "@/lib/properties/units";

export const dynamic = "force-dynamic";

type UnitRouteContext = {
  params: Promise<{ propertyId: string; unitId: string }>;
};

export async function PATCH(request: Request, { params }: UnitRouteContext) {
  const { propertyId, unitId } = await params;
  if (
    !recordIdSchema.safeParse(propertyId).success ||
    !recordIdSchema.safeParse(unitId).success
  ) {
    return NextResponse.json({ error: "La unidad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("properties", "update", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, unitInputSchema);
  if ("response" in body) return body.response;

  try {
    await updatePropertyUnit(
      access.organizationId,
      propertyId,
      unitId,
      access.userUid,
      body.data,
    );
    return NextResponse.json({ unitId });
  } catch (error) {
    return getUnitErrorResponse(error, "Unable to update unit in the active organization.");
  }
}
