import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getUnitErrorResponse } from "@/lib/properties/unit-api";
import { recordIdSchema } from "@/lib/properties/schema";
import { unitArchiveInputSchema } from "@/lib/properties/unit-schema";
import { setPropertyUnitArchived } from "@/lib/properties/units";

export const dynamic = "force-dynamic";

type UnitArchiveRouteContext = {
  params: Promise<{ propertyId: string; unitId: string }>;
};

export async function POST(request: Request, { params }: UnitArchiveRouteContext) {
  const { propertyId, unitId } = await params;
  if (
    !recordIdSchema.safeParse(propertyId).success ||
    !recordIdSchema.safeParse(unitId).success
  ) {
    return NextResponse.json({ error: "La unidad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("properties", "archive", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, unitArchiveInputSchema);
  if ("response" in body) return body.response;

  try {
    await setPropertyUnitArchived(
      access.organizationId,
      propertyId,
      unitId,
      access.userUid,
      body.data.archived,
    );
    return NextResponse.json({ unitId, archived: body.data.archived });
  } catch (error) {
    return getUnitErrorResponse(error, "Unable to archive unit in the active organization.");
  }
}
