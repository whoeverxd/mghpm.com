"use client";

import { FirebaseError } from "firebase/app";
import {
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { z } from "zod";
import { requestCsrfToken } from "@/components/auth/client-security";
import { useI18n } from "@/components/i18n/i18n-provider";
import { sendAccessEmail } from "@/components/members/send-access-email";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Lane } from "@/lib/access/permissions";
import styles from "./login-form.module.css";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/** Messages are keys of `t.login.errors`. */
const loginSchema = z.object({
  email: z.email({ error: "invalidEmail" }),
  password: z.string().min(1, "missingPassword"),
});

type LoginErrorKey = keyof Dictionary["login"]["errors"];

type FormMessage = {
  kind: "error" | "success";
  text: string;
};

function getLoginError(error: unknown): LoginErrorKey {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/too-many-requests") return "tooManyRequests";
    if (error.code === "auth/network-request-failed") return "network";
    if (error.code.startsWith("auth/")) return "wrongCredentials";
  }
  if (error instanceof Error && error.message.includes("NEXT_PUBLIC_FIREBASE_")) return "missingConfig";
  return "generic";
}

export function LoginForm({ lane }: { lane?: Lane }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const credentials = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!credentials.success) {
      const key = credentials.error.issues[0]?.message;
      setMessage({ kind: "error", text: t.login.errors[(key as LoginErrorKey) ?? "review"] ?? t.login.errors.review });
      return;
    }

    setBusy(true);
    try {
      const { auth } = getFirebaseClient();
      await setPersistence(auth, inMemoryPersistence);
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.data.email.trim(),
        credentials.data.password,
      );
      const idToken = await result.user.getIdToken();
      await signOut(auth);

      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const parsed = z.object({ error: z.string() }).safeParse(result);
        throw new Error(parsed.success ? parsed.data.error : `Session request failed with ${response.status}`);
      }

      router.replace(`/espacios${lane ? `?acceso=${lane}` : ""}`);
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: t.login.errors[getLoginError(error)] });
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    const form = document.querySelector<HTMLFormElement>("#login-form");
    const email = form ? new FormData(form).get("email") : null;
    const parsedEmail = z.email().safeParse(email);
    if (!parsedEmail.success) {
      setMessage({ kind: "error", text: t.login.errors.resetEmail });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await sendAccessEmail(parsedEmail.data);
      setMessage({
        kind: "success",
        text: t.login.resetSent,
      });
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        ["auth/user-not-found", "auth/invalid-email", "auth/user-disabled"].includes(error.code)
      ) {
        setMessage({
          kind: "success",
          text: t.login.resetSent,
        });
      } else {
        setMessage({ kind: "error", text: t.login.errors[getLoginError(error)] });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    // method="post" keeps credentials out of the URL if the form submits before hydration.
    <form id="login-form" className={styles.form} method="post" onSubmit={handleSubmit} noValidate>
      <label htmlFor="email">{t.login.emailLabel}</label>
      <input
        autoComplete="email"
        id="email"
        name="email"
        placeholder={t.login.emailPlaceholder}
        required
        type="email"
      />

      <div className={styles.passwordLabel}>
        <label htmlFor="password">{t.login.passwordLabel}</label>
        <button
          className={styles.reset}
          disabled={busy}
          onClick={handlePasswordReset}
          type="button"
        >
          {t.login.forgot}
        </button>
      </div>
      <input
        autoComplete="current-password"
        id="password"
        name="password"
        placeholder={t.login.passwordPlaceholder}
        required
        type="password"
      />

      {message && (
        <p
          aria-live="polite"
          className={message.kind === "error" ? styles.error : styles.success}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      <button className={styles.submit} disabled={busy} type="submit">
        {busy ? t.login.processing : t.login.submit}
      </button>
    </form>
  );
}
