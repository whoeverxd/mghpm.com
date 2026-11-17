import "server-only";

import { cookies } from "next/headers";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "mghpm_session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

function isInvalidSessionError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const code = error.code;
  return (
    typeof code === "string" &&
    [
      "auth/argument-error",
      "auth/id-token-expired",
      "auth/id-token-revoked",
      "auth/invalid-session-cookie",
      "auth/session-cookie-expired",
      "auth/session-cookie-revoked",
    ].includes(code)
  );
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
    };
  } catch (error) {
    if (isInvalidSessionError(error)) return null;
    console.error("Unable to verify the MGHPM session cookie.", error);
    throw new Error("Unable to verify the current session.", { cause: error });
  }
}
