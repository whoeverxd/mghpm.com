import assert from "node:assert/strict";
import { test } from "node:test";
import { availablePct, canTransition, isValidPct, roundPct } from "./rules.ts";

test("transitions follow the review flow", () => {
  assert.equal(canTransition("not_started", "in_review"), true);
  assert.equal(canTransition("not_started", "verified"), false);
  assert.equal(canTransition("in_review", "verified"), true);
  assert.equal(canTransition("in_review", "rejected"), true);
  assert.equal(canTransition("rejected", "in_review"), true);
  assert.equal(canTransition("verified", "in_review"), true);
  assert.equal(canTransition("verified", "rejected"), false);
});

test("percentages", () => {
  assert.equal(roundPct(33.333), 33.33);
  assert.equal(isValidPct(0), false);
  assert.equal(isValidPct(100), true);
  assert.equal(isValidPct(100.01), false);
  assert.equal(availablePct([75, 20]), 5);
  assert.equal(availablePct([33.33, 33.33, 33.34]), 0);
});
