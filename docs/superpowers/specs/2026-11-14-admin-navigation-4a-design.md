# Paso 4A — Navegación del admin: menú por secciones, migas de pan, Titularidades y Auditoría

Fecha: 14 nov 2026 · Estado: diseño aprobado, pendiente de plan.
Contexto: paso 4 del plan (barra superior del admin), descompuesto en A (esta pieza) → B "+ Nuevo" → C buscador global → E ES/EN de todo el admin. D (campana) pasa al bloque 8.

## Objetivo

1. El menú lateral muestra todos los módulos existentes, agrupados por secciones, y oculta lo que el rol no puede ver.
2. La barra superior muestra migas de pan correctas en cada página `/admin`, con nombres reales (propiedad, persona, contrato…).
3. Existen las dos páginas que faltaban para completar el menú: listado de **Titularidades** y visor de **Auditoría**.

## Decisiones tomadas

- Migas con nombres reales (no "Detalle" genérico) cuando la página los tiene.
- Titularidades: listado con filtro por estado.
- Auditoría: cronológica, filtro por área.
- Menú agrupado por secciones.
- Enfoque 1: el manifiesto `route-permissions.ts` define la estructura (etiqueta y padre de cada página); cada página aporta solo los nombres dinámicos.

## 1. Manifiesto y migas

### Manifiesto (`src/lib/access/route-permissions.ts`)

Cada entrada de `adminPagePermissions` gana `label` y `parent` (el nombre se mantiene):

```ts
"/admin/properties/[propertyId]/units/[unitId]/edit": {
  module: "properties", action: "update",
  label: "Editar unidad {unitId}", parent: "/admin/properties/[propertyId]",
}
```

- `label` admite marcadores `{param}` que se sustituyen por el nombre real que aporta la página.
- `parent` es otro patrón del manifiesto; `/admin` no tiene padre.

`adminNavigation` pasa a `adminNavigationSections`:

| Sección | Entradas |
|---|---|
| Inicio | Panel principal |
| Cartera | Propiedades, Titularidades |
| Arrendamiento | Personas, Contratos, Solicitudes de estadía |
| Administración | Usuarios y accesos, Auditoría |

### `buildBreadcrumbs(pathname, names)` (`src/lib/access/breadcrumbs.ts`, pura)

- Resuelve el patrón del `pathname`; las rutas literales ganan a las dinámicas (`/admin/people/new` antes que `/admin/people/[personId]`).
- Sube por `parent` hasta `/admin`; la raíz se muestra como "Inicio".
- Sustituye `{param}` con `names[param]`; si falta el nombre, usa "Detalle".
- Devuelve `[{ label, href }]`; el último elemento no lleva `href` y se marca `aria-current="page"`.
- Ruta desconocida: solo "Inicio".

### Nombres reales

`AdminShell` recibe la prop opcional `crumbNames: Record<string, string>`. Las páginas de detalle/edición que ya cargan la entidad pasan su nombre (propiedad, unidad, persona, contrato, titularidad, usuario). No se hacen lecturas extra solo para las migas.

### Pruebas estáticas (amplían `route-permissions.test.ts`)

- Toda página tiene `label`; todo `parent` existe en el manifiesto; no hay ciclos y todo llega a `/admin`.
- Cada `{param}` de un `label` aparece en el patrón de la página.
- Las páginas cuyo `label` usa `{param}` pasan `crumbNames` con esa clave.
- Cada entrada del menú pertenece a una sección y abre una página con `view` del mismo módulo (regla ya existente).
- Pruebas unitarias de `buildBreadcrumbs`: literal vs dinámica, nombre faltante, ruta desconocida, raíz.

## 2. Páginas nuevas

### `/admin/ownerships` — Titularidades (`ownerships:view`)

- Columnas: propiedad, titular, %, estado, inicio, fin. Nombres por lookup en lote (`getPropertySummaries`, `getPersonSummaries` de `src/lib/ownerships/lookups.ts`).
- Filtro `?estado=`: Activas (por defecto), Sin iniciar, Documentos pendientes, En revisión, Verificadas, Rechazadas, Finalizadas (`active == false`).
- Orden `createdAt desc`, 25 por página, paginación por cursor hacia adelante ("Siguiente página" / "Primera página").
- Botón "Nueva titularidad" solo con `ownerships:create`.
- Índices: `ownerships (active, createdAt desc)` y `ownerships (active, status, createdAt desc)`. Si falta un índice, aviso en la página en vez de error.
- Móvil: tabla con desplazamiento horizontal dentro de su tarjeta (`tableScroller`), igual que las demás listas del admin.

### `/admin/audit` — Auditoría (`audit:view`)

- Nuevo campo `area` en cada evento: `properties`, `people`, `leases`, `ownerships`, `access`, `stays`.
- Helper `auditEventFields(action, …)` que deriva `area` de la acción; todas las escrituras de `auditEvents` lo usan. Prueba estática: ninguna escritura a `auditEvents` sin el helper.
- Migración `npm run migrate:audit-area`: simulación por defecto, `--yes` para escribir, idempotente.
- Índice: `auditEvents (area, createdAt desc)`.
- Tabla: fecha y hora en la zona de la organización, actor (nombre por lookup en lote, si no el uid), acción con `auditActionLabels` completo (todas las acciones que hoy se escriben), enlace al objetivo, fila expandible con el detalle (de → a, motivo).
- Filtro por área, 50 por página, cursor hacia adelante. Sin índice: aviso, no error.

Ambas páginas entran en el manifiesto, en el menú y en la e2e de permisos.

## 3. Barra superior y adaptación a pantallas

- **Izquierda:** botón de menú (contraer en escritorio / abrir el cajón en móvil) y migas `Inicio › … › actual` en `<nav aria-label="Migas de pan"><ol>…</ol></nav>`.
- **Derecha:** igual que hoy (selector de organización, `ES` fijo, avatar, salir), más un contenedor `topbarTools` vacío a la izquierda del selector, reservado para B y C. Sin botón EN hasta E. Sin campana.
- **Menú lateral:** títulos de sección en versalitas al estar expandido; al contraerse, separador fino entre secciones y nombre completo como tooltip. Íconos nuevos: Titularidades `ScrollText`, Auditoría `History`. Se ocultan las secciones sin entradas visibles y se elimina el pie "Módulos en preparación".
- **Móvil (<768 px):** migas como `… › penúltimo › último`, el último truncado con puntos suspensivos; sin desplazamiento horizontal.
- **Tablet:** rastro completo, nombres largos truncados a ~24 caracteres con el nombre completo en `title`.
- **Escritorio:** rastro completo.

## Verificación

- Pruebas unitarias y estáticas descritas arriba (incluida la de `auditEventFields`).
- e2e:
  - `permissions.mjs`: las dos páginas nuevas por rol; el menú por secciones según rol.
  - Nueva suite `navigation.mjs`: el HTML de páginas de detalle contiene la miga con el nombre real; el filtro de Titularidades devuelve lo correcto por estado; Auditoría filtra por área; la migración `area` funciona en el emulador (simulación sin cambios, `--yes` completa, segunda pasada sin cambios).
- Manual: lista de comprobación en escritorio y móvil (menú contraído/expandido, cajón móvil, migas largas).

## Fuera de alcance

"+ Nuevo" (B), buscador (C), selector ES/EN real y traducción (E), notificaciones (bloque 8).

## Tareas del dueño

- Crear los 3 índices nuevos en Cloud Shell (comandos en el plan).
- Ejecutar `npm run migrate:audit-area` (simulación y luego `--yes`) contra producción tras el despliegue.
