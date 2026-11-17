import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { membershipLanes } from "@/lib/access/membership";
import { lanes } from "@/lib/access/permissions";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { isValidSessionRequest } from "@/lib/auth/request-security";
import {
  listUserOrganizations,
  ORGANIZATION_COOKIE_NAME,
} from "@/lib/auth/organization";
import { getSessionUser } from "@/lib/auth/session";
import { auditEventFields } from "@/lib/audit/area";

export const dynamic = "force-dynamic";

const organizationRequestSchema = z.object({
  organizationId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  lane: z.enum(lanes).optional(),
});

export async function POST(request: Request) {
  if (!isValidSessionRequest(request)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Se esperaba contenido JSON." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
  }

  const parsedBody = organizationRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "La organización seleccionada no es válida." }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const memberships = await listUserOrganizations(user.uid);
  const membership = memberships.find(
    (item) => item.organizationId === parsedBody.data.organizationId,
  );
  const grantedLanes = membership ? membershipLanes(membership.membership) : [];
  const lane = parsedBody.data.lane ?? grantedLanes[0] ?? null;
  if (!membership || !lane || !grantedLanes.includes(lane)) {
    return NextResponse.json(
      { error: "No tienes acceso a la organización seleccionada." },
      { status: 403 },
    );
  }

  await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(membership.organizationId)
    .collection("auditEvents")
    .add(auditEventFields({
      organizationId: membership.organizationId,
      action: "workspace.switched",
      actorUid: user.uid,
      targetId: membership.organizationId,
      lane,
      createdAt: FieldValue.serverTimestamp(),
    }));

  const response = NextResponse.json({ organizationId: membership.organizationId });
  response.cookies.set(ORGANIZATION_COOKIE_NAME, membership.organizationId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
