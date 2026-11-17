# Handoff: MGHPM Enterprise — 67 Masters (frontend admin)

Paquete para implementar en **MGHPM-Corecciones** con VS Code + Claude Code. Fecha: 12 oct 2026. Línea base: Auditoría 360° v3.8.1 (cierre del Lote 5).

## Resumen
MGHPM Enterprise es el panel de administración de propiedades de My Global Hub Property Management. Este paquete contiene los 67 prototipos Master (uno por pantalla), los reportes de auditoría y seguridad, y el mapa pantalla → ruta de código.

## Sobre los archivos de diseño
Los archivos de `prototypes/` son **referencias de diseño en HTML**: muestran el aspecto y el comportamiento esperados. **No son código de producción para copiar.** La tarea es **recrear estas pantallas en el entorno existente del repo** — React 19 + Vite + TypeScript, React-Bootstrap, Redux Toolkit, Formik/Yup, i18next (es/en) — con los patrones que ya existen en `frontend/src` (`shared/ui/admin/*`, `layouts/admin/MghAdminShell.tsx`, `config/admin/adminMenu.tsx`, `shared/constants/adminRoutes.ts`, `config/admin/navPermissions.ts`).

Para ver un prototipo: abrir `prototypes/` con un servidor estático (por ejemplo `npx serve prototypes` o Live Server en VS Code) y abrir cualquier `Master NN - … .dc.html`. Los datos son simulados (`*-data.js`); las acciones del prototipo no llaman a ninguna API.

## Fidelidad
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado, estados y flujos son finales. Recrear con precisión usando los componentes existentes del repo. Si el código y el diseño difieren en tokens, mandan los tokens de abajo (ver "Diferencias con el código").

## Orden de trabajo (obligatorio)
1. **Primero seguridad y Fase 0** — `docs/MGHPM-Fase-0-Claude-Code.md` y `docs/MGHPM-Fase-2A.1-Seguridad.md` (24 hallazgos: 5 P0, 7 P1). Los P0 (S-01…S-05) bloquean cualquier pantalla que exponga los mismos datos.
2. **Parches de backend** — `backend-patches/phase2a2/` (ver su `README_PHASE_2A2.md`). Revisar antes de aplicar; no ejecutar migraciones históricas.
3. **Pantallas por fase** — `SCREENS.md` lista las 67 con su ruta, estado (PARCIAL / FALTANTE) y fase. Seguir el orden de dependencias de `docs/MGHPM-360-Audit-v3.8.1.md` §F0.7 y la entrega priorizada §K.

## Pantallas
Ver **`SCREENS.md`** (tabla completa). Reglas comunes a todas:
- **Shell:** barra lateral fija teal (~208 px) + barra superior blanca fija (búsqueda ⌘K, selector de portafolio, "+ Nuevo", campana, avatar, selector **ES | EN**). Contenido con padding 24 px, máx. ~1280 px; columna principal + riel derecho ~300 px cuando aplica. Referencia: `Master 01 - App Layout`.
- **Navegación:** cada pantalla tiene migas de pan y enlace "volver" a su lista padre. Cada ítem de la barra lateral debe tener ruta en `adminRoutes.ts`, registro en `AdminApp.tsx` y capacidad en `navPermissions.ts` (menú, ruta y API deben coincidir — ver Seguridad §A2, 11 discrepancias).
- **Listas:** tabla con `Pagination` del sistema (números + tamaño de página), filtros tipo píldora, exportación con formato en el botón ("CSV", "PDF").
- **Detalles "360":** encabezado con ID + estado, KPIs, pestañas, línea de tiempo, documentos y enlaces cruzados a registros relacionados.
- **Responsive:** medido a 390 / 1024 / 1440 px (Auditoría §T6). En móvil las tablas se desplazan dentro de su tarjeta.

## Interacciones y comportamiento
- Transiciones de color 120–180 ms, ease estándar. Sin escalas ni rebotes.
- Hover: botón sólido teal → `#005A57`, presionado `#004F4D`; filas y botones outline → fondo `#F8FAFC`.
- Foco: borde teal + anillo 3 px teal al 18 %.
- Estados de carga, vacío y error: presentes en cada lista del prototipo; replicar con los componentes del repo.
- Validación de formularios: reglas visibles en cada Master de formulario (20, 23, 30, 40, 42); implementar con Formik/Yup.
- Flujos financieros (Masters 16, 48, 49, 61–66): cada acción contabiliza en el libro; ver Auditoría §T4 y §F0.5 (idempotencia, monto calculado en servidor, atomicidad).
- Las acciones del prototipo que solo muestran un toast son **SIMULADAS** — requieren endpoint real.

## Estado e idioma
- Estado global con Redux Toolkit; datos vía la API existente con cabecera `X-Organization`.
- **Español (es-DO) es el idioma base; inglés (en-US) secundario.** Todo texto de UI va con claves i18next; nunca textos en inglés fijos. Las claves del prototipo están en `prototypes/i18n.js` (`MGH_I18N.t('grupo.clave')`) — migrarlas a los archivos de i18next del repo.
- Documentos y correos siguen el **idioma preferido del destinatario** (`prefLang` / `docLang`: Español, English, Bilingüe ES/EN), nunca el idioma de la UI del staff. Los datos ingresados por el usuario no se traducen.
- Identificadores, rutas, nombres de archivo y códigos de estado se mantienen en inglés; solo se traducen las etiquetas visibles.

## Tokens de diseño
**Color**
- Primario / menú `#006B68` • hover `#005A57` • oscuro / presionado `#004F4D` • teal suave `#DDF3F1`
- Secundario navy `#132A52` • títulos de página `#172033`
- Info azul `#0094CC` • premium dorado `#D4A637` (barra superior 3 px en tarjetas de atención)
- Fondo `#F8FAFC` • superficie `#FFFFFF` • borde `#E2E8F0` • texto secundario `#64748B` / `#475569` / `#334155`
- Estados (fondo / texto): verde `#DCFCE7`/`#166534` • ámbar `#FEF3C7`/`#92400E` • rojo `#FEE2E2`/`#991B1B` • azul `#E0F2FE`/`#075985` • neutro `#F1F5F9`/`#475569`
- Modo oscuro: lienzo `#0F172A`, tarjetas `#1E293B`, borde `#334155`, inputs `#1E293B`/`#475569`, foco `#0F766E`, títulos `#2DD4BF`

**Tipografía** — Plus Jakarta Sans en todo, numerales tabulares (`font-variant-numeric: tabular-nums`), sin monoespaciada.
- Título de página 28 px / 700 • sección 18 / 600 • título de tarjeta 16 / 600 • cuerpo 13–14 / 400–500 • meta 11–12 • eyebrow y encabezados de tabla 11 px / 600, MAYÚSCULAS, +0.06em

**Espaciado** — padding de tarjeta 16–20 px • gaps 12–20 px • padding de página 24 px.

**Radios** — 4 (checkbox, chips de código) • 6 (botones, inputs, ítems de menú) • 8 (sub-paneles) • 12 (tarjetas) • píldora (badges, filtros).

**Sombras** — tarjeta `0 1px 2px rgba(15,23,42,.05)`; elevación por borde, no por sombra. Ítem seleccionado: barra izquierda teal 3 px + sombra elevada.

**Iconos** — Lucide (trazo 1.5–2 px), 14–16 px en línea, 28–32 px en mosaicos tintados. Sin emoji.

### Diferencias con el código
- Teal del código `#0F766E` → usar `#006B68` (hover `#005A57`).
- Títulos de página teal en el código → `#172033`.
- Monoespaciada en montos/IDs → eliminar; Plus Jakarta Sans con numerales tabulares.

## Recursos
- `prototypes/assets/logo-mark.png`, `logo-horizontal.png` — logos MGHPM. En el producto, el logo y nombre salen de `Organization.logo` por organización.
- `prototypes/_ds/…` — tokens CSS y componentes del sistema de diseño usados por los prototipos (referencia de valores).
- Las fotos de propiedades del prototipo son marcadores; usar imágenes reales del backend.

## Archivos
- `screenshots/Master NN - … .jpg` — captura de cada Master (vista superior a ~924 px, idioma ES).
- `SCREENS.md` — mapa de las 67 pantallas → archivo, ruta, componente, estado, fase.
- `prototypes/Master 01…67 *.dc.html` — prototipos (más `PropertyAmenities.dc.html`, usado por 04/20).
- `prototypes/*-data.js` — datos simulados (estructura útil para tipos/DTOs).
- `prototypes/i18n.js` — claves ES/EN.
- `docs/MGHPM-360-Audit-v3.8.1.md` — auditoría 360° completa (estado de cada página, pruebas, brechas, hoja de ruta).
- `docs/MGHPM-Fase-2A.1-Seguridad.md` — roles, aislamiento y hallazgos S-01…S-24, tests faltantes y comandos.
- `docs/MGHPM-Fase-0-Claude-Code.md` — prompt y plan de pruebas para Claude Code.
- `backend-patches/phase2a2/` — parche propuesto `apps/users` + `tools/audit_capability_alignment.py`.

## Sugerencia para el repo
Copiar esta carpeta a `docs/handoff/` en MGHPM-Corecciones y pedir a Claude Code: *"Lee docs/handoff/README.md y empieza por la Fase 0 y los P0 de seguridad."*
