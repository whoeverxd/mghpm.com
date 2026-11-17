# Fase 2A-2 — Persona con relaciones y titularidad — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Una Persona (individual o entidad) puede tener varias relaciones.
- Los propietarios se vinculan a propiedades con titularidades que llevan % y verificación manual.
- Una cuenta puede abrir varios portales en la misma organización.
- Se crean la ficha de Persona, Owner 360 y Tenant 360, y "Mis propiedades" y "Mi contrato" en los portales.

**Architecture:**
- **Módulos puros** (probados con `node --test`):
  - `src/lib/people/relationships.ts`: modelo de persona y normalización.
  - `src/lib/ownerships/rules.ts`: estados, transiciones y porcentajes.
  - `src/lib/access/membership.ts`: membresía normalizada y regla de portales.
- **Servidor:** las colecciones se escriben en transacciones con auditoría, siguiendo el patrón de `src/lib/properties/units.ts`.
- **Autorización:** la tabla central de `src/lib/access/permissions.ts` gana el módulo `ownerships`. `requireLane` exige el portal otorgado **y** la relación activa.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, zod 4, Firebase Admin y Firestore, CSS Modules, `node:test` y los e2e de `scripts/e2e`.

**Spec:** `docs/superpowers/specs/2026-11-12-people-relationships-2a2-design.md`

**Reglas de trabajo:**
- **Commits:** no se hacen; el usuario los pide.
- **Datos:** sin datos de demostración.
- **Next 16:** consulta `node_modules/next/dist/docs/` cuando dudes, y ejecuta `npx next typegen` después de crear rutas.
- **Páginas de staff:** usan `requireAdminPage()` (`src/lib/access/admin-page.tsx`) y `can(...)`, igual que las existentes.
- **Fin de línea:** muchos archivos usan CRLF; consérvalo al editarlos.

---

## Cambios respecto al spec

- **Migración explícita.** El directorio filtra y cuenta en Firestore por campo. Una ficha antigua sin `relationshipTypes` no aparecería en los filtros nuevos, así que se añade `scripts/migrate-relationships.mjs`, idempotente y con `--dry-run`, que reescribe personas y membresías al formato nuevo. `normalizePerson` y `normalizeMembership` se conservan como red de seguridad en las lecturas individuales.
- **Índices nuevos** en `firestore.indexes.json`: `people` por `relationshipTypes` (`array-contains`) combinado con los filtros existentes, y `ownerships` por `personId` y por `propertyId`. El titular debe desplegarlos en el proyecto real.

---

## Mapa de archivos

**Crear**
- `src/lib/people/relationships.ts` y `relationships.test.ts`.
- `src/lib/ownerships/{rules.ts,rules.test.ts,schema.ts,records.ts,api.ts}`.
- `src/lib/access/membership.ts` y `membership.test.ts`.
- `src/app/api/ownerships/route.ts` y `[ownershipId]/route.ts`, `[ownershipId]/status/route.ts`, `[ownershipId]/end/route.ts`.
- `src/app/admin/people/[personId]/page.tsx` (ficha de Persona), `propietario/page.tsx` (Owner 360) e `inquilino/page.tsx` (Tenant 360).
- `src/app/admin/ownerships/new/page.tsx` y `[ownershipId]/page.tsx`.
- `src/components/ownerships/{ownership-form.tsx,ownership-review.tsx,ownerships.module.css}`.
- `src/components/people/{person-header.tsx,relationship-badges.tsx}`.
- `src/app/propietario/propiedades/page.tsx` y `src/app/inquilino/contrato/page.tsx`.
- `scripts/migrate-relationships.mjs` y `scripts/e2e/ownerships.mjs`.

**Modificar**
- `package.json`: glob de `test:unit`, `test:e2e` y un script `migrate:relationships`.
- `src/lib/access/permissions.ts`, `workspaces.ts` y `authorize.ts`.
- `src/lib/auth/organization.ts`.
- `src/lib/people/{schema.ts,search-index.ts,records.ts,list.ts,labels.ts}`.
- `src/components/people/person-form.tsx` y `src/app/admin/people/**`.
- `src/lib/members/{schema.ts,roles.ts,records.ts}` y `src/components/members/*` (formularios).
- `src/lib/leases/records.ts` y el selector de inquilino de `src/components/leases/*`.
- `src/app/admin/properties/[propertyId]/page.tsx`, con la pestaña "Propietarios".
- `src/components/access/portal-shell.tsx`, para el menú por portal.
- `firestore.indexes.json` y `README.md`.
- Los e2e `people.mjs`, `members.mjs` y `leases.mjs`.

---

### Task 1: Modelo puro de Persona y relaciones

**Files:** Create `src/lib/people/relationships.ts` y `src/lib/people/relationships.test.ts`. Modify `package.json`.

- [ ] **Step 1: Glob de pruebas**

En `package.json`:

```json
    "test:unit": "node --test \"src/lib/**/*.test.ts\"",
```

- [ ] **Step 2: Prueba que falla**

`src/lib/people/relationships.test.ts`:

```ts
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
```

Run: `npm run test:unit`. Expected: FAIL, porque el módulo no existe.

- [ ] **Step 3: Implementar**

`src/lib/people/relationships.ts`:

```ts
export const personKinds = ["individual", "entity"] as const;
export const entityTypes = ["trust", "company", "co_ownership", "other"] as const;
export const relationshipTypes = ["owner", "tenant", "applicant", "guest", "owner_prospect"] as const;

export type PersonKind = (typeof personKinds)[number];
export type EntityType = (typeof entityTypes)[number];
export type RelationshipType = (typeof relationshipTypes)[number];

type RelationshipDate = Date | { toDate(): Date };

export type Relationship = {
  status: "active" | "ended";
  since: RelationshipDate;
  endedAt?: RelationshipDate | null;
  propertyId?: string | null;
  unitId?: string | null;
};

export type Relationships = Partial<Record<RelationshipType, Relationship>>;

/** Active relationship types in a stable order (used for relationshipTypes and badges). */
export function activeRelationshipTypes(relationships: Relationships): RelationshipType[] {
  return relationshipTypes.filter((type) => relationships[type]?.status === "active");
}

export function hasActiveRelationship(relationships: Relationships, type: RelationshipType) {
  return relationships[type]?.status === "active";
}

export function upsertRelationship(
  relationships: Relationships,
  type: RelationshipType,
  since: RelationshipDate,
  extra: Pick<Relationship, "propertyId" | "unitId"> = {},
): Relationships {
  const current = relationships[type];
  return {
    ...relationships,
    [type]: {
      ...current,
      ...extra,
      status: "active",
      since: current?.status === "active" ? current.since : since,
      endedAt: null,
    },
  };
}

export function endRelationship(
  relationships: Relationships,
  type: RelationshipType,
  endedAt: RelationshipDate,
): Relationships {
  const current = relationships[type];
  if (!current || current.status === "ended") return relationships;
  return { ...relationships, [type]: { ...current, status: "ended", endedAt } };
}

type LegacyOrNew = {
  type?: "owner" | "tenant";
  kind?: PersonKind;
  contactName?: string;
  propertyId?: string | null;
  unitId?: string | null;
  relationships?: Relationships;
  createdAt?: RelationshipDate;
};

/**
 * Reads legacy single-type people (type owner|tenant) as the new model.
 * New-format documents are returned unchanged.
 */
export function normalizePersonIdentity(data: LegacyOrNew): { kind: PersonKind; relationships: Relationships } {
  if (data.kind && data.relationships) return { kind: data.kind, relationships: data.relationships };
  const since = data.createdAt ?? new Date(0);
  if (data.type === "tenant") {
    return {
      kind: "individual",
      relationships: {
        tenant: { status: "active", since, propertyId: data.propertyId ?? null, unitId: data.unitId ?? null },
      },
    };
  }
  return {
    kind: data.contactName ? "entity" : "individual",
    relationships: data.type === "owner" ? { owner: { status: "active", since } } : {},
  };
}
```

Run: `npm run test:unit`. Expected: todo PASS.

- [ ] **Step 4: Punto de control.** Run: `npm run typecheck && npm run lint`.

---

### Task 2: Reglas puras de titularidad

**Files:** Create `src/lib/ownerships/rules.ts` y `rules.test.ts`.

- [ ] **Step 1: Prueba que falla**

`src/lib/ownerships/rules.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { availablePct, canTransition, isValidPct, roundPct } from "./rules.ts";

test("transitions follow the review flow", () => {
  assert.equal(canTransition("not_started", "in_review"), true);
  assert.equal(canTransition("not_started", "verified"), false);
  assert.equal(canTransition("in_review", "verified"), true);
  assert.equal(canTransition("in_review", "rejected"), true);
  assert.equal(canTransition("rejected", "in_review"), true);
  assert.equal(canTransition("verified", "in_review"), true);
  assert.equal(canTransition("verified", "rejected"), false);
});

test("percentages", () => {
  assert.equal(roundPct(33.333), 33.33);
  assert.equal(isValidPct(0), false);
  assert.equal(isValidPct(100), true);
  assert.equal(isValidPct(100.01), false);
  assert.equal(availablePct([75, 20]), 5);
  assert.equal(availablePct([33.33, 33.33, 33.34]), 0);
});
```

Run: `npm run test:unit`. Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/lib/ownerships/rules.ts`:

```ts
export const ownershipStatuses = ["not_started", "documents_pending", "in_review", "verified", "rejected"] as const;
export type OwnershipStatus = (typeof ownershipStatuses)[number];

export const ownershipChecks = [
  "deedOnFile",
  "recordMatches",
  "ownerIdentity",
  "entityGoodStanding",
  "coOwnerAuthorization",
  "managementAgreement",
] as const;
export type OwnershipCheck = (typeof ownershipChecks)[number];

const transitions: Record<OwnershipStatus, OwnershipStatus[]> = {
  not_started: ["documents_pending", "in_review"],
  documents_pending: ["in_review"],
  in_review: ["verified", "rejected", "documents_pending"],
  rejected: ["in_review"],
  verified: ["in_review"],
};

export function canTransition(from: OwnershipStatus, to: OwnershipStatus) {
  return transitions[from].includes(to);
}

/** Percentages are stored with two decimals; sums are compared in hundredths to avoid float drift. */
export function roundPct(value: number) {
  return Math.round(value * 100) / 100;
}

export function isValidPct(value: number) {
  return Number.isFinite(value) && value >= 0.01 && value <= 100 && roundPct(value) === value;
}

export function availablePct(activePcts: number[]) {
  const usedHundredths = activePcts.reduce((sum, pct) => sum + Math.round(pct * 100), 0);
  return Math.max(0, 10000 - usedHundredths) / 100;
}
```

Run: `npm run test:unit`. Expected: PASS.

- [ ] **Step 3: Punto de control.** Run: `npm run typecheck && npm run lint`.

---

### Task 3: Membresía normalizada, permisos y regla de portales

**Files:**
- Create `src/lib/access/membership.ts` y `membership.test.ts`.
- Modify `src/lib/access/permissions.ts`, `permissions.test.ts` y `workspaces.ts`/`workspaces.test.ts`.

- [ ] **Step 1: Prueba que falla**

`src/lib/access/membership.test.ts`:

```ts
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
```

Run: `npm run test:unit`. Expected: FAIL.

- [ ] **Step 2: Implementar `membership.ts`**

```ts
import type { OrganizationRole } from "@/lib/auth/organization-schema";
import type { Lane } from "./permissions.ts";

export const staffRoles = ["org_owner", "admin", "manager", "operations"] as const;
export const portalLanes = ["owner", "tenant", "applicant", "guest"] as const;
export type StaffRole = (typeof staffRoles)[number];
export type PortalLane = (typeof portalLanes)[number];

export type NormalizedMembership = {
  staffRole: StaffRole | null;
  portals: PortalLane[];
  portalPersonIds: Partial<Record<PortalLane, string>>;
  status: string;
};

type RawMembership = {
  role?: OrganizationRole;
  staffRole?: StaffRole | null;
  portals?: PortalLane[];
  portalPersonIds?: Partial<Record<PortalLane, string>>;
  personId?: string | null;
  status: string;
};

const isStaffRole = (role: string): role is StaffRole => (staffRoles as readonly string[]).includes(role);
const isPortalLane = (role: string): role is PortalLane => (portalLanes as readonly string[]).includes(role);

/** Reads the legacy single `role` and the new staffRole + portals shape. */
export function normalizeMembership(raw: RawMembership): NormalizedMembership {
  if (raw.staffRole !== undefined || raw.portals !== undefined) {
    return {
      staffRole: raw.staffRole ?? null,
      portals: (raw.portals ?? []).filter(isPortalLane),
      portalPersonIds: raw.portalPersonIds ?? {},
      status: raw.status,
    };
  }
  const role = raw.role ?? "";
  return {
    staffRole: isStaffRole(role) ? role : null,
    portals: isPortalLane(role) ? [role] : [],
    portalPersonIds: isPortalLane(role) && raw.personId ? { [role]: raw.personId } : {},
    status: raw.status,
  };
}

/** Lanes a membership grants by itself; portal lanes still need an active relationship (see authorize). */
export function membershipLanes(membership: NormalizedMembership): Lane[] {
  return [...(membership.staffRole ? (["admin"] as Lane[]) : []), ...membership.portals];
}
```

- [ ] **Step 3: Permisos `ownerships` y `review`**

En `permissions.ts`:
- agrega `"ownerships"` a `staffModules`;
- agrega `"review"` al tipo `StaffAction`;
- en la matriz:
  - `fullAccess` → `ownerships: [...operate, "review"]`;
  - `manager` → `ownerships: operate`;
  - `operations` → `ownerships: ["view"]`.

En `permissions.test.ts` agrega:

```ts
test("ownership review is restricted", () => {
  assert.equal(can("admin", "ownerships", "review"), true);
  assert.equal(can("manager", "ownerships", "update"), true);
  assert.equal(can("manager", "ownerships", "review"), false);
  assert.equal(can("operations", "ownerships", "view"), true);
  assert.equal(can("operations", "ownerships", "create"), false);
});
```

- [ ] **Step 4: Espacios con varios carriles**

Cambia `workspaces.ts` para que una membresía genere **un espacio por carril**:
- `MembershipLike` pasa a tener `organizationId`, `organizationName` y `membership: NormalizedMembership`. Si `role` sigue existiendo en el tipo de organización, se ignora aquí.
- `listWorkspaces` hace `flatMap` sobre `membershipLanes(m.membership)`.
- `resolveWorkspace(memberships, selectedOrganizationId, lane)` no cambia de lógica.

Actualiza `workspaces.test.ts`: construye cada membresía con `membership: normalizeMembership({ role, status: "active" })` y añade un caso de staff + propietario en la misma organización, que debe producir 2 espacios.

`laneForRole` se conserva por compatibilidad, pero `listWorkspaces` ya no lo usa.

Run: `npm run test:unit && npm run typecheck`. Corrige los usos de `listWorkspaces` y `resolveWorkspace` en el servidor en la Task 4.

---

### Task 4: Servidor de acceso con membresías nuevas

**Files:** Modify `src/lib/auth/organization.ts`, `src/lib/access/authorize.ts`, `src/lib/access/admin-page.tsx` y `src/app/api/organizations/active/route.ts`.

- [ ] **Step 1: `listUserOrganizations` devuelve la membresía normalizada**
- El `membershipSchema` acepta los dos formatos: `role` opcional, `staffRole`, `portals`, `portalPersonIds` y `personId`, todos opcionales.
- Cada `OrganizationMembership` incluye `membership: NormalizedMembership`. Se conserva `role`, calculado como `staffRole ?? portals[0] ?? role antiguo`, porque las páginas `/admin` lo usan como rol de staff.
- El filtro `status === "active"` se mantiene.

- [ ] **Step 2: `requireLane` verifica la relación**

En `authorize.ts`, cuando `lane !== "admin"`:
1. Se toma `personId = workspace.membership.portalPersonIds[lane]`.
2. Se lee la Persona con `getOrganizationPerson`.
3. Se deniega con `forbidden` si falta el `personId`, la Persona está archivada o no tiene la relación activa del mismo tipo. Usa `normalizePersonIdentity` y `hasActiveRelationship`.
4. El `AccessGrant` gana `personId: string | null`, que es la Persona del carril.

Para `admin`, `role = workspace.membership.staffRole`; si no hay `staffRole`, se deniega. `requireStaffPermission` sigue usando `can(staffRole, ...)`.

- [ ] **Step 3: Compatibilidad de las páginas**
- `admin-page.tsx` devuelve `role` = `staffRole`. Revisa que `activeOrganization.role` siga siendo el rol de staff.
- `src/components/access/portal-pages.tsx`: `PortalProfile` recibe el `personId` del grant y ya no `workspace.personId`.
- Busca todos los usos de `workspace.personId` y `access.workspace.personId` y cámbialos a `access.personId`.

- [ ] **Step 4: Cambio de espacio**

`POST /api/organizations/active` acepta `{ organizationId, lane? }`:
- valida que la membresía otorgue ese carril con `membershipLanes`;
- registra `lane` en la auditoría;
- la cookie sigue guardando solo la organización.

Si hay varias organizaciones con el mismo carril, `resolveWorkspace` usa la cookie. El picker de `/espacios` envía `lane` y navega a `getLaneHomePath(lane)`.

- [ ] **Step 5: Punto de control.** Run: `npx next typegen && npm run typecheck && npm run lint && npm run test:unit`.

---

### Task 5: Personas con kind y relaciones (servidor y esquemas)

**Files:** Modify `src/lib/people/{schema.ts,search-index.ts,records.ts,list.ts,labels.ts,api.ts}` y `firestore.indexes.json`.

- [ ] **Step 1: Esquema de entrada.** `personInputSchema` deja de ser una unión por `type`. Pasa a ser un objeto:
  - `kind` (`individual` o `entity`);
  - `name`, `email`, `phone` y `status` (los `personFields` actuales);
  - `entityType` (obligatorio si es entidad), `taxId` (hasta 30 caracteres) y `representativeId` (opcional);
  - `contactName` (solo entidades);
  - `relationships: { owner: boolean, tenant: boolean }`, con al menos uno en `true`;
  - `tenantPropertyId` y `tenantUnitId`, con la misma regla actual: la unidad exige la propiedad.

  Usa `superRefine` para las reglas condicionales, con mensajes en español.
- [ ] **Step 2: Esquema de documento.** `personDocumentSchema` agrega `kind`, `entityType`, `taxId`, `representativeId`, `relationships` (un mapa validado con zod usando `relationshipTypes`) y `relationshipTypes`. Todos son opcionales para admitir documentos sin migrar. `type` pasa a ser opcional. `parsePerson` devuelve siempre la forma normalizada con `normalizePersonIdentity`, y `Person` gana `kind`, `relationships` y `relationshipTypes`.
- [ ] **Step 3: Escritura** (`createOrganizationPerson` / `updateOrganizationPerson`):
  - La reserva de email pasa a ser por `kind` y email (id `sha256("kind:" + emailKey)`). Si un documento antiguo tiene una reserva por tipo, se libera al guardar y se crea la nueva por `kind`, todo en la misma transacción. El error `PersonEmailConflictError` (o el existente) se mantiene.
  - Las relaciones se calculan con `upsertRelationship` y `endRelationship` a partir de las casillas: marcar Inquilino activa `tenant` con su propiedad y unidad (validadas con el `assertTenantLink` existente); desmarcar finaliza la relación.
  - **No se puede finalizar `tenant` si la persona tiene un contrato activo**: devuelve 409 con el mensaje "Tiene un contrato activo".
  - Se escriben `relationshipTypes = activeRelationshipTypes(...)`, `kind` y los campos de entidad, y `type` se elimina con `FieldValue.delete()`.
  - Se valida que `representativeId` exista, sea `individual`, no esté archivado y no sea la misma persona.
  - Se audita `person.relationship_added` y `person.relationship_ended` por cada cambio, además del evento actual.
  - `PersonTypeChangeError` desaparece, porque ya no aplica.
- [ ] **Step 4: Búsqueda y listado.**
  - `search-index.ts`: el filtro `type` pasa a ser `relationship` (`owner`, `tenant` o vacío); `getPersonFilterKey` usa `relationship=`.
  - `list.ts`: la consulta usa `where("relationshipTypes", "array-contains", relationship)` en lugar de `where("type", "==", …)`. Los conteos por pestaña se hacen con `array-contains` por cada relación.
  - `listPersonAccountOptions` devuelve `{ id, name, email, relationshipTypes }`.
  - `labels.ts`: añade las etiquetas de `kind`, `entityType` y de cada relación.
- [ ] **Step 5: Índices.** En `firestore.indexes.json`, duplica cada índice compuesto actual de `people` que empiece por `type`, cambiando `type` por `relationshipTypes` con `"arrayConfig": "CONTAINS"`. Añade dos índices de `ownerships`: `personId` + `active`, y `propertyId` + `active`.
- [ ] **Step 6: Punto de control.** Run: `npm run typecheck && npm run lint && npm run test:unit`. Corrige los usos de `person.type` en todo `src/` (grep `\.type\b` en archivos de people, members y leases) sustituyéndolos por `relationshipTypes` o `hasActiveRelationship`.

---

### Task 6: Script de migración

**Files:** Create `scripts/migrate-relationships.mjs`. Modify `package.json` y `README.md`.

- [ ] **Step 1: Script.** Usa el patrón de inicialización de `scripts/e2e/lib.mjs`, pero contra el proyecto que indiquen las variables de entorno (sin forzar emuladores). Para cada organización (`--org <id>` o todas):
  - **Personas sin `relationships`:** escribe `kind`, `relationships`, `relationshipTypes` y la reserva de email nueva (la antigua se conserva), según `normalizePersonIdentity`. Reimplementa la misma lógica en JS: es corta y no se pueden importar archivos `.ts` desde `.mjs`. Recalcula `searchKeys` y `filterKeys` con las mismas reglas de `search-index.ts`.
  - **Membresías sin `staffRole` ni `portals`:** escribe `staffRole`, `portals` y `portalPersonIds` según `normalizeMembership`. Conserva `role` por compatibilidad.
  - **`--dry-run`:** solo imprime los cambios.
  - Es idempotente: no toca los documentos que ya están en formato nuevo.
  - Al final imprime los conteos.
- [ ] **Step 2: `package.json`:** `"migrate:relationships": "node scripts/migrate-relationships.mjs"`.
- [ ] **Step 3: README.** Añade una sección "Migración 2A-2" con este orden: desplegar índices, `--dry-run`, ejecutar y verificar.
- [ ] **Step 4:** Prueba el script contra los emuladores en la Task 13 (una persona antigua sembrada a mano en el e2e).

---

### Task 7: Titularidades (servidor y API)

**Files:**
- Create `src/lib/ownerships/{schema.ts,records.ts,api.ts}`.
- Create `src/app/api/ownerships/route.ts`, `[ownershipId]/route.ts`, `[ownershipId]/status/route.ts` y `[ownershipId]/end/route.ts`.

- [ ] **Step 1: `schema.ts` (zod)**
  - `ownershipInputSchema`: `personId`, `propertyId`, `pct` (cadena decimal → número, validado con `isValidPct`), `startDate` (fecha `YYYY-MM-DD`) y los campos del título como cadenas recortadas de hasta 120 caracteres; `registryAddress` hasta 200.
  - `ownershipUpdateSchema`: los mismos campos sin `personId` ni `propertyId`, más `checks` (objeto de booleanos según `ownershipChecks`).
  - `ownershipStatusInputSchema`: `{ to: OwnershipStatus, reason?: string }`. `reason` es obligatorio con `rejected`, entre 3 y 500 caracteres.
  - `ownershipDocumentSchema`: todos los campos del spec.
- [ ] **Step 2: `records.ts` (server-only)**, todo en transacciones con auditoría:
  - `createOwnership(org, actorUid, input)`:
    - lee la persona (debe existir y no estar archivada), la propiedad (debe existir) y las titularidades activas de la propiedad (`where propertyId == … and active == true`);
    - rechaza un duplicado activo de la misma persona con `OwnershipConflictError("duplicate")`;
    - rechaza si `availablePct` es menor que `pct`, con `OwnershipConflictError("over_100")`;
    - crea la titularidad con `status: "not_started"`, los `checks` en false y `active: true`;
    - actualiza la proyección de la propiedad (`ownerPersonIds`, `ownershipTotalPct`);
    - hace `upsertRelationship(owner)` en la persona (con `relationshipTypes`);
    - audita `ownership.created`.
  - `updateOwnership(org, actorUid, id, input)`:
    - si cambia `pct`, vuelve a validar el 100 % excluyéndose a sí misma;
    - si estaba `verified` y cambian los datos del título o el %, pasa a `in_review` y lo audita como cambio de estado con el motivo "Datos modificados";
    - audita `ownership.updated`.
  - `changeOwnershipStatus(org, actor, id, to, reason)`:
    - valida la transición con `canTransition`; si no es válida, `OwnershipTransitionError`;
    - para `verified` y `rejected` exige `can(actor.role, "ownerships", "review")` y `createdBy !== actor.uid`; si no, `OwnershipReviewForbiddenError`;
    - fija `reviewerUid`, `reviewedAt` y `rejectionReason`;
    - audita `ownership.status_changed` con `from`, `to` y `reason`.
  - `endOwnership(org, actorUid, id, endDate)`: pone `active: false` y `endedAt`, recalcula la proyección y audita `ownership.ended`.
  - Lecturas:
    - `getOwnership(org, id)`;
    - `listPersonOwnerships(org, personIds: string[])`, que acepta varias personas para el propietario que representa entidades;
    - `listPropertyOwnerships(org, propertyId)`.
- [ ] **Step 3: `api.ts`.** `getOwnershipErrorResponse(error)` traduce los errores: duplicado y más de 100 % → 409 con "Ya existe…" o "Solo queda X % disponible."; transición → 409; revisión prohibida → 403; no encontrado → 404; el resto → 500 genérico. Los mensajes van en español.
- [ ] **Step 4: Rutas**, todas con `readJsonRequestBody` (CSRF) y `getManagementWriteAccess("ownerships", msg, action)`, con estas acciones:
  - POST `/api/ownerships` → `create`;
  - PATCH `/api/ownerships/[id]` → `update`;
  - POST `/api/ownerships/[id]/status` → `update`; la comprobación de `review` va dentro de `records`;
  - POST `/api/ownerships/[id]/end` → `archive`.

  Valida los ids con `recordIdSchema`.
- [ ] **Step 5: Punto de control.** Run: `npm run typecheck && npm run lint && npm run test:unit`.

---

### Task 8: Contratos y la relación de inquilino

**Files:** Modify `src/lib/leases/records.ts` y el selector de inquilino en `src/components/leases/*` (busca dónde se listan las personas de tipo `tenant`).

- [ ] **Step 1: Validación del inquilino.** Donde se comprueba `person.type === "tenant"` (alrededor de `records.ts:173` y en la validación de partes), acepta a cualquier Persona `individual` no archivada. El contrato se encarga de crear la relación.
- [ ] **Step 2: Activación.** En la transición a `active` (alrededor de `records.ts:448`), además de lo actual, escribe `relationships.tenant` con `upsertRelationship(…, { propertyId, unitId })` y `relationshipTypes`, y audita `person.relationship_added` si la relación es nueva.
- [ ] **Step 3: Terminación y vencimiento.** Cuando el contrato deja de estar activo (alrededor de `records.ts:493`): si la persona no tiene **otro** contrato `active` (consulta `leases` por `tenantId` y `status == active` dentro de la transacción, excluyendo el actual), finaliza la relación `tenant` con `endRelationship` y audita.
- [ ] **Step 4: Selector.** El alta de contrato lista las personas `individual` activas. Muestra primero las que tienen la relación `tenant` y luego el resto, con la etiqueta "(sin relación de inquilino)".
- [ ] **Step 5: Punto de control.** Run: `npm run typecheck && npm run lint`.

---

### Task 9: Usuarios y accesos con rol interno y portales

**Files:** Modify `src/lib/members/{schema.ts,roles.ts,records.ts,api.ts}` y `src/components/members/{member-create-form.tsx,member-access-form.tsx}`, más las páginas `src/app/admin/users/**` que pasan los datos.

- [ ] **Step 1: Esquemas.**
  - `memberCreateInputSchema`: `email` y `displayName` como hoy, `staffRole` (`""`, `admin`, `manager` u `operations`) y `portals: { owner: personId | "", tenant: personId | "" }`. Debe haber al menos un `staffRole` o un portal.
  - `memberUpdateInputSchema`: `staffRole`, `portals` y `status`, con la regla de estados que ya existe.
- [ ] **Step 2: Reglas en `records.ts`.**
  - `canManageRole` se aplica al `staffRole`.
  - Por cada portal con una persona:
    - la persona existe y no está archivada;
    - tiene la relación activa del portal (`hasActiveRelationship`);
    - su `emailKey` coincide con el email de la cuenta;
    - su `accountUid` está vacío o ya es este uid.
  - Errores: `MemberPersonLinkError` con las razones existentes, más `"relationship"`.
  - Se escriben `staffRole`, `portals`, `portalPersonIds` y `status`, y se elimina `role` con `FieldValue.delete()`.
  - Al quitar un portal se limpia el `accountUid` de esa persona si ya no la usa otro portal.
  - Se audita `member.portals_changed` con antes y después, además de los eventos actuales.
- [ ] **Step 3: Lectura.** `listOrganizationMembers` usa `normalizeMembership` y devuelve `staffRole`, `portals`, `portalPersonIds` y los nombres de las personas.
- [ ] **Step 4: Formularios.**
  - Una sección "Rol interno" con un select que permite "Sin rol interno".
  - Una sección "Portales" con las casillas Propietario e Inquilino, cada una con un select de personas que tienen esa relación activa (de `listPersonAccountOptions`).
  - En la lista de usuarios se muestran el rol interno y los portales como insignias.
- [ ] **Step 5:** `src/lib/members/api.ts` mapea la razón `"relationship"` → 409 con "La persona no tiene una relación activa de ese tipo."
- [ ] **Step 6: Punto de control.** Run: `npm run typecheck && npm run lint`.

---

### Task 10: Pantallas de Personas

**Files:** Modify `src/components/people/person-form.tsx` y `src/app/admin/people/{page.tsx,new/page.tsx,[personId]/edit/page.tsx}`. Create `src/app/admin/people/[personId]/page.tsx`, `[personId]/propietario/page.tsx`, `[personId]/inquilino/page.tsx` y `src/components/people/{person-header.tsx,relationship-badges.tsx}`.

- [ ] **Step 1: Formulario.**
  - Selector `kind` con "Persona" y "Entidad". Si es entidad, aparecen `entityType`, `taxId`, `contactName` y un select de representante (personas individuales activas).
  - Las casillas Propietario e Inquilino sustituyen al selector de tipo; Inquilino muestra la propiedad y la unidad, como hoy.
  - `/new?type=tenant` se interpreta como la casilla Inquilino marcada.
- [ ] **Step 2: Directorio.**
  - Las pestañas filtran por `relationship` con los mismos parámetros de URL. `?type=` se mantiene como alias de `relationship`.
  - Cada fila muestra `RelationshipBadges` y una insignia "Entidad".
  - El nombre enlaza a `/admin/people/{id}`, la ficha nueva.
- [ ] **Step 3: Ficha de Persona** (`/admin/people/[personId]`):
  - `PersonHeader`: nombre, `kind`, insignias, estado y botón "Editar" si se puede `update`.
  - Datos de contacto e identidad.
  - El representante con enlace, o "Representa a" con las entidades cuyo `representativeId` es esta persona (consulta `people where representativeId == id`).
  - Tarjetas de relación: "Ver como propietario" → `/propietario` y "Ver como inquilino" → `/inquilino`.
  - "Acceso a portales": busca la membresía cuyo `portalPersonIds` contenga este id; a falta de un índice, recorre las membresías de la organización con `MEMBER_LIST_LIMIT`. Muestra portales y estado, con enlace a `/admin/users/{uid}/edit` si se puede `members` `view`.
  - Actividad: los últimos 20 `auditEvents` con `targetId == personId` (si hace falta, añade el índice `auditEvents` `targetId` + `createdAt desc`).
- [ ] **Step 4: Owner 360** (`/admin/people/[personId]/propietario`), solo si la persona tiene la relación `owner`; si no, `notFound()`:
  - KPIs: titularidades activas, verificadas y pendientes de revisión (`in_review`).
  - Tabla con `listPersonOwnerships(org, [personId])`: propiedad (con enlace), %, estado (con etiqueta), última revisión y enlace a `/admin/ownerships/{id}`.
  - Botón "Agregar propiedad" → `/admin/ownerships/new?personId=…` si se puede `ownerships` `create`.
  - Actividad.
- [ ] **Step 5: Tenant 360** (`/admin/people/[personId]/inquilino`), solo si la persona tiene la relación `tenant` (activa o finalizada):
  - KPIs del contrato activo: renta (con moneda), fecha de fin y depósito.
  - Lista de contratos de esta persona (consulta `leases where tenantId == personId`, ordenados por inicio descendente) con enlace a `/admin/leases/{id}`.
  - Actividad.
- [ ] **Step 6: Punto de control.** Run: `npx next typegen && npm run typecheck && npm run lint`.

---

### Task 11: Pantallas de titularidad y pestaña "Propietarios"

**Files:** Create `src/app/admin/ownerships/new/page.tsx`, `src/app/admin/ownerships/[ownershipId]/page.tsx` y `src/components/ownerships/{ownership-form.tsx,ownership-review.tsx,ownerships.module.css}`. Modify `src/app/admin/properties/[propertyId]/page.tsx`.

- [ ] **Step 1: Alta.** Página con `requireAdminPage` y `can(role, "ownerships", "create")`. `OwnershipForm` (cliente):
  - si llega `personId`, la persona queda fija y se elige la propiedad; si llega `propertyId`, al revés. Los selects se llenan en el servidor;
  - muestra el porcentaje disponible (`availablePct` de las titularidades activas de esa propiedad);
  - envía POST `/api/ownerships` con CSRF (patrón de `unit-form.tsx`) y redirige al detalle.
- [ ] **Step 2: Detalle.**
  - Encabezado con persona, propiedad, %, estado e insignia "Finalizada" si no está activa.
  - Formulario de edición, si se puede `update` y la titularidad está activa.
  - `OwnershipReview` (cliente):
    - las seis casillas `checks`, que se guardan con PATCH;
    - los botones de transición disponibles según `canTransition` y el permiso: "Marcar documentos pendientes", "Pasar a revisión", "Aprobar", "Rechazar" (pide el motivo) y "Reabrir revisión";
    - "Aprobar" y "Rechazar" solo aparecen con `review` y si `createdBy !== uid`. En ese caso se muestra la nota "Otra persona debe revisar esta titularidad".
  - Historial de revisiones: los `auditEvents` `ownership.status_changed` de esta titularidad.
  - "Finalizar titularidad" (pide la fecha), si se puede `archive`.
- [ ] **Step 3: Pestaña "Propietarios"** en el detalle de propiedad:
  - añade `owners` al `tab` permitido y a la lista de pestañas;
  - tabla con `listPropertyOwnerships`: persona (enlace a su Owner 360), %, estado y enlace al detalle;
  - "Total asignado: X % de 100 %";
  - botón "Agregar propietario" → `/admin/ownerships/new?propertyId=…` si se puede `create`.
- [ ] **Step 4: Punto de control.** Run: `npx next typegen && npm run typecheck && npm run lint`.

---

### Task 12: Contenido de los portales

**Files:** Create `src/app/propietario/propiedades/page.tsx` y `src/app/inquilino/contrato/page.tsx`. Modify `src/components/access/portal-shell.tsx`.

- [ ] **Step 1: Menú del portal.** `PortalShell` añade enlaces según el carril: propietario → "Mis propiedades" (`/propietario/propiedades`); inquilino → "Mi contrato" (`/inquilino/contrato`). Se conservan Inicio y Mi perfil.
- [ ] **Step 2: Mis propiedades.**
  - `requireLane("owner")`; si no es `allowed`, devuelve `null`.
  - `personIds` = `[access.personId, …ids de entidades con representativeId == access.personId]`.
  - `listPersonOwnerships(org, personIds)` filtrado a `active && status === "verified"`.
  - Muestra nombre de la propiedad, ciudad y %. Nunca muestra los datos del título ni la revisión.
  - Estado vacío: "Aún no hay propiedades verificadas a tu nombre."
- [ ] **Step 3: Mi contrato.**
  - `requireLane("tenant")`.
  - El contrato `active` con `tenantId == access.personId`: propiedad y unidad, fechas, renta y moneda, depósito y estado.
  - Estado vacío: "No tienes un contrato activo."
- [ ] **Step 4: Punto de control.** Run: `npx next typegen && npm run typecheck && npm run lint`.

---

### Task 13: Pruebas e2e y documentación

**Files:** Create `scripts/e2e/ownerships.mjs`. Modify `scripts/e2e/{people,members,leases,access}.mjs`, `package.json` y `README.md`.

- [ ] **Step 1: `ownerships.mjs`** (patrón de `access.mjs`, con `api`, `page` y `db` de `lib.mjs`):
  - **Preparación:** `org-a` con `org_owner` (holder), `admin` (reviewer) y `manager`. La propiedad se crea con `propertyWizardDefaults` y `status: active`. Se crean dos personas individuales (A y B) y una entidad E con representante A.
  - **Alta:** el manager crea la titularidad A–P al 75 % → 201. La propiedad queda con `ownershipTotalPct` 75 y A con la relación `owner`.
  - **Regla del 100 %:** E–P al 30 % → 409 ("Solo queda 25 % disponible"). E–P al 25 % → 201. Una segunda A–P → 409 (duplicado).
  - **Verificación:**
    - `not_started → verified` → 409;
    - el manager pasa A–P a `in_review` → 200, y el mismo manager intenta aprobar → 403 (sin `review`);
    - el holder aprueba la titularidad que creó él mismo → 403 (crea una con el holder para probarlo);
    - el admin (reviewer) aprueba A–P → 200, con `reviewerUid` guardado;
    - rechazar sin motivo → 400.
  - **Edición:** cambiar el % de A–P verificada la devuelve a `in_review` y queda auditado.
  - **Finalizar:** el % disponible vuelve a la propiedad.
  - **Pantallas:** Owner 360 de A muestra P y su %; la pestaña Propietarios de P muestra los dos titulares y el total.
  - **Portal:**
    - se crea la membresía de A con `portals: ["owner"]` y `portalPersonIds: { owner: A }` (con `seedOrganization` y luego `update`);
    - `/propietario/propiedades` muestra P solo cuando está verificada;
    - otro propietario C no ve P;
    - una cuenta con `portals: ["owner"]` y una persona **sin** relación `owner` → "No tienes acceso".
  - **Migración:** se siembra una persona antigua `{ type: "owner", … }`. `node scripts/migrate-relationships.mjs --org org-a` (con las variables del emulador) la deja con `relationshipTypes: ["owner"]`, y una segunda ejecución no cambia nada.
- [ ] **Step 2: Suites existentes.**
  - `people.mjs`: los cuerpos de alta y edición usan el esquema nuevo (`kind`, `relationships`, `tenantPropertyId`/`tenantUnitId`); los filtros `?type=` siguen funcionando como alias; se añaden un caso de entidad con representante y uno de persona con las dos relaciones; los conflictos de email pasan a ser por `kind`.
  - `members.mjs`: los cuerpos usan `staffRole` y `portals`; se añaden una cuenta con dos portales (propietario e inquilino) que cambia de espacio y el rechazo de un portal sin relación (409).
  - `leases.mjs`: activar el contrato deja al inquilino con `relationshipTypes` que incluye `tenant`; terminarlo sin otro contrato activo lo finaliza.
  - `access.mjs`: se ajusta a las membresías nuevas, si hace falta.

  Cada expectativa que cambie debe venir del modelo nuevo; anótalas.
- [ ] **Step 3:** `package.json` → `test:e2e` termina con `&& node scripts/e2e/ownerships.mjs`. En el README, la sección "Persona y titularidad (2A-2)" y la de migración.
- [ ] **Step 4: Ejecutar todo** con los emuladores y Next en el puerto 3100, según el README. Al terminar, apaga solo los procesos que arrancaste, con `taskkill //T //F` sobre el padre.

  Run: `npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e`. Expected: todas las suites terminan con `0 failed`.
