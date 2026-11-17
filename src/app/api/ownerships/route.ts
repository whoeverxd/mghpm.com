import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getOwnershipErrorResponse } from "@/lib/ownerships/api";
import { createOwnership } from "@/lib/ownerships/records";
import { ownershipInputSchema } from "@/lib/ownerships/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireStaffPermission("ownerships", "create", "Tu rol no tiene permiso para crear titularidades.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, ownershipInputSchema);
  if ("response" in body) return body.response;

  try {
    const ownershipId = await createOwnership(access.organizationId, access.userUid, body.data);
    return NextResponse.json({ ownershipId }, { status: 201 });
  } catch (error) {
    return getOwnershipErrorResponse(error, "Unable to create ownership in the active organization.");
  }
}
