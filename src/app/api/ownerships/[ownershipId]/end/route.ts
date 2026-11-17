import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getOwnershipErrorResponse } from "@/lib/ownerships/api";
import { endOwnership } from "@/lib/ownerships/records";
import { ownershipEndInputSchema } from "@/lib/ownerships/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type OwnershipEndRouteContext = {
  params: Promise<{ ownershipId: string }>;
};

export async function POST(request: Request, { params }: OwnershipEndRouteContext) {
  const { ownershipId } = await params;
  if (!recordIdSchema.safeParse(ownershipId).success) {
    return NextResponse.json({ error: "La titularidad seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("ownerships", "archive", "Tu rol no tiene permiso para finalizar titularidades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, ownershipEndInputSchema);
  if ("response" in body) return body.response;

  try {
    await endOwnership(access.organizationId, access.userUid, ownershipId, body.data.endDate);
    return NextResponse.json({ ownershipId, active: false });
  } catch (error) {
    return getOwnershipErrorResponse(error, "Unable to end ownership in the active organization.");
  }
}
