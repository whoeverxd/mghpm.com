import assert from "node:assert/strict";
import { test } from "node:test";
import type { PublicListing } from "./listing.ts";
import { parseStaySearch, searchStays } from "./search.ts";

function listing(overrides: Partial<PublicListing>): PublicListing {
  return {
    propertyId: "p1",
    unitId: "u1",
    propertyName: "Torre Norte",
    unitLabel: "101",
    type: "apartment_condo",
    city: "Santo Domingo",
    state: "DN",
    country: "DO",
    description: "",
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    maxGuests: 4,
    minNights: 2,
    maxNights: 30,
    nightlyRateMinor: 15000,
    cleaningFeeMinor: 5000,
    currency: "USD",
    petsAllowed: false,
    amenities: ["pool"],
    utilities: { electricity: true, water: true, internet: true },
    coverImageId: null,
    ...overrides,
  };
}

const a = listing({ unitId: "a", unitLabel: "101", nightlyRateMinor: 20000 });
const b = listing({ unitId: "b", unitLabel: "102", nightlyRateMinor: 10000, maxGuests: 2, minNights: 5 });
const c = listing({
  unitId: "c",
  propertyName: "Casa Playa",
  city: "Punta Cana",
  type: "residential",
  bedrooms: 4,
  petsAllowed: true,
  amenities: ["pool", "pet_friendly"],
});
const all = [a, b, c];
const today = "2026-11-09";
const ids = (items: { listing: PublicListing }[]) => items.map((item) => item.listing.unitId);

test("invalid parameters fall back to defaults", () => {
  const search = parseStaySearch({
    guests: "abc",
    maxPrice: "",
    type: "castle",
    sort: "random",
    amenities: "pool",
    checkIn: "mañana",
  });
  assert.equal(search.guests, 1);
  assert.equal(search.maxPrice, null);
  assert.equal(search.type, null);
  assert.equal(search.sort, "recommended");
  assert.deepEqual(search.amenities, ["pool"]);
  assert.equal(search.checkIn, "");
});

test("lists areas and sorts by name by default", () => {
  const result = searchStays(all, parseStaySearch({}), today);
  assert.deepEqual(result.areas, ["Punta Cana", "Santo Domingo"]);
  assert.deepEqual(ids(result.available), ["c", "a", "b"]);
  assert.equal(result.available[0].quote, null);
});

test("filters exclude non-matching units", () => {
  const run = (raw: Record<string, string | string[]>) => ids(searchStays(all, parseStaySearch(raw), today).available);
  assert.deepEqual(run({ area: "punta cana" }), ["c"]);
  assert.deepEqual(run({ guests: "3" }), ["c", "a"]);
  assert.deepEqual(run({ pets: "1" }), ["c"]);
  assert.deepEqual(run({ maxPrice: "120" }), ["b"]);
  assert.deepEqual(run({ type: "residential" }), ["c"]);
  assert.deepEqual(run({ bedrooms: "3" }), ["c"]);
  assert.deepEqual(run({ amenities: ["pool", "pet_friendly"] }), ["c"]);
});

test("dates quote available units and move short stays to unavailable", () => {
  const result = searchStays(all, parseStaySearch({ checkIn: "2026-12-01", checkOut: "2026-12-04" }), today);
  assert.equal(result.nights, 3);
  assert.deepEqual(ids(result.available), ["c", "a"]);
  assert.equal(result.available[1].quote?.totalMinor, 65000);
  assert.deepEqual(result.unavailable.map((item) => [item.listing.unitId, item.issue]), [["b", "min_nights"]]);
});

test("invalid or past dates are reported and ignored", () => {
  const invalid = searchStays(all, parseStaySearch({ checkIn: "2026-12-04", checkOut: "2026-12-01" }), today);
  assert.equal(invalid.datesIssue, "invalid_dates");
  assert.equal(invalid.available.length, 3);
  const past = searchStays(all, parseStaySearch({ checkIn: "2026-10-01", checkOut: "2026-10-04" }), today);
  assert.equal(past.datesIssue, "past_dates");
});

test("sorts by price", () => {
  const run = (sort: string) => ids(searchStays(all, parseStaySearch({ sort }), today).available);
  assert.deepEqual(run("price_asc"), ["b", "c", "a"]);
  assert.deepEqual(run("price_desc"), ["a", "c", "b"]);
});

test("an invalid amenity does not clear the valid ones", () => {
  assert.deepEqual(parseStaySearch({ amenities: ["pool", "BAD!"] }).amenities, ["pool"]);
});

test("saved=1 keeps only the favorite stays", () => {
  assert.equal(parseStaySearch({}).saved, false);
  assert.equal(parseStaySearch({ saved: "yes" }).saved, false);
  const search = parseStaySearch({ saved: "1" });
  assert.equal(search.saved, true);
  assert.deepEqual(ids(searchStays(all, search, today, new Set(["p1/c"])).available), ["c"]);
  assert.deepEqual(ids(searchStays(all, search, today).available), []);
  assert.equal(searchStays(all, search, today).areas.length, 2);
});
