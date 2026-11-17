import "server-only";

import { cookies, headers } from "next/headers";
import { getDictionary } from "./dictionaries";
import { createFormatter } from "./format";
import { LOCALE_COOKIE, pickLocale, type Locale } from "./locales";

/** Language of the current request: saved preference → browser → Spanish. */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return pickLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get("accept-language"));
}

/** Texts and formatters for server components and API routes. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale), format: createFormatter(locale) };
}
