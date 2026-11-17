# Plan de implementación — MGHPM Property Management

## 1. Objetivo

Convertir los 67 Masters del handoff en una aplicación web funcional de administración de propiedades, construida con **Next.js + TypeScript**, **Firebase Authentication** para identidad y **Cloud Firestore** como base de datos desde el primer incremento. El producto incluirá áreas para personal, propietarios, inquilinos y huéspedes, con autorización por organización y por registro.

Este documento define arquitectura, entregas, dependencias, alcance, pruebas y condiciones de lanzamiento. No declara que los prototipos o sus acciones simuladas sean funcionalidad de producción.

## 2. Punto de partida y decisiones

- El paquete actual es un handoff de diseño: `prototypes/` contiene referencias HTML y datos simulados; `SCREENS.md` asigna una ruta, estado y fase a cada Master.
- El README describe como referencia un producto React/Vite con API propia, pero **el repositorio presente no contiene esa aplicación ni el backend**. No asumir que sus rutas, API, modelos o permisos están implementados o disponibles.
- Se hará una aplicación Next.js nueva, usando los Masters como especificación visual/funcional. Se reutilizarán conceptos y recursos del handoff, no código de prototipo como lógica de producción.
- Firebase Auth resuelve autenticación, no autorización del negocio. Toda operación sensible debe verificar identidad, membresía, rol, alcance organizacional y relación con el recurso.
- Firestore será la fuente operativa inicial. Para contabilidad y dinero se diseñarán asientos append-only y operaciones transaccionales/idempotentes; Firestore no sustituye un sistema contable legal ni un procesador de pagos.
- Los datos demostrativos de los prototipos no se migrarán como si fueran datos reales.

## 3. Alcance funcional: los 67 Masters

Las vistas se agrupan en módulos por dependencia funcional, pero **cada Master es una entrega y revisión independiente**. Se implementa una vista, se demuestra su flujo con datos persistidos, se revisa el resultado y se corrige antes de darla por aceptada; la siguiente vista puede comenzar cuando sus dependencias estén listas, sin esperar a completar todo el módulo.

| Módulo | Masters | Enfoque |
|---|---|---|
| A. Plataforma y organización | 01, 21, 37, 38 | Shell, configuración, organizaciones y auditoría. La autenticación existente es fundamento, no sustituye membresías, permisos ni auditoría. |
| B. Cartera de propiedades | 02, 03, 04, 20 | Dashboard, listado, formulario y detalle de propiedades/unidades. |
| C. Directorio y perfiles | 19, 25, 26, 58, 59 | Personas, propietarios, inquilinos, personal y proveedores. |
| D. Solicitudes y arrendamientos | 07, 08, 23, 40, 41, 67, 15, 05, 06 | Solicitud, revisión, contrato y portales con acceso por relación. |
| E. Documentos y finanzas | 12, 11, 61, 16, 48, 49, 62, 63, 64, 65, 66, 50, 51 | Documentos, pagos manuales, ledger, cuentas, depósitos, distribución, conciliación, cierre y reportes. |
| F. Operaciones y mantenimiento | 09, 14, 13, 57, 60, 10, 56, 22, 36 | Solicitudes de mantenimiento, órdenes, inspecciones, limpieza, inventario y readiness. |
| G. Estancias y huéspedes | 29, 30, 17, 31, 32, 33, 34, 35 | Búsqueda, reserva, perfiles de huésped y autoservicio. |
| H. Cumplimiento y seguros | 52, 18, 53, 27, 42, 43, 44, 45, 46 | Verificación, revisión, pólizas, HOA, activos e incidentes. |
| I. Comunicación e integraciones | 24, 39, 47, 28, 54, 55 | Mensajes, plantillas, notificaciones, centro de acciones, solicitudes de contacto e integraciones. |

**Cobertura:** los nueve módulos contienen los 67 Masters, una sola vez. Las dependencias externas (pagos online, firma, screening, correo/SMS y canales de reserva) bloquean únicamente la acción o vista que las requiera; no se simulan integraciones ni se detiene el trabajo independiente.

**Estado real de esta aplicación:** el inventario de `SCREENS.md` describe estados del frontend de referencia anterior; sus etiquetas `PARCIAL/FALTANTE` no acreditan implementación en este proyecto Next.js. Aquí existen login, onboarding, selección de organización y un dashboard inicial; el shell y el dashboard son parciales, y el alta/selección inicial de organización no equivale a la vista administrativa completa del Master 37. En consecuencia, todas las vistas del inventario deben pasar por aceptación funcional en esta aplicación.

## 4. Arquitectura objetivo

### Aplicación y ejecución

- Next.js con App Router y TypeScript estricto. Componentes de servidor para lecturas autorizadas; componentes de cliente solo para interacciones que lo necesiten.
- Route Handlers/Server Actions como frontera de escritura. Cada acción valida entrada con un esquema (por ejemplo Zod), verifica sesión y autorización y devuelve errores explícitos.
- Firebase Admin SDK solo en servidor. Nunca incluir credenciales Admin, claves privadas o configuración privilegiada en el bundle del navegador.
- Firebase Authentication para email/contraseña y recuperación; agregar proveedores OAuth/MFA según decisión de producto. Invitaciones de personal y usuarios externos deben ser controladas por la organización.
- Firestore como base de datos principal. Archivos privados (fotos, documentos, adjuntos) en disco local del servidor (`LOCAL_STORAGE_DIR`, módulo `src/lib/storage/local-files.ts`) sobre un volumen persistente con respaldo programado — decisión del 12 nov 2026 (ver §6.1). Guardar metadatos/relaciones en Firestore, no blobs.
- Cloud Functions (o un servicio server-side equivalente) para trabajos programados, procesamiento asíncrono, envío de notificaciones, webhooks y tareas que deban continuar fuera de una petición web.
- Firebase App Hosting es una opción de despliegue coherente con Next.js/Firebase; decidir en fase 0 frente a Vercel u otro host. La elección define gestión de secretos, dominios, regiones, costos y webhooks.
- Firebase Emulator Suite para Auth, Firestore, Storage y Functions en desarrollo/pruebas. Proyectos separados para local, staging y producción.

### Capas de código sugeridas

```text
src/
  app/                 rutas y layouts (admin, owner, tenant, guest, auth)
  features/            módulos de negocio y sus componentes
  components/          componentes compartidos del sistema visual
  lib/firebase/        inicialización cliente/servidor y Admin
  lib/auth/            sesión, membresías y autorización
  lib/validation/      esquemas de entrada compartidos
  server/              casos de uso, repositorios y servicios server-only
  i18n/                es-DO (base) y en-US
  types/               contratos y estados de dominio
```

Separar UI, casos de uso y acceso a Firestore. No permitir que componentes escriban documentos directamente sin pasar por una operación que valide identidad, autorización, invariantes y auditoría.

### Autenticación y autorización

1. Firebase Auth autentica a la persona.
2. El servidor intercambia/verifica el ID token y mantiene sesión segura con cookie `HttpOnly`, `Secure`, `SameSite`; la renovación y el cierre invalidan la sesión según el flujo definido.
3. La aplicación carga la membresía activa y el rol del usuario para la organización seleccionada. No confiar en un `organizationId`, rol o `uid` enviado por el cliente sin verificarlo.
4. Cada lectura/escritura valida capacidad y alcance del documento (organización, propiedad, unidad, persona/relación). No depender de ocultar botones o proteger solo la navegación.
5. Firestore Security Rules aplican acceso mínimo para clientes SDK; las escrituras sensibles se fuerzan a servicios de servidor con Firebase Admin, porque Admin SDK omite Security Rules.
6. Las reglas y servicios se prueban contra intentos de acceso entre organizaciones y entre roles. Si no puede demostrarse autorización, denegar por defecto.

Roles iniciales a confirmar en fase 0: platform admin, organization owner/admin, property manager, operations/maintenance staff, owner, tenant, vendor y guest. Definir matriz explícita de capacidades por módulo y alcance; el rol no debe equivaler automáticamente a acceso a todos los registros de la organización.

## 5. Modelo inicial de Firestore

La estructura final se validará con consultas reales y pruebas de reglas. Propuesta de raíz multi-organización:

```text
users/{uid}
organizations/{orgId}
organizations/{orgId}/memberships/{uid}
organizations/{orgId}/properties/{propertyId}
organizations/{orgId}/properties/{propertyId}/units/{unitId}
organizations/{orgId}/owners/{ownerId}
organizations/{orgId}/tenants/{tenantId}
organizations/{orgId}/vendors/{vendorId}
organizations/{orgId}/staff/{staffId}
organizations/{orgId}/leases/{leaseId}
organizations/{orgId}/applications/{applicationId}
organizations/{orgId}/reservations/{reservationId}
organizations/{orgId}/workOrders/{workOrderId}
organizations/{orgId}/inspections/{inspectionId}
organizations/{orgId}/documents/{documentId}
organizations/{orgId}/insurancePolicies/{policyId}
organizations/{orgId}/incidents/{incidentId}
organizations/{orgId}/messages/{threadId}
organizations/{orgId}/notifications/{notificationId}
organizations/{orgId}/ledgerAccounts/{accountId}
organizations/{orgId}/journalEntries/{entryId}
organizations/{orgId}/payments/{paymentId}
organizations/{orgId}/charges/{chargeId}
organizations/{orgId}/auditEvents/{eventId}
```

Principios del modelo:

- Incluir `organizationId`, `createdAt`, `updatedAt`, `createdBy`, estado y referencias necesarias; validar que toda relación apunte a un registro de la misma organización.
- Mantener perfiles globales mínimos de identidad separados de los perfiles/roles/PII del negocio. Guardar solo la información necesaria y controlar lectura de PII de solicitantes, inquilinos, dueños y huéspedes.
- Evitar arrays crecientes y documentos monolíticos. Historiales, asientos, mensajes y eventos deben ser documentos separados; usar paginación por cursor.
- Crear proyecciones/resúmenes para dashboard con actualizaciones controladas; no construir KPIs mediante lecturas sin límite ni asumir que consultas de Firestore equivalen a joins.
- Diseñar índices compuestos según filtros/ordenamiento reales y versionar la configuración de índices junto al código.
- Usar referencias + copias de lectura mínimas cuando una consulta compuesta lo justifique. Definir cómo se corrigen las copias y cómo se conserva la trazabilidad.
- Fechas en timestamps UTC y zona horaria por organización/propiedad para presentación y operaciones; dinero en unidades menores enteras más código ISO de moneda. No mezclar monedas ni usar `float`.
- Borrado lógico para entidades operativas; documentos financieros y de auditoría con retención/inmutabilidad acorde a política legal y contable.

#### Contrato de lectura del Master 03 — Properties

La lista lee exclusivamente `organizations/{orgId}/properties/{propertyId}` y requiere que cada documento tenga `name`, `code`, `type`, `address`, `city`, `state`, `status`, `occupancyStatus`, `archived`, `unitCount`, `occupiedUnitCount`, `searchName`, `filterKeys` y `searchKeys`. Los estados y tipos válidos son los definidos por el Master 03; `searchName` es el nombre normalizado para ordenar; `filterKeys` contiene las combinaciones de facetas para status, ocupación, tipo y archivado; y `searchKeys` contiene prefijos normalizados de nombre, código, tipo, dirección, ciudad y estado combinados con las facetas activas. Ambos índices compuestos de Firestore están versionados en `firestore.indexes.json`.

El alta y cualquier cambio en los campos buscables, filtros o unidades deben regenerar `searchName`, `filterKeys` y `searchKeys` mediante `createPropertySearchIndex` en `src/lib/properties/search-index.ts`; `unitCount` y `occupiedUnitCount` son una proyección que deberá mantenerse de forma consistente con las unidades. Los documentos existentes deben migrarse/completarse antes de considerarlos visibles en la lista. Por ahora, la lectura permite únicamente `org_owner` y `admin`, porque aún no existe un modelo de alcance por propiedad para `manager` u `operations`; habilitar esos roles requiere definir y verificar sus asignaciones. Los portales `owner`, `tenant`, `vendor` y `guest` necesitarán consultas con alcance por relación, no acceso a esta lista administrativa.

#### Contrato de unidades del Master 04 — Property Detail

Las unidades viven en `organizations/{orgId}/properties/{propertyId}/units/{unitId}` con `label`, `labelKey` (normalizado), `floor`, `bedrooms`, `bathrooms` (incrementos de 0.5), `status` (`available`, `occupied`, `maintenance`), `marketRentMinor` (entero en unidades menores o `null`), `marketRentCurrency` (`USD`/`DOP` o `null`), `archived`, `organizationId`, `propertyId` y metadatos de creación/actualización. La identificación es única entre unidades activas de la misma propiedad; una unidad ocupada no puede archivarse y el máximo por propiedad es 500.

Toda alta, edición, archivo o restauración pasa por `src/lib/properties/units.ts`, que en una sola transacción relee la propiedad y sus unidades, valida unicidad, escribe la unidad, recalcula `unitCount`, `occupiedUnitCount` y `occupancyStatus` (disponible si hay alguna unidad disponible o ninguna unidad; mantenimiento si no hay disponibles y alguna está en mantenimiento; ocupada si todas las activas están ocupadas), regenera `filterKeys`/`searchKeys` y registra el evento de auditoría (`unit.created`, `unit.updated`, `unit.archived`, `unit.restored`). Desde Leases, un contrato activo es la fuente de `occupied` (`activeLeaseId` en la unidad); sin contrato, el estado sigue siendo manual. La renta es informativa y no genera cargos.

#### Contrato del Master 19 — People

Decisiones acordadas el 30 oct 2026: este incremento cubre **propietarios e inquilinos**; proveedores y personal llegan con los Masters 59 y 58. Ambos tipos viven en una sola colección `organizations/{orgId}/people/{personId}` (en lugar de `owners/` y `tenants/` separados) para permitir el directorio unificado con conteo, búsqueda y paginación por cursor en una sola consulta. Campos: `type` (`owner`, `tenant`), `name`, `email`, `emailKey` (normalizado), `phone`, `contactName` (solo propietario), `propertyId`/`unitId` (solo inquilino, opcionales), `status` (`active`, `pending`, `inactive`, con etiquetas por tipo: En incorporación / Mudanza pendiente, Inactivo / Mudado), `archived`, `searchName`, `filterKeys` (tipo × estado × archivado) y `searchKeys` (prefijos de nombre, contacto, partes del correo y dígitos del teléfono).

- **Duplicados:** el correo es obligatorio y único por tipo entre registros no archivados, mediante la reserva transaccional `organizations/{orgId}/personEmails/{sha256(tipo:correo)}`. Archivar libera la reserva; restaurar la reclama y falla con 409 si otro registro activo la tomó.
- **Inquilinos:** ficha de contacto con vínculo opcional a propiedad/unidad de la misma organización, no archivadas (validado en la transacción). El vínculo no cambia la ocupación de la unidad ni crea contrato; fechas, renta y depósito esperan a Leases (Masters 40/15). Los nombres de propiedad/unidad se resuelven al leer, sin copias.
- **Eliminación:** solo archivar/restaurar, con auditoría (`person.created`, `person.updated`, `person.archived`, `person.restored`). Un registro archivado no se edita hasta restaurarlo. El tipo no cambia después del alta.
- **Acceso:** lectura y escritura solo para `org_owner` y `admin`, igual que propiedades; los datos de contacto son PII y no se exponen a otros roles.
- **Pendiente de otros Masters:** perfiles 360 (25/26), relación propietario–propiedad, saldos/ingresos, exportación CSV y pestañas Propietario/Inquilinos del detalle de propiedad. El selector de propiedades del formulario carga hasta 500 propiedades activas por nombre; sustituirlo por búsqueda cuando una organización lo supere.

#### Regla de datos limpios (desde el 30 oct 2026)

El proyecto real `property-management-a8d5f` no contiene ni recibirá datos sembrados, de demostración ni inflados, y la interfaz no muestra cifras o registros ficticios (se retiraron de la landing las propiedades con precio, estadísticas y movimientos de ejemplo). La única cuenta es la del titular, `joshuamoises1995@gmail.com` (`org_owner` de su organización y UID de bootstrap). Todo se crea a mano desde la interfaz para verificar cada flujo desde su creación; por eso cada vista debe poder poblarse desde la app antes de construir las que dependen de ella. Los datos de prueba automatizada existen solo en el emulador local `demo-mghpm` y se borran en cada corrida.

#### Contrato de Usuarios y accesos (Masters 37/58, parcial)

Decisiones acordadas el 30 oct 2026: vista `/users` para el titular y los administradores. Crear un acceso busca la cuenta en Firebase Auth por correo o la crea (con contraseña aleatoria), y en una transacción crea `organizations/{orgId}/memberships/{uid}` (`role`, `status`, `personId`, metadatos) y el evento `member.created`; si la transacción falla, se elimina la cuenta recién creada. Después el navegador envía el correo de Firebase para definir la contraseña (`sendPasswordResetEmail`), con opción de reenviarlo. Si la cuenta ya existía (por ejemplo, de otra organización), solo se añade la membresía.

- **Roles asignables:** `admin`, `manager`, `operations`, `owner` y `tenant`. `org_owner` no se asigna ni se modifica. El titular gestiona todos los roles asignables; un `admin` gestiona todos menos `admin`. Nadie cambia su propio acceso.
- **Cuentas de cliente:** `owner`/`tenant` exigen una ficha de Personas del mismo tipo, no archivada, sin cuenta y con el mismo correo; la ficha guarda `accountUid`. Mientras tenga cuenta, el correo de la ficha no cambia y no puede archivarse con acceso activo. Su rol no cambia, y el personal no puede pasar a un rol de cliente.
- **Suspender/reactivar:** cambia `status` de la membresía (`member.suspended`/`member.reactivated`); el acceso a la organización se pierde de inmediato sin borrar la cuenta. Cambio de rol del personal: `member.role_changed`.
- **Experiencia por rol:** el menú muestra Propiedades, Personas y Usuarios solo a `org_owner`/`admin`. Propietarios e inquilinos ven "Tu portal está en preparación"; `manager`/`operations` ven "Tu acceso está activo" hasta definir su alcance.
- **Pendiente:** portales 05/06, alcance por propiedad para `manager`/`operations`, gestión de organizaciones (37 completo), proveedores y huéspedes, y plantilla/remitente propios del correo (requiere proveedor de correo).

#### Contrato de Leases (Masters 40 y 15, núcleo contractual)

Decisiones acordadas el 30 oct 2026: este incremento cubre el núcleo contractual del Master 40, la lista del Master 15 y un detalle mínimo en `/leases/[id]` (el Lease 360 completo es el Master 41). Los contratos viven en `organizations/{orgId}/leases/{leaseId}` con código secuencial `L-AAAA-NNNN` (contador `counters/leases` en la misma transacción), `source` (`admin`, `migration`, `renewal`; "desde solicitud aprobada" espera a los Masters 23/07), `renewOfLeaseId`, `propertyId`, `unitId`, `tenantId` (ficha de Personas tipo inquilino), `parties[]` (rol, nombre legal, correo), fechas de calendario ISO `YYYY-MM-DD` (`startDate`, `endDate`, `possessionDate`, `moveInDate`, `firstRentDueDate`), `renewalType`, `noticeDays`, `currency`, montos en unidades menores (`rentMinor`, `lateFeeFlatMinor`, depósitos, renta adelantada, otro cargo), `dueDay` (1–28), `graceDays`, `lateFeeRule`, `prorateFirstPeriod`, `collectFirstMonthRent`, `utilities` (responsable y notas por servicio), `closedOn`, `closeReason`, `filterKeys` (estado y estado × moneda) y `searchKeys` (prefijos de código, inquilino, propiedad y unidad).

- **Estados:** `draft` → `pending` → `active` → `expired` / `terminated`; `draft`/`pending` → `cancelled` (motivo obligatorio). Un borrador exige propiedad, unidad e inquilino; "Crear contrato" (pendiente) exige además fechas válidas, renta > 0 y recargo fijo si aplica. Pendiente no vuelve a borrador. Activos y cerrados no se editan.
- **Solapes:** no pueden coexistir dos contratos pendientes/activos con fechas que se crucen en la misma unidad; los borradores no bloquean y se validan al pasar a pendiente y al activar.
- **Ocupación:** activar marca la unidad `occupied` con `activeLeaseId`, recalcula la proyección de la propiedad y deja al inquilino `active` vinculado a esa unidad, todo en una transacción. Con contrato activo, la unidad no puede ponerse disponible ni archivarse a mano. Si la unidad figura ocupada sin contrato, la activación se bloquea. Una renovación activa toma la unidad del contrato que renueva, que pasa a `expired` ("Renovado por …").
- **Cierre:** terminar (motivo y fecha efectiva no futura) o marcar vencido (solo con la fecha de fin cumplida en la zona horaria de la organización) libera la unidad y deja al inquilino `inactive` y desvinculado si no tiene otro contrato activo. Un inquilino con contrato pendiente o activo no puede archivarse.
- **Nombres copiados:** `tenantName`, `propertyName` y `unitLabel` se copian al guardar para búsqueda y como identificación de las partes tal como se contrataron; se refrescan en cada edición mientras el contrato es borrador o pendiente.
- **Lista:** pestañas Todos, Activos, Pendientes, Vencen en ≤ 90 días (activos con fin entre hoy y hoy + 90), Borradores, Vencidos, Terminados y Cancelados, con conteos; KPIs de activos, renta mensual y depósitos por moneda (USD y DOP nunca se suman), vencimientos y pendientes/borradores; búsqueda y paginación por cursor. Cuatro índices compuestos nuevos en `firestore.indexes.json` (`filterKeys`/`searchKeys` con `code` descendente y con `endDate` ascendente).
- **Auditoría:** `lease.created`, `lease.updated`, `lease.submitted`, `lease.activated`, `lease.terminated`, `lease.expired`, `lease.cancelled`.
- **Pendiente de otros Masters:** solicitudes (23/07/08), Lease 360 con pestañas (41), métodos de pago, seguro, plantillas/anexos, firmas y requisitos de mudanza (documentos, firma electrónica, seguros, inspecciones), cargos de renta y cobro de fondos iniciales (pagos/contabilidad), pestaña Contratos en el detalle de propiedad y exportación CSV.

### Integridad financiera con Firestore

- Las entradas del libro mayor son append-only. Correcciones mediante reverso/ajuste ligado al asiento original, no edición o borrado silencioso.
- La operación de negocio (por ejemplo registrar pago y asiento) debe verificar saldo/monto en servidor, generar una clave de idempotencia única y escribir estado + asiento en una transacción/batch con límites controlados. Si requiere una operación más extensa o interacción externa, usar estados y patrón outbox/saga con reconciliación explícita.
- Enviar/confirmar pagos con proveedor externo fuera de la transacción Firestore; validar la firma del webhook, hacer el procesamiento idempotente y reconciliar estados pendientes/fallidos.
- Definir reglas de reservas concurrentes para evitar doble ocupación; validar disponibilidad y crear el bloqueo/reserva con mecanismo transaccional y expiración.
- No guardar PAN/CVV ni secretos bancarios. Usar tokenización del proveedor de pagos, permisos restringidos y registros enmascarados.
- Antes de implementar payroll, depósitos fiduciarios, conciliación bancaria o cierre financiero, obtener revisión contable/legal y decidir si se requiere sistema contable externo.

## 6. Entregas y criterios de salida

Las duraciones son una estimación inicial para un equipo pequeño con diseño disponible; dependen de la experiencia del equipo, integraciones y alcance regulatorio. No constituyen compromiso de fecha.

### Fase 0 — Validación de producto y arquitectura (1–2 semanas)

- Confirmar usuarios/roles, una o múltiples organizaciones por cuenta, flujos de invitación, monedas (incluyendo USD/DOP según handoff), zonas horarias, idioma, reglas de alquiler y definición exacta de cada acción.
- Revisar los 67 prototipos y `SCREENS.md`; convertir controles simulados en historias con estados, errores, permisos y criterios de aceptación.
- Elegir hosting, región Firebase, dominios, política de backups/retención, proveedor de pagos, firma electrónica, correo/SMS, screening y origen de datos de propiedades.
- Producir matriz de permisos, glosario de datos, mapa de consultas/índices, clasificación de PII y arquitectura de ledger.
- **Salida:** decisiones aprobadas, riesgos registrados y backlog de MVP priorizado; ningún secreto de producción ni dato real en entorno de desarrollo.

### Fase 1 — Fundaciones y autenticación (2–3 semanas)

- Inicializar Next.js/TypeScript, lint/typecheck/test, CI, ambientes y Emulator Suite; establecer tokens visuales, tipografía, responsive y componentes compartidos.
- Implementar Auth (registro/invitación según política, login, logout, reset de contraseña, verificación de email), sesión segura y recuperación de cuenta.
- Implementar organizaciones, membresías, selección de contexto, matriz de roles y autorización server-side; reglas Firestore/Storage deny-by-default.
- Añadir logging estructurado sin PII, eventos de auditoría, manejo de errores, rate limits/abuso donde aplique y observabilidad.
- **Salida:** pruebas de acceso permitido/denegado pasan por rol y organización; no hay pantalla protegida visible sin autorización server-side.

### Fase 2 — Shell y núcleo de cartera (3–4 semanas)

- Construir layout, navegación por capacidad, selector de organización, búsqueda, idioma ES/EN, accesibilidad y estados loading/empty/error.
- Implementar propiedades, unidades, propietarios, inquilinos, empleados y proveedores; perfiles 360° y relaciones cruzadas.
- Implementar dashboard inicial con agregados autorizados y paginación/filtros consistentes.
- **Salida:** alta/edición/archivo auditables, búsqueda y filtros verificables, enlaces internos correctos y responsive probado en 390/1024/1440 px.

### Fase 3 — Arrendamiento y finanzas MVP (4–6 semanas)

- Implementar solicitud → revisión → aprobación → contrato → activación; documentos, fechas, depósitos y ocupantes.
- Implementar cargos, balances, pagos manuales y recibos; ledger de doble entrada y vistas de cuenta por propiedad.
- Crear portal del propietario e inquilino con autorización por relación y datos mínimos.
- Integrar un proveedor de pago en sandbox solo tras aprobación; procesar webhooks y reintentos idempotentes.
- **Salida:** pruebas de carrera/reintento no duplican cobros ni asientos; recibos no pueden leerse con IDs ajenos; montos calculados en servidor.

### Fase 4 — Operaciones y mantenimiento (3–5 semanas)

- Órdenes de trabajo, solicitudes, asignación, costos/aprobaciones, inspecciones con fotos, tareas de limpieza, inventario y readiness.
- Estados de flujo y notificaciones enlazados a registros; permisos de staff, vendor, tenant y owner definidos.
- **Salida:** historial completo por entidad, archivos con permisos, flujos de trabajo probados de inicio a cierre.

### Fase 5 — Finanzas ampliadas y reportes (4–7 semanas)

- Depósitos, CxC, CxP, distribuciones, conciliación, cierre y reportes; nómina queda condicionada a decisión de proveedor y validación legal/tributaria.
- Exportaciones CSV/PDF generadas de datos autorizados, con audit trail y límites de volumen.
- Reconciliación de estados de pagos y tareas de detección de inconsistencias.
- **Salida:** conciliación de pruebas contra fixtures contables aprobados, reversos auditables y reportes aislados por organización/rol.

### Fase 6 — Reservas y experiencia de estancias (4–6 semanas)

- Catálogo/búsqueda, disponibilidad, precio y reglas de reserva; perfil del huésped, autoservicio, servicios y comunicaciones.
- Integraciones de canal y cobros si están definidas, con webhooks, idempotencia, reglas de cancelación y reconciliación.
- **Salida:** no se producen reservas solapadas en pruebas concurrentes; política de cancelación/cargos visible y validada.

### Fase 7 — Cumplimiento e integraciones (3–6 semanas)

- Seguros, HOA, ownership verification, KYC, incidentes, activos, action center, templates, notifications e integraciones.
- Verificación humana y controles de datos sensibles; no tomar decisiones automatizadas de screening sin política y aprobación legal.
- **Salida:** acceso a documentación restringido, decisiones sensibles auditadas y fallo de proveedor gestionado explícitamente.

### Fase 8 — Endurecimiento, migración y lanzamiento (2–4 semanas)

- Pruebas completas de seguridad, accesibilidad, browser/device, carga, costos de lecturas, backups/restores y respuesta a incidentes.
- Migrar solo registros existentes que el negocio haya aprobado, con ensayo, conteos, deduplicación, conciliación, rollback y ventana de corte.
- Piloto con una organización y datos controlados; soporte, métricas y plan de reversión.
- **Salida:** cero defectos P0/P1 abiertos, backups restaurados exitosamente en simulacro, checklist de lanzamiento firmado y plan de soporte activo.

### Plan de revisión e implementación vista por vista

Las fases anteriores indican dependencias y alcance general. Esta lista es el backlog de aceptación: cada número se desarrolla como una unidad independiente y se deja pendiente hasta la revisión explícita de esa vista. Las estimaciones de fase no son compromiso de calendario; el ritmo se ajusta al tiempo disponible para revisar.

#### Protocolo para cada vista

1. **Definir antes de codificar:** revisar el Master y sus enlaces; acordar usuario/rol, recorrido feliz, estados, campos, validaciones, permisos, datos visibles y acciones que deben persistir. Registrar decisiones no definidas por el diseño.
2. **Implementar solo el alcance de esa vista:** ruta protegida, UI responsive, lectura/escritura autorizada en servidor y Firestore, relaciones e índices necesarios, auditoría en cambios sensibles. No dejar botones que aparenten funcionar si la acción no está implementada.
3. **Probar el flujo:** carga, vacío, error, éxito, validación, permisos permitidos/denegados, aislamiento entre organizaciones, teclado/accesibilidad básica, tamaños 390/1024/1440 px y persistencia tras recargar.
4. **Revisar juntos:** demostrar los escenarios acordados con datos de prueba; registrar observaciones y corregirlas. La persona usuaria confirma la vista antes de marcarla aceptada y avanzar al siguiente Master del módulo.
5. **Cerrar el incremento:** pruebas focalizadas pasan, enlaces a/desde vistas existentes funcionan y la documentación o decisiones de flujo quedan actualizadas. Regresión breve de las vistas afectadas.

**CRUD no significa borrar todo:** listas deben cubrir búsqueda/filtros/paginación cuando aplique; formularios cubren alta y edición; detalles y portales cubren lectura y acciones permitidas. Las entidades financieras, auditoría y otros registros inmutables se corrigen mediante reverso, anulación controlada o evento nuevo, nunca mediante borrado silencioso. Las acciones de aprobación, pago, publicación, reserva, cierre y envío deben tener estados, permisos, confirmación y rastro de auditoría.

#### A. Plataforma y organización

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 01 — App Layout | Navegación entre rutas habilitadas; organización activa; menú según capacidad; estados activo/deshabilitado; encabezado, búsqueda/acciones si están definidas, idioma y responsive. No mostrar opciones sin ruta funcional. |
| 21 — Settings | Leer y actualizar configuración permitida de organización/usuario; validar zona horaria, moneda e idioma; guardar/cancelar; distinguir preferencias de usuario de configuración compartida y auditar cambios administrativos. |
| 37 — Organizations | Listar organizaciones accesibles; crear cuando la política lo permita; editar datos, miembros, invitaciones, roles y estado según permisos; cambiar contexto; validar aislamiento y último administrador. |
| 38 — Audit Log | Consultar eventos autorizados, filtrar por actor/acción/entidad/fecha y paginar; abrir referencia al registro; vista de solo lectura y sin exponer secretos o PII innecesaria. |

#### B. Cartera de propiedades

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 02 — Main Dashboard | Leer KPIs y pendientes únicamente de la organización activa; filtros/rango de fechas definidos; enlaces a listados; estados sin datos/error; verificar que los agregados no incluyan registros ajenos. |
| 03 — Properties | Listar propiedades de la organización activa con búsqueda, filtros combinados, orden y paginación por cursor; enlazar al detalle; acciones según permisos. |
| 20 — Property Form | Alta y edición de propiedad (borrador, dirección y ubicación, renta y servicios, revisión) con validación en servidor; solo roles autorizados; auditar cambios. |
| 04 — Property Detail | Consultar y editar datos autorizados; administrar unidades (alta/edición/archivo, ocupación/estado); navegar relaciones con personas, leases, documentos y operaciones; validar enlaces cruzados y alcance. |

#### C. Directorio y perfiles

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 19 — People | Directorio con búsqueda/filtros por tipo y estado; paginación; alta/edición del registro correspondiente; abrir perfiles; controlar exposición de PII y duplicados. |
| 25 — Owner Profile (360) | Consultar/editar perfil del propietario; relacionar propiedades/unidades; revisar leases, documentos, balances y actividad autorizados; cambios con validación y auditoría. |
| 26 — Tenant Profile (360) | Consultar/editar perfil del inquilino; relacionar solicitudes, leases, pagos, documentos y mantenimiento; acceso por rol y minimización de PII. |
| 58 — Staff | Listar, invitar/asignar y actualizar personal; asignar rol/capacidades y estado; revocar acceso; impedir autoelevación y bloquear la eliminación del último administrador. |
| 59 — Vendors | Listar, crear/editar/archivar proveedores; validar contacto, servicios, estado y datos requeridos; relacionar órdenes de trabajo y cuentas por pagar con permisos. |

#### D. Solicitudes y arrendamientos

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 23 — Rental Application Wizard | Crear y guardar/enviar solicitud por pasos; validar campos, consentimiento y adjuntos; permitir retomar/corregir según estado; confirmar envío y evitar duplicados. No activar screening externo sin aprobación. |
| 07 — Rental Applications | Bandeja de solicitudes autorizadas; filtros, búsqueda y paginación; asignar/revisar; transiciones permitidas; abrir detalle; auditar decisiones y aislar solicitantes. |
| 08 — Application Detail | Ver datos y documentos según rol; solicitar información, devolver, aprobar o rechazar según política; motivo obligatorio donde corresponda; historial y auditoría; sin decisiones automáticas no aprobadas. |
| 67 — Application 360 | Vista integral de solicitud con perfil, unidad, documentos, verificaciones y timeline; enlaces y acciones sujetos a permiso; evitar duplicar acciones incompatibles con el Master 08. |
| 40 — Create Lease | Crear borrador/lease desde registros validados; fechas, partes, unidad, renta, depósito y moneda; validar disponibilidad y solapamientos; guardar borrador o activar según capacidad y workflow aprobado. |
| 15 — Leases | Listar, buscar/filtrar y paginar leases; crear, abrir detalle, renovar/cambiar estado según workflow; controlar fechas y unidad; no alterar silenciosamente contratos activos. |
| 41 — Lease 360 | Consultar condiciones, partes, documentos, cargos y timeline; editar campos permitidos; renovar, terminar o cambiar estado con autorización, fecha efectiva, confirmación y auditoría. |
| 05 — Owner Portal | Acceso de solo lectura por relación verificada a propiedades, unidades, documentos, estados y reportes propios; solicitudes/acciones habilitadas por política; probar acceso cruzado denegado. |
| 06 — Tenant Portal | Acceso por lease/relación a contrato, saldo, recibos, documentos y solicitudes; registrar pago solo con mecanismo aprobado (manual o proveedor); probar acceso a otros inquilinos denegado. |

#### E. Documentos y finanzas

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 12 — Documents | Listar/subir/consultar/descargar documentos autorizados; metadatos, categoría y relación; validar tipo/tamaño; Storage privado y URL temporal; eliminar solo según retención/permisos. |
| 11 — Accounting | Resumen contable autorizado y navegación a ledger/cuentas; filtros por período, propiedad y moneda; validar totales contra datos de prueba, límites de acceso y estados vacíos. |
| 61 — General Ledger | Consultar asientos paginados y filtrados; ver partida doble y referencia de origen; exportar con permiso; correcciones por reverso/ajuste auditado, nunca editar/borrar asientos contabilizados. |
| 16 — Payments | Consultar pagos y registrar pago manual autorizado; validar monto/moneda/obligación; recibo y estado; reintentos idempotentes; reverso/anulación auditada. Cobro online queda bloqueado hasta aprobar proveedor y sandbox. |
| 48 — Deposits | Consultar y registrar depósito ligado a lease; movimientos de retención, devolución o aplicación con autorización y motivo; saldo conciliado; historial inmutable y revisión contable/legal antes de automatizar custodia. |
| 62 — Property Ledger | Consultar movimientos y saldo de una propiedad/unidad; filtros por período/tipo; conciliación visual con General Ledger y enlaces a origen; solo lectura salvo flujo de ajuste autorizado. |
| 63 — Accounts Receivable | Consultar cargos y vencimientos; crear/ajustar cargo con permiso; registrar seguimiento/cobro; estados y aging; evitar duplicados y recalcular importes en servidor. |
| 64 — Accounts Payable | Capturar obligación/factura de proveedor, adjunto y vencimiento; revisar/aprobar/rechazar; registrar pago según autorización; evitar duplicados y enlazar asiento/documento. |
| 49 — Owner Distributions | Calcular propuesta desde saldo disponible; revisar detalle por propietario/período; aprobar y registrar distribución idempotente; reversos auditables; bloquear saldo insuficiente. |
| 65 — Bank Reconciliation | Importar/consultar extracto aprobado; asociar y desasociar movimientos; resolver diferencias; confirmar conciliación con permisos; conservar evidencia y auditar; no conectarse a banco sin proveedor aprobado. |
| 66 — Financial Close | Revisar checklist y excepciones por período; validar conciliaciones; cerrar/reabrir solo por rol autorizado y motivo; impedir escrituras al período cerrado; dejar rastro y pruebas de reversión controlada. |
| 50 — Payroll | Mantener bloqueada la ejecución de nómina hasta aprobar proveedor, alcance legal/tributario y permisos; primero revisar si el Master se limita a lectura o exige cálculo/desembolso. No guardar datos bancarios sensibles ni simular pagos. |
| 51 — Reports | Seleccionar reporte/parámetros; generar solo con datos autorizados; validar período, moneda y totales; exportar con límites y auditoría; mostrar vacíos/errores explícitos. |

#### F. Operaciones y mantenimiento

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 09 — Operations Center | Bandeja de pendientes por capacidad; buscar/filtrar/priorizar; abrir registro relacionado; cambiar asignación/estado solo mediante su workflow; validar que cada contador corresponda a elementos visibles. |
| 14 — Maintenance Requests | Crear solicitud por actor permitido; asociar unidad, categoría, descripción y adjuntos; consultar/triage/cambiar estado; controlar PII, urgencias y notificaciones. |
| 13 — Work Orders | Listar y crear órdenes desde solicitudes; asignar proveedor/personal, prioridad, costo estimado y fechas; actualizar estado y cerrar con resultado; permisos y auditoría. |
| 57 — Work Order 360 | Ver detalle, historial, comentarios, adjuntos, costos y vínculos; editar/asignar/transicionar según rol; cerrar/reabrir con motivo y evitar acciones duplicadas con la lista. |
| 60 — Inspections | Programar/listar inspecciones; asignar inspector, unidad, tipo y fecha; registrar resultados/estado; asociar informe y seguimiento; validar permisos y evidencia. |
| 10 — Digital Inspection | Ejecutar inspección paso a paso; guardar progreso; registrar condición, notas y fotos por elemento; enviar/finalizar con validación; probar reanudación, fallos de subida y permisos. |
| 56 — Cleaning | Planificar y asignar limpieza; vincular propiedad/reserva/orden; actualizar tareas y completar con evidencia cuando aplique; probar cambios de agenda y permisos de proveedor. |
| 22 — Supplies & Inventory | Listar artículos y existencias; alta/edición/archivo; registrar entradas, consumo y ajustes con motivo; controlar mínimos, unidad de medida y movimientos auditables. |
| 36 — Property Readiness | Consultar checklist y disponibilidad operacional; cambiar tareas/estado según rol; bloquear listo si hay requisitos pendientes; enlazar inspección, limpieza y mantenimiento. |

#### G. Estancias y huéspedes

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 29 — Explore Stays | Buscar propiedades/unidades disponibles según fechas y reglas; filtros y precio calculados en servidor; no exponer datos privados; estado sin resultados y disponibilidad actualizada. |
| 30 — New Reservation | Crear borrador/solicitud/reserva según política; validar fechas, ocupación, precio y unidad; evitar solapamientos transaccionalmente; confirmar cargos/cancelación; pago solo con proveedor aprobado. |
| 17 — Reservations | Listar, buscar/filtrar y paginar reservas; crear/abrir/cambiar estado/cancelar según política; mantener historial, disponibilidad y cargos consistentes. |
| 31 — Reservation 360 | Consultar huésped, unidad, fechas, cargos, servicios, documentos y timeline; editar o cancelar con permiso/motivo; enlaces y estados coherentes con listado. |
| 32 — Guests | Consultar directorio asociado a reservas; buscar/filtrar; crear o actualizar datos permitidos; acceso mínimo a PII; abrir perfil y restringir acceso cruzado. |
| 33 — Guest 360 | Ver perfil, reservas, preferencias y comunicaciones autorizadas; corregir datos permitidos; minimizar PII y auditar acceso/cambios sensibles. |
| 34 — My Stay | Autoservicio del huésped autenticado para ver únicamente su estancia, instrucciones y datos necesarios; enviar solicitudes permitidas; validar identidad y ventana de acceso. |
| 35 — Guest Services | Crear y seguir solicitudes de servicio ligadas a una estancia; categoría, prioridad, estado y responsable; notificar según preferencias; probar cierre y acceso por huésped/staff. |

#### H. Cumplimiento y seguros

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 52 — Ownership Verification | Registrar evidencia y estado de verificación de propiedad; revisar/aprobar/devolver con motivo; limitar documentos sensibles y conservar auditoría. |
| 18 — Identity Verification | Ver estado/evidencia y resolver revisiones manuales autorizadas; proteger documentos de identidad; integración y decisiones automatizadas bloqueadas hasta aprobación legal/proveedor. |
| 53 — Compliance Review | Asignar revisión, evaluar checklist/evidencia, solicitar corrección y aprobar/rechazar con fundamento; permisos estrictos y trail inmutable. |
| 27 — Insurance & Compliance | Consultar pólizas/requisitos/vencimientos; crear/editar registros permitidos y generar alertas; restringir documentos y enlazar propiedad/organización. |
| 42 — New Insurance Policy | Capturar póliza, asegurado, cobertura, fechas y adjuntos; validación y revisión; no marcar vigente hasta verificar evidencia y autorización. |
| 43 — Insurance Policy 360 | Consultar cobertura, documentos, activos vinculados y timeline; actualizar/cancelar/renovar con autorización y trazabilidad. |
| 44 — HOA & Compliance | Registrar asociaciones, reglas, cuotas y fechas; actualizar estado y adjuntos; vincular propiedades y tareas de cumplimiento con acceso por organización. |
| 45 — Assets & Equipment | Listar/crear/editar/archivar activos; relacionar ubicación, condición, mantenimiento y documentos; historial de cambios y permisos. |
| 46 — Incidents | Reportar y gestionar incidente; severidad, personas/activos afectados, evidencia y seguimiento; acceso restringido, notificación aprobada y registro de auditoría. |

#### I. Comunicación e integraciones

| Master / vista | Flujo individual a implementar y revisar |
|---|---|
| 24 — Messages | Listar conversaciones autorizadas; leer/enviar mensajes, adjuntos y estado leído; validar participantes, organización, privacidad y fallo/reintento de envío. |
| 39 — Templates | Listar, crear/editar, previsualizar y archivar plantillas; validar variables, idioma y destinatario; guardar versiones para no alterar mensajes/documentos ya emitidos. |
| 47 — Notifications | Consultar notificaciones propias/autorizadas; marcar leída/no leída y navegar al origen; preferencias y entrega externa solo según configuración/proveedor aprobado. |
| 28 — Action Center | Agregar pendientes accionables del usuario; filtrar/priorizar y navegar al origen; ejecutar acción solo en el módulo propietario y actualizar el pendiente de forma consistente. |
| 54 — Contact Requests | Recibir/listar solicitudes; validar campos, estado, asignación y respuesta; limitar exposición de datos y prevenir abuso; auditar cambios de estado. |
| 55 — Integrations | Consultar estado y configurar/desconectar integraciones autorizadas; secretos solo en gestor seguro; conexión de prueba, errores visibles, webhooks y revocación; no habilitar proveedor sin aprobación. |

#### Seguimiento por vista

Para cada Master, registrar en el issue/tarea de implementación su estado (`Pendiente`, `En desarrollo`, `Lista para revisión`, `Cambios solicitados` o `Aceptada`), enlace al prototipo, escenarios acordados, pruebas ejecutadas y decisiones pendientes. No marcar una vista como aceptada solo porque renderiza o compila. La aceptación confirma el flujo de esa vista; cambios posteriores en permisos, datos o acciones requieren revisar también las vistas relacionadas.

#### Avance registrado — 30 oct 2026

| Master / vista | Estado | Avance verificado | Pendiente / siguiente paso |
|---|---|---|---|
| 01 — App Layout | Implementada; pendiente de revisión y aceptación | Shell reutilizable en `src/components/layout/admin-shell.tsx`: navegación a rutas existentes, selector de organización, identidad, cierre de sesión, menú contraíble en escritorio y drawer móvil. Login y flujos de organización existentes se preservan. | Revisar visualmente con sesión autenticada, en escritorio y móvil; registrar observaciones antes de aceptarla. |
| 02 — Main Dashboard | Implementada parcialmente; pendiente de revisión y aceptación | Consulta server-side del conteo de propiedades de la organización activa en `src/lib/dashboard/summary.ts`; muestra el estado vacío cuando el conteo es cero, informa que faltan los indicadores que aún no tienen fuentes de datos y ofrece error recuperable si la consulta falla. | Revisar con sesión y datos de prueba. Definir KPIs, rangos de fecha, comparaciones y pendientes cuando existan datos/modelos de cartera y finanzas. |
| 03 — Properties | Implementada; pendiente de revisión y aceptación | Nueva ruta `/properties` con consulta server-side por organización activa, permisos por rol, búsqueda por prefijo en nombre, código, tipo y ubicación, filtros combinados, conteo y paginación por cursor. El emulador verificó filtros, páginas anterior/siguiente y aislamiento de la colección; no se copiaron los datos simulados del prototipo. | Revisar visualmente con una sesión autorizada y registros de prueba que cumplan el contrato de lectura. El alta/edición y el detalle siguen separados en Masters 20 y 04; coordinar su esquema y proyecciones de unidades. |
| 20 — Property Form | Implementada parcialmente; pendiente de revisión y aceptación | Rutas de alta y edición conectadas a Firestore, limitadas a `org_owner` y `admin`, con validación server-side, reserva transaccional del código por organización, auditoría transaccional y regeneración de `searchName`, `filterKeys` y `searchKeys`. El formulario persiste los campos principales de identidad y dirección. | Probar alta, edición, conflicto de código y aislamiento en Auth/Firestore Emulator; revisar visualmente con sesión. La gestión de unidades, propietarios/inquilinos, finanzas, responsables, amenidades e imágenes queda pendiente de definir sus modelos, permisos y almacenamiento. |
| 19 — People | Implementada parcialmente; pendiente de revisión y aceptación | Directorio `/people` con pestañas Directorio/Propietarios/Inquilinos, conteos por tipo, búsqueda por nombre, correo y teléfono, filtro de estado, archivados opcionales y paginación por cursor. Alta en `/people/new`, edición y archivo/restauración en `/people/[id]/edit`, vía `/api/people`. Correo único por tipo con reserva transaccional; vínculo opcional del inquilino a propiedad/unidad validado en la organización. Enlace "Personas" en el shell. | Revisión visual autenticada en escritorio y móvil. Proveedores (59), staff (58), perfiles 360 (25/26) y relación propietario–propiedad quedan para sus Masters. |
| 37/58 — Usuarios y accesos | Implementada parcialmente; pendiente de revisión y aceptación | Vista `/users` (lista con rol, ficha vinculada, estado y último acceso), alta en `/users/new` con correo de Firebase para definir contraseña, y rol/estado/reenvío en `/users/[uid]/edit`, vía `/api/members`. "Dar acceso" desde la ficha de Personas. Menú y panel según el rol. | Revisión con cuentas reales creadas por el titular. Portales 05/06 y alcance de `manager`/`operations` pendientes. |
| 40/15 — Leases | Implementada parcialmente; pendiente de revisión y aceptación | Lista `/leases` con pestañas por estado y vencimiento, conteos, KPIs por moneda, búsqueda y paginación. Alta en `/leases/new` (origen, propiedad/unidad, inquilino y partes, plazo, renta, depósitos y servicios, con resumen en vivo), borrador o pendiente; edición de borradores/pendientes; detalle `/leases/[id]` con Activar, Terminar, Marcar vencido y Cancelar. El contrato activo controla la ocupación de la unidad y el estado del inquilino. Enlace "Contratos" en el shell. | Revisión visual autenticada. Desplegar los 4 índices de `leases`. Lease 360 (41), solicitudes y módulos de pagos, documentos y firmas pendientes. |

**Validación del incremento 01–03:** `npm run lint`, `npm run typecheck` y `npm run build` pasaron. El emulador de Firestore verificó el conteo filtrado, la búsqueda por prefijo, la paginación por cursor de 20 registros y el alcance de la consulta por organización. La UI autenticada aún requiere revisión visual con una sesión y registros de prueba; no se usaron registros del prototipo.

**Validación del incremento Masters 03, 04 y 20 (30 oct 2026):** `npm run lint`, `npm run typecheck` y `npm run build` pasaron. Una prueba end-to-end contra Auth/Firestore Emulator (proyecto `demo-mghpm`, sesiones reales vía `/api/auth/session` y CSRF) pasó 53 de 53 comprobaciones de API, Firestore y páginas server-rendered. La prueba está versionada en `scripts/e2e/properties.mjs` (`npm run test:e2e`; instrucciones en el README). Falta la revisión visual en navegador con sesión; no se usaron datos del prototipo.

**Validación del incremento Master 19 (30 oct 2026):** `npm run lint`, `npm run typecheck` y `npm run build` pasaron. `npm run test:e2e` ejecuta ahora dos suites contra los emuladores: propiedades (53/53) y personas (56/56: alta, duplicados por tipo, vínculo a propiedad/unidad y rechazo de unidad archivada u organización ajena, edición con traslado de reserva, cambio de tipo bloqueado, archivo/restauración con conflicto, auditoría, búsqueda por nombre/correo/teléfono, filtros, aislamiento entre organizaciones y acceso restringido para `manager`). También se corrigió que "Panel principal" quedara marcado como activo en todas las rutas del shell.

**Validación del incremento Usuarios y accesos (30 oct 2026):** `npm run lint`, `npm run typecheck` y `npm run build` pasaron. `npm run test:e2e` ejecuta tres suites contra los emuladores: propiedades 53/53, personas 56/56 y accesos 49/49 (creación de cuentas nuevas y existentes, limpieza de la cuenta si la membresía falla, matriz de permisos titular/admin/manager, vínculo con Personas, bloqueo de correo y de archivo, suspensión efectiva, auditoría, menú y panel por rol, e inquilino viendo su aviso de portal). Inventario del proyecto real: solo la cuenta del titular, su organización y su membresía; no se escribió nada en él.

**Validación del incremento Leases (30 oct 2026):** `npm run lint`, `npm run typecheck` y `npm run build` pasaron. `npm run test:e2e` ejecuta cuatro suites contra los emuladores: propiedades 53/53, personas 56/56, accesos 49/49 y contratos 72/72 (borrador incompleto y código secuencial, validaciones de alta, dinero en unidades menores, solapes pendiente/activo y borradores permitidos, vínculos inválidos u otra organización, permisos y CSRF, bloqueo de archivo del inquilino, activación con ocupación de unidad, proyección de propiedad y estado del inquilino, bloqueo de la unidad, cancelación con motivo, renovación que toma la unidad y vence el contrato anterior, terminación y vencimiento que liberan la unidad, auditoría, pestañas, búsqueda, detalle y aislamiento). Los emuladores no exigen índices: los cuatro nuevos de `leases` deben desplegarse en el proyecto real antes de usar `/leases`.

**Siguiente paso (30 oct, superado por el avance del 10 nov):** el titular despliega los índices (`people` y los cuatro de `leases`) y verifica a mano desde cero: propiedad → unidad → inquilino en Personas → contrato (borrador, crear, activar, terminar). Después, portales 05/06 sobre las cuentas de cliente existentes (el inquilino ya puede ver su contrato activo como fuente de datos) o Lease 360 (41).

#### Avance registrado — 10 nov 2026

El orden de trabajo pasa a seguir la auditoría de accesos de Carmen ("MGHPM Enterprise · Fase 1 — Auditoría de accesos", 9 nov 2026):
1. Fase 2: identidad y permisos.
2. Fase 3: alquileres de largo plazo.
3. Fase 4: MGHPM Stays.
4. Fase 5: propietarios.

El stack confirmado es Next.js + Firebase. Las dependencias Django y Keycloak de esa auditoría se traducen a equivalentes de Firebase. Todo lo de esta tabla está **sin commitear** en `main`.

| Master / vista | Estado | Avance verificado | Pendiente / siguiente paso |
|---|---|---|---|
| Imágenes de propiedades | Cambiado a disco local | Ya no usan Firebase Storage. Se guardan en `./storage/` del servidor (variable `LOCAL_STORAGE_DIR`), fuera de `public/`. Los emuladores solo necesitan `auth,firestore`. | En producción el servidor necesita un disco persistente. |
| 29 — Explore Stays (subproyecto A: catálogo) | Implementada; pendiente de revisión | Catálogo público bilingüe: `/estancias` (ES) y `/stays` (EN) son la misma página por *rewrites*, y las URL `/es/stays` y `/en/stays` redirigen. Incluye búsqueda con filtros, ficha con cotización (noches × tarifa + limpieza, sin impuestos), formulario de solicitud con antispam y bandeja `/admin/stay-inquiries`. Cada unidad tiene su configuración de estancia corta (tarifa, huéspedes, camas, mínimo y máximo de noches, publicar). Las fotos públicas se sirven sin EXIF. | Spec y plan en `docs/superpowers/`. Fuera de A: B (reservas y disponibilidad), C (pago, Mis estadías, check-out), notificación por correo, mapa e impuestos. Requiere `PUBLIC_CATALOG_ORGANIZATION_ID`. |
| Fase 2A-1 — Tipos de usuario y permisos | Implementada; pendiente de revisión | **Staff en `/admin/*`**; las URL viejas redirigen. **Permisos centrales** en `src/lib/access/permissions.ts`, que deniegan por defecto: `manager` opera, `operations` consulta y en Usuarios solo `org_owner`/`admin` gestionan. **Portales** esqueleto `/propietario`, `/inquilino`, `/solicitante`, `/huesped` (Inicio y Mi perfil, sin menú interno). **Entrada:** `/acceder` (selector), `/espacios` y cambio de espacio auditado (`workspace.switched`). **Pantallas** de no autorizado, suspendido y sin acceso. **Usuarios:** no se puede reactivar sin querer una cuenta en otro estado. | Spec `docs/superpowers/specs/2026-11-10-access-lanes-2a-design.md` y plan `docs/superpowers/plans/2026-11-10-access-lanes-2a1.md`. Sin 2FA por decisión del titular. |

**Validación (10 nov 2026):**
- `npm run typecheck`, `npm run lint` y `npm run test:unit` (39 pruebas en `src/lib/stays` y `src/lib/access`) pasaron.
- `npm run test:e2e` ejecuta 8 suites contra los emuladores y todas terminan con 0 fallos: propiedades 65, unidades 31, imágenes 38, personas 56, accesos 51, contratos 72, estancias 39 y tipos de usuario 25.
- Las expectativas de `manager` se actualizaron por la nueva tabla de permisos. Las verificaciones de seguridad no se debilitaron.

**Siguiente paso (punto de partida al retomar):**
1. El titular prueba a mano:
   - entrar por `/acceder` como staff y llegar a `/admin`;
   - comprobar que las URL viejas redirigen;
   - crear accesos Gerente y Operaciones, y revisar su menú y sus botones;
   - crear un acceso Propietario enlazado a una ficha: debe entrar a `/propietario`, ver "Mi perfil" y no poder abrir `/admin`;
   - suspender una cuenta y ver la pantalla de suspendido;
   - en el catálogo, publicar una unidad (propiedad de corto plazo con moneda), verla en `/estancias` y enviar una solicitud.
2. Configurar el correo transaccional. Firebase Auth ya envía por sí mismo verificación, restablecimiento de contraseña y enlace de inicio de sesión. Para el resto hace falta un proveedor SMTP, que configura el titular.
3. **Fase 2A-2:** persona con relaciones múltiples (propietario, inquilino, solicitante, huésped) y varios portales en la misma organización. Afecta a Personas, Contratos y Usuarios.
4. Fases 2B (invitaciones a portales), 2C (registro de solicitante) y 2D (acceso de huésped por código).

#### Ruta al MVP — decisiones del 12 nov 2026

**Decisiones del titular:**
- **El MVP incluye reservas de corta estancia.** Esto amplía el §9, que las dejaba fuera.
- **Pagos:** se registran pagos y se verifican las transferencias bancarias. El pagador o el staff registran la transferencia (banco, cuenta, referencia, fecha, monto y comprobante) y el staff la verifica y aprueba o rechaza.
  - Solo los fondos **verificados** cuentan como cobrados y confirman una reserva.
  - Cada decisión queda auditada.
  - La conciliación contra el extracto bancario (Master 65) cierra el ciclo.
  - El cobro en línea con tarjeta queda fuera del MVP.
- **Correo:** las plantillas de Firebase Auth (definir o restablecer contraseña, verificación y enlace de inicio de sesión) ya están configuradas, con el dominio propio y los dominios autorizados, incluido el Droplet de DigitalOcean. Los avisos de negocio usarán la Gmail API por HTTPS, porque DigitalOcean bloquea SMTP.

**Orden de construcción.** Cada bloque sigue su propio ciclo de diseño → plan → implementación → e2e:

| # | Bloque | Contenido | Masters |
|---|---|---|---|
| 1 | 2A-2 Personas y relaciones | Una persona con varias relaciones; vínculo propietario ↔ propiedad; varios portales en la misma organización | 19, 25, 26 |
| 2 | 2B Invitaciones | El staff invita y la persona activa su portal con el correo de Firebase | 21/58 |
| 3 | Alquiler de largo plazo | Estados de disponibilidad, `/alquileres`, registro de solicitante (2C), solicitudes, aprobación → contrato → activación → invitación; Lease 360; Documentos | 03, 04, 07, 23, 67, 41, 12 |
| 4 | Pagos y verificación | Cargos (renta, depósito y estancia), registro de transferencias con comprobante, verificación y aprobación, recibos, ledger, saldos y conciliación básica | 16, 61, 62, 63, 48, 65 |
| 5 | Reservas de corta estancia | Stays B (disponibilidad por fechas con retenciones que vencen, reserva, cuenta del huésped / 2D, número de reserva) y C (pago por transferencia verificada, Mis estadías, check-out) | 29, 30, 17, 31, 32, 33, 34, 35 |
| 6 | Contenido de los portales | Propietario e inquilino: contrato, estado de cuenta, pagos, documentos y solicitudes | 05, 06, 49 |
| 7 | Mantenimiento | Solicitudes desde el portal, órdenes de trabajo, proveedores y cierre | 14, 13, 57, 59 |
| 8 | Panel y avisos | Indicadores reales, notificaciones internas, visor de auditoría y avisos por correo (Gmail API) | 02, 47, 38 |
| 9 | Endurecimiento y piloto | Reglas, índices, backups, hosting con disco persistente, prueba por rol y piloto | — |

**Fuera del MVP:** cobro en línea con tarjeta, nómina, conciliación bancaria automática, integraciones de canal (Airbnb, Vrbo, Booking), KYC automatizado e IA.

#### Avance registrado — 12 nov 2026

| Master / vista | Estado | Avance verificado | Pendiente / siguiente paso |
|---|---|---|---|
| Fase 2A-2 — Persona con relaciones y titularidad (19, 25, 26) | Implementada; pendiente de revisión | **Persona** individual o entidad con varias relaciones (propietario, inquilino); ficha `/admin/people/{id}`, Owner 360 y Tenant 360. **Titularidades** con % (máx. 100 % por propiedad), verificación manual con revisor distinto del creador y pestaña "Propietarios" en la propiedad. **Portales múltiples** por cuenta (`staffRole` + `portals` + `portalPersonIds`); cada portal exige la relación activa. **Contratos:** activar crea la relación de inquilino y terminar/vencer la finaliza. Portales: "Mis propiedades" y "Mi contrato". Script `npm run migrate:relationships` (idempotente, `--dry-run`). | Spec y plan en `docs/superpowers/` (12 nov). En el proyecto real: desplegar 3 índices (`ownerships` personId+active y propertyId+active; `auditEvents` targetId+createdAt desc) y ejecutar la migración (el `--dry-run` del 12 nov solo cambia 2 membresías, 0 personas). |

**Validación (12 nov 2026):**
- `npm run typecheck`, `npm run lint` y `npm run test:unit` (52 pruebas) pasaron.
- `npm run test:e2e` ejecuta 9 suites contra los emuladores, todas con 0 fallos: propiedades 65, unidades 31, imágenes 38, personas 77, accesos 65, contratos 76, estancias 39, tipos de usuario 30 y titularidades 49.

**Siguiente paso (punto de partida al retomar):**
1. Desplegar los 3 índices y ejecutar la migración en el proyecto real; el titular prueba a mano: alta de propietario, titularidad → revisión por otra persona → verificada, portal "Mis propiedades", y contrato activado → portal "Mi contrato".
2. Bloque 2 de la Ruta al MVP: **2B Invitaciones** (el staff invita y la persona activa su portal con el correo de Firebase).

#### Reconciliación con la revisión de Carmen — 12 nov 2026

Fuente: `docs/reviews/2026-11-12-carmen-handoff-mvp-readiness.md`. El handoff (`design_handoff_mghpm/`) es referencia visual y de comportamiento; su README, estados de pantallas, informe de seguridad Django y `backend-patches/` describen otra aplicación (React/Vite + Django) y **no** se aplican aquí.

**Decisiones del titular:**
- **Alcance de `manager` y `operations`:** toda la organización en el MVP. La asignación por propiedad queda fuera del MVP. Cada página, API, exportación y archivo mantiene su verificación en servidor; el menú nunca es la única barrera.
- **Archivos en producción:** disco local del servidor (`LOCAL_STORAGE_DIR`) sobre un volumen persistente de DigitalOcean, con respaldo programado y procedimiento de restauración documentado antes del piloto. Firebase Storage queda descartado.
- **Barra superior del admin (MVP):** menú completo (incluye Titularidades y Auditoría) con migas de pan correctas; selector ES/EN real con el admin traducido; buscador global y "+ Nuevo"; campana de notificaciones.
- **2B Invitaciones:** aceptación **explícita**. La persona acepta o rechaza en `/espacios`; crear el acceso no equivale a aceptarlo.
- **Paginación:** se mantiene la paginación por cursor de Firestore (diferencia aceptada respecto a la paginación por número del prototipo).

**Pendientes de fuente o confirmación:**
- La "auditoría de accesos de Carmen (9 nov 2026)" que citan las specs de 2A **no está en el repositorio**. Los requisitos atribuidos a ella deben confirmarse con el titular y Carmen.
- `front-lovable/` es un proyecto aparte (TanStack Start / Lovable), sin commitear y fuera de la app Next.js. Se trata como referencia hasta que el titular indique otro papel.

**Operación 2A-2 en producción (12 nov 2026):**
- Migración `migrate:relationships --yes` aplicada: 2 membresías migradas, 0 personas. Un segundo dry-run confirma que no queda nada por cambiar.
- Índices: la cuenta de servicio no tiene permiso para crearlos (403). Faltan `ownerships` (personId+active, propertyId+active) y `auditEvents` (targetId+createdAt desc); los crea el titular desde Cloud Shell.

**Orden actualizado:**
1. Reconciliar el plan (esta sección).
2. Cerrar 2A-2: índices y recorrido manual del titular.
3. CI (lint, typecheck, unitarias, e2e con emuladores) y pruebas de coherencia de permisos menú/página/API.
4. Barra superior del admin.
5. 2B Invitaciones con aceptación explícita.
6. Bloques 3 a 9 de la Ruta al MVP, con pagos diseñados test-first.

#### Avance registrado — 14 nov 2026 (paso 3: coherencia de permisos)

- Índices de 2A-2 creados por el titular en Cloud Shell (en construcción al registrar este avance).
- **Manifiesto único** `src/lib/access/route-permissions.ts`: menú (`adminNavigation`), permiso de cada página `/admin` y de cada handler de API del staff; las APIs públicas o de sesión quedan listadas aparte con su motivo. El menú del admin se construye desde ese manifiesto.
- **Cada API del staff llama directamente a `requireStaffPermission(módulo, acción)` con la acción exacta** (crear = `create`, archivar = `archive`, etc.). Antes varias APIs pedían `update` donde su página pedía `create`. Se eliminaron los helpers intermedios (`getPropertyWriteAccess`, `getManagementWriteAccess`, `getLeaseWriteAccess`, `getPeopleWriteAccess`, `getMembersWriteAccess`).
- **Orden en las APIs: permiso antes de leer el cuerpo.** Un rol sin permiso recibe siempre 403 (401 sin sesión), nunca un 400 de validación. CSRF sigue rechazando con 403.
- Las pantallas de acceso denegado (`AccessState`, `PropertyAccessDenied`) llevan `data-access-denied`.
- Pruebas: unitaria estática `route-permissions.test.ts` (toda página y handler declarados; cada página llama a `requireAdminPage` y comprueba su permiso; cada API comprueba su permiso exacto antes de leer el cuerpo; cada entrada del menú abre una página de `view` del mismo módulo). e2e `scripts/e2e/permissions.mjs`: 24 páginas, 24 APIs y el menú para org_owner, admin, manager, operations, portal propietario, portal inquilino y anónimo (365/365). 10 suites e2e y 62 unitarias en verde.

**Siguiente paso:** el titular termina el recorrido manual de 2A-2 cuando los índices estén `READY`; el CI se valida en GitHub con el próximo push. Después, paso 4: barra superior del admin.

#### Avance registrado — 14 nov 2026 (paso 4A: navegación del admin)

El paso 4 se divide en A (navegación) → B ("+ Nuevo") → C (buscador global) → E (ES/EN de todo el admin, antes de 2B). D (campana de notificaciones) pasa al bloque 8. Spec: `docs/superpowers/specs/2026-11-14-admin-navigation-4a-design.md`; plan: `docs/superpowers/plans/2026-11-14-admin-navigation-4a.md`.

- **Menú por secciones** (Inicio · Cartera · Arrendamiento · Administración) con las entradas nuevas Titularidades y Auditoría; cada rol ve solo lo que puede abrir. Se quitó el pie "Módulos en preparación".
- **Migas de pan con nombres reales** en todas las páginas `/admin`: el manifiesto define etiqueta y padre de cada página; cada página pasa los nombres (`crumbNames`). En móvil se muestran `… › penúltimo › último`.
- **`/admin/ownerships`**: listado con filtro por estado (`?estado=`), 25 por página.
- **`/admin/audit`**: visor cronológico con filtro por área, 50 por página, actor por nombre, enlace al registro y detalle (de → a, motivo). Cada evento de auditoría guarda ahora `area`; una prueba estática exige que toda escritura use `auditEventFields`.
- La barra superior reserva el espacio de "+ Nuevo" y del buscador; el indicador `ES` sigue fijo hasta el paso E.

**Tareas del titular (producción):**

1. Crear los 3 índices nuevos en Cloud Shell (mismo proyecto que los de 2A-2):

```bash
gcloud firestore indexes composite create --project=<PROYECTO> --collection-group=ownerships --query-scope=COLLECTION --field-config=field-path=active,order=ascending --field-config=field-path=createdAt,order=descending
gcloud firestore indexes composite create --project=<PROYECTO> --collection-group=ownerships --query-scope=COLLECTION --field-config=field-path=active,order=ascending --field-config=field-path=status,order=ascending --field-config=field-path=createdAt,order=descending
gcloud firestore indexes composite create --project=<PROYECTO> --collection-group=auditEvents --query-scope=COLLECTION --field-config=field-path=area,order=ascending --field-config=field-path=createdAt,order=descending
```

2. Después de desplegar, completar `area` en los eventos existentes: `FIREBASE_PROJECT_ID=<PROYECTO> npm run migrate:audit-area` (simulación) y luego `FIREBASE_PROJECT_ID=<PROYECTO> npm run migrate:audit-area -- --yes`.

Estado en producción (14 nov): los 3 índices creados por el titular y migración `area` aplicada (6 eventos). Repetir `npm run migrate:audit-area -- --yes` después de desplegar 4A.

#### Avance registrado — 14 nov 2026 (paso 4B: "+ Nuevo")

Spec y plan: `docs/superpowers/specs/2026-11-14-admin-create-menu-4b-design.md`.

- Botón primario **"+ Nuevo"** en la barra superior (solo "+" en móvil) con menú: Nueva propiedad, Nueva persona, Nuevo contrato, Nueva titularidad, Nuevo usuario, filtrado por el permiso de cada rol; operations no ve el botón.
- **Con contexto de propiedad:** dentro de una propiedad aparece "Nueva unidad", y contrato y titularidad llegan con la propiedad precargada (`?propertyId=`).
- Las acciones viven en el manifiesto (`createActions`); una prueba estática exige que cada una abra una página que pide exactamente el mismo permiso. e2e por rol en `permissions.mjs`.

**Siguiente paso:** pieza 4C (buscador global).

#### Avance registrado — 14 nov 2026 (paso 4C: buscador global)

Spec y plan: `docs/superpowers/specs/2026-11-14-admin-global-search-4c-design.md`.

- **Caja de búsqueda en la barra superior** (lupa en móvil): busca en propiedades (nombre, código, dirección, ciudad), personas (nombre, correo, teléfono) y contratos (código, inquilino, propiedad, unidad) mientras se escribe, desde 2 caracteres, sin tildes. Hasta 5 resultados por grupo, teclado completo (↑/↓, Enter, Esc) y atajos `Ctrl/⌘+K` y `/`.
- **Página `/admin/buscar?q=`** con hasta 25 resultados por grupo y "Ver en la lista" hacia la lista filtrada de cada módulo.
- **Sin índices nuevos:** reutiliza las claves de búsqueda y los índices de cada lista. Si un módulo falla, los demás siguen respondiendo.
- API `GET /api/search` para todo el staff, limitada a los módulos que el rol puede ver; portales 403, anónimo 401. e2e `scripts/e2e/search.mjs`.

**Siguiente paso:** pieza 4E (selector ES/EN real y traducción de todo el admin), luego 2B (invitaciones).

#### Avance registrado — 15 nov 2026 (paso 4E-1: idioma, infraestructura y marco)

Spec y plan: `docs/superpowers/specs/2026-11-15-admin-i18n-4e-design.md` (6 tandas, 4E-1 a 4E-6).

- **Selector ES | EN real** en la barra del admin, en los portales, en `/acceder` y en el inicio de sesión. Guarda la preferencia en la cookie `mghpm_locale` y en `users/{uid}.locale`; al iniciar sesión en otro dispositivo se restaura. Sin preferencia, se usa el idioma del navegador; si no, español. Las URLs no cambian.
- **Diccionarios propios tipados** (`src/lib/i18n/dictionaries/es.ts` y `en.ts`): si falta una traducción, el typecheck falla. Formatos de fecha, moneda y número por idioma (`createFormatter`).
- **Traducido en esta tanda:** barra superior, menú, migas, "+ Nuevo", buscador (caja y página), `/acceder`, inicio de sesión, `/espacios`, onboarding, pantallas de acceso denegado, marco, inicio y perfil de los portales. El manifiesto ya no tiene textos: usa `t.routes`.
- **Al cliente solo viajan los textos que usa:** el layout raíz manda lo común y `/admin` agrega lo de la barra; las páginas con formularios agregan los suyos con `<ClientTexts>`.
- Pruebas: claves iguales en ambos idiomas, prueba estática "sin texto suelto" en los archivos ya traducidos, e2e `scripts/e2e/i18n.mjs` (13 suites en verde).

**Siguiente paso:** 4E-2 (propiedades, asistente, unidades e imágenes).

#### ▶ Punto de partida para retomar (cierre del 15 nov 2026)

**Estado del código:** todo commiteado en `main`: `2e9c8c5` (4A, 4B, 4C y 4E-1) sobre `74f52ad` (paso 3). Sin push todavía. Todo en verde: typecheck, lint, 102 unitarias y 13 suites e2e.

**Al retomar, en este orden:**
1. Revisar los resultados de la guía de pruebas manuales (`docs/pruebas/2026-11-15-guia-de-pruebas-mvp.md`, tabla "Hallazgos") si el titular ya la completó, y armar el lote de correcciones.
2. Continuar 4E por tandas (spec: `docs/superpowers/specs/2026-11-15-admin-i18n-4e-design.md`):
   - 4E-2 Propiedades, asistente, unidades e imágenes.
   - 4E-3 Personas (vistas propietario/inquilino) y titularidades.
   - 4E-4 Contratos.
   - 4E-5 Usuarios y accesos, solicitudes de estadía, auditoría, panel principal y páginas de contenido de portales.
   - 4E-6 Validación (zod con códigos) y mensajes de las APIs.
   - En cada tanda: mover textos a `es.ts`/`en.ts`, server con `getI18n()`, formularios cliente envueltos en `<ClientTexts namespaces={[...]}>` con `useI18n()`, fechas y montos con `format`, y agregar sus carpetas a `covered` en `src/lib/i18n/no-hardcoded-text.test.ts`.
3. Luego 2B (invitaciones con aceptación explícita) y los bloques 3–9 de la Ruta al MVP.

**Tareas del titular pendientes:**
- Hacer commit cuando lo decida (el asistente no hace commit sin pedido explícito).
- Desplegar y, después del despliegue, volver a correr `npm run migrate:audit-area -- --yes` (en Windows: `set FIREBASE_PROJECT_ID=property-management-a8d5f`, `set GOOGLE_APPLICATION_CREDENTIALS=config\…json` antes del comando).
- Recorrido manual con la guía de pruebas.
- Validar el CI en GitHub con el próximo push.

**Recordatorios técnicos:** las e2e se corren con `npx --yes firebase-tools@14.1.0 emulators:exec --project demo-mghpm --only auth,firestore "bash scripts/ci/run-e2e.sh"`; en Windows, después de **cada** corrida (también si falla) hay que detener el `java.exe` del emulador de Firestore (puerto 8080) y el servidor del puerto 3100.

## 7. Seguridad, pruebas y calidad obligatorias

### Seguridad y privacidad

- Matriz de autorización con casos de usuario anónimo, staff, manager, organization owner, owner, tenant, vendor y guest; cubrir lectura, creación, edición, exportación, aprobación y acceso a adjuntos.
- Tests de aislamiento entre dos organizaciones y entre dos personas/registros del mismo rol. Probar acceso directo por URL/ID, queries, exportaciones, descargas y funciones asíncronas.
- Revisar Security Rules de Firestore y Storage con Emulator Suite; reglas negativas incluidas en CI. Admin SDK requiere verificaciones equivalentes en cada servicio.
- Proteger cookies, CSRF según mecanismo de escritura, validación de origen en webhooks, secretos administrados fuera de código y rotación de credenciales.
- Minimización/retención de PII, borrado conforme a políticas, URLs firmadas de corta duración para archivos privados y auditoría de exportaciones/descargas.
- No registrar tokens, credenciales, números financieros, documentos de identidad ni contenido sensible.

### Pruebas

- Unitarias: validadores, estados de workflows, cálculo de importes, permisos e invariantes.
- Integración: casos de uso con Emulator Suite; transacciones, duplicados, concurrencia, reglas de Firestore/Storage y errores de proveedor.
- E2E: flujos por rol desde login hasta conclusión (crear propiedad, aprobar solicitud/crear lease, registrar pago, abrir work order, completar inspección, reservar estancia).
- UI: pruebas de accesibilidad y estados vacíos, loading, error, éxito, responsive, ES/EN y navegación por teclado.
- CI: lint, typecheck, unitarias, reglas emuladas e integración; E2E representativo en staging antes de publicar.
- Observabilidad: métricas de errores, latencia, costos/lecturas Firestore, fallos de pagos/webhooks, alertas y trazas con IDs correlacionables no sensibles.

### Criterio común de “pantalla funcional”

Una pantalla solo se considera implementada cuando tiene ruta protegida, permisos comprobados en servidor, datos reales o estado vacío honesto, validación, acciones persistidas y auditadas, manejo de errores, responsive, i18n, pruebas y enlaces a registros relacionados. Un toast o un cambio local de estado no cuenta como persistencia.

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El diseño supera ampliamente la funcionalidad real y los prototipos contienen datos/acciones simulados. | Entregar por workflows verticales, priorizar MVP y validar cada acción con criterios; no construir 67 pantallas desconectadas. |
| Firestore no ofrece joins ni restricciones relacionales; consultas mal diseñadas aumentan costos o filtran datos. | Modelar desde consultas, reglas deny-by-default, índices en CI, proyecciones limitadas y pruebas de aislamiento por objeto. |
| El Admin SDK omite Security Rules. | Acceso solo desde servidor y autorización explícita en cada caso de uso; pruebas de integración negativas. |
| Contabilidad, depósitos y pagos requieren consistencia y cumplimiento. | Ledger append-only, idempotencia, conciliación, revisión profesional y proveedor externo; aplazar payroll/funciones reguladas hasta aprobar el alcance. |
| Dependencia de proveedor para pagos, identidad, firma, mensajería y canales. | Decidir proveedores y sandbox temprano; adaptadores pequeños, webhooks idempotentes y estados visibles de fallo. |
| Datos sensibles de identidad, ingresos, contratos y banca. | Minimización, cifrado/transporte, scopes estrictos, Storage privado, retención y auditoría de acceso. |
| Consultas y agregados de dashboard pueden producir costos inesperados. | Estimar volumen, limitar lecturas, paginar y observar costo por organización/operación desde staging. |
| El handoff menciona ES-DO/EN-US y monedas separadas, mientras las imágenes mezclan idioma/formato. | Fijar locales, zonas horarias, moneda y formato por organización/registro durante fase 0; no inferirlos del idioma de la UI. |

## 9. Backlog de MVP recomendado

Para publicar una primera versión útil, limitar el MVP a:

1. Auth, organizaciones, membresías, roles y auditoría.
2. Propiedades, unidades, propietarios, inquilinos y documentos básicos.
3. Contratos y workflow de solicitud con revisión manual.
4. Cargos, pagos registrados manualmente y ledger auditable. Activar cobro online solo después de validar proveedor, idempotencia y sandbox.
5. Portal de propietario e inquilino limitado a los registros propios.
6. Mantenimiento: solicitudes, órdenes de trabajo, asignación y cierre.
7. Dashboard operativo básico y notificaciones in-app.

> **Superado el 12 nov 2026:** la lista anterior es la propuesta original. El alcance vigente del MVP es la "Ruta al MVP — decisiones del 12 nov 2026" (§6), que **incluye** las reservas de corta estancia y los pagos por transferencia verificada.

Quedan fuera del MVP: cobro en línea con tarjeta, payroll, conciliación bancaria automática, IA, integraciones de canal (Airbnb, Vrbo, Booking) y decisiones KYC automatizadas.

## 10. Checklist de decisiones que bloquean la construcción

- [x] ¿La aplicación es multi-tenant por organización desde el primer día? ¿Un usuario puede pertenecer a varias? — Sí a ambas (2A-1).
- [x] ¿Qué roles exactos existen y quién invita/aprueba a cada persona? — `org_owner`, `admin`, `manager`, `operations` + portales; invitan `org_owner` y `admin` (2A-1/2A-2, 2B).
- [x] ¿Qué tipos de alquiler se incluyen en el MVP: largo plazo, corto plazo o ambos? — Ambos (12 nov 2026).
- [ ] ¿Qué monedas, países, zona horaria por propiedad y formatos contables se soportan?
- [x] ¿Qué procesador maneja rentas, depósitos, reembolsos y reservas? — Ninguno en el MVP: transferencias bancarias registradas y verificadas por el staff (12 nov 2026). Tarjeta fuera del MVP.
- [ ] ¿Cuál es la política legal para verificación de identidad, screening y retención de documentos?
- [ ] ¿Se requiere firma electrónica? ¿Qué proveedor y validez jurisdiccional?
- [ ] ¿Qué hosting y región Firebase se usarán? ¿Cuáles son presupuesto, límites y objetivos de disponibilidad?
- [ ] ¿Existe algún dato real que migrar? ¿Cuál es su origen, calidad, propietario y consentimiento?
- [ ] ¿Payroll, bank reconciliation y financial close significan automatización real o solo registro/reporting?

## 11. Referencias del handoff

- Inventario y estados por pantalla: [SCREENS.md](../SCREENS.md).
- Contexto, tokens visuales y reglas comunes: [README.md](../README.md).
- Hallazgos y roadmap del sistema de referencia: [MGHPM-360-Audit-v3.8.1.md](./MGHPM-360-Audit-v3.8.1.md).
- Riesgos y matriz de roles de la revisión estática: [MGHPM-Fase-2A.1-Seguridad.md](./MGHPM-Fase-2A.1-Seguridad.md).
- Prototipos visuales: `../prototypes/` (referencia solamente; datos simulados).
