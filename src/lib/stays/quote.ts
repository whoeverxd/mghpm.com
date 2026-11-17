import type { UnitCurrency } from "@/lib/properties/unit-schema";
import type { PublicListing } from "./listing.ts";

export const STAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const MAX_QUOTE_NIGHTS = 365;

export type StayRequest = { checkIn: string; checkOut: string; guests: number; pets: number };
export type QuoteIssue =
  | "invalid_dates"
  | "past_dates"
  | "too_many_guests"
  | "pets_not_allowed"
  | "min_nights"
  | "max_nights";
export type StayQuote = {
  currency: UnitCurrency;
  nightlyRateMinor: number;
  nights: number;
  subtotalMinor: number;
  cleaningFeeMinor: number;
  totalMinor: number;
};
export type QuoteResult = { ok: true; quote: StayQuote } | { ok: false; issue: QuoteIssue };

type QuoteListing = Pick<
  PublicListing,
  "currency" | "nightlyRateMinor" | "cleaningFeeMinor" | "minNights" | "maxNights" | "maxGuests" | "petsAllowed"
>;

function parseStayDate(value: string) {
  if (!STAY_DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time;
}

/**
 * Calendar date in the westernmost market served (US Eastern), so a same-day
 * check-in in Florida or the Dominican Republic is never treated as past.
 */
export function getTodayDate(now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

/** Nights between two YYYY-MM-DD dates, or null when the range is invalid. */
export function countNights(checkIn: string, checkOut: string) {
  const start = parseStayDate(checkIn);
  const end = parseStayDate(checkOut);
  if (start === null || end === null || end <= start) return null;
  const nights = Math.round((end - start) / DAY_MS);
  return nights > MAX_QUOTE_NIGHTS ? null : nights;
}

/** Server-side quote: nights × nightly rate + cleaning fee. Taxes are confirmed at booking. */
export function quoteStay(listing: QuoteListing, request: StayRequest, today: string): QuoteResult {
  const nights = countNights(request.checkIn, request.checkOut);
  if (nights === null) return { ok: false, issue: "invalid_dates" };
  if (request.checkIn < today) return { ok: false, issue: "past_dates" };
  if (request.guests > listing.maxGuests) return { ok: false, issue: "too_many_guests" };
  if (request.pets > 0 && !listing.petsAllowed) return { ok: false, issue: "pets_not_allowed" };
  if (nights < listing.minNights) return { ok: false, issue: "min_nights" };
  if (nights > listing.maxNights) return { ok: false, issue: "max_nights" };

  const subtotalMinor = nights * listing.nightlyRateMinor;
  return {
    ok: true,
    quote: {
      currency: listing.currency,
      nightlyRateMinor: listing.nightlyRateMinor,
      nights,
      subtotalMinor,
      cleaningFeeMinor: listing.cleaningFeeMinor,
      totalMinor: subtotalMinor + listing.cleaningFeeMinor,
    },
  };
}
