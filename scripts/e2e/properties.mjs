// E2E check for Masters 03, 04 and 20 against the Firebase emulators.
// Requires the emulators and a dev server on port 3100 pointed at them; see
// "Prueba end-to-end" in README.md. It wipes the demo-mghpm emulator data.
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

async function readProperty(organizationId, propertyId) {
  const snapshot = await db.doc(`organizations/${organizationId}/properties/${propertyId}`).get();
  return snapshot.data();
}

const propertyBody = {
  ...propertyWizardDefaults,
  name: "Ocean View Villa",
  code: "ovv-002",
  type: "residential",
  address: "2501 Collins Ave",
  city: "Miami Beach",
  state: "FL",
  postalCode: "33140",
  country: "US",
  status: "active",
};

function unitBody(label, status, extra = {}) {
  return {
    label,
    floor: "1",
    bedrooms: 2,
    bathrooms: 1.5,
    status,
    marketRent: "1250.50",
    marketRentCurrency: "USD",
    ...extra,
  };
}

await resetEmulators();
const owner = await signUp("owner@example.test");
const manager = await signUp("manager@example.test");
const outsider = await signUp("outsider@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"], [manager.uid, "manager"]]);
await seedOrganization("org-b", "Org B", [[outsider.uid, "org_owner"]]);

const ownerSession = await login(owner.idToken);
const managerSession = await login(manager.idToken);
const outsiderSession = await login(outsider.idToken);

console.log("Master 20 — Property Form");
let result = await api(ownerSession, "POST", "/api/properties", propertyBody);
check("create property returns 201", result.status === 201, JSON.stringify(result));
const propertyId = result.body?.propertyId;
let property = await readProperty("org-a", propertyId);
check("code normalized to upper case", property?.code === "OVV-002");
check("new property has zero units and vacant occupancy",
  property?.unitCount === 0 && property?.occupiedUnitCount === 0 && property?.occupancyStatus === "vacant");
check("search index generated", property?.searchName === "ocean view villa" && property?.searchKeys.length > 0);

result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, name: "Duplicate" });
check("duplicate code returns 409", result.status === 409);
result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, code: "", name: "" });
check("invalid payload returns 400", result.status === 400);
result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, code: "X-1" }, { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);
result = await api(managerSession, "POST", "/api/properties", { ...propertyBody, code: "MGR-1" });
check("manager can create (201)", result.status === 201, JSON.stringify(result));

result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, name: "Harbor Lofts", code: "HL-1" });
const secondPropertyId = result.body?.propertyId;
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}`, { ...propertyBody, name: "Ocean View Villas", code: "OVV-003" });
check("update property returns 200", result.status === 200, JSON.stringify(result));
property = await readProperty("org-a", propertyId);
check("update regenerates searchName", property?.searchName === "ocean view villas");
const reservations = await db.collection("organizations/org-a/propertyCodes").get();
check("code reservation moved (3 reservations remain)",
  reservations.size === 3 && reservations.docs.some((doc) => doc.data().code === "OVV-003"));
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}`, { ...propertyBody, code: "HL-1" });
check("update to an existing code returns 409", result.status === 409);
result = await api(ownerSession, "PATCH", "/api/properties/does-not-exist", propertyBody);
check("update unknown property returns 404", result.status === 404);
result = await api(outsiderSession, "PATCH", `/api/properties/${propertyId}`, propertyBody);
check("other organization cannot update (404)", result.status === 404);

console.log("Master 20 — Property wizard fields");
const draftBody = {
  ...propertyWizardDefaults,
  name: "Draft Without Address",
  code: "DRAFT-1",
  type: "land",
  status: "draft",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};
result = await api(ownerSession, "POST", "/api/properties", draftBody);
check("draft without address returns 201", result.status === 201, JSON.stringify(result));
const draftId = result.body?.propertyId;
property = await readProperty("org-a", draftId);
check("draft stores empty address and null country", property?.address === "" && property?.country === null);
result = await api(ownerSession, "PATCH", `/api/properties/${draftId}`, { ...draftBody, status: "active" });
check("activating without address returns 400", result.status === 400);

const wizardBody = {
  ...propertyBody,
  name: "Malecon Center",
  code: "MC-1",
  country: "DO",
  rentalCategory: "both",
  managementStartDate: "2026-11-01",
  description: "Torre frente al mar.",
  location: { lat: 18.4655, lng: -69.9137, placeId: "ChIJ-test", source: "places" },
  currency: "DOP",
  startingRent: "45000.50",
  securityDeposit: "90000",
  cleaningFee: "",
  electricityMeterRequired: true,
  electricityMeterNumber: "EDE-123",
  initialMeterReading: "1520.5",
  electricityRatePerKwh: "11.1234",
  waterIncluded: true,
  amenities: ["pool", "parking"],
};
result = await api(ownerSession, "POST", "/api/properties", wizardBody);
check("create with wizard fields returns 201", result.status === 201, JSON.stringify(result));
property = await readProperty("org-a", result.body?.propertyId);
check("location stored", property?.location?.lat === 18.4655 && property?.location?.source === "places");
check("reference amounts stored as minor units",
  property?.financialReference?.currency === "DOP" &&
  property.financialReference.startingRentMinor === 4500050 &&
  property.financialReference.securityDepositMinor === 9000000 &&
  property.financialReference.cleaningFeeMinor === null);
check("utilities stored",
  property?.utilities?.electricityMeterNumber === "EDE-123" &&
  property.utilities.initialMeterReading === 1520.5 &&
  property.utilities.electricityRatePerKwh === 11.1234 &&
  property.utilities.waterIncluded === true);
check("amenities, category and dates stored",
  property?.amenities?.join() === "pool,parking" &&
  property.rentalCategory === "both" &&
  property.managementStartDate === "2026-11-01");
result = await api(ownerSession, "POST", "/api/properties", {
  ...wizardBody, code: "MC-2", location: { lat: 95, lng: 0, placeId: "", source: "pin" },
});
check("latitude out of range returns 400", result.status === 400);
result = await api(ownerSession, "POST", "/api/properties", { ...wizardBody, code: "MC-3", amenities: ["pool", "pool"] });
check("duplicate amenities return 400", result.status === 400);
result = await api(ownerSession, "POST", "/api/properties", { ...wizardBody, code: "MC-4", startingRent: "10.999" });
check("rent with 3 decimals returns 400", result.status === 400);
result = await api(ownerSession, "POST", "/api/properties", { ...wizardBody, code: "MC-5", country: "MX" });
check("unsupported country returns 400", result.status === 400);

console.log("Master 04 — Units");
const units = {};
for (const [label, status] of [["101", "available"], ["102", "occupied"], ["103", "maintenance"]]) {
  result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units`, unitBody(label, status));
  units[label] = result.body?.unitId;
  check(`create unit ${label} returns 201`, result.status === 201, JSON.stringify(result));
}
const unitDoc = (await db.doc(`organizations/org-a/properties/${propertyId}/units/${units["101"]}`).get()).data();
check("rent stored as integer minor units", unitDoc?.marketRentMinor === 125050 && unitDoc?.marketRentCurrency === "USD");
property = await readProperty("org-a", propertyId);
check("projection: 3 units, 1 occupied, vacant",
  property.unitCount === 3 && property.occupiedUnitCount === 1 && property.occupancyStatus === "vacant",
  JSON.stringify({ u: property.unitCount, o: property.occupiedUnitCount, s: property.occupancyStatus }));
check("filter index follows occupancy",
  property.filterKeys.includes("status=active&occupancy=vacant&type=residential&archived=false"));

result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units`, unitBody(" 101 ", "available"));
check("duplicate unit label returns 409", result.status === 409);
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units`, unitBody("104", "available", { bathrooms: 1.25 }));
check("invalid bathrooms returns 400", result.status === 400);
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units`, unitBody("104", "available", { marketRent: "12.345" }));
check("rent with 3 decimals returns 400", result.status === 400);
result = await api(ownerSession, "POST", `/api/properties/${secondPropertyId}/units`, unitBody("101", "available"));
check("same label allowed in another property", result.status === 201);

result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/units/${units["101"]}`, unitBody("101", "occupied", { marketRent: "" }));
check("update unit returns 200", result.status === 200);
property = await readProperty("org-a", propertyId);
check("projection: no availability + maintenance => maintenance",
  property.occupiedUnitCount === 2 && property.occupancyStatus === "maintenance");
const updatedUnit = (await db.doc(`organizations/org-a/properties/${propertyId}/units/${units["101"]}`).get()).data();
check("empty rent clears amount and currency", updatedUnit.marketRentMinor === null && updatedUnit.marketRentCurrency === null);

result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units/${units["102"]}/archive`, { archived: true });
check("archiving an occupied unit returns 409", result.status === 409);
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units/${units["103"]}/archive`, { archived: true });
check("archive maintenance unit returns 200", result.status === 200);
property = await readProperty("org-a", propertyId);
check("projection: 2 active units all occupied => occupied",
  property.unitCount === 2 && property.occupiedUnitCount === 2 && property.occupancyStatus === "occupied");
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units`, unitBody("103", "available"));
check("archived label can be reused", result.status === 201);
const reusedUnitId = result.body?.unitId;
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units/${units["103"]}/archive`, { archived: false });
check("restore with conflicting active label returns 409", result.status === 409);
await api(ownerSession, "POST", `/api/properties/${propertyId}/units/${reusedUnitId}/archive`, { archived: true });
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units/${units["103"]}/archive`, { archived: false });
check("restore returns 200 once label is free", result.status === 200);
property = await readProperty("org-a", propertyId);
check("projection after restore: 3 units, maintenance",
  property.unitCount === 3 && property.occupancyStatus === "maintenance");

result = await api(managerSession, "POST", `/api/properties/${secondPropertyId}/units`, unitBody("201", "available"));
check("manager can create units (201)", result.status === 201, JSON.stringify(result));
result = await api(outsiderSession, "PATCH", `/api/properties/${propertyId}/units/${units["101"]}`, unitBody("101", "available"));
check("other organization cannot update unit (404)", result.status === 404);
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/units/nope`, unitBody("101", "available"));
check("unknown unit returns 404", result.status === 404);
result = await api(ownerSession, "POST", `/api/properties/nope/units`, unitBody("1", "available"));
check("unit in unknown property returns 404", result.status === 404);

const audits = await db.collection("organizations/org-a/auditEvents").get();
const actions = audits.docs.map((doc) => doc.data().action);
check("audit events recorded for unit changes",
  ["unit.created", "unit.updated", "unit.archived", "unit.restored"].every((action) => actions.includes(action)),
  JSON.stringify(actions));

console.log("Pages — Masters 03 and 04");
let view = await page(ownerSession, "/admin/properties");
check("list renders both properties", view.status === 200 && view.html.includes("Ocean View Villas") && view.html.includes("Harbor Lofts"));
check("list links to detail", view.html.includes(`href="/admin/properties/${propertyId}"`));
view = await page(ownerSession, "/admin/properties?occupancy=maintenance");
check("occupancy filter uses projection", view.html.includes("Ocean View Villas") && !view.html.includes("Harbor Lofts"));
view = await page(ownerSession, "/admin/properties?q=ocean");
check("search by name prefix", view.html.includes("Ocean View Villas") && !view.html.includes("Harbor Lofts"));
view = await page(ownerSession, `/admin/properties/${propertyId}`);
check("detail overview renders", view.status === 200 && view.html.includes("Ocean View Villas") && view.html.includes("OVV-003"));
view = await page(ownerSession, `/admin/properties/${propertyId}?tab=units`);
check("units tab lists active units", view.status === 200 && view.html.includes(">101<") && view.html.includes(">103<"));
check("units tab hides archived units by default", !view.html.includes("Ocultar archivadas") && view.html.includes("Mostrar archivadas"));
view = await page(ownerSession, `/admin/properties/${propertyId}?tab=units&archived=1`);
check("units tab can include archived units", view.html.includes("Ocultar archivadas"));
view = await page(ownerSession, `/admin/properties/${propertyId}/units/new`);
check("new unit page renders", view.status === 200 && view.html.includes("Nueva unidad"));
view = await page(ownerSession, `/admin/properties/${propertyId}/units/${units["101"]}/edit`);
check("edit unit page renders", view.status === 200 && /Editar unidad (<!-- -->)?101/.test(view.html) && view.html.includes("Archivar"), String(view.status));
view = await page(ownerSession, "/admin/properties/does-not-exist");
check("unknown property detail returns 404", view.status === 404);
view = await page(outsiderSession, `/admin/properties/${propertyId}`);
check("other organization gets 404 for detail", view.status === 404);
view = await page(managerSession, `/admin/properties/${propertyId}`);
check("manager sees property detail", view.status === 200 && view.html.includes("OVV-003") && !view.html.includes("Acceso restringido"));
view = await page("", `/admin/properties/${propertyId}`);
check("anonymous user is redirected", view.status === 307 || view.status === 303 || view.html.includes("/login"));

finish();
