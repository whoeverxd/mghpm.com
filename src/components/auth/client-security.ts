"use client";

import { z } from "zod";

export async function requestCsrfToken() {
  const response = await fetch("/api/auth/csrf", { cache: "no-store" });
  if (!response.ok) throw new Error(`CSRF token request failed with ${response.status}`);

  const body: unknown = await response.json();
  const parsed = z.object({ csrfToken: z.string().min(1) }).safeParse(body);
  if (!parsed.success) throw new Error("The server returned an invalid CSRF token.");

  return parsed.data.csrfToken;
}
