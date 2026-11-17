// E2E check for Fase 2A-2: ownerships (titularidades), their review workflow, the
// Owner 360 / Propietarios screens, the owner portal and the relationships migration.
// Requires the emulators and a dev server on port 3100 pointed at them; see
// "Prueba end-to-end" in README.md. It wipes the demo-mghpm emulator data.
// Usage: npm run test:e2e
import { execFileSync } from "node:child_process";
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

const propertyBody = (name, code) => ({
  ...propertyWizardDefaults,
  name,
  code,
  type: "residential",
  address: "1200 Brickell Bay Dr",
  city: "Miami",
  state: "FL",
  postalCode: "33131",
  country: "US",
  status: "active",
});

const personBody = (name, email, relationships, extra = {}) => ({
  kind: "individual",
  name,
  email,
  phone: "",
  status: "active",
  relationships,
  ...extra,
});

const ownershipBody = (personId, propertyId, pct) => ({
  personId,
  propertyId,
  pct,
  startDate: "2024-01-01",
  titleOwner: "",
  titleNumber: "",
  registryNumber: "",
  cadastralNumber: "",
  registryAddress: "",
});

const noChecks = {
  deedOnFile: false,
  recordMatches: false,
  ownerIdentity: false,
  entityGoodStanding: false,
  coOwnerAuthorization: false,
  managementAgreement: false,
};

const read = async (path) => (await db.doc(path).get()).data();
// React separates adjacent text nodes with comments in the server HTML.
const hasPct = (html, value) => new RegExp(`${value}(<!-- -->)? %`).test(html);

async function grantPortal(organizationId, uid, lane, personId) {
  await db.doc(`organizations/${organizationId}/memberships/${uid}`).set({
    userUid: uid,
    organizationId,
    staffRole: null,
    portals: [lane],
    portalPersonIds: { [lane]: personId },
    status: "active",
  });
}

await resetEmulators();
const holder = await signUp("holder@example.test");
const reviewer = await signUp("reviewer@example.test");
const manager = await signUp("manager@example.test");
const ana = await signUp("ana@example.test");
const carlos = await signUp("carlos@example.test");
const diana = await signUp("diana@example.test");
await seedOrganization("org-a", "Org A", [
  [holder.uid, "org_owner"],
  [reviewer.uid, "admin"],
  [manager.uid, "manager"],
]);
const holderSession = await login(holder.idToken);
const reviewerSession = await login(reviewer.idToken);
const managerSession = await login(manager.idToken);

let result = await api(holderSession, "POST", "/api/properties", propertyBody("Torre Titulares", "TT-1"));
const propertyId = result.body?.propertyId;
result = await api(holderSession, "POST", "/api/properties", propertyBody("Torre Dos", "TT-2"));
const property2Id = result.body?.propertyId;
result = await api(holderSession, "POST", "/api/people", personBody("Ana Pérez", "ana@example.test", { owner: true, tenant: false }));
const anaId = result.body?.personId;
result = await api(holderSession, "POST", "/api/people", personBody("Beto Gómez", "beto@example.test", { owner: true, tenant: false }));
const betoId = result.body?.personId;
result = await api(holderSession, "POST", "/api/people", personBody("Carlos Díaz", "carlos@example.test", { owner: true, tenant: false }));
const carlosId = result.body?.personId;
result = await api(holderSession, "POST", "/api/people", personBody("Diana Rey", "diana@example.test", { owner: false, tenant: true }));
const dianaId = result.body?.personId;
result = await api(holderSession, "POST", "/api/people", {
  ...personBody("Inversiones Alfa SRL", "alfa@example.test", { owner: true, tenant: false }),
  kind: "entity",
  entityType: "company",
  taxId: "131-00000-1",
  representativeId: anaId,
});
const entityId = result.body?.personId;
check("fixtures created", Boolean(propertyId && property2Id && anaId && betoId && carlosId && dianaId && entityId));

console.log("Create and the 100 % rule");
result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(anaId, propertyId, "75"));
check("manager creates A-P at 75 % (201)", result.status === 201, JSON.stringify(result));
const anaOwnershipId = result.body?.ownershipId;
let property = await read(`organizations/org-a/properties/${propertyId}`);
check("property carries the total and the owner",
  property?.ownershipTotalPct === 75 && property?.ownerPersonIds?.includes(anaId), JSON.stringify(property?.ownerPersonIds));
let ownership = await read(`organizations/org-a/ownerships/${anaOwnershipId}`);
check("ownership starts not_started and active", ownership?.status === "not_started" && ownership?.active === true);

result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(entityId, propertyId, "30"));
check("over 100 % returns 409", result.status === 409 && String(result.body?.error).includes("25"), JSON.stringify(result));
result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(entityId, propertyId, "25"));
check("E-P at 25 % returns 201", result.status === 201, JSON.stringify(result));
const entityOwnershipId = result.body?.ownershipId;
result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(anaId, propertyId, "1"));
check("duplicate person + property returns 409", result.status === 409);
result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(anaId, propertyId, "12.345"));
check("invalid percentage returns 400", result.status === 400);
result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(anaId, propertyId, "1"), { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);
property = await read(`organizations/org-a/properties/${propertyId}`);
check("property total is 100 %", property?.ownershipTotalPct === 100);

console.log("Verification workflow");
result = await api(managerSession, "POST", `/api/ownerships/${anaOwnershipId}/status`, { to: "verified" });
check("not_started to verified returns 409", result.status === 409, JSON.stringify(result));
result = await api(managerSession, "POST", `/api/ownerships/${anaOwnershipId}/status`, { to: "in_review" });
check("manager moves to in_review (200)", result.status === 200, JSON.stringify(result));
result = await api(managerSession, "POST", `/api/ownerships/${anaOwnershipId}/status`, { to: "verified" });
check("manager cannot verify (403)", result.status === 403, JSON.stringify(result));

result = await api(holderSession, "POST", "/api/ownerships", ownershipBody(betoId, property2Id, "40"));
check("holder creates B-P2 (201)", result.status === 201);
const betoOwnershipId = result.body?.ownershipId;
await api(holderSession, "POST", `/api/ownerships/${betoOwnershipId}/status`, { to: "in_review" });
result = await api(holderSession, "POST", `/api/ownerships/${betoOwnershipId}/status`, { to: "verified" });
check("creator cannot approve their own record (403)", result.status === 403, JSON.stringify(result));
result = await api(reviewerSession, "POST", `/api/ownerships/${betoOwnershipId}/status`, { to: "verified" });
check("a different reviewer approves it (200)", result.status === 200, JSON.stringify(result));

// Ana is not verified yet: the portal must not show the property.
await grantPortal("org-a", ana.uid, "owner", anaId);
const anaSession = await login(ana.idToken);
let view = await page(anaSession, "/propietario/propiedades");
check("portal hides an unverified ownership",
  view.status === 200 && view.html.includes("Aún no hay propiedades verificadas") && !view.html.includes("Torre Titulares"));

result = await api(reviewerSession, "POST", `/api/ownerships/${anaOwnershipId}/status`, { to: "verified" });
check("admin approves A-P (200)", result.status === 200, JSON.stringify(result));
ownership = await read(`organizations/org-a/ownerships/${anaOwnershipId}`);
check("reviewer is stored", ownership?.status === "verified" && ownership?.reviewerUid === reviewer.uid && ownership?.reviewedAt);

await api(managerSession, "POST", `/api/ownerships/${entityOwnershipId}/status`, { to: "in_review" });
result = await api(reviewerSession, "POST", `/api/ownerships/${entityOwnershipId}/status`, { to: "rejected" });
check("rejecting without a reason returns 400", result.status === 400, JSON.stringify(result));
result = await api(reviewerSession, "POST", `/api/ownerships/${entityOwnershipId}/status`, { to: "rejected", reason: "Título ilegible" });
ownership = await read(`organizations/org-a/ownerships/${entityOwnershipId}`);
check("rejecting with a reason returns 200", result.status === 200 && ownership?.rejectionReason === "Título ilegible");
result = await api(managerSession, "POST", `/api/ownerships/${entityOwnershipId}/status`, { to: "in_review" });
check("a rejected record can go back to review", result.status === 200);
result = await api(reviewerSession, "POST", `/api/ownerships/${entityOwnershipId}/status`, { to: "verified" });
check("E-P verified", result.status === 200);

console.log("Edit reopens a verified record");
const updateBody = {
  pct: "70",
  startDate: "2024-01-01",
  titleOwner: "",
  titleNumber: "",
  registryNumber: "",
  cadastralNumber: "",
  registryAddress: "",
  checks: noChecks,
};
result = await api(managerSession, "PATCH", `/api/ownerships/${anaOwnershipId}`, { ...updateBody, pct: "80" });
check("raising the % past 100 returns 409", result.status === 409, JSON.stringify(result));
result = await api(managerSession, "PATCH", `/api/ownerships/${anaOwnershipId}`, updateBody);
check("editing the % returns 200", result.status === 200, JSON.stringify(result));
ownership = await read(`organizations/org-a/ownerships/${anaOwnershipId}`);
check("a verified record returns to in_review", ownership?.status === "in_review" && ownership?.pct === 70 && ownership?.reviewerUid === null);
property = await read(`organizations/org-a/properties/${propertyId}`);
check("property total follows the edit", property?.ownershipTotalPct === 95);
let audits = await db.collection("organizations/org-a/auditEvents").where("targetId", "==", anaOwnershipId).get();
check("the reopening is audited",
  audits.docs.some((doc) => doc.data().action === "ownership.status_changed" && doc.data().to === "in_review" && doc.data().reason === "Datos modificados"));
view = await page(anaSession, "/propietario/propiedades");
check("portal hides the record while it is reopened", !hasPct(view.html, 70));
result = await api(reviewerSession, "POST", `/api/ownerships/${anaOwnershipId}/status`, { to: "verified" });
check("A-P verified again", result.status === 200);

console.log("Screens");
view = await page(holderSession, `/admin/people/${anaId}/propietario`);
check("Owner 360 shows the property and the %",
  view.status === 200 && view.html.includes("Torre Titulares") && hasPct(view.html, 70), String(view.status));
view = await page(holderSession, `/admin/properties/${propertyId}?tab=owners`);
check("Propietarios tab shows both holders and the total",
  view.status === 200 && view.html.includes("Ana Pérez") && view.html.includes("Inversiones Alfa SRL") &&
    view.html.includes("Total asignado") && /95(<!-- -->)? %/.test(view.html));
view = await page(holderSession, `/admin/ownerships/${anaOwnershipId}`);
check("ownership detail renders", view.status === 200 && view.html.includes("Ana Pérez"));
view = await page(holderSession, `/admin/ownerships/new?propertyId=${propertyId}`);
check("new ownership page renders", view.status === 200 && view.html.includes("Torre Titulares"));
view = await page(holderSession, `/admin/people/${dianaId}/propietario`);
check("Owner 360 of a non-owner returns 404", view.status === 404);

console.log("Owner portal");
view = await page(anaSession, "/propietario/propiedades");
check("owner sees the verified property and her entity's",
  view.status === 200 && view.html.includes("Torre Titulares") && hasPct(view.html, 70) &&
    view.html.includes("Inversiones Alfa SRL"));
check("portal never shows title data or review state", !view.html.includes("Título ilegible") && !view.html.includes("reviewerUid"));
result = await api(anaSession, "POST", "/api/ownerships", ownershipBody(anaId, property2Id, "10"));
check("portal account cannot create ownerships (403)", result.status === 403);

await grantPortal("org-a", carlos.uid, "owner", carlosId);
const carlosSession = await login(carlos.idToken);
view = await page(carlosSession, "/propietario/propiedades");
check("another owner does not see the property",
  view.status === 200 && view.html.includes("Aún no hay propiedades verificadas") && !view.html.includes("Torre Titulares"));

await grantPortal("org-a", diana.uid, "owner", dianaId);
const dianaSession = await login(diana.idToken);
view = await page(dianaSession, "/propietario/propiedades");
check("owner portal without the owner relationship is denied",
  view.html.includes("No tienes acceso a esta sección") && !view.html.includes("Torre Titulares"));

console.log("Finish an ownership");
result = await api(managerSession, "POST", `/api/ownerships/${entityOwnershipId}/end`, {});
check("ending returns 200", result.status === 200, JSON.stringify(result));
ownership = await read(`organizations/org-a/ownerships/${entityOwnershipId}`);
property = await read(`organizations/org-a/properties/${propertyId}`);
check("the % is available again", ownership?.active === false && property?.ownershipTotalPct === 70 &&
  !property?.ownerPersonIds?.includes(entityId), JSON.stringify(property));
result = await api(managerSession, "POST", `/api/ownerships/${entityOwnershipId}/end`, {});
check("ending twice returns 409", result.status === 409);
result = await api(managerSession, "POST", "/api/ownerships", ownershipBody(entityId, propertyId, "30"));
check("the freed % can be assigned again", result.status === 201, JSON.stringify(result));
view = await page(anaSession, "/propietario/propiedades");
check("the ended entity ownership leaves the portal", !view.html.includes("Inversiones Alfa SRL"));

console.log("Migration");
const legacyPerson = {
  type: "owner",
  name: "Antiguo Dueño",
  email: "viejo@example.test",
  emailKey: "viejo@example.test",
  phone: "",
  contactName: "",
  propertyId: null,
  unitId: null,
  status: "active",
  archived: false,
  searchName: "antiguo dueño",
  filterKeys: ["type=owner&status=active&archived=false"],
  searchKeys: ["type=owner&status=active&archived=false&search=a"],
  createdAt: new Date(),
};
const legacyRef = db.collection("organizations/org-a/people").doc("legacy-owner");
await legacyRef.set(legacyPerson);
const legacy = await signUp("legacy@example.test");
await db.doc(`organizations/org-a/memberships/${legacy.uid}`).set({
  userUid: legacy.uid,
  organizationId: "org-a",
  role: "owner",
  personId: "legacy-owner",
  status: "active",
});
const migrate = () =>
  execFileSync(process.execPath, ["scripts/migrate-relationships.mjs", "--org", "org-a"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      FIREBASE_PROJECT_ID: "demo-mghpm",
      GOOGLE_APPLICATION_CREDENTIALS: "",
    },
    encoding: "utf8",
  });
const firstRun = migrate();
check("migration targets the emulator", firstRun.includes("TARGET: EMULATOR"), firstRun);
const migrated = (await legacyRef.get()).data();
check("legacy person gets relationshipTypes owner",
  JSON.stringify(migrated?.relationshipTypes) === JSON.stringify(["owner"]) && migrated?.kind === "individual",
  JSON.stringify(migrated));
const migratedMembership = await read(`organizations/org-a/memberships/${legacy.uid}`);
check("legacy membership gets portals and the person link",
  JSON.stringify(migratedMembership?.portals) === JSON.stringify(["owner"]) &&
    migratedMembership?.portalPersonIds?.owner === "legacy-owner", JSON.stringify(migratedMembership));
const snapshotBefore = JSON.stringify([
  (await legacyRef.get()).data(),
  await read(`organizations/org-a/memberships/${legacy.uid}`),
]);
migrate();
const snapshotAfter = JSON.stringify([
  (await legacyRef.get()).data(),
  await read(`organizations/org-a/memberships/${legacy.uid}`),
]);
check("a second run changes nothing", snapshotBefore === snapshotAfter);

finish();
