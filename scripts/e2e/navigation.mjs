// E2E for the admin navigation (paso 4A): breadcrumbs with real names, the ownerships
// list filter, the audit viewer area filter and the audit `area` migration.
// Requires the emulators and a server on port 3100 (see README). Wipes demo-mghpm data.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
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

const require = createRequire(path.join(process.cwd(), "package.json"));
const { FieldValue } = require("firebase-admin/firestore");

await resetEmulators();
const owner = await signUp("owner@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"]]);
const session = await login(owner.idToken);

let result = await api(session, "POST", "/api/properties", {
  ...propertyWizardDefaults,
  name: "Torre Migas",
  code: "TM-1",
  type: "apartment_condo",
  status: "active",
  address: "Calle 1",
  city: "Santo Domingo",
  state: "Distrito Nacional",
  postalCode: "10111",
  country: "DO",
});
const propertyId = result.body?.propertyId;
result = await api(session, "POST", `/api/properties/${propertyId}/units`, {
  label: "101", floor: "1", bedrooms: 2, bathrooms: 1, status: "available", marketRent: "", marketRentCurrency: "USD",
});
const unitId = result.body?.unitId;
const createPerson = async (name, email) =>
  (await api(session, "POST", "/api/people", {
    kind: "individual", name, email, phone: "", status: "active", relationships: { owner: true, tenant: false },
  })).body?.personId;
const anaId = await createPerson("Ana Activa", "ana@example.test");
const beaId = await createPerson("Bea Finalizada", "bea@example.test");
const own = async (personId, pct) =>
  (await api(session, "POST", "/api/ownerships", {
    personId, propertyId, pct, startDate: "2024-01-01", titleOwner: "", titleNumber: "",
    registryNumber: "", cadastralNumber: "", registryAddress: "",
  })).body?.ownershipId;
const anaOwnership = await own(anaId, "60");
const beaOwnership = await own(beaId, "40");
result = await api(session, "POST", `/api/ownerships/${beaOwnership}/end`, {});
check("fixtures created", Boolean(propertyId && unitId && anaId && beaId && anaOwnership && beaOwnership) && result.status < 300,
  JSON.stringify({ propertyId, unitId, anaId, beaId, anaOwnership, beaOwnership, end: result.status }));

const crumbs = (html) => html.match(/<nav[^>]*aria-label="Migas de pan"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";

console.log("Breadcrumbs");
for (const [url, expected] of [
  ["/admin", ["Inicio", "Panel principal"]],
  [`/admin/properties/${propertyId}`, ["Propiedades", "Torre Migas"]],
  [`/admin/properties/${propertyId}/units/${unitId}/edit`, ["Torre Migas", "Editar unidad 101"]],
  [`/admin/people/${anaId}/edit`, ["Personas", "Ana Activa", "Editar"]],
  [`/admin/ownerships/${anaOwnership}`, ["Titularidades", "Ana Activa"]],
  ["/admin/audit", ["Inicio", "Auditoría"]],
]) {
  const nav = crumbs((await page(session, url)).html);
  check(`crumbs of ${url}`, expected.every((label) => nav.includes(label)), nav.replace(/<[^>]+>/g, " ").trim());
}

console.log("Ownerships filter");
const ownershipsHtml = async (estado) => (await page(session, `/admin/ownerships?estado=${estado}`)).html;
let html = await ownershipsHtml("activas");
check("activas lists the active ownership only", html.includes("Ana Activa") && !html.includes("Bea Finalizada"));
html = await ownershipsHtml("finalizadas");
check("finalizadas lists the ended ownership only", html.includes("Bea Finalizada") && !html.includes("Ana Activa"));
html = await ownershipsHtml("sin-iniciar");
check("sin-iniciar lists the new ownership", html.includes("Ana Activa"));
html = await ownershipsHtml("verificadas");
check("verificadas is empty", !html.includes("Ana Activa") && !html.includes("Bea Finalizada"));

console.log("Audit");
const events = await db.collection("organizations/org-a/auditEvents").get();
check("every audit event has an area", events.size > 0 && events.docs.every((doc) => typeof doc.get("area") === "string"),
  events.docs.filter((doc) => !doc.get("area")).map((doc) => doc.get("action")).join(","));
html = (await page(session, "/admin/audit?area=ownerships")).html;
check("area=ownerships shows ownership events only", html.includes("Titularidad creada") && !html.includes("Propiedad creada"));
html = (await page(session, "/admin/audit?area=properties")).html;
check("area=properties shows property events only", html.includes("Propiedad creada") && !html.includes("Titularidad creada"));

console.log("Migration");
const stripped = events.docs.slice(0, 2);
for (const doc of stripped) await doc.ref.update({ area: FieldValue.delete() });
const migrate = (...args) =>
  spawnSync(process.execPath, ["scripts/migrate-audit-area.mjs", ...args], {
    encoding: "utf8",
    env: { ...process.env, FIREBASE_PROJECT_ID: "demo-mghpm" },
  });
let run = migrate();
check("simulation counts without writing", run.stdout.includes("would_update=2"), run.stdout + run.stderr);
check("simulation leaves events untouched", !(await stripped[0].ref.get()).get("area"));
run = migrate("--yes");
check("--yes updates the two events", run.stdout.includes("updated=2"), run.stdout + run.stderr);
check("events have their area back", (await Promise.all(stripped.map((doc) => doc.ref.get()))).every((doc) => doc.get("area")));
run = migrate("--yes");
check("second run changes nothing", run.stdout.includes("updated=0"), run.stdout + run.stderr);

finish();
