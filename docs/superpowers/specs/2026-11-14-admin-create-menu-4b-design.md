# Paso 4B — Botón "+ Nuevo" del admin (spec y plan)

Fecha: 14 nov 2026 · Estado: diseño aprobado (opción A: fijo con contexto). Pieza pequeña: spec y plan en un solo documento.

## Objetivo

Un botón "+ Nuevo" en la barra superior del admin (espacio `topbarTools` reservado en 4A) que abre un menú con las acciones de creación que el rol puede ejecutar, con contexto de propiedad.

## Diseño

### Acciones (manifiesto `src/lib/access/route-permissions.ts` → `createActions`)

| Acción | Ruta | Permiso | Contexto |
|---|---|---|---|
| Nueva propiedad | `/admin/properties/new` | properties:create | — |
| Nueva unidad | `/admin/properties/[propertyId]/units/new` | properties:create | solo con propiedad en la ruta |
| Nueva persona | `/admin/people/new` | people:create | — |
| Nuevo contrato | `/admin/leases/new` | leases:create | `?propertyId=` si hay propiedad |
| Nueva titularidad | `/admin/ownerships/new` | ownerships:create | `?propertyId=` si hay propiedad |
| Nuevo usuario | `/admin/users/new` | members:manage | — |

### Lógica (`src/lib/access/create-menu.ts`, pura)

`buildCreateMenu(pathname, role)` → `{ key, label, href }[]`:
- filtra por `can(role, module, action)`;
- toma `propertyId` de `matchAdminPage(pathname)` (el mismo de las migas);
- acciones con `[propertyId]` en la ruta solo aparecen con propiedad; las que aceptan propiedad agregan `?propertyId=`.

### Interfaz (`src/components/layout/create-menu.tsx`, cliente)

- Botón primario "+ Nuevo" con flecha; en móvil solo "+" con `aria-label="Nuevo"`.
- Menú desplegable alineado a la derecha, con ícono y etiqueta. Los elementos están siempre en el HTML (`hidden` cuando está cerrado) para que el servidor los renderice.
- Accesible: `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`/`menuitem`; Esc cierra y devuelve el foco al botón; clic afuera cierra; flechas ↑/↓ mueven el foco; elegir una opción cierra.
- Sin acciones (p. ej. operations) → el botón no se muestra.

### Pruebas

- Unitarias de `buildCreateMenu`: org_owner sin contexto (5 acciones), con propiedad (6, unidad incluida, `?propertyId=` en contrato y titularidad), manager sin "Nuevo usuario", operations vacío.
- Estática: cada `createActions[i].href` es una página del manifiesto que pide exactamente el mismo `{module, action}`.
- e2e (`permissions.mjs`): por rol, el bloque del menú en `/admin/properties` contiene exactamente los `href` esperados; en la ficha de la propiedad aparecen la unidad y `?propertyId=`.

## Plan

- [ ] 1. `createActions` en `route-permissions.ts` + prueba estática en `route-permissions.test.ts`.
- [ ] 2. `create-menu.ts` + `create-menu.test.ts` (TDD).
- [ ] 3. Componente `create-menu.tsx` + estilos en `admin-shell.module.css`; montarlo en `topbarTools` de `AdminShell`.
- [ ] 4. e2e en `scripts/e2e/permissions.mjs` (sección "Create menu × roles").
- [ ] 5. Verificación: typecheck, lint, unitarias, e2e completa; detener servidor 3100 y emulador huérfano. Registrar avance en `PLAN-NEXTJS-FIREBASE.md`. Sin commit.
