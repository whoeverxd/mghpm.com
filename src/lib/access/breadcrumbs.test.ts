import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "../i18n/dictionaries/en.ts";
import { es } from "../i18n/dictionaries/es.ts";
import { buildBreadcrumbs as build, matchAdminPage } from "./breadcrumbs.ts";

const spanish = { routes: es.routes, ...es.breadcrumbs };
const buildBreadcrumbs = (pathname: string, names: Record<string, string> = {}) => build(pathname, names, spanish);

test("literal routes win over dynamic ones", () => {
  assert.deepEqual(matchAdminPage("/admin/people/new"), { pattern: "/admin/people/new", params: {} });
  assert.deepEqual(matchAdminPage("/admin/people/p1"), {
    pattern: "/admin/people/[personId]",
    params: { personId: "p1" },
  });
});

test("dashboard and top-level pages", () => {
  assert.deepEqual(buildBreadcrumbs("/admin"), [
    { label: "Inicio", href: "/admin" },
    { label: "Panel principal", href: null },
  ]);
  assert.deepEqual(buildBreadcrumbs("/admin/leases"), [
    { label: "Inicio", href: "/admin" },
    { label: "Contratos", href: null },
  ]);
});

test("nested pages use the names the page provides", () => {
  assert.deepEqual(
    buildBreadcrumbs("/admin/properties/p1/units/u1/edit", { propertyId: "Torre A", unitId: "101" }),
    [
      { label: "Inicio", href: "/admin" },
      { label: "Propiedades", href: "/admin/properties" },
      { label: "Torre A", href: "/admin/properties/p1" },
      { label: "Editar unidad 101", href: null },
    ],
  );
});

test("missing or empty names fall back to Detalle", () => {
  assert.deepEqual(buildBreadcrumbs("/admin/leases/l1/edit", { leaseId: "" }).map((crumb) => crumb.label), [
    "Inicio",
    "Contratos",
    "Detalle",
    "Editar",
  ]);
});

test("unknown routes show only Inicio", () => {
  assert.deepEqual(buildBreadcrumbs("/admin/nope/1/2"), [{ label: "Inicio", href: null }]);
});

test("uses the active language", () => {
  const english = { routes: en.routes, ...en.breadcrumbs };
  assert.deepEqual(
    build("/admin/properties/p1/units/u1/edit", { propertyId: "Torre A" }, english).map((crumb) => crumb.label),
    ["Home", "Properties", "Torre A", "Details"],
  );
});
