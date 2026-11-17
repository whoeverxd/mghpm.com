import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_STAY_FAVORITES,
  parseStayFavorites,
  serializeStayFavorites,
  stayKey,
  toggleStayFavorite,
} from "./favorites.ts";

test("parses a valid cookie and drops bad or repeated entries", () => {
  const raw = serializeStayFavorites(["p1/u1", "p2/u2"]);
  assert.deepEqual(parseStayFavorites(raw), ["p1/u1", "p2/u2"]);
  assert.deepEqual(parseStayFavorites("p1%2Fu1%2C..%2Fx%2Cp1%2Fu1%2Cjunk"), ["p1/u1"]);
  assert.deepEqual(parseStayFavorites(undefined), []);
  assert.deepEqual(parseStayFavorites("%E0%A4%A"), []);
});

test("caps the number of favorites", () => {
  const many = Array.from({ length: MAX_STAY_FAVORITES + 5 }, (_, index) => `p${index}/u`);
  assert.equal(parseStayFavorites(serializeStayFavorites(many)).length, MAX_STAY_FAVORITES);
});

test("toggles a favorite", () => {
  const key = stayKey("p1", "u1");
  assert.deepEqual(toggleStayFavorite([], key), ["p1/u1"]);
  assert.deepEqual(toggleStayFavorite(["p1/u1", "p2/u2"], key), ["p2/u2"]);
});
