# MGHPM Design System

**MGHPM — My Global Hub Property Management** (subsidiary of MGHIR) runs **MGHPM Enterprise**, a fiduciary-grade property-management web app for a South-Florida residential portfolio (Miami Beach, Brickell, Coral Gables, Ft Lauderdale). Modules: Dashboard, Properties, Tenants & Leases / Leasing & Screening, Maintenance & Work Orders, Digital Inspections, Accounting & Statements, Owner Portals, Vendor & Contractor Network, Reports & Intelligence, Settings. Primary user: a portfolio lead / asset manager (sample persona "Marcus Vance, Portfolio Lead"); secondary audiences are owners (trusts) and tenants/applicants.

## Sources
- GitHub: **https://github.com/cdelamatta/MGHPM-Corecciones** — not accessible to the GitHub connection (404). The local clone could not be browsed either; the user uploaded the repo's root docs instead: `README.md`, `AGENTS.md`, `package.json`, `skills-lock.json`, `logo.png` (in `uploads/`). Explore the repo directly for component source (`frontend/src/shared/ui/admin/*`, `frontend/src/shared/styles/admin/*.css`, `layouts/admin/MghAdminShell.tsx`, `config/admin/adminMenu.tsx`).
- Screenshots in `uploads/` — main visual source for layouts. Some show an older navy sidebar; the sidebar is now **teal**.
- Logos: `uploads/Logo MGHPM trans.jpeg` → `assets/logo-full.png`, `assets/logo-mark.png`; `uploads/logo.png` → `assets/logo-horizontal.png` (both had baked-in checkerboards, cleaned). Backend PDF fallback logo lives at `back-mghpm/static/brand/logoSinFondoOriginal.png`.
- Brand colour brief (pasted by user) — authoritative for colour hierarchy.

## Product / codebase facts (from repo README + AGENTS.md)
- Stack: **React 19 + Vite 8 + TypeScript**, **Bootstrap / React-Bootstrap** (Omah admin template), Redux Toolkit, Formik/Yup, Chart.js / ApexCharts / Recharts, Sass, i18next (es/en). Backend Django 5.2 + DRF, multi-tenant via `X-Organization`; control plane "MGH Hub" (FastAPI) + Keycloak SSO.
- Admin at `/admin/*`: dashboard, properties, leases, reservations, people (owners/tenants/vendors/staff), work-orders, payments, finance, reports (rent_roll, occupancy, maintenance, owners), settings (General, Users, Properties, Finance, Reservations, Maintenance, Communication, Documents, Integrations, Security, Preferences), hub. Public landing: /, /services, /for-owners, /for-tenants, /for-agents, /faq, /contact.
- Per-org branding: `Organization.logo` + name drive the topbar, emails, PDF/XLSX letterheads.
- **Dark mode** is first-class (`data-bs-theme="dark"`): canvas #0F172A, cards #1E293B / border #334155, inputs #1E293B / #475569, focus #0F766E, titles #2DD4BF. Mirrored in `tokens/colors.css`.
- Existing code buttons: `.btn-teal` #0F766E (hover #115E59), `.btn-accent` amber #F59E0B, `.btn-outline-teal`. ⚠️ The code's teal (#0F766E) predates the new brief; the design system uses the brief's **#006B68**. Light-mode page titles are teal in code; the brief moves them to **navy #132A52**.
- PDF reports (ReportLab): logo left, teal rule #0F3D3E, 16pt teal title, teal table header + alternating #F0F7F7 rows, 7.5pt footer.
- Pagination: every data table uses the system `Pagination` (page numbers + page-size selector).

## Colour guardrail
> Use teal `#006B68` as the main navigation and primary brand colour. Use navy `#132A52` as a secondary supporting colour, not as the sidebar background. Keep blue `#0094CC` for informational accents and gold `#D4A637` for limited premium accents.

Primary/menu #006B68 · Primary dark #004F4D · Hover #005A57 · Teal soft #DDF3F1 · Secondary navy #132A52 · Accent blue #0094CC · Premium gold #D4A637 · Background #F8FAFC · Surface #FFFFFF.

## CONTENT FUNDAMENTALS
- **Voice:** institutional, fiduciary, compliance-forward. Copy signals rigour and legality: "Fiduciary capital account tracking, net yield allocations, monthly financial disbursements, and IRS tax reporting packages."
- **Person:** impersonal/system voice. No "I"; "you" is rare. Labels describe the system or the object ("Autonomous Recommendation: Approve with Standard 2x Escrow").
- **Casing:** Title Case for titles, buttons, card titles ("Initiate Capital Distribution", "Export Audit Log"). UPPERCASE for eyebrows/KPI labels and table headers ("UNDISTRIBUTED ESCROW RESERVE"). Sentence case for descriptions.
- **Specificity:** heavy use of statute references (FL § 83.49, EPA Title X, FCRA), IDs (#WO-2025-0428, FEDW-2025-06-0081), exact money with cents ($42,150.00), masked identifiers (••••9012, EIN •••••8841).
- **Separators:** bullet "•" between meta facts ("Ocean View Villa • Unit 102"); em dash in titles ("Owner Portal — Capital Distributions & Asset Yield"); ampersands everywhere.
- **Buttons:** verb-first, often long and explicit ("Approve & Generate Lease Offer", "Decline with Adverse Action Notice"). Export buttons name the format ("CSV", "PDF", "Vault ZIP").
- **Emoji:** never. Status is conveyed by pill colour + dot. Unicode arrows (↑ ↗ →) appear inside delta pills; "⌘K" in search.
- **Vibe:** premium private-bank × property ops. Confident, precise, slightly verbose.

## VISUAL FOUNDATIONS
- **Colour:** white cards on slate-50 page; teal owns navigation and primary action; navy carries titles/headings, secondary buttons, active filter pills and chart series 1; gold flags attention/premium (top accent bars, "Tier 1", "PRO", portfolio icon); blue for info pills and active stepper. Status = soft tinted pill + strong text (green/amber/red/blue/gold).
- **Type:** one geometric-humanist sans for everything (substituted with **Plus Jakarta Sans** — see caveats) at 600 for headings, 400–500 body; **monospace** (JetBrains Mono substitute) for money, IDs, timestamps, record codes. Page title 28px, section 18, card title 16, body 13–14, meta 11–12, eyebrow 11 uppercase +0.06em.
- **Spacing:** dense desktop layout; 16–20px card padding, 16–20px grid gaps, 24px page padding. Content max ~1280px; right rail ~300px.
- **Backgrounds:** flat. No gradients, textures or illustrations. Imagery = real property / evidence photos in small rounded thumbnails (cool, daylight, architectural).
- **Cards:** #fff, 1px slate-200 border, 12px radius, hairline shadow (0 1px 2px rgba(15,23,42,.05)). Attention cards get a 3px gold top border. Selected list item: teal 3px left bar + raised shadow. Nested sub-panels use slate-50 fill, 8px radius, no shadow.
- **Borders/dividers:** 1px slate-200 rules between table rows and breakdown lines.
- **Radii:** 4 (checkbox, code chips), 6 (buttons, inputs, nav items), 8 (tiles, sub-panels), 12 (cards), pill (badges, filters).
- **Shadows:** almost none; elevation is via border. Raised shadow only for selected items.
- **Hover:** darker fill on solid buttons (teal → #005A57, pressed #004F4D); slate-50 fill on outline/rows; nav items #005A57. No scale/shrink.
- **Focus:** teal border + 3px teal 18% ring.
- **Animation:** minimal — 120–180ms colour transitions, standard ease. No bounces.
- **Transparency/blur:** only in the sidebar (white text at 72%, section labels at 60%, user chip rgba(0,0,0,.14)). No backdrop blur.
- **Layout:** fixed left teal sidebar (≈208px), fixed white top bar (search ⌘K, portfolio switcher, "+ New", bell, avatar); scrolling content; main column + right rail.
- **Data viz:** grouped bars — navy (gross), red (opex), gold (net) on slate-50 plot.

## ICONOGRAPHY
- Line icons matching **Lucide** (≈1.5–2px stroke, rounded caps): building, wrench, key, landmark, shield-check, file-text, download, calendar, bell, search. Loaded from CDN `https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js` and rendered via the `Icon` component. ⚠️ Substitution: the real icon set could not be confirmed from source.
- Icons sit in 28–32px soft-tinted square tiles in card headers/KPIs; inline at 14–16px in buttons, meta rows and nav.
- No icon font, no emoji. Unicode used sparingly: ↑ ↗ → in deltas, • separators, ⌘K.
- Logo: `assets/logo-full.png` (lockup with "MY GLOBAL HUB PROPERTY MANAGEMENT / Subsidiary of MGHIR"), `assets/logo-mark.png` (teal/gold crescent + buildings). In-app it appears on a white rounded tile beside "MGHPM / ENTERPRISE" (gold) wordmark text.

## Index
- `styles.css` → `tokens/` (fonts, colors, typography, spacing, base)
- `guidelines/` — foundation cards (Colors, Type, Spacing, Brand)
- `assets/` — logo-horizontal.png, logo-full.png, logo-mark.png, logo-original.jpeg
- `components/` — React primitives:
  - core: **Button**, **Badge**, **Avatar**, **Card**, **Icon**
  - forms: **TextField**, **SelectField**, **Checkbox**, **RadioCard**
  - data: **StatCard**, **ProgressBar**, **DataTable**
  - navigation: **Sidebar**, **TopBar**, **Breadcrumbs**, **Stepper**, **FilterTabs**
- `ui_kits/mghpm-enterprise/` — click-through app (Owner Portal, New Lease, Leasing, Work Orders, Reports)
- `SKILL.md`, `thumbnail.html`

### Intentional additions
No source component inventory was available, so a set sized to what the screenshots show was authored. `Icon` wraps Lucide so components can reference glyphs by name.
