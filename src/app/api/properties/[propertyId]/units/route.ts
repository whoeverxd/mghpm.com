import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getUnitErrorResponse } from "@/lib/properties/unit-api";
import { recordIdSchema } from "@/lib/properties/schema";
import { unitInputSchema } from "@/lib/properties/unit-schema";
import { getOrganizationProperty } from "@/lib/properties/records";
import { createPropertyUnit, listPropertyUnits } from "@/lib/properties/units";

export const dynamic = "force-dynamic";

type UnitsRouteContext = {
  params: Promise<{ propertyId: string }>;
};

/** Active units of a property, for pickers such as the tenant link. */
export async function GET(_request: Request, { params }: UnitsRouteContext) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: "La propiedad seleccionada no es válida." }, { status: 400 });
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
    const property = await getOrganizationProperty(access.organizationId, propertyId);
    if (!property) {
      return NextResponse.json({ error: "No se encontró la propiedad." }, { status: 404 });
    }

    const units = await listPropertyUnits(access.organizationId, propertyId);
    return NextResponse.json({
      units: units
        .filter((unit) => !unit.archived)
        .map((unit) => ({ id: unit.id, label: unit.label, status: unit.status })),
    });
  } catch (error) {
    console.error("Unable to list units in the active organization.", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las unidades. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: UnitsRouteContext) {
  const { propertyId } = await params;
  if (!recordIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: "La propiedad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("properties", "create", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, unitInputSchema);
  if ("response" in body) return body.response;

  try {
    const unitId = await createPropertyUnit(
      access.organizationId,
      propertyId,
      access.userUid,
      body.data,
    );
    return NextResponse.json({ unitId }, { status: 201 });
  } catch (error) {
    return getUnitErrorResponse(error, "Unable to create unit in the active organization.");
  }
}
