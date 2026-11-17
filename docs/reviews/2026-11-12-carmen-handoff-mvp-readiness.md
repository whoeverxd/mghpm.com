# Carmen design handoff and MVP readiness review

**Date:** 12 November 2026
**Audience:** MGHPM project team (owner, Carmen, and developers)
**Scope:** Compare `design_handoff_mghpm/` with the Next.js/Firebase implementation plan, the November Superpowers specs/plans, and the current repository. This is a static documentation/code review; the app and tests were not run as part of this review.

## Executive summary

Carmen's handoff is a useful source for visual design, expected screen behavior, and security scenarios. It is not a current implementation map for this repository: its README, screen routes/statuses, Fase 0 instructions, Django security report, and backend patches describe a different React/Vite + Django application. The current product is Next.js 16 + Firebase. Do not apply those patches or treat those statuses or findings as verified defects here.

The current implementation plan and November 12 decisions provide the more relevant MVP scope and order. The plan should be reconciled so that this later agreed scope is authoritative, and its launch blockers should be completed in a controlled sequence. The 9 November access audit cited by the specs was not found in the repository during this review.

## What the handoff contributes

- The 67 HTML Masters are visual and interaction references, not production code.
- The design system and expected states (loading, empty, error, validation, responsive behavior) can guide acceptance reviews.
- The legacy security report provides attack scenarios to translate into Next.js/Firebase tests, especially tenant isolation, object-level access, payment amount integrity, receipt access, and consistency between navigation, pages, and APIs.
- Pagination by page number in the prototype differs from cursor pagination used for Firestore. Keep cursor pagination unless there is a specific product requirement to change it, and document the difference as accepted.

## Gaps and conflicts to resolve

### 1. Make the November 12 MVP scope authoritative

The plan's older MVP section says short-stay reservations are excluded, but its later November 12 decision includes reservations, verified bank transfers, guest accounts, and check-out. Align the summary, phases, and acceptance criteria with the later decision.

The existing Explore Stays spec covers a public catalog, quote, and inquiry workflow; it does not by itself deliver the later reservation scope: date availability, expiring holds, reservation confirmation, guest access, verified-transfer payment, guest self-service, and check-out.

### 2. Resolve authorization scope before granting staff access

The access spec and implementation need a precise decision for `manager` and `operations`: organization-wide access or assignment to specific properties. The MVP plan already notes that property assignments are not implemented. Do not infer access from menu visibility; require matching authorization checks on every page, API, export, and file operation.

Add automated checks that menu capabilities, route/page guards, and API authorization agree. Translate relevant findings from Carmen's legacy report into negative tests for this app rather than recording them as current vulnerabilities without evidence.

### 3. Add explicit portal invitation acceptance

Block 2B is the next planned block. The invitation flow should require the invited person to accept before an existing account receives access to the organization or a portal. Include expiration, resend/revoke, wrong-account/email, already-member, and cross-organization tests. Do not equate creating a membership with user acceptance.

### 4. Correct the production file-storage decision

The plan describes Firebase Storage, but current property image operations use a private local-disk store (`src/lib/storage/local-files.ts`). The MVP sequence mentions hosting with persistent disk. Decide and document the production storage, backup, restore, and deployment behavior before relying on uploaded property images or documents. Persistent local storage must be guaranteed by the chosen host and included in backup/restore; otherwise move private files to durable object storage with equivalent authorization.

### 5. Finish the shell and acceptance process

The current admin shell (`src/components/layout/admin-shell.tsx`) has breadcrumbs that distinguish properties from the dashboard only, and the language control is a fixed `ES` label. The top bar also lacks the handoff's search, “+ Nuevo,” and notification controls. Ownerships and Audit need navigation when their screens are available.

Prioritize the shared shell before adding many screens. Agree which shell features are MVP-critical (breadcrumbs, language switching, notification entry point, dark mode) and which can follow. Review the already implemented screens at phone, tablet, and desktop widths; keep cursor pagination as an accepted Firestore-specific deviation.

### 6. Reconcile plan details and source documents

- Remove the duplicate Master 04 row in the plan's view-by-view inventory.
- Update the older MVP exclusion for short stays and mark decisions settled on November 12 as decided rather than leaving them in the blocking checklist.
- Add `front-lovable/` to the plan as a separate TanStack Start/Lovable project, and state whether it is a prototype/reference or has any role in the production MVP. Do not assume it is part of the Next.js app.
- Add Carmen's 9 November access audit if the source is available. If unavailable, record that explicitly and confirm any requirements attributed to it with the owner/team.

### 7. CI and production readiness

No CI workflow was found in the repository. Add a pipeline for lint, typecheck, unit tests, Firebase emulator/rules tests, and representative E2E tests. Include authorization-negative tests and payment/receipt tests before implementing payment UI.

The 2A-2 plan records three required Firestore indexes and a migration. The definitions are present in `firestore.indexes.json`; their deployment to the live Firebase project was not verified. The migration script supports `--dry-run` and requires `--yes` for live writes. Run and inspect the dry run first, then obtain explicit owner approval before any production write. Complete the manual owner walkthrough after deployment/migration.

## Recommended completion sequence

Each block should have an approved design/spec, implementation plan, implementation, automated tests, and acceptance review before it is treated as complete.

1. **Reconcile scope and decisions.** Update the plan to make the November 12 MVP order authoritative. Confirm manager/operations scope, production hosting and file storage, shell priorities, and any remaining launch decisions. Resolve the 9 November audit source.
2. **Close 2A-2 operationally.** Deploy the planned indexes; inspect a production-targeted migration dry run; obtain approval before applying it. Perform the owner walkthrough for ownership creation and review, the owner portal's properties, and tenant portal access after lease activation.
3. **Establish CI and finish foundations.** Add lint, typecheck, unit, emulator/rules, and E2E checks. Add permission consistency tests across menu, page, and API. Finish the agreed shell changes and responsive visual review for screens already implemented.
4. **Build 2B Invitations.** Implement an invitation lifecycle with explicit acceptance and test all states, existing accounts, and organization isolation.
5. **Complete long-term rentals.** Deliver applicant registration and applications, staff review, approval-to-lease, lease activation, documents, and Lease 360. Test state transitions, unit occupancy, permissions, and audit events.
6. **Build transfer payments test-first.** Before payment screens, test server-side amount calculation, verified-only balances, receipt authorization, duplicate/retry behavior, auditability, and cross-organization isolation. Then implement transfer submission, staff verification/approval/rejection, receipts, ledger, balances, and the agreed basic bank reconciliation. Card payments remain out of MVP.
7. **Complete short-stay reservations.** Extend the catalog with availability, expiring holds, reservation lifecycle, guest access, verified-transfer payment, “Mis estadías,” and check-out. Test concurrent holds/reservations and release/expiry behavior.
8. **Complete portal content and maintenance.** Deliver owner/tenant contract, account, payments, documents, and requests using relationship-scoped access. Then implement maintenance requests, work orders, vendors, assignment, and closure.
9. **Finish dashboard, notifications, and pilot readiness.** Use authorized live aggregates; add in-app notifications, audit viewer, and the agreed Gmail API business-email path. Run security, backup/restore, responsive, and end-to-end checks, then pilot with controlled data and an explicit rollback/support plan.

## MVP boundaries recorded on November 12

**Included:** long-term rental workflow; short-stay reservations; manual bank-transfer registration and verification; verified funds reflected as collected and used to confirm reservations; basic reconciliation against a bank statement; owner and tenant portal content; maintenance; operational dashboard and notifications; hardening and pilot.

**Excluded:** card processing, payroll, automated bank reconciliation, channel integrations (Airbnb, Vrbo, Booking), automated KYC decisions, and AI.

## Evidence and references

- [Handoff README](../../design_handoff_mghpm/README.md)
- [Handoff screen inventory](../../design_handoff_mghpm/SCREENS.md)
- [Next.js/Firebase implementation plan](../../design_handoff_mghpm/docs/PLAN-NEXTJS-FIREBASE.md)
- [Access lanes design](../superpowers/specs/2026-11-10-access-lanes-2a-design.md)
- [People and ownership design](../superpowers/specs/2026-11-12-people-relationships-2a2-design.md)
- [People and ownership implementation plan](../superpowers/plans/2026-11-12-people-relationships-2a2.md)
- [Explore Stays catalog design](../superpowers/specs/2026-11-07-explore-stays-catalog-design.md)
- [Explore Stays implementation plan](../superpowers/plans/2026-11-09-explore-stays-catalog.md)
- [Admin shell](../../src/components/layout/admin-shell.tsx)
- [Private local file storage](../../src/lib/storage/local-files.ts)
- [Firestore indexes](../../firestore.indexes.json)
- [People relationships migration](../../scripts/migrate-relationships.mjs)

**Validation note:** This review was based on reading documentation and source files. No application, test suite, Firebase deployment, index deployment, or migration was executed for it.
