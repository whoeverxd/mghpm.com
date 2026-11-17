import assert from "node:assert/strict";
import { test } from "node:test";
import { createFormatter } from "./format.ts";
import { interpolate, pickLocale } from "./locales.ts";

test("the saved preference wins over the browser", () => {
  assert.equal(pickLocale("en", "es-DO,es;q=0.9"), "en");
  assert.equal(pickLocale("es", "en-US"), "es");
});

test("without a preference, the browser's first supported language is used", () => {
  assert.equal(pickLocale(undefined, "en-US,en;q=0.9,es;q=0.8"), "en");
  assert.equal(pickLocale(null, "fr-FR,fr;q=0.9,en;q=0.8,es;q=0.7"), "en");
  assert.equal(pickLocale(null, "es;q=0.5,en;q=0.9"), "en");
  assert.equal(pickLocale("xx", "es-DO"), "es");
});

test("falls back to Spanish", () => {
  assert.equal(pickLocale(null, null), "es");
  assert.equal(pickLocale(null, "fr,de"), "es");
  assert.equal(pickLocale(null, "en;q=0"), "es");
});

test("interpolate fills placeholders and keeps unknown ones", () => {
  assert.equal(interpolate("Editar unidad {unitId}", { unitId: "101" }), "Editar unidad 101");
  assert.equal(interpolate("{a} y {b}", { a: 1 }), "1 y {b}");
});

test("formats dates, money and numbers per language", () => {
  const es = createFormatter("es");
  const en = createFormatter("en");
  assert.equal(en.date("2026-11-15"), "Nov 15, 2026");
  assert.match(es.date("2026-11-15"), /15.+nov.+2026/);
  assert.equal(es.date(null), "—");
  assert.equal(en.date("not-a-date"), "—");
  assert.match(en.money(125000, "USD"), /USD\s?1,250\.00/);
  assert.match(es.money(125000, "DOP"), /DOP\s?1,250\.00/);
  assert.equal(en.number(1234.5), "1,234.5");
  const instant = new Date("2026-11-15T15:30:00Z");
  assert.match(en.dateTime(instant, "America/Santo_Domingo"), /Nov 15, 2026.*11:30/);
  assert.equal(en.dateTime(null), "—");
});
