// E2E for Fase 2A-1: lanes, permissions table, /admin move and workspace switching.
// Requires the emulators and a dev server on port 3100 (see README). Wipes demo-mghpm data.
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

// A valid body, so the 403 comes from the permission check and not from validation (400).
const validProperty = {
  ...propertyWizardDefaults,
  name: "Torre Acceso",
  code: "TA-1",
  type: "apartment_condo",
  status: "active",
  address: "Calle 1",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO",
};

await resetEmulators();
const holder = await signUp("holder@example.test");
const manager = await signUp("manager@example.test");
const operations = await signUp("ops@example.test");
const owner = await signUp("owner@example.test");
const tenant = await signUp("tenant@example.test");
const suspended = await signUp("suspended@example.test");
const multi = await signUp("multi@example.test");
const orgBHolder = await signUp("bholder@example.test");
const noRelation = await signUp("norelation@example.test");

await seedOrganization("org-a", "Org A", [
  [holder.uid, "org_owner"],
  [manager.uid, "manager"],
  [operations.uid, "operations"],
  [owner.uid, "owner"],
  [tenant.uid, "tenant"],
  [suspended.uid, "manager"],
  [multi.uid, "admin"],
  [noRelation.uid, "admin"],
]);
await seedOrganization("org-b", "Org B", [[orgBHolder.uid, "org_owner"]]);
await db.doc(`organizations/org-a/memberships/${suspended.uid}`).update({ status: "suspended" });

// Portal access needs the granted portal, the person it points to and an active relationship of that type.
const holderSetup = await login(holder.idToken);
const orgBSetup = await login(orgBHolder.idToken);
async function createPerson(session, name, email, relationships) {
  const created = await api(session, "POST", "/api/people", {
    kind: "individual", name, email, phone: "", status: "active", relationships,
  });
  return created.body?.personId;
}
async function grantPortal(organizationId, uid, lane, personId) {
  await db.doc(`organizations/${organizationId}/memberships/${uid}`).set({
    userUid: uid, organizationId, staffRole: null, portals: [lane], portalPersonIds: { [lane]: personId }, status: "active",
  });
}
const ownerPersonId = await createPerson(holderSetup, "Olga Dueña", "owner@example.test", { owner: true, tenant: false });
const tenantPersonId = await createPerson(holderSetup, "Tomás Inquilino", "tenant@example.test", { owner: false, tenant: true });
const multiOwnerPersonId = await createPerson(orgBSetup, "Multi Dueño", "multi@example.test", { owner: true, tenant: false });
const tenantOnlyPersonId = await createPerson(holderSetup, "Sin Titularidad", "norelation@example.test", { owner: false, tenant: true });
await grantPortal("org-a", owner.uid, "owner", ownerPersonId);
await grantPortal("org-a", tenant.uid, "tenant", tenantPersonId);
await grantPortal("org-b", multi.uid, "owner", multiOwnerPersonId);
// A portal pointing to a person without that relationship, and a portal without a person at all.
await db.doc(`organizations/org-a/memberships/${noRelation.uid}`).set({
  userUid: noRelation.uid, organizationId: "org-a", staffRole: null, portals: ["owner"],
  portalPersonIds: { owner: tenantOnlyPersonId }, status: "active",
});

const sessions = {
  holder: await login(holder.idToken),
  manager: await login(manager.idToken),
  operations: await login(operations.idToken),
  owner: await login(owner.idToken),
  tenant: await login(tenant.idToken),
  suspended: await login(suspended.idToken),
  multi: await login(multi.idToken),
  noRelation: await login(noRelation.idToken),
};

console.log("Old URLs redirect to /admin");
let response = await fetch(`${BASE}/properties?x=1`, { redirect: "manual" });
check("/properties → /admin/properties", response.status === 308 && response.headers.get("location")?.endsWith("/admin/properties?x=1"));
response = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
check("/dashboard → /admin", response.status === 308 && response.headers.get("location")?.endsWith("/admin"));

console.log("Staff permissions");
let result = await page(sessions.holder, "/admin/users");
check("holder sees users", result.status === 200 && result.html.includes("Usuarios"));
result = await page(sessions.manager, "/admin/properties");
check("manager sees properties", result.status === 200 && !result.html.includes("No tienes acceso"));
result = await api(sessions.manager, "POST", "/api/members", { email: "x@example.test", displayName: "X", staffRole: "operations", portals: { owner: "", tenant: "" } });
check("manager cannot create users (403)", result.status === 403, JSON.stringify(result));
result = await page(sessions.operations, "/admin/properties");
check("operations sees properties", result.status === 200 && result.html.includes("Propiedades"));
check("operations menu hides users", !result.html.includes('href="/admin/users"'));
result = await page(sessions.operations, "/admin/properties/new");
check("operations cannot open new property", result.html.includes("No tienes") || result.html.includes("permiso"));
result = await api(sessions.operations, "POST", "/api/properties", validProperty);
check("operations cannot create property (403)", result.status === 403);

console.log("External lanes");
result = await page(sessions.owner, "/propietario");
check("owner enters owner portal", result.status === 200 && result.html.includes("Portal de propietarios"));
check("owner portal has no admin menu", !result.html.includes('href="/admin/properties"'));
result = await page(sessions.owner, "/admin");
check("owner gets not-authorized on /admin", result.html.includes("No tienes acceso a esta sección"));
result = await api(sessions.owner, "POST", "/api/properties", validProperty);
check("owner gets 403 on staff API", result.status === 403);
result = await page(sessions.tenant, "/inquilino/perfil");
check("tenant sees own profile page", result.status === 200 && result.html.includes("Mi perfil"));
result = await page(sessions.owner, "/propietario/propiedades");
check("owner opens Mis propiedades", result.status === 200 && result.html.includes("Aún no hay propiedades verificadas"));
result = await page(sessions.tenant, "/inquilino/contrato");
check("tenant opens Mi contrato", result.status === 200 && result.html.includes("No tienes un contrato activo"));
result = await page(sessions.noRelation, "/propietario");
check("an owner portal without the owner relationship is denied", result.html.includes("No tienes acceso a esta sección"));
result = await page(sessions.noRelation, "/propietario/propiedades");
check("and so are its inner pages", result.html.includes("No tienes acceso a esta sección") && !result.html.includes("Aún no hay propiedades verificadas"));
result = await page(sessions.tenant, "/propietario");
check("tenant cannot open owner portal", result.html.includes("No tienes acceso a esta sección"));
result = await page(sessions.holder, "/inquilino");
check("staff cannot open tenant portal", result.html.includes("No tienes acceso a esta sección"));

console.log("Blocked and anonymous");
result = await page(sessions.suspended, "/admin");
check("suspended user is blocked", result.html.includes("Tu acceso está suspendido") || (result.status === 307));
result = await page(sessions.suspended, "/espacios");
check("/espacios shows suspension", result.html.includes("Tu acceso está suspendido"));
response = await fetch(`${BASE}/admin`, { redirect: "manual" });
check("anonymous /admin goes to /acceder", response.status === 307 && (response.headers.get("location") ?? "").includes("/acceder"));
result = await page(sessions.holder, "/acceder");
check("/acceder lists lanes", result.html.includes("Propietario") && result.html.includes("Próximamente"));

console.log("Workspaces");
result = await page(sessions.multi, "/espacios");
check("multi-workspace user chooses", result.status === 200 && result.html.includes("Org A") && result.html.includes("Org B"));
result = await page(sessions.multi, "/admin/people");
check("multi opens the admin lane of org-a", result.status === 200 && !result.html.includes("No tienes acceso a esta sección"));
result = await page(sessions.multi, "/espacios?acceso=owner");
check("acceso=owner goes straight to owner portal", result.status === 307);
result = await api(sessions.multi, "POST", "/api/organizations/active", { organizationId: "org-b" });
check("switch to org-b allowed", result.status === 200);
const audit = await db.collection("organizations/org-b/auditEvents").where("action", "==", "workspace.switched").get();
check("switch is audited", audit.size === 1 && audit.docs[0]?.data().lane === "owner");
result = await api(sessions.owner, "POST", "/api/organizations/active", { organizationId: "org-b" });
check("cannot switch to a foreign org (403)", result.status === 403);

finish();
