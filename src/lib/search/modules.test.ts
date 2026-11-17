import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanSearchText, searchListHref, searchModulesFor, searchPageHref } from "./modules.ts";

test("cleanSearchText keeps 2–80 characters of text", () => {
  assert.equal(cleanSearchText("  torre "), "torre");
  assert.equal(cleanSearchText("t"), "");
  assert.equal(cleanSearchText(" a "), "");
  assert.equal(cleanSearchText(undefined), "");
  assert.equal(cleanSearchText(["torre"]), "");
  assert.equal(cleanSearchText("x".repeat(100)).length, 80);
});

test("staff roles search the modules they can view", () => {
  assert.deepEqual(searchModulesFor("org_owner").map((item) => item.module), ["properties", "people", "leases"]);
  assert.deepEqual(searchModulesFor("operations").map((item) => item.module), ["properties", "people", "leases"]);
});

test("portal roles and no role search nothing", () => {
  assert.deepEqual(searchModulesFor(null), []);
  assert.deepEqual(searchModulesFor("owner"), []);
});

test("links carry the query", () => {
  assert.equal(searchPageHref("josé pérez"), "/admin/buscar?q=jos%C3%A9%20p%C3%A9rez");
  assert.equal(searchListHref("people", "ana"), "/admin/people?q=ana");
});
