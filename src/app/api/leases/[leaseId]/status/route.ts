import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getLeaseErrorResponse } from "@/lib/leases/api";
import { changeOrganizationLeaseStatus } from "@/lib/leases/records";
import { leaseStatusActionSchema } from "@/lib/leases/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type LeaseStatusRouteContext = {
  params: Promise<{ leaseId: string }>;
};

/** Activate, terminate, expire or cancel a lease. */
export async function POST(request: Request, { params }: LeaseStatusRouteContext) {
  const { leaseId } = await params;
  if (!recordIdSchema.safeParse(leaseId).success) {
    return NextResponse.json({ error: "El contrato seleccionado no es válido." }, { status: 400 });
  }

  const access = await requireStaffPermission("leases", "update", "Tu rol no tiene permiso para administrar contratos.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, leaseStatusActionSchema);
  if ("response" in body) return body.response;

  try {
    await changeOrganizationLeaseStatus(
      access.organizationId,
      leaseId,
      access.userUid,
      access.timeZone,
      body.data,
    );
    return NextResponse.json({ leaseId });
  } catch (error) {
    return getLeaseErrorResponse(error, "Unable to change lease status in the active organization.");
  }
}
