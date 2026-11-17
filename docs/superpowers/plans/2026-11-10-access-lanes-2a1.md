# Fase 2A-1 — Tipos de usuario y permisos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar Administración y los portales externos en rutas, shells y permisos propios, con una autorización central que deniega por defecto. El staff se mueve a `/admin`.

**Architecture:**
- Módulos puros en `src/lib/access/`: la tabla de permisos (rol × módulo × acción), el tipo de usuario derivado del rol y la resolución del espacio de trabajo. Se prueban con `node --test`.
- Un módulo server-only (`authorize.ts`) resuelve la sesión y la membresía, y deniega todo lo que no pueda probar como permitido.
- Cada tipo de usuario tiene un layout que lo protege. Las páginas y las API siguen verificando su permiso concreto.

**Tech Stack:** Next.js 16.4 (App Router), React 19, TypeScript, zod 4, Firebase Admin, CSS Modules, lucide-react, `node:test` y los e2e de `scripts/e2e/*.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-10-access-lanes-2a-design.md`. Ver más abajo "Cambios respecto al spec (división 2A-1 / 2A-2)".

**Commits:** no se hacen. El usuario commitea cuando decide (ver memoria "work on main, no commits"). Cada tarea termina con un punto de control: `npm run typecheck && npm run lint && npm run test:unit`.

**Next 16:** lee `node_modules/next/dist/docs/` antes de usar APIs dudosas (layouts, `redirect`, `cookies()`, redirecciones en `next.config.ts`). Las páginas tipan sus props con los helpers globales `PageProps<"/ruta">` y `LayoutProps<"/ruta">`. Después de crear o mover rutas, ejecuta `npx next typegen`. Si `tsc` se queja de `.next/dev/types`, borra esa carpeta, que la regenera `next dev`.

---

## Cambios respecto al spec (división 2A-1 / 2A-2)

- **La persona con relaciones múltiples pasa a 2A-2.** Personas conserva su `type` único (propietario o inquilino).
- **La membresía conserva un rol único por organización.** El tipo de usuario se deriva del rol:
  - `org_owner`, `admin`, `manager` y `operations` → `admin`;
  - `owner` → `owner`; `tenant` → `tenant`; `applicant` → `applicant`; `guest` → `guest`;
  - `vendor` → ninguno, sin acceso.

  Tener varios portales en la misma organización se hará en 2A-2. Los campos `staffRole` y `portals` del spec no se crean.
- **La cookie se mantiene:** sigue siendo `mghpm_organization`, con el id de la organización. Como cada organización tiene un único rol, organización y tipo de usuario quedan determinados.
- **No hay `POST /api/workspace` nuevo:** se reutiliza `POST /api/organizations/active`, que ahora también escribe `workspace.switched` en `auditEvents`.
- **Estados de cuenta:** el esquema de membresía acepta `invited`, `pending_verification`, `active`, `suspended`, `disabled` y `archived`, y solo `active` da acceso. La pantalla de Usuarios sigue ofreciendo Activa y Suspendida.
- **Los layouts de `/admin` solo protegen:** las páginas siguen pintando `AdminShell` por su cuenta, como hoy, para no reescribir unas 25 páginas.

---

## Mapa de archivos

**Crear**
- `src/lib/access/permissions.ts` y `permissions.test.ts`: tipos de usuario, módulos, acciones, `can`, `laneForRole`, `lanePaths`.
- `src/lib/access/workspaces.ts` y `workspaces.test.ts`: lista de espacios y resolución del espacio activo.
- `src/lib/access/authorize.ts`: `getAccessContext`, `requireLane`, `requireStaffPermission` (server-only).
- `src/components/access/access-state.tsx` y `access-state.module.css`: las pantallas No autorizado, Cuenta bloqueada y Sin acceso.
- `src/components/access/portal-shell.tsx` y `portal-shell.module.css`.
- `src/components/access/portal-pages.tsx`: Inicio y Mi perfil, compartidos por los portales.
- `src/app/admin/layout.tsx`.
- `src/app/{propietario,inquilino,solicitante,huesped}/layout.tsx`, `page.tsx` y `perfil/page.tsx`.
- `src/app/acceder/page.tsx` y `src/app/espacios/page.tsx`.
- `scripts/e2e/access.mjs`.

**Mover** (con `mv`, sin git) a `src/app/admin/`:
- `dashboard/*`, que pasa a la raíz de `admin/`;
- `properties`, `people`, `leases`, `users` y `stay-inquiries`.

**Modificar**
- `tsconfig.json`: nada; ya tiene `allowImportingTsExtensions`.
- `package.json`: el glob de `test:unit`.
- `src/lib/auth/organization-schema.ts`, `src/lib/auth/organization.ts`.
- `src/lib/members/schema.ts`.
- `src/lib/properties/access.ts`, `src/lib/leases/api.ts`, `src/lib/people/api.ts`, `src/lib/members/api.ts`.
- `src/app/api/stay-inquiries/[inquiryId]/route.ts`.
- `src/app/api/organizations/active/route.ts`.
- `src/components/layout/admin-shell.tsx`.
- `src/components/organizations/organization-picker.tsx`, `create-organization-form.tsx`.
- `src/components/auth/login-form.tsx`, `src/app/login/page.tsx`.
- `src/app/page.tsx`, `src/app/onboarding/page.tsx`.
- `src/app/organizations/select/page.tsx`, que pasa a redirigir a `/espacios`.
- Todas las páginas movidas, en sus verificaciones de permiso y enlaces.
- `next.config.ts`: redirecciones.
- `src/components/landing/landing-page.tsx`.
- `scripts/e2e/*.mjs`: URLs y expectativas de `manager`.
- `package.json` (`test:e2e`) y `README.md`.

---

### Task 1: Tabla de permisos y tipos de usuario

**Files:**
- Create: `src/lib/access/permissions.ts`
- Test: `src/lib/access/permissions.test.ts`
- Modify: `package.json` (test:unit)
- Modify: `src/lib/auth/organization-schema.ts`

- [ ] **Step 1: Ampliar el glob de pruebas y el rol `applicant`**

En `package.json`, cambia `test:unit` a:

```json
    "test:unit": "node --test \"src/lib/stays/*.test.ts\" \"src/lib/access/*.test.ts\"",
```

En `src/lib/auth/organization-schema.ts`, agrega `"applicant",` después de `"tenant",` en el `z.enum`.

Busca todos los `Record<OrganizationRole, …>` del repo (`grep -rn "Record<OrganizationRole" src`). Al menos `roleLabels` en `src/lib/members/roles.ts` debe recibir `applicant: "Solicitante",`.

- [ ] **Step 2: Escribir la prueba que falla**

`src/lib/access/permissions.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { can, getLaneHomePath, laneForPathname, laneForRole, staffModules } from "./permissions.ts";

test("roles map to lanes", () => {
  for (const role of ["org_owner", "admin", "manager", "operations"] as const) {
    assert.equal(laneForRole(role), "admin");
  }
  assert.equal(laneForRole("owner"), "owner");
  assert.equal(laneForRole("tenant"), "tenant");
  assert.equal(laneForRole("applicant"), "applicant");
  assert.equal(laneForRole("guest"), "guest");
  assert.equal(laneForRole("vendor"), null);
});

test("owner and admin can do everything operational", () => {
  for (const role of ["org_owner", "admin"] as const) {
    for (const module of ["properties", "people", "leases", "stay_inquiries"] as const) {
      for (const action of ["view", "create", "update", "archive"] as const) {
        assert.equal(can(role, module, action), true, `${role} ${module} ${action}`);
      }
    }
    assert.equal(can(role, "members", "manage"), true);
    assert.equal(can(role, "audit", "view"), true);
  }
});

test("manager operates but does not manage users", () => {
  assert.equal(can("manager", "properties", "archive"), true);
  assert.equal(can("manager", "leases", "create"), true);
  assert.equal(can("manager", "members", "view"), true);
  assert.equal(can("manager", "members", "manage"), false);
  assert.equal(can("manager", "audit", "view"), false);
});

test("operations reads and only updates stay inquiries", () => {
  assert.equal(can("operations", "properties", "view"), true);
  assert.equal(can("operations", "properties", "update"), false);
  assert.equal(can("operations", "stay_inquiries", "update"), true);
  assert.equal(can("operations", "members", "view"), false);
});

test("external and unknown roles get nothing", () => {
  for (const role of ["owner", "tenant", "applicant", "guest", "vendor"] as const) {
    for (const module of staffModules) {
      assert.equal(can(role, module, "view"), false, `${role} ${module}`);
    }
  }
  assert.equal(can(null, "dashboard", "view"), false);
});

test("lane paths", () => {
  assert.equal(getLaneHomePath("admin"), "/admin");
  assert.equal(getLaneHomePath("owner"), "/propietario");
  assert.equal(laneForPathname("/admin/properties/x"), "admin");
  assert.equal(laneForPathname("/inquilino/perfil"), "tenant");
  assert.equal(laneForPathname("/estancias"), null);
});
```

- [ ] **Step 3: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./permissions.ts`.

- [ ] **Step 4: Implementar**

`src/lib/access/permissions.ts`:

```ts
import type { OrganizationRole } from "@/lib/auth/organization-schema";

export const lanes = ["admin", "owner", "tenant", "applicant", "guest"] as const;
export type Lane = (typeof lanes)[number];

export const staffModules = [
  "dashboard",
  "properties",
  "people",
  "leases",
  "stay_inquiries",
  "members",
  "audit",
] as const;
export type StaffModule = (typeof staffModules)[number];
export type StaffAction = "view" | "create" | "update" | "archive" | "manage";

const laneByRole: Partial<Record<OrganizationRole, Lane>> = {
  org_owner: "admin",
  admin: "admin",
  manager: "admin",
  operations: "admin",
  owner: "owner",
  tenant: "tenant",
  applicant: "applicant",
  guest: "guest",
};

/** Lane a membership role opens; null means the role grants no access (e.g. vendor). */
export function laneForRole(role: OrganizationRole): Lane | null {
  return laneByRole[role] ?? null;
}

const operate: StaffAction[] = ["view", "create", "update", "archive"];

type Matrix = Partial<Record<StaffModule, StaffAction[]>>;

const fullAccess: Matrix = {
  dashboard: ["view"],
  properties: operate,
  people: operate,
  leases: operate,
  stay_inquiries: operate,
  members: ["view", "manage"],
  audit: ["view"],
};

// Deny by default: anything not listed here is forbidden.
const staffPermissions: Partial<Record<OrganizationRole, Matrix>> = {
  org_owner: fullAccess,
  admin: fullAccess,
  manager: {
    dashboard: ["view"],
    properties: operate,
    people: operate,
    leases: operate,
    stay_inquiries: operate,
    members: ["view"],
  },
  operations: {
    dashboard: ["view"],
    properties: ["view"],
    people: ["view"],
    leases: ["view"],
    stay_inquiries: ["view", "update"],
  },
};

export function can(role: OrganizationRole | null, module: StaffModule, action: StaffAction) {
  if (!role) return false;
  return staffPermissions[role]?.[module]?.includes(action) ?? false;
}

export const lanePaths: Record<Lane, string> = {
  admin: "/admin",
  owner: "/propietario",
  tenant: "/inquilino",
  applicant: "/solicitante",
  guest: "/huesped",
};

export const laneLabels: Record<Lane, string> = {
  admin: "Administración",
  owner: "Portal de propietarios",
  tenant: "Portal de inquilinos",
  applicant: "Portal del solicitante",
  guest: "MGHPM Stays · Huésped",
};

export function getLaneHomePath(lane: Lane) {
  return lanePaths[lane];
}

export function laneForPathname(pathname: string): Lane | null {
  return (
    lanes.find((lane) => pathname === lanePaths[lane] || pathname.startsWith(`${lanePaths[lane]}/`)) ??
    null
  );
}
```

- [ ] **Step 5: Verificar que pasa y punto de control**

Run: `npm run test:unit && npm run typecheck && npm run lint`
Expected: todo pasa.

---

### Task 2: Espacios de trabajo (puro)

**Files:**
- Create: `src/lib/access/workspaces.ts`
- Test: `src/lib/access/workspaces.test.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`src/lib/access/workspaces.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { listWorkspaces, resolveWorkspace } from "./workspaces.ts";

const memberships = [
  { organizationId: "org-a", organizationName: "Org A", role: "admin" as const },
  { organizationId: "org-b", organizationName: "Org B", role: "owner" as const },
  { organizationId: "org-c", organizationName: "Org C", role: "vendor" as const },
];

test("lists one workspace per membership with a lane", () => {
  assert.deepEqual(
    listWorkspaces(memberships).map((workspace) => [workspace.organizationId, workspace.lane]),
    [["org-a", "admin"], ["org-b", "owner"]],
  );
});

test("resolves the workspace for a lane", () => {
  assert.equal(resolveWorkspace(memberships, null, "admin")?.organizationId, "org-a");
  assert.equal(resolveWorkspace(memberships, "org-b", "owner")?.organizationId, "org-b");
  assert.equal(resolveWorkspace(memberships, null, "tenant"), null);
});

test("prefers the selected organization when several match", () => {
  const two = [
    { organizationId: "org-a", organizationName: "A", role: "admin" as const },
    { organizationId: "org-d", organizationName: "D", role: "manager" as const },
  ];
  assert.equal(resolveWorkspace(two, null, "admin"), null);
  assert.equal(resolveWorkspace(two, "org-d", "admin")?.organizationId, "org-d");
  assert.equal(resolveWorkspace(two, "org-zzz", "admin"), null);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:unit`
Expected: FAIL, no se encuentra `./workspaces.ts`.

- [ ] **Step 3: Implementar**

`src/lib/access/workspaces.ts`:

```ts
import type { OrganizationRole } from "@/lib/auth/organization-schema";
import { laneForRole, type Lane } from "./permissions.ts";

type MembershipLike = {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
};

export type Workspace<M extends MembershipLike = MembershipLike> = M & { lane: Lane };

/** Each active membership opens exactly one lane in its organization. */
export function listWorkspaces<M extends MembershipLike>(memberships: M[]): Workspace<M>[] {
  return memberships.flatMap((membership) => {
    const lane = laneForRole(membership.role);
    return lane ? [{ ...membership, lane }] : [];
  });
}

/**
 * Workspace for a lane: the selected organization when it opens that lane,
 * otherwise the only organization that does. Null when ambiguous or absent.
 */
export function resolveWorkspace<M extends MembershipLike>(
  memberships: M[],
  selectedOrganizationId: string | null,
  lane: Lane,
): Workspace<M> | null {
  const candidates = listWorkspaces(memberships).filter((workspace) => workspace.lane === lane);
  const selected = candidates.find((workspace) => workspace.organizationId === selectedOrganizationId);
  if (selected) return selected;
  return candidates.length === 1 ? (candidates[0] ?? null) : null;
}
```

- [ ] **Step 4: Verificar que pasa y punto de control**

Run: `npm run test:unit && npm run typecheck && npm run lint`

---

### Task 3: Estados de cuenta y contexto de acceso (servidor)

**Files:**
- Modify: `src/lib/auth/organization.ts`
- Modify: `src/lib/members/schema.ts`
- Create: `src/lib/access/authorize.ts`

- [ ] **Step 1: Ampliar los estados de membresía**

En `src/lib/auth/organization.ts` y en `memberDocumentSchema` de `src/lib/members/schema.ts`, reemplaza `status: z.enum(["active", "invited", "suspended"])` por:

```ts
  status: z.enum(["invited", "pending_verification", "active", "suspended", "disabled", "archived"]),
```

En `src/lib/members/records.ts`, el tipo `OrganizationMember.status` pasa a `MemberDocument["status"]`. Agrega el import del tipo si no está.

En `src/lib/members/roles.ts`, `memberStatusLabels` sigue tipado sobre `MemberStatus` (active y suspended). Revisa las páginas de usuarios que muestran el estado: para los estados nuevos se muestra el texto con un fallback `?? status`.

- [ ] **Step 2: Exponer membresías bloqueadas**

En `listUserOrganizations` de `organization.ts`, mantén el filtro `status === "active"`. Agrega y exporta esta función, que reutiliza la validación de rutas de `listUserOrganizations`:

```ts
/** True when the user has memberships but none of them is active (suspended, disabled…). */
export async function hasOnlyBlockedMemberships(userUid: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collectionGroup("memberships")
    .where("userUid", "==", userUid)
    .get();
  if (snapshot.empty) return false;
  return snapshot.docs.every((document) => document.get("status") !== "active");
}
```

- [ ] **Step 3: `getOrganizationAccess` solo para Administración**

Reemplaza `getOrganizationAccess` por:

```ts
/**
 * Staff (admin lane) access used by the /admin pages: activeOrganization is set
 * only when the selected or only admin-lane membership resolves.
 */
export async function getOrganizationAccess(userUid: string) {
  const memberships = await listUserOrganizations(userUid);
  const selectedOrganizationId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value ?? null;
  const activeOrganization = resolveWorkspace(memberships, selectedOrganizationId, "admin");
  return { memberships, activeOrganization };
}
```

Agrega `import { resolveWorkspace } from "@/lib/access/workspaces";`. El tipo `OrganizationMembership` ya tiene `organizationId`, `organizationName` y `role`, así que encaja con `MembershipLike`.

- [ ] **Step 4: `authorize.ts`**

`src/lib/access/authorize.ts`:

```ts
import "server-only";

import { cookies } from "next/headers";
import {
  hasOnlyBlockedMemberships,
  listUserOrganizations,
  ORGANIZATION_COOKIE_NAME,
  type OrganizationMembership,
} from "@/lib/auth/organization";
import { getSessionUser, SESSION_COOKIE_NAME, type SessionUser } from "@/lib/auth/session";
import { can, type Lane, type StaffAction, type StaffModule } from "./permissions";
import { listWorkspaces, resolveWorkspace, type Workspace } from "./workspaces";

export type AccessDenial =
  | { kind: "unauthenticated"; status: 401; message: string; sessionExpired: boolean }
  | { kind: "account_blocked"; status: 403; message: string }
  | { kind: "no_workspace"; status: 409; message: string }
  | { kind: "forbidden"; status: 403; message: string };

export type AccessGrant = {
  kind: "allowed";
  user: SessionUser;
  userUid: string;
  organizationId: string;
  role: OrganizationMembership["role"];
  timeZone: string;
  workspace: Workspace<OrganizationMembership>;
  workspaces: Workspace<OrganizationMembership>[];
  memberships: OrganizationMembership[];
};

async function denyWithoutUser(): Promise<AccessDenial> {
  const hadSession = Boolean((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  return {
    kind: "unauthenticated",
    status: 401,
    message: "Inicia sesión para continuar.",
    sessionExpired: hadSession,
  };
}

/** Resolves session → active memberships → workspace for the lane. Denies anything unproven. */
export async function requireLane(lane: Lane): Promise<AccessGrant | AccessDenial> {
  const user = await getSessionUser();
  if (!user) return denyWithoutUser();

  const memberships = await listUserOrganizations(user.uid);
  if (memberships.length === 0 && (await hasOnlyBlockedMemberships(user.uid))) {
    return { kind: "account_blocked", status: 403, message: "Tu acceso está suspendido o deshabilitado." };
  }

  const workspaces = listWorkspaces(memberships);
  if (!workspaces.some((workspace) => workspace.lane === lane)) {
    return { kind: "forbidden", status: 403, message: "No tienes acceso a esta sección." };
  }

  const selected = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value ?? null;
  const workspace = resolveWorkspace(memberships, selected, lane);
  if (!workspace) {
    return { kind: "no_workspace", status: 409, message: "Selecciona un espacio de trabajo para continuar." };
  }

  return {
    kind: "allowed",
    user,
    userUid: user.uid,
    organizationId: workspace.organizationId,
    role: workspace.role,
    timeZone: workspace.timeZone,
    workspace,
    workspaces,
    memberships,
  };
}

/** Admin lane plus a specific permission from the central table. */
export async function requireStaffPermission(
  module: StaffModule,
  action: StaffAction,
  forbiddenMessage = "Tu rol no tiene permiso para esta acción.",
): Promise<AccessGrant | AccessDenial> {
  const access = await requireLane("admin");
  if (access.kind !== "allowed") return access;
  if (!can(access.role, module, action)) {
    return { kind: "forbidden", status: 403, message: forbiddenMessage };
  }
  return access;
}
```

`OrganizationMembership` ya incluye `timeZone`. Si `SESSION_COOKIE_NAME` no está exportado en `src/lib/auth/session.ts`, sí lo está (`export const SESSION_COOKIE_NAME`).

- [ ] **Step 5: Punto de control**

Run: `npm run typecheck && npm run lint && npm run test:unit`

---

### Task 4: Las API usan la tabla de permisos

**Files:**
- Modify: `src/lib/properties/access.ts`
- Modify: `src/lib/leases/api.ts`, `src/lib/people/api.ts`, `src/lib/members/api.ts`
- Modify: `src/app/api/stay-inquiries/[inquiryId]/route.ts`

Hoy las funciones devuelven `{ kind: "allowed", organizationId, role, timeZone, userUid }` o `{ kind, status, message }`. `AccessGrant` mantiene esos campos, así que las rutas no cambian.

- [ ] **Step 1: `properties/access.ts`**

Reemplaza el contenido de `src/lib/properties/access.ts` por:

```ts
import "server-only";

import { requireStaffPermission } from "@/lib/access/authorize";
import type { StaffAction, StaffModule } from "@/lib/access/permissions";

/** Property writes (properties, units, images): manager and above. */
export function getPropertyWriteAccess() {
  return requireStaffPermission("properties", "update", "Tu rol no tiene permiso para administrar propiedades.");
}

/** Staff write access for a module; kept for the existing per-module helpers. */
export function getManagementWriteAccess(
  module: StaffModule,
  forbiddenMessage: string,
  action: StaffAction = "update",
) {
  return requireStaffPermission(module, action, forbiddenMessage);
}
```

`propertyManagementRoles` desaparece. Su reemplazo en las páginas está en la Task 6.

- [ ] **Step 2: helpers por módulo**
- `src/lib/leases/api.ts`: `getLeaseWriteAccess()` → `getManagementWriteAccess("leases", "Tu rol no tiene permiso para administrar contratos.")`.
- `src/lib/members/api.ts`: `getMembersWriteAccess()` → `getManagementWriteAccess("members", "Tu rol no tiene permiso para administrar usuarios.", "manage")`.
- `src/lib/people/api.ts`: busca `getPeopleWriteAccess` y haz que llame a `getManagementWriteAccess("people", <su mensaje actual>)`. Si hoy llama a `getPropertyWriteAccess`, sustitúyelo igual.

- [ ] **Step 3: solicitudes de estadía**

En `src/app/api/stay-inquiries/[inquiryId]/route.ts`, sustituye `getPropertyWriteAccess()` por:

```ts
  const access = await getManagementWriteAccess(
    "stay_inquiries",
    "Tu rol no tiene permiso para atender solicitudes.",
  );
```

Ajusta el import (`getManagementWriteAccess` desde `@/lib/properties/access`).

- [ ] **Step 4: Punto de control**

Run: `npm run typecheck && npm run lint`
Expected: los únicos errores restantes son los usos de `propertyManagementRoles` y `managementRoles` en las páginas, que se arreglan en la Task 6. Si hay más, corrígelos aquí.

---

### Task 5: Pantallas comunes de acceso

**Files:**
- Create: `src/components/access/access-state.tsx`
- Create: `src/components/access/access-state.module.css`

- [ ] **Step 1: Componente**

`src/components/access/access-state.tsx`:

```tsx
import Link from "next/link";
import { Lock, ShieldOff, UserX } from "lucide-react";
import styles from "./access-state.module.css";

type AccessStateKind = "forbidden" | "account_blocked" | "no_access";

const content: Record<AccessStateKind, { title: string; body: string; icon: typeof Lock }> = {
  forbidden: {
    title: "No tienes acceso a esta sección",
    body: "Tu cuenta no tiene permiso para ver esta página. Si crees que es un error, contacta a tu administrador.",
    icon: Lock,
  },
  account_blocked: {
    title: "Tu acceso está suspendido",
    body: "Tu cuenta está suspendida o deshabilitada en esta organización. Contacta a tu administrador.",
    icon: UserX,
  },
  no_access: {
    title: "Tu cuenta aún no tiene acceso",
    body: "Inicias sesión correctamente, pero ninguna organización te ha dado acceso todavía.",
    icon: ShieldOff,
  },
};

/** Shared full-page state for denied access; never renders internal navigation. */
export function AccessState({ kind }: { kind: AccessStateKind }) {
  const { title, body, icon: Icon } = content[kind];
  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert">
        <span className={styles.icon}>
          <Icon aria-hidden="true" size={24} />
        </span>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/espacios">
            Ir a mi espacio
          </Link>
          <Link className={styles.secondary} href="/acceder">
            Cambiar de acceso
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Estilos**

`src/components/access/access-state.module.css`:

```css
.page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px 16px;
  background: var(--color-canvas);
}

.card {
  display: grid;
  width: min(100%, 460px);
  gap: 12px;
  justify-items: start;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 28px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.card h1 {
  margin: 0;
  color: var(--color-title);
  font-size: 22px;
}

.card p {
  margin: 0;
  color: var(--color-text);
  line-height: 1.5;
}

.icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.primary,
.secondary {
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
}

.primary {
  background: var(--color-primary);
  color: #fff;
}

.secondary {
  border: 1px solid var(--color-border);
  color: var(--color-title);
}
```

- [ ] **Step 3: Punto de control**

Run: `npm run typecheck && npm run lint` (salvo los errores conocidos de la Task 6).

---

### Task 6: Mover el staff a `/admin` y proteger el layout

**Files:**
- Move: `src/app/dashboard/*` → `src/app/admin/`, y `src/app/{properties,people,leases,users,stay-inquiries}` → `src/app/admin/…`
- Create: `src/app/admin/layout.tsx`
- Modify: todas las páginas movidas
- Modify: `src/components/layout/admin-shell.tsx`
- Modify: `next.config.ts`
- Modify: los enlaces del resto del código

- [ ] **Step 1: Mover las carpetas**

```bash
cd /d/GitHub/Property-Management-production
mkdir -p src/app/admin
mv src/app/dashboard/* src/app/admin/ && rmdir src/app/dashboard
for d in properties people leases users stay-inquiries; do mv "src/app/$d" "src/app/admin/$d"; done
ls src/app/admin
```

Expected: `page.tsx`, `page.module.css` (del dashboard), `properties`, `people`, `leases`, `users`, `stay-inquiries` y lo que tuviera `dashboard`.

**Imports relativos que se rompen:** por ejemplo, `src/app/admin/stay-inquiries/page.tsx` importa `../properties/page.module.css`. Esa ruta sigue siendo válida porque `properties` también se movió. Para los imports del dashboard, revisa los `../` de `src/app/admin/page.tsx`. Ejecuta `npm run typecheck` y corrige cada import roto.

- [ ] **Step 2: Layout que protege `/admin`**

`src/app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { requireLane } from "@/lib/access/authorize";

/** Guards every /admin page: staff lane only. Pages still render their own AdminShell. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const access = await requireLane("admin");
  if (access.kind === "unauthenticated") {
    redirect(access.sessionExpired ? "/acceder?motivo=sesion-expirada" : "/acceder");
  }
  if (access.kind === "no_workspace") redirect("/espacios");
  if (access.kind === "account_blocked") return <AccessState kind="account_blocked" />;
  if (access.kind === "forbidden") return <AccessState kind="forbidden" />;
  return children;
}
```

Run: `npx next typegen` (genera `LayoutProps<"/admin">`).

- [ ] **Step 3: Reemplazar las verificaciones por rol en las páginas**

En cada página movida, sustituye `propertyManagementRoles.has(access.activeOrganization.role)` (y `managementRoles.has(...)`) por `can(access.activeOrganization.role, <module>, <action>)`, importando `can` desde `@/lib/access/permissions`:

| Página (bajo `src/app/admin/`) | Llamada |
|---|---|
| `page.tsx` (dashboard): `if (!managementRoles.has(role))` | `if (!can(role, "properties", "view"))` |
| `properties/page.tsx`, `properties/[propertyId]/page.tsx` | `can(role, "properties", "view")` |
| `properties/new/page.tsx` | `can(role, "properties", "create")` |
| `properties/[propertyId]/edit/page.tsx`, `units/[unitId]/edit/page.tsx` | `can(role, "properties", "update")` |
| `units/new/page.tsx`, `units/generate/page.tsx` | `can(role, "properties", "create")` |
| `people/page.tsx` | `can(role, "people", "view")` |
| `people/new/page.tsx` | `can(role, "people", "create")` |
| `people/[personId]/edit/page.tsx` | `can(role, "people", "update")` |
| `leases/page.tsx`, `leases/[leaseId]/page.tsx` | `can(role, "leases", "view")` |
| `leases/new/page.tsx` | `can(role, "leases", "create")` |
| `leases/[leaseId]/edit/page.tsx` | `can(role, "leases", "update")` |
| `stay-inquiries/page.tsx` | `can(role, "stay_inquiries", "view")` |
| `users/page.tsx` | `can(actorRole, "members", "view")` |
| `users/new/page.tsx`, `users/[uid]/edit/page.tsx` | `can(role, "members", "manage")` (en edit se conserva además `canManageRole`) |

Quita los imports de `propertyManagementRoles` y `managementRoles` que queden sin usar.

**Detalle de propiedad (`properties/[propertyId]/page.tsx`):** muestra los botones de editar, agregar unidad y generar unidades solo si `can(role, "properties", "update")`. Pasa un booleano `canEdit` y envuelve cada `<Link>` de edición en `{canEdit && …}`. El rol `operations` solo ve.

**Lista de usuarios:** si muestra acciones de edición, condiciónalas a `can(actorRole, "members", "manage")`. `manager` ve la lista sin acciones.

- [ ] **Step 4: Rutas dentro del código**

Reemplaza las rutas viejas por las de `/admin` en todo `src/` (páginas, componentes, `router.push`/`replace`, `redirect`, `href`, `action`). Ejemplos:

| Antes | Después |
|---|---|
| `"/dashboard"` | `"/admin"` |
| `"/properties` y `` `/properties `` | `"/admin/properties` y `` `/admin/properties `` |
| `"/people` | `"/admin/people` |
| `"/leases` | `"/admin/leases` |
| `"/users` | `"/admin/users` |
| `"/stay-inquiries` | `"/admin/stay-inquiries` |
| `"/organizations/select"` | `"/espacios"` |

**Cuidado:** no toques las API (`/api/properties`, `/api/people`, `/api/leases`, `/api/members`, `/api/stay-inquiries`), que se quedan donde están. Usa un patrón que exija que la ruta empiece por `/properties`, etc., justo después de la comilla o la tilde invertida. Revisa el resultado con:

```bash
grep -rnE "[\"'\`]/(dashboard|properties|people|leases|users|stay-inquiries|organizations/select)" src | grep -v "/api/"
```

Expected: sin resultados.

- [ ] **Step 5: Menú de `AdminShell` por permiso**

En `src/components/layout/admin-shell.tsx`:
- reemplaza `navigationItems` por una lista con `module` en vez de `management`;
- usa `can(activeRole ?? null, item.module, "view")` para filtrar;
- elimina el import de `managementRoles`.

```ts
const navigationItems = [
  { href: "/admin", label: "Panel principal", icon: LayoutDashboard, module: "dashboard" },
  { href: "/admin/properties", label: "Propiedades", icon: Building2, module: "properties" },
  { href: "/admin/people", label: "Personas", icon: Users, module: "people" },
  { href: "/admin/leases", label: "Contratos", icon: FileSignature, module: "leases" },
  { href: "/admin/stay-inquiries", label: "Solicitudes de estadía", icon: Inbox, module: "stay_inquiries" },
  { href: "/admin/users", label: "Usuarios y accesos", icon: KeyRound, module: "members" },
] as const satisfies readonly { href: string; label: string; icon: unknown; module: StaffModule }[];
```

El ítem activo se marca hoy con `pathname.startsWith(href)`. Con `/admin` como prefijo de todo, el Panel principal quedaría siempre activo. Usa `href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)`. Los enlaces de la marca y del logo apuntan a `/admin`.

- [ ] **Step 6: Redirecciones de las URL viejas**

En `next.config.ts`, dentro de `redirects()`, agrega estas entradas (antes o después de las de estancias):

```ts
      { source: "/dashboard", destination: "/admin", permanent: true },
      ...["properties", "people", "leases", "users", "stay-inquiries"].flatMap((section) => [
        { source: `/${section}`, destination: `/admin/${section}`, permanent: true },
        { source: `/${section}/:path*`, destination: `/admin/${section}/:path*`, permanent: true },
      ]),
      { source: "/organizations/select", destination: "/espacios", permanent: true },
```

`redirects()` debe devolver la concatenación de las de estancias y estas. Borra `src/app/organizations/select/` (la página y su CSS); la redirección la reemplaza. Si `src/app/organizations/` queda vacía, bórrala también.

- [ ] **Step 7: Punto de control**

Run: `npx next typegen && npm run typecheck && npm run lint && npm run test:unit`
Expected: todo pasa.

---

### Task 7: Shell de portales y esqueletos

**Files:**
- Create: `src/components/access/portal-shell.tsx`, `portal-shell.module.css`, `portal-pages.tsx`
- Create: `src/app/{propietario,inquilino,solicitante,huesped}/layout.tsx`, `page.tsx`, `perfil/page.tsx`

- [ ] **Step 1: `PortalShell`**

`src/components/access/portal-shell.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getLaneHomePath, laneLabels, type Lane } from "@/lib/access/permissions";
import styles from "./portal-shell.module.css";

type PortalShellProps = {
  lane: Exclude<Lane, "admin">;
  organizationName: string;
  userName: string | null;
  userEmail: string | null;
  canSwitch: boolean;
  children: React.ReactNode;
};

/** External portal frame: own navigation only, never the internal admin menu. */
export function PortalShell({ lane, organizationName, userName, userEmail, canSwitch, children }: PortalShellProps) {
  const home = getLaneHomePath(lane);
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href={home}>
            <Image alt="" height={34} src="/logo-mark.png" width={34} />
            <span>
              <strong>{laneLabels[lane]}</strong>
              <small>{organizationName}</small>
            </span>
          </Link>
          <nav aria-label="Navegación del portal" className={styles.nav}>
            <Link href={home}>Inicio</Link>
            <Link href={`${home}/perfil`}>Mi perfil</Link>
          </nav>
          <div className={styles.account}>
            {canSwitch && (
              <Link className={styles.switch} href="/espacios">
                Cambiar espacio
              </Link>
            )}
            <span className={styles.user}>{userName ?? userEmail}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
```

Revisa la firma real de `LogoutButton` en `src/components/auth/logout-button.tsx` y pásale las props que requiera.

- [ ] **Step 2: Estilos**

`src/components/access/portal-shell.module.css`:

```css
.shell {
  min-height: 100vh;
  background: var(--color-canvas);
}

.header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.headerInner,
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
}

.headerInner {
  display: flex;
  min-height: 64px;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-title);
}

.brand span {
  display: grid;
  line-height: 1.2;
}

.brand small {
  color: var(--color-muted);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav a {
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--color-title);
  font-weight: 600;
}

.nav a:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.account {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 12px;
}

.switch {
  color: var(--color-primary);
  font-weight: 600;
}

.user {
  color: var(--color-muted);
}

.main {
  padding-top: 24px;
  padding-bottom: 48px;
}

.card {
  display: grid;
  gap: 10px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.card h1,
.card h2 {
  margin: 0;
  color: var(--color-title);
}

.list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.7;
}

.details {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 16px;
  margin: 0;
}

.details dt {
  color: var(--color-muted);
}

.details dd {
  margin: 0;
  color: var(--color-title);
}
```

- [ ] **Step 3: Páginas compartidas**

`src/components/access/portal-pages.tsx`:

```tsx
import { getOrganizationPerson } from "@/lib/people/records";
import type { Lane } from "@/lib/access/permissions";
import styles from "./portal-shell.module.css";

const upcoming: Record<Exclude<Lane, "admin">, string[]> = {
  owner: ["Estado de cuenta y distribuciones", "Tus propiedades y contratos", "Mantenimiento y documentos"],
  tenant: ["Tu contrato y pagos", "Solicitudes de mantenimiento", "Documentos y mensajes"],
  applicant: ["Tus solicitudes de alquiler", "Documentos requeridos", "Mensajes con el equipo"],
  guest: ["Tus estancias", "Llegada y salida", "Servicios durante tu estancia"],
};

export function PortalHome({ lane, userName }: { lane: Exclude<Lane, "admin">; userName: string | null }) {
  return (
    <section className={styles.card}>
      <h1>Hola{userName ? `, ${userName.split(" ")[0]}` : ""}</h1>
      <p>Tu portal se está preparando. Muy pronto podrás gestionar aquí:</p>
      <ul className={styles.list}>
        {upcoming[lane].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/** Read-only view of the person linked to the caller's own membership. */
export async function PortalProfile({
  organizationId,
  personId,
  userEmail,
}: {
  organizationId: string;
  personId: string | null;
  userEmail: string | null;
}) {
  const person = personId ? await getOrganizationPerson(organizationId, personId) : null;
  return (
    <section className={styles.card}>
      <h1>Mi perfil</h1>
      {person ? (
        <dl className={styles.details}>
          <dt>Nombre</dt>
          <dd>{person.name}</dd>
          <dt>Correo</dt>
          <dd>{person.email}</dd>
          <dt>Teléfono</dt>
          <dd>{person.phone || "—"}</dd>
        </dl>
      ) : (
        <p>Tu cuenta ({userEmail}) aún no está vinculada a una ficha. Contacta a tu administrador.</p>
      )}
    </section>
  );
}
```

`personId` sale de la membresía. Hoy `OrganizationMembership` no lo expone. Agrega `personId: string | null` al tipo y a `listUserOrganizations` (`membershipSchema` añade `personId: z.string().nullable().optional()`, y el valor se devuelve como `membership.personId ?? null`). Así el perfil lee **solo** la persona propia.

- [ ] **Step 4: Rutas por tipo de usuario**

Repite el patrón para `propietario` (`owner`), `inquilino` (`tenant`), `solicitante` (`applicant`) y `huesped` (`guest`). Ejemplo para `propietario`:

`src/app/propietario/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { PortalShell } from "@/components/access/portal-shell";
import { requireLane } from "@/lib/access/authorize";

export default async function OwnerPortalLayout({ children }: LayoutProps<"/propietario">) {
  const access = await requireLane("owner");
  if (access.kind === "unauthenticated") {
    redirect(access.sessionExpired ? "/acceder?motivo=sesion-expirada" : "/acceder?acceso=owner");
  }
  if (access.kind === "no_workspace") redirect("/espacios");
  if (access.kind === "account_blocked") return <AccessState kind="account_blocked" />;
  if (access.kind === "forbidden") return <AccessState kind="forbidden" />;

  return (
    <PortalShell
      canSwitch={access.workspaces.length > 1}
      lane="owner"
      organizationName={access.workspace.organizationName}
      userEmail={access.user.email}
      userName={access.user.name}
    >
      {children}
    </PortalShell>
  );
}
```

`src/app/propietario/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PortalHome } from "@/components/access/portal-pages";
import { requireLane } from "@/lib/access/authorize";

export const metadata: Metadata = { title: "Portal de propietarios" };

export default async function OwnerPortalPage() {
  const access = await requireLane("owner");
  if (access.kind !== "allowed") return null; // the layout already handled the denial
  return <PortalHome lane="owner" userName={access.user.name} />;
}
```

`src/app/propietario/perfil/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PortalProfile } from "@/components/access/portal-pages";
import { requireLane } from "@/lib/access/authorize";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function OwnerProfilePage() {
  const access = await requireLane("owner");
  if (access.kind !== "allowed") return null;
  return (
    <PortalProfile
      organizationId={access.organizationId}
      personId={access.workspace.personId}
      userEmail={access.user.email}
    />
  );
}
```

Para los otros tres cambia el tipo de usuario (`"tenant"`, `"applicant"`, `"guest"`), los nombres de los componentes y los títulos: "Portal de inquilinos", "Portal del solicitante" y "Mis estancias". Las rutas son `/inquilino`, `/solicitante` y `/huesped`.

- [ ] **Step 5: Punto de control**

Run: `npx next typegen && npm run typecheck && npm run lint`

---

### Task 8: `/acceder`, `/espacios`, inicio de sesión y cambio auditado

**Files:**
- Create: `src/app/acceder/page.tsx`, `src/app/espacios/page.tsx`
- Modify: `src/components/organizations/organization-picker.tsx`
- Modify: `src/app/api/organizations/active/route.ts`
- Modify: `src/components/auth/login-form.tsx`, `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`, `src/app/onboarding/page.tsx`, `src/components/organizations/create-organization-form.tsx`
- Modify: `src/components/landing/landing-page.tsx`

- [ ] **Step 1: `/acceder`**

`src/app/acceder/page.tsx`. Es bilingüe con `?lang=en`; el español es la base:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Home, KeyRound, Luggage, UserPlus } from "lucide-react";
import styles from "@/components/access/access-state.module.css";

export const metadata: Metadata = { title: "Acceder" };

const options = {
  es: {
    title: "¿Cómo quieres acceder?",
    expired: "Tu sesión expiró. Inicia sesión de nuevo.",
    soon: "Próximamente",
    items: [
      { lane: "admin", label: "Personal de MGHPM", href: "/login?acceso=admin", icon: Briefcase },
      { lane: "owner", label: "Propietario", href: "/login?acceso=owner", icon: Home },
      { lane: "tenant", label: "Inquilino", href: "/login?acceso=tenant", icon: KeyRound },
      { lane: "applicant", label: "Solicitante de alquiler", href: null, icon: UserPlus },
      { lane: "guest", label: "Huésped (MGHPM Stays)", href: null, icon: Luggage },
    ],
    switchLabel: "English",
    switchHref: "/acceder?lang=en",
  },
  en: {
    title: "How do you want to sign in?",
    expired: "Your session expired. Please sign in again.",
    soon: "Coming soon",
    items: [
      { lane: "admin", label: "MGHPM staff", href: "/login?acceso=admin", icon: Briefcase },
      { lane: "owner", label: "Owner", href: "/login?acceso=owner", icon: Home },
      { lane: "tenant", label: "Tenant", href: "/login?acceso=tenant", icon: KeyRound },
      { lane: "applicant", label: "Rental applicant", href: null, icon: UserPlus },
      { lane: "guest", label: "Guest (MGHPM Stays)", href: null, icon: Luggage },
    ],
    switchLabel: "Español",
    switchHref: "/acceder",
  },
} as const;

export default async function AccessChooserPage({ searchParams }: PageProps<"/acceder">) {
  const params = await searchParams;
  const t = params.lang === "en" ? options.en : options.es;
  const expired = params.motivo === "sesion-expirada";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{t.title}</h1>
        {expired && <p role="status">{t.expired}</p>}
        <ul className={styles.choices}>
          {t.items.map(({ lane, label, href, icon: Icon }) => (
            <li key={lane}>
              {href ? (
                <Link className={styles.choice} href={href}>
                  <Icon aria-hidden="true" size={18} /> {label}
                </Link>
              ) : (
                <span aria-disabled="true" className={`${styles.choice} ${styles.choiceDisabled}`}>
                  <Icon aria-hidden="true" size={18} /> {label} · {t.soon}
                </span>
              )}
            </li>
          ))}
        </ul>
        <Link className={styles.secondary} href={t.switchHref}>
          {t.switchLabel}
        </Link>
      </section>
    </main>
  );
}
```

Al final de `access-state.module.css` agrega:

```css
.choices {
  display: grid;
  width: 100%;
  gap: 8px;
  margin: 4px 0;
  padding: 0;
  list-style: none;
}

.choice {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--color-title);
  font-weight: 600;
}

a.choice:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.choiceDisabled {
  color: var(--color-muted);
  cursor: not-allowed;
}
```

- [ ] **Step 2: Inicio de sesión con tipo de acceso**

- `src/app/login/page.tsx`:
  - si hay sesión, redirige a `/espacios` en lugar de calcular el destino;
  - lee `searchParams.acceso`, valida que sea un tipo de usuario (`lanes.includes`) y pásalo como prop `lane` a `<LoginForm lane={…} />`;
  - muestra el nombre del acceso (`laneLabels[lane]`) bajo el título cuando venga.
- `src/components/auth/login-form.tsx`:
  - acepta `lane?: Lane`;
  - tras crear la sesión navega a `` `/espacios${lane ? `?acceso=${lane}` : ""}` `` en lugar de `/dashboard`.

- [ ] **Step 3: `/espacios`**

`src/app/espacios/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessState } from "@/components/access/access-state";
import { OrganizationPicker } from "@/components/organizations/organization-picker";
import { getLaneHomePath, lanes, type Lane } from "@/lib/access/permissions";
import { listWorkspaces } from "@/lib/access/workspaces";
import { hasOnlyBlockedMemberships, listUserOrganizations } from "@/lib/auth/organization";
import { getSessionUser } from "@/lib/auth/session";
import styles from "@/components/access/access-state.module.css";

export const metadata: Metadata = { title: "Elegir espacio" };

/** Chooses where to go after sign-in, or lets the user switch workspace. */
export default async function WorkspacesPage({ searchParams }: PageProps<"/espacios">) {
  const user = await getSessionUser();
  if (!user) redirect("/acceder");

  const memberships = await listUserOrganizations(user.uid);
  if (memberships.length === 0) {
    if (await hasOnlyBlockedMemberships(user.uid)) return <AccessState kind="account_blocked" />;
    if (process.env.FIREBASE_BOOTSTRAP_ADMIN_UID === user.uid) redirect("/onboarding");
    return <AccessState kind="no_access" />;
  }

  const workspaces = listWorkspaces(memberships);
  const requested = (await searchParams).acceso;
  const lane = typeof requested === "string" && (lanes as readonly string[]).includes(requested)
    ? (requested as Lane)
    : null;
  const matching = lane ? workspaces.filter((workspace) => workspace.lane === lane) : workspaces;
  if (matching.length === 1 && matching[0]) redirect(getLaneHomePath(matching[0].lane));
  if (workspaces.length === 0) return <AccessState kind="no_access" />;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Elige tu espacio de trabajo</h1>
        <p>Tu cuenta tiene acceso a más de un espacio.</p>
        <OrganizationPicker workspaces={matching.length > 0 ? matching : workspaces} />
      </section>
    </main>
  );
}
```

Revisa cómo decide hoy `/onboarding` quién es el admin inicial. Si no usa `FIREBASE_BOOTSTRAP_ADMIN_UID` directamente, replica la condición real de `src/app/onboarding/page.tsx` en vez de inventar una.

**Redirección con un único espacio:** cuando hay un solo espacio coincidente, el layout del tipo de usuario lo resuelve solo (`resolveWorkspace` con un único candidato), así que no hace falta escribir la cookie.

- [ ] **Step 4: Selector de espacios**

`src/components/organizations/organization-picker.tsx` pasa a recibir `workspaces: { organizationId: string; organizationName: string; lane: Lane }[]`:
- cada botón muestra `organizationName` y `laneLabels[lane]`;
- hace POST a `/api/organizations/active` con `{ organizationId }`, como hoy;
- luego hace `router.replace(getLaneHomePath(lane))` y `router.refresh()`.

En el `OrganizationSwitcher` de `AdminShell` (`src/components/organizations/organization-switcher.tsx`), si navega a `/dashboard` después de cambiar, cambia el destino a la ruta del tipo de usuario de la organización elegida: `getLaneHomePath(laneForRole(role) ?? "admin")`.

- [ ] **Step 5: Cambio de espacio auditado**

En `src/app/api/organizations/active/route.ts`, después de encontrar `membership` y antes de responder, agrega:

```ts
  await getFirebaseAdminFirestore()
    .collection("organizations")
    .doc(membership.organizationId)
    .collection("auditEvents")
    .add({
      organizationId: membership.organizationId,
      action: "workspace.switched",
      actorUid: user.uid,
      targetId: membership.organizationId,
      lane: laneForRole(membership.role),
      createdAt: FieldValue.serverTimestamp(),
    });
```

Los imports son `getFirebaseAdminFirestore` desde `@/lib/firebase/admin`, `FieldValue` desde `firebase-admin/firestore` y `laneForRole` desde `@/lib/access/permissions`. Una organización con rol `vendor` (sin tipo de usuario) responde 403 con "No tienes acceso a la organización seleccionada.".

- [ ] **Step 6: Destinos del resto de flujos**

- `src/app/page.tsx` (raíz): con sesión, `redirect("/espacios")`. Sin sesión se muestra la landing, como hoy.
- `src/app/onboarding/page.tsx`: los destinos `"/dashboard"` y `"/organizations/select"` pasan a `"/admin"` y `"/espacios"`.
- `create-organization-form.tsx`: `router.replace("/admin")`.
- `src/components/landing/landing-page.tsx`: el enlace "Portal Login" (`href="/login"`) pasa a `href="/acceder"`.

- [ ] **Step 7: Punto de control**

Run: `npx next typegen && npm run typecheck && npm run lint && npm run test:unit`

---

### Task 9: Pruebas e2e

**Files:**
- Modify: `scripts/e2e/*.mjs` (rutas y expectativas)
- Create: `scripts/e2e/access.mjs`
- Modify: `package.json` (`test:e2e`), `README.md`

- [ ] **Step 1: Actualizar las suites existentes**

En `scripts/e2e/{properties,units,images,people,members,leases,stays}.mjs`:
- cambia las rutas de páginas a `/admin/...`: `"/dashboard"` → `"/admin"` y `"/properties…"` → `"/admin/properties…"`, igual para `/people`, `/leases`, `/users` y `/stay-inquiries`, solo en llamadas a `page(...)` y en expectativas de `location`. Las URL de `/api/...` no cambian.
- **Expectativas que cambian por la tabla de permisos:**
  - `manager` ahora **puede** operar propiedades, personas, contratos e imágenes. Los checks del tipo "manager cannot upload (403)" pasan a esperar éxito, y su nombre se ajusta: "manager can upload (201)".
  - `manager` sigue sin poder gestionar usuarios: `members.mjs` debe seguir esperando 403 en POST y PATCH de `/api/members`.
  - Las sesiones de propietario o inquilino que abrían `/dashboard`: ahora `/admin` les muestra la pantalla "No tienes acceso a esta sección", con estado 200 porque la renderiza el layout. Ajusta el check para buscar ese texto.
  - Las sesiones de usuarios sin organización o suspendidos: `/admin` redirige a `/espacios` (307), y `/espacios` muestra "Tu acceso está suspendido" o "Tu cuenta aún no tiene acceso".
  - Lee cada check que falle antes de cambiarlo, para confirmar que el cambio viene de la tabla de permisos o de las rutas nuevas y no de un error real.
- En `stays.mjs`, la bandeja `/stay-inquiries` pasa a `/admin/stay-inquiries` si aparece.

- [ ] **Step 2: `access.mjs`**

`scripts/e2e/access.mjs`:

```js
// E2E for Fase 2A-1: lanes, permissions table, /admin move and workspace switching.
// Requires the emulators and a dev server on port 3100 (see README). Wipes demo-mghpm data.
import {
  api,
  BASE,
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

// A valid body, so the 403 comes from the permission check and not from validation (400).
const validProperty = {
  ...propertyWizardDefaults,
  name: "Torre Acceso",
  code: "TA-1",
  type: "apartment_condo",
  status: "active",
  address: "Calle 1",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO",
};

await resetEmulators();
const holder = await signUp("holder@example.test");
const manager = await signUp("manager@example.test");
const operations = await signUp("ops@example.test");
const owner = await signUp("owner@example.test");
const tenant = await signUp("tenant@example.test");
const suspended = await signUp("suspended@example.test");
const multi = await signUp("multi@example.test");

await seedOrganization("org-a", "Org A", [
  [holder.uid, "org_owner"],
  [manager.uid, "manager"],
  [operations.uid, "operations"],
  [owner.uid, "owner"],
  [tenant.uid, "tenant"],
  [suspended.uid, "manager"],
  [multi.uid, "admin"],
]);
await seedOrganization("org-b", "Org B", [[multi.uid, "owner"]]);
await db.doc(`organizations/org-a/memberships/${suspended.uid}`).update({ status: "suspended" });

const sessions = {
  holder: await login(holder.idToken),
  manager: await login(manager.idToken),
  operations: await login(operations.idToken),
  owner: await login(owner.idToken),
  tenant: await login(tenant.idToken),
  suspended: await login(suspended.idToken),
  multi: await login(multi.idToken),
};

console.log("Old URLs redirect to /admin");
let response = await fetch(`${BASE}/properties?x=1`, { redirect: "manual" });
check("/properties → /admin/properties", response.status === 308 && response.headers.get("location")?.endsWith("/admin/properties?x=1"));
response = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
check("/dashboard → /admin", response.status === 308 && response.headers.get("location")?.endsWith("/admin"));

console.log("Staff permissions");
let result = await page(sessions.holder, "/admin/users");
check("holder sees users", result.status === 200 && result.html.includes("Usuarios"));
result = await page(sessions.manager, "/admin/properties");
check("manager sees properties", result.status === 200 && !result.html.includes("No tienes acceso"));
result = await api(sessions.manager, "POST", "/api/members", { email: "x@example.test", displayName: "X", role: "operations", personId: "" });
check("manager cannot create users (403)", result.status === 403, JSON.stringify(result));
result = await page(sessions.operations, "/admin/properties");
check("operations sees properties", result.status === 200 && result.html.includes("Propiedades"));
check("operations menu hides users", !result.html.includes("/admin/users"));
result = await page(sessions.operations, "/admin/properties/new");
check("operations cannot open new property", result.html.includes("No tienes") || result.html.includes("permiso"));
result = await api(sessions.operations, "POST", "/api/properties", validProperty);
check("operations cannot create property (403)", result.status === 403);

console.log("External lanes");
result = await page(sessions.owner, "/propietario");
check("owner enters owner portal", result.status === 200 && result.html.includes("Portal de propietarios"));
check("owner portal has no admin menu", !result.html.includes("/admin/properties"));
result = await page(sessions.owner, "/admin");
check("owner gets not-authorized on /admin", result.html.includes("No tienes acceso a esta sección"));
result = await api(sessions.owner, "POST", "/api/properties", validProperty);
check("owner gets 403 on staff API", result.status === 403);
result = await page(sessions.tenant, "/inquilino/perfil");
check("tenant sees own profile page", result.status === 200 && result.html.includes("Mi perfil"));
result = await page(sessions.tenant, "/propietario");
check("tenant cannot open owner portal", result.html.includes("No tienes acceso a esta sección"));
result = await page(sessions.holder, "/inquilino");
check("staff cannot open tenant portal", result.html.includes("No tienes acceso a esta sección"));

console.log("Blocked and anonymous");
result = await page(sessions.suspended, "/admin");
check("suspended user is blocked", result.html.includes("Tu acceso está suspendido") || (result.status === 307));
result = await page(sessions.suspended, "/espacios");
check("/espacios shows suspension", result.html.includes("Tu acceso está suspendido"));
response = await fetch(`${BASE}/admin`, { redirect: "manual" });
check("anonymous /admin goes to /acceder", response.status === 307 && (response.headers.get("location") ?? "").includes("/acceder"));
result = await page(sessions.holder, "/acceder");
check("/acceder lists lanes", result.html.includes("Propietario") && result.html.includes("Próximamente"));

console.log("Workspaces");
result = await page(sessions.multi, "/espacios");
check("multi-workspace user chooses", result.status === 200 && result.html.includes("Org A") && result.html.includes("Org B"));
result = await page(sessions.multi, "/espacios?acceso=owner");
check("acceso=owner goes straight to owner portal", result.status === 307);
result = await api(sessions.multi, "POST", "/api/organizations/active", { organizationId: "org-b" });
check("switch to org-b allowed", result.status === 200);
const audit = await db.collection("organizations/org-b/auditEvents").where("action", "==", "workspace.switched").get();
check("switch is audited", audit.size === 1 && audit.docs[0]?.data().lane === "owner");
result = await api(sessions.owner, "POST", "/api/organizations/active", { organizationId: "org-b" });
check("cannot switch to a foreign org (403)", result.status === 403);

finish();
```

Si algún texto esperado no coincide con lo que renderiza la app (por ejemplo "Usuarios" o "Propiedades"), ajústalo al texto real y anota el cambio. No cambies la intención del check.

- [ ] **Step 3: Suite y README**

- `package.json`: agrega `&& node scripts/e2e/access.mjs` al final de `test:e2e`.
- `README.md`: añade una sección "Accesos por tipo de usuario (Fase 2A-1)" que explique:
  - las rutas `/admin`, `/propietario`, `/inquilino`, `/solicitante` y `/huesped`;
  - `/acceder` y `/espacios`;
  - la tabla de permisos en `src/lib/access/permissions.ts`;
  - que las URL viejas redirigen.

  Actualiza las rutas antiguas que aparezcan en el README.

- [ ] **Step 4: Ejecutar todo**

Con los emuladores (`npx firebase-tools emulators:start --project demo-mghpm --only auth,firestore`) y Next en el puerto 3100 con las variables del README, más `PUBLIC_CATALOG_ORGANIZATION_ID=org-a`:

Run: `npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e`
Expected: todas las suites terminan con `0 failed`.
