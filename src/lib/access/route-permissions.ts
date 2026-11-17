import type { StaffAction, StaffModule } from "./permissions.ts";

/**
 * Single source for the admin surfaces: which permission each one requires, the
 * parent of each page (for breadcrumbs), the menu sections and the "+ Nuevo"
 * actions. Texts live in the i18n dictionaries (`t.routes[pattern]`,
 * `t.nav.sections[key]`, `t.createMenu.items[name]`). `route-permissions.test.ts`
 * checks that every /admin page and every staff API enforces exactly what is
 * declared here, and `scripts/e2e/permissions.mjs` exercises the matrix per role.
 */
export type RoutePermission = { module: StaffModule; action: StaffAction };

export type AdminPage = RoutePermission & {
  /** Parent page pattern; null for top-level pages (shown right after "Inicio"). */
  parent: string | null;
};

const p = (module: StaffModule, action: StaffAction): RoutePermission => ({ module, action });

const page = (module: StaffModule, action: StaffAction, parent: string | null = null): AdminPage => ({
  module,
  action,
  parent,
});

type NavigationItem = { href: string; module: StaffModule };

/** Menu sections, in display order. A role sees an entry iff it can `view` its module. */
export const adminNavigationSections = [
  { key: "home", items: [{ href: "/admin", module: "dashboard" }] },
  {
    key: "portfolio",
    items: [
      { href: "/admin/properties", module: "properties" },
      { href: "/admin/ownerships", module: "ownerships" },
    ],
  },
  {
    key: "leasing",
    items: [
      { href: "/admin/people", module: "people" },
      { href: "/admin/leases", module: "leases" },
      { href: "/admin/stay-inquiries", module: "stay_inquiries" },
    ],
  },
  {
    key: "administration",
    items: [
      { href: "/admin/users", module: "members" },
      { href: "/admin/audit", module: "audit" },
    ],
  },
] as const satisfies readonly { key: string; items: readonly NavigationItem[] }[];

export const adminNavigation = adminNavigationSections.flatMap((section) => [...section.items]);

const PROPERTY = "/admin/properties/[propertyId]";
const PERSON = "/admin/people/[personId]";
const LEASE = "/admin/leases/[leaseId]";

/** Permission and breadcrumb parent of each /admin page (keyed by route pattern). */
export const adminPagePermissions: Record<string, AdminPage> = {
  "/admin": page("dashboard", "view"),
  "/admin/properties": page("properties", "view"),
  "/admin/properties/new": page("properties", "create", "/admin/properties"),
  [PROPERTY]: page("properties", "view", "/admin/properties"),
  [`${PROPERTY}/edit`]: page("properties", "update", PROPERTY),
  [`${PROPERTY}/units/new`]: page("properties", "create", PROPERTY),
  [`${PROPERTY}/units/generate`]: page("properties", "create", PROPERTY),
  [`${PROPERTY}/units/[unitId]/edit`]: page("properties", "update", PROPERTY),
  "/admin/people": page("people", "view"),
  "/admin/people/new": page("people", "create", "/admin/people"),
  [PERSON]: page("people", "view", "/admin/people"),
  [`${PERSON}/edit`]: page("people", "update", PERSON),
  [`${PERSON}/propietario`]: page("people", "view", PERSON),
  [`${PERSON}/inquilino`]: page("people", "view", PERSON),
  "/admin/leases": page("leases", "view"),
  "/admin/leases/new": page("leases", "create", "/admin/leases"),
  [LEASE]: page("leases", "view", "/admin/leases"),
  [`${LEASE}/edit`]: page("leases", "update", LEASE),
  "/admin/ownerships": page("ownerships", "view"),
  "/admin/ownerships/new": page("ownerships", "create", "/admin/ownerships"),
  "/admin/ownerships/[ownershipId]": page("ownerships", "view", "/admin/ownerships"),
  "/admin/audit": page("audit", "view"),
  "/admin/buscar": page("dashboard", "view"),
  "/admin/stay-inquiries": page("stay_inquiries", "view"),
  "/admin/users": page("members", "view"),
  "/admin/users/new": page("members", "manage", "/admin/users"),
  "/admin/users/[uid]/edit": page("members", "manage", "/admin/users"),
};

type CreateAction = RoutePermission & {
  /** Key of `t.createMenu.items`. */
  name: "property" | "unit" | "person" | "lease" | "ownership" | "user";
  /** A page pattern of adminPagePermissions; `[propertyId]` ones only show inside a property. */
  href: string;
  /** Prefills `?propertyId=` when the current page is inside a property. */
  acceptsProperty?: boolean;
};

/** Entries of the "+ Nuevo" menu, in display order (see `create-menu.ts`). */
export const createActions: readonly CreateAction[] = [
  { name: "property", href: "/admin/properties/new", module: "properties", action: "create" },
  { name: "unit", href: `${PROPERTY}/units/new`, module: "properties", action: "create" },
  { name: "person", href: "/admin/people/new", module: "people", action: "create" },
  { name: "lease", href: "/admin/leases/new", module: "leases", action: "create", acceptsProperty: true },
  { name: "ownership", href: "/admin/ownerships/new", module: "ownerships", action: "create", acceptsProperty: true },
  { name: "user", href: "/admin/users/new", module: "members", action: "manage" },
];

/** Permission each staff API handler checks before reading its input (keyed by "METHOD pattern"). */
export const staffApiPermissions: Record<string, RoutePermission> = {
  "POST /api/properties": p("properties", "create"),
  "PATCH /api/properties/[propertyId]": p("properties", "update"),
  "POST /api/properties/[propertyId]/images": p("properties", "update"),
  "PATCH /api/properties/[propertyId]/images": p("properties", "update"),
  "GET /api/properties/[propertyId]/images/[imageId]": p("properties", "view"),
  "DELETE /api/properties/[propertyId]/images/[imageId]": p("properties", "update"),
  "GET /api/properties/[propertyId]/units": p("properties", "view"),
  "POST /api/properties/[propertyId]/units": p("properties", "create"),
  "POST /api/properties/[propertyId]/units/generate": p("properties", "create"),
  "PATCH /api/properties/[propertyId]/units/[unitId]": p("properties", "update"),
  "POST /api/properties/[propertyId]/units/[unitId]/archive": p("properties", "archive"),
  "POST /api/people": p("people", "create"),
  "PATCH /api/people/[personId]": p("people", "update"),
  "POST /api/people/[personId]/archive": p("people", "archive"),
  "POST /api/leases": p("leases", "create"),
  "PATCH /api/leases/[leaseId]": p("leases", "update"),
  "POST /api/leases/[leaseId]/status": p("leases", "update"),
  "POST /api/ownerships": p("ownerships", "create"),
  "PATCH /api/ownerships/[ownershipId]": p("ownerships", "update"),
  "POST /api/ownerships/[ownershipId]/status": p("ownerships", "update"),
  "POST /api/ownerships/[ownershipId]/end": p("ownerships", "archive"),
  "PATCH /api/stay-inquiries/[inquiryId]": p("stay_inquiries", "update"),
  "POST /api/members": p("members", "manage"),
  "PATCH /api/members/[uid]": p("members", "manage"),
  // Every staff role; results are limited to the modules the role can view.
  "GET /api/search": p("dashboard", "view"),
};

/** API handlers outside the staff permission table, with the reason. */
export const nonStaffApis: Record<string, string> = {
  "GET /api/auth/csrf": "public: issues the CSRF token",
  "POST /api/auth/session": "creates the session from a Firebase ID token",
  "DELETE /api/auth/session": "signs out the current session",
  "POST /api/organizations": "any signed-in user creates their own organization",
  "POST /api/organizations/active": "switches among the caller's own workspaces",
  "GET /api/public/stays/images/[propertyId]/[imageId]": "public catalog image",
  "POST /api/public/stays/inquiries": "public stay inquiry form",
  "POST /api/preferences/locale": "language preference of the caller (cookie, and profile when signed in)",
};
