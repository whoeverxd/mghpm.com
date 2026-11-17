import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { CSRF_COOKIE_NAME } from "@/lib/auth/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const csrfToken = randomBytes(32).toString("base64url");
  const response = NextResponse.json(
    { csrfToken },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
