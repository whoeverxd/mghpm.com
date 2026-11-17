import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonRequestBody } from "@/lib/api/json-body";
import { getSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, locales } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

const localeInputSchema = z.object({ locale: z.enum(locales) });

/**
 * Saves the language of the private area: always in the cookie, and in
 * `users/{uid}` when signed in, so it follows the user to other devices.
 */
export async function POST(request: Request) {
  const body = await readJsonRequestBody(request, localeInputSchema);
  if ("response" in body) return body.response;
  const { locale } = body.data;

  const user = await getSessionUser();
  if (user) {
    try {
      await getFirebaseAdminFirestore()
        .collection("users")
        .doc(user.uid)
        .set({ locale, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch (error) {
      // The cookie still applies the choice on this device.
      console.error("Unable to save the language preference.", { uid: user.uid, error });
    }
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
