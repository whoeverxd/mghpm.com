import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getLeaseErrorResponse } from "@/lib/leases/api";
import { updateOrganizationLease } from "@/lib/leases/records";
import { leaseInputSchema } from "@/lib/leases/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type LeaseRouteContext = {
  params: Promise<{ leaseId: string }>;
};

export async function PATCH(request: Request, { params }: LeaseRouteContext) {
  const { leaseId } = await params;
  if (!recordIdSchema.safeParse(leaseId).success) {
    return NextResponse.json({ error: "El contrato seleccionado no es válido." }, { status: 400 });
  }

  const access = await requireStaffPermission("leases", "update", "Tu rol no tiene permiso para administrar contratos.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, leaseInputSchema);
  if ("response" in body) return body.response;

  try {
    await updateOrganizationLease(access.organizationId, leaseId, access.userUid, body.data);
    return NextResponse.json({ leaseId });
  } catch (error) {
    return getLeaseErrorResponse(error, "Unable to update lease in the active organization.");
  }
}
