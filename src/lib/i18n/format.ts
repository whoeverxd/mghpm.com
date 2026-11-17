import { intlLocales, type Locale } from "./locales.ts";

export type Formatter = ReturnType<typeof createFormatter>;

/**
 * Dates, money and numbers in the active language. Calendar dates
 * ("YYYY-MM-DD") are shown as written; instants use the given time zone
 * (the organization's) when there is one.
 */
export function createFormatter(locale: Locale) {
  const tag = intlLocales[locale];
  return {
    /** "2026-11-15" → "15 nov 2026" / "Nov 15, 2026"; empty → "—". */
    date(value: string | null | undefined) {
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
      return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${value}T00:00:00Z`),
      );
    },
    dateTime(value: Date | null | undefined, timeZone?: string) {
      if (!value) return "—";
      return new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short", timeZone }).format(value);
    },
    /** Minor units (cents) with the currency code: "USD 1,250.00". */
    money(minor: number, currency: string) {
      return new Intl.NumberFormat(tag, { style: "currency", currency, currencyDisplay: "code" }).format(minor / 100);
    },
    number(value: number) {
      return new Intl.NumberFormat(tag).format(value);
    },
  };
}
