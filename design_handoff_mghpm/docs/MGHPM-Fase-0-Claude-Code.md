# MGHPM — Fase 0 (Claude Code): Repository Audit, Security & Traceability

Repository: **MGHPM-Corecciones** (frontend/src, back-mghpm). Design baseline: **MGHPM 360 Audit v3.8** (Claude Design project), sections F0–F0.8.

Static baseline already done in Claude Design on a partial frontend snapshot (api.ts, hooks, auth guards, navPermissions, adminRoutes, MghAdminShell, payment modals, nginx, docker): S-04, S-07…S-14 VERIFIED there with path:line. **Your priority is what that snapshot could not cover:** back-mghpm (authorization, org isolation, schema, posting atomicity), frontend/src/pages/admin, services/, AdminApp.tsx, tests and CI.

## Authorization — 2026-10-09
Fase 0 **authorized for execution**, read-only: inspection, security assessment, financial integrity verification and the 67-Master traceability matrix. **Not authorized:** code, migration, configuration or data changes; deployments; Phase 1. Execution status: **NOT YET RUN** — results pending from the Claude Code session.

## Pre-flight (confirm before starting; report any gap as BLOCKED)
- Access to **both** repos: frontend `MGHPM-Corecciones` and backend `back-mghpm`, including migrations, permission config/settings and tests.
- S-04 and S-07…S-14 were VERIFIED by **static review of a partial frontend snapshot only**. Do not treat them as confirmed or resolved system-wide; re-assess each against backend and API access controls.

## Hard rules
- **Read-only.** Do not modify application code, migrations, settings or data. No deploy. No financial postings, migrations or record rewrites.
- Do not weaken any authorization control, even temporarily.
- Never classify a prototype (Master) feature as production. Masters are design references only.
- Every `VERIFIED` must cite evidence: `path:line`, endpoint + test output, or migration name.
- Statuses: `VERIFIED`, `PARTIAL`, `MISSING`, `BLOCKED`, `NOT VERIFIED`.
- **Stop** after delivering the findings and the repair proposal. Wait for written authorization before any change.

## 1. Repository inspection → Architecture Report
Document with file evidence:
- Frontend: router (`AdminApp.tsx`, `adminRoutes.ts`), menu (`config/admin/adminMenu.tsx`, `navPermissions.ts`), shell (`layouts/admin/MghAdminShell.tsx`), state, i18n (i18next es/en).
- Backend: Django apps, DRF viewsets/serializers, permission classes, `X-Organization` middleware, Hub (FastAPI) + Keycloak integration.
- Database: models, relationships, unique/check constraints, migrations.
- Financial processing: payment create/update, receipt PDF, expenses, any ledger/charge models.
- Tests (unit/API/e2e) and CI/deploy configuration.

## 2. Security assessment (runtime where possible)
Run as **owner, tenant, agent, portfolio-limited staff, and a user of a second organization**. For each finding record: ID, severity, affected files, reproduction steps, impact, remediation, status.

| ID | Check |
|---|---|
| S-01 | Cross-organization isolation (`X-Organization` tampering / omission on every list + detail endpoint) |
| S-02 | Owner and tenant record isolation in portal endpoints (`portals/views.py`, `_resolve_target_user`) |
| S-03 | Property / portfolio-level authorization on read and write |
| S-04 | Tenant Pay Rent: server-computed amount, lease ownership, idempotency, replay (control absent per Oct 6) |
| S-05 | Payment receipt access / IDOR (`fetchPaymentReceiptPdf`, receipt endpoint) |
| S-06 | Dashboard and report organization + role scoping (incl. exports) |
| S-07 | Identity verification enforced in the API, not only the router guard |
| S-08 | Menu ↔ route ↔ API capability consistency (Tasks, Owners, Directory) |
| S-09 | Account recovery flow |
| S-10 | API Docs localhost fallback |

If no runtime backend or per-role test users exist, mark the runtime part `BLOCKED` and still record the static evidence.

## 3. Master-to-Code Traceability Matrix (Masters 01–67)
One row per Master: number + name, production route, frontend component, API endpoints, DB tables, required permissions, integrations, existing tests, status, missing functionality, recommended phase. The Oct 6 route/component leads are in audit section F0.3; confirm or correct each one.

## 4. Financial integrity
For Payments (ids), General Ledger / journal entries, AR, AP & Expenses, Deposits, Owner Distributions, Bank Reconciliation, determine:
- **Atomic:** `transaction.atomic` / `select_for_update` around posting?
- **Idempotent:** idempotency key or unique `(source, type)` constraint?
- **Auditable:** append-only audit log; can records be silently edited?
- **Duplicate-protected:** double submit, retry after timeout, concurrent requests.
Inspection and test-database checks only. No changes to production data.

## 5. Core repair proposal (do not implement)
Confirm or correct items R-01…R-10 in audit section F0.6: broken routes, placeholders, duplicate screens, incorrect back navigation, missing record detail views, role/permission mismatches. No new modules.

## 6. Deliverables (return as Markdown tables)
1. Repository Architecture Report
2. Security Findings Register
3. Master-to-Code Traceability Matrix
4. Prototype-to-Production Gap Analysis
5. Financial Integrity Assessment
6. Prioritized P0–P3 Remediation Backlog
7. Dependency-Based Implementation Roadmap (Security/P0 → core repairs → Properties/Units/Owners/Tenants/Leases/Payments/Ledger → Operations → advanced finance → portals/compliance)
8. Verification and Test Plan (with results of tests actually executed — each test `PASS`, `FAIL`, `BLOCKED` or `NOT TESTED`, with evidence)

Every finding: file, line, severity, evidence, verification procedure, recommendation. Anything that could not be inspected stays `NOT VERIFIED` or `BLOCKED` — do not fill fields to close them.

Return the tables to the Claude Design project so the MGHPM 360 Audit can be re-issued as **v3.9** with executed evidence. Phase 1 (any code change) requires written approval after review of deliverables 1–8.
