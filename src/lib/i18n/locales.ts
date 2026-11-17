export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "es";
/** Language preference of the private area (admin, portals, sign-in). */
export const LOCALE_COOKIE = "mghpm_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** BCP 47 tags used for dates, numbers and money. */
export const intlLocales: Record<Locale, string> = { es: "es-DO", en: "en-US" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * The saved preference wins; otherwise the first supported language the
 * browser prefers (by q-value); otherwise Spanish.
 */
export function pickLocale(cookieValue: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().toLowerCase().split(";");
      const q = Number(params.find((param) => param.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { language: tag.split("-")[0] ?? "", q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((left, right) => right.q - left.q || left.index - right.index);
  return preferred.map((entry) => entry.language).find(isLocale) ?? DEFAULT_LOCALE;
}

/** Replaces `{name}` placeholders; unknown ones stay as they are. */
export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
