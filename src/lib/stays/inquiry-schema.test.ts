import assert from "node:assert/strict";
import { test } from "node:test";
import { stayInquiryInputSchema } from "./inquiry-schema.ts";

const valid = {
  propertyId: "prop-1",
  unitId: "unit-1",
  checkIn: "2026-12-01",
  checkOut: "2026-12-04",
  guests: 2,
  pets: 0,
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: "+1 (809) 555-0101",
  message: "",
  consent: true,
  locale: "es",
};

test("accepts a complete inquiry", () => {
  assert.equal(stayInquiryInputSchema.safeParse(valid).success, true);
});

test("rejects missing consent, bad email, bad phone and long messages", () => {
  for (const override of [
    { consent: false },
    { email: "not-an-email" },
    { phone: "call me" },
    { message: "x".repeat(1001) },
    { locale: "fr" },
    { guests: 0 },
  ]) {
    assert.equal(stayInquiryInputSchema.safeParse({ ...valid, ...override }).success, false, JSON.stringify(override));
  }
});
