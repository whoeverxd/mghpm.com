import assert from "node:assert/strict";
import { test } from "node:test";
import { auditTargetHref, toAuditRow } from "./format.ts";

test("links each action to its record", () => {
  assert.equal(auditTargetHref("person.updated", "p1", null), "/admin/people/p1");
  assert.equal(auditTargetHref("lease.activated", "l1", null), "/admin/leases/l1");
  assert.equal(auditTargetHref("ownership.ended", "o1", null), "/admin/ownerships/o1");
  assert.equal(auditTargetHref("member.role_changed", "u1", null), "/admin/users/u1/edit");
  assert.equal(auditTargetHref("property.updated", "pr1", null), "/admin/properties/pr1");
  assert.equal(auditTargetHref("property.image_added", "img1", "pr1"), "/admin/properties/pr1");
  assert.equal(auditTargetHref("unit.created", "u1", "pr1"), "/admin/properties/pr1?tab=units");
  assert.equal(auditTargetHref("unit.created", "u1", null), null);
  assert.equal(auditTargetHref("stay_inquiry.status_changed", "i1", null), "/admin/stay-inquiries");
  assert.equal(auditTargetHref("workspace.switched", "org", null), null);
});

test("builds a row with its details", () => {
  const createdAt = new Date("2026-11-14T15:00:00Z");
  assert.deepEqual(
    toAuditRow("e1", {
      action: "ownership.status_changed",
      area: "ownerships",
      actorUid: "u1",
      targetId: "o1",
      createdAt: { toDate: () => createdAt },
      from: "in_review",
      to: "rejected",
      reason: "Falta escritura",
    }),
    {
      id: "e1",
      action: "ownership.status_changed",
      area: "ownerships",
      actorUid: "u1",
      createdAt,
      href: "/admin/ownerships/o1",
      details: [
        { label: "De", value: "in_review" },
        { label: "A", value: "rejected" },
        { label: "Motivo", value: "Falta escritura" },
      ],
    },
  );
});

test("tolerates incomplete events", () => {
  const row = toAuditRow("e2", { action: "nope.x" });
  assert.equal(row.area, null);
  assert.equal(row.createdAt, null);
  assert.equal(row.href, null);
  assert.deepEqual(row.details, []);
});
