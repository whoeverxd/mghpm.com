// E2E check for "Usuarios y accesos" (Masters 37/58: accounts and roles)
// against the Firebase emulators. Requires the emulators and a dev server on
// port 3100 pointed at them; see "Prueba end-to-end" in README.md. It wipes
// the demo-mghpm emulator data.
// Usage: npm run test:e2e
import {
  api,
  auth,
  check,
  db,
  finish,
  login,
  page,
  resetEmulators,
  seedOrganization,
  signIn,
  signUp,
} from "./lib.mjs";

const noPortals = { owner: "", tenant: "" };

async function readMembership(organizationId, uid) {
  const snapshot = await db.doc(`organizations/${organizationId}/memberships/${uid}`).get();
  return snapshot.data();
}

async function sessionFor(email) {
  await auth.updateUser((await auth.getUserByEmail(email)).uid, { password: "secret-123" });
  const { idToken } = await signIn(email, "secret-123");
  return login(idToken);
}

await resetEmulators();
const holder = await signUp("holder@example.test");
const admin = await signUp("admin@example.test");
const manager = await signUp("manager@example.test");
const outsider = await signUp("outsider@example.test");
await seedOrganization("org-a", "Org A", [
  [holder.uid, "org_owner"],
  [admin.uid, "admin"],
  [manager.uid, "manager"],
]);
await seedOrganization("org-b", "Org B", [[outsider.uid, "org_owner"]]);

const holderSession = await login(holder.idToken);
const adminSession = await login(admin.idToken);
const managerSession = await login(manager.idToken);

console.log("Create staff accounts");
let result = await api(holderSession, "POST", "/api/members", {
  email: "Ops.Lead@Example.test",
  displayName: "Ops Lead",
  staffRole: "operations", portals: noPortals,
});
check("holder creates staff account (201)", result.status === 201 && result.body?.accountCreated === true, JSON.stringify(result));
const opsUid = result.body?.uid;
const opsUser = await auth.getUser(opsUid).catch(() => null);
check("Auth user created with normalized email", opsUser?.email === "ops.lead@example.test" && opsUser?.displayName === "Ops Lead");
let membership = await readMembership("org-a", opsUid);
check("membership active with the staff role",
  membership?.staffRole === "operations" && membership?.status === "active" &&
  membership?.portals.length === 0 && Object.keys(membership?.portalPersonIds ?? {}).length === 0 &&
  membership?.role === undefined, JSON.stringify(membership));

result = await api(holderSession, "POST", "/api/members", {
  email: "ops.lead@example.test", displayName: "Again", staffRole: "manager", portals: noPortals,
});
check("existing member returns 409", result.status === 409);
result = await api(adminSession, "POST", "/api/members", {
  email: "second.admin@example.test", displayName: "Second Admin", staffRole: "admin", portals: noPortals,
});
check("admin cannot create admin (403)", result.status === 403);
check("no Auth user left behind on 403", !(await auth.getUserByEmail("second.admin@example.test").catch(() => null)));
result = await api(holderSession, "POST", "/api/members", {
  email: "second.admin@example.test", displayName: "Second Admin", staffRole: "admin", portals: noPortals,
});
check("holder creates admin (201)", result.status === 201);
const secondAdminUid = result.body?.uid;
result = await api(holderSession, "POST", "/api/members", {
  email: "x@example.test", displayName: "X", staffRole: "org_owner", portals: noPortals,
});
check("org_owner role cannot be assigned (400)", result.status === 400);
result = await api(holderSession, "POST", "/api/members", {
  email: "bad", displayName: "X", staffRole: "manager", portals: noPortals,
});
check("invalid email returns 400", result.status === 400);
result = await api(holderSession, "POST", "/api/members", {
  email: "y@example.test", displayName: "Y", staffRole: "manager", portals: noPortals,
}, { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);
result = await api(managerSession, "POST", "/api/members", {
  email: "z@example.test", displayName: "Z", staffRole: "operations", portals: noPortals,
});
check("manager cannot create accounts (403)", result.status === 403);

result = await api(holderSession, "POST", "/api/members", {
  email: "outsider@example.test", displayName: "Outsider", staffRole: "manager", portals: noPortals,
});
check("existing Auth account is added, not recreated", result.status === 201 && result.body?.accountCreated === false && result.body?.uid === outsider.uid);
membership = await readMembership("org-b", outsider.uid);
check("membership in the other organization untouched", membership?.role === "org_owner");

console.log("Client accounts linked to People");
const ownerPersonBody = {
  kind: "entity", entityType: "trust", name: "Alvarez Family Trust", email: "Trust@Alvarez.test", phone: "",
  status: "active", contactName: "", relationships: { owner: true, tenant: false },
};
result = await api(holderSession, "POST", "/api/people", ownerPersonBody);
const ownerPersonId = result.body?.personId;
result = await api(holderSession, "POST", "/api/people", {
  kind: "individual", name: "Daniela Ortiz", email: "daniela@example.test", phone: "", status: "active",
  relationships: { owner: false, tenant: true },
});
const tenantPersonId = result.body?.personId;
result = await api(holderSession, "POST", "/api/people", {
  kind: "individual", name: "Marta Dual", email: "dual@example.test", phone: "", status: "active",
  relationships: { owner: true, tenant: true },
});
const dualPersonId = result.body?.personId;
check("people fixtures created", Boolean(ownerPersonId && tenantPersonId && dualPersonId));

result = await api(holderSession, "POST", "/api/members", {
  email: "trust@alvarez.test", displayName: "Alvarez Family Trust", staffRole: "", portals: noPortals,
});
check("an account with neither role nor portal returns 400", result.status === 400);
result = await api(holderSession, "POST", "/api/members", {
  email: "other@alvarez.test", displayName: "Alvarez Family Trust", staffRole: "", portals: { owner: ownerPersonId, tenant: "" },
});
check("email different from the person returns 409", result.status === 409);
check("no Auth user left behind on 409", !(await auth.getUserByEmail("other@alvarez.test").catch(() => null)));
result = await api(holderSession, "POST", "/api/members", {
  email: "daniela@example.test", displayName: "Daniela Ortiz", staffRole: "", portals: { owner: tenantPersonId, tenant: "" },
});
check("a portal without the matching active relationship returns 409", result.status === 409, JSON.stringify(result));
check("no Auth user left behind on the relationship 409", !(await auth.getUserByEmail("daniela@example.test").catch(() => null)));
result = await api(holderSession, "POST", "/api/members", {
  email: "trust@alvarez.test", displayName: "Alvarez Family Trust", staffRole: "", portals: { owner: ownerPersonId, tenant: "" },
});
check("owner account linked to person (201)", result.status === 201, JSON.stringify(result));
const ownerUid = result.body?.uid;
const ownerPerson = (await db.doc(`organizations/org-a/people/${ownerPersonId}`).get()).data();
check("person records its account", ownerPerson?.accountUid === ownerUid);
membership = await readMembership("org-a", ownerUid);
check("portal membership keeps the person link",
  membership?.staffRole === null && JSON.stringify(membership?.portals) === JSON.stringify(["owner"]) &&
  membership?.portalPersonIds?.owner === ownerPersonId, JSON.stringify(membership));

result = await api(holderSession, "PATCH", `/api/people/${ownerPersonId}`, { ...ownerPersonBody, email: "new@alvarez.test" });
check("person email locked while it has an account (409)", result.status === 409);
result = await api(holderSession, "PATCH", `/api/people/${ownerPersonId}`, { ...ownerPersonBody, name: "Alvarez Family Trust LLC" });
check("other person fields still editable", result.status === 200);
result = await api(holderSession, "POST", `/api/people/${ownerPersonId}/archive`, { archived: true });
check("archiving a person with active access returns 409", result.status === 409);

console.log("Update roles and status");
result = await api(holderSession, "PATCH", `/api/members/${opsUid}`, { staffRole: "manager", portals: noPortals, status: "active" });
check("holder changes staff role (200)", result.status === 200);
result = await api(holderSession, "PATCH", `/api/members/${ownerUid}`, { staffRole: "", portals: noPortals, status: "active" });
check("an account cannot be left without role or portal (400)", result.status === 400);
result = await api(holderSession, "PATCH", `/api/members/${ownerUid}`, {
  staffRole: "", portals: { owner: ownerPersonId, tenant: tenantPersonId }, status: "active",
});
check("a portal person with another email returns 409", result.status === 409, JSON.stringify(result));
result = await api(holderSession, "POST", "/api/people", {
  kind: "individual", name: "Ops Lead", email: "ops.lead@example.test", phone: "", status: "active",
  relationships: { owner: true, tenant: false },
});
const opsPersonId = result.body?.personId;
result = await api(holderSession, "PATCH", `/api/members/${opsUid}`, {
  staffRole: "manager", portals: { owner: opsPersonId, tenant: "" }, status: "active",
});
check("a staff account can also gain a portal (200)", result.status === 200, JSON.stringify(result));
membership = await readMembership("org-a", opsUid);
check("staff role and portal coexist",
  membership?.staffRole === "manager" && JSON.stringify(membership?.portals) === JSON.stringify(["owner"]) &&
  membership?.portalPersonIds?.owner === opsPersonId, JSON.stringify(membership));
result = await api(holderSession, "PATCH", `/api/members/${holder.uid}`, { staffRole: "admin", portals: noPortals, status: "active" });
check("nobody changes their own access (403)", result.status === 403);
result = await api(adminSession, "PATCH", `/api/members/${holder.uid}`, { staffRole: "admin", portals: noPortals, status: "suspended" });
check("account holder cannot be changed (403)", result.status === 403);
result = await api(adminSession, "PATCH", `/api/members/${secondAdminUid}`, { staffRole: "admin", portals: noPortals, status: "suspended" });
check("admin cannot change another admin (403)", result.status === 403);
result = await api(adminSession, "PATCH", `/api/members/${ownerUid}`, { staffRole: "", portals: { owner: ownerPersonId, tenant: "" }, status: "suspended" });
check("admin suspends a client account (200)", result.status === 200);
membership = await readMembership("org-a", ownerUid);
check("membership suspended", membership?.status === "suspended");
result = await api(holderSession, "POST", `/api/people/${ownerPersonId}/archive`, { archived: true });
check("person can be archived once access is suspended", result.status === 200);
result = await api(holderSession, "PATCH", "/api/members/does-not-exist", { staffRole: "manager", portals: noPortals, status: "active" });
check("unknown member returns 404", result.status === 404);

const audits = await db.collection("organizations/org-a/auditEvents").get();
const actions = audits.docs.map((doc) => doc.data().action);
check("audit events recorded for access changes",
  ["member.created", "member.role_changed", "member.suspended"].every((action) => actions.includes(action)),
  JSON.stringify(actions));

console.log("Pages and role-based experience");
let view = await page(holderSession, "/admin/users");
check("users page lists members",
  view.status === 200 && view.html.includes("ops.lead@example.test") && view.html.includes("Gerente de propiedades"));
check("users page offers manage link but not for self",
  view.html.includes(`href="/admin/users/${opsUid}/edit"`) && !view.html.includes(`href="/admin/users/${holder.uid}/edit"`));
check("never signed-in accounts are flagged", view.html.includes("Nunca ha entrado"));
view = await page(holderSession, "/admin/users/new");
check("new access page lists people without account",
  view.status === 200 && view.html.includes("Nuevo acceso") && view.html.includes("Crear acceso y enviar correo"));
view = await page(holderSession, `/admin/users/${opsUid}/edit`);
check("edit access page renders", view.status === 200 && view.html.includes("Reenviar correo de acceso"));
view = await page(adminSession, `/admin/users/${secondAdminUid}/edit`);
check("admin sees restriction for another admin", view.html.includes("No puedes modificar este acceso"));
view = await page(holderSession, "/admin/users/does-not-exist/edit");
check("unknown member page returns 404", view.status === 404);
view = await page(managerSession, "/admin/users");
check("manager sees users list read-only",
  view.status === 200 && view.html.includes("ops.lead@example.test") && !view.html.includes("Nuevo acceso") &&
  !view.html.includes(`href="/admin/users/${opsUid}/edit"`));
view = await page(managerSession, "/admin/users/new");
check("manager cannot open new access page", view.html.includes("Tu rol no tiene permiso para administrar usuarios") && !view.html.includes("Crear acceso y enviar correo"));
view = await page(managerSession, "/admin");
check("manager dashboard shows operating navigation",
  view.status === 200 && view.html.includes("Bienvenido") && view.html.includes('href="/admin/properties"') && !view.html.includes("No tienes acceso"));
view = await page(holderSession, "/admin");
check("holder navigation includes users", view.html.includes('href="/admin/users"') && view.html.includes('href="/admin/people"'));
view = await page(holderSession, `/admin/people/${tenantPersonId}/edit`);
check("person without account offers access", view.html.includes(`/admin/users/new?personId=${tenantPersonId}`));

result = await api(holderSession, "POST", "/api/members", {
  email: "daniela@example.test", displayName: "Daniela Ortiz", staffRole: "", portals: { owner: "", tenant: tenantPersonId },
});
check("tenant account created (201)", result.status === 201, JSON.stringify(result));
const tenantSession = await sessionFor("daniela@example.test");
view = await page(tenantSession, "/admin");
check("tenant gets not-authorized screen on /admin",
  view.status === 200 && view.html.includes("No tienes acceso a esta sección"));
view = await page(tenantSession, "/admin/people");
check("tenant cannot open the directory", view.html.includes("No tienes acceso a esta sección") && !view.html.includes("Alvarez"));
result = await api(holderSession, "POST", "/api/members", {
  email: "dual@example.test", displayName: "Marta Dual", staffRole: "", portals: { owner: dualPersonId, tenant: dualPersonId },
});
check("an account with two portals is created (201)", result.status === 201, JSON.stringify(result));
const dualUid = result.body?.uid;
membership = await readMembership("org-a", dualUid);
check("both portals are stored",
  JSON.stringify(membership?.portals?.slice().sort()) === JSON.stringify(["owner", "tenant"]) &&
  membership?.portalPersonIds?.owner === dualPersonId && membership?.portalPersonIds?.tenant === dualPersonId,
  JSON.stringify(membership));
const dualSession = await sessionFor("dual@example.test");
view = await page(dualSession, "/espacios");
check("the account chooses between its portals",
  view.status === 200 && view.html.includes("Portal de propietarios") && view.html.includes("Portal de inquilinos"));
view = await page(dualSession, "/propietario/propiedades");
check("dual account opens the owner portal", view.status === 200 && view.html.includes("Mis propiedades"));
view = await page(dualSession, "/inquilino/contrato");
check("dual account opens the tenant portal", view.status === 200 && view.html.includes("No tienes un contrato activo"));
view = await page(dualSession, "/admin");
check("dual account has no admin access", view.html.includes("No tienes acceso a esta sección"));
result = await api(dualSession, "POST", "/api/organizations/active", { organizationId: "org-a", lane: "tenant" });
check("the account switches to the tenant space", result.status === 200, JSON.stringify(result));
result = await api(dualSession, "POST", "/api/organizations/active", { organizationId: "org-a", lane: "admin" });
check("it cannot switch to a lane it was not granted (403)", result.status === 403);
const switched = await db.collection("organizations/org-a/auditEvents").where("action", "==", "workspace.switched").get();
check("the switch is audited with its lane", switched.docs.some((doc) => doc.data().lane === "tenant"));
const portalAudits = await db.collection("organizations/org-a/auditEvents").where("action", "==", "member.portals_changed").get();
check("portal changes are audited", portalAudits.size >= 3, String(portalAudits.size));
const suspendedOwnerSession = await sessionFor("trust@alvarez.test");
view = await page(suspendedOwnerSession, "/admin");
check("suspended account is blocked on /admin",
  view.status === 307 || (view.html.includes("Tu acceso está suspendido") && !view.html.includes("Bienvenido")), String(view.status));
view = await page(suspendedOwnerSession, "/espacios");
check("suspended account sees the suspension screen", view.html.includes("Tu acceso está suspendido"));

finish();
