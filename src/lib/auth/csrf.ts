import { timingSafeEqual } from "node:crypto";

export const CSRF_COOKIE_NAME = "mghpm_csrf";

export function hasValidCsrfToken(cookieToken: string | undefined, headerToken: string | null) {
  if (
    !cookieToken ||
    !headerToken ||
    !/^[A-Za-z0-9_-]{43}$/.test(cookieToken) ||
    !/^[A-Za-z0-9_-]{43}$/.test(headerToken)
  ) {
    return false;
  }

  return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}
