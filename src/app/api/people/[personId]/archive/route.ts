import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getPersonErrorResponse } from "@/lib/people/api";
import { setOrganizationPersonArchived } from "@/lib/people/records";
import { personArchiveInputSchema } from "@/lib/people/schema";
import { recordIdSchema } from "@/lib/properties/schema";

export const dynamic = "force-dynamic";

type PersonArchiveRouteContext = {
  params: Promise<{ personId: string }>;
};

export async function POST(request: Request, { params }: PersonArchiveRouteContext) {
  const { personId } = await params;
  if (!recordIdSchema.safeParse(personId).success) {
    return NextResponse.json({ error: "El registro seleccionado no es válido." }, { status: 400 });
  }

  const access = await requireStaffPermission("people", "archive", "Tu rol no tiene permiso para administrar personas.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, personArchiveInputSchema);
  if ("response" in body) return body.response;

  try {
    await setOrganizationPersonArchived(
      access.organizationId,
      personId,
      access.userUid,
      body.data.archived,
    );
    return NextResponse.json({ personId, archived: body.data.archived });
  } catch (error) {
    return getPersonErrorResponse(error, "Unable to archive person in the active organization.");
  }
}
