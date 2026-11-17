// E2E for permission consistency: every /admin page, every staff API and the menu,
// for every role, against the central table (src/lib/access/permissions.ts) and the
// route manifest (src/lib/access/route-permissions.ts). Requires the emulators and a
// server on port 3100 (see README). Wipes demo-mghpm data.
import { buildCreateMenu } from "../../src/lib/access/create-menu.ts";
import { can } from "../../src/lib/access/permissions.ts";
import {
  adminNavigation,
  adminPagePermissions,
  staffApiPermissions,
} from "../../src/lib/access/route-permissions.ts";
import {
  api,
  BASE,
  check,
  db,
  finish,
  login,
  page,
  propertyWizardDefaults,
  resetEmulators,
  seedOrganization,
  signUp,
} from "./lib.mjs";

await resetEmulators();
const staffRoles = ["org_owner", "admin", "manager", "operations"];
const users = {};
for (const role of staffRoles) users[role] = await signUp(`${role}@example.test`);
users.owner = await signUp("owner@example.test");
users.tenant = await signUp("tenant@example.test");
// Target of the member endpoints, so no probe touches the roles under test.
const target = await signUp("target@example.test");

await seedOrganization("org-a", "Org A", [
  ...staffRoles.map((role) => [users[role].uid, role]),
  [target.uid, "operations"],
]);

const sessions = {};
for (const [name, user] of Object.entries(users)) sessions[name] = await login(user.idToken);
const holder = sessions.org_owner;

console.log("Fixtures");
let result = await api(holder, "POST", "/api/properties", {
  ...propertyWizardDefaults,
  name: "Torre Permisos",
  code: "TP-1",
  type: "apartment_condo",
  status: "active",
  address: "Calle 1",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO",
});
const propertyId = result.body?.propertyId;
result = await api(holder, "POST", `/api/properties/${propertyId}/units`, {
  label: "101", floor: "1", bedrooms: 2, bathrooms: 1, status: "available", marketRent: "", marketRentCurrency: "USD",
});
const unitId = result.body?.unitId;

async function createPerson(name, email, relationships) {
  const created = await api(holder, "POST", "/api/people", {
    kind: "individual", name, email, phone: "", status: "active", relationships,
  });
  return created.body?.personId;
}
const personId = await createPerson("Olga Dueña", "owner@example.test", { owner: true, tenant: false });
const tenantPersonId = await createPerson("Tomás Inquilino", "tenant@example.test", { owner: false, tenant: true });

result = await api(holder, "POST", "/api/leases", {
  intent: "draft", source: "admin", renewOfLeaseId: "", parties: [], propertyId, unitId, tenantId: tenantPersonId,
  startDate: "", endDate: "", possessionDate: "", moveInDate: "", renewalType: "manual", noticeDays: 60,
  currency: "USD", rent: "", dueDay: 1, graceDays: 5, lateFeeRule: "percent_5", lateFeeFlat: "",
  firstRentDueDate: "", prorateFirstPeriod: false, securityDeposit: "", additionalDeposit: "", petDeposit: "",
  advanceRent: "", otherChargeLabel: "", otherCharge: "", collectFirstMonthRent: true,
  utilities: Object.fromEntries(["electricity", "water", "internet", "gas", "hoa"].map((k) => [k, { party: "na", notes: "" }])),
});
const leaseId = result.body?.leaseId;
result = await api(holder, "POST", "/api/ownerships", {
  personId, propertyId, pct: "100", startDate: "2024-01-01", titleOwner: "", titleNumber: "",
  registryNumber: "", cadastralNumber: "", registryAddress: "",
});
const ownershipId = result.body?.ownershipId;
check("fixtures created", Boolean(propertyId && unitId && personId && tenantPersonId && leaseId && ownershipId),
  JSON.stringify({ propertyId, unitId, personId, tenantPersonId, leaseId, ownershipId }));

// Portal users: granted portal + person with the matching active relationship.
for (const [lane, uid, laneId] of [["owner", users.owner.uid, personId], ["tenant", users.tenant.uid, tenantPersonId]]) {
  await db.doc(`organizations/org-a/memberships/${uid}`).set({
    userUid: uid, organizationId: "org-a", staffRole: null, portals: [lane], portalPersonIds: { [lane]: laneId }, status: "active",
  });
}

const params = {
  propertyId, unitId, personId, leaseId, ownershipId, uid: target.uid,
  imageId: "missing-image", inquiryId: "missing-inquiry",
};
// The tenant view needs a person with the tenant relationship.
const fill = (pattern) =>
  pattern.replace(/\[(\w+)\]/g, (_, name) =>
    name === "personId" && pattern.endsWith("/inquilino") ? tenantPersonId : params[name]);
const denied = (html) => html.includes("data-access-denied");

console.log("Pages × roles");
for (const [pattern, { module, action }] of Object.entries(adminPagePermissions)) {
  const url = fill(pattern);
  for (const role of staffRoles) {
    const { status, html } = await page(sessions[role], url);
    if (can(role, module, action)) {
      check(`${role} opens ${pattern}`, status === 200 && !denied(html), `status ${status}`);
    } else {
      check(`${role} is denied ${pattern}`, status === 200 && denied(html), `status ${status}`);
    }
  }
  for (const portal of ["owner", "tenant"]) {
    const { html } = await page(sessions[portal], url);
    check(`${portal} portal is denied ${pattern}`, denied(html));
  }
  const anonymous = await fetch(`${BASE}${url}`, { redirect: "manual" });
  check(`anonymous ${pattern} → /acceder`,
    anonymous.status === 307 && (anonymous.headers.get("location") ?? "").includes("/acceder"), `status ${anonymous.status}`);
}

async function probe(session, method, url) {
  if (method === "GET") {
    const response = await fetch(`${BASE}${url}`, { headers: { Cookie: `mghpm_session=${session}` } });
    return response.status;
  }
  // An empty body: an allowed role gets past the permission check and fails validation (400) or lookup (404).
  return (await api(session, method, url, {})).status;
}

console.log("APIs × roles");
for (const [handler, { module, action }] of Object.entries(staffApiPermissions)) {
  const [method, pattern] = handler.split(" ");
  const url = fill(pattern);
  for (const role of staffRoles) {
    const status = await probe(sessions[role], method, url);
    if (can(role, module, action)) {
      check(`${role} passes ${handler}`, status !== 401 && status !== 403, `status ${status}`);
    } else {
      check(`${role} gets 403 on ${handler}`, status === 403, `status ${status}`);
    }
  }
  for (const portal of ["owner", "tenant"]) {
    check(`${portal} portal gets 403 on ${handler}`, (await probe(sessions[portal], method, url)) === 403);
  }
  check(`anonymous gets 401 on ${handler}`, (await probe("", method, url)) === 401);
}

console.log("Menu × roles");
for (const role of staffRoles) {
  const { html } = await page(sessions[role], "/admin/properties");
  const nav = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  check(`${role} gets a menu`, nav.length > 0);
  for (const item of adminNavigation) {
    const shown = nav.includes(`href="${item.href}"`);
    const expected = can(role, item.module, "view");
    check(`${role} menu ${expected ? "shows" : "hides"} ${item.href}`, shown === expected);
  }
}

console.log("Create menu × roles");
const createMenu = (html) => {
  const block = html.match(/<div[^>]*data-create-menu=""[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
  return [...block.matchAll(/href="([^"]+)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
};
for (const role of staffRoles) {
  for (const [url, context] of [["/admin/properties", null], [`/admin/properties/${propertyId}`, propertyId]]) {
    const { html } = await page(sessions[role], url);
    const expected = buildCreateMenu(url, role).map((item) => item.href);
    const shown = createMenu(html);
    check(`${role} create menu on ${context ? "a property" : "/admin/properties"}`,
      JSON.stringify(shown) === JSON.stringify(expected), `shown ${JSON.stringify(shown)} expected ${JSON.stringify(expected)}`);
    if (context && can(role, "properties", "create")) {
      check(`${role} gets "Nueva unidad" and the prefilled property`,
        shown.includes(`/admin/properties/${propertyId}/units/new`) &&
          shown.includes(`/admin/leases/new?propertyId=${propertyId}`));
    }
  }
}
check("operations has no create button", !(await page(sessions.operations, "/admin")).html.includes("data-create-menu"));

finish();
