import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getOwnershipErrorResponse } from "@/lib/ownerships/api";
import { changeOwnershipStatus } from "@/lib/ownerships/records";
import { ownershipStatusInputSchema } from "@/lib/ownerships/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type OwnershipStatusRouteContext = {
  params: Promise<{ ownershipId: string }>;
};

export async function POST(request: Request, { params }: OwnershipStatusRouteContext) {
  const { ownershipId } = await params;
  if (!recordIdSchema.safeParse(ownershipId).success) {
    return NextResponse.json({ error: "La titularidad seleccionada no es válida." }, { status: 400 });
  }

  // The `review` permission for verified/rejected is checked inside the transaction.
  const access = await requireStaffPermission("ownerships", "update", "Tu rol no tiene permiso para cambiar el estado de titularidades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, ownershipStatusInputSchema);
  if ("response" in body) return body.response;

  try {
    await changeOwnershipStatus(
      access.organizationId,
      { uid: access.userUid, role: access.role },
      ownershipId,
      body.data.to,
      body.data.reason,
    );
    return NextResponse.json({ ownershipId, status: body.data.to });
  } catch (error) {
    return getOwnershipErrorResponse(error, "Unable to change ownership status in the active organization.");
  }
}
