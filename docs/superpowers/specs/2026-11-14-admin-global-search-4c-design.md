# Paso 4C — Buscador global del admin (spec y plan)

Fecha: 14 nov 2026 · Estado: diseño aprobado (alcance A: propiedades, personas y contratos; interacción A: caja con resultados al escribir + página de resultados).

## Objetivo

Buscar desde la barra superior en propiedades, personas y contratos, con resultados mientras se escribe, y una página `/admin/buscar?q=` con todos los resultados. Sin índices nuevos: se reutilizan las claves `searchKeys` y los índices de cada lista.

## Diseño

### Reglas puras (`src/lib/search/modules.ts`)

- `SEARCH_MIN_LENGTH = 2`, `SEARCH_MAX_LENGTH = 80` (igual que `?q=` de las listas).
- `cleanSearchText(value)`: recorta; `""` si no es texto o tiene menos de 2 caracteres; corta en 80.
- `searchModules`: Propiedades (`/admin/properties`), Personas (`/admin/people`), Contratos (`/admin/leases`).
- `searchModulesFor(role)`: solo los módulos con `view`.
- `searchListHref(module, q)` y `searchPageHref(q)`.

### Consulta (`src/lib/search/global.ts`, server-only)

`searchEverything(organizationId, role, text, limit)` → `SearchGroup[]` (`{ module, label, listHref, items, unavailable }`), consultas en paralelo:

| Módulo | Clave (`searchKeys` array-contains) | Orden | Resultado |
|---|---|---|---|
| Propiedades | `getPropertySearchKey` sin filtros, sin archivadas | `searchName` | nombre · código, ciudad |
| Personas | `getPersonSearchKey` sin filtros, sin archivadas | `searchName` | nombre · correo |
| Contratos | `getLeaseSearchKey("", q)` | `code desc` | código · inquilino, propiedad y unidad |

Si una consulta falla (p. ej. índice no listo), ese grupo vuelve con `unavailable: true` y los demás siguen.

### API `GET /api/search?q=`

`requireStaffPermission("dashboard", "view")` (todo el staff); responde `{ groups }` con 5 resultados por grupo. Portales → 403, anónimo → 401. Declarada en `staffApiPermissions`.

### Caja de búsqueda (`src/components/layout/global-search.tsx`)

- En `topbarTools`, antes de "+ Nuevo". Campo "Buscar…" con atajo visible (`Ctrl K` o `⌘K` en Mac); `Ctrl/⌘+K` y `/` (fuera de campos de texto) llevan el foco.
- Espera 250 ms y cancela la consulta anterior (`AbortController`); estados "Buscando…", "Sin resultados", error, grupo no disponible.
- Combobox accesible: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; lista `role="listbox"` agrupada; ↑/↓ mueven, Enter abre el resultado activo o la página de resultados, Esc cierra, clic afuera cierra.
- Pie "Ver todos los resultados" → `/admin/buscar?q=`.
- Móvil (≤ 760 px): botón de lupa que despliega la caja a todo el ancho de las acciones.

### Página `/admin/buscar`

`dashboard:view`, miga "Buscar" (padre `/admin`). Formulario con `q`, grupos con hasta 25 resultados y "Ver en la lista" (`/admin/<módulo>?q=`). Sin texto suficiente: indicación de escribir al menos 2 caracteres.

## Pruebas

- Unitarias (`modules.test.ts`): `cleanSearchText`, `searchModulesFor` por rol (portal y null → vacío), enlaces.
- Estáticas: las del manifiesto (página y API nuevas declaradas).
- e2e `scripts/e2e/search.mjs`: prefijo de nombre, sin tildes, código de propiedad, persona por correo, contrato por código e inquilino; < 2 caracteres → sin grupos; portal 403, anónimo 401; página `/admin/buscar` con grupos y "Ver en la lista". La matriz de `permissions.mjs` cubre la página y la API por rol.

## Plan

- [ ] 1. `modules.ts` + pruebas (TDD).
- [ ] 2. `global.ts`.
- [ ] 3. API `src/app/api/search/route.ts` + manifiesto.
- [ ] 4. Página `src/app/admin/buscar/page.tsx` + manifiesto.
- [ ] 5. Componente `global-search.tsx` + estilos; montarlo en `AdminShell`.
- [ ] 6. e2e `search.mjs` y `package.json`.
- [ ] 7. Verificación completa, limpieza de procesos, registro en `PLAN-NEXTJS-FIREBASE.md`. Sin commit.
