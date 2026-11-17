# Auditoría 360° funcional y de páginas — MGHPM

_MGHPM • Auditoría 360° v3.8.1 • 9 de octubre de 2026 • Fase 0 — Auditoría del repositorio, seguridad y trazabilidad (instantánea frontend inspeccionada; backend BLOQUEADO) • Línea base Lote 5 v3.7.1 • Inventario de Masters, barra y KPIs en vivo • Informe en español_

Dos capas auditadas por separado: la aplicación real en MGHPM-Corecciones (router, menú, capacidades, código de páginas, alcance en backend) y los 67 prototipos Master (01–67, +1 duplicado obsoleto) de este proyecto. Un toast, alert, marcador o aviso de ruta futura nunca cuenta como FUNCIONA. Una página que renderiza no cuenta como 360°. Cada prueba del Lote 5 se registra como APROBADO, FALLA, BLOQUEADO o NO PROBADO con su método y evidencia; las acciones simuladas del prototipo nunca cuentan como funcionalidad de backend. Informes anteriores: Auditoría completa v2 • Auditoría de flujos v1.

## Método y límites

- **Capa de código (fuente de verdad):** Se leyeron AdminApp.tsx (router), adminRoutes.ts, adminMenu.tsx (FLAT_NAV), navPermissions.ts, MghAdminShell.tsx, cada página en pages/admin y backend portals/views.py para el alcance de datos.
- **Capa de prototipo:** Escaneo en vivo de los 67 archivos Master (+1 obsoleto): mapas PAGES, ítems de la barra, enlaces entrantes, destinos rotos, marcadores, migas, contexto de retorno, selector ES|EN, formularios, transiciones de estado y enlaces financieros. Las 67 clases lógicas se evaluaron en sandbox en esta sesión.
- **Ejecutado vs no ejecutado:** Pruebas de clic renderizadas en esta sesión: Masters 49 y 64 a ~924 px (aprobar / programar / ejecutar / conciliar / fallar / rechazar / ajustar distribuciones; validaciones y contabilización de gastos). Todo lo demás es traza estática o NO PROBADO. La app de código requiere un backend autenticado y no se ejecutó.
- **Reglas aplicadas:** Toast, alert, marcador o aviso de ruta futura = SIMULADO o MARCADOR, nunca FUNCIONA. "Renderiza correctamente" ≠ completo. El código (MGHPM-Corecciones) no se modificó; los cambios del prototipo se registran en la sección R1.

## KPIs

### Aplicación de código — frontend/src

_Revisión estática de MGHPM-Corecciones • último escaneo 6 oct 2026 • no re-escaneado en el Lote 5 (sin cambios de código reportados; código no modificado)_

| Indicador | Valor |
|---|---|
| Páginas funcionales | 47 |
| Completas (render + flujo) | 6 |
| 360° completas | 0 |
| Parciales | 36 |
| Rotas / sin ruta | 5 |
| Desconectadas | 1 |
| Marcadores | 2 |
| Módulos planificados faltantes | 12 |
| Acciones que funcionan | 11 |
| Acciones parciales / simuladas | 10 |
| Acciones muertas / rotas | 7 |
| Acciones faltantes | 10 |

### Prototipos Master — este proyecto

_Escaneo en vivo de los archivos del proyecto • 10/10/2026, 5:46:41 p. m. • Fuera de la barra: 04, 08_

| Indicador | Valor |
|---|---|
| Archivos Master | 67 |
| Ítems de la barra | 56 |
| Enrutados a un Master | 56 |
| Marcadores en la barra | 0 |
| Fuera de la barra / mapa PAGES | 2 |
| Inalcanzables (sin enlace entrante) | 0 |
| Enlaces a marcador pese a pantalla construida | 0 |
| Masters con sondeo de ancho | 39 |
| Masters que usan claves i18n | 1 |
| Masters sin selector ES | EN (barra superior) | 4 |
| Controles estructurales aprobados | 66 / 66 |
| Controles estructurales fallidos | 0 |
| Masters probados en ejecución (Lote 5) | 11 |
| Pruebas Lote 5 aprobadas / fallidas / no probadas | 65 / 5 / 18 |

## A. Resumen ejecutivo

- **Fase 0 — instantánea del frontend inspeccionada, backend BLOQUEADO** — 10 hallazgos VERIFICADOS en el código (capacidad de Propietarios / Directorio no coincide, control KYC solo en cliente, monto de pago calculado en cliente sin clave de idempotencia, tokens en localStorage, secreto por defecto en prod, faltan cabeceras nginx, respaldos localhost, recuperación muerta); aislamiento en servidor, IDOR y atomicidad de contabilización BLOQUEADOS — back-mghpm no está en el proyecto.
- **Cierre del Lote 5 — prototipo listo para entrega con excepciones** — Gastos ↔ CxP consolidados en un registro por costo, Distribuciones a propietarios completas de punta a punta, claves dinámicas ES/EN + formato agregados, y una falla de carga de Master 64 hallada y corregida. 0 Masters inalcanzables, 0 marcadores en la barra (en vivo).
- **Queda un hallazgo P1 del prototipo** — La visibilidad por rol / permiso no se puede probar (una sola persona, L5-03). La relación Pago ↔ Libro y los cuatro enlaces faltantes (41→63, 36→31, 31→48, 44→47) se corrigieron en la reparación final limitada (R8).
- **La cobertura de pruebas es honesta, no completa** — Pruebas de clic renderizadas en 11 Masters; medición responsive de 66 Masters × 390 / 1024 / 1440 (T6, 2 FALLAS a 390); pase de ejecución ES solo en Master 49 (T5); los flujos E2E se verificaron salto a salto por traza estática.
- **Ninguna página de la app de código es 360° completa** — los mejores puntajes son Mantenimiento 6/10 y Propiedades / Pagos 5/10; no existen páginas de detalle para Contrato, Propietario, Inquilino, Proveedor, Reserva ni Pago.
- **Dos bloqueos P0 de pagos** — los inquilinos no pueden pagar desde el Portal del inquilino, y la página Editar pago existe pero no tiene ruta.
- **Tres ítems de menú pueden bloquear a usuarios** — la capacidad de la barra difiere de la de la ruta en Tareas, Propietarios y Directorio.
- **Los Masters van muy por delante del código** — Propiedad, Propietario, Inquilino, Contrato, Reserva y Huésped 360 están diseñados; Solicitudes, Inspecciones, Centro de operaciones, Limpieza, Preparación y Seguros no tienen contraparte en código.
- **Faltan 12 módulos solicitados en el código** — Solicitudes, Centro de operaciones, Limpieza, Inspecciones, Contabilidad GL, Depósitos, Pagos a propietarios, Nómina, HOA, Activos, Incidentes, Notificaciones; Calendario y Personal existen solo como subvistas.
- **Higiene del prototipo** — Pendiente: i18n por coincidencia de texto en inglés en Masters heredados (L5-07) y sondeo de ancho cada 400 ms (plan de migración en la sección R1). KPIs en vivo arriba.

> Cierre del Lote 5 (8 oct 2026): capa de prototipo auditada y reparada — ver R7, T1–T5, matriz P/V, Preparación y Entrega. MGHPM-Corecciones no se modificó; los ítems P0/P1 de la capa de código se entregan a Claude Code (sección K). Informe traducido al español el 9 oct 2026 (identificadores, rutas, archivos y textos fuente de pruebas i18n se conservan sin traducir).

## Índice

- [F0. Fase 0 — Estado y límites de ejecución](#f0-fase-0--estado-y-límites-de-ejecución)
- [F0.1 Informe de arquitectura del repositorio](#f01-informe-de-arquitectura-del-repositorio)
- [F0.2 Registro de hallazgos de seguridad (P0 / P1)](#f02-registro-de-hallazgos-de-seguridad-p0--p1)
- [F0.3 Matriz de trazabilidad Master ↔ Código (67)](#f03-matriz-de-trazabilidad-master--código-67)
- [F0.4 Análisis de brechas prototipo → producción](#f04-análisis-de-brechas-prototipo--producción)
- [F0.5 Evaluación de integridad financiera](#f05-evaluación-de-integridad-financiera)
- [F0.6 Plan propuesto de reparación del núcleo (no implementado — en espera de autorización)](#f06-plan-propuesto-de-reparación-del-núcleo-no-implementado--en-espera-de-autorización)
- [F0.7 Hoja de ruta de implementación por dependencias](#f07-hoja-de-ruta-de-implementación-por-dependencias)
- [F0.8 Plan de verificación y pruebas](#f08-plan-de-verificación-y-pruebas)
- [R7. Lote 5 — Auditoría final 360° de Masters y cierre (aplicado 8 oct 2026)](#r7-lote-5--auditoría-final-360-de-masters-y-cierre-aplicado-8-oct-2026)
- [R8. Reparación final limitada (aplicada 8 oct 2026)](#r8-reparación-final-limitada-aplicada-8-oct-2026)
- [J. Evaluación final de preparación — criterios de aceptación](#j-evaluación-final-de-preparación--criterios-de-aceptación)
- [T1. Inventario y verificación de Masters (en vivo)](#t1-inventario-y-verificación-de-masters-en-vivo)
- [S1. Inventario de destinos de la barra lateral (en vivo)](#s1-inventario-de-destinos-de-la-barra-lateral-en-vivo)
- [T3. Pruebas de flujo de extremo a extremo](#t3-pruebas-de-flujo-de-extremo-a-extremo)
- [T4. Pruebas de integridad financiera](#t4-pruebas-de-integridad-financiera)
- [T5. Pruebas de traducción dinámica ES / EN](#t5-pruebas-de-traducción-dinámica-es--en)
- [T6. Medición responsive — 390 / 1024 / 1440 px](#t6-medición-responsive--390--1024--1440-px)
- [TM. Matriz de trazabilidad Master ↔ Código — columnas obligatorias](#tm-matriz-de-trazabilidad-master--código--columnas-obligatorias)
- [P. Matriz de funcionalidad prototipo vs producción](#p-matriz-de-funcionalidad-prototipo-vs-producción)
- [L5. Asuntos pendientes — registro del Lote 5 (P0–P3)](#l5-asuntos-pendientes--registro-del-lote-5-p0p3)
- [K. Entrega priorizada de implementación — Claude Code (primero la Fase 0)](#k-entrega-priorizada-de-implementación--claude-code-primero-la-fase-0)
- [B1. Inventario de rutas — Código (frontend/src/pages/admin/AdminApp.tsx)](#b1-inventario-de-rutas--código-frontendsrcpagesadminadminapptsx)
- [B2. Matriz de auditoría de páginas — Código](#b2-matriz-de-auditoría-de-páginas--código)
- [B3. Auditoría de la barra lateral — módulos solicitados vs código vs Masters](#b3-auditoría-de-la-barra-lateral--módulos-solicitados-vs-código-vs-masters)
- [C. Catálogo de botones / acciones — Código](#c-catálogo-de-botones--acciones--código)
- [C2. Problemas de acciones y estructura — Masters (prototipo)](#c2-problemas-de-acciones-y-estructura--masters-prototipo)
- [D. Problemas de navegación](#d-problemas-de-navegación)
- [E. Componentes 360° faltantes por módulo](#e-componentes-360-faltantes-por-módulo)
- [F. Páginas sin salida](#f-páginas-sin-salida)
- [G. Responsive — causas raíz](#g-responsive--causas-raíz)
- [H. Marcadores, datos simulados y código muerto](#h-marcadores-datos-simulados-y-código-muerto)
- [L. Hallazgos consolidados por prioridad](#l-hallazgos-consolidados-por-prioridad)
- [R1. Reparación 01 — conectividad de Masters (aplicada 6 oct 2026)](#r1-reparación-01--conectividad-de-masters-aplicada-6-oct-2026)
- [R3. Reparación 03 — Cumplimiento + Notificaciones (aplicada 6 oct 2026)](#r3-reparación-03--cumplimiento--notificaciones-aplicada-6-oct-2026)
- [R4. Fase de completitud — Lote 1: marcadores restantes de la barra (aplicado 6 oct 2026)](#r4-fase-de-completitud--lote-1-marcadores-restantes-de-la-barra-aplicado-6-oct-2026)
- [R6. Fase de completitud — Lote 3: Finanzas y Solicitudes 360 (aplicado 8 oct 2026)](#r6-fase-de-completitud--lote-3-finanzas-y-solicitudes-360-aplicado-8-oct-2026)
- [R5. Fase de completitud — Lote 2: Operaciones y Mantenimiento 360 (aplicado 8 oct 2026)](#r5-fase-de-completitud--lote-2-operaciones-y-mantenimiento-360-aplicado-8-oct-2026)
- [M. Orden de reparación recomendado (Reparación 01 aplicada; pasos restantes en espera de aprobación)](#m-orden-de-reparación-recomendado-reparación-01-aplicada-pasos-restantes-en-espera-de-aprobación)

## F0. Fase 0 — Estado y límites de ejecución

| Ítem | Detalle | Estado |
|---|---|---|
| Acceso al repositorio | Instantánea parcial del frontend encontrada en el proyecto (uploads/frontend/src, nginx, docker). Faltan: pages/admin, services/, router AdminApp.tsx, back-mghpm (backend), mgh-hub, pruebas, CI | PARCIAL |
| Inspección estática — frontend | Leídos: api/api.ts, hooks/usePermissions.ts, hooks/useIdentityVerification.ts, components/auth/RequireCapability.tsx, RequireIdentityVerification.tsx, config/admin/navPermissions.ts, adminMenu.tsx, shared/constants/adminRoutes.ts, layouts/admin/MghAdminShell.tsx, components/admin/payments/*, auth/MghLoginTemplate.tsx, nginx/default.conf, docker/*/docker-compose.yml | VERIFICADO |
| Inspección estática — backend | back-mghpm está referenciado (docker/prod/docker-compose.yml:47-48, docker/dev:131-133) pero no está en el proyecto → no se pueden leer autorización en servidor, esquema, migraciones ni atomicidad de contabilización | BLOQUEADO |
| Pruebas en ejecución (Claude Code) | Backend con usuarios por rol: desconocido. Prompt + plan de pruebas en “MGHPM Fase 0 - Claude Code.md” | NO VERIFICADO |
| Cambios de código | Ninguno. Sin despliegue, sin migración de datos, sin contabilización financiera | N/A |
| Siguiente acción | Agregar back-mghpm + frontend/src/pages/admin + services/ + AdminApp.tsx al proyecto, o ejecutar el prompt de Claude Code | — |

## F0.1 Informe de arquitectura del repositorio

| Capa | Hallazgo | Fuente | Estado |
|---|---|---|---|
| Frontend | React 19 + Vite + TypeScript, React-Bootstrap (siguen presentes componentes de la plantilla Omah: components/admin/Cms, Shop, Omah, table/PatientTable…), Redux (useStore), react-i18next | package.json • components/admin/* • hooks/useStore | VERIFICADO |
| Cliente HTTP y autenticación | instancia axios; Bearer JWT desde localStorage access_token; renovación vía POST /auth/jwt/refresh/; si falla, se eliminan los tokens y redirección forzada a /admin/login | api/api.ts:12-17, 20-25, 43-69 | VERIFICADO |
| Multi-tenancy (cliente) | Cabecera X-Organization = localStorage mghpm_organization_slug; slug elegido en el cliente a partir de los contextos del usuario | api/api.ts:7, 27-30 • shared/utils/organizationSlug.ts:20-29 | VERIFICADO |
| Autorización (cliente) | effective_capabilities desde /users/me/; comodín "*"; RequireCapability redirige a la ruta por defecto; menú filtrado por NAV_ITEM_CAPABILITY; rutas mapeadas por ADMIN_ROUTE_CAPABILITY | hooks/usePermissions.ts:11-44 • components/auth/RequireCapability.tsx:15-36 • config/admin/navPermissions.ts:5-92 • MghAdminShell.tsx:160-168 | VERIFICADO |
| Verificación de identidad | Redirección a nivel de router cuando required && !verified; prefijos permitidos login / register / accept-invitation / identity-verification | components/auth/RequireIdentityVerification.tsx:5-24 • hooks/useIdentityVerification.ts:8-17 | VERIFICADO |
| 2FA | Componentes TwoFactorLoginStep, TwoFactorPanel presentes | components/admin/auth/TwoFactorLoginStep.tsx • components/admin/security/TwoFactorPanel.tsx | PARCIAL |
| Catálogo de rutas | ADMIN_ROUTES declarado como fuente única para menú, migas y enlaces. Registro del router (AdminApp.tsx) no está en el proyecto | shared/constants/adminRoutes.ts:1-71 | PARCIAL |
| Backend | Django (back-mghpm) + Postgres 16; Hub API (mgh-hub) + Keycloak 26 (dev); webhooks Stripe CLI (perfil dev); tarea diaria purge_audit_logs | docker/dev/docker-compose.yml:26, 43-45, 72-73, 131-133, 167-181, 189-197 • docker/prod/docker-compose.yml:29-30, 46-59 | VERIFICADO (solo configuración) |
| Esquema de BD / migraciones / restricciones | Código del backend ausente | — | BLOQUEADO |
| Pruebas automatizadas / CI | Sin archivos de prueba ni configuración de CI en el proyecto | — | BLOQUEADO |
| Servidor web | nginx con fallback SPA + /health; sin cabeceras de seguridad | frontend/nginx/default.conf:7-15 | VERIFICADO |

## F0.2 Registro de hallazgos de seguridad (P0 / P1)

| ID | Sev | Área | Archivos afectados (indicio) | Reproducción | Impacto | Remediación | Estado |
|---|---|---|---|---|---|---|---|
| S-01 | P0 | Aislamiento entre organizaciones | api/api.ts:27-30 (el cliente fija X-Organization desde localStorage); middleware de back-mghpm ausente | Cambiar localStorage mghpm_organization_slug al slug de otra org; llamar endpoints de lista/detalle | La cabecera la controla el cliente → el aislamiento depende por completo de la verificación de membresía en el servidor | El servidor debe resolver la org por membresía y rechazar slugs ajenos; prueba por endpoint | BLOQUEADO (backend) |
| S-02 | P0 | Aislamiento de registros de propietario / inquilino | páginas de portal + back-mghpm/portals no están en el proyecto | Propietario A / inquilino A solicita ids de B en endpoints del portal | Exposición de datos financieros y personales | Clases de permiso a nivel de objeto + pruebas | BLOQUEADO (backend) |
| S-03 | P0 | Autorización a nivel de propiedad | MODULE_UI_CAPABILITIES (navPermissions.ts:95-102) son solo flags de UI | Personal limitado a un portafolio solicita una propiedad fuera de alcance | Lectura/escritura no autorizada | Filtrado de querysets + controles en update/delete | BLOQUEADO (backend) |
| S-04 | P0 | Integridad de Pagar renta / pagos | PaymentCreateModal.tsx:283, 313-315, 323-325, 332-349, 591 | El monto viene del formulario y se envía a createPayment / createStripeCheckoutSession / createPayPalOrder; sin clave de idempotencia en el payload; solo control de UI disabled={saving}. Página del Portal del inquilino ausente | Posible alteración del monto y envíos duplicados salvo que el servidor recalcule y deduplique | Monto calculado en servidor desde lo adeudado, clave de idempotencia, contabilización atómica, deduplicación de webhooks | PARCIAL (frontend VERIFICADO, servidor BLOQUEADO) |
| S-05 | P0 | Acceso a recibos / IDOR | servicio + endpoint de recibos de pagos no están en el proyecto | Solicitar PDF de recibo con ids de otros pagos como propietario / inquilino / otra org | Exposición de recibos y datos del pagador | Permiso por objeto en el endpoint de recibos; registro de acceso | BLOQUEADO (backend) |
| S-06 | P1 | Alcance de panel y reportes | ReportsHub.tsx, ReportShell.tsx presentes; servicios ausentes | Comparar totales por org / rol | Agregados entre organizaciones | Filtro por org + rol en cada agregado | BLOQUEADO (backend) |
| S-07 | P1 | Aplicación de la verificación de identidad | RequireIdentityVerification.tsx:12-24 | Usuario no verificado llama a la API directamente — la redirección es solo del cliente | Evasión del KYC si la API no lo exige | Exigir en la clase de permiso de la API | PARCIAL (control solo cliente VERIFICADO) |
| S-08 | P1 | Capacidad de menú / ruta no coincide | navPermissions.ts:11 vs :74 (propietarios: people.owner.read vs people.read) • :25 vs :73 (directorio: people.directory.read vs people.read) • :16 vs :61 (lista de mantenimiento tras work_order.create) | Usuario solo con people.owner.read hace clic en Propietarios → RequireCapability redirige a la ruta por defecto | Bloqueo de acceso; mantenimiento invisible para roles de solo lectura | Una capacidad por ítem para menú, router y API | VERIFICADO |
| S-08b | — | Corrección al hallazgo del 6 oct | navPermissions.ts:15 vs :60 | Tareas: menú y ruta exigen work_order.read | Sin discrepancia (“task.read” del 6 oct no está en el archivo actual) | — | VERIFICADO |
| S-09 | P1 | Recuperación de cuenta | MghLoginTemplate.tsx:111-113 | El botón Olvidé mi contraseña no tiene onClick | Usuarios bloqueados | Flujo de recuperación de Keycloak | VERIFICADO |
| S-10 | P2 | Respaldo localhost de Docs de API | MghAdminShell.tsx:57-58, 166-167 | Build sin VITE_HUB_DOCS_URL → el menú enlaza a http://127.0.0.1:9100/docs | Enlace roto / URL interna | Guard de entorno; ocultar ítem | VERIFICADO |
| S-11 | P1 | Almacenamiento de tokens | api/api.ts:23, 50, 55, 62-63 | access_token / refresh_token en localStorage | Robo de tokens vía cualquier XSS | Cookies httpOnly seguras o access token en memoria + rotación | VERIFICADO |
| S-12 | P1 | Secreto por defecto en producción | docker/prod/docker-compose.yml:57-58 | DJANGO_SECRET_KEY por defecto change-me; ALLOWED_HOSTS por defecto localhost | Sesiones/tokens falsificables si falta la variable | Fallar el arranque si falta el secreto | VERIFICADO |
| S-13 | P2 | Faltan cabeceras de seguridad | frontend/nginx/default.conf:1-16 | Sin CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy | Sin endurecimiento contra XSS / clickjacking | Agregar cabeceras en nginx | VERIFICADO |
| S-14 | P2 | Respaldo de URL de API | api/api.ts:4 | Build sin VITE_API_URL → http://127.0.0.1:8000/api/v1 | Build de prod roto / contenido mixto | Fallar el build si falta | VERIFICADO |
| S-15 | P1 | Retención del registro de auditoría | docker/dev/docker-compose.yml:180-181 (purge_audit_logs diario) | Política de purga no visible (backend ausente) | El rastro de auditoría financiera podría borrarse | Excluir eventos financieros / de seguridad o archivar de forma inmutable | NO VERIFICADO |

## F0.3 Matriz de trazabilidad Master ↔ Código (67)

| Master | Ruta de producción (indicio) | Componente frontend (indicio) | API | Tablas | Permisos | Integraciones | Pruebas | Estado | Faltante | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Master 01 — App Layout | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | Shell: MghAdminShell.tsx:10,160-168 (menú filtrado por NAV_ITEM_CAPABILITY) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Módulo completo (solo prototipo) | 1 |
| Master 02 — Main Dashboard | /admin/dashboard (dashboard adminRoutes.ts:8) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 03 — Properties | /admin/properties (properties adminRoutes.ts:11) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 04 — Property Detail | /admin/properties/:id/view (propertyView adminRoutes.ts:13 • propertyUnits adminRoutes.ts:15) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 05 — Owner Portal | /admin/portal-propietario (ownerPortal adminRoutes.ts:9) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 1 (security) • 6 |
| Master 06 — Tenant Portal | /admin/portal-inquilino (tenantPortal adminRoutes.ts:10) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 1 (Pay Rent, P0) • 6 |
| Master 07 — Rental Applications | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 08 — Application Detail | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 09 — Operations Center | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 10 — Digital Inspection | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 11 — Accounting | /admin/finance = /admin/ledger (finance adminRoutes.ts:49 • ledger adminRoutes.ts:23) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 5 |
| Master 12 — Documents | /admin/documents • /documents/upload (documents adminRoutes.ts:27) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 13 — Work Orders | /admin/work-orders (workOrders adminRoutes.ts:24) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 4 |
| Master 14 — Maintenance Requests | /admin/work-orders/add (workOrdersAdd adminRoutes.ts:25) | maintenance/WorkOrderCreateModal.tsx | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 4 |
| Master 15 — Leases | /admin/leases (leases adminRoutes.ts:16) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 16 — Payments | /admin/payments (edit route unregistered) (payments adminRoutes.ts:18 • paymentsEdit adminRoutes.ts:22) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 1 (P0) • 3 |
| Master 17 — Reservations | /admin/reservations (reservations adminRoutes.ts:46) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 4 |
| Master 18 — Identity Verification | /admin/identity-verification • /review (identityVerification adminRoutes.ts:30 • identityVerificationReview adminRoutes.ts:31) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 1 (enforcement) |
| Master 19 — People | /admin/people • /owners • /tenants • /vendors • /staff (people adminRoutes.ts:38 • peopleOwners adminRoutes.ts:39 • peopleTenants adminRoutes.ts:40) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 20 — Property Form | /admin/properties/add • /:id/edit (propertiesAdd adminRoutes.ts:12 • propertyEdit adminRoutes.ts:14) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 21 — Settings | /admin/settings (settings adminRoutes.ts:62) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 22 — Supplies & Inventory | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 23 — Rental Application Wizard | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 24 — Messages | /admin/messages (messages adminRoutes.ts:61) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 6 |
| Master 25 — Owner Profile (360) | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | people/OwnerEditModal.tsx (solo modal) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 3 |
| Master 26 — Tenant Profile (360) | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | people/TenantEditModal.tsx (solo modal) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 3 |
| Master 27 — Insurance & Compliance | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 28 — Action Center | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 29 — Explore Stays | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 30 — New Reservation | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | ReservationNewModal.tsx (modal dentro de Reservas) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 31 — Reservation 360 | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 32 — Guests | /admin/reservations/guests (reservationGuests adminRoutes.ts:47) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 4 |
| Master 33 — Guest 360 | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 34 — My Stay | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 35 — Guest Services | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 36 — Property Readiness | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 37 — Organizations | /admin/organizations • /new • /:id/edit (organizations adminRoutes.ts:33) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 38 — Audit Log | /admin/audit-users (auditUsers adminRoutes.ts:59) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 39 — Templates | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 40 — Create Lease | /admin/leases/add (placeholder) (leasesAdd adminRoutes.ts:17) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 |
| Master 41 — Lease 360 | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | leases/modals (solo modal de edición) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 3 |
| Master 42 — New Insurance Policy | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 43 — Insurance Policy 360 | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 44 — HOA & Compliance | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 45 — Assets & Equipment | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 46 — Incidents | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 47 — Notifications | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 48 — Deposits | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 49 — Owner Distributions | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 50 — Payroll | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 51 — Reports | /admin/reports • /reports/owners/occupancy/maintenance/reservations/tenants (reports adminRoutes.ts:51) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 5 |
| Master 52 — Ownership Verification | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 53 — Compliance Review | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 6 |
| Master 54 — Contact Requests | /admin/contact-messages (contactMessages adminRoutes.ts:60) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 6 |
| Master 55 — Integrations | /admin/hub (alias /admin/my-hub) (hub adminRoutes.ts:68) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 6 |
| Master 56 — Cleaning | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 57 — Work Order 360 | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | adminWorkOrderAddPath → /admin/work-orders/add?workOrder= (adminRoutes.ts:81-83) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 58 — Staff | /admin/people/staff (peopleStaff adminRoutes.ts:42) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 4 |
| Master 59 — Vendors | /admin/people/vendors (peopleVendors adminRoutes.ts:41) | vendors/VendorUpsertModal.tsx | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 4 |
| Master 60 — Inspections | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |
| Master 61 — General Ledger | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 3 (Payments → Ledger core) |
| Master 62 — Property Ledger | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 63 — Accounts Receivable | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 64 — Accounts Payable | — (expenses via /admin/payments) (expensesAdd adminRoutes.ts:20) | Archivo de página no está en el proyecto (pages/admin ausente) | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | ADMIN_ROUTE_CAPABILITY (navPermissions.ts:36-92) | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | PARCIAL | Registro en router + comportamiento de página sin verificar; ver brechas del 6 oct (E) | 3 (Expense model) • 5 |
| Master 65 — Bank Reconciliation | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 66 — Financial Close | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 5 |
| Master 67 — Application 360 | Sin constante de ruta en ADMIN_ROUTES (fuente única, adminRoutes.ts:1-5) | — | BLOQUEADO (services/ ausente) | BLOQUEADO (backend ausente) | — | NO VERIFICADO | BLOQUEADO (sin pruebas en el proyecto) | FALTANTE | Módulo completo (solo prototipo) | 4 |

## F0.4 Análisis de brechas prototipo → producción

| Master | Prototipo | Código (indicio) | Brecha (provisional) | Estado | Fase |
|---|---|---|---|---|---|
| Master 01 — App Layout | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 1 |
| Master 02 — Main Dashboard | Diseñado (prototipo, simulado) | Ruta declarada: /admin/dashboard | PARCIAL | PARCIAL | 3 |
| Master 03 — Properties | Diseñado (prototipo, simulado) | Ruta declarada: /admin/properties | PARCIAL | PARCIAL | 3 |
| Master 04 — Property Detail | Diseñado (prototipo, simulado) | Ruta declarada: /admin/properties/:id/view | PARCIAL | PARCIAL | 3 |
| Master 05 — Owner Portal | Diseñado (prototipo, simulado) | Ruta declarada: /admin/portal-propietario | PARCIAL | PARCIAL | 1 (security) • 6 |
| Master 06 — Tenant Portal | Diseñado (prototipo, simulado) | Ruta declarada: /admin/portal-inquilino | PARCIAL | PARCIAL | 1 (Pay Rent, P0) • 6 |
| Master 07 — Rental Applications | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 08 — Application Detail | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 09 — Operations Center | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 10 — Digital Inspection | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 11 — Accounting | Diseñado (prototipo, simulado) | Ruta declarada: /admin/finance = /admin/ledger | PARCIAL | PARCIAL | 5 |
| Master 12 — Documents | Diseñado (prototipo, simulado) | Ruta declarada: /admin/documents • /documents/upload | PARCIAL | PARCIAL | 3 |
| Master 13 — Work Orders | Diseñado (prototipo, simulado) | Ruta declarada: /admin/work-orders | PARCIAL | PARCIAL | 4 |
| Master 14 — Maintenance Requests | Diseñado (prototipo, simulado) | Ruta declarada: /admin/work-orders/add | PARCIAL | PARCIAL | 4 |
| Master 15 — Leases | Diseñado (prototipo, simulado) | Ruta declarada: /admin/leases | PARCIAL | PARCIAL | 3 |
| Master 16 — Payments | Diseñado (prototipo, simulado) | Ruta declarada: /admin/payments (edit route unregistered) | PARCIAL | PARCIAL | 1 (P0) • 3 |
| Master 17 — Reservations | Diseñado (prototipo, simulado) | Ruta declarada: /admin/reservations | PARCIAL | PARCIAL | 4 |
| Master 18 — Identity Verification | Diseñado (prototipo, simulado) | Ruta declarada: /admin/identity-verification • /review | PARCIAL | PARCIAL | 1 (enforcement) |
| Master 19 — People | Diseñado (prototipo, simulado) | Ruta declarada: /admin/people • /owners • /tenants • /vendors • /staff | PARCIAL | PARCIAL | 3 |
| Master 20 — Property Form | Diseñado (prototipo, simulado) | Ruta declarada: /admin/properties/add • /:id/edit | PARCIAL | PARCIAL | 3 |
| Master 21 — Settings | Diseñado (prototipo, simulado) | Ruta declarada: /admin/settings | PARCIAL | PARCIAL | 3 |
| Master 22 — Supplies & Inventory | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 23 — Rental Application Wizard | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 24 — Messages | Diseñado (prototipo, simulado) | Ruta declarada: /admin/messages | PARCIAL | PARCIAL | 6 |
| Master 25 — Owner Profile (360) | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 3 |
| Master 26 — Tenant Profile (360) | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 3 |
| Master 27 — Insurance & Compliance | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 28 — Action Center | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 29 — Explore Stays | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 30 — New Reservation | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 31 — Reservation 360 | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 32 — Guests | Diseñado (prototipo, simulado) | Ruta declarada: /admin/reservations/guests | PARCIAL | PARCIAL | 4 |
| Master 33 — Guest 360 | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 34 — My Stay | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 35 — Guest Services | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 36 — Property Readiness | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 37 — Organizations | Diseñado (prototipo, simulado) | Ruta declarada: /admin/organizations • /new • /:id/edit | PARCIAL | PARCIAL | 3 |
| Master 38 — Audit Log | Diseñado (prototipo, simulado) | Ruta declarada: /admin/audit-users | PARCIAL | PARCIAL | 3 |
| Master 39 — Templates | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 40 — Create Lease | Diseñado (prototipo, simulado) | Ruta declarada: /admin/leases/add (placeholder) | PARCIAL | PARCIAL | 3 |
| Master 41 — Lease 360 | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 3 |
| Master 42 — New Insurance Policy | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 43 — Insurance Policy 360 | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 44 — HOA & Compliance | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 45 — Assets & Equipment | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 46 — Incidents | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 47 — Notifications | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 48 — Deposits | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 49 — Owner Distributions | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 50 — Payroll | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 51 — Reports | Diseñado (prototipo, simulado) | Ruta declarada: /admin/reports • /reports/owners/occupancy/maintenance/reservations/tenants | PARCIAL | PARCIAL | 5 |
| Master 52 — Ownership Verification | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 53 — Compliance Review | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 6 |
| Master 54 — Contact Requests | Diseñado (prototipo, simulado) | Ruta declarada: /admin/contact-messages | PARCIAL | PARCIAL | 6 |
| Master 55 — Integrations | Diseñado (prototipo, simulado) | Ruta declarada: /admin/hub (alias /admin/my-hub) | PARCIAL | PARCIAL | 6 |
| Master 56 — Cleaning | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 57 — Work Order 360 | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 58 — Staff | Diseñado (prototipo, simulado) | Ruta declarada: /admin/people/staff | PARCIAL | PARCIAL | 4 |
| Master 59 — Vendors | Diseñado (prototipo, simulado) | Ruta declarada: /admin/people/vendors | PARCIAL | PARCIAL | 4 |
| Master 60 — Inspections | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |
| Master 61 — General Ledger | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 3 (Payments → Ledger core) |
| Master 62 — Property Ledger | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 63 — Accounts Receivable | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 64 — Accounts Payable | Diseñado (prototipo, simulado) | Ruta declarada: — (expenses via /admin/payments) | PARCIAL | PARCIAL | 3 (Expense model) • 5 |
| Master 65 — Bank Reconciliation | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 66 — Financial Close | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 5 |
| Master 67 — Application 360 | Diseñado (prototipo, simulado) | Sin constante de ruta | FALTANTE | FALTANTE | 4 |

## F0.5 Evaluación de integridad financiera

| Área | Indicio | Por verificar | Estado |
|---|---|---|---|
| Pagos e identificadores | El cliente envía monto, paid_at, proveedor, lease/reservation; sin clave de idempotencia; id de pago numérico | PaymentCreateModal.tsx:332-349 • adminRoutes.ts:22, 76-78 | PARCIAL |
| Pagos en línea | Sesión de checkout Stripe / orden PayPal creada con monto del cliente; webhooks vía Stripe CLI en dev | PaymentCreateModal.tsx:311-327 • docker/dev:189-197 | PARCIAL |
| Libro mayor | /admin/ledger y /admin/finance ambos finance.read (alias); sin ruta ni componente de asientos | adminRoutes.ts:23, 49 • navPermissions.ts:52-53 | FALTANTE (frontend) |
| Cuentas por cobrar | Lo adeudado por contrato (saldo abierto / número de cargos) usado por el formulario de pago; sin ruta de módulo CxC | PaymentCreateModal.tsx:8-19, 421-425 | PARCIAL |
| Cuentas por pagar y gastos | Dos puntos de entrada: ruta /admin/payments/expenses/add y ExpenseRecordModal (proveedor + vínculo a orden de trabajo) | adminRoutes.ts:20 • ExpenseRecordModal.tsx:225-312 | PARCIAL (duplicado) |
| Depósitos • Distribuciones a propietarios • Conciliación bancaria | Sin constante de ruta, componente ni servicio | adminRoutes.ts:5-71 (fuente única) | FALTANTE (frontend) |
| Atómico / idempotente / auditable / protegido contra duplicados | Código del servidor ausente; solo control de doble envío en la UI | PaymentCreateModal.tsx:591 | BLOQUEADO (backend) |

## F0.6 Plan propuesto de reparación del núcleo (no implementado — en espera de autorización)

| ID | Prioridad | Tipo | Reparación | Archivos (indicio) |
|---|---|---|---|---|
| R-01 | P0 | Ruta rota (indicio) | payments/:id/edit está declarada y mapeada a capacidad; el registro en el router no es verificable (AdminApp.tsx ausente) | adminRoutes.ts:22, 76-78 • navPermissions.ts:51 |
| R-02 | P1 | Permisos no coinciden | Alinear capacidades de menú de Propietarios y Directorio con las rutas; decidir capacidad de la lista de mantenimiento (lectura vs creación) | navPermissions.ts:11, 16, 25, 61, 73-74 |
| R-03 | P1 | Control muerto | Olvidé mi contraseña → flujo de recuperación | MghLoginTemplate.tsx:111-113 |
| R-04 | P2 | Marcador (indicio) | /admin/leases/add y /admin/onboarding declaradas; contenido de página no está en el proyecto | adminRoutes.ts:17, 32 |
| R-05 | P2 | Destino incorrecto (indicio) | Fila de proveedor del Directorio → Órdenes de trabajo — People.tsx no está en el proyecto | — |
| R-06 | P2 | Respaldos de entorno | Respaldos localhost de Docs de API y URL de API; secreto por defecto en prod | MghAdminShell.tsx:57-58 • api.ts:4 • docker/prod:57 |
| R-07 | P2 | Superficie simulada (indicio) | Stubs de exportación de reportes — páginas de reportes no están en el proyecto; demoData.ts presente | components/admin/reports/demoData.ts |
| R-08 | P3 | Navegación de retorno (indicio) | Editar / Unidades vuelven a la lista — páginas no están en el proyecto | — |
| R-09 | P3 | Duplicados | ruta expensesAdd + ExpenseRecordModal; alias users; usersAndOrganizations; ledger = finance; restos de plantilla Omah | adminRoutes.ts:20, 23, 44, 49, 70 • components/admin/{Cms,Omah,AppsMenu/Shop,table/PatientTable.tsx} |
| R-10 | P1 | Faltan vistas de detalle | Sin constantes de ruta para detalle de Contrato, Propietario, Inquilino, Proveedor, Reserva, Pago; detalle de orden de trabajo vía query ?workOrder= | adminRoutes.ts:5-71, 81-83 |
| R-11 | P1 | Endurecimiento de seguridad | Almacenamiento de tokens, cabeceras nginx, política de purga de auditoría (S-11, S-13, S-15) | api.ts • nginx/default.conf • docker/dev:180 |

## F0.7 Hoja de ruta de implementación por dependencias

| Fase | Nombre | Alcance | Compuerta de salida |
|---|---|---|---|
| 0 | Fase 0 | Inspección, registro de seguridad, trazabilidad, informe de brechas — sin cambios de código | Esta sección con evidencia |
| 1 | Seguridad y P0 | S-01…S-05, R-01; Pagar renta del inquilino seguro + idempotente | T-SEC, T-IDOR, T-FIN en verde |
| 2 | Reparaciones del núcleo | R-02…R-10 | T-NAV en verde; cero marcadores en rutas activas |
| 3 | Núcleo por dependencia | Propiedades → Unidades → Propietarios → Inquilinos → Contratos → Pagos → Libro (Masters 02–04, 15, 16, 19, 20, 25, 26, 40, 41, 61, modelo de gasto de 64) | Navegación bidireccional + invariantes de contabilización |
| 4 | Operaciones | Reservas, Mantenimiento, Limpieza, Inspecciones, Preparación, Solicitudes (07–10, 13, 14, 17, 22, 23, 30–33, 36, 56–60, 67) | W1, W2, W3, W6 como pruebas de backend |
| 5 | Finanzas avanzadas | CxC, CxP, Depósitos, Distribuciones, Nómina, Conciliación, Cierre, Reportes (11, 48–51, 62–66) | W4, W5 + filas financieras de T4 |
| 6 | Portales y cumplimiento | 05, 06, 24, 27–29, 34, 35, 39, 42–47, 52–55 | Propietario / inquilino completan flujos sin personal |

## F0.8 Plan de verificación y pruebas

| ID | Área | Casos | Dónde |
|---|---|---|---|
| T-SEC | Matriz de roles | propietario, inquilino, agente, personal (limitado a portafolio), usuario de otra org × cada endpoint de lista/detalle/recibo | Claude Code (ejecución, nivel API) |
| T-IDOR | Ids de objeto | Ids secuenciales / ajenos en pagos, recibos, contratos, documentos, endpoints de portal | Claude Code |
| T-NAV | Menú ↔ ruta ↔ API | Cada ítem de FLAT_NAV abierto por cada rol que lo ve | Claude Code (Playwright) |
| T-FIN | Integridad de pagos | Doble envío, reintento tras timeout, solicitudes concurrentes, alteración del monto → una sola contabilización | Claude Code (API + aserciones en BD) |
| T-TRACE | Trazabilidad | Cada fila de Master completada con evidencia de archivo / endpoint / tabla / prueba | Claude Code → reemitir v3.9 aquí |
| T-RESP | Responsive | 390 / 1024 / 1440 en páginas con ruta | Claude Code (Playwright) |
| T-I18N | ES / EN | es-DO por defecto; sin cadenas fijas en páginas reparadas | Claude Code |

## R7. Lote 5 — Auditoría final 360° de Masters y cierre (aplicado 8 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Solapamiento Gastos ↔ CxP | Un único registro autoritativo por costo en MGH_FIN.db.ap. Master 64 incorpora una pestaña Registro de gastos (facturas + gastos directos + migrados) con columnas Origen y Contabilización GL; la pestaña Facturas excluye gastos directos. Registrar gasto directo contabiliza Db gasto / Cr 1010 una vez y guarda el id del asiento. Master 16: pestaña Gastos, Registrar gasto y ?expense=1 redirigen a 64; el KPI lee CxP. Gastos en la barra → 64 ?tab=expenses en cada Master del personal (mapa PAGES); enlaces de ops-agent, compliance-data y ops-data reapuntados |
| B | Migración de gastos heredados | finance-data.js migrateExpenses(): 5 gastos de Pagos migrados una vez por id (marca db.expMigrated). EXP-8845 / EXP-8824 → facturas de proveedor pagadas, EXP-8817 → directo, cada uno con un asiento de migración. EXP-8841 Excluido (duplica la comisión de administración REC-001, deducción en estado del propietario) y EXP-8836 Retenido (solapa con BILL-2026-0402) — ninguno contabilizado |
| C | Distribuciones a propietarios (49) | Estados Borrador, Pendiente de aprobación del propietario, Rechazada, Aprobada, Programada, Pagada, Pago fallido, Conciliada, Retenida. Registro de aprobación del propietario (aprobador, canal, fecha/hora, neto). Rechazo con motivo → ajustar → reenviar. Ajustes (crédito / cargo) recalculan el neto; tras la aprobación devuelven el estado a Borrador para re-aprobación; bloqueados una vez programada; bloqueados en periodos cerrados. Programar (fecha, método; controles de periodo cerrado y neto negativo). Ejecutar contabiliza Db 2200 / Cr 1010 y una línea bancaria; control de doble contabilización. Conciliar empareja la línea bancaria. Pago fallido contabiliza un asiento de reversión y devuelve la línea bancaria. KPIs: Pendientes, Neto pendiente, Programadas, Pagadas este mes, Excepciones |
| D | Almacén financiero | finance-data.js: isClosed(), reverseJe(), addBankTx(), matchBankTx(); SRC.expense → Master 64; el KPI de cuentas por pagar a propietarios incluye ajustes y excluye Pagada / Conciliada / Rechazada |
| E | Integridad de CxP (64) | Validación de gasto directo: periodo cerrado, duplicado (beneficiario + propiedad + monto ≤ 7 días), un nombre de proveedor debe usar Facturas, monto > 0. Aprobar bloqueado si ya está contabilizado. Pago programado → Marcar pago fallido. Factura pagada → Registrar pago devuelto (reversión). Gasto directo → Anular y revertir. Asiento GL / Asiento de pago / Origen / Notas en el panel |
| F | i18n dinámico | i18n.js: MGH_I18N.tk(clave, vars) + 85 claves explícitas (od.*, exp.*, val.*); MGH_I18N.fmt.money / date / dateTime / num / plural (es-DO por defecto, en-US); traducción de frases compuestas por segmento (• — – → › : ( )); patrones de conteo (“3 de 12 facturas”), “Obligatorio: …”, “N días de atraso”, “Mostrando registros del propietario …”; 58 entradas de estados / sustantivos; longitud máxima de texto 140 → 320 |
| G | Defecto hallado y corregido | La clase lógica de Master 64 no se evaluaba (QP accedido antes de inicializarse) → Cuentas por pagar, Pagos a proveedores y Nómina por pagar se mostraban sin datos desde el Lote 3. Corregido; las 67 clases lógicas de los Masters ahora se evalúan a nivel superior (evaluación en sandbox, esta sesión) |
| H | Sin cambios | MGHPM-Corecciones no modificado. Masters aprobados no rediseñados. Cada acción del Lote 5 sigue siendo una simulación de prototipo en localStorage — no funcionalidad de producción |

## R8. Reparación final limitada (aplicada 8 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Cuatro enlaces faltantes | 41 → 63 Abrir cuentas por cobrar (filtrado al inquilino) • 36 → 31 Próxima reserva • 31 → 48 Abrir depósitos • 44 → 47 Abrir notificaciones — todos llevan back + backLabel; renderizados y probados con clic |
| B | Pago ↔ Libro | Una relación: el Pago (16) es el origen; JE.src guarda el id del pago. linkPayments() reasigna una vez los ids TRX heredados y contabiliza una vez cada pago completado sin contabilizar (idempotente por id de origen). 3 pagos que solo existían en el GL agregados a Pagos como registros autoritativos (PAY-50419, -50433, -50434). Las filas de pago muestran su(s) asiento(s) o “No contabilizado”; MGH_FIN.jeFor(id) deriva el vínculo — no se guarda una segunda clave |
| C | Pruebas visuales pendientes | Pruebas de clic renderizadas en 16, 31, 36, 41, 44, 47, 48, 49, 61, 63, 64 • medición responsive de 66 Masters a 390 / 1024 / 1440 (T6) • pase de ejecución ES en 49 (T5) |
| D | Datos de prueba | Registros de prueba del Lote 5 restablecidos desde la línea base con respaldo completo (mghpm.qa.backup.lote5-repair); restablecimiento registrado en el historial, nada borrado del historial ni de los registros de auditoría |
| E | EXP-8836 | No autorizado para contabilizar — sigue Retenido / No contabilizado hasta confirmar que difiere de BILL-2026-0402 |
| F | i18n | +22 entradas de diccionario para etiquetas halladas en inglés en el pase ES y para los nuevos botones de reparación |

## J. Evaluación final de preparación — criterios de aceptación

| Criterio | Meta | Resultado | Estado | Evidencia |
|---|---|---|---|---|
| Cero Masters inalcanzables | 0 | 0 | APROBADO | Escaneo en vivo: cada Master está en la barra/mapa PAGES o enlazado desde un padre |
| Cero marcadores en la barra | 0 | 0 | APROBADO | Escaneo en vivo de NAV vs PAGES / NAV_ALIAS (sección S1) |
| Cero rutas de navegación rotas | 0 | 0 Masters con destinos rotos • 1 falla de carga corregida (64) | APROBADO | Cada archivo Master referenciado existe; los enlaces faltantes a nivel de registro se listan como P2 (L5-04…06), no como rutas rotas |
| Cero duplicados funcionales no intencionales | 0 | Gastos ↔ CxP resuelto; Master 06 (v1) obsoleto, 0 enlaces entrantes | APROBADO | R7-A/B; eliminación L5-11 pendiente de aprobación |
| Cero defectos críticos de flujo sin resolver | 0 P0 | 0 P0 en el prototipo • 1 P1 (L5-03 permisos no comprobables) • 4 enlaces faltantes y Pago ↔ Libro corregidos | APROBADO | Los defectos P0 son de la capa de código (F-01…F-03) y se entregan a Claude Code |
| Masters principales funcionalmente completos a nivel prototipo | Todos | 66 de 66 aprueban controles estructurales • pruebas de clic renderizadas en 11 • responsive medido en 66 × 3 anchos | NO PROBADO | Los controles estructurales son estáticos; no se ejecutó el recorrido de comportamiento completo por Master (L5-08) |
| Todas las excepciones restantes documentadas | Sí | 13 abiertas + 6 corregidas (L5-01…19) + hallazgos de código F-01…F-26 arrastrados | APROBADO | Secciones L5, T3–T6 |
| General — prototipo | — | Listo para la Fase 0 de Claude Code con excepciones documentadas | LISTO CON EXCEPCIONES | Ninguna acción simulada cuenta como funcionalidad de producción |
| General — producción (MGHPM-Corecciones) | — | Módulos del Lote 5 ausentes del código; 3 P0 de código abiertos | NO LISTO | Capa de código revisada estáticamente por última vez el 6 oct 2026; no modificada en el Lote 5 |

## T1. Inventario y verificación de Masters (en vivo)

| Master | Entrada | Entrantes | Migas | Contexto de retorno | ES | EN | Rotos / marcadores | Crear | Cambios de estado | Aprobar / Rechazar | Enlaces financieros | Ejecución | Permisos | Responsive | Estructural |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Master 01 - App Layout | Enlace del padre | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | Sí | — | NO PROBADO | N/A | N/A | N/A |
| Master 02 - Main Dashboard | Barra lateral | 64 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 03 - Properties | Barra lateral | 63 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 04 - Property Detail | Enlace del padre | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 2 transiciones | — | 62 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 05 - Owner Portal | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 06 - Tenant Portal | Barra lateral | 63 | Sí | Sí | Flotante | 0 | 0 formularios | 8 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 07 - Rental Applications | Barra lateral | 64 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 0 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 08 - Application Detail | Enlace del padre | 6 | Sí | Sí | Barra superior | 0 | 0 formularios | 1 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 09 - Operations Center | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 10 - Digital Inspection | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 11 - Accounting | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | 11 | NO PROBADO | BLOQUEADO | FALLA | APROBADO |
| Master 12 - Documents | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 13 - Work Orders | Barra lateral | 63 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 14 - Maintenance Requests | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 15 - Leases | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 16 - Payments | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 2 formularios | 0 transiciones | Sí | 16 | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 17 - Reservations | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 18 - Identity Verification | Barra lateral | 64 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 1 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 19 - People | Barra lateral | 63 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 29 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 20 - Property Form | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 21 - Settings | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 1 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 22 - Supplies and Inventory | Barra lateral | 63 | Sí | Nivel superior | Barra superior | 0 | 1 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 23 - Rental Application Wizard | Barra lateral | 64 | N/A (huésped) | Nivel superior | Flotante | 0 | 0 formularios | 1 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 24 - Messages | Barra lateral | 65 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 25 - Owner Profile | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 27 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 26 - Tenant Profile | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 0 formularios | 11 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 27 - Insurance and Compliance | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 1 formularios | 0 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 28 - Action Center | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 2 formularios | 1 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 29 - Explore Stays | Barra lateral | 65 | N/A (huésped) | Nivel superior | Flotante | 0 | 0 formularios | 0 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 30 - New Reservation | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 31 - Reservation 360 | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 1 transiciones | Sí | — | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 32 - Guests | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 33 - Guest 360 | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 2 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 34 - My Stay | Barra lateral | 65 | N/A (huésped) | Sí | Flotante | 0 | 0 formularios | 0 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 35 - Guest Services | Barra lateral | 64 | Sí | Nivel superior | Barra superior | 0 | 0 formularios | 0 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 36 - Property Readiness | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | Sí | — | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 37 - Organizations | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 5 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 38 - Audit Log | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | 16 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 39 - Templates | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 0 formularios | 6 transiciones | Sí | — | NO PROBADO | BLOQUEADO | NO PROBADO | APROBADO |
| Master 40 - Create Lease | Barra lateral | 65 | Sí | Sí | Barra superior | 0 | 0 formularios | 1 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 41 - Lease 360 | Barra lateral | 65 | Sí | Sí | Barra superior | 0 | 0 formularios | 0 transiciones | — | — | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 42 - New Insurance Policy | Barra lateral | 65 | Sí | Sí | Barra superior | 0 | 0 formularios | 1 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 43 - Insurance Policy 360 | Barra lateral | 65 | Sí | Sí | Barra superior | 0 | 0 formularios | 1 transiciones | Sí | — | NO PROBADO | BLOQUEADO | FALLA | APROBADO |
| Master 44 - HOA and Compliance | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 15 formularios | 4 transiciones | — | — | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 45 - Assets and Equipment | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 15 formularios | 2 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 46 - Incidents | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 7 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 47 - Notifications | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 3 formularios | 0 transiciones | — | — | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 48 - Deposits | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 11 formularios | 4 transiciones | — | 11, 16, 61, 63 | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 49 - Owner Distributions | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 15 formularios | 13 transiciones | Sí | 61, 62, 64, 65 | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 50 - Payroll | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 6 transiciones | Sí | 11, 50, 64 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 51 - Reports | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 0 transiciones | — | 11, 48, 49, 50, 61, 62, 63, 64, 65 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 52 - Ownership Verification | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 9 formularios | 2 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 53 - Compliance Review | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 1 transiciones | — | 48 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 54 - Contact Requests | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 3 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 55 - Integrations | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 5 formularios | 3 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 56 - Cleaning | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 11 formularios | 6 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 57 - Work Order 360 | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 7 formularios | 1 transiciones | Sí | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 58 - Staff | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 1 transiciones | Sí | 50 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 59 - Vendors | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 5 formularios | 1 transiciones | Sí | 64 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 60 - Inspections | Barra lateral | 64 | Sí | Sí | Barra superior | 0 | 11 formularios | 2 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 61 - General Ledger | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 2 transiciones | — | — | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 62 - Property Ledger | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 3 formularios | 0 transiciones | — | 48, 49, 61, 63, 64 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 63 - Accounts Receivable | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 9 formularios | 0 transiciones | — | 16 | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 64 - Accounts Payable | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 15 formularios | 1 transiciones | Sí | 50, 61 | APROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 65 - Bank Reconciliation | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 9 formularios | 9 transiciones | — | — | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 66 - Financial Close | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 9 formularios | 6 transiciones | Sí | 61 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |
| Master 67 - Application 360 | Barra lateral | 63 | Sí | Sí | Barra superior | 0 | 7 formularios | 7 transiciones | Sí | 16, 48 | NO PROBADO | BLOQUEADO | APROBADO | APROBADO |

## S1. Inventario de destinos de la barra lateral (en vivo)

| Id | Etiqueta | Destino | Estado | Archivo |
|---|---|---|---|---|
| dashboard | Dashboard | Master 02 - Main Dashboard.dc.html | ENRUTADO | Archivo presente |
| action-center | Action Center | Master 28 - Action Center.dc.html | ENRUTADO | Archivo presente |
| owner-portal | Owner Portal | Master 05 - Owner Portal.dc.html | ENRUTADO | Archivo presente |
| tenant-portal | Tenant Portal | Master 06 - Tenant Portal.dc.html | ENRUTADO | Archivo presente |
| properties | Properties | Master 03 - Properties.dc.html | ENRUTADO | Archivo presente |
| owners | Owners | Master 19 - People.dc.html?type=owners | ENRUTADO | Archivo presente |
| tenants | Tenants | Master 19 - People.dc.html?type=tenants | ENRUTADO | Archivo presente |
| leases | Leases | Master 15 - Leases.dc.html | ENRUTADO | Archivo presente |
| applications | Rental Applications | Master 07 - Rental Applications.dc.html | ENRUTADO | Archivo presente |
| screening | Screening & Review | Master 67 - Application 360.dc.html | ENRUTADO | Archivo presente |
| lease-pipeline | Lease Pipeline | Master 07 - Rental Applications.dc.html?view=lease | ENRUTADO | Archivo presente |
| explore-stays | Explore / Listings | Master 29 - Explore Stays.dc.html | ENRUTADO | Archivo presente |
| reservations | Reservations | Master 17 - Reservations.dc.html | ENRUTADO | Archivo presente |
| calendar | Calendar | Master 17 - Reservations.dc.html?view=calendar | ENRUTADO | Archivo presente |
| guests | Guests | Master 32 - Guests.dc.html | ENRUTADO | Archivo presente |
| guest-services | Guest Services | Master 35 - Guest Services.dc.html | ENRUTADO | Archivo presente |
| ops-center | Operations Center | Master 09 - Operations Center.dc.html | ENRUTADO | Archivo presente |
| readiness | Property Readiness | Master 36 - Property Readiness.dc.html | ENRUTADO | Archivo presente |
| inspections | Inspections | Master 60 - Inspections.dc.html | ENRUTADO | Archivo presente |
| maintenance | Maintenance | Master 13 - Work Orders.dc.html | ENRUTADO | Archivo presente |
| cleaning | Cleaning | Master 56 - Cleaning.dc.html | ENRUTADO | Archivo presente |
| supplies | Supplies & Inventory | Master 22 - Supplies and Inventory.dc.html | ENRUTADO | Archivo presente |
| staff | Staff | Master 58 - Staff.dc.html | ENRUTADO | Archivo presente |
| vendors | Vendors | Master 59 - Vendors.dc.html | ENRUTADO | Archivo presente |
| accounting | Accounting | Master 11 - Accounting.dc.html | ENRUTADO | Archivo presente |
| general-ledger | General Ledger | Master 61 - General Ledger.dc.html | ENRUTADO | Archivo presente |
| property-ledger | Property Ledger | Master 62 - Property Ledger.dc.html | ENRUTADO | Archivo presente |
| receivables | Receivables | Master 63 - Accounts Receivable.dc.html | ENRUTADO | Archivo presente |
| payables | Payables | Master 64 - Accounts Payable.dc.html | ENRUTADO | Archivo presente |
| vendor-payments | Vendor Payments | Master 64 - Accounts Payable.dc.html?tab=vendor-payments | ENRUTADO | Archivo presente |
| bank-reconciliation | Bank Reconciliation | Master 65 - Bank Reconciliation.dc.html | ENRUTADO | Archivo presente |
| financial-close | Financial Close | Master 66 - Financial Close.dc.html | ENRUTADO | Archivo presente |
| payments | Payments | Master 16 - Payments.dc.html | ENRUTADO | Archivo presente |
| expenses | Expenses | Master 64 - Accounts Payable.dc.html?tab=expenses | ENRUTADO | Archivo presente |
| deposits | Deposits | Master 48 - Deposits.dc.html | ENRUTADO | Archivo presente |
| owner-distributions | Owner Distributions | Master 49 - Owner Distributions.dc.html | ENRUTADO | Archivo presente |
| payroll | Payroll | Master 50 - Payroll.dc.html | ENRUTADO | Archivo presente |
| reports | Reports | Master 51 - Reports.dc.html | ENRUTADO | Archivo presente |
| identity-verification | Identity Verification | Master 18 - Identity Verification.dc.html | ENRUTADO | Archivo presente |
| ownership-verification | Ownership Verification | Master 52 - Ownership Verification.dc.html | ENRUTADO | Archivo presente |
| insurance | Insurance | Master 27 - Insurance and Compliance.dc.html | ENRUTADO | Archivo presente |
| compliance-review | Compliance Review | Master 53 - Compliance Review.dc.html | ENRUTADO | Archivo presente |
| hoa | HOA | Master 44 - HOA and Compliance.dc.html | ENRUTADO | Archivo presente |
| assets | Assets | Master 45 - Assets and Equipment.dc.html | ENRUTADO | Archivo presente |
| incidents | Incidents | Master 46 - Incidents.dc.html | ENRUTADO | Archivo presente |
| documents | Document Center | Master 12 - Documents.dc.html | ENRUTADO | Archivo presente |
| templates | Templates | Master 39 - Templates.dc.html | ENRUTADO | Archivo presente |
| messages | Inbox | Master 24 - Messages.dc.html | ENRUTADO | Archivo presente |
| notifications | Notifications | Master 47 - Notifications.dc.html | ENRUTADO | Archivo presente |
| contact-messages | Contact Requests | Master 54 - Contact Requests.dc.html | ENRUTADO | Archivo presente |
| directory | Directory | Master 19 - People.dc.html | ENRUTADO | Archivo presente |
| users | Users & Access | Master 21 - Settings.dc.html?section=users | ENRUTADO | Archivo presente |
| organizations | Organizations | Master 37 - Organizations.dc.html | ENRUTADO | Archivo presente |
| audit | Audit Log | Master 38 - Audit Log.dc.html | ENRUTADO | Archivo presente |
| integrations | Integrations | Master 55 - Integrations.dc.html | ENRUTADO | Archivo presente |
| settings | Settings | Master 21 - Settings.dc.html | ENRUTADO | Archivo presente |

## T3. Pruebas de flujo de extremo a extremo

| Flujo | Salto | Evidencia | Método | Estado |
|---|---|---|---|---|
| W1 Reserva → Limpieza → Inspección → Preparación | Reserva 360 → Limpieza (31 → 56) | Master 31 enlaza Master 56 - Cleaning | Traza estática | APROBADO |
| W1 | Limpieza → Inspección (56 → 60/10) | X.href.inspection en Master 56 | Traza estática | APROBADO |
| W1 | Inspección fallida → Re-limpieza (60 → 56) | Transición “Requiere re-limpieza” en Master 60 (R5-D) | Traza estática | APROBADO |
| W1 | Inspección → Preparación de la propiedad (60 → 36) | X.href.readiness en el panel de Master 60 | Traza estática | APROBADO |
| W1 | Preparación → Reserva (36 → 31) | Reparación: Próxima reserva → 20260909-DR-0002 (Aventura Park Tower) con chip “Volver a Preparación de la propiedad” | Renderizado | APROBADO |
| W1 | Recorrido completo por clic | — | Ejecución | NO PROBADO |
| W2 Mantenimiento → … → Cierre | Solicitud → Orden de trabajo 360 (14 → 57) | Abrir Orden de trabajo 360 en Master 14 | Traza estática | APROBADO |
| W2 | Aprobación > US$500 → aprobación del propietario | Regla en Master 57 (R5-E) | Traza estática | APROBADO |
| W2 | OT → Proveedor (57 → 59), retención COI/W-9 bloquea despacho | Master 57 enlaza Master 59; regla de retención | Traza estática | APROBADO |
| W2 | Factura → Factura CxP → Pago a proveedor (57 → 64) | syncOps() crea la factura; Master 64 enlaza de vuelta a 57 | Traza estática | APROBADO |
| W2 | Pago → marca de pagado en OT (64 → 57) | markWoPaid() al Marcar pagado | Traza estática | APROBADO |
| W2 | Inspección final → Cierre | Pasos Inspección final + Cerrada en Master 57 | Traza estática | APROBADO |
| W2 | Disponibilidad de la pantalla de CxP | Master 64 no cargaba antes del Lote 5 (D: QP) → corregido | Renderizado | CORREGIDO |
| W2 | Recorrido completo por clic | — | Ejecución | NO PROBADO |
| W3 Solicitud → Evaluación → Decisión → Oferta / Adversa | Solicitudes → Detalle → Solicitud 360 (07 → 08 → 67) | Fila → 08; 08 Abrir Solicitud 360 (R6-B) | Traza estática | APROBADO |
| W3 | Resumen de evaluación + decisión humana | Evaluación, revisor, fecha/hora, base de política en Master 67 | Traza estática | APROBADO |
| W3 | Oferta de contrato (67 → 40) | Master 40 - Create Lease ?application= | Traza estática | APROBADO |
| W3 | Aviso de acción adversa | Acción adversa rastreada hasta la entrega en Master 67 | Traza estática | APROBADO |
| W3 | Conversión a inquilino (67 → 26) | Master 26 - Tenant Profile ?name= | Traza estática | APROBADO |
| W3 | Recorrido completo por clic | — | Ejecución | NO PROBADO |
| W4 Contrato → Cargo → Pago → Libro → Distribución → Conciliación | Contrato 360 → cargo CxC (41 → 63) | Reparación: Finanzas › Cargos de renta › Abrir cuentas por cobrar → Master 63 filtrado a la inquilina Daniela Ortiz, Volver a Contrato 360 | Renderizado | APROBADO |
| W4 | Cargo CxC → Pago (63 → 16) | Master 16 - Payments ?q= | Traza estática | APROBADO |
| W4 | Pago → Libro mayor (16 → 61) | Reparación: la fila PAY-50421 muestra JE-2026-10-0001 → origen en el panel GL Pago • PAY-50421, Volver a Pagos | Renderizado | APROBADO |
| W4 | Libro de propiedad → Distribución al propietario (62 → 49) | Master 49 ?pid= | Traza estática | APROBADO |
| W4 | Distribución → GL → Conciliación (49 → 61 → 65) | JE-2026-10-0019 + BT-9012-111 emparejados; el panel enlaza a 61 y 65 | Renderizado | APROBADO |
| W4 | Conciliación → GL (65 → 61) | href.gl en Master 65 | Traza estática | APROBADO |
| W5 Personal → Horario → Hoja de horas → Nómina → Pago | Horario + hoja de horas en Personal 360 (58) | Horario y hoja de horas en Master 58 | Traza estática | APROBADO |
| W5 | Personal → Nómina por id (58 → 50) | Master 50 - Payroll | Traza estática | APROBADO |
| W5 | Nómina → Nómina por pagar (50 → 64 ?tab=payroll) y de vuelta | Enlazado en ambos sentidos | Traza estática | APROBADO |
| W5 | Flujo de corrida Horas aprobadas → … → Pagada | RUN_FLOW en Master 50 | Traza estática | APROBADO |
| W5 | Recorrido completo por clic | — | Ejecución | NO PROBADO |
| W6 Incidente → Acción correctiva → OT → Resolución | Acción correctiva en el incidente (46) | Paso correctivo en Master 46 | Traza estática | APROBADO |
| W6 | Incidente ↔ Orden de trabajo (46 ↔ 57) | Crear orden de trabajo → 57; 57 enlaza el incidente | Traza estática | APROBADO |
| W6 | Resolver / Cerrar | Estado Resuelto en Master 46 | Traza estática | APROBADO |
| W6 | Recorrido completo por clic | — | Ejecución | NO PROBADO |
| W7 Infracción HOA → Notificación → Correctiva → Cierre | Notificar a propietario / inquilino (idioma del destinatario) | Acciones de notificación de Master 44 | Traza estática | APROBADO |
| W7 | Notificación → Infracción (47 → 44) | Abrir registro → registro de origen (R3-F) | Renderizado (Reparación 03) | APROBADO |
| W7 | Infracción → Notificación (44 → 47) | Reparación: VIO-2026-0041 › Abrir notificaciones → Master 47 con “Volver a la infracción VIO-2026-0041” (bandeja no filtrada por ?q — L5-17) | Renderizado | APROBADO |
| W7 | Acción correctiva → Marcar resuelta | Acciones de Master 44 | Traza estática | APROBADO |
| W7 | Recorrido completo por clic | — | Ejecución | NO PROBADO |
| Todos | Reserva → Depósito (31 → 48) | Reparación: Pagos › Abrir depósitos → Master 48 (registro por enlace de reserva; si no, pestaña Reserva / Propietario / Otros), Volver a Reserva 360 | Renderizado | APROBADO |

## T4. Pruebas de integridad financiera

| Área | Prueba | Método | Evidencia | Estado |
|---|---|---|---|---|
| Fuente única | El gasto existe una vez (CxP), no en Pagos | Renderizado (Master 64, ~924 px) | Pestaña Gastos 15 → 16 registros tras una contabilización; Facturas 12; Pagos almacena 0 gastos (la pestaña redirige) | APROBADO |
| Fuente única | La migración no duplica | Estático + renderizado | migrateExpenses() omite ids existentes, corre una vez (db.expMigrated); EXP-8841 se muestra Excluido • No contabilizado | APROBADO |
| Fuente única | Detección de origen duplicado | Renderizado | EXP-8841 Excluido (duplica REC-001); EXP-8836 Retenido (solapa BILL-2026-0402) — ninguno contabilizado | APROBADO |
| Referencia al libro | La distribución al propietario contabiliza una vez con asiento + línea bancaria | Renderizado (Master 49) | DIST-2026-09-0002: Aprobada → Programada → Pagada (JE-2026-10-0019, BT-9012-111) → Conciliada | APROBADO |
| Referencia al libro | El gasto directo guarda su asiento | Renderizado (Master 64) | EXP-8846 Home Depot US$86.40 contabilizado; el panel muestra Anular y revertir + Asiento GL | APROBADO |
| Referencia al libro | GL → detalle de origen del pago | Renderizado (tras reparación) | linkPayments(): TRX-… reasignados una vez a PAY-50421 / 50419 / 50433 / 50434; el origen de JE-2026-10-0001 muestra Pago • PAY-50421; Master 16 abre por ?id= | APROBADO |
| Referencia al libro | Cada pago completado contabilizado exactamente una vez | Estático + renderizado | Contabilizaciones faltantes creadas una vez, idempotentes por id de origen (JE-2026-10-0101…0104, JE-2026-09-0190 + reembolso JE-2026-09-0191); filas sin asiento muestran “No contabilizado” | APROBADO |
| Referencia al libro | Un pago manual nuevo se contabiliza en GL al completarse | Estático | El envío de Master 16 no llama a MGH_FIN.postJe — los pagos nuevos quedan sin contabilizar (L5-18) | FALLA |
| Referencia al libro | Pago → referencia GL | Renderizado (tras reparación) | Relación guardada una vez (JE.src → id del pago); el lado del pago la deriva vía MGH_FIN.jeFor(id) — sin clave duplicada | APROBADO |
| Datos de prueba | Registros de prueba del Lote 5 restablecidos | Ejecutado | Respaldo mghpm.qa.backup.lote5-repair; DIST-2026-09-0001 / -0002 / -0006 restaurados a la línea base; eliminados JE-2026-10-0019…0022, BT-9012-111/112, EXP-8846; restablecimiento registrado en el historial del módulo (no se borró historial) | APROBADO |
| Autorización | Contabilización de EXP-8836 | Decisión | Queda Retenido / No contabilizado hasta confirmar que es un costo distinto de BILL-2026-0402 (HOA-OCT-1204) | BLOQUEADO |
| Trazabilidad | Cambios de estado registrados | Renderizado | Historial de la distribución + C.audit(UPDATE …) en cada transición; X.log de CxP por acción | APROBADO |
| Doble contabilización | Control al ejecutar distribución | Estático | execute() bloquea cuando d.je es un asiento Contabilizado vigente (od.err_dup); la UI oculta Ejecutar tras Pagada — ruta del control no probada con clic | NO PROBADO |
| Doble contabilización | Aprobar en CxP un registro ya contabilizado | Estático | Aprobar bloqueado cuando existe postedJe(b) — sin clic | NO PROBADO |
| Doble contabilización | Gasto directo duplicado | Renderizado | “Posible duplicado de EXP-8817 (mismo beneficiario, propiedad y monto en 7 días) — contabilización bloqueada” | APROBADO |
| Periodo cerrado | Gasto directo con fecha 15 ago 2026 | Renderizado | “La fecha 15 ago 2026 está en un periodo cerrado (agosto 2026) — contabilización bloqueada” | APROBADO |
| Periodo cerrado | Ajuste / pago de distribución en periodo cerrado | Estático | adjModal + schedModal usan MGH_FIN.isClosed (ago 2026 Cerrado) — sin clic | NO PROBADO |
| Periodo cerrado | Asiento manual GL en periodo cerrado (61) | Estático | R6-E: contabilizar en periodo cerrado bloqueado en Master 61 — no re-ejecutado en el Lote 5 | NO PROBADO |
| Aprobación rechazada | El propietario rechaza la distribución → ajustar → reenviar | Renderizado | DIST-2026-09-0006: Enviada → “El propietario rechazó: disputa el cargo de HVAC…” → “Ajuste US$310.00 agregado • requiere re-aprobación del propietario” → Enviada; neto US$8,440.00 → US$8,750.00 | APROBADO |
| Aprobación rechazada | Rechazo de factura en CxP | Estático | Rechazar con motivo (Master 64) — sin clic | NO PROBADO |
| Pago fallido | Pago de distribución devuelto | Renderizado | DIST-2026-09-0001: Pagada → Marcar pago fallido (R01) → asiento de reversión contabilizado, línea bancaria devuelta, estado Pago fallido, se ofrece Reintentar pago | APROBADO |
| Pago fallido | Falla un pago programado de CxP | Estático | Marcar pago fallido → Impaga (Master 64) — sin clic | NO PROBADO |
| Pago parcial | Cobro parcial en CxC | Estático | Master 63 Registrar pago contra saldo (línea 418); semilla AR-2026-0602 1,500 de 3,100 pagado — sin clic | NO PROBADO |
| Reversión | Par de reversión en GL | Estático | Semilla JE-2026-10-0016 revertido por JE-2026-10-0017 (banco BT-9012-008/009 emparejados) | APROBADO |
| Reembolso | Reembolso de pago / de depósito | Estático | Master 16 canRefund (pagos completados); Master 48 SD-0398 Reembolso pendiente — sin clic | NO PROBADO |
| Conciliación | Conciliar bloqueado con excepciones abiertas | Estático | Master 65 línea 388: reconcile() se niega mientras queden líneas sin emparejar / con excepción (BT-9012-006, -007) — sin clic | NO PROBADO |
| Conciliación | Distribución pagada heredada sin línea bancaria | Renderizado | DIST-2026-08-0001 (pagada 5 sep, antes del GL) → Conciliar devuelve “Aún no hay línea bancaria para conciliar” — excepción L5-10 | FALLA |
| Validación | Factura de proveedor ingresada como gasto directo | Renderizado | “Las facturas de proveedor deben ingresarse como Factura para aplicar aprobación y cumplimiento del proveedor” | APROBADO |
| Validación | Monto cero | Renderizado | “El monto debe ser mayor que cero” | APROBADO |
| Defecto en ejecución | Carga de Master 64 | Renderizado antes / después de la corrección | Antes: “logic class eval FAILED” (QP antes de inicializarse). Después: pestañas, KPIs y panel renderizan | CORREGIDO |

## T5. Pruebas de traducción dinámica ES / EN

| Entrada | Salida | Estado |
|---|---|---|
| 3 of 12 bills | 3 de 12 facturas | APROBADO |
| Required: Payment Date *, Method * | Obligatorio: Fecha de pago, Método | APROBADO |
| Paid • Oct 6, 2026 | Pagado • 6 oct 2026 | APROBADO |
| Payment Failed | Pago fallido | APROBADO |
| 12 days overdue | 12 días de atraso | APROBADO |
| Expense • Category • GL | Gasto • Categoría • GL | APROBADO |
| Showing records for owner Alvarez Family Trust | Mostrando registros del propietario Alvarez Family Trust (tras corrección; la primera corrida FALLÓ “de owner”) | APROBADO |
| tk(od.count, {n:3,total:7}) es / en | 3 de 7 distribuciones / 3 of 7 distributions | APROBADO |
| fmt.money(1234567.5) es-DO / en-US | US$1,234,567.50 / US$1,234,567.50 | APROBADO |
| fmt.date(2026-10-09) es-DO / en-US | 9 oct de 2026 / Oct 9, 2026 | APROBADO |
| Brickell Bay Residences • Unit 1204 (dato del usuario) | sin cambios | APROBADO |
| Frase heredada “… Payment scheduled for Oct 9, 2026 via ACH” | solo se traduce la fecha — la frase queda en inglés (literal heredado, no es clave) | FALLA |
| Ejecución ES — Master 49 lista, panel, modal de programación | Renderizado en español (título, KPIs, acciones, modal, estados); 6 etiquetas quedaron en inglés (Management Fee (8%), Operating Expenses, Reserve Holdback, Statement, All Periods, assistant) → entradas de diccionario agregadas; preferencia restaurada a EN | APROBADO |
| Re-prueba ES tras corregir el diccionario | No re-renderizado | NO PROBADO |
| Ejecución ES — Masters restantes | No ejecutado | NO PROBADO |

## T6. Medición responsive — 390 / 1024 / 1440 px

| Alcance | Hallazgo | Método | Evidencia | Estado |
|---|---|---|---|---|
| Todos los 66 Masters (02–67) × 390 / 1024 / 1440 | 198 mediciones en iframe del mismo origen: desbordamiento horizontal de página y main, estado de la barra, h1 presente, texto renderizado | Ejecutado | 193 limpios • barra oculta a 390, 76 px a 1024, 260 px a 1440 en Masters del personal | APROBADO |
| Master 11 Contabilidad @ 390 | desbordamiento horizontal de main 30 px | Ejecutado | L5-14 | FALLA |
| Master 43 Póliza de seguro 360 @ 390 | desbordamiento horizontal de main 18 px | Ejecutado | L5-15 | FALLA |
| Master 31 Reserva 360 @ 390 / 1024 (sin ?id) | página de registro sin id renderiza contenido mínimo | Ejecutado | Esperado — la vista de registro requiere ?id; con id renderizó a ~924 px | N/A |
| Master 39 Plantillas @ 1440 | sin contenido en 10.5 s en carga por lote | Ejecutado | No concluyente (aprueba a 390 / 1024) — L5-16 | NO PROBADO |
| Master 16 @ 390 | las tablas se desplazan horizontalmente dentro de su tarjeta (sin diseño de tarjetas) | Ejecutado | Sin desbordamiento de página; usabilidad P3 | APROBADO |

## TM. Matriz de trazabilidad Master ↔ Código — columnas obligatorias

| Columna | Contenido | Responsable / estado |
|---|---|---|
| Master | Masters 01–67 (report-manifest.js) | Completado |
| Ruta | ruta en adminRoutes.ts / AdminApp.tsx | Claude Code — Fase 0 |
| Componente frontend | archivo pages/admin/* | Claude Code — Fase 0 |
| API | endpoint(s) DRF + servicio | Claude Code — Fase 0 |
| Tablas | modelos / migraciones Django | Claude Code — Fase 0 |
| Permisos | capacidad de ruta + menú, alcance por objeto | Claude Code — Fase 0 |
| Integraciones | Hub, pagos, correo, almacenamiento | Claude Code — Fase 0 |
| Pruebas | ids unitarias / API / e2e | Claude Code — Fase 0 |
| Estado de implementación | PRODUCCIÓN / PARCIAL / SOLO PROTOTIPO / NO EN CÓDIGO — evidencia obligatoria | Claude Code — Fase 0 |

## P. Matriz de funcionalidad prototipo vs producción

| Módulo | Prototipo | Código | Estado en producción |
|---|---|---|---|
| Gastos | Master 64 Registro de gastos (registro único, contabilización GL simulada) | Página ExpensesAdd + ExpenseRecordModal (duplicado F-24) bajo /admin/payments | PARCIAL |
| Distribuciones a propietarios | Master 49 máquina de estados completa, ajustes, aprobaciones, contabilización, conciliación (simulado) | Ninguno | NO EN CÓDIGO |
| GL • Libro de propiedad • CxC • CxP • Conciliación • Cierre | Masters 61–66 (simulado) | Solo generador de reportes /admin/finance | NO EN CÓDIGO |
| Pagos | Master 16 (simulado) | Lista /admin/payments, crear, recibo PDF (API); ruta de edición sin registrar (F-02) | PARCIAL |
| Depósitos • Nómina | Masters 48, 50 (simulado) | Ninguno | NO EN CÓDIGO |
| Solicitudes de alquiler | Masters 07, 08, 23, 67 (simulado; solo decisión humana) | Ninguno | NO EN CÓDIGO |
| Operaciones | Masters 09, 36, 56, 57, 58, 59, 60 (simulado) | Órdenes de trabajo hasta Completado; listas de proveedores/personal | PARCIAL |
| Cumplimiento | Masters 27, 44–47, 52, 53 (simulado) | Solo Documentos, Verificación de identidad | PARCIAL |
| Alquileres a corto plazo | Masters 17, 29–35 (simulado) | Lista de reservas, huéspedes, vista de calendario | PARCIAL |
| Portales | Masters 05, 06 (simulado) | Tablas de solo lectura (F-01, F-08, F-09) | PARCIAL |
| Mensajes • Notificaciones | Masters 24, 47 | Mensajes de solo lectura; sin notificaciones | PARCIAL |
| Integraciones | Master 55 (pruebas / sincronizaciones simuladas) | Hub API parcial | PARCIAL |
| i18n | Claves i18n.js + tk/fmt + traducción del DOM (prototipo) | i18next es/en | SOLO PROTOTIPO |
| Persistencia | Almacenes localStorage / sessionStorage (MGH_*) | Django + DRF, multi-tenant | SOLO PROTOTIPO |

## L5. Asuntos pendientes — registro del Lote 5 (P0–P3)

| ID | Prioridad | Asunto | Módulo |
|---|---|---|---|
| L5-01 | CORREGIDO | Los orígenes de pago en el GL referenciaban ids TRX ausentes en Pagos — reasignados; relación única (R8-B) | Datos financieros |
| L5-02 | CORREGIDO | El registro de pago no tenía referencia de asiento — derivada vía jeFor(), renderizada | Pagos |
| L5-03 | P1 | La visibilidad por rol / permiso no se puede probar: una sola persona; la matriz de Master 21 es solo configuración → BLOQUEADO en cada Master (código F-03 / F-04 abiertos) | Permisos |
| L5-04 | CORREGIDO | Contrato 360 → cargo CxC (41 → 63) | W4 |
| L5-05 | CORREGIDO | Preparación de la propiedad → Reserva (36 → 31) | W1 |
| L5-06 | CORREGIDO | Reserva 360 → Depósitos (31 → 48) | Finanzas corto plazo |
| L5-07 | P2 | Los Masters heredados están escritos en inglés; las frases libres compuestas solo se traducen por segmento/fecha. Las claves (tk) se usan solo en código del Lote 5 | i18n |
| L5-08 | P2 | Pruebas de clic renderizadas en 11 Masters; recorrido completo de comportamiento de los otros 55 no ejecutado; ejecución ES solo en 49 | Cobertura de pruebas |
| L5-09 | P2 | Sondeo de ancho en JS (F-21) sin cambios — KPI en vivo abajo | Prototipo |
| L5-10 | P3 | DIST-2026-08-0001 pagada antes de la puesta en marcha del GL: sin asiento / línea bancaria → no se puede conciliar | Distribuciones a propietarios |
| L5-11 | P3 | Master 06 (v1) duplicado obsoleto pendiente de aprobación para eliminar (0 enlaces entrantes) | Higiene |
| L5-12 | P3 | Master 16 conserva la rama inalcanzable del formulario de gastos | Higiene |
| L5-13 | P3 | EXP-8836 (cuotas HOA T4) Retenido — no autorizado hasta confirmar que difiere de BILL-2026-0402 | Gastos |
| L5-14 | P2 | Master 11 Contabilidad: desbordamiento horizontal de 30 px a 390 px | Responsive |
| L5-15 | P2 | Master 43 Póliza de seguro 360: desbordamiento horizontal de 18 px a 390 px | Responsive |
| L5-16 | P3 | Master 39 Plantillas @ 1440 sin medir (carga > 10.5 s en lote) | Responsive |
| L5-17 | P3 | Master 47 ignora ?q desde Abrir notificaciones (bandeja sin filtrar) | Notificaciones |
| L5-18 | P2 | Los pagos manuales nuevos en Master 16 no se contabilizan en el GL al completarse | Pagos |
| L5-19 | P3 | Los botones del encabezado de Master 16 parecen solaparse con la fila de KPIs en la captura de ~924 px — requiere confirmación visual | Pagos |

## K. Entrega priorizada de implementación — Claude Code (primero la Fase 0)

| Paso | Prioridad | Alcance | Compuerta de salida |
|---|---|---|---|
| 0 | COMPUERTA | Alcance de autorización: Claude Code está autorizado SOLO para inspección, seguridad y reparación del núcleo existente. Sin construcción simultánea de módulos nuevos | Aprobación escrita antes de la Fase 3 |
| 0.1 | P0 | Fase 0 — inspeccionar el repositorio real: autorización de rutas/API, aislamiento por organización (X-Organization), permisos por objeto de propietario e inquilino, seguridad de Pagar renta del inquilino (F-01, F-03), capacidades no coincidentes (F-04) | Pruebas de matriz de roles (propietario, inquilino, agente, personal, entre organizaciones) en verde; hallazgos registrados como evidencia ejecutada |
| 0.2 | P0 | Fase 0 — completar la Matriz de trazabilidad Master ↔ Código (sección TM) para los 67 Masters: ruta, componente frontend, API, tablas, permisos, integraciones, pruebas, estado — solo evidencia | Cada fila PRODUCCIÓN / PARCIAL / SOLO PROTOTIPO / NO EN CÓDIGO con referencias a archivos |
| 0.3 | P0 | Siguiente entregable: Informe de brechas MGHPM Design System v3.7 ↔ MGHPM-Corecciones + plan de implementación verificable | Muestra qué funciona hoy vs qué falta; ninguna simulación cuenta como producción |
| 1 | P0 | Reparar núcleo: F-02 registrar /admin/payments/:id/edit • F-01 Pagar renta en Portal del inquilino + saldo + recibo (seguro, idempotente) | El inquilino paga; el personal corrige un pago; sin doble cobro |
| 2 | P1 | Invariantes financieras para cada operación crítica: ids persistentes, transacciones atómicas en BD, idempotencia / controles de duplicado, registro de auditoría solo-anexar (sin ediciones silenciosas), FK JournalEntry.source, control de periodo cerrado en servidor | Filas T4 del Lote 5 reproducidas como pruebas de backend |
| 3 | P1 | Núcleo por dependencia: Propiedades → Unidades → Propietarios → Inquilinos → Contratos → Pagos → Libro (rutas 360 de registros F-06 / F-07; un único modelo Gasto/Factura; eliminar duplicado ExpensesAdd) | Propiedad → Propietario → Inquilino → Contrato → Pago → Asiento navegable en ambos sentidos |
| 4 | P2 | Luego: Reservas, Operaciones, Mantenimiento (ciclo de OT hasta Cierre, limpieza, inspecciones, preparación) | W1, W2, W6 terminan en estado cerrado |
| 5 | P2 | Luego: finanzas avanzadas (máquina de estados de Distribuciones como Master 49, CxC, CxP, Conciliación, Cierre, Depósitos, Nómina) y portales | W4, W5 aprobadas como pruebas de backend |
| 6 | P2 | Migración i18n: claves de i18n.js → namespaces de i18next; Intl es-DO / en-US; documentos según docLang del destinatario | Sin cadenas de UI fijas en código; ES por defecto |
| 7 | P3 | Higiene: código muerto F-24 / F-25, eliminar Master 06 (v1) con aprobación, alerts → errores en línea | P3 resueltos |

## B1. Inventario de rutas — Código (frontend/src/pages/admin/AdminApp.tsx)

| Módulo | Página | Ruta | Padre | Capacidad | Menú | Conectada desde | Conecta a | Estado |
|---|---|---|---|---|---|---|---|---|
| Panel | Panel principal | /admin/dashboard | — | dashboard.read | Sí | Login / ruta por defecto | Lista de reservas, lista de órdenes de trabajo, accesos rápidos | PARCIAL |
| Portales | Portal del propietario | /admin/portal-propietario | — | owner_portal.read | Sí | Barra lateral | Nada | PARCIAL |
| Portales | Portal del inquilino | /admin/portal-inquilino | — | tenant_portal.read | Sí | Barra lateral | Nada | PARCIAL |
| Adm. propiedades | Propiedades | /admin/properties | — | property.read | Sí | Barra lateral, Panel | Ver, Editar, Unidades, Agregar | PARCIAL |
| Adm. propiedades | Detalle de propiedad | /admin/properties/:id/view | Propiedades | property.read | No | Propiedades › Ver | Propiedades, Editar | PARCIAL |
| Adm. propiedades | Agregar propiedad | /admin/properties/add | Propiedades | property.create | No | Propiedades › + Agregar | Propiedades | COMPLETO |
| Adm. propiedades | Editar propiedad | /admin/properties/:id/edit | Detalle de propiedad | property.update | No | Propiedades, Detalle de propiedad | Lista de propiedades (no el detalle) | PARCIAL |
| Adm. propiedades | Unidades | /admin/properties/:id/units | Detalle de propiedad | property.read | No | Fila de propiedades | Lista de propiedades (no el detalle) | PARCIAL |
| Adm. propiedades | Propietarios | /admin/people/owners | — | ruta people.read • menú people.owner.read | Sí | Barra lateral | Modales crear/editar propietario | PARCIAL |
| Adm. propiedades | Inquilinos | /admin/people/tenants | — | people.read | Sí | Barra lateral, Huéspedes | Modal editar, modal crear/editar contrato | PARCIAL |
| Adm. propiedades | Contratos | /admin/leases | — | lease.read | Sí | Barra lateral | Modal editar, modal documentos | PARCIAL |
| Adm. propiedades | Agregar contrato | /admin/leases/add | Contratos | lease.create | No | Nada enlaza aquí | Nada | MARCADOR |
| Adm. propiedades | Solicitudes de alquiler | — | — | — | No | — | — | FALTANTE — PLANIFICADO |
| Corto plazo | Reservas | /admin/reservations | — | reservation.read | Sí | Barra lateral, Panel, Huéspedes | Modal detalle, Huéspedes | PARCIAL |
| Corto plazo | Huéspedes | /admin/reservations/guests | Reservas | reservation.read | No | Botón en Reservas | Reservas?guestId, editar inquilino, invitación en Configuración | PARCIAL |
| Corto plazo | Calendario | vista dentro de /admin/reservations | Reservas | reservation.read | No | Selector en Reservas | Modal detalle de reserva | PARCIAL |
| Operaciones | Tareas (órdenes de trabajo) | /admin/work-orders | — | ruta task.read • menú work_order.read | Sí | Barra lateral, Panel, fila de proveedor en Directorio | Detalle de mantenimiento (?workOrder=) | PARCIAL |
| Operaciones | Mantenimiento | /admin/work-orders/add | — | work_order.create | Sí | Barra lateral, Tareas | Modal detalle | PARCIAL |
| Operaciones | Proveedores | /admin/people/vendors | — | people.read | Sí | Barra lateral | Modal crear/editar proveedor | PARCIAL |
| Operaciones | Personal | /admin/people/staff | — | people.read | No | Filtro del Directorio | Editar miembro | PARCIAL |
| Operaciones | Centro de operaciones • Limpieza • Inspecciones | — | — | — | No | — | — | FALTANTE — PLANIFICADO |
| Finanzas | Pagos | /admin/payments | — | payment.read | Sí | Barra lateral, agregar gasto | Modal crear, modal gasto, recibo PDF | PARCIAL |
| Finanzas | Agregar gasto | /admin/payments/expenses/add | Pagos | payment.create | No | Nada en la app (se usa el modal) | Pagos?tab=expenses | DUPLICADO |
| Finanzas | Editar pago | /admin/payments/:id/edit | Pagos | payment.update | No | adminPaymentEditPath (sin uso) | Pagos | SIN RUTA |
| Finanzas | Finanzas (libro) | /admin/finance = /admin/ledger | — | finance.read | Sí | Barra lateral | Reporte de propietarios | PARCIAL |
| Finanzas | Centro de reportes | /admin/reports | — | report.read | Sí | Barra lateral | Subreportes, Pagos | PARCIAL |
| Finanzas | Reporte de propietarios | /admin/reports/owners | Reportes | report.read | No | Reportes, Libro | Libro | PARCIAL |
| Finanzas | Reporte de ocupación | /admin/reports/occupancy | Reportes | report.read | No | Reportes | Nada | PARCIAL |
| Finanzas | Reporte de mantenimiento | /admin/reports/maintenance | Reportes | report.read | No | Reportes | Nada | PARCIAL |
| Finanzas | Reporte de reservas | /admin/reports/reservations | Reportes | report.read | No | Reportes | Lista de reservas | PARCIAL |
| Finanzas | Reporte de inquilinos | /admin/reports/tenants | Reportes | report.read | No | Reportes | Directorio (?type=tenants) | PARCIAL |
| Finanzas | Contabilidad GL • Depósitos • Pagos a propietarios • Nómina | — | — | — | No | — | — | FALTANTE — PLANIFICADO |
| Cumplimiento | Documentos | /admin/documents | — | document.read | Sí | Barra lateral, Panel | Subir, categorías, vista previa | PARCIAL |
| Cumplimiento | Subir documento | /admin/documents/upload | Documentos | document.create | No | CTA de Documentos | Volver (history -1) | COMPLETO |
| Cumplimiento | HOA • Activos • Incidentes | — | — | — | No | — | — | FALTANTE — PLANIFICADO |
| Comunicación | Mensajes | /admin/messages | — | message.read | Sí | Barra lateral | Nada | PARCIAL |
| Comunicación | Notificaciones | — | — | — | No | — | — | FALTANTE — PLANIFICADO |
| Comunicación | Mensajes de contacto | /admin/contact-messages | — | contact_message.read | Sí | Barra lateral | Actualizar estado | PARCIAL |
| Administración | Organizaciones | /admin/organizations | — | organization.read | No (solo MenuList obsoleto) | URL directa | Asistente nuevo/editar | DESCONECTADO |
| Administración | Asistente de organización | /admin/organizations/new • /:id/edit | Organizaciones | organization.update | No | Organizaciones | Organizaciones | COMPLETO |
| Administración | Directorio | /admin/people | — | ruta people.read • menú people.directory.read | Sí | Barra lateral | Detalle, invitar, asignar, editar personal | PARCIAL |
| Administración | Usuarios | /admin/users | — | people.read | No | Enlaces heredados | Igual que Directorio | ALIAS |
| Administración | Usuarios y organizaciones | /admin/users-and-organizations | — | organization.read | Sí | Barra lateral | Redirige → Configuración ?section=users | ALIAS |
| Administración | Roles | /admin/roles | — | organization.read | Sí | Barra lateral | — | PARCIAL |
| Administración | Permisos | /admin/permissions | — | organization.read | Sí | Barra lateral | — | PARCIAL |
| Administración | Verificación de identidad | /admin/identity-verification | — | document.read | Sí | Barra lateral, redirección del guard | — | PARCIAL |
| Administración | Revisión de verificación de identidad | /admin/identity-verification/review | — | document.review | Sí | Barra lateral | — | PARCIAL |
| Administración | Auditoría | /admin/audit-users | — | organization.read | Sí | Barra lateral | — | PARCIAL |
| Administración | Hub / MGH | /admin/hub (alias /admin/my-hub) | — | hub.read | Condicional | Barra lateral (superadmin), Panel | Modales de empresa | PARCIAL |
| Administración | Docs de API | externo VITE_HUB_DOCS_URL | — | api_docs.read | Condicional | Barra lateral | Respaldo a http://127.0.0.1:9100/docs | ROTO |
| Administración | Incorporación de propiedad | /admin/onboarding | — | property.create | No (MenuList obsoleto) | URL directa | Nada | MARCADOR |
| Configuración | Configuración | /admin/settings | — | organization.read | Sí | Barra lateral, Huéspedes (invitar) | 17 pestañas | COMPLETO |
| Configuración | Perfil | /admin/profile | — | authenticated | Barra superior | Menú del avatar | Panel | COMPLETO |
| Autenticación | Inicio de sesión | /admin/login | — | public | — | Redirección de ruta protegida | Ruta por defecto | PARCIAL |
| Autenticación | Registro • Aceptar invitación | /admin/register • /admin/accept-invitation | — | public | — | Login, correo | Login | COMPLETO |
| Sin ruta | Olvidé mi contraseña | — | Login | — | — | — | — | SIN RUTA |
| Sin ruta | Error 400/403/404/500/503 | — | — | — | — | — | /dashboard (fuera de /admin) | SIN RUTA |
| Sin ruta | Restos de plantilla | Todo, Widget, Editable, AdminDashboardPage, PlaceholderPages, LockScreen, Omah Shop/CMS/Charts | — | — | — | — | — | SIN RUTA |

## B2. Matriz de auditoría de páginas — Código

| Módulo | Página | Ruta | 360 | Navegación | Botones | Datos | Flujo | Responsive | Estado |
|---|---|---|---|---|---|---|---|---|---|
| Panel | Panel principal | /admin/dashboard | 4/10 | OK | Los ítems abren la lista del módulo, no el registro | API (dashboardService) | Sin acceso directo a registros | Requiere runtime | PARCIAL |
| Portales | Portal del propietario | /admin/portal-propietario | 2/10 | Solo menú | 0 acciones | API, filtrado en backend | Tablas de solo lectura; sin estados de cuenta, pagos, aprobaciones ni documentos | Tabla Bootstrap responsive | PARCIAL |
| Portales | Portal del inquilino | /admin/portal-inquilino | 2/10 | Solo menú | 0 acciones | API, filtrado en backend | Sin Pagar renta, sin crear tickets, sin recibos | Tabla Bootstrap responsive | PARCIAL |
| Adm. propiedades | Propiedades | /admin/properties | 5/10 | OK | Ver/Editar/Unidades/Agregar funcionan | API | Lista completa; propietario no clicable | Requiere runtime | PARCIAL |
| Adm. propiedades | Detalle de propiedad | /admin/properties/:id/view | 3/10 | Migas + Volver | Volver, Editar, solo galería | API | Solo secciones informativas; sin enlaces a Propietario/Inquilino/Contrato/Pagos/Docs/OT | Requiere runtime | PARCIAL |
| Adm. propiedades | Agregar propiedad | /admin/properties/add | — | OK | Guardar/Cancelar funcionan | API | Flujo de formulario completo | Requiere runtime | COMPLETO |
| Adm. propiedades | Editar propiedad | /admin/properties/:id/edit | — | Vuelve a la lista — se pierde el contexto | Guardar/Cancelar funcionan | API | Formulario completo | Requiere runtime | PARCIAL |
| Adm. propiedades | Unidades | /admin/properties/:id/units | 3/10 | Volver va a la lista | CRUD de unidades (verificar) | API | Sin inquilino/contrato por unidad | Requiere runtime | PARCIAL |
| Adm. propiedades | Propietarios | /admin/people/owners | 3/10 | Capacidad no coincide | Modales Crear/Editar | API | Sin ruta Propietario 360 | Requiere runtime | PARCIAL |
| Adm. propiedades | Inquilinos | /admin/people/tenants | 3/10 | OK | Editar, modal de contrato | API | Sin ruta Inquilino 360 | Requiere runtime | PARCIAL |
| Adm. propiedades | Contratos | /admin/leases | 3/10 | OK | Editar, Docs, Eliminar | API | Sin detalle de contrato, renovar, terminar, salida | Requiere runtime | PARCIAL |
| Adm. propiedades | Agregar contrato | /admin/leases/add | 0/10 | Huérfana | Ninguno | Ninguno | Texto estático "Add Lease / Create a new lease." (inglés fijo en código) | — | MARCADOR |
| Adm. propiedades | Solicitudes de alquiler | — | — | — | — | — | Sin ruta, página ni servicio en el código | — | FALTANTE — PLANIFICADO |
| Corto plazo | Reservas | /admin/reservations | 4/10 | OK | Ver, Editar, Confirmar, Eliminar, navegación de calendario | API | Sin check-in/out, depósito, limpieza ni resumen financiero | Requiere runtime | PARCIAL |
| Corto plazo | Huéspedes | /admin/reservations/guests | 3/10 | No está en la barra lateral | Enlaces funcionan | API | Sin perfil de huésped | Requiere runtime | PARCIAL |
| Corto plazo | Calendario | vista dentro de /admin/reservations | 3/10 | Sin ruta/menú propio | Anterior/Siguiente/Hoy | API | Sin bloqueo de disponibilidad | Requiere runtime | PARCIAL |
| Operaciones | Tareas (órdenes de trabajo) | /admin/work-orders | 4/10 | Capacidad no coincide | Abrir detalle OT | API (tasksRepository) | Lista de tareas; sin programación | Requiere runtime | PARCIAL |
| Operaciones | Mantenimiento | /admin/work-orders/add | 6/10 | Ruta llamada "add" es una lista | Crear, Asignar, Cotizar, Aprobar/Rechazar, Comentar, Completar, Eliminar | API | Sin fotos antes/después, factura, inspección, cierre | Requiere runtime | PARCIAL |
| Operaciones | Proveedores | /admin/people/vendors | 3/10 | OK | Crear/Editar | API | Sin perfil de proveedor, trabajos ni pagos | Requiere runtime | PARCIAL |
| Operaciones | Personal | /admin/people/staff | 2/10 | No está en la barra lateral | Editar miembro | API | Sin horario, hoja de horas ni nómina | Requiere runtime | PARCIAL |
| Operaciones | Centro de operaciones • Limpieza • Inspecciones | — | — | — | — | — | Sin rutas ni páginas | — | FALTANTE — PLANIFICADO |
| Finanzas | Pagos | /admin/payments | 5/10 | OK | Crear, recibo PDF, modal gasto | API | Sin detalle de registro; página de edición sin ruta | Requiere runtime | PARCIAL |
| Finanzas | Agregar gasto | /admin/payments/expenses/add | — | Página huérfana | Guardar funciona | API | Duplica ExpenseRecordModal | — | DUPLICADO |
| Finanzas | Editar pago | /admin/payments/:id/edit | — | La URL redirige a la ruta por defecto | La página existe, inalcanzable | API | Imposible corregir un pago desde esta página | — | SIN RUTA |
| Finanzas | Finanzas (libro) | /admin/finance = /admin/ledger | 3/10 | Dos rutas, una página | Generar PDF/XLSX, Descargar | API (reportsService) | Generador de reportes, no un libro: sin GL, CxC/CxP ni conciliación bancaria | Requiere runtime | PARCIAL |
| Finanzas | Centro de reportes | /admin/reports | 4/10 | OK | Exportar CSV funciona | API | Solo resumen financiero | Requiere runtime | PARCIAL |
| Finanzas | Reporte de propietarios | /admin/reports/owners | 4/10 | OK | Exportar vía Libro | API | KPIs interactivos | Requiere runtime | PARCIAL |
| Finanzas | Reporte de ocupación | /admin/reports/occupancy | 3/10 | OK | Exportar = alerta SIMULADA | API + respaldo vacío | Solo lectura | Requiere runtime | PARCIAL |
| Finanzas | Reporte de mantenimiento | /admin/reports/maintenance | 3/10 | OK | Exportar = alerta SIMULADA | API + respaldo vacío | Solo lectura | Requiere runtime | PARCIAL |
| Finanzas | Reporte de reservas | /admin/reports/reservations | 3/10 | OK | Exportar = alerta SIMULADA | API + respaldo vacío | Solo lectura | Requiere runtime | PARCIAL |
| Finanzas | Reporte de inquilinos | /admin/reports/tenants | 3/10 | "Ver todo" va al Directorio | Exportar = alerta SIMULADA | API + respaldo vacío | Solo lectura | Requiere runtime | PARCIAL |
| Finanzas | Contabilidad GL • Depósitos • Pagos a propietarios • Nómina | — | — | — | — | — | Sin rutas ni páginas | — | FALTANTE — PLANIFICADO |
| Cumplimiento | Documentos | /admin/documents | 4/10 | OK | Enlace subir, categorías, vista previa | API | Vista previa no PDF = alerta | Requiere runtime | PARCIAL |
| Cumplimiento | Subir documento | /admin/documents/upload | — | OK | Subir/Cancelar | API | Completo | Requiere runtime | COMPLETO |
| Cumplimiento | HOA • Activos • Incidentes | — | — | — | — | — | Sin rutas ni páginas en código • diseñados en Masters 44–46 (prototipo) | — | FALTANTE — PLANIFICADO |
| Comunicación | Mensajes | /admin/messages | 1/10 | Solo menú | 0 acciones | API | Lista de solo lectura; sin hilo, responder ni redactar | Tabla Bootstrap responsive | PARCIAL |
| Comunicación | Notificaciones | — | — | — | — | — | Sin ruta ni página en código • diseñado en Master 47 (prototipo) | — | FALTANTE — PLANIFICADO |
| Comunicación | Mensajes de contacto | /admin/contact-messages | 3/10 | OK | Actualizar estado | API | Sin convertir a prospecto | Requiere runtime | PARCIAL |
| Administración | Organizaciones | /admin/organizations | 4/10 | No está en FLAT_NAV | Nuevo, Editar | API | Lista + asistente | Requiere runtime | DESCONECTADO |
| Administración | Asistente de organización | /admin/organizations/new • /:id/edit | — | OK | Guardar/Volver | API | Completo | Requiere runtime | COMPLETO |
| Administración | Directorio | /admin/people | 3/10 | Capacidad no coincide | Fila de proveedor → Órdenes de trabajo (incorrecto) | API | Sin persona 360 | Requiere runtime | PARCIAL |
| Administración | Usuarios | /admin/users | — | — | — | — | Renderiza People (compatibilidad) | — | ALIAS |
| Administración | Usuarios y organizaciones | /admin/users-and-organizations | — | El estado activo salta a Configuración | — | — | Solo redirección | — | ALIAS |
| Administración | Roles | /admin/roles | — | OK | Requiere runtime | API | — | Requiere runtime | PARCIAL |
| Administración | Permisos | /admin/permissions | — | OK | Requiere runtime | API | — | Requiere runtime | PARCIAL |
| Administración | Verificación de identidad | /admin/identity-verification | — | OK | Subir ID/pasaporte/selfie | API | KYC autoservicio | Requiere runtime | PARCIAL |
| Administración | Revisión de verificación de identidad | /admin/identity-verification/review | — | OK | Aprobar/Rechazar | API | Sin enlace al registro de la persona | Requiere runtime | PARCIAL |
| Administración | Auditoría | /admin/audit-users | — | OK | Filtrar (verificar) | API (auditLogService) | Sin enlace al registro auditado | Requiere runtime | PARCIAL |
| Administración | Hub / MGH | /admin/hub (alias /admin/my-hub) | — | OK | Errores de sincronización vía alert | Hub API | — | Requiere runtime | PARCIAL |
| Administración | Docs de API | externo VITE_HUB_DOCS_URL | — | Respaldo localhost en prod | — | — | — | — | ROTO |
| Administración | Incorporación de propiedad | /admin/onboarding | 0/10 | Huérfana | Ninguno | Ninguno | Texto "Próximamente" | — | MARCADOR |
| Configuración | Configuración | /admin/settings | — | OK | Pestañas funcionan; algunos errores vía alert | API | Completo | Requiere runtime | COMPLETO |
| Configuración | Perfil | /admin/profile | — | OK | Guardar | API | Completo | Requiere runtime | COMPLETO |
| Autenticación | Inicio de sesión | /admin/login | — | OK | Olvidé mi contraseña = MUERTO | API | Sin flujo de recuperación | Requiere runtime | PARCIAL |
| Autenticación | Registro • Aceptar invitación | /admin/register • /admin/accept-invitation | — | OK | Funciona | API | Completo | Requiere runtime | COMPLETO |
| Sin ruta | Olvidé mi contraseña | — | — | — | — | — | Página de plantilla Omah, sin ruta | — | SIN RUTA |
| Sin ruta | Error 400/403/404/500/503 | — | — | Destino incorrecto | — | — | Las rutas desconocidas redirigen en su lugar | — | SIN RUTA |
| Sin ruta | Restos de plantilla | Todo, Widget, Editable, AdminDashboardPage, PlaceholderPages, LockScreen, Omah Shop/CMS/Charts | — | — | — | Datos de muestra fijos en código | Código muerto | — | SIN RUTA |

## B3. Auditoría de la barra lateral — módulos solicitados vs código vs Masters

| Sección | Ítem | Ruta en código | Código | Master | Estado del Master | Nota |
|---|---|---|---|---|---|---|
| Panel | Panel principal | /admin/dashboard | PARCIAL | Master 02 | COMPLETO |  |
| Adm. propiedades | Propiedades | /admin/properties | PARCIAL | Master 03 / 04 / 20 | COMPLETO |  |
| Adm. propiedades | Propietarios | /admin/people/owners | PARCIAL | Master 19 → 25 Propietario 360 | COMPLETO | Capacidad de menú/ruta no coincide en código |
| Adm. propiedades | Inquilinos | /admin/people/tenants | PARCIAL | Master 19 → 26 Inquilino 360 | COMPLETO |  |
| Adm. propiedades | Solicitudes | — | FALTANTE — PLANIFICADO | Master 07 / 08 / 23 / 67 Solicitud 360 | COMPLETO | Lote 3 (8 oct): embudo de 16 estados, resumen de evaluación, decisión humana, condiciones, acción adversa, conversión de 8 pasos a inquilino/contrato; asistente + múltiples empleadores, hogar, codeudor, divulgaciones, revisión • no existe módulo de solicitudes en código |
| Adm. propiedades | Contratos | /admin/leases | PARCIAL | Master 15 / 40 / 41 | COMPLETO | /leases/add es un marcador |
| Corto plazo | Reservas | /admin/reservations | PARCIAL | Master 17 / 30 / 31 | COMPLETO |  |
| Corto plazo | Huéspedes | /admin/reservations/guests (sin menú) | PARCIAL | Master 32 / 33 | COMPLETO | No está en la barra lateral del código |
| Corto plazo | Calendario | vista dentro de Reservas | PARCIAL | Master 17 ?view=calendar | PARCIAL | Sin ruta dedicada en ninguna capa |
| Operaciones | Centro de operaciones | — | FALTANTE — PLANIFICADO | Master 09 | COMPLETO | Lote 2 (8 oct): módulos de mando enlazan Preparación, Limpieza, Inspecciones, OT 360, Personal, Proveedores, Incidentes, Reservas; filas/tarjetas abren registros • no en código |
| Operaciones | Mantenimiento | /admin/work-orders/add | PARCIAL | Master 13 / 14 → 57 Orden de trabajo 360 | COMPLETO | Lote 2 (8 oct): ciclo de 12 pasos Solicitud → Cierre con límite de aprobación, fotos, mano de obra/materiales, factura → gasto, inspección final • el código sigue terminando en Completado |
| Operaciones | Limpieza | — | FALTANTE — PLANIFICADO | Master 56 Limpieza | COMPLETO | Lote 2 (8 oct): módulo dedicado; Master 22 ?tab=jobs queda como vista de insumos por trabajo (ya no es destino de la barra) • no en código |
| Operaciones | Inspecciones | — | FALTANTE — PLANIFICADO | Master 60 Inspecciones → 10 checklist | COMPLETO | Lote 2 (8 oct): centro con resultados, hallazgos → órdenes de trabajo, fallida → re-limpieza; Master 10 es el checklist hijo • no en código |
| Operaciones | Personal | /admin/people/staff (sin menú) | PARCIAL | Master 58 Personal 360 | COMPLETO | Lote 2 (8 oct): ítem agregado a la barra; asignaciones, horario, hoja de horas → Nómina • el código solo tiene lista de directorio |
| Operaciones | Proveedores | /admin/people/vendors | PARCIAL | Master 59 Proveedor 360 | COMPLETO | Lote 2 (8 oct): ítem agregado a la barra; retención por COI/W-9 bloquea despacho, trabajos, facturas, pagos • el código solo tiene modal crear/editar |
| Finanzas | Contabilidad | /admin/finance (generador de reportes) | PARCIAL | Master 11 + 61–66 | COMPLETO | Lote 3 (8 oct): KPIs del centro (efectivo, CxC, CxP, depósitos retenidos, por pagar a propietarios/proveedores, nómina pendiente, NOI) + GL, Libro de propiedad, CxC, CxP, Pagos a proveedores, Conciliación, Cierre/Presupuestos/Recurrentes/Impuestos • el código solo tiene generador de reportes |
| Finanzas | Libro mayor • Libro de propiedad • CxC • CxP • Pagos a proveedores • Conciliación bancaria • Cierre financiero | — | FALTANTE — PLANIFICADO | Masters 61–66 (7 ítems de barra) | COMPLETO | Lote 3 (8 oct): nuevos ítems bajo Finanzas • no en código |
| Finanzas | Pagos | /admin/payments | PARCIAL | Master 16 | COMPLETO |  |
| Finanzas | Depósitos | — | FALTANTE — PLANIFICADO | Master 48 (banco, garantía de inquilino, reserva / aporte de propietario / otros) | COMPLETO | Lote 3: tercera pestaña separa depósitos de reserva, aportes de propietario y otros • no en código |
| Finanzas | Gastos | /admin/payments?tab=expenses | PARCIAL | Master 64 ?tab=expenses (registro de gastos) | COMPLETO | Lote 5 (8 oct): solapamiento resuelto — un registro autoritativo por costo en MGH_FIN.db.ap (facturas + gastos directos); 5 gastos heredados de Pagos migrados una vez por id (2 marcados: EXP-8841 Excluido por duplicar REC-001, EXP-8836 Retenido vs BILL-2026-0402); Master 16 ?expense=1 redirige; Pagos ya no almacena gastos • el código aún tiene página ExpensesAdd + modal duplicado (F-24) |
| Finanzas | Pagos a propietarios | — | FALTANTE — PLANIFICADO | alias → Master 49 Distribuciones a propietarios | COMPLETO | Fila corregida 8 oct: pagos a propietarios es alias de Master 49 desde el Lote 1 (era un MARCADOR obsoleto) |
| Finanzas | Nómina | — | FALTANTE — PLANIFICADO | Master 50 | COMPLETO | Lote 3: empleados = Personal 360 (ids STF) + contratistas 1099; Por hora/Salario/Por trabajo/Por limpieza/Por propiedad/Contratista; flujo de corrida de 6 pasos • no en código |
| Finanzas | Reportes | /admin/reports | PARCIAL | Master 51 | COMPLETO | Lote 3: 22 reportes (Estado de resultados, Balance general, Flujo de caja, Balanza de comprobación, GL, Antigüedad CxC/CxP, Desempeño de propiedad, Estado/Saldo de propietario, Ocupación, Reservas, Costos de mantenimiento, Mano de obra, Pasivo por depósitos de garantía…); filtros Organización/Propiedad/Propietario/Rango de fechas; 4 corresponden a rutas del código |
| Cumplimiento | HOA | — | FALTANTE — PLANIFICADO | Master 44 | COMPLETO | Reparado 6 oct (Reparación 03): barra Cumplimiento → HOA • no en código |
| Cumplimiento | Documentos | /admin/documents | PARCIAL | Master 12 / 39 | COMPLETO |  |
| Cumplimiento | Activos | — | FALTANTE — PLANIFICADO | Master 45 | COMPLETO | Reparado 6 oct (Reparación 03): registro de activos dedicado; Master 22 queda como insumos/inventario |
| Cumplimiento | Incidentes | — | FALTANTE — PLANIFICADO | Master 46 | COMPLETO | Reparado 6 oct (Reparación 03): marcador reemplazado |
| Comunicación | Mensajes | /admin/messages | PARCIAL | Master 24 (Bandeja en la barra) | COMPLETO | Reparado 6 oct (Reparación 01): Bandeja → Master 24 |
| Comunicación | Notificaciones | — | FALTANTE — PLANIFICADO | Master 47 (barra + campana superior) | COMPLETO | Reparado 6 oct (Reparación 03): marcador reemplazado; la campana abre Master 47 en cada Master |
| Portales | Portal del propietario | /admin/portal-propietario | PARCIAL | Master 05 | PARCIAL |  |
| Portales | Portal del inquilino | /admin/portal-inquilino | PARCIAL | Master 06 (+ duplicado v1) | PARCIAL |  |
| Administración | Organizaciones | /admin/organizations (sin menú) | DESCONECTADO | Master 37 | COMPLETO |  |
| Administración | Usuarios | /admin/users | ALIAS | Master 21 ?section=users | PARCIAL |  |
| Administración | Usuarios y organizaciones | redirige → Configuración | ALIAS | alias → Master 37 | ALIAS |  |
| Administración | Roles | /admin/roles | PARCIAL | alias → Master 21 usuarios | ALIAS |  |
| Administración | Permisos | /admin/permissions | PARCIAL | — | FALTANTE | No está en la barra de los Masters |
| Administración | Verificación de identidad | /admin/identity-verification | PARCIAL | Master 18 ?view=mine | COMPLETO |  |
| Administración | Revisión de verificación de identidad | /admin/identity-verification/review | PARCIAL | Master 18 | COMPLETO |  |
| Administración | Mensajes de contacto | /admin/contact-messages | PARCIAL | Master 54 | COMPLETO | Lote 1 de completitud: bandeja, asignar, responder, convertir, archivar |
| Administración | Auditoría | /admin/audit-users | PARCIAL | Master 38 | COMPLETO |  |
| Administración | Hub / MGH | /admin/hub | PARCIAL | alias → Master 55 Integraciones | COMPLETO | Lote 1 de completitud: las integraciones son solo simulaciones de prototipo |
| Finanzas | Distribuciones a propietarios | — | FALTANTE — PLANIFICADO | Master 49 | COMPLETO | Lote 5 (8 oct): Borrador → Pendiente de aprobación del propietario → Aprobada / Rechazada → Programada → Pagada → Conciliada, + Retenida y Pago fallido (asiento de reversión); ajustes con re-aprobación; registros de aprobación; asiento GL Db 2200 / Cr 1010 + línea bancaria; conciliación en sitio o en Master 65 • simulado, no en código |
| Cumplimiento | Verificación de titularidad | — | FALTANTE — PLANIFICADO | Master 52 | COMPLETO | Lote 1 de completitud • no en código |
| Cumplimiento | Revisión de cumplimiento | — | FALTANTE — PLANIFICADO | Master 53 | COMPLETO | Lote 1 de completitud • no en código |
| Configuración | Configuración | /admin/settings | COMPLETO | Master 21 | COMPLETO |  |

## C. Catálogo de botones / acciones — Código

| Página | Control | Esperado | Real | Clase | Severidad | Evidencia |
|---|---|---|---|---|---|---|
| Inicio de sesión | Olvidé mi contraseña | Abrir flujo de recuperación de cuenta | El botón no tiene handler; no pasa nada | MUERTO | P1 | MghLoginTemplate.tsx:111 |
| Reporte de ocupación | Exportar | Descargar archivo | window.alert(exportStub) | SIMULADO | P2 | OccupancyReportPage.tsx:81 |
| Reporte de mantenimiento | Exportar | Descargar archivo | window.alert(exportStub) | SIMULADO | P2 | MaintenanceReportPage.tsx:65 |
| Reporte de reservas | Exportar | Descargar archivo | window.alert(exportStub) | SIMULADO | P2 | ReservationsReportPage.tsx:69 |
| Reporte de inquilinos | Exportar | Descargar archivo | window.alert(exportStub) | SIMULADO | P2 | TenantsReportPage.tsx:67 |
| Directorio | Ver (fila de proveedor) | Abrir perfil del proveedor | navigate(/admin/work-orders) | ROTO | P2 | People.tsx:203 |
| Pagos | Página editar pago | /admin/payments/:id/edit abre el editor | Sin <Route>; la URL redirige a la ruta por defecto | ROTO | P0 | AdminApp.tsx • adminRoutes.ts:22 |
| Portal del inquilino | Pagar renta | Iniciar pago | El control no existe | FALTANTE | P0 | TenantPortal.tsx |
| Portal del inquilino | Nuevo ticket de mantenimiento | Crear solicitud | El control no existe | FALTANTE | P1 | TenantPortal.tsx |
| Portal del inquilino | Recibo / documento del contrato | Abrir archivo | Las filas son texto plano | FALTANTE | P1 | TenantPortal.tsx |
| Portal del propietario | Filas (propiedad, contrato, cargo, pago, OT) | Abrir registro / estado de cuenta | Texto plano, sin handler | FALTANTE | P1 | OwnerPortal.tsx |
| Portal del propietario | Aprobar cotización / recomendación | Aprobación del propietario | El control no existe | FALTANTE | P1 | OwnerPortal.tsx |
| Mensajes | Abrir hilo / Responder / Redactar | Conversación | Tabla de solo lectura | FALTANTE | P1 | Messages.tsx |
| Detalle de propiedad | Enlaces Propietario / Inquilino / Contrato / Pagos | Abrir registro relacionado | No se renderizan | FALTANTE | P1 | PropertiesView.tsx |
| Editar propiedad | Cancelar / Guardar | Volver al detalle de propiedad | Va a /admin/properties | PARCIAL | P3 | PropertiesEdit.tsx:72 |
| Unidades de propiedad | Volver | Volver al detalle de propiedad | Va a /admin/properties | PARCIAL | P3 | PropertyUnitsPage.tsx:91 |
| Agregar contrato | Página completa | Formulario de creación de contrato | Texto estático de marcador | MUERTO | P2 | LeasesAdd.tsx |
| Contratos | Abrir contrato | Contrato 360 | Solo modal de edición; sin ruta de detalle | FALTANTE | P1 | Leases.tsx |
| Reservas | Check-in / Check-out / Depósito | Operar la estadía | Solo cambio de estado a Confirmada | FALTANTE | P1 | Reservations.tsx:516 |
| Mantenimiento | Fotos, factura, cierre tras inspección | Ciclo completo de OT | Termina en Completado | FALTANTE | P2 | WorkOrdersAdd.tsx:251 |
| Documentos | Vista previa (no PDF/imagen) | Vista previa en línea | alert "solo descarga" | PARCIAL | P3 | Documents.tsx:380 |
| Configuración • Hub • Directorio • Contacto | Manejo de errores | Error en línea | window.alert | PARCIAL | P3 | AccessTab.tsx:187 • People.tsx:145 |
| Barra lateral | Docs de API | Abrir docs del Hub | Respaldo localhost si falta la variable de entorno | ROTO | P2 | MghAdminShell.tsx:57 |
| Páginas de error | Volver al panel | /admin/dashboard | Enlazan a /dashboard; páginas sin ruta | ROTO | P3 | Error404.tsx:20 |
| Incorporación | Página completa | Asistente por etapas | Texto "Próximamente" | MUERTO | P2 | Onboarding.tsx:23 |
| Panel | Ítem de reserva reciente / tarea pendiente | Abrir registro | Abre la lista del módulo | PARCIAL | P3 | Dashboard.tsx:416, 447 |
| Reporte de inquilinos | Ver todo | Lista de inquilinos | /admin/people?type=tenants | PARCIAL | P3 | TenantsReportPage.tsx:265 |
| Propiedades | Ver / Editar / Unidades / + Agregar | Navegar | Rutas correctas | FUNCIONA | — | Properties.tsx:203, 313, 550 |
| Pagos | Recibo PDF | Descargar recibo | blob de fetchPaymentReceiptPdf | FUNCIONA | — | Payments.tsx:307 |
| Pagos | Nuevo pago / Nuevo gasto | Crear registro | Los modales envían a la API | FUNCIONA | — | Payments.tsx:475, 483 |
| Centro de reportes | Exportar | Descargar CSV | downloadFinancialSummaryReport | FUNCIONA | — | ReportsHub.tsx:157 |
| Finanzas (libro) | Generar / Descargar PDF • XLSX | Archivo de reporte | reportsService.download | FUNCIONA | — | Ledger.tsx:241 |
| Mantenimiento | Asignar, Cotizar, Aprobar, Rechazar, Comentar, Completar, Eliminar | Actualizar OT | llamadas a workOrdersService | FUNCIONA | — | WorkOrdersAdd.tsx:224–251 |
| Reservas | Ver, Editar, Confirmar, Eliminar, calendario Anterior/Siguiente/Hoy | Operar la lista | llamadas a reservationsService | FUNCIONA | — | Reservations.tsx:778–840 |
| Huéspedes | Nueva reserva para huésped • Editar inquilino | Flujos precargados | Precarga por parámetros de URL | FUNCIONA | — | ReservationGuests.tsx:178, 191 |
| Documentos | Subir • Categorías | Crear | documentService | FUNCIONA | — | Documents.tsx:288 |
| Directorio | Reenviar invitación | Invitación por correo | membershipsService | FUNCIONA | — | People.tsx:232 |
| Organizaciones | Asistente Nuevo / Editar | Guardar organización | organizationsService | FUNCIONA | — | OrganizationWizard.tsx:238 |

## C2. Problemas de acciones y estructura — Masters (prototipo)

| Master | Área | Esperado | Real | Clase | Severidad |
|---|---|---|---|---|---|
| Todos los Masters (barra lateral) | Los 10 antiguos marcadores (Depósitos, Distribuciones a propietarios, Nómina, Reportes, Verificación de titularidad, Revisión de cumplimiento, Incidentes, Notificaciones, Solicitudes de contacto, Integraciones) | Abrir pantalla diseñada | Resuelto: Masters 46–55 • 0 destinos de la barra del personal van al marcador de Master 01 | COMPLETO | — |
| Master 24 — Mensajes | Página | Alcanzable desde Bandeja en la barra, con migas | Reparado 6 oct (Reparación 01): clase lógica restaurada (faltaba — ningún hueco resolvía); en todos los mapas PAGES; migas Inicio › Comunicaciones › Mensajes; vuelve al registro de origen; hilo → propiedad / reserva / contrato / orden de trabajo | COMPLETO | — |
| Master 04 • 08 • 23 | Barra lateral | Pantallas de detalle/asistente | No están en PAGES por diseño; se llega desde sus listas padre (03, 07, 33) | OK | — |
| Master 21 — Configuración | Enlace de auditoría | Abrir Master 38 Registro de auditoría | Reparado 6 oct (Reparación 01): abre Master 38 con Volver a Configuración + migas | COMPLETO | — |
| Master 25 / 26 — Propietario e Inquilino 360 | Abrir mensajes | Abrir conversación | Reparado 6 oct (Reparación 01): abre Master 24 con Volver al perfil de propietario / inquilino | COMPLETO | — |
| Master 05 — Portal del propietario | Enlace de contratos | Contratos del propietario | Reparado 6 oct (Reparación 01): Master 15 filtrado a Alvarez Family Trust (chip + limpiar), vuelve al Portal del propietario; Contrato 360 regresa a la lista filtrada | COMPLETO | — |
| Master 04 — Detalle de propiedad | Enlace de contabilidad | Abrir Master 11 Contabilidad | Reparado 6 oct (Reparación 01): abre Master 11 con Volver a la propiedad + migas (libro aún no filtrado por propiedad) | PARCIAL | P3 |
| Master 17 — Reservas | Enlace de huéspedes | Abrir Master 32 Huéspedes | Reparado 6 oct (Reparación 01): abre Master 32 con Volver a Reservas | COMPLETO | — |
| Master 06 — Portal del inquilino (v1) | Archivo | Un solo Portal del inquilino | Banner de obsoleto agregado (Reparación 01); 0 enlaces entrantes desde cualquier Master; se puede eliminar | DUPLICADO | P3 |
| Master 10 • Master 20 | Migas | Rastro mkCrumbs | Corrección: ambos ya renderizan migas (mkCrumbs condicional) — el escaneo anterior no las detectó | OK | — |
| Master 06 • 23 • 29 • 34 | Selector ES / EN | <mgh-lang> en la barra superior | Falta el selector | FALTANTE | P2 |
| Todos los Masters | i18n | Claves MGH_I18N.t / tk("grupo.clave", vars) | Lote 5: tk() con interpolación {var}, fmt.money/date/num/plural por locale (es-DO / en-US), traducción de frases compuestas por segmentos, patrones de conteo y validación; las cadenas nuevas del Lote 5 usan claves (49, 64, 16). Los Masters heredados siguen escritos en inglés y se traducen al renderizar (L5-07) | PARCIAL | P2 |
| Master 64 — Cuentas por pagar | Carga | La clase lógica se evalúa | Hallazgo Lote 5: QP usado antes de inicializarse → evaluación de la clase lógica FALLIDA; CxP / Pagos a proveedores / Gastos se mostraban vacíos desde el Lote 3. Corregido (TAB0) y re-probado renderizado | CORREGIDO | — |
| Master 16 — Pagos | Pestaña de gastos | Sin almacén de gastos duplicado | Lote 5: la pestaña, Registrar gasto y ?expense=1 llevan a Master 64 Gastos; el KPI lee CxP; la rama heredada del formulario quedó inalcanzable (limpieza L5-12) | COMPLETO | — |
| Todos los 42 Masters | Persistencia | Backend real | Almacenes en sessionStorage (MGH_*); todo guardado es solo de prototipo | SIMULADO | P3 |
| Master 06 — Portal del inquilino | Pago automático, Aviso de desocupación | Autoservicio del inquilino | No encontrado en el código fuente | FALTANTE | P2 |
| Master 13 — Órdenes de trabajo | Programación, fotos, mano de obra, factura, línea de tiempo | Ciclo completo | No encontrado en el código fuente | FALTANTE | P2 |
| Master 10 — Inspección digital | Comentarios, prioridad, hallazgos, aprobación del propietario, antes/después; tipos Anual, Pre-llegada, Post-estadía, HOA | Modelo de inspección completo | No encontrado en el código fuente | FALTANTE | P2 |
| Master 19 — Personas | Departamento, horario, hoja de horas, supervisor, recibos de nómina | Personal 360 | No encontrado en el código fuente | FALTANTE | P2 |

## D. Problemas de navegación

| Desde | Acción | Destino esperado | Resultado real | Severidad |
|---|---|---|---|---|
| Barra › Tareas | Clic con work_order.read pero sin task.read | Página de tareas | El menú muestra el ítem (work_order.read); la ruta exige task.read → bloqueado | P1 |
| Barra › Propietarios | Clic solo con people.owner.read | Página de propietarios | La ruta exige people.read → bloqueado | P1 |
| Barra › Directorio | Clic solo con people.directory.read | Directorio | La ruta exige people.read → bloqueado | P1 |
| URL directa | /admin/payments/:id/edit | Editar pago | Redirección comodín a la ruta por defecto | P0 |
| Detalle de propiedad | Nombre del propietario | Registro del propietario | No es enlace; no existe ruta de propietario | P1 |
| Contratos | Inquilino / Propiedad en la fila | Registro de inquilino / propiedad | Sin detalle de contrato; relaciones no navegables | P1 |
| Mantenimiento | Proveedor asignado | Perfil del proveedor | Sin ruta de perfil de proveedor | P2 |
| Pagos › Gastos | Propiedad / Orden de trabajo en el gasto | Abrir propiedad / OT | No navegable (requiere confirmación en ejecución) | P2 |
| Pagos | Contrato / Inquilino en el pago | Abrir contrato / inquilino | No navegable (requiere confirmación en ejecución) | P2 |
| Barra › Usuarios y organizaciones | Clic | Página propia | Redirige a Configuración; el menú activo salta a Configuración | P3 |
| Barra lateral | Organizaciones, Huéspedes, Personal, Calendario | Entradas de menú | No están en FLAT_NAV; solo por URL o anidados | P2 |
| Barra › Mantenimiento | Clic | /admin/maintenance | /admin/work-orders/add (lista bajo una ruta "add") | P3 |
| Editar propiedad • Unidades | Volver / Cancelar | Detalle de propiedad | Lista de propiedades | P3 |
| Páginas de error | Volver al panel | /admin/dashboard | /dashboard → 404 público | P3 |
| Barra de Masters › Bandeja | Clic | Master 24 | Marcador de Master 01 | P1 |
| Master 21 Configuración | Auditoría | Master 38 | Marcador de Master 01 | P2 |

## E. Componentes 360° faltantes por módulo

| Módulo | Componente | Código | Masters |
|---|---|---|---|
| Propiedad 360 | Resumen | PARCIAL | Presente |
| Propiedad 360 | Unidades | PARCIAL | Presente |
| Propiedad 360 | Propietario (clicable) | FALTANTE | Presente |
| Propiedad 360 | Inquilinos actuales | FALTANTE | Presente |
| Propiedad 360 | Contratos | FALTANTE | Presente |
| Propiedad 360 | Reservas | FALTANTE | Presente |
| Propiedad 360 | Finanzas | PARCIAL | Presente |
| Propiedad 360 | Pagos | FALTANTE | Presente |
| Propiedad 360 | Depósitos | FALTANTE | Parcial |
| Propiedad 360 | Gastos | FALTANTE | Presente |
| Propiedad 360 | Mantenimiento | PARCIAL | Presente |
| Propiedad 360 | Inspecciones | FALTANTE | Presente |
| Propiedad 360 | Limpieza | FALTANTE | Presente |
| Propiedad 360 | Documentos | FALTANTE | Presente |
| Propiedad 360 | HOA | FALTANTE | Presente |
| Propiedad 360 | Activos | FALTANTE | Presente |
| Propiedad 360 | Servicios públicos | PARCIAL | Presente |
| Propiedad 360 | Personal / proveedores asignados | FALTANTE | Parcial |
| Propiedad 360 | Actividad / auditoría | FALTANTE | Presente |
| Propietario 360 | Panel | PARCIAL | Presente |
| Propietario 360 | Mis propiedades | PARCIAL | Presente |
| Propietario 360 | Pagos recibidos | PARCIAL | Presente |
| Propietario 360 | Depósitos | FALTANTE | Parcial |
| Propietario 360 | Gastos | PARCIAL | Presente |
| Propietario 360 | Mantenimiento | PARCIAL | Presente |
| Propietario 360 | Aprobaciones del propietario | FALTANTE | Parcial |
| Propietario 360 | Recomendaciones | FALTANTE | No encontrado |
| Propietario 360 | Inspecciones | FALTANTE | Presente |
| Propietario 360 | Estados de cuenta | FALTANTE | Parcial |
| Propietario 360 | Pagos a propietarios | FALTANTE | Presente |
| Propietario 360 | Contratos | PARCIAL | DESCONECTADO |
| Propietario 360 | Reportes | FALTANTE | Parcial |
| Propietario 360 | Documentos fiscales | PARCIAL | No encontrado |
| Propietario 360 | Asuntos de HOA | FALTANTE | Presente |
| Propietario 360 | Documentos | FALTANTE | Presente |
| Propietario 360 | Mensajes | FALTANTE | MARCADOR |
| Propietario 360 | Notificaciones | FALTANTE | Parcial |
| Propietario 360 | Banca | PARCIAL | Parcial |
| Propietario 360 | Perfil | COMPLETO | Presente |
| Propietario 360 | Aislamiento de datos propios | Presente | Parcial |
| Inquilino 360 | Panel | PARCIAL | Presente |
| Inquilino 360 | Pagar renta | FALTANTE | Presente |
| Inquilino 360 | Saldo actual | FALTANTE | Presente |
| Inquilino 360 | Cargos / créditos | FALTANTE | Presente |
| Inquilino 360 | Historial de pagos | PARCIAL | Presente |
| Inquilino 360 | Recibos | FALTANTE | Presente |
| Inquilino 360 | Depósito de garantía | FALTANTE | Presente |
| Inquilino 360 | Crear ticket de mantenimiento | FALTANTE | Presente |
| Inquilino 360 | Historial de mantenimiento | PARCIAL | Presente |
| Inquilino 360 | Mi contrato | PARCIAL | Presente |
| Inquilino 360 | Renovar / extender | FALTANTE | Presente |
| Inquilino 360 | Aviso de desocupación | FALTANTE | No encontrado |
| Inquilino 360 | Salida | FALTANTE | Presente |
| Inquilino 360 | Pago automático | FALTANTE | No encontrado |
| Inquilino 360 | Documentos | FALTANTE | Presente |
| Inquilino 360 | Mensajes | FALTANTE | Presente |
| Inquilino 360 | Notificaciones | FALTANTE | Parcial |
| Inquilino 360 | Perfil / hogar | PARCIAL | Parcial |
| Inquilino 360 | Sin exponer datos de propietario/admin | Presente | Parcial |
| Solicitud de arrendamiento | Datos personales, empleo, múltiples empleadores, ingresos | FALTANTE | Presente |
| Solicitud de arrendamiento | Comprobantes de ingresos, carga de documentos | FALTANTE | Parcial |
| Solicitud de arrendamiento | Historial de alquiler | FALTANTE | No encontrado |
| Solicitud de arrendamiento | Historial de pagos, referencias | FALTANTE | Presente |
| Solicitud de arrendamiento | Antecedentes / policía | FALTANTE | Presente |
| Solicitud de arrendamiento | Miembros del hogar | FALTANTE | No encontrado |
| Solicitud de arrendamiento | Ocupantes, mascotas, vehículos | FALTANTE | Presente |
| Solicitud de arrendamiento | Fecha de mudanza y periodo de contrato solicitados | FALTANTE | No encontrado |
| Solicitud de arrendamiento | Consentimiento y firma electrónica | FALTANTE | Presente |
| Solicitud de arrendamiento | Paso de revisión antes de enviar | FALTANTE | No encontrado |
| Solicitud de arrendamiento | Envío y estado del solicitante | FALTANTE | Presente |
| Solicitud de arrendamiento | Revisión del personal: aprobar / condicional / rechazar | FALTANTE | Presente |
| Solicitud de arrendamiento | Convertir en inquilino | FALTANTE | No encontrado |
| Solicitud de arrendamiento | Crear contrato desde la solicitud | FALTANTE | Parcial |
| Reserva / corto plazo | Registro de reserva | PARCIAL | Presente |
| Reserva / corto plazo | Disponibilidad | PARCIAL | Parcial |
| Reserva / corto plazo | Calendario | PARCIAL | Presente |
| Reserva / corto plazo | Huéspedes / huéspedes adicionales | PARCIAL | Presente |
| Reserva / corto plazo | Pagos | FALTANTE | Presente |
| Reserva / corto plazo | Depósito | FALTANTE | Parcial |
| Reserva / corto plazo | Check-in / Check-out | FALTANTE | Presente |
| Reserva / corto plazo | Limpieza + checklist | FALTANTE | Parcial |
| Reserva / corto plazo | Servicios / medidor eléctrico | FALTANTE | Presente |
| Reserva / corto plazo | Daños + fotos | FALTANTE | No encontrado |
| Reserva / corto plazo | Cargos | FALTANTE | Presente |
| Reserva / corto plazo | Gastos | FALTANTE | Parcial |
| Reserva / corto plazo | Deducciones del depósito | FALTANTE | No encontrado |
| Reserva / corto plazo | Preparación de la propiedad | FALTANTE | Presente |
| Reserva / corto plazo | Resumen financiero de la reserva | FALTANTE | Parcial |
| Mantenimiento | Solicitud del inquilino | PARCIAL | Presente |
| Mantenimiento | Solicitud creada por el personal | COMPLETO | Presente |
| Mantenimiento | Revisión y aprobación del propietario | PARCIAL | Presente |
| Mantenimiento | Asignación de proveedor / técnico | COMPLETO | Presente |
| Mantenimiento | Programación | FALTANTE | No encontrado |
| Mantenimiento | Fotos antes / después | FALTANTE | Parcial |
| Mantenimiento | Materiales y mano de obra | FALTANTE | Parcial |
| Mantenimiento | Costo estimado (cotización) | COMPLETO | No encontrado |
| Mantenimiento | Costo final y factura | FALTANTE | Parcial |
| Mantenimiento | Finalización | COMPLETO | Presente |
| Mantenimiento | Inspección tras el trabajo | FALTANTE | Parcial |
| Mantenimiento | Cierre | FALTANTE | Presente |
| Mantenimiento | Línea de tiempo de estados | FALTANTE | No encontrado |
| Inspecciones | Plantillas y checklist | FALTANTE | Presente |
| Inspecciones | Captura de fotos móvil, múltiples fotos | FALTANTE | Presente |
| Inspecciones | Comentarios, condición, prioridad | FALTANTE | Parcial |
| Inspecciones | Hallazgos y recomendaciones | FALTANTE | No encontrado |
| Inspecciones | Costos estimados | FALTANTE | Presente |
| Inspecciones | Aprobación del propietario | FALTANTE | No encontrado |
| Inspecciones | Conversión a orden de trabajo | FALTANTE | Presente |
| Inspecciones | Antes / después | FALTANTE | No encontrado |
| Inspecciones | Reporte final | FALTANTE | Presente |
| Inspecciones | Tipos: entrada, salida, daños, seguridad | FALTANTE | Presente |
| Inspecciones | Tipos: anual, pre-llegada, post-estadía, HOA, limpieza | FALTANTE | No encontrado |
| Personal | Directorio y perfil | PARCIAL | Parcial |
| Personal | Rol | PARCIAL | Presente |
| Personal | Departamento | FALTANTE | No encontrado |
| Personal | Asignación a propiedades | FALTANTE | Parcial |
| Personal | Horario, tareas | FALTANTE | Parcial |
| Personal | Hoja de horas, marcaje entrada/salida, aprobación del supervisor | FALTANTE | No encontrado |
| Personal | Asignaciones de limpieza / mantenimiento / piscina / jardinería | FALTANTE | Parcial |
| Personal | Gastos y reembolsos | FALTANTE | No encontrado |
| Personal | Nómina y recibos de pago | FALTANTE | No encontrado |
| Personal | Documentos y certificaciones | FALTANTE | Parcial |
| Finanzas | Pagos de inquilinos | PARCIAL | Presente |
| Finanzas | Pagos de reservas | PARCIAL | Presente |
| Finanzas | Depósitos de garantía | FALTANTE | Parcial |
| Finanzas | Depósitos de reserva | FALTANTE | Parcial |
| Finanzas | Gastos | PARCIAL | Presente |
| Finanzas | Pagos a propietarios | FALTANTE | MARCADOR |
| Finanzas | Pagos a proveedores | FALTANTE | Parcial |
| Finanzas | Nómina del personal | FALTANTE | MARCADOR |
| Finanzas | Cuentas por cobrar | PARCIAL | Presente |
| Finanzas | Cuentas por pagar | FALTANTE | Presente |
| Finanzas | Libro de propiedad | FALTANTE | Parcial |
| Finanzas | Libro mayor | FALTANTE | Parcial |
| Finanzas | Conciliación bancaria | FALTANTE | Presente |
| Finanzas | Reportes | PARCIAL | MARCADOR |
| Finanzas | Enlaces de vuelta a org/propiedad/unidad/propietario/inquilino/contrato/reserva/OT/empleado/proveedor | FALTANTE | Parcial |

## F. Páginas sin salida

| Página | Visible | Bloqueado | Severidad |
|---|---|---|---|
| Portal del propietario (código) | Propiedades, contratos, cargos, pagos, OT | No puede abrir ningún registro, estado de cuenta ni recibo | P1 |
| Portal del inquilino (código) | Contrato, pagos, tickets | No puede pagar, abrir recibo ni crear ticket | P0 |
| Mensajes (código) | Lista de mensajes | No puede abrir, responder ni redactar | P1 |
| Detalle de propiedad (código) | Datos de la propiedad | No llega a propietario, inquilinos, contratos, pagos, docs | P1 |
| Contratos (código) | Filas de contratos | Sin contrato 360, renovar, terminar, salida | P1 |
| Reportes: Ocupación, Mantenimiento, Reservas, Inquilinos | KPIs y tablas | No puede exportar; filas sin detalle | P2 |
| Mantenimiento (código) | OT completada | No puede facturar, inspeccionar ni cerrar | P2 |
| Revisión de identidad (código) | IDs enviados | No puede abrir el registro de la persona | P2 |
| Auditoría (código) | Eventos de auditoría | No puede abrir el registro auditado | P3 |
| Master 24 Mensajes | Bandeja | No puede salir de la página; sin navegación del shell | P1 |

## G. Responsive — causas raíz

| Alcance | Hallazgo | Causa raíz | Severidad |
|---|---|---|---|
| Todos los 42 Masters | Ancho consultado cada 400 ms + 3 re-renderizados temporizados + listener de resize | Breakpoints calculados en JS (flags "desktop" de renderVals alimentan plantillas de grid en línea) en lugar de media/container queries CSS; el sondeo compensa que los eventos de resize del iframe no se disparan | P2 |
| Todos los 42 Masters | Un segundo intervalo espera los scripts de datos (MGH_*) y lucide | Scripts cargados sin contrato onload/ready; el intervalo se usa como señal de disponibilidad | P3 |
| mkCrumbs de los Masters | Las migas se colapsan vía window.innerWidth < 1200 | Mismo patrón de breakpoint en JS | P3 |
| App de código | Las tablas usan Bootstrap Table responsive (scroll horizontal) | Aceptable en tablet; en 390 px las tablas densas necesitan diseño de tarjetas — requiere prueba en ejecución con backend | P2 |
| App de código | Flujos de cámara / fotos | No se encontraron inputs de foto con capture="environment" en mantenimiento ni inspecciones (inspecciones ausente) | P2 |
| Ambas capas | Prueba en vivo 1440 / 1024 / 390 px | No ejecutada contra un backend en ejecución en este pase | — |

## H. Marcadores, datos simulados y código muerto

| Ubicación | Tipo | Detalle |
|---|---|---|
| /admin/leases/add | MARCADOR | Página estática "Add Lease", inglés fijo en código |
| /admin/onboarding | MARCADOR | "Próximamente: flujo guardado por etapas" |
| 4 páginas de reportes | SIMULADO | exportStub → window.alert |
| PlaceholderPages.tsx | SIN RUTA | Stubs de Properties/Units/Users/Documents, inglés fijo en código |
| Plantilla Omah | SIN RUTA | Todo, Widget, Editable, Shop, CMS, gráficos con sampleData / MOCK_DATA json |
| components/admin/reports/demoData.ts | SIN RUTA | Archivo de datos demo de referencia (sin import encontrado) |
| Error400–503, LockScreen, ForgotPassword | SIN RUTA | Páginas de plantilla que enlazan a /dashboard |
| Barra de los Masters | MARCADOR | 11 destinos → "Esta pantalla se diseñará a continuación" |
| Todos los Masters | SIMULADO | Datos sembrados en sessionStorage (auditoría, pagos, huéspedes, contratos, corto plazo) |

## L. Hallazgos consolidados por prioridad

| ID | Prioridad | Asunto | Módulo |
|---|---|---|---|
| F-01 | P0 | El inquilino no puede pagar la renta desde el Portal del inquilino (sin Pagar renta / saldo / recibo) | Portal del inquilino |
| F-02 | P0 | /admin/payments/:id/edit definido en ADMIN_ROUTES + capacidades pero no registrado → correcciones de pago inalcanzables | Pagos |
| F-03 | P0 | Aislamiento de datos verificado solo estáticamente (scope_* del backend + _resolve_target_user); requiere prueba en ejecución por rol: propietario, inquilino, agente, personal, entre organizaciones | Seguridad |
| F-04 | P1 | Capacidades de menú vs ruta no coinciden: tareas, propietarios, directorio | Navegación / Permisos |
| F-05 | P1 | Botón Olvidé mi contraseña muerto; página ForgotPassword sin ruta | Autenticación |
| F-06 | P1 | Sin rutas de detalle para Contrato, Propietario, Inquilino, Proveedor, Reserva, Orden de trabajo, Pago → relaciones no clicables | Núcleo 360 |
| F-07 | P1 | El detalle de propiedad no muestra relaciones de propietario / inquilino / contrato / finanzas / docs | Propiedad |
| F-08 | P1 | Portal del propietario de solo lectura: sin estados de cuenta, pagos, aprobaciones ni documentos | Portal del propietario |
| F-09 | P1 | Portal del inquilino: sin creación de tickets, documentos del contrato ni recibos | Portal del inquilino |
| F-10 | P1 | Mensajes de solo lectura (código). Lado del prototipo reparado en la Reparación 01 (Master 24 conectado) | Comunicación |
| F-11 | P1 | Reservas: sin check-in/out, depósito, limpieza ni vínculo con pagos | Corto plazo |
| F-12 | P1 | Módulo de solicitudes de alquiler ausente del código | Arrendamiento |
| F-13 | P2 | 4 exportaciones de reportes son stubs con alert | Reportes |
| F-14 | P2 | Agregar contrato e Incorporación son marcadores en rutas activas | Contratos / Propiedades |
| F-15 | P2 | La fila de proveedor del Directorio abre Órdenes de trabajo | Personas |
| F-16 | P2 | Respaldo localhost de Docs de API | Administración |
| F-17 | P2 | Organizaciones, Huéspedes, Personal, Calendario no están en la barra lateral | Navegación |
| F-18 | P2 | Módulos faltantes (código): Centro de operaciones, Limpieza, Inspecciones, Depósitos, Pagos a propietarios, Nómina, GL/CxP/Conciliación, HOA, Activos, Incidentes, Notificaciones — HOA, Activos, Incidentes y Notificaciones ya diseñados (Masters 44–47, Reparación 03); el backend sigue faltando | Plataforma |
| F-19 | P2 | El ciclo de mantenimiento termina en Completado (sin fotos, factura, inspección, cierre, línea de tiempo) — código. Prototipo resuelto en el Lote 2 (Master 57) | Mantenimiento |
| F-20 | P2 | Masters: i18n por coincidencia de texto en inglés, sin claves MGH_I18N.t; falta selector ES/EN en 06/23/29/34 | Prototipo |
| F-21 | P2 | Masters: sondeo de ancho en JS para responsive (40 de 44; 23/29/34 usan solo listener de resize) | Prototipo |
| F-22 | P2 | Masters: quedan 10 marcadores en la barra (no existe Master). Reparado en la Reparación 01: Master 24 en la barra; 04→Contabilidad, 05→Contratos, 17→Huéspedes, 21→Auditoría, 25/26→Mensajes | Prototipo |
| F-23 | P3 | Editar/Unidades vuelven a la lista, no al detalle; los ítems del Panel abren listas | Navegación |
| F-24 | P3 | Duplicados y alias: /users, /users-and-organizations, /finance=/ledger, /payments/add, /work-orders/submit, página ExpensesAdd, shim Settings.jsx, Master 06 (v1) | Higiene |
| F-25 | P3 | Código de plantilla muerto y páginas de error que enlazan a /dashboard | Higiene |
| F-26 | P3 | window.alert usado para errores (Configuración, Hub, Directorio, Contacto) | UX |

## R1. Reparación 01 — conectividad de Masters (aplicada 6 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Masters modificados | 01, 04, 05, 11, 15, 17, 21, 24, 25, 26, 31, 32, 38, 41, 06 (v1) • messages agregado a PAGES en 41 Masters • i18n.js (+17 entradas ES/EN) |
| B | Enlaces corregidos | Bandeja de la barra → 24 • 21 Auditoría → 38 • 05 Contratos → 15 ?owner=alvarez • 04 Libro → 11 • 17 Huéspedes → 32 • 25/26 Abrir mensajes → 24 • 31 Mensaje al huésped → 24 ?ref=reservation • fila de 15 → 41 conserva el contexto del propietario |
| C | Marcadores reemplazados | messages (barra) • audit (21) • leases (05) • accounting (04) • guests (17) • messages (25, 26) |
| D | Marcadores legítimos | deposits, owner-distributions, payroll, reports, ownership-verification, compliance-review, incidents, notifications, contact-messages, integrations — no existía Master; Master 01 mostraba FALTANTE — AÚN NO DISEÑADO |
| E | Callejones sin salida restantes | Master 11 abierto desde una propiedad aún no se filtra por esa propiedad • los enlaces de OT de Master 24 abren la lista de Master 14 • 23/29/34 son para huéspedes (sin barra del personal por diseño) |
| F | Duplicados / obsoletos | Master 06 - Tenant Portal (v1): banner agregado, 0 enlaces entrantes (solo lo listan los reportes + report-manifest.js) → se puede eliminar con aprobación |
| G | Flujos A–F | A Panel→Propiedades→Detalle→Volver ✓ (04 goList) • B Solicitudes→Detalle→Volver ✓ (08 goList) • C Reserva 360→Mensajes (hilo preseleccionado)→Volver ✓ • D Configuración→Auditoría→Volver ✓ • E Portal del propietario→Contratos (filtrados)→Volver ✓ • F Bandeja de la barra→Master 24 ✓ — C–F renderizados y verificados en vista previa |
| H | Plan de migración del sondeo | Sin helper compartido: el mismo bloque está incrustado en cada componentDidMount (3 re-renderizados temporizados + setInterval 400 ms sobre innerWidth + listener de resize). Plan: 1) agregar layout-bp.js — un listener matchMedia por breakpoint (768 / 1200) + respaldo de resize, publica bp a suscriptores; 2) piloto en 3 Masters (02, 15, 24) reemplazando el bloque idéntico por subscribe/unsubscribe; 3) reemplazo en lote de los 37 restantes por coincidencia exacta de texto, abortar ante cualquier archivo que no coincida; 4) luego, mover plantillas de grid a container queries CSS donde solo cambian columnas. Sin nuevo sondeo en la Reparación 01 (Master 24 usa solo resize). |

## R3. Reparación 03 — Cumplimiento + Notificaciones (aplicada 6 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Masters creados | 44 HOA y cumplimiento (/admin/compliance/hoa) • 45 Activos y equipos (/admin/compliance/assets) • 46 Incidentes (/admin/compliance/incidents) • 47 Centro de notificaciones (/admin/notifications) — todos sobre el App Layout aprobado, ES por defecto + EN, report-manifest.js actualizado |
| B | Barra lateral | Cumplimiento: + HOA, + Activos (antes de Incidentes) • Incidentes y Notificaciones ahora abren Masters reales • mapa PAGES actualizado en 43 Masters (06 v1 obsoleto, no actualizado) • campana superior → Master 47 en cada Master del personal • el catálogo de Master 01 lista HOA + Activos |
| C | HOA (44) | Directorio • Reglas y documentos (10 categorías de reglas, versión, vigencia, vencimiento, acuse por inquilino) • Infracciones con cadena Propiedad → Propietario → Inquilino → Infracción → Acción correctiva • Agregar HOA, Agregar regla, Registrar infracción, Agregar multa, Notificar a propietario/inquilino (idioma preferido del destinatario), Subir documento, Marcar resuelta |
| D | Activos (45) | 15 activos de muestra, 12 categorías • cadena Activo → Propiedad → Proveedor → Orden de trabajo → Gasto • Agregar, Editar, Asignar, Programar mantenimiento, Crear orden de trabajo (enlaza a Master 13 — sin módulo duplicado), Subir garantía, Agregar foto (cámara), Dar de baja |
| E | Incidentes (46) | 12 tipos, 7 estados • cadena Incidente → Propiedad → Reserva / Inquilino → Orden de trabajo → Gasto → Documentos • Reportar incidente con captura de cámara en móvil • Subir evidencia, Asignar personal, Crear orden de trabajo, Notificar a propietario/inquilino, Abrir reclamo de seguro, Agregar seguimiento, Resolver, Cerrar |
| F | Notificaciones (47) | 14 categorías, 4 prioridades • Bandeja / No leídas / Asignadas a mí / Pospuestas / Descartadas • Abrir registro va al registro de origen (Orden de trabajo, Aprobación del propietario, Infracción HOA, Documento…) con Volver a Notificaciones • Marcar leída/no leída, Posponer, Descartar, Ver todo lo relacionado |
| G | Conexiones 360 | Propiedad 360 (04 Resumen): infracciones HOA abiertas, activos activos, incidentes abiertos • Propietario 360 (25): asuntos HOA, incidentes, documentos relacionados • Inquilino 360 (26): avisos HOA, incidentes del inquilino, acuses — sin costos ni notas internas • Centro de operaciones (09): incidentes abiertos, problemas de preparación, HOA con acción requerida, fallas de activos |
| H | Sin callejones sin salida | Cada enlace saliente lleva back + backLabel; un chip global de retorno (compliance-data.js) aparece en destinos sin soporte nativo de volver • Propiedad → HOA → Infracción → Propiedad ✓ • Propiedad → Activo → Orden de trabajo → Propiedad ✓ • Incidente → Orden de trabajo → Incidente ✓ • Notificación → Registro → Notificaciones ✓ — renderizado en vista previa; Master 13 abre a nivel de lista (aún sin Master de detalle de OT) |
| I | Marcadores restantes | 8 tras la Reparación 03 → 0 tras el Lote 1 de completitud (ver R4) |
| J | Responsive | ≥1200 tablas + paneles de KPI • 768–1199 barra colapsada, formularios a dos columnas • <768 las tablas pasan a tarjetas, formularios a una columna, panel a ancho completo |
| K | i18n | +291 entradas ES/EN (grupo compliance) en i18n.js |

## R4. Fase de completitud — Lote 1: marcadores restantes de la barra (aplicado 6 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Masters creados | 48 Depósitos (depósitos bancarios + depósitos de garantía, FL § 83.49) • 49 Distribuciones a propietarios • 50 Nómina • 51 Reportes • 52 Verificación de titularidad • 53 Revisión de cumplimiento • 54 Solicitudes de contacto • 55 Integraciones |
| B | Navegación | Los 8 agregados a PAGES en cada Master del personal; estados activos de la barra, migas (Inicio › Sección › Módulo › registro) y enlaces Volver; los paneles de registro enlazan a Propiedad, Propietario, Inquilino, Contrato, Pagos, Gastos, Documentos, Empleado según aplique |
| C | Conceptos financieros separados | Depósitos bancarios ≠ depósitos de garantía (cuenta fiduciaria) ≠ pagos de renta (16) ≠ gastos (16 ?expense) ≠ distribuciones a propietarios (49) ≠ nómina (50) |
| D | Marcadores | 0 destinos de la barra del personal van al marcador de Master 01 (antes 10) |
| E | Solo prototipo | Las pruebas/sincronizaciones de Integraciones (55) son simuladas y así se rotulan • la generación de reportes y exportaciones PDF/XLSX son simuladas • no es funcionalidad de producción |
| F | Próximos lotes | Lote 2 Operaciones: vista de mando del Centro de operaciones, Limpieza, Inspecciones, ciclo de Mantenimiento 360, Personal, Proveedor 360 • Lote 3 profundidad financiera: GL, Libro de propiedad, CxC, CxP, Pagos a proveedores, Conciliación bancaria dentro de Contabilidad (11) • Lote 4 Solicitudes 360 (07/08/23) • Lote 5 auditoría final del prototipo |
| G | i18n | +209 entradas ES/EN (grupo completion) |

## R6. Fase de completitud — Lote 3: Finanzas y Solicitudes 360 (aplicado 8 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Masters creados | 61 Libro mayor • 62 Libro de propiedad • 63 Cuentas por cobrar • 64 Cuentas por pagar (Facturas / Pagos a proveedores / Nómina por pagar) • 65 Conciliación bancaria • 66 Cierre financiero (Periodos / Presupuestos / Recurrentes / Impuestos) • 67 Solicitud 360. Almacén compartido finance-data.js (MGH_FIN, localStorage mghpm.fin360.v1) |
| B | Masters ampliados | 11 Contabilidad: fila de Posición financiera (8 KPIs en vivo) + enlaces a módulos • 48 Depósitos: pestaña Reserva / Aporte de propietario / Otros • 50 Nómina: empleados alineados con Personal, 6 tipos de pago, Horas aprobadas → Cálculo → Revisión → Aprobación → Lote de pago → Pagada • 51 Reportes: 22 reportes, filtros Org/Propiedad/Propietario/Fecha • 04 Propiedad 360: Abrir libro → 62 • 08 Detalle de solicitud: Abrir Solicitud 360 • 23 Asistente: segundo empleador, otros ingresos, adultos/menores, codeudor, divulgaciones, revisión antes de enviar • 58 Personal → Nómina por id • 59 Proveedor → Pagos a proveedores |
| C | Barra lateral | Finanzas: + Libro mayor, Libro de propiedad, Cuentas por cobrar, Cuentas por pagar, Pagos a proveedores, Conciliación bancaria, Cierre financiero • Evaluación y revisión → 67 (antes 07 ?view=screening) • aplicado a cada Master del personal |
| D | Cadenas 360 | Propiedad → Libro de propiedad • Propietario → Estado de cuenta → Pago a propietario (49) • Inquilino → Cargos (63) → Pagos (16) → Recibo • Reserva → Cargos (63) → Pagos → Depósito (48 otros) • Orden de trabajo → Gasto → Factura de proveedor (64) → Pago a proveedor (la marca de pagado se sincroniza con OT 360) • Personal → Hoja de horas → Nómina (50) → Nómina por pagar (64) |
| E | Reglas aplicadas (prototipo) | Los asientos deben cuadrar; contabilizar en un periodo cerrado está bloqueado; la reversión crea un asiento compensatorio • proveedor retenido por COI/W-9 no puede cobrar • conciliar bloqueado mientras queden líneas sin emparejar/excepciones • las decisiones de solicitud son solo humanas con revisor, fecha/hora, base de política y registros; aviso de acción adversa rastreado hasta la entrega |
| F | Enlaces reparados | Cadena de nómina Personal → Nómina (era búsqueda por nombre en otra lista de empleados) • fila de auditoría Pagos a propietarios (MARCADOR obsoleto) • enlaces de origen en Reportes → 57/59/61–65 • Propiedad 360 Abrir libro (antes Contabilidad genérica) |
| G | PARCIALES restantes (Masters) | Gastos (pestaña de 16, se solapa con facturas de CxP) • Distribuciones a propietarios sin paso explícito de Programar ni línea de Ajustes • Traducción de frases dinámicas en Masters nuevos — resuelto en el Lote 5 (R7); la traducción de frases heredadas queda como P2 (L5-07) |
| H | Marcadores / callejones sin salida | 0 marcadores en la barra • no se hallaron nuevos callejones sin salida en las cadenas del Lote 3; re-escaneo completo diferido al Lote 5 |
| I | No en código | Ninguno de 61–67 existe en MGHPM-Corecciones; todos los asientos, pagos, declaraciones de impuestos y avisos son simulaciones de prototipo y no cuentan como funcionalidad de producción |

## R5. Fase de completitud — Lote 2: Operaciones y Mantenimiento 360 (aplicado 8 oct 2026)

| # | Ítem | Resultado |
|---|---|---|
| A | Masters creados | 56 Limpieza • 57 Orden de trabajo 360 • 58 Personal 360 • 59 Proveedor 360 • 60 Inspecciones (centro). Almacén compartido ops-data.js (MGH_OPS360, localStorage mghpm.ops360.v1) |
| B | Masters ampliados | 09 Centro de operaciones: fila de Módulos de mando (8 mosaicos, conteos en vivo), insignia de limpieza → Limpieza 360, texto de mantenimiento → OT 360, tarjetas de asignación → registro • 14 Solicitudes de mantenimiento: Abrir Orden de trabajo 360 |
| C | Barra lateral | Operaciones: + Personal, + Proveedores • Limpieza → 56 (antes 22 ?tab=jobs) • Inspecciones → 60 (10 es hijo vía inspection-checklist) • alias de personal/proveedores al Directorio eliminados • work-order-360 → estado activo de Mantenimiento • aplicado a cada Master del personal |
| D | Cadena de salida | Centro de operaciones → Propiedad → Reserva → Limpieza → Inspección → Orden de trabajo → Personal/Proveedor → Gasto/Factura → Cierre — cada salto es un enlace con back + backLabel; inspección fallida devuelve la limpieza a Requiere re-limpieza; inspección final fallida devuelve la OT a Trabajo |
| E | Reglas aplicadas (prototipo) | Cotización > US$500 requiere aprobación del propietario • proveedor retenido por COI/W-9 no puede ser asignado • la limpieza no puede completarse con ítems abiertos del checklist • la OT no pasa Fotos sin foto Después ni Mano de obra/Materiales sin una línea |
| F | No en código | Ninguno de 56–60 existe en MGHPM-Corecciones; todas las acciones son simulaciones de prototipo y no cuentan como funcionalidad de producción |
| G | i18n | +175 entradas ES/EN (grupo ops360) |
| H | PARCIALES restantes (Masters) | Internos de contabilidad (GL, Libro de propiedad, CxC, CxP, Pagos a proveedores, Conciliación) y Solicitudes 360 — Lote 3 |

## M. Orden de reparación recomendado (Reparación 01 aplicada; pasos restantes en espera de aprobación)

| Paso | Alcance | Incluye | Compuerta de salida |
|---|---|---|---|
| 1 | Red de seguridad | F-03 pruebas de matriz de roles (propietario, inquilino, agente, personal, entre organizaciones) en portales + endpoints de listas | Pruebas aprobadas antes de cualquier cambio de UI |
| 2 | Desbloquear rutas y acceso | F-02 registrar payments/:id/edit • F-04 alinear NAV_ITEM_CAPABILITY con ADMIN_ROUTE_CAPABILITY • F-05 flujo de recuperación | Cada ítem de la barra abre para cada rol que lo ve |
| 3 | Eliminar superficies falsas | F-13 exportaciones reales • F-14 /leases/add → Contratos ?new=1, ocultar Incorporación • F-15 fila de proveedor • F-16 guard de entorno • F-25 eliminar código muerto | Cero SIMULADO/MUERTO en el catálogo de acciones |
| 4 | Rutas 360 de registros | F-06 rutas de detalle: Contrato, Propietario, Inquilino, Proveedor, Reserva, Orden de trabajo, Pago • F-07 relaciones de Propiedad clicables | Propiedad → Propietario → Inquilino → Contrato → Pagos navegable en ambos sentidos |
| 5 | Portales | F-01 Pagar renta + saldo + recibos • F-09 tickets y docs • F-08 estados de cuenta, pagos, aprobaciones | Propietario e inquilino completan sus flujos sin personal |
| 6 | Operaciones y comunicación | F-11 check-in/out, depósito, limpieza • F-19 ciclo de OT • F-10 hilos de Mensajes | Los flujos terminan en estado cerrado |
| 7 | Módulos faltantes | F-12 Solicitudes → Inspecciones → Depósitos → Pagos a propietarios → GL/CxP/Conciliación → Limpieza → Centro de operaciones → Personal/Nómina → HOA/Activos/Incidentes/Notificaciones | Cada uno se entrega con entrada de menú, migas, enlace de volver y capacidad |
| 8 | Higiene del prototipo (Masters) | F-22 conexión HECHA en la Reparación 01 (Master 24 + enlaces 04/05/17/21/25/26) • F-20 i18n por claves + selector • F-21 breakpoints CSS • eliminar Master 06 (v1) | Cada Master construido está en la barra o enlazado desde su padre; sin sondeo |
| 9 | Pulido | F-17, F-23, F-24, F-26 | P3 resueltos |