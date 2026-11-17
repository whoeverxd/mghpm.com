import assert from "node:assert/strict";
import { test } from "node:test";
import { es } from "../i18n/dictionaries/es.ts";
import { buildCreateMenu } from "./create-menu.ts";

const hrefs = (pathname: string, role: Parameters<typeof buildCreateMenu>[1]) =>
  buildCreateMenu(pathname, role).map((item) => item.href);

test("org_owner outside a property gets every global action", () => {
  assert.deepEqual(hrefs("/admin/leases", "org_owner"), [
    "/admin/properties/new",
    "/admin/people/new",
    "/admin/leases/new",
    "/admin/ownerships/new",
    "/admin/users/new",
  ]);
});

test("inside a property adds the unit and prefills the property", () => {
  assert.deepEqual(hrefs("/admin/properties/p1/edit", "org_owner"), [
    "/admin/properties/new",
    "/admin/properties/p1/units/new",
    "/admin/people/new",
    "/admin/leases/new?propertyId=p1",
    "/admin/ownerships/new?propertyId=p1",
    "/admin/users/new",
  ]);
});

test("manager cannot add users", () => {
  assert.ok(!hrefs("/admin", "manager").includes("/admin/users/new"));
  assert.ok(hrefs("/admin", "manager").includes("/admin/leases/new"));
});

test("operations and portal roles get an empty menu", () => {
  assert.deepEqual(hrefs("/admin", "operations"), []);
  assert.deepEqual(hrefs("/admin", null), []);
});

test("each item has a translatable name and a stable key", () => {
  for (const item of buildCreateMenu("/admin/properties/p1", "org_owner")) {
    assert.ok(es.createMenu.items[item.name]);
    assert.ok(item.key.startsWith("/admin/"));
  }
});
