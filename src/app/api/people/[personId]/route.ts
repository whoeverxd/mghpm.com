import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getPersonErrorResponse } from "@/lib/people/api";
import { updateOrganizationPerson } from "@/lib/people/records";
import { personInputSchema } from "@/lib/people/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type PersonRouteContext = {
  params: Promise<{ personId: string }>;
};

export async function PATCH(request: Request, { params }: PersonRouteContext) {
  const { personId } = await params;
  if (!recordIdSchema.safeParse(personId).success) {
    return NextResponse.json({ error: "El registro seleccionado no es válido." }, { status: 400 });
  }

  const access = await requireStaffPermission("people", "update", "Tu rol no tiene permiso para administrar personas.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, personInputSchema);
  if ("response" in body) return body.response;

  try {
    await updateOrganizationPerson(access.organizationId, personId, access.userUid, body.data);
    return NextResponse.json({ personId });
  } catch (error) {
    return getPersonErrorResponse(error, "Unable to update person in the active organization.");
  }
}
