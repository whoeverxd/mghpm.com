"use client";

import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";

/**
 * Sends Firebase's password email (Spanish template) so the person sets or
 * resets their own password. It doubles as the welcome email for new
 * accounts and links back to /acceder. When the current host is not an
 * authorized Firebase domain (e.g. a LAN address), it is sent without the
 * return link instead of failing.
 */
export async function sendAccessEmail(email: string) {
  const { auth } = getFirebaseClient();
  auth.languageCode = "es";
  try {
    await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/acceder` });
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      ["auth/unauthorized-continue-uri", "auth/invalid-continue-uri"].includes(error.code)
    ) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    throw error;
  }
}
