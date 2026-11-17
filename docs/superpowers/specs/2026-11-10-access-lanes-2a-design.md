# Fase 2A — Base de accesos por tipo de usuario

Fecha: 2026-11-10 · Origen: "MGHPM Enterprise · Fase 1 — Auditoría de accesos" (Carmen, 9 nov 2026), fase 2 "Identidad y permisos" · Stack: Next.js 16 + Firebase.

## Objetivo

Separar a cada tipo de usuario (Administración, Propietario, Inquilino, Solicitante, Huésped) en sus propias rutas, shells y permisos. La autorización es central y deniega por defecto. Esta fase no envía correos.

## Alcance

**Incluye**
- Modelo de datos: persona con relaciones múltiples, membresía con rol interno y portales, estados de cuenta, espacio de trabajo = organización + tipo de usuario.
- `src/lib/access/`: tabla de permisos (rol × módulo × acción) y las funciones `requireLane` y `requireStaffPermission`.
- El staff se mueve a `/admin/*`, con redirecciones desde las URL viejas.
- Shells y esqueletos de los portales `/propietario`, `/inquilino`, `/solicitante` y `/huesped` (Inicio y Mi perfil).
- `/acceder`, `/espacios`, cambio de espacio auditado, y los estados "no autorizado", "sesión expirada" y "cuenta suspendida".
- Ajustes en Usuarios y accesos y en Personas.
- Pruebas unitarias y e2e (`scripts/e2e/access.mjs`), con las suites existentes actualizadas.

**No incluye**
- 2B: invitaciones a portales.
- 2C: registro de solicitante.
- 2D: OTP de huésped.
- Segundo factor (2FA). Decisión del usuario: no por ahora.
- Portafolios y asignación de staff a propiedades.
- Contenido real de los portales: fases 3 a 5.
- ES/EN en los portales.
- Correo, que queda pendiente de configurar.

## Decisiones

| Tema | Decisión |
|---|---|
| Rutas del staff | Se mueven a `/admin/*`; las URL viejas redirigen. Las API se quedan en `/api/*` |
| 2FA | No por ahora |
| Granularidad | Rol × módulo × acción; alcance por organización para el staff y por registro para los externos |
| Mecanismo | Política central en código + un layout por tipo de usuario + verificación en cada página y API. Sin `proxy.ts` y sin *custom claims* |

## 1. Modelo de datos

### Persona (`organizations/{org}/people/{id}`)

`relationships` es un mapa por tipo:
- claves posibles: `owner`, `tenant`, `applicant`, `guest`, `owner_prospect`;
- cada valor es `{ status: "active" | "ended", since: Timestamp }`;
- `tenant` añade `propertyId` y `unitId`.

`relationshipTypes: string[]` guarda las relaciones activas, para filtrar.

**Compatibilidad:** un documento sin `relationships` se lee a partir de su `type` actual (`owner` o `tenant`, junto con su `propertyId`/`unitId`). La función pura `normalizePerson` hace esta lectura. No hay migración manual. Al guardar se escribe el formato nuevo.

El formulario de persona cambia el selector "Tipo" por casillas Propietario e Inquilino (al menos una). Solicitante y huésped solo los crean sus propios flujos (2C y 2D).

### Cuenta

El usuario de Firebase Auth. `disabled` en Auth bloquea todas las organizaciones.

### Membresía (`organizations/{org}/memberships/{uid}`)

- `staffRole`: `org_owner`, `admin`, `manager`, `operations` o `null`.
- `portals`: subconjunto de `owner`, `tenant`, `applicant` y `guest`.
- `status`: `invited`, `pending_verification`, `active`, `suspended`, `disabled` o `archived`. Solo `active` da acceso.
- `personId`: obligatorio si `portals` no está vacío.

**Compatibilidad:** un documento con el `role` antiguo se lee con la función pura `normalizeMembership`. Los roles de staff se convierten en `staffRole`; `owner` o `tenant` se convierten en `portals: [role]`. Al editar se escribe el formato nuevo.

### Espacio de trabajo

Un espacio es el par `{ organizationId, lane }`, con `lane` = `admin`, `owner`, `tenant`, `applicant` o `guest`. Los espacios disponibles se calculan con la función pura `listWorkspaces(memberships)`.

La cookie `mghpm_organization` se sustituye por `mghpm_workspace`, con valor `orgId:lane`. Se valida en cada lectura; si no es válida, se ignora y se recalcula.

## 2. Autorización (`src/lib/access/`)

- `permissions.ts` (puro):
  - módulos: `dashboard`, `properties` (incluye unidades e imágenes), `people`, `leases`, `stay_inquiries`, `members`, `audit`;
  - acciones: `view`, `create`, `update`, `archive`, `manage`;
  - funciones `can(staffRole, module, action)` y `laneForRoute(pathname)`.
- `authorize.ts` (server-only):
  - `requireLane(lane)` y `requireStaffPermission(module, action)` devuelven `{ kind: "allowed", organizationId, userUid, staffRole, portals, personId, lane }` o un rechazo tipado: `unauthenticated` (401), `account_blocked` (403), `no_workspace` (409) o `forbidden` (403).
  - Leen la sesión, la cookie de espacio y la membresía. Todo lo que no se puede probar como permitido se deniega.
- `getPropertyWriteAccess`, `getManagementWriteAccess` y `getMembersWriteAccess` delegan en `requireStaffPermission` y mantienen su forma de respuesta. Las reglas actuales sobre quién puede gestionar a quién en Usuarios se conservan, por ejemplo que `admin` no gestiona a `org_owner`.

### Tabla de permisos del staff (lo que no aparece, se deniega)

| Rol | properties, people, leases, stay_inquiries | members | audit | dashboard |
|---|---|---|---|---|
| org_owner | view, create, update, archive | view, manage | view | view |
| admin | view, create, update, archive | view, manage | view | view |
| manager | view, create, update, archive | view | — | view |
| operations | view; además `update` en stay_inquiries | — | — | view |

**Cambio respecto a hoy:** `manager` pasa a operar las propiedades y `operations` pasa a consultar. Antes ninguno de los dos tenía acceso.

**Externos en 2A:** solo pueden leer su propia persona (`personId`). Las reglas por registro de propiedades y contratos llegan en las fases 3 y 5.

**Menú:** `AdminShell` muestra solo los módulos con `view`. Ocultar un enlace no reemplaza la verificación en cada página y API.

## 3. Rutas, shells y pantallas

**Staff:**
- `src/app/{dashboard,properties,people,leases,users,stay-inquiries}` pasan a `src/app/admin/...`.
- `/admin` es el panel principal.
- `app/admin/layout.tsx` llama a `requireLane("admin")` y pinta `AdminShell`.
- Redirecciones permanentes en `next.config.ts`: `/dashboard` → `/admin`, y `/properties/:path*`, `/people/:path*`, `/leases/:path*`, `/users/:path*` y `/stay-inquiries/:path*` → `/admin/...`.

**Portales:**
- `PortalShell` muestra la marca, el nombre del portal, el menú (Inicio y Mi perfil), el cambio de espacio y cerrar sesión. Nunca muestra el menú interno.
- `/propietario`, `/inquilino`, `/solicitante` y `/huesped` tienen cada uno:
  - un layout con `requireLane(...)`;
  - Inicio, con el mensaje "Tu portal se está preparando";
  - `/perfil`, con la persona propia en solo lectura.
- Están en español.

**Entrada:**
- `/acceder` es el selector bilingüe ES/EN con cinco opciones:
  - Personal, Propietario e Inquilino van a `/login?acceso=<lane>`;
  - Solicitante y Huésped aparecen como "Próximamente".
- `/login` muestra el tipo de acceso elegido.
- Tras iniciar sesión:
  - con un espacio del tipo elegido (o un único espacio en total), entra a ese espacio;
  - con varios, va a `/espacios`;
  - con ninguno, va a `/onboarding` si es el bootstrap del primer admin, o a la pantalla "Sin acceso".
- `/espacios` reemplaza a `/organizations/select`, que redirige ahí.
- `POST /api/workspace` cambia de espacio: verifica la membresía, fija la cookie y escribe `workspace.switched` en `auditEvents`.
- La landing enlaza "Portal Login" a `/acceder`.

**Estados comunes (componentes compartidos):**
- `NotAuthorized` (con un botón para ir a tu espacio) y `AccountBlocked`.
- Sesión expirada: redirección a `/acceder?motivo=sesion-expirada`.

## 4. Pantallas del staff

- **Usuarios y accesos (`/admin/users`):**
  - "Rol interno" (opcional) y "Accesos a portales" (Propietario e Inquilino, con la persona enlazada) se muestran por separado. Hace falta al menos uno de los dos.
  - El estado de la cuenta usa los estados nuevos.
  - Se auditan los cambios de rol, de portales y de estado.
- **Personas (`/admin/people`):** casillas de relaciones en el formulario y filtro por `relationshipTypes`.

## 5. Errores

- Si una membresía o persona sigue siendo inválida después de la normalización, se deniega el acceso y se registra en el log.
- Una cookie de espacio manipulada se ignora.
- Los rechazos de las API usan los códigos de la sección 2 y mensajes en español.

## 6. Pruebas

**Unitarias:**
- `can()` sobre toda la tabla;
- `normalizeMembership`, `normalizePerson` y `listWorkspaces`;
- `laneForRoute`.

**E2E `scripts/e2e/access.mjs`:**
- `admin`, `manager` y `operations`: páginas y API permitidas y denegadas según la tabla;
- propietario e inquilino: entran a su portal; `/admin` les muestra "No autorizado" y las API de staff responden 403;
- una membresía `suspended` no entra;
- `/api/workspace` rechaza espacios ajenos y audita el cambio;
- las redirecciones de las URL viejas funcionan.

**Suites existentes:** se actualizan a `/admin/...` y deben pasar todas.
