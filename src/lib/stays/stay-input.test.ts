import assert from "node:assert/strict";
import { test } from "node:test";
import { toUnitStayDocument, unitStayInputSchema } from "../properties/unit-schema.ts";

const valid = {
  published: true,
  nightlyRate: "150.50",
  maxGuests: "4",
  beds: "2",
  minNights: "2",
  maxNights: "28",
};

test("a complete stay converts the rate to minor units", () => {
  const parsed = unitStayInputSchema.parse(valid);
  assert.deepEqual(toUnitStayDocument(parsed), {
    published: true,
    nightlyRateMinor: 15050,
    maxGuests: 4,
    beds: 2,
    minNights: 2,
    maxNights: 28,
  });
});

test("publishing requires a nightly rate", () => {
  assert.equal(unitStayInputSchema.safeParse({ ...valid, nightlyRate: "" }).success, false);
});

test("an unpublished stay may omit the rate", () => {
  const parsed = unitStayInputSchema.parse({ ...valid, published: false, nightlyRate: "" });
  assert.equal(toUnitStayDocument(parsed).nightlyRateMinor, null);
});

test("maximum nights cannot be below the minimum", () => {
  assert.equal(
    unitStayInputSchema.safeParse({ ...valid, minNights: "5", maxNights: "3" }).success,
    false,
  );
});

test("guest capacity stays between 1 and 30", () => {
  assert.equal(unitStayInputSchema.safeParse({ ...valid, maxGuests: "0" }).success, false);
  assert.equal(unitStayInputSchema.safeParse({ ...valid, maxGuests: "31" }).success, false);
});

test("publishing requires a rate above zero", () => {
  assert.equal(unitStayInputSchema.safeParse({ ...valid, nightlyRate: "0" }).success, false);
});
