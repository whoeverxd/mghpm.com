import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import {
  createOrganizationProperty,
  PropertyCodeConflictError,
} from "@/lib/properties/records";
import { propertyInputSchema } from "@/lib/properties/schema";
import { unitGenerationSchema } from "@/lib/properties/unit-generation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireStaffPermission("properties", "create", "Tu rol no tiene permiso para administrar propiedades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const json = await readJsonRequestBody(request, z.unknown());
  if ("response" in json) return json.response;
  const body = json.data;

  const parsedBody = propertyInputSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Revisa los datos ingresados." },
      { status: 400 },
    );
  }

  // Optional first batch of units from the wizard's "Unidades" step.
  const parsedUnits = z
    .object({ unitGeneration: unitGenerationSchema.nullable().default(null) })
    .safeParse(body);
  if (!parsedUnits.success) {
    return NextResponse.json(
      { error: parsedUnits.error.issues[0]?.message ?? "Revisa las unidades a crear." },
      { status: 400 },
    );
  }

  try {
    const propertyId = await createOrganizationProperty(
      access.organizationId,
      access.userUid,
      parsedBody.data,
      parsedUnits.data.unitGeneration,
    );
    return NextResponse.json({ propertyId }, { status: 201 });
  } catch (error) {
    if (error instanceof PropertyCodeConflictError) {
      return NextResponse.json(
        { error: "Ya existe una propiedad con ese código en esta organización." },
        { status: 409 },
      );
    }

    console.error("Unable to create property in the active organization.", error);
    return NextResponse.json(
      { error: "No se pudo guardar la propiedad. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}
