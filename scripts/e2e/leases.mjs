// E2E check for Masters 40 (Create Lease) and 15 (Leases) against the Firebase
// emulators. Requires the emulators and a dev server on port 3100 pointed at
// them; see "Prueba end-to-end" in README.md. It wipes the demo-mghpm data.
// Usage: npm run test:e2e
import {
  api,
  check,
  db,
  finish,
  login,
  page,
  resetEmulators,
  seedOrganization,
  signUp,
  propertyWizardDefaults,
} from "./lib.mjs";

// Seeded organizations use America/New_York; dates are relative to its today.
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
function iso(offsetDays) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function read(path) {
  return (await db.doc(path).get()).data();
}

const propertyBody = {
  ...propertyWizardDefaults,
  name: "Brickell Bay Residences",
  code: "BBR-1",
  type: "residential",
  address: "1200 Brickell Bay Dr",
  city: "Miami",
  state: "FL",
  postalCode: "33131",
  country: "US",
  status: "active",
};

function unitBody(label, status = "available") {
  return {
    label,
    floor: "12",
    bedrooms: 2,
    bathrooms: 2,
    status,
    marketRent: "",
    marketRentCurrency: "USD",
  };
}

function personBody(relationship, name, email) {
  return {
    kind: "individual",
    name,
    email,
    phone: "",
    status: relationship === "owner" ? "active" : "pending",
    relationships: { owner: relationship === "owner", tenant: relationship === "tenant" },
  };
}

const utilities = {
  electricity: { party: "tenant", notes: "" },
  water: { party: "owner", notes: "Incluida" },
  internet: { party: "tenant", notes: "" },
  gas: { party: "na", notes: "" },
  hoa: { party: "owner", notes: "" },
};

function leaseBody(overrides) {
  return {
    intent: "pending",
    source: "admin",
    renewOfLeaseId: "",
    parties: [],
    startDate: iso(2),
    endDate: iso(366),
    possessionDate: "",
    moveInDate: "",
    renewalType: "manual",
    noticeDays: 60,
    currency: "USD",
    rent: "1500.00",
    dueDay: 1,
    graceDays: 5,
    lateFeeRule: "percent_5",
    lateFeeFlat: "",
    firstRentDueDate: "",
    prorateFirstPeriod: false,
    securityDeposit: "1500",
    additionalDeposit: "",
    petDeposit: "",
    advanceRent: "",
    otherChargeLabel: "",
    otherCharge: "",
    collectFirstMonthRent: true,
    utilities,
    ...overrides,
  };
}

await resetEmulators();
const admin = await signUp("admin@example.test");
const manager = await signUp("manager@example.test");
const outsider = await signUp("outsider@example.test");
await seedOrganization("org-a", "Org A", [[admin.uid, "org_owner"], [manager.uid, "manager"]]);
await seedOrganization("org-b", "Org B", [[outsider.uid, "org_owner"]]);

const adminSession = await login(admin.idToken);
const managerSession = await login(manager.idToken);
const outsiderSession = await login(outsider.idToken);

let result = await api(adminSession, "POST", "/api/properties", propertyBody);
const propertyId = result.body?.propertyId;
const unitIds = {};
for (const label of ["1204", "806", "PH-1", "ARCH"]) {
  result = await api(adminSession, "POST", `/api/properties/${propertyId}/units`, unitBody(label));
  unitIds[label] = result.body?.unitId;
}
await api(adminSession, "POST", `/api/properties/${propertyId}/units/${unitIds.ARCH}/archive`, { archived: true });
result = await api(adminSession, "POST", "/api/people", personBody("tenant", "Daniela Ortiz", "daniela@example.test"));
const tenantId = result.body?.personId;
result = await api(adminSession, "POST", "/api/people", personBody("tenant", "Marco Ruiz", "marco@example.test"));
const secondTenantId = result.body?.personId;
result = await api(adminSession, "POST", "/api/people", personBody("owner", "Las Olas LP", "owner@example.test"));
const ownerId = result.body?.personId;
result = await api(adminSession, "POST", "/api/people", {
  ...personBody("owner", "Holding Olas SRL", "holding@example.test"),
  kind: "entity",
  entityType: "company",
});
const entityId = result.body?.personId;
result = await api(outsiderSession, "POST", "/api/properties", { ...propertyBody, code: "OTHER-1" });
const foreignPropertyId = result.body?.propertyId;
result = await api(outsiderSession, "POST", `/api/properties/${foreignPropertyId}/units`, unitBody("1"));
const foreignUnitId = result.body?.unitId;
check("fixtures created",
  Boolean(propertyId && unitIds["1204"] && unitIds["806"] && unitIds["PH-1"] && tenantId &&
    secondTenantId && ownerId && foreignPropertyId && foreignUnitId));

const onUnit1204 = { propertyId, unitId: unitIds["1204"], tenantId };

console.log("Master 40 — create");
result = await api(adminSession, "POST", "/api/leases", {
  ...leaseBody(onUnit1204),
  intent: "draft",
  startDate: "",
  endDate: "",
  rent: "",
});
check("incomplete draft returns 201", result.status === 201, JSON.stringify(result));
const draftId = result.body?.leaseId;
let lease = await read(`organizations/org-a/leases/${draftId}`);
const year = new Date().getUTCFullYear();
check("draft stored with sequential code",
  lease?.status === "draft" && lease?.code === `L-${year}-0001` && lease?.startDate === null &&
    lease?.rentMinor === 0);
check("draft copies names for search",
  lease?.tenantName === "Daniela Ortiz" && lease?.propertyName === "Brickell Bay Residences" &&
    lease?.unitLabel === "1204");

result = await api(adminSession, "POST", "/api/leases", { ...leaseBody(onUnit1204), startDate: "" });
check("pending without start date returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/leases", { ...leaseBody(onUnit1204), rent: "0" });
check("pending without rent returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/leases", { ...leaseBody(onUnit1204), endDate: iso(1) });
check("end before start returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/leases", { ...leaseBody(onUnit1204), lateFeeRule: "flat" });
check("flat late fee without amount returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/leases", { ...leaseBody(onUnit1204), source: "renewal" });
check("renewal without lease returns 400", result.status === 400);

result = await api(adminSession, "POST", "/api/leases", leaseBody({
  ...onUnit1204,
  parties: [{ role: "guarantor", name: "Luis Ortiz", email: "luis@example.test" }],
  lateFeeRule: "flat",
  lateFeeFlat: "50",
  otherCharge: "25.5",
  otherChargeLabel: "Llaves",
}));
check("pending lease returns 201", result.status === 201, JSON.stringify(result));
const leaseId = result.body?.leaseId;
lease = await read(`organizations/org-a/leases/${leaseId}`);
check("money stored in minor units",
  lease?.rentMinor === 150000 && lease?.securityDepositMinor === 150000 &&
    lease?.lateFeeFlatMinor === 5000 && lease?.otherChargeMinor === 2550);
check("first rent due defaults to start", lease?.firstRentDueDate === iso(2));
check("parties and utilities stored",
  lease?.parties.length === 1 && lease?.parties[0].role === "guarantor" &&
    lease?.utilities.water.notes === "Incluida");
check("search keys include tenant and code",
  lease?.searchKeys.includes("status=*&search=dani") &&
    lease?.searchKeys.includes(`status=pending&search=l-${year}-0002`) &&
    lease?.filterKeys.includes("status=pending&currency=USD"));
let unit = await read(`organizations/org-a/properties/${propertyId}/units/${unitIds["1204"]}`);
check("pending lease does not occupy the unit", unit?.status === "available" && !unit?.activeLeaseId);
const created = await db.collection("organizations/org-a/auditEvents")
  .where("action", "==", "lease.created").get();
check("creation audited", created.size === 2);

console.log("Overlap and links");
result = await api(adminSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, tenantId: secondTenantId, startDate: iso(100), endDate: iso(400) }));
check("overlapping pending lease returns 409", result.status === 409, JSON.stringify(result));
result = await api(adminSession, "POST", "/api/leases", { ...leaseBody({ ...onUnit1204, startDate: iso(100), endDate: iso(400) }), intent: "draft" });
check("overlapping draft is allowed", result.status === 201);
const overlappingDraftId = result.body?.leaseId;
result = await api(adminSession, "PATCH", `/api/leases/${overlappingDraftId}`, leaseBody({ ...onUnit1204, startDate: iso(100), endDate: iso(400) }));
check("promoting an overlapping draft returns 409", result.status === 409);
result = await api(adminSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, startDate: iso(367), endDate: iso(500) }));
check("adjacent lease after the end returns 201", result.status === 201);
const adjacentId = result.body?.leaseId;

result = await api(adminSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, tenantId: entityId, startDate: iso(1500), endDate: iso(1600) }));
check("an entity as primary tenant returns 400", result.status === 400, JSON.stringify(result));
// Any individual may be a tenant: activating the lease creates the relationship (owner-only people included).
result = await api(adminSession, "POST", "/api/leases", { ...leaseBody({ ...onUnit1204, tenantId: ownerId, startDate: iso(2000), endDate: iso(2100) }), intent: "draft" });
check("an owner-only individual can be the tenant of a lease", result.status === 201, JSON.stringify(result));
result = await api(adminSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, unitId: unitIds.ARCH }));
check("archived unit returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, propertyId: foreignPropertyId, unitId: foreignUnitId }));
check("property from another organization returns 400", result.status === 400);
// A far-future draft: the permission check passes and it cannot overlap any lease above.
result = await api(managerSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, startDate: iso(1000), endDate: iso(1100), intent: "draft" }));
check("manager can create (201)", result.status === 201, JSON.stringify(result));
result = await api(adminSession, "POST", "/api/leases", leaseBody(onUnit1204), { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);
result = await api(outsiderSession, "PATCH", `/api/leases/${draftId}`, leaseBody(onUnit1204));
check("other organization cannot edit (404)", result.status === 404);
result = await api(adminSession, "PATCH", `/api/leases/${leaseId}`, { ...leaseBody(onUnit1204), intent: "draft" });
check("pending cannot go back to draft (409)", result.status === 409);

result = await api(adminSession, "POST", `/api/people/${tenantId}/archive`, { archived: true });
check("tenant with an open lease cannot be archived (409)", result.status === 409, JSON.stringify(result));

console.log("Activation");
await api(adminSession, "PATCH", `/api/properties/${propertyId}/units/${unitIds["806"]}`, unitBody("806", "occupied"));
result = await api(adminSession, "POST", "/api/leases", leaseBody({ propertyId, unitId: unitIds["806"], tenantId: secondTenantId }));
const manualUnitLeaseId = result.body?.leaseId;
result = await api(adminSession, "POST", `/api/leases/${manualUnitLeaseId}/status`, { action: "activate" });
check("unit occupied without lease blocks activation (409)", result.status === 409, JSON.stringify(result));
result = await api(adminSession, "POST", `/api/leases/${draftId}/status`, { action: "activate" });
check("draft cannot be activated (409)", result.status === 409);

result = await api(adminSession, "POST", `/api/leases/${leaseId}/status`, { action: "activate" });
check("activation returns 200", result.status === 200, JSON.stringify(result));
lease = await read(`organizations/org-a/leases/${leaseId}`);
unit = await read(`organizations/org-a/properties/${propertyId}/units/${unitIds["1204"]}`);
let property = await read(`organizations/org-a/properties/${propertyId}`);
let tenant = await read(`organizations/org-a/people/${tenantId}`);
check("lease is active", lease?.status === "active" && lease?.filterKeys.includes("status=active&currency=USD"));
check("unit occupied by the lease", unit?.status === "occupied" && unit?.activeLeaseId === leaseId);
check("property projection updated", property?.occupiedUnitCount === 2 && property?.unitCount === 3);
check("tenant active on the unit",
  tenant?.status === "active" && tenant?.unitId === unitIds["1204"] &&
    tenant?.filterKeys.includes("relationship=tenant&status=active&archived=false"));
check("activation leaves the tenant with an active tenant relationship",
  tenant?.relationshipTypes.includes("tenant") && tenant?.relationships.tenant?.status === "active" &&
    tenant?.relationships.tenant?.unitId === unitIds["1204"], JSON.stringify(tenant?.relationships));
result = await api(adminSession, "POST", `/api/leases/${leaseId}/status`, { action: "activate" });
check("activating twice returns 409", result.status === 409);
result = await api(adminSession, "PATCH", `/api/leases/${leaseId}`, leaseBody(onUnit1204));
check("active lease cannot be edited (409)", result.status === 409);
result = await api(adminSession, "PATCH", `/api/properties/${propertyId}/units/${unitIds["1204"]}`, unitBody("1204", "available"));
check("leased unit cannot be set available (409)", result.status === 409, JSON.stringify(result));
result = await api(adminSession, "PATCH", `/api/properties/${propertyId}/units/${unitIds["1204"]}`, { ...unitBody("1204", "occupied"), floor: "14" });
check("leased unit can still be edited while occupied", result.status === 200);
result = await api(adminSession, "POST", `/api/leases/${leaseId}/status`, { action: "expire" });
check("lease before its end cannot expire (409)", result.status === 409);

console.log("Cancel and renewal");
result = await api(adminSession, "POST", `/api/leases/${adjacentId}/status`, { action: "cancel", reason: "" });
check("cancel without reason returns 400", result.status === 400);
result = await api(adminSession, "POST", `/api/leases/${adjacentId}/status`, { action: "cancel", reason: "Se registró como renovación" });
lease = await read(`organizations/org-a/leases/${adjacentId}`);
check("cancel stores reason", result.status === 200 && lease?.status === "cancelled" && lease?.closeReason === "Se registró como renovación");
result = await api(adminSession, "POST", `/api/leases/${leaseId}/status`, { action: "cancel", reason: "x" });
check("active lease cannot be cancelled (409)", result.status === 409);

result = await api(adminSession, "POST", "/api/leases", leaseBody({
  ...onUnit1204,
  tenantId: secondTenantId,
  source: "renewal",
  renewOfLeaseId: leaseId,
  startDate: iso(367),
  endDate: iso(731),
}));
check("a renewal must keep the same tenant (400)", result.status === 400, JSON.stringify(result));
result = await api(adminSession, "POST", "/api/leases", leaseBody({
  ...onUnit1204,
  source: "renewal",
  renewOfLeaseId: leaseId,
  startDate: iso(367),
  endDate: iso(731),
  rent: "1600",
}));
check("renewal returns 201", result.status === 201, JSON.stringify(result));
const renewalId = result.body?.leaseId;
result = await api(adminSession, "POST", "/api/leases", leaseBody({ ...onUnit1204, source: "renewal", renewOfLeaseId: draftId, startDate: iso(800), endDate: iso(900) }));
check("renewing a non-active lease returns 400", result.status === 400);
result = await api(adminSession, "POST", `/api/leases/${renewalId}/status`, { action: "activate" });
check("renewal activation returns 200", result.status === 200, JSON.stringify(result));
lease = await read(`organizations/org-a/leases/${leaseId}`);
unit = await read(`organizations/org-a/properties/${propertyId}/units/${unitIds["1204"]}`);
check("renewed lease expires", lease?.status === "expired" && lease?.closeReason?.startsWith("Renovado por"));
check("renewal takes over the unit", unit?.status === "occupied" && unit?.activeLeaseId === renewalId);

console.log("Termination and expiry");
result = await api(adminSession, "POST", `/api/leases/${renewalId}/status`, { action: "terminate", reason: "Mudanza", effectiveDate: iso(1) });
check("future termination returns 409", result.status === 409);
result = await api(adminSession, "POST", `/api/leases/${renewalId}/status`, { action: "terminate", reason: "Mudanza anticipada", effectiveDate: today });
check("termination returns 200", result.status === 200, JSON.stringify(result));
lease = await read(`organizations/org-a/leases/${renewalId}`);
unit = await read(`organizations/org-a/properties/${propertyId}/units/${unitIds["1204"]}`);
property = await read(`organizations/org-a/properties/${propertyId}`);
tenant = await read(`organizations/org-a/people/${tenantId}`);
check("terminated lease stores date and reason",
  lease?.status === "terminated" && lease?.closedOn === today && lease?.closeReason === "Mudanza anticipada");
check("unit released", unit?.status === "available" && unit?.activeLeaseId === null);
check("property projection released", property?.occupiedUnitCount === 1);
check("tenant moved out and unlinked", tenant?.status === "inactive" && tenant?.unitId === null);
check("termination ends the tenant relationship when no other lease is active",
  tenant?.relationships.tenant?.status === "ended" && !tenant?.relationshipTypes.includes("tenant") &&
    tenant?.filterKeys.includes("relationship=*&status=inactive&archived=false") &&
    !tenant?.filterKeys.includes("relationship=tenant&status=inactive&archived=false"),
  JSON.stringify(tenant?.relationships));

result = await api(adminSession, "POST", "/api/leases", leaseBody({ propertyId, unitId: unitIds["PH-1"], tenantId: secondTenantId, startDate: iso(-400), endDate: iso(-35) }));
const pastLeaseId = result.body?.leaseId;
await api(adminSession, "POST", `/api/leases/${pastLeaseId}/status`, { action: "activate" });
result = await api(adminSession, "POST", `/api/leases/${pastLeaseId}/status`, { action: "expire" });
lease = await read(`organizations/org-a/leases/${pastLeaseId}`);
unit = await read(`organizations/org-a/properties/${propertyId}/units/${unitIds["PH-1"]}`);
check("ended lease expires", result.status === 200 && lease?.status === "expired" && lease?.closedOn === iso(-35));
check("expiry releases the unit", unit?.status === "available" && unit?.activeLeaseId === null);

result = await api(adminSession, "POST", "/api/leases", leaseBody({ propertyId, unitId: unitIds["PH-1"], tenantId: secondTenantId, startDate: iso(-300), endDate: iso(30), currency: "DOP", rent: "45000" }));
const expiringId = result.body?.leaseId;
result = await api(adminSession, "POST", `/api/leases/${expiringId}/status`, { action: "activate" });
check("expiring lease activated", result.status === 200, JSON.stringify(result));
const audits = await db.collection("organizations/org-a/auditEvents")
  .where("targetId", "==", leaseId).get();
check("lifecycle audited",
  ["lease.created", "lease.activated", "lease.expired"].every((action) =>
    audits.docs.some((doc) => doc.data().action === action)));

console.log("Master 15 — list");
let view = await page(adminSession, "/admin/leases");
check("list renders all leases", view.status === 200 && view.html.includes(`L-${year}-0001`) && view.html.includes("Daniela Ortiz"));
view = await page(adminSession, "/admin/leases?view=expiring");
const expiringCode = (await read(`organizations/org-a/leases/${expiringId}`))?.code;
check("expiring view lists only leases ending within 90 days",
  view.status === 200 && view.html.includes(expiringCode) && !view.html.includes(`L-${year}-0001`) &&
    view.html.includes("Vence en 30 días"));
view = await page(adminSession, "/admin/leases?view=active");
check("active view lists active leases", view.html.includes(expiringCode) && !view.html.includes(`L-${year}-0001`));
view = await page(adminSession, "/admin/leases?q=marco");
check("search by tenant name", view.html.includes(expiringCode) && !view.html.includes("Daniela Ortiz"));
view = await page(adminSession, "/admin/leases?view=bogus");
check("invalid view shows the filter error", view.html.includes("No se pudo aplicar la búsqueda"));
view = await page(adminSession, `/admin/leases/${renewalId}`);
check("detail shows terms and close reason",
  view.status === 200 && view.html.includes("Mudanza anticipada") && view.html.includes("Renueva"));
view = await page(adminSession, `/admin/leases/${leaseId}/edit`);
check("closed lease edit redirects to detail", view.status === 307 || view.status === 303);
view = await page(adminSession, `/admin/leases/${draftId}/edit`);
check("draft opens the form", view.status === 200 && view.html.includes("Continuar borrador"));
view = await page(adminSession, "/admin/leases/new");
check("create form renders", view.status === 200 && view.html.includes("Origen del contrato"));
view = await page(adminSession, `/admin/properties/${propertyId}/units/${unitIds["PH-1"]}/edit`);
check("leased unit form shows the lock", view.html.includes("Ocupada por contrato activo"));

console.log("Isolation and roles");
view = await page(outsiderSession, `/admin/leases/${leaseId}`);
check("other organization gets 404", view.status === 404);
view = await page(outsiderSession, "/admin/leases");
check("other organization list is isolated", view.status === 200 && !view.html.includes("Daniela Ortiz"));
view = await page(managerSession, "/admin/leases");
check("manager sees the leases list",
  view.status === 200 && view.html.includes("Daniela Ortiz") && !view.html.includes("Acceso restringido"));
view = await page("", "/admin/leases");
check("anonymous user is redirected", view.status === 307 || view.status === 303 || view.html.includes("/login"));

finish();
