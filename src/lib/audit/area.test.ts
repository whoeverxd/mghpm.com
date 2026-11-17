import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { auditActionPrefixes, auditArea, auditEventFields } from "./area.ts";
import { auditActionLabels } from "./labels.ts";

const srcDir = join(import.meta.dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

/** Every "prefix.action" string literal in src whose prefix is an audit prefix. */
function actionLiterals() {
  const pattern = new RegExp(`"((?:${auditActionPrefixes.join("|")})\\.[a-z_]+)"`, "g");
  const found = new Set<string>();
  for (const file of sourceFiles(srcDir)) {
    for (const match of readFileSync(file, "utf8").matchAll(pattern)) found.add(match[1]!);
  }
  return found;
}

test("maps each action prefix to its area", () => {
  assert.equal(auditArea("property.created"), "properties");
  assert.equal(auditArea("unit.batch_created"), "properties");
  assert.equal(auditArea("person.updated"), "people");
  assert.equal(auditArea("lease.activated"), "leases");
  assert.equal(auditArea("ownership.ended"), "ownerships");
  assert.equal(auditArea("member.role_changed"), "access");
  assert.equal(auditArea("workspace.switched"), "access");
  assert.equal(auditArea("organization.bootstrap"), "access");
  assert.equal(auditArea("stay_inquiry.status_changed"), "stays");
});

test("rejects an unknown action prefix", () => {
  assert.throws(() => auditArea("invoice.created"), /Unknown audit action/);
  assert.throws(() => auditArea(""), /Unknown audit action/);
});

test("auditEventFields adds the area and keeps every field", () => {
  assert.deepEqual(auditEventFields({ action: "lease.created", actorUid: "u1", targetId: "l1" }), {
    action: "lease.created",
    actorUid: "u1",
    targetId: "l1",
    area: "leases",
  });
});

test("every audit action written in src has an area and a label", () => {
  const actions = actionLiterals();
  assert.ok(actions.size >= 30, `expected the known actions, found ${actions.size}`);
  for (const action of actions) {
    assert.doesNotThrow(() => auditArea(action), action);
    assert.ok(auditActionLabels[action], `missing label for ${action}`);
  }
});

test("every audit event write goes through auditEventFields", () => {
  const auditDir = join(srcDir, "lib", "audit");
  for (const file of sourceFiles(srcDir)) {
    if (file.startsWith(auditDir)) continue; // readers, not writers
    const source = readFileSync(file, "utf8");
    const writes = source.match(/\bactorUid:/g)?.length ?? 0;
    const wrapped = source.match(/auditEventFields\(\{/g)?.length ?? 0;
    assert.equal(wrapped, writes, `${file}: ${writes} audit writes, ${wrapped} use auditEventFields({ … })`);
  }
});
