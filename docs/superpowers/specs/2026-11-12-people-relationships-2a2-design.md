# Fase 2A-2 — Persona con relaciones múltiples y titularidad

Fecha: 2026-11-12 · Origen: auditoría de accesos de Carmen (Person / BusinessRelationship separados) + prototipos Masters 19, 25, 26, 52 y 04 · Stack: Next.js 16 + Firebase · Precede a 2B (invitaciones).

## Objetivo

Una misma Persona puede ser propietario, inquilino, solicitante y huésped. Los propietarios se vinculan a propiedades mediante **titularidades** con porcentaje y verificación manual. Una cuenta puede abrir varios portales en la misma organización.

## Alcance

**Incluye**
- Persona `individual` o `entity` (con representante) y un mapa de relaciones.
- Colección `ownerships`, con regla de ≤ 100 % por propiedad y flujo de verificación manual con lista de comprobaciones.
- Membresía con `staffRole` + `portals` y una persona por portal.
- Pantallas: directorio con insignias, alta/edición de Persona, **ficha de Persona**, **Owner 360**, **Tenant 360**, alta y detalle de titularidad con revisión, pestaña **Propietarios** en la ficha de propiedad, Usuarios y accesos con portales.
- Primer contenido real de los portales: "Mis propiedades" (propietario) y "Mi contrato" (inquilino).
- Ajustes en Contratos y Usuarios; pruebas unitarias y e2e.

**No incluye**
- Adjuntos y documentos, que llegan en el bloque 3 con el Master 12.
- Acuerdo de gestión, banco y seguros del propietario.
- Incorporación desde prospecto (54 → 25), que pertenece a la fase de propietarios.
- Invitaciones (2B).
- Unir fichas duplicadas antiguas.
- Pestañas de los 360 sin datos (Finanzas, Mantenimiento, Documentos…).

## Decisiones

| Tema | Decisión |
|---|---|
| Propietario entidad | La Persona tiene `kind: individual \| entity`; la entidad tiene un representante (Persona individual) |
| Verificación | Estado y lista de comprobaciones con revisión manual auditada; sin adjuntos todavía |
| Pantallas | Ficha de Persona + Owner 360 + Tenant 360, solo con pestañas que tienen datos, + pestaña Propietarios en la propiedad |
| Almacenamiento | Relaciones como mapa dentro de la Persona; titularidad en su propia colección; proyección corta en la propiedad |

## 1. Modelo de datos

### Persona — `organizations/{org}/people/{id}`

- **Identidad:**
  - `kind`: `individual` o `entity`.
  - Si es entidad, `name` es la razón social y se agregan `entityType` (`trust`, `company`, `co_ownership` u `other`), `taxId` (RNC/EIN, hasta 30 caracteres) y `representativeId`, que debe apuntar a una Persona `individual` activa de la misma organización.
- **Relaciones:**
  - `relationships` puede tener las claves `owner`, `tenant`, `applicant`, `guest` y `owner_prospect`.
  - Cada valor es `{ status: "active" | "ended", since: Timestamp, endedAt?: Timestamp }`. `tenant` añade `propertyId` y `unitId` (nullable).
  - `relationshipTypes: string[]` guarda solo las relaciones activas.
- **Se mantienen** `name`, `email`, `emailKey`, `phone`, `status`, `archived`, `contactName` (solo entidades), `accountUid` y los campos de búsqueda. `searchKeys` y `filterKeys` incluyen las relaciones.
- **Unicidad:** la reserva pasa de tipo + email a `kind` + email. Las reservas antiguas por tipo se respetan al editar.
- **Compatibilidad:** la función pura `normalizePerson` lee los documentos que tienen `type`:
  - `owner` → `kind: entity` si tiene `contactName`, si no `individual`, con la relación `owner` activa;
  - `tenant` → `individual`, con la relación `tenant` activa y su propiedad y unidad.

  Al guardar se escribe el formato nuevo.

### Titularidad — `organizations/{org}/ownerships/{id}`

- **Vínculo:** `personId`, `propertyId`, `pct` (número entre 0.01 y 100, con dos decimales) y `startDate`.
- **Título:** `titleOwner`, `titleNumber`, `registryNumber`, `cadastralNumber` y `registryAddress`.
- **Verificación:**
  - `status`: `not_started`, `documents_pending`, `in_review`, `verified` o `rejected`;
  - `checks: { deedOnFile, recordMatches, ownerIdentity, entityGoodStanding, coOwnerAuthorization, managementAgreement }`, todos booleanos;
  - `reviewerUid`, `reviewedAt` y `rejectionReason`.
- **Ciclo de vida y metadatos:** `active` (booleano), `endedAt`, `organizationId`, `createdAt`/`createdBy` y `updatedAt`/`updatedBy`.
- **Transiciones válidas:**
  - `not_started` → `documents_pending` o `in_review`;
  - `documents_pending` → `in_review`;
  - `in_review` → `verified`, `rejected` o `documents_pending`;
  - `rejected` → `in_review`;
  - `verified` → `in_review`, cuando se reabre al editar los datos del título.

  Las transiciones viven en la función pura `canTransition`.
- **Reglas, aplicadas en una transacción que lee la propiedad y sus titularidades activas:**
  - una sola titularidad activa por persona y propiedad;
  - la suma de `pct` activos no puede pasar de 100;
  - crear una titularidad activa la relación `owner` de la persona;
  - finalizar una titularidad la marca `active: false` con `endedAt`. Si la persona se queda sin titularidades activas, su relación `owner` **no** se finaliza sola; el staff decide.
- **Proyección en la propiedad:** `ownerPersonIds: string[]` y `ownershipTotalPct: number`.

### Membresía — `organizations/{org}/memberships/{uid}`

- **Campos nuevos:** `staffRole` (rol de staff o `null`), `portals` (subconjunto de `owner`, `tenant`, `applicant` y `guest`), `portalPersonIds: { [portal]: personId }` y `status` (los estados de 2A-1).
- **Compatibilidad:** la función pura `normalizeMembership` lee el `role` antiguo. Un rol de staff pasa a `staffRole`. `owner` o `tenant` pasan a `portals: [role]`, con `portalPersonIds[role] = personId`.
- **Acceso a un portal:** hacen falta el portal en `portals`, `status: active` y la relación activa del mismo tipo en la Persona de `portalPersonIds`. Se verifica en `requireLane`.
- **Espacios:** `listWorkspaces` devuelve un espacio por cada carril de cada membresía, así que una misma organización puede aparecer varias veces. `resolveWorkspace` se mantiene por carril.

### Auditoría

- `person.relationship_added` y `person.relationship_ended`;
- `ownership.created`, `ownership.updated`, `ownership.status_changed` (con `from`, `to` y `reason`) y `ownership.ended`;
- `member.portals_changed`.

## 2. Permisos

- Módulo nuevo `ownerships` con las acciones `view`, `create`, `update`, `archive` y **`review`**.
- La tabla:
  - `org_owner` y `admin`: todas las acciones;
  - `manager`: `view`, `create`, `update` y `archive`, sin `review`;
  - `operations`: solo `view`.
- **Nadie puede revisar una titularidad que creó él mismo** (`createdBy === actor` → 403).
- **Propietario externo:** ve las titularidades `verified` y `active` de las Personas de su `portalPersonIds.owner` y de las entidades cuyo `representativeId` sea esa Persona.
- **Inquilino externo:** ve los contratos de su `portalPersonIds.tenant`.

## 3. Pantallas

Todas son páginas completas, sin paneles laterales.

**Directorio `/admin/people`:**
- Muestra insignias de relación y de entidad.
- Las pestañas filtran por `relationshipTypes`.

**Alta y edición de Persona:**
- `kind`; los campos de entidad, con un selector de representante entre las personas individuales;
- casillas Propietario e Inquilino (este con propiedad y unidad);
- email, teléfono y estado.

**Ficha de Persona `/admin/people/{id}`** (nueva vista principal; la edición sigue en `/edit`):
- encabezado con nombre, insignias y estado;
- datos de identidad y contacto;
- representante, o entidades representadas;
- tarjetas de relación con enlace a su 360;
- portales de la cuenta enlazada (solo lectura, con enlace a Usuarios);
- actividad.

**Owner 360 `/admin/people/{id}/propietario`:**
- encabezado con KPIs (propiedades activas, verificadas y pendientes de revisión);
- tabla de titularidades: propiedad, %, estado y última revisión;
- botón "Agregar propiedad";
- actividad.

**Tenant 360 `/admin/people/{id}/inquilino`:**
- encabezado con KPIs del contrato activo (renta, fin y depósito);
- contratos actuales e historial;
- actividad.

**Titularidad:**
- **Alta `/admin/ownerships/new`:** con `?personId` o `?propertyId`. Muestra el porcentaje disponible.
- **Detalle `/admin/ownerships/{id}`:**
  - datos y edición del título y del porcentaje;
  - lista de verificación;
  - acciones según la transición y el permiso: Marcar documentos pendientes, Pasar a revisión, Aprobar, Rechazar (con motivo) y Reabrir;
  - historial de revisiones;
  - Finalizar.

**Ficha de propiedad:** pestaña "Propietarios", con los titulares, su %, su estado, el total asignado y el botón "Agregar propietario".

**Usuarios y accesos:**
- "Rol interno" (opcional) y una casilla por portal (Propietario e Inquilino), cada uno con su persona;
- hace falta al menos uno de los dos;
- conceder un portal exige la relación activa.

**Portales:**
- `/propietario/propiedades`: "Mis propiedades", con nombre, ciudad y %.
- `/inquilino/contrato`: "Mi contrato", con propiedad y unidad, fechas, renta y estado.
- Las dos páginas se enlazan desde el menú del `PortalShell`.

## 4. Impacto en lo existente

- **Contratos:**
  - el selector de inquilino usa personas con la relación `tenant` (activa o candidata);
  - activar un contrato asegura la relación `tenant` activa, con la propiedad y la unidad del contrato;
  - terminarlo o vencerlo finaliza la relación si la persona no tiene otro contrato activo.
- **Usuarios:** la regla de vínculo cambia de "el tipo de la persona = rol" a "relación activa del portal". Se mantiene la coincidencia de email.
- **Propiedades:** archivar una propiedad conserva sus titularidades, que se muestran como "propiedad archivada".

## 5. Errores

| Código | Caso |
|---|---|
| 409 | Supera el 100 %; titularidad activa duplicada; portal sin relación activa; transición no válida |
| 400 | Rechazo sin motivo; porcentaje fuera de rango; representante que no es individual |
| 403 | Revisar sin permiso o la propia titularidad |
| 404 | Persona, propiedad o titularidad de otra organización |

Los datos inválidos tras la normalización se omiten y se registran en el log; nunca conceden acceso.

## 6. Pruebas

**Unitarias:**
- `normalizePerson` y `normalizeMembership`;
- `canTransition`;
- el porcentaje disponible;
- `can()` con `ownerships`;
- las reglas de acceso a portales.

**E2E:**
- nueva suite `ownerships.mjs`: alta, regla del 100 %, flujo completo de verificación con revisión propia prohibida y rechazo sin motivo, finalizar, Owner 360, pestaña Propietarios y portal del propietario aislado;
- `people.mjs`: entidad con representante y persona con dos relaciones;
- `members.mjs`: dos portales en una cuenta y cambio de espacio;
- `leases.mjs`: activar y terminar un contrato actualiza la relación de inquilino;
- todas las suites existentes siguen en verde.
