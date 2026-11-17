import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeRelationshipTypes,
  endRelationship,
  hasActiveRelationship,
  normalizePersonIdentity,
  upsertRelationship,
} from "./relationships.ts";

const since = new Date("2026-01-01T00:00:00Z");

test("legacy owner with contact name becomes an entity owner", () => {
  const person = normalizePersonIdentity({ type: "owner", contactName: "Ricardo", propertyId: null, unitId: null });
  assert.equal(person.kind, "entity");
  assert.deepEqual(Object.keys(person.relationships), ["owner"]);
  assert.equal(person.relationships.owner?.status, "active");
});

test("legacy tenant keeps its property and unit", () => {
  const person = normalizePersonIdentity({ type: "tenant", contactName: "", propertyId: "p1", unitId: "u1" });
  assert.equal(person.kind, "individual");
  assert.equal(person.relationships.tenant?.propertyId, "p1");
  assert.equal(person.relationships.tenant?.unitId, "u1");
});

test("new-format documents pass through", () => {
  const person = normalizePersonIdentity({
    kind: "individual",
    relationships: { owner: { status: "active", since }, tenant: { status: "ended", since, propertyId: null, unitId: null } },
  });
  assert.deepEqual(activeRelationshipTypes(person.relationships), ["owner"]);
  assert.equal(hasActiveRelationship(person.relationships, "tenant"), false);
});

test("upsert activates and end closes", () => {
  let relationships = upsertRelationship({}, "tenant", since, { propertyId: "p1", unitId: null });
  assert.equal(relationships.tenant?.status, "active");
  relationships = upsertRelationship(relationships, "owner", since);
  assert.deepEqual(activeRelationshipTypes(relationships), ["owner", "tenant"]);
  relationships = endRelationship(relationships, "tenant", since);
  assert.deepEqual(activeRelationshipTypes(relationships), ["owner"]);
  assert.equal(relationships.tenant?.status, "ended");
});
