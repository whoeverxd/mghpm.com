import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getMemberErrorResponse } from "@/lib/members/api";
import { createOrganizationMember } from "@/lib/members/records";
import { memberCreateInputSchema } from "@/lib/members/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireStaffPermission("members", "manage", "Tu rol no tiene permiso para administrar usuarios.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, memberCreateInputSchema);
  if ("response" in body) return body.response;

  try {
    const member = await createOrganizationMember(
      access.organizationId,
      { uid: access.userUid, role: access.role },
      body.data,
    );
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return getMemberErrorResponse(error, "Unable to create member in the active organization.");
  }
}
