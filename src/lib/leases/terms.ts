/**
 * Calendar-date helpers for lease terms. Lease dates are stored as ISO
 * calendar dates ("YYYY-MM-DD") without a time of day; "today" is resolved
 * in the organization's time zone.
 */

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: string) {
  const match = isoDatePattern.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

function toUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(value: string, days: number) {
  const date = toUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getDaysBetween(from: string, to: string) {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000);
}

/** Default end of a one-year term: start + 1 year − 1 day. */
export function getDefaultEndDate(startDate: string) {
  const date = toUtcDate(startDate);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function getTodayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Whole months covered by an inclusive term, e.g. Nov 1 → Oct 31 = 12. */
export function getTermMonths(startDate: string, endDate: string) {
  const start = toUtcDate(startDate);
  const afterEnd = toUtcDate(addDays(endDate, 1));
  let months =
    (afterEnd.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    afterEnd.getUTCMonth() -
    start.getUTCMonth();
  if (afterEnd.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Prorated rent for the first, partial month: rent × remaining days ÷ days
 * in the month. Returns null when the lease starts on the 1st.
 */
export function getFirstPeriodProrationMinor(rentMinor: number, startDate: string) {
  const start = toUtcDate(startDate);
  const day = start.getUTCDate();
  if (day === 1) return null;
  const daysInMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Math.round((rentMinor * (daysInMonth - day + 1)) / daysInMonth);
}

export function formatLeaseDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtcDate(value));
}

export function formatMinorUnits(minor: number, currency: "USD" | "DOP") {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(minor / 100);
}
