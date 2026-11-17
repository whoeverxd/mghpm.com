# Seguridad, Roles y Aislamiento de Datos — Reporte A–G

_MGHPM • Fase 2A.1 • 6 de octubre de 2026 • Revisión estática • Sin cambios de archivos ni permisos • Exportado 12 oct 2026_

Revisión del código real en MGHPM-Corecciones (backend **disenio/back-mghpm** y **frontend/src**). Ninguna prueba fue ejecutada: no hay backend ni PostgreSQL disponibles en este entorno. Ningún hallazgo se marca como “pasado”. Viene de la Auditoría 360° (F-03) — ver `MGHPM-360-Audit-v3.8.1.md`.

## Niveles de evidencia

- **VERIFICADO POR CÓDIGO** — Leído directamente en el código: la ruta de ejecución es inequívoca sin datos.
- **INFERIDO POR CÓDIGO** — Deducido de código parcial o de la ausencia de una validación que no se localizó.
- **REQUIERE PRUEBA EN RUNTIME** — Depende de la BD, la configuración del Hub, el email o datos reales. Solo se confirma ejecutando.

## KPIs

| Indicador | Valor |
|---|---|
| Hallazgos | 24 |
| P0 | 5 |
| P1 | 7 |
| P2 | 10 |
| P3 | 2 |
| Verificados por código | 19 |
| Inferidos | 2 |
| Requieren runtime | 3 |
| Discrepancias menú/ruta/API | 11 |
| Pruebas ejecutadas | 0 |

## Resumen

- **El aislamiento entre organizaciones se sostiene casi siempre** — middleware + filtros por organización en todas las vistas revisadas. Excepción: PeopleDetailView devuelve PII de usuarios de cualquier organización (S-05).
- **Las fugas reales son dentro de la organización, entre roles** — dashboard, informes resumen, informes generados y comprobantes de pago responden datos de toda la organización a owner/tenant/agent/comercial (S-01…S-04).
- **Listado scoped, detalle no** — propiedades, unidades y personas filtran en el listado pero no en detalle, bulk o estadísticas (S-06…S-09).
- **El gate de verificación de identidad solo existe en el frontend** — can() no lo aplica (S-10).
- **Banca y memberships están bien protegidos en lo esencial** — cuentas enmascaradas, verificación previa obligatoria, membresías forzadas a la organización del actor; pendientes menores S-19, S-21.

## Índice

- [A0. Roles detectados en el código](#a0-roles-detectados-en-el-código)
- [A. Matriz de roles / capabilities](#a-matriz-de-roles--capabilities)
- [A2. Menú vs ruta frontend vs backend](#a2-menú-vs-ruta-frontend-vs-backend)
- [B. Fallas encontradas](#b-fallas-encontradas)
- [C. Casos cross-organización](#c-casos-cross-organización)
- [D. Casos de over-permission](#d-casos-de-over-permission)
- [E. Casos de under-permission](#e-casos-de-under-permission)
- [D2. Agent, operativo y comercial — lo que realmente pueden ver (§4–5)](#d2-agent-operativo-y-comercial--lo-que-realmente-pueden-ver-45)
- [D3. Fail-closed (§8)](#d3-fail-closed-8)
- [F. Tests que faltan](#f-tests-que-faltan)
- [G. Archivos que se propone modificar (pendiente de aprobación)](#g-archivos-que-se-propone-modificar-pendiente-de-aprobación)
- [H. Pruebas que deben ejecutarse fuera de Claude Design](#h-pruebas-que-deben-ejecutarse-fuera-de-claude-design)

## A0. Roles detectados en el código

_Antes de cambiar nada: roles reales frente a los 9 solicitados._

| Rol | Detalle | Fuente | Evidencia |
|---|---|---|---|
| org_owner | admin, manager, owner, tenant, agent, operativo, comercial, verification_reviewer | ROLE_CAPABILITIES | VERIFICADO POR CÓDIGO |
| viewer | Eliminado; UserRole históricos con key "viewer" quedan sin capacidades (deny by default). _read_only_role_capabilities() sigue en el código sin uso. | permissions.py (comentario) | VERIFICADO POR CÓDIGO |
| Nombres de spec | property_manager → manager, maintenance_technician → operativo, sales_acquisition → comercial, Property Owner → owner, Organization Owner → org_owner. Solo aparecen en comentarios, no como role.key. | permissions.py, portal_scope.py | VERIFICADO POR CÓDIGO |
| Role.capabilities en BD | Si el campo no es null, sustituye ROLE_CAPABILITIES. La matriz real depende de la BD (migraciones 0009, 0016, 0022, 0023, 0026, 0027). | _capabilities_set_for_role() | REQUIERE PRUEBA EN RUNTIME |

## A. Matriz de roles / capabilities

_Solo lo definido en ROLE_CAPABILITIES (apps/users/permissions.py). No refleja el scoping de queryset ni la BD (S-22). Delete y Approve usan la clave real cuando difiere._

| Rol | Recurso | Read | Create | Update | Delete | Export | Approve |
|---|---|---|---|---|---|---|---|
| org_owner | Todos los recursos | ✓ (*) | ✓ (*) | ✓ (*) | ✓ (*) | ✓ (*) | ✓ (*) |
| org_owner | Excluido de * | hub.read, api_docs.read, role.manage_system (solo is_staff/is_superuser) | — | — | — | — | — |
| admin | organization | ✓ | — | ✓ | — | — | — |
| admin | membership | ✓ | ✓ membership.invite | ✓ | ✓ destroy → membership.update | — | role.assign |
| admin | property | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| admin | owner (people) | ✓ people.read + people.owner.read | — | ✓ people.update | — | ✓ people.export | — |
| admin | tenant (people) | ✓ people.read | — | ✓ people.update | — | ✓ tenant.export_pdf/excel | — |
| admin | lease | ✓ | ✓ | ✓ | ✓ | ✓ | lease_renewal.sign, .activate |
| admin | reservation | ✓ | ✓ | ✓ | ✓ | ✓ + export_pdf/excel | — |
| admin | payment | ✓ | ✓ | ✓ | ✓ | ✓ | payment.refund_approve |
| admin | expense | ✓ finance.read | ✓ payment.create | ✓ payment.update (void) | — | ✓ finance.export | — |
| admin | work_order | ✓ | ✓ | ✓ | ✓ | ✓ | work_order.assign (sin approve_cost) |
| admin | document | ✓ | ✓ | ✓ | ✓ DELETE → document.update | ✓ | document.review |
| admin | report | ✓ | ✓ export_pdf/excel (genera) | — | — | ✓ download | — |
| admin | banking_details | — | — | — | — | — | banking_details.review |
| manager | organization • membership | — | — | — | — | — | — |
| manager | property | ✓ | ✓ | ✓ | — (soft-delete usa property.update) | ✓ | — |
| manager | owner (people) | ✓ people.read + people.owner.read | — | ✓ people.update | — | ✓ people.export | — |
| manager | tenant (people) | ✓ people.read | — | ✓ people.update | — | ✓ tenant.export_pdf/excel | — |
| manager | lease | ✓ | ✓ | ✓ | — | ✓ | lease_renewal.sign, .activate |
| manager | reservation | ✓ | ✓ | ✓ | ✓ | ✓ + export_pdf/excel | — |
| manager | payment | ✓ | ✓ | ✓ | — | ✓ | — |
| manager | expense | ✓ finance.read | ✓ payment.create | ✓ payment.update (void) | — | ✓ finance.export | — |
| manager | work_order | ✓ | ✓ | ✓ | — | ✓ | work_order.assign |
| manager | document | ✓ | ✓ | ✓ | ✓ DELETE → document.update | ✓ | — |
| manager | report | ✓ | ✓ export_pdf/excel | — | — | ✓ download | — |
| manager | banking_details | — | — | — | — | — | banking_details.review |
| owner | property | ✓ | — | — | — | — | — |
| owner | lease | ✓ | — | — | — | ✓ | lease_renewal.owner_approve |
| owner | payment | ✓ | — | — | — | ✓ | — |
| owner | expense | ✓ finance.read | — | — | — | ✓ finance.export | — |
| owner | work_order | ✓ | — | — | — | — | work_order.approve_cost |
| owner | document | ✓ | — | — | — | — | — |
| owner | report | ✓ | ✓ export_pdf/excel | — | — | ✓ download | — |
| owner | banking_details | ✓ read_self | — | ✓ update_self (solicitud) | — | — | — |
| owner | organization • membership • reservation • owner/tenant (people) | — | — | — | — | — | — |
| tenant | property | ✓ | — | — | — | — | — |
| tenant | lease | ✓ | — | — | — | ✓ | lease_renewal.tenant_accept |
| tenant | reservation | ✓ | ✓ | — | — | ✓ | — |
| tenant | payment | ✓ | ✓ | — | — | ✓ | — |
| tenant | work_order | ✓ | ✓ (+ comment, attachment) | — | — | — | — |
| tenant | document | ✓ | ✓ | — | — | — | — |
| tenant | expense • report • banking • people • organization • membership | — | — | — | — | — | — |
| agent | property | ✓ | ✓ | ✓ | — | ✓ | — |
| agent | owner / tenant (people) | ✓ people.read | — | ✓ people.update | — | ✓ tenant.export_pdf/excel | — |
| agent | lease | ✓ | — (lease_renewal.create) | ✓ | — | ✓ | lease_renewal.submit |
| agent | reservation | ✓ | ✓ | ✓ | — | ✓ + export_pdf/excel | — |
| agent | payment | ✓ | — | — | — | — | — |
| agent | work_order | ✓ | ✓ | ✓ | — | ✓ | — |
| agent | document | ✓ | ✓ | ✓ | — | ✓ | — |
| agent | expense • report • banking • organization • membership | — | — | — | — | — | — |
| operativo | work_order | ✓ | — | ✓ (+ comment, attachment) | — | — | — |
| operativo | document | ✓ | ✓ | ✓ | — | — | — |
| operativo | resto de recursos | — | — | — | — | — | — |
| comercial | property | ✓ | — | — | — | — | — |
| comercial | reservation | ✓ | ✓ | ✓ | — | export_pdf/excel | — |
| comercial | document | ✓ | ✓ | ✓ | — | — | — |
| comercial | resto de recursos | — | — | — | — | — | — |
| verification_reviewer | document / identidad | — | — | — | — | — | document.review, verification.review/approve/reject/request_correction |
| verification_reviewer | resto de recursos | — | — | — | — | — | — |

## A2. Menú vs ruta frontend vs backend

_NAV_ITEM_CAPABILITY y ADMIN_ROUTE_CAPABILITY (frontend/src/config/admin/navPermissions.ts) frente al required_action real de la vista._

| Página | Permiso menú | Permiso ruta | Permiso backend | Estado | Problema |
|---|---|---|---|---|---|
| Tareas (Tasks) | work_order.read | task.read | TaskListCreateView: task.read | DISCREPANCIA | owner y tenant tienen work_order.read sin task.read: ven el ítem y la ruta los bloquea. |
| Propietarios (Owners) | people.owner.read | people.read | PeopleListView: people.read | DISCREPANCIA | people.owner.read no se verifica en backend. Hoy solo admin/manager la tienen, junto con people.read; un rol personalizado con solo people.owner.read vería el ítem y recibiría 403. |
| Directorio (Directory) | people.directory.read | people.read | PeopleDirectoryView: people.read | DISCREPANCIA | agent: menú oculto, pero ruta y API abiertas → sobre-permiso real (S-09). |
| Mantenimiento | work_order.create | work_order.create | WorkOrderListCreateView GET: work_order.read | DISCREPANCIA | owner (work_order.read + approve_cost) no ve Mantenimiento y no puede aprobar costos desde la UI. |
| Proveedores | people.read | people.read | Vendor*View: vendor.read | DISCREPANCIA | agent ve el ítem (people.read) pero la API responde 403 (sin vendor.read). |
| Panel (Dashboard) | dashboard.read | dashboard.read | DashboardSummaryView: property.read | DISCREPANCIA | La API usa una capacidad más amplia que la ruta (S-01). |
| Finanzas | finance.read | finance.read | Ledger consume /reports/: report.read | DISCREPANCIA | owner entra y ve informes generados de toda la organización (S-03). |
| Informes | report.read | report.read | summary views: report.read sin scope | DISCREPANCIA | Misma capacidad en las tres capas, pero el backend no recorta por rol (S-02). |
| Documentos | document.read | document.read | Document*View: document.read + rama por rol | DISCREPANCIA | org_owner, operativo y comercial ven 0 registros (S-13). |
| Revisión de identidad | document.review | document.review | IdentityVerificationPendingListView: document.review | DISCREPANCIA | verification.* existe pero no se usa; admin revisa sin verification_reviewer (S-20). |
| Editar pago | — | payment.update (ADMIN_ROUTE_CAPABILITY) | — | DISCREPANCIA | Capacidad declarada para una ruta que no está registrada en AdminApp.tsx. |
| Hub | hub.read | hub.read | IsAdminUser | COHERENTE | Solo staff/superuser en las tres capas. |
| Pagos | payment.read | payment.read | PaymentList: payment.read + scope_payments | COHERENTE | Listado coherente; el comprobante no (S-04). |
| Contratos | lease.read | lease.read | leases_for_org → scope_leases | COHERENTE | — |

## B. Fallas encontradas

_Archivo | función/clase | capability | problema | severidad, con el nivel de evidencia de cada una._

| ID | Sev. | Evidencia | Archivo | Función / clase | Capability | Problema |
|---|---|---|---|---|---|---|
| S-01 | P0 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/core/views.py | DashboardSummaryView.get → get_dashboard_summary(organization) | property.read | KPIs, morosidad, vencimientos, ocupación y gráficos de toda la organización, sin scoping. property.read lo tienen owner, tenant, agent y comercial. El frontend protege la ruta con dashboard.read: la API queda abierta. |
| S-02 | P0 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/reports/views.py | FinancialSummaryView, CatalogCountsView, OccupancySummaryView, MaintenanceSummaryView, ReservationsSummaryView, TenantsSummaryView | report.read | summary_services.build_* reciben solo organization. owner (report.read) obtiene finanzas, mantenimiento, reservaciones e inquilinos de toda la organización. |
| S-03 | P0 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/reports/views.py • apps/reports/repositories.py | ReportListCreateView.get_queryset (queryset_for_org) • ReportDownloadView.get (filter org, pk) | report.read • report.download | owner lista y descarga cualquier informe generado en la organización, incluidos estados de otros propietarios, por ID. |
| S-04 | P0 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/billing/views.py | PaymentReceiptView.get → Payment.objects.filter(organization, pk) | payment.export | Sin scope_payments. tenant y owner tienen payment.export: IDOR intra-org — comprobante PDF de cualquier pago (inquilino, monto, propiedad) cambiando el ID. |
| S-05 | P0 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/people/views.py | PeopleDetailView.get → User.objects.filter(id=user_id) | people.read | Sin filtro por membresía: nombre, email, teléfono y avatar de usuarios de CUALQUIER organización (cross-org PII). Afecta admin, manager y agent. |
| S-06 | P1 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/properties/views.py | PropertyDetailView.get_queryset (solo organization) | property.read • property.update | El listado usa scope_properties, el detalle no. tenant/owner/comercial leen cualquier propiedad (owner, tenant_active, vendors, estimated_value). agent edita y archiva cualquier propiedad, no solo donde es listing_agent. |
| S-07 | P1 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/properties/views.py | PropertyBulkActionView, PropertyDuplicateView, UnitDetailView, PropertyUnitsListCreateView | property.update • property.create • property.read | Filtro solo por organización: agent activa, desactiva, archiva, duplica y edita unidades de cualquier propiedad. Purge sí exige property.delete. |
| S-08 | P1 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/properties/views.py | OrganizationUnitsListView, PropertyPortfolioStatsView | property.read | Todas las unidades y KPIs del portafolio (suma de estimated_value y renta de mercado) para owner, tenant, agent y comercial. |
| S-09 | P1 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/people/views.py | PeopleDirectoryView, PeopleSummaryView, PeopleDirectoryOptionsView | people.read | Directorio completo (propietarios, inquilinos, staff, proveedores con contacto) para agent. El menú oculta Directorio al agent (people.directory.read) pero ruta y API lo entregan. |
| S-10 | P1 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/apps/users/permissions.py | can() vs effective_capabilities_for_user() | todas | apply_capability_gate (identidad no verificada) solo recorta lo que se envía al frontend. can(), usado por HasOrganizationAction, no aplica el gate: un miembro no verificado conserva todas sus capacidades en la API. |
| S-11 | P1 | INFERIDO POR CÓDIGO | disenio/back-mghpm/apps/users/permissions.py | _hub_allows() en HasOrganizationAction y PropertyBulkActionView | token Hub | Si el token Hub trae actions ["*"] o la acción, se concede sin roles locales y sin excluir hub.read, api_docs.read ni role.manage_system. La lista orgs es opcional. Depende de lo que emita el Hub. |
| S-12 | P1 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/core/views.py | DocumentListView / DocumentDetailView.get_queryset | document.read | tenant ve todo documento ligado a property__tenant_active, incluidos documentos del propietario sobre esa propiedad. No existe clasificación de visibilidad por documento. |
| S-13 | P2 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/core/views.py | DocumentListView / DocumentDetailView (rama staff) | document.read | La rama de acceso total es superuser/admin/manager; org_owner sin rol admin ve 0 documentos. operativo, comercial y verification_reviewer reciben qs.none() pese a tener document.*. |
| S-14 | P2 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/core/serializers.py | DocumentUploadSerializer.validate_property / validate_lease | document.create | Valida misma organización pero no acceso del usuario. Un tenant puede adjuntar un documento a la propiedad o contrato de otro, y aparece en la lista del otro. |
| S-15 | P2 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/apps/users/portal_scope.py | operational_property_picker_queryset (rama final) | work_order.create • reservation.create | agent, operativo y comercial reciben TODAS las propiedades de la organización; contradice la regla deny-by-default del módulo. |
| S-16 | P2 | INFERIDO POR CÓDIGO | disenio/back-mghpm/api/v1/work_orders/serializers.py | WorkOrderCreateSerializer | work_order.create | No se encontró validación de que la propiedad pertenezca al picker del usuario: un agent podría crear WO en cualquier propiedad de la organización. |
| S-17 | P2 | REQUIERE PRUEBA EN RUNTIME | disenio/back-mghpm/apps/users/portal_scope.py | scope_reservations / scope_payments (rama tenant) | reservation.read • payment.read | tenant ve reservas y pagos cuyo guest_email coincide con su email. Si el email no se verifica al registrarse, el acceso es por coincidencia de texto. |
| S-18 | P2 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/apps/users/portal_scope.py | scope_work_orders (tenant) • scope_expenses (owner) | work_order.read • finance.read | tenant solo ve WOs que creó él (no los de su unidad creados por staff). owner solo ve gastos ligados vía work_order__property; gastos de su propiedad sin WO quedan invisibles. |
| S-19 | P2 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/billing/bank_account_views.py | OwnerBankAccountListCreateView | banking_details.read_self | admin y manager tienen banking_details.review pero no read_self: el GET (cuyo queryset prevé staff) les da 403; solo revisan por PATCH a un ID conocido. Enmascarado y verificación previa: correctos. |
| S-20 | P2 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/users/identity_views.py | IdentityVerificationPendingListView | document.review | admin tiene document.review sin el rol verification_reviewer y puede revisar identidades. La spec (comentario en permissions.py) reserva verification.* al rol complementario. Las claves verification.* no se usan en esta vista. |
| S-21 | P2 | REQUIERE PRUEBA EN RUNTIME | disenio/back-mghpm/api/v1/organizations/views.py | MembershipViewSet.perform_create | membership.invite | Si el email ya existe en la plataforma, crea la membresía directamente sin aceptación del usuario. Confirmar status inicial. |
| S-22 | P2 | REQUIERE PRUEBA EN RUNTIME | disenio/back-mghpm/apps/users/permissions.py | _capabilities_set_for_role() | — | Role.capabilities en BD sustituye el código. Role es catálogo global (sin FK a organización): cambiar un rol afecta a todas las organizaciones. Comparar BD vs ROLE_CAPABILITIES. |
| S-23 | P3 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/api/v1/properties/views.py | PropertyDetailView.delete / perform_destroy | property.update | El DELETE (archivo lógico) exige property.update; property.delete solo aplica a purge masivo. |
| S-24 | P3 | VERIFICADO POR CÓDIGO | disenio/back-mghpm/apps/users/capability_registry.py | people.owner.read, people.directory.read, report.generate | — | Claves que ningún endpoint verifica; solo se usan para mostrar el menú. |

## C. Casos cross-organización

_Usuario de la Organización A frente a registros de la Organización B. 404 = no revelar existencia; 403 = sin capacidad._

| Recurso | Caso | Esperado | Comportamiento en código | Estado | Evidencia |
|---|---|---|---|---|---|
| Cabecera X-Organization | Usuario de A envía X-Organization de B | 403 | OrganizationContextMiddleware: sin membresía activa → 403; org inexistente → 404 | AISLADO | VERIFICADO POR CÓDIGO |
| Properties | Leer, editar o archivar ID de B | 404 | List, Detail, Bulk, Units y Duplicate filtran organization=request.organization | AISLADO | VERIFICADO POR CÓDIGO |
| Owners / Tenants (listado) | Listar personas de B | Sin datos de B | PeopleRepository.*_queryset filtran por organización | AISLADO | VERIFICADO POR CÓDIGO |
| People detalle | GET /people/{id_de_B}/ | 404 | User.objects.filter(id=...) sin membresía → 200 con PII | FUGA | VERIFICADO POR CÓDIGO |
| Leases | Leer o editar ID de B | 404 | leases_for_org(organization) + scope_leases | AISLADO | VERIFICADO POR CÓDIGO |
| Leases create | property_id / tenant_id de B en POST | 400 | services.create_lease(organization=request.organization): falta confirmar que valida property y tenant de la misma org | SIN VALIDAR | REQUIERE PRUEBA EN RUNTIME |
| Payments | Leer, recibo o reembolso de ID de B | 404 | Filtran organization=request.organization | AISLADO | VERIFICADO POR CÓDIGO |
| Payments create | lease / reservation / document de B en POST | 400 | PaymentCreateSerializer.validate: organization_id != org → error | AISLADO | VERIFICADO POR CÓDIGO |
| Expenses create | vendor / work_order / document de B | 400 | ExpenseCreateSerializer.validate: organization_id != org → error | AISLADO | VERIFICADO POR CÓDIGO |
| Work Orders | Leer o editar ID de B | 404 | WorkOrder.objects.filter(organization=org) + scope | AISLADO | VERIFICADO POR CÓDIGO |
| Work Orders create | property de B en POST | 400 | No localizada la validación de property | SIN VALIDAR | REQUIERE PRUEBA EN RUNTIME |
| Reservations | Leer o editar ID de B | 404 | scope_reservations sobre queryset de la org | AISLADO | VERIFICADO POR CÓDIGO |
| Documents upload | category / property / lease de B | 400 | validate_category, validate_property, validate_lease comparan organization_id | AISLADO | VERIFICADO POR CÓDIGO |
| Documents | Leer o editar ID de B | 404 | Document.objects.filter(organization=organization) | AISLADO | VERIFICADO POR CÓDIGO |
| Memberships | Listar, editar o borrar de B; organization en payload | 404 • org forzada | get_queryset por org; perform_create usa request.organization (test existente) | AISLADO | VERIFICADO POR CÓDIGO |
| Reports | Descargar informe de B | 404 | GeneratedReport.objects.filter(organization, pk) | AISLADO | VERIFICADO POR CÓDIGO |
| Banking | Revisar cuenta de B | 404 | OwnerBankAccount.objects.filter(organization=org, pk) | AISLADO | VERIFICADO POR CÓDIGO |
| Roles (catálogo global) | admin de A cambia capacidades de un rol | Solo staff | CanManageRoles exige role.*_custom; el cambio afecta a todas las organizaciones | SIN VALIDAR | REQUIERE PRUEBA EN RUNTIME |
| Hub token | Token Hub sin lista orgs | Denegado fuera de su org | Membresía exigida por middleware; capacidades concedidas por claims (S-11) | SIN VALIDAR | REQUIERE PRUEBA EN RUNTIME |

## D. Casos de over-permission

_Acceso real mayor que el que el rol debería tener (mínimo privilegio)._

| Rol | Recurso | Acceso real | Debería | Ref. | Evidencia |
|---|---|---|---|---|---|
| owner, tenant, agent, comercial | Dashboard financiero de la org | Lectura completa vía property.read | Solo staff (dashboard.read) o recortado al alcance del rol | S-01 | VERIFICADO POR CÓDIGO |
| owner | Informes resumen y generados | Toda la organización | Solo sus propiedades | S-02, S-03 | VERIFICADO POR CÓDIGO |
| owner, tenant | Comprobantes de pago | Cualquier pago de la org por ID | Solo pagos en su scope | S-04 | VERIFICADO POR CÓDIGO |
| admin, manager, agent | Datos personales de usuarios | Cualquier usuario de la plataforma | Solo miembros de la org (y en scope) | S-05 | VERIFICADO POR CÓDIGO |
| tenant, owner, comercial | Detalle de propiedad | Cualquier propiedad de la org | Solo propiedades en scope_properties | S-06 | VERIFICADO POR CÓDIGO |
| agent | Editar / archivar / duplicar propiedades y unidades | Toda la organización | Solo listing_agent=user | S-06, S-07 | VERIFICADO POR CÓDIGO |
| owner, tenant, agent, comercial | Unidades y estadísticas de portafolio | Toda la organización | Recortado o solo staff | S-08 | VERIFICADO POR CÓDIGO |
| agent | Directorio de personas | Todos los propietarios, inquilinos, staff y proveedores | Personas de sus propiedades | S-09 | VERIFICADO POR CÓDIGO |
| Miembros sin verificar | API completa | Todas las capacidades de su rol | LIMITED_CAPABILITIES_WHILE_UNVERIFIED | S-10 | VERIFICADO POR CÓDIGO |
| Portador de token Hub | Cualquier acción | Según claims, sin roles locales | Intersección con roles locales y exclusión de capacidades de plataforma | S-11 | INFERIDO POR CÓDIGO |
| tenant | Documentos de la propiedad | Todos los documentos ligados a su unidad | Solo documentos marcados para el inquilino | S-12 | VERIFICADO POR CÓDIGO |
| tenant | Adjuntar documentos | A cualquier propiedad o contrato de la org | Solo a su contrato | S-14 | VERIFICADO POR CÓDIGO |
| agent, operativo, comercial | Selector de propiedades | Toda la organización | Deny-by-default / su scope | S-15, S-16 | VERIFICADO POR CÓDIGO |
| admin | Revisión de identidad | Puede aprobar sin rol verification_reviewer | Requerir verification.* | S-20 | VERIFICADO POR CÓDIGO |
| admin | Alta de membresía | Agrega usuarios existentes sin aceptación | Flujo de invitación | S-21 | REQUIERE PRUEBA EN RUNTIME |

## E. Casos de under-permission

_El rol tiene la capacidad pero no puede usarla, o el menú y la API no coinciden._

| Rol | Recurso | Hoy | Esperado | Ref. | Evidencia |
|---|---|---|---|---|---|
| org_owner (sin rol admin) | Documentos | Ve 0 | Acceso total | S-13 | VERIFICADO POR CÓDIGO |
| operativo, comercial, verification_reviewer | Documentos | qs.none() con document.read/create/update | Su alcance definido | S-13 | VERIFICADO POR CÓDIGO |
| admin, manager | Listado de cuentas bancarias pendientes | 403 (sin read_self) | Listar para revisar | S-19 | VERIFICADO POR CÓDIGO |
| tenant | WOs de su unidad creados por staff | Invisibles | Visibles | S-18 | VERIFICADO POR CÓDIGO |
| owner | Gastos de su propiedad sin WO | Invisibles | Visibles | S-18 | VERIFICADO POR CÓDIGO |
| owner | Menú Mantenimiento (aprobación de costos) | Oculto (exige work_order.create) | Visible en lectura | Menú vs ruta | VERIFICADO POR CÓDIGO |
| owner, tenant | Menú Tareas | Visible y bloqueado | Oculto o accesible | Menú vs ruta | VERIFICADO POR CÓDIGO |
| agent | Menú Proveedores | Visible, API 403 | Coherente | Menú vs ruta | VERIFICADO POR CÓDIGO |
| admin | Aprobar costo de WO | Sin work_order.approve_cost | Confirmar con negocio | — | VERIFICADO POR CÓDIGO |
| manager | Settings / Auditoría / Invitar | Sin organization.read ni membership.* | Confirmar con negocio | — | VERIFICADO POR CÓDIGO |

## D2. Agent, operativo y comercial — lo que realmente pueden ver (§4–5)

_Comparación de ROLE_CAPABILITIES con el scoping real de cada endpoint._

| Rol | Recurso | Capability | Scope real | Estado | Evidencia |
|---|---|---|---|---|---|
| agent | Propiedades | property.read/create/update/export | Listado: listing_agent=user • Detalle, bulk, unidades: toda la org | FUGA | VERIFICADO POR CÓDIGO |
| agent | Leads / aplicantes | — | No existe módulo de aplicaciones en código. Guests: rama agent en GuestViewSet (línea 99), sin confirmar | SIN VALIDAR | REQUIERE PRUEBA EN RUNTIME |
| agent | Tenants / owners | people.read, people.update | Directorio, resumen y detalle: toda la org (detalle: toda la plataforma) | FUGA | VERIFICADO POR CÓDIGO |
| agent | Exports de inquilinos | tenant.export_pdf/excel | scope_leases → propiedades listing_agent | AISLADO | VERIFICADO POR CÓDIGO |
| agent | Leases | lease.read/update/export | scope_leases; edición de contrato activo bloqueada en LeaseDetailView.update | AISLADO | VERIFICADO POR CÓDIGO |
| agent | Pagos | payment.read | scope_payments por listing_agent; sin payment.export, sin acceso a comprobantes | AISLADO | VERIFICADO POR CÓDIGO |
| agent | Información financiera | sin finance.* ni report.* | Dashboard financiero accesible vía property.read (S-01) | FUGA | VERIFICADO POR CÓDIGO |
| agent | Documentos | document.read/create/update/export | Solo los que subió él | AISLADO | VERIFICADO POR CÓDIGO |
| agent | Work orders | work_order.read/create/update/export | scope listing_agent; selector y creación: toda la org | FUGA | VERIFICADO POR CÓDIGO |
| operativo | Work orders / tareas | work_order.read/update, task.read/update | assigned_staff=user | AISLADO | VERIFICADO POR CÓDIGO |
| operativo | Documentos | document.read/create/update | qs.none() | SIN VALIDAR | VERIFICADO POR CÓDIGO |
| operativo | Finanzas, banca, salarios, administración | ninguna | Sin capacidades; no existe módulo de nómina en código | AISLADO | VERIFICADO POR CÓDIGO |
| comercial | Propiedades | property.read | Listado: acquisition_agent=user o vacantes activas • Detalle: toda la org (S-06) | FUGA | VERIFICADO POR CÓDIGO |
| comercial | Dashboard financiero | property.read | Toda la org (S-01) | FUGA | VERIFICADO POR CÓDIGO |
| comercial | Reservaciones / mensajes | reservation.*, message.* | guest_record__assigned_sales_user=user | AISLADO | VERIFICADO POR CÓDIGO |
| comercial | Pagos, banca, salarios | ninguna | Sin capacidades | AISLADO | VERIFICADO POR CÓDIGO |

## D3. Fail-closed (§8)

_Comportamiento cuando falta configuración, rama o capacidad._

| Mecanismo | Comportamiento | Resultado | Evidencia |
|---|---|---|---|
| HasOrganizationAction sin required_action | Deniega y registra warning | FAIL-CLOSED | VERIFICADO POR CÓDIGO • test existente |
| required_action dinámico (_ACTION_CAPABILITY.get / _METHOD_CAPABILITY.get) | Acción desconocida → None → denegado | FAIL-CLOSED | VERIFICADO POR CÓDIGO |
| Middleware sin organización / sin membresía | 404 / 403 JSON antes de la vista | FAIL-CLOSED | VERIFICADO POR CÓDIGO |
| Rutas exentas /users/roles/, /users/capabilities/ | CanManageRoles resuelve org desde cabecera y exige can() | FAIL-CLOSED | VERIFICADO POR CÓDIGO |
| scope_* sin rama para el rol | qs.none() | FAIL-CLOSED | VERIFICADO POR CÓDIGO |
| operational_property_picker_queryset sin rama | Devuelve todas las propiedades | FAIL-OPEN | VERIFICADO POR CÓDIGO (S-15) |
| Vistas que filtran solo por organización | Detail/Bulk/Units/Stats de propiedades, PeopleDetail, PaymentReceipt, reports summary, DashboardSummary | FAIL-OPEN | VERIFICADO POR CÓDIGO (S-01…S-09) |
| Gate de identidad | No aplicado en can() | FAIL-OPEN | VERIFICADO POR CÓDIGO (S-10) |
| Claims Hub | Pueden conceder sin roles locales | FAIL-OPEN | INFERIDO POR CÓDIGO (S-11) |
| Vistas AllowAny / IsAuthenticated sin acción | Invitaciones, registro, 2FA, contacto, países, CurrentUser; billing/views.py:945 AllowAny (webhook) — verificar firma | SIN VALIDAR | REQUIERE PRUEBA EN RUNTIME |

## F. Tests que faltan

_Cubren same-org allowed, cross-org denied, role allowed/denied, list y detail filtering, create/update tampering y exports._

| Test | Archivo propuesto | Cubre | Tipo |
|---|---|---|---|
| owner/tenant/agent/comercial GET /api/v1/dashboard summary → 403 o recortado | apps/core/tests/test_dashboard_scope.py | S-01 | Nuevo |
| owner A GET /reports/summary/{financial,occupancy,maintenance,reservations,tenants}/ no contiene datos de owner B | apps/reports/tests/test_reports_scope.py | S-02 | Nuevo |
| owner A GET /reports/ no lista informes de B; GET /reports/{id_B}/download/ → 404 | apps/reports/tests/test_reports_scope.py | S-03 | Nuevo |
| tenant A GET /billing/payments/{pago_de_B}/receipt/ → 404 | apps/billing/tests/test_receipt_scope.py | S-04 | Nuevo |
| admin org A GET /people/{user_org_B}/ → 404 | apps/people/tests/test_people_isolation.py | S-05 | Nuevo |
| tenant/owner GET /properties/{fuera_de_scope}/ → 404; agent PATCH/DELETE propiedad ajena → 404 | apps/properties/tests/test_property_scope.py | S-06 | Nuevo |
| agent POST /properties/bulk/ con IDs ajenos → 403/404; PATCH /units/{ajena}/ → 404 | apps/properties/tests/test_property_scope.py | S-07 | Nuevo |
| tenant GET /properties/units/ y /properties/stats/ → recortado o 403 | apps/properties/tests/test_property_scope.py | S-08 | Nuevo |
| agent GET /people/directory/ y /people/summary/ → recortado o 403 | apps/people/tests/test_people_isolation.py | S-09 | Nuevo |
| miembro con verification_status != VERIFIED llama endpoint fuera de LIMITED_CAPABILITIES → 403 | apps/users/tests/test_identity_gate_api.py | S-10 | Nuevo |
| token Hub con actions ["*"] para tenant local → no concede hub.read ni capacidades fuera del rol | apps/users/tests/test_hub_claims.py | S-11 | Nuevo |
| tenant no ve documento del owner en su propiedad; tenant no adjunta a lease ajeno | apps/core/tests/test_document_scope.py | S-12, S-14 | Nuevo |
| org_owner/operativo/comercial listan documentos según su alcance | apps/core/tests/test_document_scope.py | S-13 | Nuevo |
| agent GET /work-orders/property-picker/ solo sus propiedades; POST WO en propiedad ajena → 400 | apps/work_orders/tests/test_wo_scope.py | S-15, S-16 | Nuevo |
| tenant con email igual a guest_email no verificado → no ve reserva ni pago | apps/users/tests/test_portal_scope.py (ampliar) | S-17 | Existente |
| admin/manager GET /owner/bank-accounts/ ve pendientes enmascarados; owner B no ve cuentas de A | apps/billing/tests/test_bank_accounts.py | S-19 | Nuevo |
| admin sin verification_reviewer GET pendientes de identidad → 403 | apps/users/tests/test_role_scoping_p2.py (ampliar) | S-20 | Existente |
| Comparar Role.capabilities en BD con ROLE_CAPABILITIES para los 9 roles | apps/users/tests/test_role_capabilities.py (ampliar) | S-22 | Existente |
| create tampering: lease / work order / reservation con property_id de otra org → 400 | apps/*/tests/test_create_tampering.py | Cross-org | Nuevo |
| export: tenant/agent sin permiso → 403 en /properties/export/, reservations export, tenant export | apps/*/tests/test_export_permissions.py | Exports | Nuevo |

## G. Archivos que se propone modificar (pendiente de aprobación)

_Ningún archivo fue modificado. Lista de alcance para la fase de reparación._

| Archivo | Cambio propuesto | Hallazgos |
|---|---|---|
| disenio/back-mghpm/api/v1/core/views.py | DashboardSummaryView (capacidad + scope); Document views: rama staff con staff_sees_org_wide; ramas operativo/comercial | S-01, S-13 |
| disenio/back-mghpm/apps/core/services/dashboard_summary_service.py | Aceptar usuario y recortar, o restringir a staff | S-01 |
| disenio/back-mghpm/api/v1/reports/views.py • apps/reports/summary_services.py • apps/reports/repositories.py | owner_user_id en summaries; recortar list/download para owner | S-02, S-03 |
| disenio/back-mghpm/api/v1/billing/views.py | PaymentReceiptView con scope_payments | S-04 |
| disenio/back-mghpm/api/v1/billing/bank_account_views.py | Permitir listado a banking_details.review | S-19 |
| disenio/back-mghpm/api/v1/people/views.py | PeopleDetailView: membresía + scope; Directory/Summary para agent | S-05, S-09 |
| disenio/back-mghpm/api/v1/properties/views.py | Detail, Bulk, Duplicate, Units, OrgUnits, Stats con scope_properties | S-06, S-07, S-08 |
| disenio/back-mghpm/apps/users/portal_scope.py | operational_property_picker_queryset deny-by-default; decisión sobre WO/gastos de tenant/owner | S-15, S-18 |
| disenio/back-mghpm/apps/users/permissions.py | Gate de identidad en can(); claims Hub con org obligatoria y exclusión de plataforma | S-10, S-11 |
| disenio/back-mghpm/api/v1/users/identity_views.py | Usar verification.* en lugar de document.review | S-20 |
| disenio/back-mghpm/api/v1/core/serializers.py | DocumentUploadSerializer: validar scope del usuario | S-14 |
| disenio/back-mghpm/api/v1/work_orders/serializers.py | Validar property contra el picker del usuario | S-16 |
| disenio/back-mghpm/api/v1/organizations/views.py | MembershipViewSet.perform_create → flujo de invitación | S-21 |
| frontend/src/config/admin/navPermissions.ts • frontend/src/pages/admin/AdminApp.tsx | Alinear NAV_ITEM_CAPABILITY con ADMIN_ROUTE_CAPABILITY y backend | Menú vs ruta |
| disenio/back-mghpm/apps/*/tests/ (nuevos) | Tests de la sección F | F |
| Migraciones | Ninguna histórica. Si la BD difiere de ROLE_CAPABILITIES, proponer una migración NUEVA de resync, solo con aprobación | S-22 |

## H. Pruebas que deben ejecutarse fuera de Claude Design

_En el entorno local con PostgreSQL. Los tests nuevos de P0 deberían fallar hoy: así confirman el hallazgo antes de corregirlo._

| # | Bloque | Comando / acción | Resultado esperado |
|---|---|---|---|
| 0 | Entorno | Confirmar USE_SQLITE vacío/false en .env (config/settings.py:104) para que el ENGINE sea postgresql. No ejecutar migrate manual. | ENGINE = django.db.backends.postgresql |
| 1 | Suite existente | python manage.py test apps.users.tests.test_has_organization_action_failclosed --keepdb -v 2 | Todas pasan |
| 2 | Suite existente | python manage.py test apps.users.tests.test_critical_access_gaps --keepdb -v 2 | Aislamiento users/memberships por org |
| 3 | Suite existente | python manage.py test apps.users.tests.test_portal_scope apps.users.tests.test_role_scoping_p2 --keepdb -v 2 | Owner/agent/operativo/comercial scoping |
| 4 | Suite existente | python manage.py test apps.users.tests.test_role_capabilities apps.users.tests.test_registration_membership --keepdb -v 2 | Capacidades por rol |
| 5 | BD vs código | python manage.py shell -c "from apps.users.models import Role; [print(r.key, sorted(r.capabilities or [])) for r in Role.objects.all()]" | Comparar con ROLE_CAPABILITIES (S-22) |
| 6 | Nuevos (sección F) | Crear con APIClient + RefreshToken.for_user(user).access_token + HTTP_X_ORGANIZATION, igual que test_critical_access_gaps.py | Mismo patrón JWT que el frontend |
| 7 | Nuevos P0 | python manage.py test apps.core.tests.test_dashboard_scope apps.reports.tests.test_reports_scope apps.billing.tests.test_receipt_scope apps.people.tests.test_people_isolation --keepdb -v 2 | Hoy deberían FALLAR (confirman S-01…S-05) |
| 8 | Nuevos P1/P2 | python manage.py test apps.properties.tests.test_property_scope apps.core.tests.test_document_scope apps.work_orders.tests.test_wo_scope apps.users.tests.test_identity_gate_api apps.users.tests.test_hub_claims apps.billing.tests.test_bank_accounts --keepdb -v 2 | Hoy deberían FALLAR donde el hallazgo está confirmado |
| 9 | Manual con JWT | Con tokens reales de owner, tenant, agent, comercial: GET /api/v1/reports/summary/financial/, /api/v1/properties/stats/, /api/v1/billing/payments/{id_ajeno}/receipt/, /api/v1/people/{id_otra_org}/ | Registrar status y si la respuesta contiene datos ajenos |

---

Fin del reporte. No se modificó ningún archivo ni permiso. Se espera aprobación antes de cualquier cambio (sección G) y la ejecución local de la sección H.
