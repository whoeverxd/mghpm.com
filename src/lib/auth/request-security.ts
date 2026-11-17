import "server-only";

import {
  CSRF_COOKIE_NAME,
  hasValidCsrfToken,
} from "@/lib/auth/csrf";

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  if (process.env.NODE_ENV === "production") {
    const appOrigin = process.env.APP_ORIGIN;
    if (!appOrigin) return false;

    try {
      return origin === new URL(appOrigin).origin;
    } catch (error) {
      console.error("APP_ORIGIN must be a valid absolute URL.", error);
      return false;
    }
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    new URL(request.url).protocol.replace(":", "");

  return Boolean(host && origin === `${protocol}://${host}`);
}

export function isValidSessionRequest(request: Request) {
  const cookieToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.slice(CSRF_COOKIE_NAME.length + 1);

  return (
    isSameOriginRequest(request) &&
    hasValidCsrfToken(cookieToken, request.headers.get("x-csrf-token"))
  );
}
