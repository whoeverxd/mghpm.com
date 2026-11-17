import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getMemberErrorResponse } from "@/lib/members/api";
import { updateOrganizationMember } from "@/lib/members/records";
import { memberUpdateInputSchema } from "@/lib/members/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type MemberRouteContext = {
  params: Promise<{ uid: string }>;
};

export async function PATCH(request: Request, { params }: MemberRouteContext) {
  const { uid } = await params;
  if (!recordIdSchema.safeParse(uid).success) {
    return NextResponse.json({ error: "El usuario seleccionado no es válido." }, { status: 400 });
  }

  const access = await requireStaffPermission("members", "manage", "Tu rol no tiene permiso para administrar usuarios.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, memberUpdateInputSchema);
  if ("response" in body) return body.response;

  try {
    await updateOrganizationMember(
      access.organizationId,
      { uid: access.userUid, role: access.role },
      uid,
      body.data,
    );
    return NextResponse.json({ uid });
  } catch (error) {
    return getMemberErrorResponse(error, "Unable to update member in the active organization.");
  }
}
