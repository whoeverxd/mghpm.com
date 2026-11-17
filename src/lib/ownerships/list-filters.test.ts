import assert from "node:assert/strict";
import { test } from "node:test";
import { ownershipListFilters, parseOwnershipListFilter } from "./list-filters.ts";
import { ownershipStatuses } from "./rules.ts";

test("defaults to active ownerships", () => {
  assert.equal(parseOwnershipListFilter(undefined), "activas");
  assert.equal(parseOwnershipListFilter("nope"), "activas");
  assert.equal(parseOwnershipListFilter(["finalizadas"]), "activas");
  assert.equal(parseOwnershipListFilter("toString"), "activas");
});

test("accepts every filter and covers every status", () => {
  for (const key of Object.keys(ownershipListFilters)) assert.equal(parseOwnershipListFilter(key), key);
  const statuses = Object.values(ownershipListFilters).map((filter) => filter.status).filter(Boolean);
  assert.deepEqual([...statuses].sort(), [...ownershipStatuses].sort());
});
