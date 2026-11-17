import assert from "node:assert/strict";
import { test } from "node:test";
import { getStayConfigurationIssue, getStayVisibilityIssue } from "./publishable.ts";

const property = {
  status: "active" as const,
  archived: false,
  rentalCategory: "short_term" as const,
  financialReference: {
    currency: "USD" as const,
    startingRentMinor: null,
    securityDepositMinor: null,
    cleaningFeeMinor: 8000,
  },
};
const unit = {
  archived: false,
  status: "available" as const,
  activeLeaseId: null,
  stay: { published: true, nightlyRateMinor: 15000, maxGuests: 4, beds: 2, minNights: 2, maxNights: 28 },
};

test("a complete published unit is visible", () => {
  assert.equal(getStayVisibilityIssue(property, unit), null);
});

test("long-term properties cannot configure stays", () => {
  assert.equal(getStayConfigurationIssue({ ...property, rentalCategory: "long_term" }), "not_short_term");
  assert.equal(getStayConfigurationIssue({ ...property, rentalCategory: "both" }), null);
});

test("properties without a currency cannot configure stays", () => {
  assert.equal(getStayConfigurationIssue({ ...property, financialReference: undefined }), "no_currency");
});

test("each blocking condition is reported", () => {
  assert.equal(getStayVisibilityIssue({ ...property, status: "draft" }, unit), "property_inactive");
  assert.equal(getStayVisibilityIssue({ ...property, archived: true }, unit), "property_archived");
  assert.equal(getStayVisibilityIssue(property, { ...unit, archived: true }), "unit_archived");
  assert.equal(getStayVisibilityIssue(property, { ...unit, activeLeaseId: "lease-1" }), "unit_leased");
  assert.equal(getStayVisibilityIssue(property, { ...unit, status: "maintenance" }), "unit_unavailable");
  assert.equal(getStayVisibilityIssue(property, { ...unit, stay: undefined }), "not_published");
  assert.equal(
    getStayVisibilityIssue(property, { ...unit, stay: { ...unit.stay, published: false } }),
    "not_published",
  );
  assert.equal(
    getStayVisibilityIssue(property, { ...unit, stay: { ...unit.stay, nightlyRateMinor: null } }),
    "no_rate",
  );
});
