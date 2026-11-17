# Paso 4A — Navegación del admin: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menú lateral por secciones (con Titularidades y Auditoría), migas de pan con nombres reales en todo `/admin`, y las páginas nuevas `/admin/ownerships` y `/admin/audit`.

**Architecture:** El manifiesto `src/lib/access/route-permissions.ts` gana `label`/`parent` por página y secciones de menú; una función pura `buildBreadcrumbs` arma las migas y `AdminShell` las pinta con los nombres que cada página le pasa en `crumbNames`. Cada evento de auditoría guarda `area` (derivada de la acción por un helper puro) para filtrar el visor; una migración idempotente completa los eventos viejos.

**Tech Stack:** Next.js 16 App Router (server components), Firebase Admin SDK / Firestore, `node --test` con TS nativo, e2e en `scripts/e2e/*.mjs` contra emuladores.

**Spec:** `docs/superpowers/specs/2026-11-14-admin-navigation-4a-design.md`

## Reglas de este repositorio (obligatorias)

- Trabajar en `main`. **No hacer commit** (el dueño hace commit cuando lo pide). Los subagentes no tocan git.
- No agregar datos de ejemplo/semilla.
- AGENTS.md: antes de escribir código Next, revisar la guía relevante en `node_modules/next/dist/docs/`.
- Pruebas unitarias: `npm run test:unit` (archivos `src/lib/**/*.test.ts`; los imports de valor entre archivos probados llevan extensión `.ts`; nada que importe `server-only`).
- Verificación final: `npm run typecheck`, `npm run lint`, `npm run test:unit`, y e2e:
  `npx --yes firebase-tools@14.1.0 emulators:exec --project demo-mghpm --only auth,firestore "bash scripts/ci/run-e2e.sh"`.
  En Windows, tras la e2e: detener el servidor en el puerto 3100 y el `java.exe` huérfano del emulador de Firestore (confirmar que su línea de comandos contiene `cloud-firestore-emulator` antes de `Stop-Process`).

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/audit/area.ts` (nuevo) | Áreas de auditoría, `auditArea(action)`, `auditEventFields(fields)` |
| `src/lib/audit/labels.ts` (nuevo) | `auditActionLabels` completo y `getAuditActionLabel` (puro) |
| `src/lib/audit/format.ts` (nuevo) | `toAuditRow` y `auditTargetHref` (puro) |
| `src/lib/audit/area.test.ts`, `format.test.ts` (nuevos) | Pruebas unitarias y estáticas de auditoría |
| `src/lib/audit/list.ts` (nuevo) | Consulta paginada del visor + nombres de actores |
| `src/lib/audit/recent.ts` | Reexporta las etiquetas desde `labels.ts` |
| `src/lib/{leases,members,ownerships,people,properties,stays}/…`, `src/app/api/organizations/**` | Escrituras de auditoría pasan por `auditEventFields` |
| `scripts/migrate-audit-area.mjs` (nuevo) | Migración de `area` |
| `src/lib/access/route-permissions.ts` | `label`/`parent` por página, `adminNavigationSections` |
| `src/lib/access/breadcrumbs.ts` + `.test.ts` (nuevos) | `matchAdminPage`, `buildBreadcrumbs` |
| `src/lib/access/route-permissions.test.ts` | Pruebas estáticas del manifiesto y de `crumbNames` |
| `src/components/layout/admin-shell.tsx` + `.module.css` | Menú por secciones, migas, `topbarTools` |
| 15 páginas dinámicas de `src/app/admin/**` | Pasan `crumbNames` |
| `src/lib/ownerships/list-filters.ts` + `.test.ts`, `list.ts` (nuevos) | Filtros y consulta del listado de titularidades |
| `src/app/admin/ownerships/page.tsx` (nuevo) | Listado de titularidades |
| `src/app/admin/audit/page.tsx` (nuevo) | Visor de auditoría |
| `firestore.indexes.json` | 3 índices nuevos |
| `scripts/e2e/navigation.mjs` (nuevo), `package.json` | e2e de migas, filtros y migración |

---

### Task 1: Áreas y etiquetas de auditoría (puro)

**Files:**
- Create: `src/lib/audit/area.ts`, `src/lib/audit/labels.ts`, `src/lib/audit/area.test.ts`
- Modify: `src/lib/audit/recent.ts`

- [ ] **Step 1: Escribir la prueba que falla** — `src/lib/audit/area.test.ts`:

```ts
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
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `node --test src/lib/audit/area.test.ts`
Expected: FAIL (`Cannot find module './area.ts'`).

- [ ] **Step 3: Implementar** — `src/lib/audit/area.ts`:

```ts
/** Areas of the audit viewer. Every audit event stores one, derived from its action. */
export const auditAreas = ["properties", "people", "leases", "ownerships", "access", "stays"] as const;
export type AuditArea = (typeof auditAreas)[number];

export const auditAreaLabels: Record<AuditArea, string> = {
  properties: "Propiedades",
  people: "Personas",
  leases: "Contratos",
  ownerships: "Titularidades",
  access: "Usuarios y accesos",
  stays: "Estadías",
};

const areaByPrefix = {
  property: "properties",
  unit: "properties",
  person: "people",
  lease: "leases",
  ownership: "ownerships",
  member: "access",
  workspace: "access",
  organization: "access",
  stay_inquiry: "stays",
} as const satisfies Record<string, AuditArea>;

export const auditActionPrefixes = Object.keys(areaByPrefix);

export function auditArea(action: string): AuditArea {
  const prefix = action.split(".")[0] ?? "";
  if (!Object.hasOwn(areaByPrefix, prefix)) {
    throw new Error(`Unknown audit action "${action}": add its prefix to areaByPrefix.`);
  }
  return areaByPrefix[prefix as keyof typeof areaByPrefix];
}

/** Use for every audit event write: adds `area` so the viewer can filter by it. */
export function auditEventFields<T extends { action: string }>(fields: T): T & { area: AuditArea } {
  return { ...fields, area: auditArea(fields.action) };
}
```

`src/lib/audit/labels.ts`:

```ts
export const auditActionLabels: Record<string, string> = {
  "property.created": "Propiedad creada",
  "property.updated": "Propiedad actualizada",
  "property.image_added": "Imagen agregada",
  "property.image_removed": "Imagen eliminada",
  "property.image_cover_set": "Portada cambiada",
  "property.images_reordered": "Imágenes reordenadas",
  "unit.created": "Unidad creada",
  "unit.updated": "Unidad actualizada",
  "unit.archived": "Unidad archivada",
  "unit.restored": "Unidad restaurada",
  "unit.batch_created": "Unidades generadas",
  "person.created": "Persona creada",
  "person.updated": "Persona actualizada",
  "person.archived": "Persona archivada",
  "person.restored": "Persona restaurada",
  "person.relationship_added": "Relación agregada",
  "person.relationship_ended": "Relación finalizada",
  "lease.created": "Contrato creado",
  "lease.updated": "Contrato actualizado",
  "lease.submitted": "Contrato enviado a activación",
  "lease.activated": "Contrato activado",
  "lease.cancelled": "Contrato cancelado",
  "lease.terminated": "Contrato terminado",
  "lease.expired": "Contrato vencido",
  "ownership.created": "Titularidad creada",
  "ownership.updated": "Titularidad actualizada",
  "ownership.status_changed": "Estado de titularidad cambiado",
  "ownership.ended": "Titularidad finalizada",
  "member.created": "Usuario agregado",
  "member.role_changed": "Rol cambiado",
  "member.portals_changed": "Portales cambiados",
  "member.suspended": "Usuario suspendido",
  "member.reactivated": "Usuario reactivado",
  "workspace.switched": "Cambio de espacio de trabajo",
  "organization.bootstrap": "Organización creada",
  "stay_inquiry.status_changed": "Estado de solicitud cambiado",
};

export function getAuditActionLabel(action: string) {
  return auditActionLabels[action] ?? action;
}
```

In `src/lib/audit/recent.ts`, delete the `auditActionLabels` constant and the `getAuditActionLabel` function and add after the imports:

```ts
export { auditActionLabels, getAuditActionLabel } from "./labels";
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `node --test src/lib/audit/area.test.ts` → PASS (4 tests). Run `npm run typecheck` → sin errores (`src/components/people/activity-list.tsx` sigue importando desde `recent`).

- [ ] **Step 5:** No commit (regla del repo).

---

### Task 2: Todas las escrituras de auditoría guardan `area`

**Files:**
- Modify: `src/lib/leases/records.ts` (2 escrituras), `src/lib/members/records.ts` (3), `src/lib/ownerships/records.ts` (1), `src/lib/people/records.ts` (5), `src/lib/properties/images.ts` (1), `src/lib/properties/records.ts` (2), `src/lib/properties/units.ts` (2), `src/lib/stays/inquiries.ts` (1), `src/app/api/organizations/route.ts` (1), `src/app/api/organizations/active/route.ts` (1)
- Test: `src/lib/audit/area.test.ts`

Toda escritura de auditoría es un objeto literal con `actorUid:`; esa es la marca que usa la prueba.

- [ ] **Step 1: Agregar la prueba estática que falla** al final de `src/lib/audit/area.test.ts`:

```ts
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
```

- [ ] **Step 2:** `node --test src/lib/audit/area.test.ts` → FAIL listando los archivos.

- [ ] **Step 3: Envolver cada objeto de evento.** Patrón (aplicar a cada escritura; en cada archivo agregar `import { auditEventFields } from "@/lib/audit/area";`):

```ts
// antes
transaction.create(auditReference, {
  organizationId,
  action: "property.created",
  actorUid: userUid,
  targetId: propertyReference.id,
  createdAt: timestamp,
});
// después
transaction.create(
  auditReference,
  auditEventFields({
    organizationId,
    action: "property.created",
    actorUid: userUid,
    targetId: propertyReference.id,
    createdAt: timestamp,
  }),
);
```

Casos especiales:
- `src/app/api/organizations/active/route.ts`: `.add(auditEventFields({ … action: "workspace.switched", … }))`.
- `src/lib/members/records.ts` (bucle de `events`): cambiar el tipo a
  `const events: { action: string; [key: string]: unknown }[] = [];` y escribir
  `transaction.create(organizationReference.collection("auditEvents").doc(), auditEventFields({ organizationId, actorUid: actor.uid, targetId: uid, createdAt: timestamp, ...event }));`
- Las funciones auxiliares con `action: string` (leases, ownerships, images) se envuelven una sola vez dentro de la función.

- [ ] **Step 4:** `node --test src/lib/audit/area.test.ts` → PASS; `npm run typecheck` → sin errores.

- [ ] **Step 5:** No commit.

---

### Task 3: Migración `area` para eventos existentes

**Files:**
- Create: `scripts/migrate-audit-area.mjs`
- Modify: `package.json` (script `migrate:audit-area`)

- [ ] **Step 1: Crear el script**:

```js
// Paso 4A: adds `area` to audit events written before it existed.
//
//   node scripts/migrate-audit-area.mjs          simulation: counts what would change
//   node scripts/migrate-audit-area.mjs --yes    writes
//
// Targets FIREBASE_PROJECT_ID with application default credentials, or the emulators when
// FIRESTORE_EMULATOR_HOST is set. Idempotent: events that already have `area` are skipped.
import { createRequire } from "node:module";
import path from "node:path";
import { auditArea } from "../src/lib/audit/area.ts";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const write = process.argv.includes("--yes");
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID to the target Firebase project.");
  process.exit(1);
}
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (projectId.startsWith("demo-") && !emulatorHost) {
  console.error(`Project "${projectId}" is a demo project but FIRESTORE_EMULATOR_HOST is not set.`);
  process.exit(1);
}
console.log(emulatorHost ? `TARGET: EMULATOR ${emulatorHost} (project ${projectId})` : `TARGET: REAL project ${projectId}`);
console.log(write ? "MODE: write" : "MODE: simulation (re-run with --yes to write)");

const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId }, "migrate-audit-area"));
let scanned = 0;
let pending = 0;
let unknown = 0;

for (const organization of await db.collection("organizations").listDocuments()) {
  const snapshot = await organization.collection("auditEvents").get();
  let batch = db.batch();
  let inBatch = 0;
  for (const document of snapshot.docs) {
    scanned += 1;
    if (typeof document.get("area") === "string") continue;
    let area;
    try {
      area = auditArea(String(document.get("action") ?? ""));
    } catch {
      unknown += 1;
      console.warn(`  unknown action at ${document.ref.path}: ${document.get("action")}`);
      continue;
    }
    pending += 1;
    if (!write) continue;
    batch.update(document.ref, { area });
    inBatch += 1;
    if (inBatch === 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();
}

console.log(`RESULT scanned=${scanned} ${write ? "updated" : "would_update"}=${pending} unknown=${unknown}`);
```

- [ ] **Step 2:** En `package.json`, después de `"migrate:relationships"`: `"migrate:audit-area": "node scripts/migrate-audit-area.mjs",`
- [ ] **Step 3:** Se prueba en la e2e (Task 10). No commit.

---

### Task 4: Manifiesto con etiquetas, padres y secciones

**Files:**
- Modify: `src/lib/access/route-permissions.ts`, `src/lib/access/route-permissions.test.ts`

- [ ] **Step 1: Pruebas que fallan** — en `route-permissions.test.ts` importar también `adminNavigationSections`, reemplazar la última prueba y agregar:

```ts
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
  for (const section of adminNavigationSections) assert.ok(section.items.length > 0, section.title);
});

test("every page has a label and a parent chain that reaches /admin", () => {
  for (const [pattern, page] of Object.entries(adminPagePermissions)) {
    assert.ok(page.label.trim(), `${pattern} needs a label`);
    let current: string | null = pattern;
    for (let depth = 0; current && current !== "/admin"; depth += 1) {
      assert.ok(depth < 10, `${pattern}: parent cycle`);
      current = adminPagePermissions[current]?.parent ?? null;
      if (current !== null) assert.ok(adminPagePermissions[current], `${pattern}: unknown parent ${current}`);
    }
    if (pattern !== "/admin") assert.notEqual(page.parent, pattern, `${pattern} is its own parent`);
  }
});

test("label placeholders name a parameter of their own pattern", () => {
  for (const [pattern, page] of Object.entries(adminPagePermissions)) {
    for (const name of placeholders(page.label)) {
      assert.ok(pattern.includes(`[${name}]`), `${pattern}: {${name}} is not a route parameter`);
    }
  }
});
```

Y en la prueba "every /admin page guards the lane…" usar `{ module, action }` igual (la desestructuración ya ignora los campos nuevos).

- [ ] **Step 2:** `node --test src/lib/access/route-permissions.test.ts` → FAIL (`adminNavigationSections` no existe).

- [ ] **Step 3: Implementar** — reemplazar en `route-permissions.ts` el bloque de menú y de páginas:

```ts
export type AdminPage = RoutePermission & {
  /** Breadcrumb label; `{param}` is replaced by the name the page passes in `crumbNames`. */
  label: string;
  /** Parent page pattern; null for top-level pages (shown right after "Inicio"). */
  parent: string | null;
};

const page = (
  module: StaffModule,
  action: StaffAction,
  label: string,
  parent: string | null = null,
): AdminPage => ({ module, action, label, parent });

type NavigationItem = { href: string; label: string; module: StaffModule };

/** Menu sections, in display order. A role sees an entry iff it can `view` its module. */
export const adminNavigationSections = [
  { title: "Inicio", items: [{ href: "/admin", label: "Panel principal", module: "dashboard" }] },
  { title: "Cartera", items: [{ href: "/admin/properties", label: "Propiedades", module: "properties" }] },
  {
    title: "Arrendamiento",
    items: [
      { href: "/admin/people", label: "Personas", module: "people" },
      { href: "/admin/leases", label: "Contratos", module: "leases" },
      { href: "/admin/stay-inquiries", label: "Solicitudes de estadía", module: "stay_inquiries" },
    ],
  },
  { title: "Administración", items: [{ href: "/admin/users", label: "Usuarios y accesos", module: "members" }] },
] as const satisfies readonly { title: string; items: readonly NavigationItem[] }[];

export const adminNavigation = adminNavigationSections.flatMap((section) => [...section.items]);

const PROPERTY = "/admin/properties/[propertyId]";
const PERSON = "/admin/people/[personId]";
const LEASE = "/admin/leases/[leaseId]";

/** Permission, breadcrumb label and parent of each /admin page (keyed by route pattern). */
export const adminPagePermissions: Record<string, AdminPage> = {
  "/admin": page("dashboard", "view", "Panel principal"),
  "/admin/properties": page("properties", "view", "Propiedades"),
  "/admin/properties/new": page("properties", "create", "Nueva propiedad", "/admin/properties"),
  [PROPERTY]: page("properties", "view", "{propertyId}", "/admin/properties"),
  [`${PROPERTY}/edit`]: page("properties", "update", "Editar", PROPERTY),
  [`${PROPERTY}/units/new`]: page("properties", "create", "Nueva unidad", PROPERTY),
  [`${PROPERTY}/units/generate`]: page("properties", "create", "Generar unidades", PROPERTY),
  [`${PROPERTY}/units/[unitId]/edit`]: page("properties", "update", "Editar unidad {unitId}", PROPERTY),
  "/admin/people": page("people", "view", "Personas"),
  "/admin/people/new": page("people", "create", "Nueva persona", "/admin/people"),
  [PERSON]: page("people", "view", "{personId}", "/admin/people"),
  [`${PERSON}/edit`]: page("people", "update", "Editar", PERSON),
  [`${PERSON}/propietario`]: page("people", "view", "Vista de propietario", PERSON),
  [`${PERSON}/inquilino`]: page("people", "view", "Vista de inquilino", PERSON),
  "/admin/leases": page("leases", "view", "Contratos"),
  "/admin/leases/new": page("leases", "create", "Nuevo contrato", "/admin/leases"),
  [LEASE]: page("leases", "view", "{leaseId}", "/admin/leases"),
  [`${LEASE}/edit`]: page("leases", "update", "Editar", LEASE),
  "/admin/ownerships/new": page("ownerships", "create", "Nueva titularidad"),
  "/admin/ownerships/[ownershipId]": page("ownerships", "view", "{ownershipId}"),
  "/admin/stay-inquiries": page("stay_inquiries", "view", "Solicitudes de estadía"),
  "/admin/users": page("members", "view", "Usuarios y accesos"),
  "/admin/users/new": page("members", "manage", "Nuevo usuario", "/admin/users"),
  "/admin/users/[uid]/edit": page("members", "manage", "Editar {uid}", "/admin/users"),
};
```

(Las dos de titularidades pasan a tener padre `/admin/ownerships` en la Task 8, cuando exista esa página.) Actualizar el comentario del encabezado del archivo para mencionar migas y secciones. Eliminar el helper `p` solo si ya no lo usa `staffApiPermissions` (sí lo usa: se queda).

- [ ] **Step 4:** `node --test src/lib/access/route-permissions.test.ts` → PASS; `npm run typecheck` → sin errores (`admin-shell.tsx` sigue usando `adminNavigation`).
- [ ] **Step 5:** No commit.

---

### Task 5: `buildBreadcrumbs` (puro)

**Files:**
- Create: `src/lib/access/breadcrumbs.ts`, `src/lib/access/breadcrumbs.test.ts`

- [ ] **Step 1: Prueba que falla**:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBreadcrumbs, matchAdminPage } from "./breadcrumbs.ts";

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
```

- [ ] **Step 2:** `node --test src/lib/access/breadcrumbs.test.ts` → FAIL (módulo no existe).

- [ ] **Step 3: Implementar**:

```ts
import { adminPagePermissions } from "./route-permissions.ts";

export type Crumb = { label: string; href: string | null };

const ROOT_LABEL = "Inicio";
const FALLBACK_LABEL = "Detalle";
const segments = (path: string) => path.split("/").filter(Boolean);

/** The manifest pattern of a concrete /admin path; literal segments win over `[param]` ones. */
export function matchAdminPage(pathname: string) {
  const target = segments(pathname);
  let best: { pattern: string; params: Record<string, string> } | null = null;
  let bestLiterals = -1;
  for (const pattern of Object.keys(adminPagePermissions)) {
    const parts = segments(pattern);
    if (parts.length !== target.length) continue;
    const params: Record<string, string> = {};
    let literals = 0;
    const matches = parts.every((part, index) => {
      const dynamic = /^\[(\w+)\]$/.exec(part);
      if (dynamic) {
        params[dynamic[1]!] = target[index]!;
        return true;
      }
      literals += 1;
      return part === target[index];
    });
    if (matches && literals > bestLiterals) {
      best = { pattern, params };
      bestLiterals = literals;
    }
  }
  return best;
}

function resolveLabel(label: string, names: Record<string, string>) {
  const missing = [...label.matchAll(/\{(\w+)\}/g)].some((match) => !names[match[1]!]);
  return missing ? FALLBACK_LABEL : label.replace(/\{(\w+)\}/g, (_, name: string) => names[name]!);
}

/** "Inicio › … › current" for an /admin path. The last crumb has no href. */
export function buildBreadcrumbs(pathname: string, names: Record<string, string> = {}): Crumb[] {
  const match = matchAdminPage(pathname);
  if (!match) return [{ label: ROOT_LABEL, href: null }];

  const chain: string[] = [];
  for (let pattern: string | null = match.pattern; pattern && chain.length < 10; ) {
    chain.unshift(pattern);
    pattern = adminPagePermissions[pattern]?.parent ?? null;
  }
  const crumbs: Crumb[] = [
    { label: ROOT_LABEL, href: "/admin" },
    ...chain.map((pattern) => ({
      label: resolveLabel(adminPagePermissions[pattern]!.label, names),
      href: pattern.replace(/\[(\w+)\]/g, (_, name: string) => match.params[name] ?? ""),
    })),
  ];
  crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1]!, href: null };
  return crumbs;
}
```

- [ ] **Step 4:** `node --test src/lib/access/breadcrumbs.test.ts` → PASS (5 tests).
- [ ] **Step 5:** No commit.

---

### Task 6: `AdminShell` — menú por secciones, migas y `topbarTools`

**Files:**
- Modify: `src/components/layout/admin-shell.tsx`, `src/components/layout/admin-shell.module.css`

- [ ] **Step 1: Componente.** Cambios en `admin-shell.tsx`:
  - Imports: agregar `buildBreadcrumbs` de `@/lib/access/breadcrumbs` y `adminNavigationSections` de `@/lib/access/route-permissions`.
  - Props: agregar `crumbNames?: Record<string, string>;`.
  - Quitar `navigationItems`; en el cuerpo:

```tsx
  const crumbs = buildBreadcrumbs(pathname, crumbNames);
  const sections = adminNavigationSections
    .map((section) => ({
      title: section.title,
      items: section.items.filter((item) => can(activeRole ?? null, item.module, "view")),
    }))
    .filter((section) => section.items.length > 0);
  const isCurrent = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
```

  - `<nav className={styles.navigation}>` pasa a:

```tsx
        <nav className={styles.navigation}>
          {sections.map((section) => (
            <div className={styles.navSection} key={section.title}>
              <p className={styles.navSectionTitle}>{section.title}</p>
              {section.items.map(({ href, label }) => {
                const Icon = navigationIcons[href];
                return (
                  <Link
                    aria-current={isCurrent(href) ? "page" : undefined}
                    className={styles.navItem}
                    href={href}
                    key={href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? label : undefined}
                  >
                    <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                    <span className={styles.navLabel}>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
```

  - Eliminar el bloque `<div className={styles.sidebarFooter}>…</div>`.
  - Reemplazar `<p className={styles.breadcrumb}>…</p>` por:

```tsx
            <nav aria-label="Migas de pan" className={styles.breadcrumb}>
              <ol>
                {crumbs.length > 2 && (
                  <li aria-hidden="true" className={styles.crumbEllipsis}>
                    …
                  </li>
                )}
                {crumbs.map((crumb, index) => (
                  <li
                    className={index < crumbs.length - 2 ? styles.crumbCollapsible : undefined}
                    key={`${index}-${crumb.label}`}
                  >
                    {crumb.href ? (
                      <Link href={crumb.href} title={crumb.label}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current="page" title={crumb.label}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
```

  - En `userActions`, antes de `<OrganizationSwitcher …>`: `<div className={styles.topbarTools} />` (reservado para "+ Nuevo" y el buscador).

- [ ] **Step 2: CSS.** En `admin-shell.module.css`:
  - Quitar `.footerTitle`/`.footerText` de los selectores `.shell[data-collapsed="true"] …` (arriba y dentro del `@media (max-width: 760px)`), y borrar las reglas `.sidebarFooter`, `.footerTitle`, `.footerText`, `.separator`, `.breadcrumb`, `.breadcrumb [aria-current="page"]`.
  - Agregar:

```css
.navSection {
  display: grid;
  gap: 4px;
}

.navSection + .navSection {
  margin-top: 12px;
}

.navSectionTitle {
  margin: 0;
  padding: 0 10px 4px;
  color: rgb(255 255 255 / 60%);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.shell[data-collapsed="true"] .navSectionTitle {
  display: none;
}

.shell[data-collapsed="true"] .navSection + .navSection {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgb(255 255 255 / 18%);
}

.breadcrumb {
  min-width: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.breadcrumb ol {
  display: flex;
  min-width: 0;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  white-space: nowrap;
}

.breadcrumb li {
  display: flex;
  min-width: 0;
  align-items: center;
}

.breadcrumb li::before {
  margin: 0 8px;
  color: #cbd5e1;
  content: "›";
}

.breadcrumb li:first-child::before,
.crumbEllipsis + li::before {
  content: none;
}

.breadcrumb a,
.breadcrumb span {
  overflow: hidden;
  max-width: 24ch;
  text-overflow: ellipsis;
}

.breadcrumb a {
  color: inherit;
}

.breadcrumb a:hover {
  color: var(--color-title);
  text-decoration: underline;
}

.breadcrumb [aria-current="page"] {
  max-width: 40ch;
  color: var(--color-title);
  font-weight: 600;
}

.crumbEllipsis {
  display: none !important;
}

.topbarTools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbarTools:empty {
  display: none;
}
```

  - Dentro de `@media (max-width: 760px)`: borrar las reglas `.breadcrumb { gap…; font-size… }` y `.breadcrumb > span:first-child, .separator { display: none; }`, y agregar:

```css
  .breadcrumb {
    font-size: 12px;
  }

  .crumbCollapsible {
    display: none !important;
  }

  .crumbEllipsis {
    display: flex !important;
  }

  .breadcrumb a {
    max-width: 28vw;
  }

  .breadcrumb [aria-current="page"] {
    max-width: 48vw;
  }
```

- [ ] **Step 3:** `npm run typecheck && npm run lint` → limpios. `npm run test:unit` → todo pasa.
- [ ] **Step 4:** No commit.

---

### Task 7: Las páginas pasan `crumbNames`

**Files:**
- Modify: las 15 páginas dinámicas de `src/app/admin/**`; `src/lib/access/route-permissions.test.ts`

- [ ] **Step 1: Prueba estática que falla** (en `route-permissions.test.ts`):

```ts
/** Placeholders along a page's breadcrumb chain: the names the page must provide. */
function chainPlaceholders(pattern: string) {
  const names = new Set<string>();
  for (let current: string | null = pattern; current; current = adminPagePermissions[current]!.parent) {
    for (const name of placeholders(adminPagePermissions[current]!.label)) names.add(name);
  }
  return names;
}

test("pages provide crumbNames for every placeholder in their breadcrumb chain", () => {
  for (const pattern of Object.keys(adminPagePermissions)) {
    const source = readFileSync(pageFiles.get(pattern)!, "utf8");
    for (const name of chainPlaceholders(pattern)) {
      assert.match(source, new RegExp(`crumbNames=\\{\\{[^}]*\\b${name}:`), `${pattern} must pass crumbNames.${name}`);
    }
  }
});
```

- [ ] **Step 2:** `node --test src/lib/access/route-permissions.test.ts` → FAIL.

- [ ] **Step 3: Pasar los nombres** en el `<AdminShell>` del render principal de cada página (no en las ramas de acceso denegado). Usar las variables que la página ya carga:

| Página | `crumbNames` |
|---|---|
| `properties/[propertyId]/page.tsx` | `{{ propertyId: property.name }}` |
| `properties/[propertyId]/edit/page.tsx` | `{{ propertyId: property?.name ?? "" }}` |
| `properties/[propertyId]/units/new/page.tsx` | `{{ propertyId: property.name }}` |
| `properties/[propertyId]/units/generate/page.tsx` | `{{ propertyId: property.name }}` |
| `properties/[propertyId]/units/[unitId]/edit/page.tsx` | `{{ propertyId: property.name, unitId: unit.label }}` |
| `people/[personId]/page.tsx`, `edit`, `propietario`, `inquilino` | `{{ personId: person.name }}` |
| `leases/[leaseId]/page.tsx`, `edit` | `{{ leaseId: lease.code }}` |
| `ownerships/[ownershipId]/page.tsx` | `{{ ownershipId: person?.name ?? "" }}` (el titular que ya muestra el encabezado) |
| `users/[uid]/edit/page.tsx` | `{{ uid: member.displayName \|\| member.email }}` |

Con spread: `<AdminShell {...shellProps} crumbNames={{ propertyId: property.name }}>`. Con props sueltas: agregar la línea `crumbNames={{ … }}`. Si la variable tiene otro nombre en el archivo, usar la que pinta el título de la página.

- [ ] **Step 4:** `npm run test:unit` → PASS; `npm run typecheck` → limpio.
- [ ] **Step 5:** No commit.

---

### Task 8: Listado de titularidades `/admin/ownerships`

**Files:**
- Create: `src/lib/ownerships/list-filters.ts`, `src/lib/ownerships/list-filters.test.ts`, `src/lib/ownerships/list.ts`, `src/app/admin/ownerships/page.tsx`
- Modify: `src/lib/access/route-permissions.ts`, `src/components/layout/admin-shell.tsx`, `firestore.indexes.json`

- [ ] **Step 1: Prueba que falla** — `list-filters.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ownershipListFilters, parseOwnershipListFilter } from "./list-filters.ts";
import { ownershipStatuses } from "./rules.ts";

test("defaults to active ownerships", () => {
  assert.equal(parseOwnershipListFilter(undefined), "activas");
  assert.equal(parseOwnershipListFilter("nope"), "activas");
  assert.equal(parseOwnershipListFilter(["finalizadas"]), "activas");
  assert.equal(parseOwnershipListFilter("toString"), "activas");
});

test("accepts every filter and covers every status", () => {
  for (const key of Object.keys(ownershipListFilters)) assert.equal(parseOwnershipListFilter(key), key);
  const statuses = Object.values(ownershipListFilters).map((filter) => filter.status).filter(Boolean);
  assert.deepEqual([...statuses].sort(), [...ownershipStatuses].sort());
});
```

- [ ] **Step 2:** `node --test src/lib/ownerships/list-filters.test.ts` → FAIL.

- [ ] **Step 3: Implementar** `list-filters.ts`:

```ts
import type { OwnershipStatus } from "./rules";

/** `?estado=` values of the ownerships list. Every filter but "finalizadas" lists active ones. */
export const ownershipListFilters = {
  activas: { label: "Activas", status: null },
  "sin-iniciar": { label: "Sin iniciar", status: "not_started" },
  "documentos-pendientes": { label: "Documentos pendientes", status: "documents_pending" },
  "en-revision": { label: "En revisión", status: "in_review" },
  verificadas: { label: "Verificadas", status: "verified" },
  rechazadas: { label: "Rechazadas", status: "rejected" },
  finalizadas: { label: "Finalizadas", status: null },
} as const satisfies Record<string, { label: string; status: OwnershipStatus | null }>;

export type OwnershipListFilter = keyof typeof ownershipListFilters;

export function parseOwnershipListFilter(value: unknown): OwnershipListFilter {
  return typeof value === "string" && Object.hasOwn(ownershipListFilters, value)
    ? (value as OwnershipListFilter)
    : "activas";
}
```

`list.ts`:

```ts
import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getIndexUnavailableReason } from "@/lib/properties/list";
import { ownershipListFilters, type OwnershipListFilter } from "./list-filters";
import { parseOwnership, type Ownership } from "./records";

export const OWNERSHIPS_PAGE_SIZE = 25;

export type OwnershipRow = Ownership & { endDate: string | null };

export class OwnershipsIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore ownerships index is not ready.", options);
    this.name = "OwnershipsIndexUnavailableError";
  }
}

/** One page, newest first. Needs (active, createdAt desc) and (active, status, createdAt desc). */
export async function listOwnerships(organizationId: string, filter: OwnershipListFilter, cursor?: string) {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("ownerships");
  const status = ownershipListFilters[filter].status;
  const base = collection.where("active", "==", filter !== "finalizadas");
  let query = (status ? base.where("status", "==", status) : base)
    .orderBy("createdAt", "desc")
    .limit(OWNERSHIPS_PAGE_SIZE + 1);
  if (cursor) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
  }

  const snapshot = await query.get().catch((error: unknown) => {
    const reason = getIndexUnavailableReason(error);
    if (reason) throw new OwnershipsIndexUnavailableError(reason, { cause: error });
    throw error;
  });
  const documents = snapshot.docs.slice(0, OWNERSHIPS_PAGE_SIZE);
  return {
    rows: documents.map((document): OwnershipRow => {
      const endDate = document.get("endDate");
      return {
        ...parseOwnership(organizationId, document.id, document.data()),
        endDate: typeof endDate === "string" ? endDate : null,
      };
    }),
    nextCursor: snapshot.docs.length > OWNERSHIPS_PAGE_SIZE ? documents.at(-1)!.id : null,
  };
}
```

`src/app/admin/ownerships/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ScrollText } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { ownershipStatusLabels } from "@/lib/ownerships/labels";
import { listOwnerships, OwnershipsIndexUnavailableError } from "@/lib/ownerships/list";
import { ownershipListFilters, parseOwnershipListFilter } from "@/lib/ownerships/list-filters";
import { getPersonSummaries, getPropertySummaries } from "@/lib/ownerships/lookups";
import type { OwnershipStatus } from "@/lib/ownerships/rules";
import listStyles from "../properties/page.module.css";

export const metadata: Metadata = { title: "Titularidades" };

const statusClasses = {
  not_started: "status_draft",
  documents_pending: "status_maintenance",
  in_review: "status_maintenance",
  verified: "status_active",
  rejected: "status_inactive",
} as const satisfies Record<OwnershipStatus, string>;

type OwnershipsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnershipsPage({ searchParams }: OwnershipsPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const { user, activeOrganization } = gate;
  const organizationId = activeOrganization.organizationId;
  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: gate.memberships,
    userEmail: user.email,
    userName: user.name,
  };
  if (!can(activeOrganization.role, "ownerships", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const query = await searchParams;
  const filter = parseOwnershipListFilter(query.estado);
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  let page;
  try {
    page = await listOwnerships(organizationId, filter, cursor);
  } catch (error) {
    if (!(error instanceof OwnershipsIndexUnavailableError)) throw error;
    return (
      <AdminShell {...shellProps}>
        <section className={listStyles.content}>
          <div className={listStyles.stateCard} role="status">
            <h1>Titularidades</h1>
            <p>
              {error.reason === "building"
                ? "El índice de titularidades se está creando. Vuelve a intentarlo en unos minutos."
                : "Falta un índice de Firestore para esta vista. Avísale al administrador del sistema."}
            </p>
          </div>
        </section>
      </AdminShell>
    );
  }
  const [properties, people] = await Promise.all([
    getPropertySummaries(organizationId, page.rows.map((row) => row.propertyId)),
    getPersonSummaries(organizationId, page.rows.map((row) => row.personId)),
  ]);

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <div>
            <p className={listStyles.eyebrow}>CARTERA</p>
            <h1>Titularidades</h1>
            <p>Quién es dueño de cada propiedad, en qué porcentaje y en qué estado de verificación.</p>
          </div>
          {can(activeOrganization.role, "ownerships", "create") && (
            <div className={listStyles.headingActions}>
              <Link className={listStyles.applyButton} href="/admin/ownerships/new">
                <Plus aria-hidden="true" size={16} /> Nueva titularidad
              </Link>
            </div>
          )}
        </div>

        <section aria-label="Titularidades" className={listStyles.listCard}>
          <form action="/admin/ownerships" className={listStyles.filters} method="get">
            <label className={listStyles.filterField}>
              <span>Estado</span>
              <select defaultValue={filter} name="estado">
                {Object.entries(ownershipListFilters).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={listStyles.filterActions}>
              <button className={listStyles.applyButton} type="submit">
                Aplicar
              </button>
              <Link className={listStyles.resetLink} href="/admin/ownerships">
                Limpiar
              </Link>
            </div>
          </form>

          {page.rows.length > 0 ? (
            <div className={listStyles.tableScroller}>
              <table className={listStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">Propiedad</th>
                    <th scope="col">Titular</th>
                    <th scope="col">%</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Inicio</th>
                    <th scope="col">Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/admin/ownerships/${encodeURIComponent(row.id)}`}>
                          {properties.get(row.propertyId)?.name ?? "Propiedad no disponible"}
                        </Link>
                      </td>
                      <td>{people.get(row.personId)?.name ?? "Persona no disponible"}</td>
                      <td className={listStyles.numericCell}>{row.pct}%</td>
                      <td>
                        {row.active ? (
                          <span className={`${listStyles.statusBadge} ${listStyles[statusClasses[row.status]]}`}>
                            {ownershipStatusLabels[row.status]}
                          </span>
                        ) : (
                          <span className={`${listStyles.statusBadge} ${listStyles.status_inactive}`}>Finalizada</span>
                        )}
                      </td>
                      <td>{row.startDate}</td>
                      <td>{row.endDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={listStyles.emptyState}>
              <span className={listStyles.stateIcon}>
                <ScrollText aria-hidden="true" size={23} />
              </span>
              <h3>No hay titularidades en esta vista</h3>
              <p>Cambia el filtro o registra una titularidad nueva.</p>
            </div>
          )}

          {(cursor || page.nextCursor) && (
            <nav aria-label="Paginación" className={listStyles.pagination}>
              {cursor && (
                <Link className={listStyles.pageButton} href={`/admin/ownerships?estado=${filter}`}>
                  Primera página
                </Link>
              )}
              {page.nextCursor && (
                <Link
                  className={listStyles.pageButton}
                  href={`/admin/ownerships?estado=${filter}&cursor=${encodeURIComponent(page.nextCursor)}`}
                >
                  Siguiente página
                </Link>
              )}
            </nav>
          )}
        </section>
      </section>
    </AdminShell>
  );
}
```

- [ ] **Step 4: Manifiesto, menú e índices.**
  - `adminPagePermissions`: agregar `"/admin/ownerships": page("ownerships", "view", "Titularidades"),` y poner `"/admin/ownerships"` como padre de `/admin/ownerships/new` y `/admin/ownerships/[ownershipId]`.
  - Sección "Cartera": agregar `{ href: "/admin/ownerships", label: "Titularidades", module: "ownerships" }` después de Propiedades.
  - `admin-shell.tsx`: importar `ScrollText` y agregar `"/admin/ownerships": ScrollText` a `navigationIcons`.
  - `firestore.indexes.json` (antes del índice de `auditEvents`):

```json
    {
      "collectionGroup": "ownerships",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ownerships",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
```

- [ ] **Step 5:** `npm run test:unit`, `npm run typecheck`, `npm run lint` → limpios. No commit.

---

### Task 9: Visor de auditoría `/admin/audit`

**Files:**
- Create: `src/lib/audit/format.ts`, `src/lib/audit/format.test.ts`, `src/lib/audit/list.ts`, `src/app/admin/audit/page.tsx`
- Modify: `src/lib/access/route-permissions.ts`, `src/components/layout/admin-shell.tsx`, `firestore.indexes.json`

- [ ] **Step 1: Prueba que falla** — `format.test.ts`:

```ts
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
  assert.deepEqual(row.details, []);
});
```

- [ ] **Step 2:** `node --test src/lib/audit/format.test.ts` → FAIL.

- [ ] **Step 3: Implementar** `format.ts`:

```ts
import { auditAreas, type AuditArea } from "./area.ts";

export type AuditRow = {
  id: string;
  action: string;
  area: AuditArea | null;
  actorUid: string;
  createdAt: Date | null;
  href: string | null;
  details: { label: string; value: string }[];
};

const detailLabels: [field: string, label: string][] = [
  ["from", "De"],
  ["to", "A"],
  ["status", "Estado"],
  ["reason", "Motivo"],
  ["relationship", "Relación"],
  ["previousStaffRole", "Rol anterior"],
  ["staffRole", "Rol nuevo"],
  ["lane", "Portal"],
];

/** Admin page of the record an event is about, when there is one. */
export function auditTargetHref(action: string, targetId: string, propertyId: string | null) {
  const id = encodeURIComponent(targetId);
  switch (action.split(".")[0]) {
    case "person":
      return `/admin/people/${id}`;
    case "lease":
      return `/admin/leases/${id}`;
    case "ownership":
      return `/admin/ownerships/${id}`;
    case "member":
      return `/admin/users/${id}/edit`;
    case "stay_inquiry":
      return "/admin/stay-inquiries";
    case "property":
      return `/admin/properties/${encodeURIComponent(propertyId ?? targetId)}`;
    case "unit":
      return propertyId ? `/admin/properties/${encodeURIComponent(propertyId)}?tab=units` : null;
    default:
      return null;
  }
}

export function toAuditRow(id: string, data: Record<string, unknown>): AuditRow {
  const action = typeof data.action === "string" ? data.action : "";
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const propertyId = typeof data.propertyId === "string" ? data.propertyId : null;
  return {
    id,
    action,
    area: (auditAreas as readonly unknown[]).includes(data.area) ? (data.area as AuditArea) : null,
    actorUid: typeof data.actorUid === "string" ? data.actorUid : "",
    createdAt: typeof createdAt?.toDate === "function" ? createdAt.toDate() : null,
    href: typeof data.targetId === "string" ? auditTargetHref(action, data.targetId, propertyId) : null,
    details: detailLabels.flatMap(([field, label]) =>
      typeof data[field] === "string" && data[field] ? [{ label, value: data[field] as string }] : [],
    ),
  };
}
```

`list.ts`:

```ts
import "server-only";

import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getIndexUnavailableReason } from "@/lib/properties/list";
import type { AuditArea } from "./area";
import { toAuditRow } from "./format";

export const AUDIT_PAGE_SIZE = 50;

export class AuditIndexUnavailableError extends Error {
  constructor(
    readonly reason: "building" | "missing",
    options?: ErrorOptions,
  ) {
    super("A required Firestore audit index is not ready.", options);
    this.name = "AuditIndexUnavailableError";
  }
}

/** Newest first; filtering by area needs the (area, createdAt desc) index. */
export async function listAuditEvents(organizationId: string, area: AuditArea | null, cursor?: string) {
  const collection = getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("auditEvents");
  let query = (area ? collection.where("area", "==", area) : collection)
    .orderBy("createdAt", "desc")
    .limit(AUDIT_PAGE_SIZE + 1);
  if (cursor) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
  }
  const snapshot = await query.get().catch((error: unknown) => {
    const reason = getIndexUnavailableReason(error);
    if (reason) throw new AuditIndexUnavailableError(reason, { cause: error });
    throw error;
  });
  const documents = snapshot.docs.slice(0, AUDIT_PAGE_SIZE);
  return {
    rows: documents.map((document) => toAuditRow(document.id, document.data())),
    nextCursor: snapshot.docs.length > AUDIT_PAGE_SIZE ? documents.at(-1)!.id : null,
  };
}

/** Display name (or email) of each actor; unknown uids are left out. */
export async function getActorNames(uids: string[]) {
  const unique = [...new Set(uids.filter(Boolean))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;
  const { users } = await getFirebaseAdminAuth().getUsers(unique.map((uid) => ({ uid })));
  for (const user of users) names.set(user.uid, user.displayName || user.email || user.uid);
  return names;
}
```

`src/app/admin/audit/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PropertyAccessDenied } from "@/components/properties/property-access-denied";
import { requireAdminPage } from "@/lib/access/admin-page";
import { can } from "@/lib/access/permissions";
import { auditAreaLabels, auditAreas, type AuditArea } from "@/lib/audit/area";
import { getAuditActionLabel } from "@/lib/audit/labels";
import { AuditIndexUnavailableError, getActorNames, listAuditEvents } from "@/lib/audit/list";
import listStyles from "../properties/page.module.css";

export const metadata: Metadata = { title: "Auditoría" };

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return gate.denied;
  const { user, activeOrganization } = gate;
  const organizationId = activeOrganization.organizationId;
  const shellProps = {
    activeOrganizationId: organizationId,
    organizations: gate.memberships,
    userEmail: user.email,
    userName: user.name,
  };
  if (!can(activeOrganization.role, "audit", "view")) {
    return (
      <AdminShell {...shellProps}>
        <PropertyAccessDenied />
      </AdminShell>
    );
  }

  const query = await searchParams;
  const area = (auditAreas as readonly unknown[]).includes(query.area) ? (query.area as AuditArea) : null;
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  let page;
  try {
    page = await listAuditEvents(organizationId, area, cursor);
  } catch (error) {
    if (!(error instanceof AuditIndexUnavailableError)) throw error;
    return (
      <AdminShell {...shellProps}>
        <section className={listStyles.content}>
          <div className={listStyles.stateCard} role="status">
            <h1>Auditoría</h1>
            <p>
              {error.reason === "building"
                ? "El índice de auditoría se está creando. Vuelve a intentarlo en unos minutos."
                : "Falta un índice de Firestore para esta vista. Avísale al administrador del sistema."}
            </p>
          </div>
        </section>
      </AdminShell>
    );
  }
  const actors = await getActorNames(page.rows.map((row) => row.actorUid));
  const dateFormatter = new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: activeOrganization.timeZone,
  });
  const areaQuery = area ? `area=${area}` : "";

  return (
    <AdminShell {...shellProps}>
      <section className={listStyles.content}>
        <div className={listStyles.heading}>
          <div>
            <p className={listStyles.eyebrow}>ADMINISTRACIÓN</p>
            <h1>Auditoría</h1>
            <p>Cada cambio registrado en la organización, del más reciente al más antiguo.</p>
          </div>
        </div>

        <section aria-label="Eventos de auditoría" className={listStyles.listCard}>
          <form action="/admin/audit" className={listStyles.filters} method="get">
            <label className={listStyles.filterField}>
              <span>Área</span>
              <select defaultValue={area ?? ""} name="area">
                <option value="">Todas</option>
                {auditAreas.map((item) => (
                  <option key={item} value={item}>
                    {auditAreaLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <div className={listStyles.filterActions}>
              <button className={listStyles.applyButton} type="submit">
                Aplicar
              </button>
              <Link className={listStyles.resetLink} href="/admin/audit">
                Limpiar
              </Link>
            </div>
          </form>

          {page.rows.length > 0 ? (
            <div className={listStyles.tableScroller}>
              <table className={listStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Usuario</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Área</th>
                    <th scope="col">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.createdAt ? dateFormatter.format(row.createdAt) : "—"}</td>
                      <td>{actors.get(row.actorUid) ?? row.actorUid}</td>
                      <td>
                        {getAuditActionLabel(row.action)}
                        {row.details.length > 0 && (
                          <details>
                            <summary className={listStyles.muted}>Detalle</summary>
                            <dl>
                              {row.details.map((detail) => (
                                <div key={detail.label}>
                                  <dt>{detail.label}</dt>
                                  <dd>{detail.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </details>
                        )}
                      </td>
                      <td>{row.area ? auditAreaLabels[row.area] : "—"}</td>
                      <td>{row.href ? <Link href={row.href}>Abrir</Link> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={listStyles.emptyState}>
              <span className={listStyles.stateIcon}>
                <History aria-hidden="true" size={23} />
              </span>
              <h3>No hay eventos en esta vista</h3>
              <p>Los cambios que haga el equipo aparecerán aquí.</p>
            </div>
          )}

          {(cursor || page.nextCursor) && (
            <nav aria-label="Paginación" className={listStyles.pagination}>
              {cursor && (
                <Link className={listStyles.pageButton} href={`/admin/audit?${areaQuery}`}>
                  Primera página
                </Link>
              )}
              {page.nextCursor && (
                <Link
                  className={listStyles.pageButton}
                  href={`/admin/audit?${areaQuery}${areaQuery ? "&" : ""}cursor=${encodeURIComponent(page.nextCursor)}`}
                >
                  Siguiente página
                </Link>
              )}
            </nav>
          )}
        </section>
      </section>
    </AdminShell>
  );
}
```

- [ ] **Step 4: Manifiesto, menú e índice.**
  - `adminPagePermissions`: `"/admin/audit": page("audit", "view", "Auditoría"),`
  - Sección "Administración": agregar `{ href: "/admin/audit", label: "Auditoría", module: "audit" }` después de Usuarios y accesos.
  - `admin-shell.tsx`: importar `History` y agregar `"/admin/audit": History`.
  - `firestore.indexes.json`, junto al índice existente de `auditEvents`:

```json
    {
      "collectionGroup": "auditEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "area", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
```

- [ ] **Step 5:** `npm run test:unit`, `npm run typecheck`, `npm run lint` → limpios. No commit.

---

### Task 10: e2e — migas, filtros, auditoría y migración

**Files:**
- Create: `scripts/e2e/navigation.mjs`
- Modify: `package.json` (`test:e2e` agrega `&& node scripts/e2e/navigation.mjs`)

`scripts/e2e/permissions.mjs` no cambia: recorre `adminPagePermissions` y `adminNavigation`, así que ya cubre las dos páginas nuevas y las entradas nuevas del menú por rol.

- [ ] **Step 1: Crear la suite**:

```js
// E2E for the admin navigation (paso 4A): breadcrumbs with real names, the ownerships
// list filter, the audit viewer area filter and the audit `area` migration.
// Requires the emulators and a server on port 3100 (see README). Wipes demo-mghpm data.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import {
  api,
  check,
  db,
  finish,
  login,
  page,
  propertyWizardDefaults,
  resetEmulators,
  seedOrganization,
  signUp,
} from "./lib.mjs";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { FieldValue } = require("firebase-admin/firestore");

await resetEmulators();
const owner = await signUp("owner@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"]]);
const session = await login(owner.idToken);

let result = await api(session, "POST", "/api/properties", {
  ...propertyWizardDefaults,
  name: "Torre Migas",
  code: "TM-1",
  type: "apartment_condo",
  status: "active",
  address: "Calle 1",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO",
});
const propertyId = result.body?.propertyId;
result = await api(session, "POST", `/api/properties/${propertyId}/units`, {
  label: "101", floor: "1", bedrooms: 2, bathrooms: 1, status: "available", marketRent: "", marketRentCurrency: "USD",
});
const unitId = result.body?.unitId;
const createPerson = async (name, email) =>
  (await api(session, "POST", "/api/people", {
    kind: "individual", name, email, phone: "", status: "active", relationships: { owner: true, tenant: false },
  })).body?.personId;
const anaId = await createPerson("Ana Activa", "ana@example.test");
const beaId = await createPerson("Bea Finalizada", "bea@example.test");
const own = async (personId, pct) =>
  (await api(session, "POST", "/api/ownerships", {
    personId, propertyId, pct, startDate: "2024-01-01", titleOwner: "", titleNumber: "",
    registryNumber: "", cadastralNumber: "", registryAddress: "",
  })).body?.ownershipId;
const anaOwnership = await own(anaId, "60");
const beaOwnership = await own(beaId, "40");
result = await api(session, "POST", `/api/ownerships/${beaOwnership}/end`, {});
check("fixtures created", Boolean(propertyId && unitId && anaId && beaId && anaOwnership && beaOwnership) && result.status < 300,
  JSON.stringify({ propertyId, unitId, anaId, beaId, anaOwnership, beaOwnership, end: result.status }));

const crumbs = (html) => html.match(/<nav[^>]*aria-label="Migas de pan"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";

console.log("Breadcrumbs");
for (const [url, expected] of [
  ["/admin", ["Inicio", "Panel principal"]],
  [`/admin/properties/${propertyId}`, ["Propiedades", "Torre Migas"]],
  [`/admin/properties/${propertyId}/units/${unitId}/edit`, ["Torre Migas", "Editar unidad 101"]],
  [`/admin/people/${anaId}/edit`, ["Personas", "Ana Activa", "Editar"]],
  [`/admin/ownerships/${anaOwnership}`, ["Titularidades", "Ana Activa"]],
  ["/admin/audit", ["Inicio", "Auditoría"]],
]) {
  const nav = crumbs((await page(session, url)).html);
  check(`crumbs of ${url}`, expected.every((label) => nav.includes(label)), nav.replace(/<[^>]+>/g, " ").trim());
}

console.log("Ownerships filter");
const ownershipsHtml = async (estado) => (await page(session, `/admin/ownerships?estado=${estado}`)).html;
let html = await ownershipsHtml("activas");
check("activas lists the active ownership only", html.includes("Ana Activa") && !html.includes("Bea Finalizada"));
html = await ownershipsHtml("finalizadas");
check("finalizadas lists the ended ownership only", html.includes("Bea Finalizada") && !html.includes("Ana Activa"));
html = await ownershipsHtml("sin-iniciar");
check("sin-iniciar lists the new ownership", html.includes("Ana Activa"));
html = await ownershipsHtml("verificadas");
check("verificadas is empty", !html.includes("Ana Activa") && !html.includes("Bea Finalizada"));

console.log("Audit");
const events = await db.collection("organizations/org-a/auditEvents").get();
check("every audit event has an area", events.size > 0 && events.docs.every((doc) => typeof doc.get("area") === "string"),
  events.docs.filter((doc) => !doc.get("area")).map((doc) => doc.get("action")).join(","));
html = (await page(session, "/admin/audit?area=ownerships")).html;
check("area=ownerships shows ownership events only", html.includes("Titularidad creada") && !html.includes("Propiedad creada"));
html = (await page(session, "/admin/audit?area=properties")).html;
check("area=properties shows property events only", html.includes("Propiedad creada") && !html.includes("Titularidad creada"));

console.log("Migration");
const stripped = events.docs.slice(0, 2);
for (const doc of stripped) await doc.ref.update({ area: FieldValue.delete() });
const migrate = (...args) =>
  spawnSync(process.execPath, ["scripts/migrate-audit-area.mjs", ...args], {
    encoding: "utf8",
    env: { ...process.env, FIREBASE_PROJECT_ID: "demo-mghpm" },
  });
let run = migrate();
check("simulation counts without writing", run.stdout.includes("would_update=2"), run.stdout + run.stderr);
check("simulation leaves events untouched", !(await stripped[0].ref.get()).get("area"));
run = migrate("--yes");
check("--yes updates the two events", run.stdout.includes("updated=2"), run.stdout + run.stderr);
check("events have their area back", (await Promise.all(stripped.map((doc) => doc.ref.get()))).every((doc) => doc.get("area")));
run = migrate("--yes");
check("second run changes nothing", run.stdout.includes("updated=0"), run.stdout + run.stderr);

finish();
```

- [ ] **Step 2:** `package.json`: `test:e2e` termina en `&& node scripts/e2e/permissions.mjs && node scripts/e2e/navigation.mjs`.
- [ ] **Step 3:** Ejecutar la e2e completa (comando en "Reglas"). Expected: las 11 suites en verde. Detener el servidor y el emulador huérfano.
- [ ] **Step 4:** No commit.

---

### Task 11: Documentación y verificación final

**Files:**
- Modify: `design_handoff_mghpm/docs/PLAN-NEXTJS-FIREBASE.md`

- [ ] **Step 1:** Agregar en el plan maestro, después de "Avance registrado — 14 nov 2026 (paso 3…)", una sección "Avance registrado — 14 nov 2026 (paso 4A: navegación)" con: qué se hizo, los 3 índices nuevos (comandos abajo) y la migración pendiente en producción.
- [ ] **Step 2: Comandos de índices para el dueño (Cloud Shell)**:

```bash
gcloud firestore indexes composite create --project=<PROYECTO> --collection-group=ownerships --query-scope=COLLECTION --field-config=field-path=active,order=ascending --field-config=field-path=createdAt,order=descending
gcloud firestore indexes composite create --project=<PROYECTO> --collection-group=ownerships --query-scope=COLLECTION --field-config=field-path=active,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending
gcloud firestore indexes composite create --project=<PROYECTO> --collection-group=auditEvents --query-scope=COLLECTION --field-config=field-path=area,order=ascending --field-config=field-path=createdAt,order=descending
```

  (`<PROYECTO>` es el mismo id de proyecto usado para los índices de 2A-2.) Migración tras desplegar: `FIREBASE_PROJECT_ID=<PROYECTO> npm run migrate:audit-area` y luego con `-- --yes`.
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm run test:unit` y la e2e completa → todo en verde; puertos 3100 y 8080 libres.
- [ ] **Step 4: Lista de revisión manual** (para el dueño): menú expandido/contraído (títulos de sección, separadores, tooltips); cajón en móvil; migas largas en móvil (`… › penúltimo › último`) y en tablet; Titularidades con cada filtro; Auditoría con cada área y la fila "Detalle".
- [ ] **Step 5:** No commit.
