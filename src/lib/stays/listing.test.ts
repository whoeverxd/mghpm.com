import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicStayImageUrl, toPublicListing } from "./listing.ts";

const property = {
  name: "Torre Norte",
  code: "TN-1",
  type: "apartment_condo" as const,
  address: "Av. Anacaona 10",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO" as const,
  unitCount: 1,
  occupiedUnitCount: 0,
  status: "active" as const,
  occupancyStatus: "vacant" as const,
  archived: false,
  searchName: "torre norte",
  filterKeys: [],
  searchKeys: [],
  rentalCategory: "short_term" as const,
  description: "Vista al mar.",
  location: { lat: 18.45, lng: -69.95, placeId: "abc", source: "places" as const },
  financialReference: {
    currency: "USD" as const,
    startingRentMinor: 120000,
    securityDepositMinor: 50000,
    cleaningFeeMinor: 8000,
  },
  utilities: {
    electricityIncluded: true,
    electricityMeterRequired: true,
    waterIncluded: true,
    internetIncluded: false,
    electricityMeterNumber: "M-123",
    initialMeterReading: 100,
    electricityRatePerKwh: 0.2,
  },
  amenities: ["pool" as const, "pet_friendly" as const],
  coverImageId: "img-1",
};
const unit = {
  label: "101",
  labelKey: "101",
  floor: "1",
  bedrooms: 2,
  bathrooms: 1.5,
  status: "available" as const,
  marketRentMinor: 120050,
  marketRentCurrency: "USD" as const,
  archived: false,
  activeLeaseId: null,
  stay: { published: true, nightlyRateMinor: 15000, maxGuests: 4, beds: 3, minNights: 2, maxNights: 28 },
};

test("maps a publishable unit to public fields only", () => {
  const listing = toPublicListing("prop-1", property, "unit-1", unit);
  assert.deepEqual(listing, {
    propertyId: "prop-1",
    unitId: "unit-1",
    propertyName: "Torre Norte",
    unitLabel: "101",
    type: "apartment_condo",
    city: "Santo Domingo",
    state: "Distrito Nacional",
    country: "DO",
    description: "Vista al mar.",
    bedrooms: 2,
    beds: 3,
    bathrooms: 1.5,
    maxGuests: 4,
    minNights: 2,
    maxNights: 28,
    nightlyRateMinor: 15000,
    cleaningFeeMinor: 8000,
    currency: "USD",
    petsAllowed: true,
    amenities: ["pool", "pet_friendly"],
    utilities: { electricity: true, water: true, internet: false },
    coverImageId: "img-1",
  });
  const serialized = JSON.stringify(listing);
  for (const secret of ["Anacaona", "TN-1", "M-123", "120050", "50000", "18.45"]) {
    assert.equal(serialized.includes(secret), false, `leaked ${secret}`);
  }
});

test("returns null for a hidden unit", () => {
  assert.equal(toPublicListing("p", property, "u", { ...unit, archived: true }), null);
});

test("builds the public image URL", () => {
  assert.equal(
    getPublicStayImageUrl("p 1", "i/2", "thumbnail"),
    "/api/public/stays/images/p%201/i%2F2?variant=thumbnail",
  );
});
