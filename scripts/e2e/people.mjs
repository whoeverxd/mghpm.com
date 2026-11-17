// E2E check for Master 19 (People) against the Firebase emulators.
// Requires the emulators and a dev server on port 3100 pointed at them; see
// "Prueba end-to-end" in README.md. It wipes the demo-mghpm emulator data.
// Usage: npm run test:e2e
import {
  BASE,
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

async function readPerson(organizationId, personId) {
  const snapshot = await db.doc(`organizations/${organizationId}/people/${personId}`).get();
  return snapshot.data();
}

async function getJson(session, url) {
  const response = await fetch(`${BASE}${url}`, {
    headers: { Cookie: `mghpm_session=${session}` },
  });
  return { status: response.status, body: await response.json().catch(() => null) };
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

function unitBody(label) {
  return {
    label,
    floor: "12",
    bedrooms: 2,
    bathrooms: 2,
    status: "available",
    marketRent: "",
    marketRentCurrency: "USD",
  };
}

// An owner entity (kind "entity"): the email is unique per kind, not per relationship.
const ownerBody = {
  kind: "entity",
  entityType: "company",
  taxId: "",
  representativeId: "",
  name: "Las Olas Partners LP",
  email: "Owners@LasOlasLP.com",
  phone: "(954) 555-0188",
  status: "active",
  contactName: "Jordan Hale",
  relationships: { owner: true, tenant: false },
};

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
result = await api(adminSession, "POST", `/api/properties/${propertyId}/units`, unitBody("1204"));
const unitId = result.body?.unitId;
result = await api(adminSession, "POST", `/api/properties/${propertyId}/units`, unitBody("806"));
const archivedUnitId = result.body?.unitId;
await api(adminSession, "POST", `/api/properties/${propertyId}/units/${archivedUnitId}/archive`, { archived: true });
result = await api(outsiderSession, "POST", "/api/properties", { ...propertyBody, code: "OTHER-1" });
const foreignPropertyId = result.body?.propertyId;
check("fixtures created", Boolean(propertyId && unitId && archivedUnitId && foreignPropertyId));

console.log("Units picker API");
result = await getJson(adminSession, `/api/properties/${propertyId}/units`);
check("lists only active units",
  result.status === 200 && result.body?.units.length === 1 && result.body.units[0].id === unitId,
  JSON.stringify(result.body));
result = await getJson(managerSession, `/api/properties/${propertyId}/units`);
check("manager can list units (200)", result.status === 200 && result.body?.units.length === 1, JSON.stringify(result.body));
result = await getJson(outsiderSession, `/api/properties/${propertyId}/units`);
check("other organization gets 404 for units", result.status === 404);

console.log("Master 19 — create");
result = await api(adminSession, "POST", "/api/people", ownerBody);
check("create owner returns 201", result.status === 201, JSON.stringify(result));
const ownerId = result.body?.personId;
let person = await readPerson("org-a", ownerId);
check("email key normalized", person?.emailKey === "owners@lasolaslp.com" && person?.email === "Owners@LasOlasLP.com");
check("owner has no tenant link", person?.propertyId === null && person?.unitId === null);
check("search index generated",
  person?.searchName === "las olas partners lp" &&
  person?.searchKeys.includes("relationship=*&status=*&archived=false&search=lasol") &&
  person?.searchKeys.includes("relationship=*&status=*&archived=false&search=9545550188"));
check("owner is stored as an entity with the owner relationship",
  person?.kind === "entity" && person?.relationshipTypes.length === 1 && person?.relationshipTypes[0] === "owner" &&
  person?.relationships.owner?.status === "active" && person?.type === undefined, JSON.stringify(person?.relationshipTypes));

result = await api(adminSession, "POST", "/api/people", { ...ownerBody, name: "Copy", email: "owners@lasolaslp.com " });
check("duplicate email for the same kind returns 409", result.status === 409, JSON.stringify(result));

result = await api(adminSession, "POST", "/api/people", {
  kind: "individual",
  name: "Daniela Ortiz",
  email: "owners@lasolaslp.com",
  phone: "",
  status: "active",
  relationships: { owner: false, tenant: true },
  tenantPropertyId: propertyId,
  tenantUnitId: unitId,
});
check("same email allowed for a different kind", result.status === 201, JSON.stringify(result));
const tenantId = result.body?.personId;
person = await readPerson("org-a", tenantId);
check("tenant link stored", person?.propertyId === propertyId && person?.unitId === unitId && person?.contactName === "");
const unit = (await db.doc(`organizations/org-a/properties/${propertyId}/units/${unitId}`).get()).data();
check("linking a tenant does not change unit occupancy", unit?.status === "available");

const tenantBase = {
  kind: "individual",
  name: "Jonathan Reyes",
  phone: "305 555 1803",
  status: "pending",
  relationships: { owner: false, tenant: true },
};
result = await api(adminSession, "POST", "/api/people", { ...tenantBase, email: "j1@example.test", tenantPropertyId: "", tenantUnitId: unitId });
check("unit without property returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...tenantBase, email: "j2@example.test", tenantPropertyId: propertyId, tenantUnitId: archivedUnitId });
check("archived unit returns 400", result.status === 400, JSON.stringify(result));
result = await api(adminSession, "POST", "/api/people", { ...tenantBase, email: "j3@example.test", tenantPropertyId: foreignPropertyId, tenantUnitId: "" });
check("property from another organization returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...tenantBase, email: "not-an-email", tenantPropertyId: "", tenantUnitId: "" });
check("invalid email returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, kind: "vendor" });
check("unsupported kind returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, email: "none@example.test", relationships: { owner: false, tenant: false } });
check("a person without any relationship returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, email: "notype@example.test", entityType: "" });
check("an entity without entity type returns 400", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, email: "enttenant@example.test", relationships: { owner: false, tenant: true } });
check("an entity cannot be a tenant (400)", result.status === 400);
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, email: "x@example.test" }, { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);
result = await api(managerSession, "POST", "/api/people", { ...ownerBody, email: "m@example.test" });
check("manager can create (201)", result.status === 201, JSON.stringify(result));
const managerPersonId = result.body?.personId;
result = await api(adminSession, "POST", "/api/people", { ...tenantBase, email: "jreyes@example.test", tenantPropertyId: propertyId, tenantUnitId: "" });
check("tenant with property only returns 201", result.status === 201);
const secondTenantId = result.body?.personId;

console.log("Master 19 — update");
result = await api(adminSession, "PATCH", `/api/people/${ownerId}`, { ...ownerBody, email: "gp@lasolaslp.com", status: "pending" });
check("update owner returns 200", result.status === 200, JSON.stringify(result));
const reservations = await db.collection("organizations/org-a/personEmails").get();
check("email reservation moved",
  reservations.docs.filter((doc) => doc.data().personId === ownerId).length === 1 &&
  reservations.size === 4);
person = await readPerson("org-a", ownerId);
check("update regenerates filter keys",
  person?.filterKeys.includes("relationship=owner&status=pending&archived=false") &&
  !person?.filterKeys.includes("relationship=owner&status=active&archived=false"));
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, name: "Reuse" });
check("previous email is free again", result.status === 201);
const reuseOwnerId = result.body?.personId;
result = await api(adminSession, "PATCH", `/api/people/${ownerId}`, { ...ownerBody });
check("update to an email in use returns 409", result.status === 409);
result = await api(adminSession, "PATCH", `/api/people/${ownerId}`, {
  ...ownerBody, email: "gp@lasolaslp.com", status: "pending", relationships: { owner: false, tenant: false },
});
check("removing every relationship returns 400", result.status === 400);
result = await api(adminSession, "PATCH", "/api/people/does-not-exist", ownerBody);
check("update unknown person returns 404", result.status === 404);
result = await api(outsiderSession, "PATCH", `/api/people/${ownerId}`, ownerBody);
check("other organization cannot update (404)", result.status === 404);

console.log("Master 19 — archive");
result = await api(adminSession, "POST", `/api/people/${reuseOwnerId}/archive`, { archived: true });
check("archive returns 200", result.status === 200);
person = await readPerson("org-a", reuseOwnerId);
check("archived flag and filter keys updated",
  person?.archived === true && person?.filterKeys.includes("relationship=owner&status=active&archived=true") &&
  !person?.filterKeys.includes("relationship=owner&status=active&archived=false"));
result = await api(adminSession, "PATCH", `/api/people/${reuseOwnerId}`, ownerBody);
check("editing an archived person returns 409", result.status === 409);
result = await api(adminSession, "POST", "/api/people", { ...ownerBody, name: "Third Owner" });
check("archiving released the email", result.status === 201);
result = await api(adminSession, "POST", `/api/people/${reuseOwnerId}/archive`, { archived: false });
check("restore with a taken email returns 409", result.status === 409);
result = await api(adminSession, "POST", `/api/people/${secondTenantId}/archive`, { archived: true });
result = await api(adminSession, "POST", `/api/people/${secondTenantId}/archive`, { archived: false });
check("restore with a free email returns 200", result.status === 200);
result = await api(outsiderSession, "POST", `/api/people/${ownerId}/archive`, { archived: true });
check("other organization cannot archive (404)", result.status === 404);
result = await api(managerSession, "POST", `/api/people/${managerPersonId}/archive`, { archived: true });
check("manager can archive (200)", result.status === 200, JSON.stringify(result));

let view;
console.log("Relationships and entities");
result = await api(adminSession, "POST", "/api/people", {
  kind: "individual",
  name: "Marta Núñez",
  email: "marta@example.test",
  phone: "",
  status: "active",
  relationships: { owner: true, tenant: true },
  tenantPropertyId: propertyId,
  tenantUnitId: unitId,
});
check("a person can hold both relationships (201)", result.status === 201, JSON.stringify(result));
const bothId = result.body?.personId;
person = await readPerson("org-a", bothId);
check("both relationships stored and indexed",
  JSON.stringify(person?.relationshipTypes) === JSON.stringify(["owner", "tenant"]) &&
  person?.filterKeys.includes("relationship=owner&status=active&archived=false") &&
  person?.filterKeys.includes("relationship=tenant&status=active&archived=false") &&
  person?.unitId === unitId, JSON.stringify(person));

result = await api(adminSession, "POST", "/api/people", {
  ...ownerBody, name: "Marta Holdings", email: "marta-holdings@example.test", representativeId: bothId,
});
check("entity with a representative (201)", result.status === 201, JSON.stringify(result));
const heldEntityId = result.body?.personId;
person = await readPerson("org-a", heldEntityId);
check("representative stored on the entity", person?.representativeId === bothId && person?.entityType === "company");
result = await api(adminSession, "POST", "/api/people", {
  ...ownerBody, name: "Otra Entidad", email: "otra@example.test", representativeId: ownerId,
});
check("an entity cannot represent an entity (400)", result.status === 400, JSON.stringify(result));
result = await api(adminSession, "POST", "/api/people", {
  ...ownerBody, name: "Otra Entidad", email: "otra@example.test", representativeId: "does-not-exist",
});
check("unknown representative returns 400", result.status === 400);
result = await api(adminSession, "POST", `/api/people/${bothId}/archive`, { archived: true });
check("a representative of an active entity cannot be archived (409)", result.status === 409, JSON.stringify(result));
result = await api(adminSession, "PATCH", `/api/people/${bothId}`, {
  kind: "individual", name: "Marta Núñez", email: "marta@example.test", phone: "", status: "active",
  relationships: { owner: true, tenant: false },
});
check("an active tenant relationship cannot be ended while no lease blocks it (200)", result.status === 200, JSON.stringify(result));
person = await readPerson("org-a", bothId);
check("ending the tenant relationship keeps owner",
  JSON.stringify(person?.relationshipTypes) === JSON.stringify(["owner"]) &&
  person?.relationships.tenant?.status === "ended" && person?.unitId === null);

view = await page(adminSession, `/admin/people/${heldEntityId}`);
check("entity person page shows the representative",
  view.status === 200 && view.html.includes("Marta Holdings") && view.html.includes("Marta Núñez") && view.html.includes("Representante"));
view = await page(adminSession, `/admin/people/${bothId}`);
check("person page lists the entities they represent",
  view.status === 200 && view.html.includes("Marta Holdings") && view.html.includes("Representa a"));
view = await page(adminSession, `/admin/people/${bothId}/propietario`);
check("Owner 360 opens for an owner", view.status === 200 && view.html.includes("Titularidades"));
view = await page(adminSession, `/admin/people/${bothId}/inquilino`);
check("Tenant 360 stays available for a former tenant (history)", view.status === 200);
view = await page(adminSession, `/admin/people/${tenantId}/inquilino`);
check("Tenant 360 opens for a tenant", view.status === 200 && view.html.includes("Daniela Ortiz") && view.html.includes("Contratos"));
view = await page(adminSession, `/admin/people/${tenantId}/propietario`);
check("Owner 360 of a non-owner returns 404", view.status === 404);
view = await page(outsiderSession, `/admin/people/${bothId}`);
check("person page of another organization returns 404", view.status === 404);
view = await page(adminSession, "/admin/people?type=owner");
check("owner tab lists entities and individuals with the owner relationship",
  view.html.includes("Marta Núñez") && view.html.includes("Marta Holdings") && view.html.includes("Las Olas Partners LP") &&
  !view.html.includes("Daniela Ortiz"));

const audits = await db.collection("organizations/org-a/auditEvents").get();
const actions = audits.docs.map((doc) => doc.data().action);
check("audit events recorded for person changes",
  ["person.created", "person.updated", "person.archived", "person.restored"].every((action) => actions.includes(action)),
  JSON.stringify(actions));

console.log("Pages — Master 19");
view = await page(adminSession, "/admin/people");
check("directory renders owners and tenants",
  view.status === 200 && view.html.includes("Las Olas Partners LP") && view.html.includes("Daniela Ortiz"));
check("directory hides archived by default", !view.html.includes(">Reuse<"));
check("directory links to the person page", view.html.includes(`href="/admin/people/${ownerId}"`));
check("tenant link resolves property and unit names",
  view.html.includes("Brickell Bay Residences") && /Unidad (<!-- -->)?1204/.test(view.html));
view = await page(adminSession, "/admin/people?type=tenant");
check("tenant tab shows only tenants",
  view.html.includes("Daniela Ortiz") && !view.html.includes("Las Olas Partners LP"));
view = await page(adminSession, "/admin/people?q=ortiz");
check("search by name prefix", view.html.includes("Daniela Ortiz") && !view.html.includes("Jonathan Reyes"));
view = await page(adminSession, "/admin/people?q=3055551803");
check("search by phone digits", view.html.includes("Jonathan Reyes") && !view.html.includes("Daniela Ortiz"));
view = await page(adminSession, "/admin/people?q=lasolaslp");
check("search by email domain", view.html.includes("Daniela Ortiz") && view.html.includes("Las Olas Partners LP"));
view = await page(adminSession, "/admin/people?type=owner&status=pending");
check("status filter", view.html.includes("Las Olas Partners LP") && !view.html.includes("Third Owner"));
view = await page(adminSession, "/admin/people?type=owner&archived=1");
check("archived toggle includes archived", view.html.includes(">Reuse<"));
view = await page(adminSession, "/admin/people?page=2");
check("invalid pagination shows recoverable error", view.status === 200 && view.html.includes("No se pudo aplicar la búsqueda"));
view = await page(adminSession, "/admin/people/new?type=tenant");
check("new person page lists active properties",
  view.status === 200 && view.html.includes("Nueva persona") && view.html.includes("Brickell Bay Residences (BBR-1)"));
view = await page(adminSession, `/admin/people/${tenantId}/edit`);
check("edit page renders", view.status === 200 && view.html.includes("Daniela Ortiz") && view.html.includes("Archivar"));
view = await page(adminSession, `/admin/people/${reuseOwnerId}/edit`);
check("archived edit page offers restore only",
  view.html.includes("Restaurar") && !view.html.includes("Guardar cambios"));
view = await page(adminSession, "/admin/people/does-not-exist/edit");
check("unknown person returns 404", view.status === 404);
view = await page(outsiderSession, `/admin/people/${ownerId}/edit`);
check("other organization gets 404", view.status === 404);
view = await page(outsiderSession, "/admin/people");
check("other organization directory is isolated",
  view.status === 200 && !view.html.includes("Las Olas Partners LP"));
view = await page(managerSession, "/admin/people");
check("manager sees the directory",
  view.status === 200 && view.html.includes("Daniela Ortiz") && !view.html.includes("Acceso restringido"));
view = await page("", "/admin/people");
check("anonymous user is redirected", view.status === 307 || view.status === 303 || view.html.includes("/login"));

finish();
