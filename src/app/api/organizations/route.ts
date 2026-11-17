import { auditEventFields } from "@/lib/audit/area";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidSessionRequest } from "@/lib/auth/request-security";
import { getSessionUser } from "@/lib/auth/session";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/organization";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const organizationRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  baseCurrency: z.enum(["USD", "DOP"]),
  defaultTimeZone: z.enum([
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Santo_Domingo",
  ]),
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
    return NextResponse.json({ error: "Los datos de la organización no son válidos." }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  if (!process.env.FIREBASE_BOOTSTRAP_ADMIN_UID) {
    console.error("FIREBASE_BOOTSTRAP_ADMIN_UID is required to create the first organization.");
    return NextResponse.json(
      { error: "La configuración inicial de la plataforma está incompleta." },
      { status: 503 },
    );
  }

  if (user.uid !== process.env.FIREBASE_BOOTSTRAP_ADMIN_UID) {
    return NextResponse.json(
      { error: "Tu cuenta no tiene permiso para crear la organización inicial." },
      { status: 403 },
    );
  }

  let organizationId = "";
  try {
    const db = getFirebaseAdminFirestore();
    const organizationReference = db.collection("organizations").doc();
    const membershipReference = organizationReference.collection("memberships").doc(user.uid);
    const auditReference = organizationReference.collection("auditEvents").doc();
    const bootstrapReference = db.collection("_system").doc("bootstrap");
    const createdAt = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const bootstrapSnapshot = await transaction.get(bootstrapReference);
      if (bootstrapSnapshot.exists) {
        throw new Error("The platform bootstrap has already been completed.");
      }

      transaction.create(organizationReference, {
        name: parsedBody.data.name,
        baseCurrency: parsedBody.data.baseCurrency,
        supportedCurrencies: ["USD", "DOP"],
        supportedCountries: ["US", "DO"],
        supportedLanguages: ["es-DO", "en-US"],
        defaultTimeZone: parsedBody.data.defaultTimeZone,
        status: "active",
        createdAt,
        updatedAt: createdAt,
        createdBy: user.uid,
      });
      transaction.create(membershipReference, {
        userUid: user.uid,
        organizationId: organizationReference.id,
        role: "org_owner",
        status: "active",
        createdAt,
        createdBy: user.uid,
      });
      transaction.create(auditReference, auditEventFields({
        organizationId: organizationReference.id,
        action: "organization.bootstrap",
        actorUid: user.uid,
        targetId: organizationReference.id,
        createdAt,
      }));
      transaction.create(bootstrapReference, {
        organizationId: organizationReference.id,
        createdBy: user.uid,
        createdAt,
      });
    });
    organizationId = organizationReference.id;
  } catch (error) {
    if (error instanceof Error && error.message === "The platform bootstrap has already been completed.") {
      return NextResponse.json(
        { error: "La configuración inicial ya fue completada." },
        { status: 409 },
      );
    }

    console.error("Unable to bootstrap the first MGHPM organization.", error);
    return NextResponse.json(
      { error: "No se pudo crear la organización. Inténtalo más tarde." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ organizationId }, { status: 201 });
  response.cookies.set(ORGANIZATION_COOKIE_NAME, organizationId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
