import assert from "node:assert/strict";
import { test } from "node:test";
import { countNights, getTodayDate, quoteStay } from "./quote.ts";

const listing = {
  currency: "USD" as const,
  nightlyRateMinor: 15000,
  cleaningFeeMinor: 8000,
  minNights: 2,
  maxNights: 10,
  maxGuests: 4,
  petsAllowed: false,
};
const today = "2026-11-09";
const request = { checkIn: "2026-12-01", checkOut: "2026-12-04", guests: 2, pets: 0 };

test("counts nights between valid dates", () => {
  assert.equal(countNights("2026-12-01", "2026-12-04"), 3);
  assert.equal(countNights("2026-12-04", "2026-12-01"), null);
  assert.equal(countNights("2026-02-30", "2026-03-02"), null);
  assert.equal(countNights("2026-01-01", "2027-01-02"), null);
});

test("quotes nights × rate + cleaning", () => {
  assert.deepEqual(quoteStay(listing, request, today), {
    ok: true,
    quote: {
      currency: "USD",
      nightlyRateMinor: 15000,
      nights: 3,
      subtotalMinor: 45000,
      cleaningFeeMinor: 8000,
      totalMinor: 53000,
    },
  });
});

test("reports why a stay cannot be quoted", () => {
  const issue = (overrides: Partial<typeof request>) => {
    const result = quoteStay(listing, { ...request, ...overrides }, today);
    return result.ok ? null : result.issue;
  };
  assert.equal(issue({ checkOut: "2026-11-30" }), "invalid_dates");
  assert.equal(issue({ checkIn: "2026-11-01", checkOut: "2026-11-05" }), "past_dates");
  assert.equal(issue({ guests: 5 }), "too_many_guests");
  assert.equal(issue({ pets: 1 }), "pets_not_allowed");
  assert.equal(issue({ checkOut: "2026-12-02" }), "min_nights");
  assert.equal(issue({ checkOut: "2026-12-20" }), "max_nights");
});

test("today is the US Eastern calendar date", () => {
  assert.equal(getTodayDate(new Date("2026-11-09T23:30:00Z")), "2026-11-09");
  assert.equal(getTodayDate(new Date("2026-11-10T02:00:00Z")), "2026-11-09");
});
