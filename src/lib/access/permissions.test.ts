import assert from "node:assert/strict";
import { test } from "node:test";
import { can, getLaneHomePath, laneForPathname, laneForRole, staffModules } from "./permissions.ts";

test("roles map to lanes", () => {
  for (const role of ["org_owner", "admin", "manager", "operations"] as const) {
    assert.equal(laneForRole(role), "admin");
  }
  assert.equal(laneForRole("owner"), "owner");
  assert.equal(laneForRole("tenant"), "tenant");
  assert.equal(laneForRole("applicant"), "applicant");
  assert.equal(laneForRole("guest"), "guest");
  assert.equal(laneForRole("vendor"), null);
});

test("owner and admin can do everything operational", () => {
  for (const role of ["org_owner", "admin"] as const) {
    for (const mod of ["properties", "people", "leases", "stay_inquiries"] as const) {
      for (const action of ["view", "create", "update", "archive"] as const) {
        assert.equal(can(role, mod, action), true, `${role} ${mod} ${action}`);
      }
    }
    assert.equal(can(role, "members", "manage"), true);
    assert.equal(can(role, "audit", "view"), true);
  }
});

test("manager operates but does not manage users", () => {
  assert.equal(can("manager", "properties", "archive"), true);
  assert.equal(can("manager", "leases", "create"), true);
  assert.equal(can("manager", "members", "view"), true);
  assert.equal(can("manager", "members", "manage"), false);
  assert.equal(can("manager", "audit", "view"), false);
});

test("operations reads and only updates stay inquiries", () => {
  assert.equal(can("operations", "properties", "view"), true);
  assert.equal(can("operations", "properties", "update"), false);
  assert.equal(can("operations", "stay_inquiries", "update"), true);
  assert.equal(can("operations", "members", "view"), false);
});

test("external and unknown roles get nothing", () => {
  for (const role of ["owner", "tenant", "applicant", "guest", "vendor"] as const) {
    for (const mod of staffModules) {
      assert.equal(can(role, mod, "view"), false, `${role} ${mod}`);
    }
  }
  assert.equal(can(null, "dashboard", "view"), false);
});

test("lane paths", () => {
  assert.equal(getLaneHomePath("admin"), "/admin");
  assert.equal(getLaneHomePath("owner"), "/propietario");
  assert.equal(laneForPathname("/admin/properties/x"), "admin");
  assert.equal(laneForPathname("/inquilino/perfil"), "tenant");
  assert.equal(laneForPathname("/estancias"), null);
});

test("ownership review is restricted", () => {
  assert.equal(can("admin", "ownerships", "review"), true);
  assert.equal(can("manager", "ownerships", "update"), true);
  assert.equal(can("manager", "ownerships", "review"), false);
  assert.equal(can("operations", "ownerships", "view"), true);
  assert.equal(can("operations", "ownerships", "create"), false);
});
