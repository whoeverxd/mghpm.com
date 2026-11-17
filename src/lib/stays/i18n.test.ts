import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatMoney,
  formatText,
  getStaysDictionary,
  hasStaysLocale,
  pickStaysLocale,
} from "./i18n.ts";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}.${key}`)).sort();
}

test("both dictionaries have the same keys", () => {
  assert.deepEqual(keyPaths(getStaysDictionary("es")), keyPaths(getStaysDictionary("en")));
});

test("locale helpers", () => {
  assert.equal(hasStaysLocale("es"), true);
  assert.equal(hasStaysLocale("fr"), false);
  assert.equal(pickStaysLocale("es-DO,es;q=0.9"), "es");
  assert.equal(pickStaysLocale("en-US,es;q=0.5"), "en");
  assert.equal(pickStaysLocale(null), "en");
});

test("formatting", () => {
  assert.equal(formatText("Hasta {count} huéspedes", { count: 4 }), "Hasta 4 huéspedes");
  assert.equal(formatMoney(15000, "USD", "en"), "$150");
  assert.equal(formatMoney(15050, "USD", "en"), "$150.50");
});

test("translated catalog paths", async () => {
  const { getStaysPath, switchStaysPath } = await import("./i18n.ts");
  assert.equal(getStaysPath("en"), "/stays");
  assert.equal(getStaysPath("es", "p 1", "u1"), "/estancias/p%201/u1");
  assert.equal(switchStaysPath("/estancias/p1/u1", "en"), "/stays/p1/u1");
  assert.equal(switchStaysPath("/stays", "es"), "/estancias");
  assert.equal(switchStaysPath("/es/stays/p1/u1", "en"), "/stays/p1/u1");
  assert.equal(switchStaysPath("/somewhere-else", "es"), "/estancias");
});
