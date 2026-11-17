// E2E for the admin global search (paso 4C): the /api/search endpoint used by the
// top-bar box and the /admin/buscar results page. Requires the emulators and a
// server on port 3100 (see README). Wipes demo-mghpm data.
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
const owner = await signUp("owner@example.test");
const portal = await signUp("portal@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"]]);
const session = await login(owner.idToken);

let result = await api(session, "POST", "/api/properties", {
  ...propertyWizardDefaults,
  name: "Torre Árbol",
  code: "TA-77",
  type: "apartment_condo",
  status: "active",
  address: "Calle Duarte 5",
  city: "Santiago",
  state: "Santiago",
  postalCode: "51000",
  country: "DO",
});
const propertyId = result.body?.propertyId;
result = await api(session, "POST", `/api/properties/${propertyId}/units`, {
  label: "3B", floor: "3", bedrooms: 2, bathrooms: 1, status: "available", marketRent: "", marketRentCurrency: "USD",
});
const unitId = result.body?.unitId;
result = await api(session, "POST", "/api/people", {
  kind: "individual", name: "José Pérez", email: "jose.perez@example.test", phone: "", status: "active",
  relationships: { owner: false, tenant: true },
});
const personId = result.body?.personId;
result = await api(session, "POST", "/api/leases", {
  intent: "draft", source: "admin", renewOfLeaseId: "", parties: [], propertyId, unitId, tenantId: personId,
  startDate: "", endDate: "", possessionDate: "", moveInDate: "", renewalType: "manual", noticeDays: 60,
  currency: "USD", rent: "", dueDay: 1, graceDays: 5, lateFeeRule: "percent_5", lateFeeFlat: "",
  firstRentDueDate: "", prorateFirstPeriod: false, securityDeposit: "", additionalDeposit: "", petDeposit: "",
  advanceRent: "", otherChargeLabel: "", otherCharge: "", collectFirstMonthRent: true,
  utilities: Object.fromEntries(["electricity", "water", "internet", "gas", "hoa"].map((k) => [k, { party: "na", notes: "" }])),
});
const leaseId = result.body?.leaseId;
const leaseCode = leaseId ? (await db.doc(`organizations/org-a/leases/${leaseId}`).get()).get("code") : null;
check("fixtures created", Boolean(propertyId && unitId && personId && leaseId && leaseCode),
  JSON.stringify({ propertyId, unitId, personId, leaseId, leaseCode }));

// Portal user: same organization, no staff role.
await db.doc(`organizations/org-a/memberships/${portal.uid}`).set({
  userUid: portal.uid, organizationId: "org-a", staffRole: null, portals: ["tenant"],
  portalPersonIds: { tenant: personId }, status: "active",
});
const portalSession = await login(portal.idToken);

async function search(q, cookie = session) {
  const response = await fetch(`${BASE}/api/search?q=${encodeURIComponent(q)}`, {
    headers: cookie ? { Cookie: `mghpm_session=${cookie}` } : {},
  });
  const body = response.ok ? await response.json() : null;
  return { status: response.status, groups: body?.groups ?? [] };
}
const labels = (groups, module) => groups.find((group) => group.module === module)?.items.map((item) => item.label) ?? [];

console.log("API");
let found = await search("torre");
check("groups in display order", JSON.stringify(found.groups.map((group) => group.module)) === '["properties","people","leases"]',
  JSON.stringify(found.groups.map((group) => group.module)));
check("property by name prefix", labels(found.groups, "properties").includes("Torre Árbol"));
check("lease by property name", labels(found.groups, "leases").includes(leaseCode));
found = await search("arbol");
check("search ignores accents", labels(found.groups, "properties").includes("Torre Árbol"));
found = await search("TA-7");
check("property by code", labels(found.groups, "properties").includes("Torre Árbol"));
found = await search("jose.perez");
check("person by email", labels(found.groups, "people").includes("José Pérez"));
found = await search("pérez");
check("lease by tenant name", labels(found.groups, "leases").includes(leaseCode));
found = await search(leaseCode);
check("lease by code", labels(found.groups, "leases").includes(leaseCode));
const item = found.groups.find((group) => group.module === "leases")?.items[0];
check("items link to the record", item?.href === `/admin/leases/${leaseId}`, JSON.stringify(item));
found = await search("zzzz");
check("no matches → empty groups", found.status === 200 && found.groups.every((group) => group.items.length === 0));
found = await search("t");
check("fewer than 2 characters → no groups", found.status === 200 && found.groups.length === 0);
check("portal user gets 403", (await search("torre", portalSession)).status === 403);
check("anonymous gets 401", (await search("torre", "")).status === 401);

console.log("Results page");
let html = (await page(session, "/admin/buscar?q=torre")).html;
check("page lists the property", html.includes("Torre Árbol") && html.includes('data-search-group="properties"'));
check("page links to the filtered list", html.includes('href="/admin/properties?q=torre"'));
html = (await page(session, "/admin/buscar?q=x")).html;
check("short query asks for more text", html.includes("Escribe lo que buscas"));
check("top bar has the search box", html.includes('role="combobox"'));

finish();
