import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getPersonErrorResponse } from "@/lib/people/api";
import { createOrganizationPerson } from "@/lib/people/records";
import { personInputSchema } from "@/lib/people/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireStaffPermission("people", "create", "Tu rol no tiene permiso para administrar personas.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, personInputSchema);
  if ("response" in body) return body.response;

  try {
    const personId = await createOrganizationPerson(
      access.organizationId,
      access.userUid,
      body.data,
    );
    return NextResponse.json({ personId }, { status: 201 });
  } catch (error) {
    return getPersonErrorResponse(error, "Unable to create person in the active organization.");
  }
}
