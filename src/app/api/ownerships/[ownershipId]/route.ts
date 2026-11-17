import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getOwnershipErrorResponse } from "@/lib/ownerships/api";
import { updateOwnership } from "@/lib/ownerships/records";
import { ownershipUpdateSchema } from "@/lib/ownerships/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type OwnershipRouteContext = {
  params: Promise<{ ownershipId: string }>;
};

export async function PATCH(request: Request, { params }: OwnershipRouteContext) {
  const { ownershipId } = await params;
  if (!recordIdSchema.safeParse(ownershipId).success) {
    return NextResponse.json({ error: "La titularidad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("ownerships", "update", "Tu rol no tiene permiso para editar titularidades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, ownershipUpdateSchema);
  if ("response" in body) return body.response;

  try {
    await updateOwnership(access.organizationId, access.userUid, ownershipId, body.data);
    return NextResponse.json({ ownershipId });
  } catch (error) {
    return getOwnershipErrorResponse(error, "Unable to update ownership in the active organization.");
  }
}
