import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getLeaseErrorResponse } from "@/lib/leases/api";
import { createOrganizationLease } from "@/lib/leases/records";
import { leaseInputSchema } from "@/lib/leases/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireStaffPermission("leases", "create", "Tu rol no tiene permiso para administrar contratos.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, leaseInputSchema);
  if ("response" in body) return body.response;

  try {
    const leaseId = await createOrganizationLease(
      access.organizationId,
      access.userUid,
      body.data,
    );
    return NextResponse.json({ leaseId }, { status: 201 });
  } catch (error) {
    return getLeaseErrorResponse(error, "Unable to create lease in the active organization.");
  }
}
