import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "./dictionaries/en.ts";
import { es } from "./dictionaries/es.ts";

/** "a.b.c" paths of every text, plus the length of lists (they must match too). */
function paths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => paths(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

function texts(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => texts(child, `${prefix}.${key}`));
  }
  return [];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("Spanish and English have exactly the same keys", () => {
  assert.deepEqual(paths(en).sort(), paths(es).sort());
});

test("no text is empty", () => {
  for (const [path, text] of [...texts(es, "es"), ...texts(en, "en")]) assert.ok(text.trim(), `${path} is empty`);
});

test("placeholders match between languages", () => {
  const english = new Map(texts(en));
  for (const [path, text] of texts(es)) {
    assert.deepEqual(placeholders(english.get(path) ?? ""), placeholders(text), path);
  }
});
