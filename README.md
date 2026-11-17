# MGHPM Property Management

Aplicación Next.js para administrar propiedades. La identidad usa Firebase Authentication y el modelo de datos se construirá sobre Cloud Firestore.

## Requisitos

- Node.js 24.12 o superior.
- Un proyecto Firebase de desarrollo. No uses credenciales de producción en local.
- Firebase CLI para iniciar los emuladores (instálalo globalmente o ejecútalo con `npx firebase-tools`).

## Inicio local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env.local` y completa la configuración de una app web Firebase de desarrollo.
3. Configura Firebase Admin con Application Default Credentials (`GOOGLE_APPLICATION_CREDENTIALS`) y el `FIREBASE_PROJECT_ID` del mismo proyecto.
4. En Firebase Authentication, habilita Email/Password y crea un usuario de prueba.
5. Copia el UID de ese usuario en `FIREBASE_BOOTSTRAP_ADMIN_UID` dentro de `.env.local`; esa cuenta podrá crear una única organización inicial.
6. Inicia los emuladores para Auth/Firestore/Storage en un proyecto de demostración:

   ```powershell
   npx firebase-tools emulators:start --project demo-mghpm
   ```

7. Inicia Next.js:

   ```powershell
   npm run dev
   ```

La app no tendrá una sesión válida sin una configuración real de Firebase Auth. Los valores de ejemplo no son credenciales y no deben sustituirse por claves de producción.
Define `APP_ORIGIN` con el origen HTTPS canónico en staging/producción; la API de sesión lo exige para validar solicitudes same-origin.
El asistente de organización inicial permite elegir moneda base y zona horaria. La incorporación de miembros por invitación se implementará en una fase posterior.

## Comandos

```powershell
npm run lint
npm run typecheck
npm run build
```

## Prueba end-to-end (emuladores)

`scripts/e2e/properties.mjs` (Masters 03, 04 y 20), `scripts/e2e/units.mjs` (generación de unidades), `scripts/e2e/images.mjs` (imágenes en almacenamiento local), `scripts/e2e/people.mjs` (Master 19), `scripts/e2e/members.mjs` (Usuarios y accesos), `scripts/e2e/leases.mjs` (Masters 40 y 15) y `scripts/e2e/stays.mjs` (Master 29, catálogo público) `scripts/e2e/access.mjs` (accesos por tipo de usuario, Fase 2A-1) y `scripts/e2e/ownerships.mjs` (titularidades, portal del propietario y migración, Fase 2A-2) verifican API, Firestore y páginas con sesiones reales contra los emuladores; los helpers comunes están en `scripts/e2e/lib.mjs`. **Borra los datos del proyecto de emulador `demo-mghpm`**; nunca apunta al proyecto real.

1. Inicia los emuladores:

   ```powershell
   npx firebase-tools emulators:start --project demo-mghpm --only auth,firestore
   ```

2. En otra terminal (Git Bash), inicia Next.js en el puerto 3100 apuntando a los emuladores:

   ```bash
   FIREBASE_PROJECT_ID=demo-mghpm NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-mghpm    FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099    PUBLIC_CATALOG_ORGANIZATION_ID=org-a    GOOGLE_APPLICATION_CREDENTIALS= FIREBASE_BOOTSTRAP_ADMIN_UID=none npx next dev -p 3100
   ```

3. Ejecuta `npm run test:e2e`. Debe terminar con `0 failed`.

## Accesos por tipo de usuario (Fase 2A-1)

Cada tipo de usuario tiene su propia ruta, protegida por su layout:

- `/admin`: Administración (roles `org_owner`, `admin`, `manager` y `operations`). Las pantallas del staff viven aquí: `/admin/properties`, `/admin/people`, `/admin/leases`, `/admin/users` y `/admin/stay-inquiries`.
- `/propietario`, `/inquilino`, `/solicitante` y `/huesped`: portales de propietarios, inquilinos, solicitantes y huéspedes.

`/acceder` es la entrada común y lista los tipos de acceso. `/espacios` resuelve el espacio de trabajo: si la persona tiene varias organizaciones elige una, y muestra las pantallas de cuenta suspendida o sin acceso.

La tabla de permisos (rol × módulo × acción) está en `src/lib/access/permissions.ts` y deniega por defecto. `manager` opera propiedades, personas, contratos, imágenes y solicitudes de estadía pero no gestiona usuarios; `operations` es de solo lectura, salvo el estado de las solicitudes de estadía.

Las URL viejas (`/dashboard`, `/properties`, `/people`, `/leases`, `/users`, `/stay-inquiries`) redirigen a su ruta bajo `/admin`.

## Persona y titularidad (2A-2)

Una Persona (individual o entidad) puede tener varias relaciones activas: propietario e inquilino. El correo es único por tipo (individual o entidad) y el directorio filtra por relación (`?type=owner|tenant` se conserva como alias). Cada persona tiene su ficha en `/admin/people/{id}`, con las vistas Owner 360 (`/propietario`) e Inquilino 360 (`/inquilino`).

- **Titularidades:** vinculan a un propietario con una propiedad y llevan el porcentaje (hasta 100 % por propiedad, una titularidad activa por persona y propiedad) y los datos del título. Se crean en `/admin/ownerships/new`, se revisan en `/admin/ownerships/{id}` y se ven en la pestaña Propietarios de la propiedad (`?tab=owners`).
- **Verificación manual:** `not_started`, `documents_pending`, `in_review`, `verified` y `rejected`. Verificar o rechazar exige el permiso de revisión (`org_owner` y `admin`) y a una persona distinta de quien creó la titularidad; rechazar pide un motivo. Editar el título, el porcentaje o las comprobaciones de una titularidad verificada la devuelve a `in_review`.
- **Portales:** una cuenta puede abrir varios portales en la misma organización (`staffRole` + `portals` + `portalPersonIds`). Cada portal exige una persona con la relación activa de ese tipo. `/propietario/propiedades` muestra las titularidades verificadas del propietario y de las entidades que representa, y `/inquilino/contrato` el contrato activo.
- **Contratos:** activar un contrato crea la relación de inquilino; terminarlo o vencerlo la finaliza si no queda otro contrato activo. Una renovación debe conservar al inquilino.

`scripts/e2e/ownerships.mjs` cubre el flujo completo, incluida la migración contra el emulador.

## Migración 2A-2 (personas con relaciones)

Las personas antiguas (`type` propietario/inquilino) y las membresías de un solo rol se reescriben al formato nuevo (`kind` + `relationships`, `staffRole` + `portals`). El script es idempotente: no toca los documentos que ya están migrados, y conserva `type`, `role` y las reservas de correo antiguas. Orden:

1. Desplegar los índices: `firebase deploy --only firestore:indexes` y esperar a que estén listos.
2. Desplegar el código nuevo y ejecutar la migración de inmediato: las personas sin migrar no aparecen en los filtros de `/admin/people` hasta que se migran.
3. Simular: `$env:FIREBASE_PROJECT_ID="<proyecto>"; npm run migrate:relationships -- --dry-run` (con `--org <id>` para una sola organización). Usa las credenciales por defecto de Google (`GOOGLE_APPLICATION_CREDENTIALS`) o los emuladores si `FIRESTORE_EMULATOR_HOST` está definido. El script imprime `TARGET: EMULATOR ...` o `TARGET: REAL project ...`; revisa que sea el destino correcto.
4. Ejecutar con `--yes` (`npm run migrate:relationships -- --yes`); sin `--yes` el script se niega a escribir en un proyecto real. Revisa los conteos finales. Un aviso de "email reservation conflict" indica que dos personas del mismo tipo (individual o entidad) comparten correo; hay que resolverlo a mano.
5. Verificar en `/admin/people` que los conteos de Propietarios e Inquilinos coinciden con lo esperado.

## Imágenes de propiedades (almacenamiento local)

Las imágenes se guardan en el disco del servidor, fuera de `public/`, bajo `storage/organizations/{orgId}/properties/{propertyId}/images/{imageId}/` (`original.*` y `thumbnail.webp` de 640×480). `LOCAL_STORAGE_DIR` cambia la carpeta. Firestore guarda los metadatos y la propiedad proyecta `imageCount` y `coverImageId`. El staff las lee por `/api/properties/[id]/images` con sesión y rol. El catálogo público las sirve por `/api/public/stays/images/...` solo mientras la propiedad tenga una estadía visible. En producción el servidor necesita un disco persistente.

## Catálogo público de estadías (Master 29)

`/estancias` (español) y `/stays` (inglés) son la misma página traducida: `next.config.ts` las reescribe a las rutas internas `/[lang]/stays`, y las URL viejas `/es/stays` y `/en/stays` redirigen a ellas. Muestran las unidades publicadas de `PUBLIC_CATALOG_ORGANIZATION_ID`. Una unidad aparece si la propiedad está activa, sin archivar, es de corto plazo o de ambos tipos y tiene moneda, y si la unidad está disponible, sin contrato activo, publicada y con tarifa. Las solicitudes se guardan en `organizations/{orgId}/stayInquiries` y el staff las atiende en `/admin/stay-inquiries`.

## Seguridad de datos inicial

Las reglas de Firestore y Storage niegan todo acceso directo desde clientes. Las operaciones de negocio deben pasar por servicios de servidor que verifiquen sesión, organización, capacidad y alcance del registro antes de usar Firebase Admin. El Admin SDK omite las reglas de Firebase; no es una capa de autorización automática.

No se deben guardar llaves privadas en el repositorio. Usa `.env.local` para configuración local y un gestor de secretos/credenciales administradas en hosting. Revisa el plan en [`design_handoff_mghpm/docs/PLAN-NEXTJS-FIREBASE.md`](design_handoff_mghpm/docs/PLAN-NEXTJS-FIREBASE.md) antes de extender las decisiones de dominio.

## Handoff de diseño

Los 67 prototipos bajo `design_handoff_mghpm/prototypes/` son referencias visuales y contienen datos simulados. No representan funcionalidades conectadas a producción.
