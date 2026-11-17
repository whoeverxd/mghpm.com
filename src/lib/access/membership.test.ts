import assert from "node:assert/strict";
import { test } from "node:test";
import { membershipLanes, normalizeMembership } from "./membership.ts";

test("legacy staff role becomes staffRole", () => {
  const membership = normalizeMembership({ role: "manager", status: "active", personId: null });
  assert.equal(membership.staffRole, "manager");
  assert.deepEqual(membership.portals, []);
});

test("legacy portal role becomes a portal with its person", () => {
  const membership = normalizeMembership({ role: "owner", status: "active", personId: "p1" });
  assert.equal(membership.staffRole, null);
  assert.deepEqual(membership.portals, ["owner"]);
  assert.equal(membership.portalPersonIds.owner, "p1");
});

test("new format keeps several portals", () => {
  const membership = normalizeMembership({
    staffRole: null,
    portals: ["owner", "tenant"],
    portalPersonIds: { owner: "p1", tenant: "p2" },
    status: "active",
  });
  assert.deepEqual(membershipLanes(membership), ["owner", "tenant"]);
});

test("staff plus portal opens both lanes", () => {
  const membership = normalizeMembership({ staffRole: "admin", portals: ["owner"], portalPersonIds: { owner: "p1" }, status: "active" });
  assert.deepEqual(membershipLanes(membership), ["admin", "owner"]);
});

test("vendor opens nothing", () => {
  assert.deepEqual(membershipLanes(normalizeMembership({ role: "vendor", status: "active" })), []);
});
