# Fase 2B — Ciclo de invitación de accesos — Diseño

Fecha: 2026-11-12 · Origen: Ruta al MVP, bloque 2 (`PLAN-NEXTJS-FIREBASE.md`) · Stack: Next.js 16 + Firebase · Sigue a 2A-2.

## Problema

Hoy el staff crea un acceso en Usuarios (o con "Dar acceso" desde Personas), Firebase envía el correo para definir la contraseña y el acceso nace **activo** al instante. No se sabe quién aceptó, no se puede cancelar una invitación y un acceso olvidado queda abierto indefinidamente. El estado `invited` existe en el esquema, pero nada lo usa.

## Decisiones del titular

- 2B es el **ciclo de invitación** con **aceptación explícita** (revisión de Carmen, punto 3): el acceso nace `invited` y solo se activa cuando la persona pulsa "Aceptar". Crear el acceso no equivale a aceptarlo.
- La invitación **caduca a los 7 días**. Reenviarla renueva el plazo.
- Aplica a **todo acceso nuevo**: staff (`admin`, `manager`, `operations`) y portales (propietario, inquilino).
- Se mantiene el correo de Firebase para definir contraseña. No hay correo propio (la Gmail API llega en el bloque 8).
- Enfoque: la invitación es un **estado del acceso** (`membership`), no una colección aparte.

## Fuera de alcance

- Botones de invitar desde Owner 360 o desde la activación del contrato (bloque 3).
- Correo de invitación personalizado.
- Registro libre de solicitantes (2C) y acceso de huésped por código (2D).
- Migración de accesos existentes: los `active` actuales no cambian.

## Modelo de datos

Campos nuevos en `organizations/{orgId}/memberships/{uid}`:

| Campo | Tipo | Significado |
|---|---|---|
| `invitedAt` | timestamp | Primer envío de la invitación. |
| `invitationExpiresAt` | timestamp | Último envío + 7 días. |
| `invitationSentCount` | number | Envíos realizados (1 al crear). |
| `acceptedAt` | timestamp \| null | Momento de la activación. |

Al enum `status` se agregan `cancelled` y `declined`.

Estados del acceso:

- `invited`: invitación pendiente.
- `active`: aceptada o creada antes de 2B.
- `cancelled`: el staff la canceló. Es terminal.
- `declined`: la persona la rechazó. Es terminal.
- Los estados existentes (`suspended`, `disabled`, `archived`) no cambian.

"Caducada" **no se guarda**: es `invited` con `invitationExpiresAt` vencida. Una regla pura `getInvitationState(membership, now)` devuelve uno de estos valores:

- `pending`: `invited` y vigente.
- `expired`: `invited` y vencida.
- `cancelled` o `declined`.
- `accepted`: `active`.
- `not_invitation`: cualquier otro estado.

La constante `INVITATION_TTL_DAYS = 7`.

## Flujos

### Invitar
`createOrganizationMember` crea el acceso con estos valores:
- `status: "invited"`;
- `invitedAt` y `invitationExpiresAt` = ahora + 7 días;
- `invitationSentCount: 1` y `acceptedAt: null`.

La vinculación con la ficha de Persona (`accountUid`) se hace al invitar, igual que hoy. El cliente sigue enviando el correo con `sendAccessEmail`. Se audita `member.invited`, que reemplaza a `member.created`. Permisos: `org_owner` y `admin`, como ahora.

### Aceptar o rechazar
`/espacios` muestra arriba una lista "Invitaciones pendientes" con las invitaciones `invited` vigentes del usuario. Cada una indica:
- la organización;
- el tipo de acceso (rol de staff o portal);
- quién invitó y cuándo vence.

Cada invitación tiene dos botones:
- **Aceptar** → `POST /api/invitations/{orgId}/accept`. En una transacción comprueba que el acceso del `uid` del token sigue `invited` y vigente, lo pasa a `active`, guarda `acceptedAt` y audita `member.invitation_accepted`. Después, el usuario entra a ese espacio.
- **Rechazar** → `POST /api/invitations/{orgId}/decline`. Pasa a `declined`, desvincula las fichas de Persona y audita `member.invitation_declined`.

Reglas:
- El acceso se identifica siempre por el `uid` del token verificado: no se puede aceptar ni rechazar una invitación ajena.
- El correo del token debe coincidir con el correo invitado. Si la persona inició sesión con otra cuenta, ve "Esta invitación es para otro correo" y no puede aceptarla.
- Si la persona ya tiene sesión abierta en otra organización, la invitación aparece en `/espacios` sin volver a iniciar sesión.

`listUserOrganizations` sigue contando solo los accesos `active`, así que una invitación pendiente, vencida, cancelada o rechazada nunca da acceso.

### Caducada o cancelada
En `/espacios`, si la persona no tiene accesos activos ni invitaciones pendientes vigentes, se elige la pantalla en este orden:
1. Algún acceso `suspended`, `disabled` o `archived` → `account_blocked` (como hoy).
2. Si no, alguna invitación `expired` o `cancelled` → nuevo `AccessState` `invitation_expired`: "Tu invitación caducó o fue cancelada. Pide al equipo que te la reenvíe."
3. Si no, `no_access`.

La nueva función `getMembershipAccessSummary(uid, now)` sustituye a `hasOnlyBlockedMemberships` y devuelve también las invitaciones pendientes.

### Reenviar
Acción en `/admin/users/[uid]/edit` y en la lista. Solo sirve para `invited`, esté vigente o vencida.
- Renueva `invitationExpiresAt` a ahora + 7 días e incrementa `invitationSentCount`.
- Audita `member.invitation_resent`.
- El cliente vuelve a enviar el correo de Firebase.
- Si el acceso ya está `active`, el botón existente "Reenviar correo de acceso" sigue enviando solo el correo de contraseña.

### Cancelar
Solo sirve para `invited`.
- Pasa a `cancelled` y quita `accountUid` de las fichas de Persona vinculadas, si apuntan a ese uid.
- Audita `member.invitation_cancelled`.
- La cuenta de Firebase **no se borra**, porque puede pertenecer a otra organización.

Para volver a invitar a esa persona se crea un acceso nuevo: el alta detecta un acceso `cancelled` o `declined` con el mismo uid y lo reemplaza dentro de la transacción. Así deja de dar el error "ya existe".

### Pantalla Usuarios
- La columna Estado muestra:
  - "Invitado · vence 19 nov";
  - "Invitación caducada";
  - "Invitación cancelada";
  - "Activo", "Suspendido", etc.
- Nuevo filtro "Invitaciones pendientes" (`invited`, vigentes o vencidas).
- La lista ya muestra el último acceso; "Aceptó" usa `acceptedAt` en la ficha de edición.
- El selector de estado de la ficha no ofrece `invited` ni `cancelled`. Esos estados solo cambian con las acciones Reenviar y Cancelar.

## API

- `POST /api/members`: crea el acceso como `invited` (sin cambios de contrato).
- `POST /api/members/[uid]/invitation/resend` → 200 con `{ invitationExpiresAt }`. Responde 409 si el acceso no está `invited`.
- `POST /api/members/[uid]/invitation/cancel` → 200. Responde 409 si no está `invited`.
- `POST /api/invitations/[orgId]/accept` y `/decline` → 200. Responden 409 si la invitación no está `invited` y vigente, y 403 si el correo no coincide. Solo usan la sesión del propio usuario.
- Invitar a alguien que ya tiene un acceso `invited` o `active` en la organización → 409 "Esta persona ya tiene acceso o una invitación pendiente".
- Todas las rutas nuevas usan CSRF (`readJsonRequestBody`) y el permiso de gestión de Usuarios.
- Errores en español, por el mismo camino que `src/lib/members/api.ts`.

## Seguridad

- Una invitación vencida, cancelada o rechazada nunca activa el acceso: la regla se evalúa en el servidor, dentro de la transacción y con la hora del servidor.
- Nadie puede aceptar una invitación ajena: la activación usa el `uid` del token verificado y exige que su correo coincida con el invitado.
- Aislamiento: una organización nunca ve ni modifica invitaciones de otra; todas las consultas van por la organización de la ruta y la del actor.
- Reenviar y cancelar requieren el mismo permiso que crear accesos y no se pueden aplicar sobre la propia cuenta.

## Índices

La consulta de aceptación usa el `collectionGroup("memberships")` por `userUid` que ya existe, y filtra en memoria. No hacen falta índices nuevos.

## Pruebas

- Unitarias: `getInvitationState` (pendiente, vencida justo en el límite, cancelada, aceptada, no invitación) y el orden de pantallas de `getMembershipAccessSummary` como función pura sobre una lista de estados.
- E2E `scripts/e2e/invitations.mjs`:
  - invitar → `invited`; iniciar sesión **no** activa; `/espacios` lista la invitación; sin acceso a `/admin` ni al portal;
  - aceptar → `active`, auditado, entra al espacio;
  - rechazar → `declined`, Persona desvinculada, sin acceso;
  - invitación vencida (fecha forzada en el emulador) → aceptar responde 409 y `/espacios` muestra "caducó";
  - reenviar → vuelve a estar vigente y aceptar funciona;
  - cancelar → bloqueado y se puede volver a invitar;
  - **cuenta equivocada**: otro usuario no puede aceptar (409) ni ver la invitación ajena;
  - **ya es miembro**: invitar a un acceso `active` responde 409;
  - **entre organizaciones**: un admin de la organización B no puede reenviar ni cancelar invitaciones de A (403/404), y la invitación de A no aparece en el espacio de B;
  - **persona que ya tenía cuenta** (staff en otra organización): ve la invitación sin cerrar sesión y solo obtiene acceso al aceptar;
  - un `manager` no puede reenviar ni cancelar (403).
- Ajustes en `members.mjs` y `access.mjs`: los accesos recién creados empiezan `invited`, y un helper nuevo de `lib.mjs` (`acceptInvitation`) los acepta antes de comprobar el acceso.
