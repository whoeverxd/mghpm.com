// E2E check for unit generation (Master 20 "Unidades" step and the detail's
// "Generar unidades") against the Firebase emulators. Requires the emulators
// and a dev server on port 3100 pointed at them; see "Prueba end-to-end" in
// README.md. It wipes the demo-mghpm emulator data.
// Usage: npm run test:e2e
import {
  api,
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

async function readProperty(propertyId) {
  return (await db.doc(`organizations/org-a/properties/${propertyId}`).get()).data();
}

async function readLabels(propertyId) {
  const snapshot = await db.collection(`organizations/org-a/properties/${propertyId}/units`).get();
  return snapshot.docs.map((doc) => doc.data().label).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

const propertyBody = {
  ...propertyWizardDefaults,
  name: "Torre Norte",
  code: "TN-1",
  type: "apartment_condo",
  status: "active",
  address: "Av. Anacaona 10",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO",
};

const generation = {
  numbering: "numeric",
  prefix: "",
  count: 3,
  startNumber: 101,
  firstFloor: 1,
  floorCount: 1,
  unitsPerFloor: 4,
  floor: "1",
  bedrooms: 2,
  bathrooms: 1.5,
  marketRent: "1200.50",
  marketRentCurrency: "USD",
};

await resetEmulators();
const owner = await signUp("owner@example.test");
const manager = await signUp("manager@example.test");
const outsider = await signUp("outsider@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"], [manager.uid, "manager"]]);
await seedOrganization("org-b", "Org B", [[outsider.uid, "org_owner"]]);
const ownerSession = await login(owner.idToken);
const managerSession = await login(manager.idToken);
const outsiderSession = await login(outsider.idToken);

console.log("Wizard — create property with units");
let result = await api(ownerSession, "POST", "/api/properties", {
  ...propertyBody,
  unitGeneration: generation,
});
check("create with units returns 201", result.status === 201, JSON.stringify(result));
const propertyId = result.body?.propertyId;
let property = await readProperty(propertyId);
check("property counters include generated units",
  property?.unitCount === 3 && property?.occupiedUnitCount === 0 && property?.occupancyStatus === "vacant",
  JSON.stringify(property && { unitCount: property.unitCount, occupancy: property.occupancyStatus }));
check("numeric labels 101–103", JSON.stringify(await readLabels(propertyId)) === '["101","102","103"]');
const unit = (await db.collection(`organizations/org-a/properties/${propertyId}/units`).limit(1).get()).docs[0]?.data();
check("unit defaults stored",
  unit?.status === "available" && unit?.bedrooms === 2 && unit?.bathrooms === 1.5 &&
  unit?.marketRentMinor === 120050 && unit?.marketRentCurrency === "USD" && unit?.floor === "1" &&
  unit?.labelKey === unit?.label && unit?.archived === false && unit?.organizationId === "org-a");
const created = await db.collection("organizations/org-a/auditEvents")
  .where("action", "==", "property.created").get();
check("property audit records unit count", created.docs[0]?.data().unitCount === 3);

result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, code: "TN-2", unitGeneration: null });
check("unitGeneration null creates no units", result.status === 201 && (await readProperty(result.body?.propertyId))?.unitCount === 0);
result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, code: "TN-3" });
check("omitted unitGeneration creates no units", result.status === 201 && (await readProperty(result.body?.propertyId))?.unitCount === 0);
const emptyPropertyId = result.body?.propertyId;

result = await api(ownerSession, "POST", "/api/properties", {
  ...propertyBody, code: "TN-4", unitGeneration: { ...generation, count: 0 },
});
check("count 0 returns 400 and creates nothing", result.status === 400 &&
  (await db.collection("organizations/org-a/properties").where("code", "==", "TN-4").get()).empty);
result = await api(ownerSession, "POST", "/api/properties", {
  ...propertyBody, code: "TN-5", unitGeneration: { ...generation, numbering: "by_floor", floorCount: 30, unitsPerFloor: 10 },
});
check("by-floor over 200 units returns 400", result.status === 400, JSON.stringify(result.body));
result = await api(ownerSession, "POST", "/api/properties", {
  ...propertyBody, code: "TN-6", unitGeneration: { ...generation, prefix: "A/B" },
});
check("invalid prefix returns 400", result.status === 400);

console.log("Detail — generate units");
const generate = (session, id, body) => api(session, "POST", `/api/properties/${id}/units/generate`, body);

result = await generate(ownerSession, emptyPropertyId, {
  ...generation, numbering: "by_floor", prefix: "T-", firstFloor: 2, floorCount: 2, unitsPerFloor: 3,
});
check("by-floor generation returns 201 with count", result.status === 201 && result.body?.createdCount === 6, JSON.stringify(result));
check("by-floor labels and floors",
  JSON.stringify(await readLabels(emptyPropertyId)) === '["T-201","T-202","T-203","T-301","T-302","T-303"]');
const floors = (await db.collection(`organizations/org-a/properties/${emptyPropertyId}/units`).where("label", "==", "T-302").get()).docs[0]?.data().floor;
check("by-floor unit gets its floor", floors === "3");
check("projection updated to 6 units", (await readProperty(emptyPropertyId))?.unitCount === 6);
const batchAudit = await db.collection("organizations/org-a/auditEvents").where("action", "==", "unit.batch_created").get();
check("batch audit event recorded", batchAudit.size === 1 && batchAudit.docs[0].data().unitCount === 6);

result = await generate(ownerSession, emptyPropertyId, { ...generation, numbering: "alphanumeric", prefix: "L", count: 28 });
check("alphanumeric generation returns 201", result.status === 201, JSON.stringify(result));
const labels = await readLabels(emptyPropertyId);
check("alphanumeric wraps Z → AA, AB", labels.includes("LA") && labels.includes("LZ") && labels.includes("LAA") && labels.includes("LAB"));

result = await generate(ownerSession, propertyId, { ...generation, startNumber: 103, count: 2 });
check("conflicting labels return 409", result.status === 409 && /103/.test(result.body?.error ?? ""), JSON.stringify(result.body));
check("conflict creates nothing (still 3 units)", (await readProperty(propertyId))?.unitCount === 3);

// An archived unit frees its label for a new batch.
const unit103 = (await db.collection(`organizations/org-a/properties/${propertyId}/units`).where("label", "==", "103").get()).docs[0];
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units/${unit103.id}/archive`, { archived: true });
check("archive unit 103", result.status === 200, JSON.stringify(result));
result = await generate(ownerSession, propertyId, { ...generation, startNumber: 103, count: 2 });
check("archived label can be generated again", result.status === 201 && (await readProperty(propertyId))?.unitCount === 4, JSON.stringify(result));

result = await generate(ownerSession, propertyId, { ...generation, count: 201 });
check("count over 200 returns 400", result.status === 400);
// Separate property so the manager generation does not disturb the counts checked below.
result = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, code: "TN-MGR" });
const managerPropertyId = result.body?.propertyId;
result = await generate(managerSession, managerPropertyId, generation);
check("manager can generate (201)", result.status === 201, JSON.stringify(result));
result = await generate(outsiderSession, propertyId, generation);
check("other organization gets 404", result.status === 404, JSON.stringify(result));
result = await api(ownerSession, "POST", `/api/properties/${propertyId}/units/generate`, generation, { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);

// Property limit: 500 units including archived ones.
const limitRef = await api(ownerSession, "POST", "/api/properties", { ...propertyBody, code: "TN-LIMIT", unitGeneration: { ...generation, count: 200 } });
const limitId = limitRef.body?.propertyId;
await generate(ownerSession, limitId, { ...generation, startNumber: 1000, count: 200 });
result = await generate(ownerSession, limitId, { ...generation, startNumber: 5000, count: 101 });
check("exceeding 500 units returns 409", result.status === 409 && (await readProperty(limitId))?.unitCount === 400, JSON.stringify(result.body));

console.log("Pages");
let response = await page(ownerSession, `/admin/properties/${propertyId}/units/generate`);
check("generate page renders for owner", response.status === 200 && response.html.includes("Generar unidades"));
check("generate page suggests next number", response.html.includes('value="105"'));
response = await page(ownerSession, `/admin/properties/${propertyId}?tab=units`);
check("units tab links to generate", response.html.includes(`/admin/properties/${propertyId}/units/generate`));
response = await page(managerSession, `/admin/properties/${propertyId}/units/generate`);
check("manager sees the generate form", response.status === 200 && response.html.includes("Numeración y valores"));
response = await page(ownerSession, "/admin/properties/new");
check("wizard has 5 steps including Unidades", /Paso (<!-- -->)?1(<!-- -->)? de (<!-- -->)?5/.test(response.html));

finish();
