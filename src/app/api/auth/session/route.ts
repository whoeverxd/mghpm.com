import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CSRF_COOKIE_NAME,
} from "@/lib/auth/csrf";
import { isValidSessionRequest } from "@/lib/auth/request-security";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/session";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/organization";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

const sessionRequestSchema = z.object({
  idToken: z.string().min(1).max(10_000),
});

function hasErrorCode(error: unknown, codes: string[]) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return typeof error.code === "string" && codes.includes(error.code);
}

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

  const parsedBody = sessionRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "El token de autenticación no es válido." }, { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(parsedBody.data.idToken, true);
    const sessionCookie = await auth.createSessionCookie(parsedBody.data.idToken, {
      expiresIn: SESSION_DURATION_MS,
    });
    const response = new NextResponse(null, { status: 204 });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(CSRF_COOKIE_NAME, "", {
      expires: new Date(0),
      httpOnly: false,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(ORGANIZATION_COOKIE_NAME, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Restore the saved language on this device (see /api/preferences/locale).
    const savedLocale = await getFirebaseAdminFirestore()
      .collection("users")
      .doc(decoded.uid)
      .get()
      .then((snapshot) => snapshot.get("locale"))
      .catch((error: unknown) => {
        console.error("Unable to read the saved language preference.", error);
        return null;
      });
    if (isLocale(savedLocale)) {
      response.cookies.set(LOCALE_COOKIE, savedLocale, {
        httpOnly: true,
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    if (
      hasErrorCode(error, [
        "auth/argument-error",
        "auth/id-token-expired",
        "auth/id-token-revoked",
        "auth/invalid-id-token",
        "auth/user-disabled",
        "auth/user-not-found",
      ])
    ) {
      return NextResponse.json({ error: "No se pudo validar la sesión." }, { status: 401 });
    }

    console.error("Unable to create the MGHPM session.", error);
    return NextResponse.json(
      { error: "No se pudo iniciar la sesión. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isValidSessionRequest(request)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(CSRF_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: false,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(ORGANIZATION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
