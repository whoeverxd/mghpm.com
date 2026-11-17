import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { recordIdSchema } from "@/lib/properties/schema";
import { setStayInquiryStatus, StayInquiryNotFoundError } from "@/lib/stays/inquiries";
import { stayInquiryStatusInputSchema } from "@/lib/stays/inquiry-schema";

export const dynamic = "force-dynamic";

type InquiryRouteContext = {
  params: Promise<{ inquiryId: string }>;
};

export async function PATCH(request: Request, { params }: InquiryRouteContext) {
  const { inquiryId } = await params;
  if (!recordIdSchema.safeParse(inquiryId).success) {
    return NextResponse.json({ error: "La solicitud seleccionada no es válida." }, { status: 400 });
  }

  const access = await requireStaffPermission("stay_inquiries", "update", "Tu rol no tiene permiso para atender solicitudes.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const body = await readJsonRequestBody(request, stayInquiryStatusInputSchema);
  if ("response" in body) return body.response;

  try {
    await setStayInquiryStatus(access.organizationId, inquiryId, body.data.status, access.userUid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StayInquiryNotFoundError) {
      return NextResponse.json({ error: "No se encontró la solicitud." }, { status: 404 });
    }
    console.error("Unable to update stay inquiry.", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}
