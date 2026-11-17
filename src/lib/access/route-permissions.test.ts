import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";
import {
  adminNavigation,
  adminNavigationSections,
  adminPagePermissions,
  createActions,
  nonStaffApis,
  staffApiPermissions,
} from "./route-permissions.ts";
import { en } from "../i18n/dictionaries/en.ts";
import { es } from "../i18n/dictionaries/es.ts";

// Static consistency checks between the manifest and the code: menu ↔ page ↔ API.
const appDir = join(import.meta.dirname, "..", "..", "app");

function findFiles(dir: string, name: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findFiles(path, name);
    return entry.name === name ? [path] : [];
  });
}

function routePattern(file: string) {
  const parts = relative(appDir, file).split(sep).slice(0, -1);
  return `/${parts.filter((part) => !part.startsWith("(")).join("/")}`;
}

const pageFiles = new Map(
  findFiles(join(appDir, "admin"), "page.tsx").map((file) => [routePattern(file), file]),
);

/** Every exported HTTP handler as "METHOD pattern" → its source text. */
const apiHandlers = new Map<string, string>(
  findFiles(join(appDir, "api"), "route.ts").flatMap((file) => {
    const source = readFileSync(file, "utf8");
    const starts = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g)];
    return starts.map((match, index): [string, string] => [
      `${match[1]} ${routePattern(file)}`,
      source.slice(match.index, starts[index + 1]?.index ?? source.length),
    ]);
  }),
);

const sorted = (values: Iterable<string>) => [...values].sort();

test("every /admin page is declared in the manifest, and nothing else", () => {
  assert.deepEqual(sorted(pageFiles.keys()), sorted(Object.keys(adminPagePermissions)));
});

test("every /admin page guards the lane and checks its declared permission", () => {
  for (const [pattern, { module, action }] of Object.entries(adminPagePermissions)) {
    const source = readFileSync(pageFiles.get(pattern)!, "utf8");
    assert.match(source, /await requireAdminPage\(\)/, `${pattern} must call requireAdminPage()`);
    const check = new RegExp(`\\bcan\\(\\s*[\\w.]+,\\s*"${module}",\\s*"${action}"\\s*\\)`);
    assert.match(source, check, `${pattern} must check can(role, "${module}", "${action}")`);
  }
});

test("every API handler is declared exactly once, as staff or non-staff", () => {
  const declared = [...Object.keys(staffApiPermissions), ...Object.keys(nonStaffApis)];
  assert.equal(new Set(declared).size, declared.length, "a handler is declared twice");
  assert.deepEqual(sorted(apiHandlers.keys()), sorted(declared));
});

test("every staff API checks its declared permission before reading input", () => {
  for (const [handler, { module, action }] of Object.entries(staffApiPermissions)) {
    const source = apiHandlers.get(handler)!;
    const calls = [...source.matchAll(/requireStaffPermission\(\s*"(\w+)",\s*"(\w+)"/g)];
    assert.equal(calls.length, 1, `${handler} must call requireStaffPermission exactly once`);
    assert.deepEqual([calls[0]![1], calls[0]![2]], [module, action], `${handler} checks the wrong permission`);

    const firstRead = Math.min(
      ...["readJsonRequestBody(", "request.formData(", "request.json("]
        .map((needle) => source.indexOf(needle))
        .filter((index) => index >= 0),
    );
    assert.ok(calls[0]!.index < firstRead, `${handler} must check permission before reading the body`);
  }
});

test("non-staff APIs do not use the staff permission table", () => {
  for (const handler of Object.keys(nonStaffApis)) {
    assert.doesNotMatch(apiHandlers.get(handler)!, /requireStaffPermission\(/, handler);
  }
});

const placeholders = (label: string) => [...label.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!);

test("each menu entry opens a page that needs exactly `view` on the same module", () => {
  for (const item of adminNavigation) {
    const page = adminPagePermissions[item.href]!;
    assert.deepEqual({ module: page.module, action: page.action }, { module: item.module, action: "view" }, item.href);
  }
});

test("menu entries all belong to a section and sections are not empty", () => {
  const inSections = adminNavigationSections.flatMap((section) => section.items.map((item) => item.href));
  assert.deepEqual(inSections, adminNavigation.map((item) => item.href));
  for (const section of adminNavigationSections) assert.ok(section.items.length > 0, section.key);
});

test("every page has a label in both languages and a parent chain that reaches /admin", () => {
  assert.deepEqual(sorted(Object.keys(es.routes)), sorted(Object.keys(adminPagePermissions)));
  assert.deepEqual(sorted(Object.keys(en.routes)), sorted(Object.keys(adminPagePermissions)));
  for (const [pattern, page] of Object.entries(adminPagePermissions)) {
    assert.ok(es.routes[pattern]?.trim() && en.routes[pattern]?.trim(), `${pattern} needs a label`);
    if (pattern !== "/admin") assert.notEqual(page.parent, pattern, `${pattern} is its own parent`);
    let current: string | null = pattern;
    for (let depth = 0; current; depth += 1) {
      assert.ok(depth < 10, `${pattern}: parent cycle`);
      const parent: string | null = adminPagePermissions[current]?.parent ?? null;
      if (parent !== null) assert.ok(adminPagePermissions[parent], `${pattern}: unknown parent ${parent}`);
      current = parent;
    }
  }
});

test("label placeholders name a parameter of their own pattern", () => {
  for (const pattern of Object.keys(adminPagePermissions)) {
    for (const name of placeholders(es.routes[pattern]!)) {
      assert.ok(pattern.includes(`[${name}]`), `${pattern}: {${name}} is not a route parameter`);
    }
    assert.deepEqual(placeholders(en.routes[pattern]!).sort(), placeholders(es.routes[pattern]!).sort(), pattern);
  }
});

/** Placeholders along a page breadcrumb chain: the names the page must provide. */
function chainPlaceholders(pattern: string) {
  const names = new Set<string>();
  for (let current: string | null = pattern; current; current = adminPagePermissions[current]!.parent) {
    for (const name of placeholders(es.routes[current]!)) names.add(name);
  }
  return names;
}

test("pages provide crumbNames for every placeholder in their breadcrumb chain", () => {
  for (const pattern of Object.keys(adminPagePermissions)) {
    const source = readFileSync(pageFiles.get(pattern)!, "utf8");
    for (const name of chainPlaceholders(pattern)) {
      assert.match(source, new RegExp(String.raw`crumbNames=\{\{[^}]*\b${name}:`), `${pattern} must pass crumbNames.${name}`);
    }
  }
});

test("each create action opens a page that needs exactly its permission", () => {
  for (const item of createActions) {
    const page = adminPagePermissions[item.href];
    assert.ok(page, `${item.href} is not an admin page`);
    assert.deepEqual({ module: page.module, action: page.action }, { module: item.module, action: item.action }, item.href);
  }
});
