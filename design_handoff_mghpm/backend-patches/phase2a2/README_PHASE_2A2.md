# MGHPM — Fase 2A.2 — Paquete de tests de seguridad

> **STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN**
>
> Nada de este paquete fue ejecutado. Claude Design no tiene acceso de escritura a `MGHPM-Corecciones`, ni backend, ni PostgreSQL. Ningún test está marcado como passed o failed. Las rutas, modelos y campos se tomaron leyendo el código fuente; pueden requerir ajustes menores al ejecutarse (nombres de campos obligatorios, signals, paginación).
>
> No se modificó código de producción ni migraciones.

## Contenido

| Archivo | Contenido | Hallazgo |
|---|---|---|
| `back-mghpm/apps/users/tests/phase2a2_helpers.py` | Helpers: org, roles, membresías, propiedades, leases, JWT real + `X-Organization` | — |
| `back-mghpm/apps/users/tests/test_phase2a2_s05_people_cross_org.py` | PeopleDetailView cross-org | S-05 (P0) |
| `back-mghpm/apps/users/tests/test_phase2a2_s01_dashboard_scope.py` | Dashboard por rol: owner, tenant, agent, comercial | S-01 (P0) |
| `back-mghpm/apps/users/tests/test_phase2a2_s02_s03_reports_scope.py` | Summary reports, listado y descarga de informes | S-02, S-03 (P0) |
| `back-mghpm/apps/users/tests/test_phase2a2_s04_receipt_idor.py` | Comprobante de pago por ID ajeno | S-04 (P0) |
| `back-mghpm/apps/users/tests/test_phase2a2_s06_s09_detail_scope.py` | Detalle, edición, archivo, bulk, duplicado, unidades, stats, directorio | S-06…S-09 (P1) |
| `back-mghpm/apps/users/tests/test_phase2a2_s10_identity_gate.py` | Gate de identidad solo en frontend | S-10 (P1) |
| `back-mghpm/apps/users/tests/test_phase2a2_s19_bank_review.py` | Crear / ver / listar / aprobar / rechazar cuentas bancarias | S-19 (P2) |
| `back-mghpm/apps/users/tests/test_phase2a2_s21_existing_user_membership.py` | Alta de membresía para usuario existente | S-21 (P2) |
| `back-mghpm/apps/users/tests/test_phase2a2_s22_db_capability_override.py` | Precedencia BD vs código y deriva | S-22 (P2) |
| `tools/audit_capability_alignment.py` | Tabla `Route \| Menu \| Route \| Backend \| Match` | Menú vs ruta |

Todos los tests viven en `apps/users/tests/` (ya es paquete, tiene `__init__.py`) para no crear paquetes nuevos en otras apps.

## Dónde copiar

Desde la raíz de `MGHPM-Corecciones`:

```
phase2a2/back-mghpm/apps/users/tests/*.py  →  back-mghpm/apps/users/tests/
phase2a2/tools/audit_capability_alignment.py  →  phase2a2/tools/  (o tools/, ajustar ROOT si cambia la profundidad)
```

## Requisitos de entorno

1. `USE_SQLITE` vacío o `false` en `.env` → `ENGINE = django.db.backends.postgresql` (`back-mghpm/config/settings.py:104`).
2. El usuario de PostgreSQL necesita permiso `CREATEDB` (Django crea `test_<db>`; no toca la BD real).
3. No ejecutar `migrate` manualmente. No modificar migraciones históricas.

## Comandos exactos

```bash
cd back-mghpm

# 0. Línea base: suites existentes
python manage.py test apps.users.tests.test_has_organization_action_failclosed apps.users.tests.test_critical_access_gaps apps.users.tests.test_portal_scope apps.users.tests.test_role_scoping_p2 apps.users.tests.test_role_capabilities apps.users.tests.test_registration_membership -v 2

# 1. Fase 2A.2 completa
python manage.py test apps.users.tests.test_phase2a2_s05_people_cross_org apps.users.tests.test_phase2a2_s01_dashboard_scope apps.users.tests.test_phase2a2_s02_s03_reports_scope apps.users.tests.test_phase2a2_s04_receipt_idor apps.users.tests.test_phase2a2_s06_s09_detail_scope apps.users.tests.test_phase2a2_s10_identity_gate apps.users.tests.test_phase2a2_s19_bank_review apps.users.tests.test_phase2a2_s21_existing_user_membership apps.users.tests.test_phase2a2_s22_db_capability_override -v 2 2>&1 | tee phase2a2_results.txt

# 2. Deriva de capacidades en la BD REAL (solo lectura)
python manage.py shell -c "from apps.users.models import Role; from apps.users.permissions import ROLE_CAPABILITIES as RC; [print(r.key, 'NULL→código' if r.capabilities is None else ('OK' if set(r.capabilities)==set(RC.get(r.key,set())) else {'solo_bd': sorted(set(r.capabilities)-set(RC.get(r.key,set()))), 'solo_codigo': sorted(set(RC.get(r.key,set()))-set(r.capabilities))})) for r in Role.objects.all()]"

# 3. Alineación menú / ruta / backend (desde la raíz del repo)
cd ..
python phase2a2/tools/audit_capability_alignment.py
```

## Resultado esperado si los hallazgos son reales

| Test | Esperado hoy |
|---|---|
| S-05 `test_admin_a_cannot_read_user_of_org_b`, `test_agent_a_cannot_read_user_of_org_b` | **FAIL** (200 con PII) |
| S-01 `test_owner_* / test_tenant_* / test_agent_* / test_comercial_*` | **FAIL** (mismos KPIs que admin) |
| S-02 `test_owner_summary_reports_are_scoped`, `test_owner_financial_summary_excludes_owner_b_amount` | **FAIL** |
| S-03 `test_owner_a_list_excludes_owner_b_report`, `test_owner_a_cannot_download_owner_b_report_by_id` | **FAIL** |
| S-04 `test_tenant_a_cannot_download_receipt_of_payment_b`, `test_owner_a_cannot_download_receipt_of_payment_b` | **FAIL** (200 con PDF) |
| S-06/S-07 detalle, edición, archivo, bulk deactivate/archive, duplicado, unidad ajena | **FAIL** |
| S-08 unidades y stats de la organización | **FAIL** |
| S-09 directorio y detalle de persona no relacionada para agent | **FAIL** (depende de la política final) |
| S-10 `test_can_matches_effective_capabilities_*` y llamadas API de no verificados | **FAIL** (200 en vez de 403) |
| S-19 `test_admin_can_list_pending_requests`, `test_manager_can_list_pending_requests` | **FAIL** (403) |
| S-22 `test_migrated_roles_match_code` | FAIL solo si hay deriva (lista los roles) |

Controles que deberían **PASAR** hoy (controles ya correctos): same-org allowed (S-05), middleware 403 con org ajena, listados scoped (propiedades, pagos), purge exige `property.delete`, tenant sin `report.read`, documentos permitidos a no verificados, flujo bancario del owner (crear / ver propio / enmascarado / no revisar propio), aprobación y rechazo por PATCH, S-21 completo (membresía queda `INVITED` → hallazgo probablemente no reproducible), precedencia BD vs código en S-22.

## Ajustes que pueden hacer falta al ejecutar

- Campos obligatorios no vistos en `Property`, `Unit`, `Lease`, `Payment`, `GeneratedReport` u `OwnerBankAccount` → completar en `phase2a2_helpers.py`.
- Signals que recalculen `Membership.verification_status` al guardar → fijarlo con `Membership.objects.filter(pk=...).update(...)` tras crear.
- `Payment` manual exige `method`: los fixtures usan `method="Bank transfer"`. `Payment.save()` puede aplicar el pago a cargos abiertos; no afecta a los asserts.
- Si un test falla por un error de fixture (no por el status esperado), clasificarlo como **error de test**, no como vulnerabilidad.

## Entrega esperada de Claude Code (Fase 2A.2)

A. Tests creados • B. Tests que fallan (vulnerabilidades confirmadas) • C. Tests que pasan (controles correctos) • D. Hallazgos no reproducibles • E. Archivos de producción que deberán cambiar (sin modificarlos) • F. Salida completa: total / passed / failed / errors.

**STOP: no corregir ninguna vulnerabilidad hasta aprobar la Fase 2A.3.**
