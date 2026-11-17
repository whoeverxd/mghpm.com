// E2E check for the public stays catalog (Master 29, subproject A) against the
// Firebase emulators. Requires a dev server on port 3100 started with
// PUBLIC_CATALOG_ORGANIZATION_ID=org-a; see README.md. Wipes demo-mghpm data.
import { createRequire } from "node:module";
import path from "node:path";
import {
  api,
  BASE,
  check,
  db,
  finish,
  login,
  propertyWizardDefaults,
  resetEmulators,
  seedOrganization,
  signUp,
} from "./lib.mjs";

const require = createRequire(path.join(process.cwd(), "package.json"));
const sharp = require("sharp");

function isoDate(daysFromToday) {
  return new Date(Date.now() + daysFromToday * 86_400_000).toISOString().slice(0, 10);
}

async function publicPage(url) {
  const response = await fetch(`${BASE}${url}`, { redirect: "manual" });
  return { status: response.status, html: await response.text(), location: response.headers.get("location") };
}

async function inquiry(body, { origin = BASE, ip = "203.0.113.10" } = {}) {
  const response = await fetch(`${BASE}/api/public/stays/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function uploadImage(session, propertyId) {
  const csrf = (await (await fetch(`${BASE}/api/auth/csrf`)).json()).csrfToken;
  const bytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 0, g: 107, b: 104 } } })
    .jpeg()
    .toBuffer();
  const body = new FormData();
  body.append("file", new Blob([bytes], { type: "image/jpeg" }), "sala.jpg");
  const response = await fetch(`${BASE}/api/properties/${propertyId}/images`, {
    method: "POST",
    headers: { Origin: BASE, "X-CSRF-Token": csrf, Cookie: `mghpm_session=${session}; mghpm_csrf=${csrf}` },
    body,
  });
  return (await response.json()).imageId;
}

const property = {
  ...propertyWizardDefaults,
  name: "Torre Mar",
  code: "TM-1",
  type: "apartment_condo",
  status: "active",
  rentalCategory: "short_term",
  description: "Frente al mar.",
  address: "Calle Secreta 77",
  city: "Punta Cana",
  state: "La Altagracia",
  postalCode: "23000",
  country: "DO",
  cleaningFee: "80",
  amenities: ["pool"],
};
const unitBase = {
  label: "101",
  floor: "1",
  bedrooms: 2,
  bathrooms: 1,
  status: "available",
  marketRent: "999",
  marketRentCurrency: "USD",
};
const stay = { published: true, nightlyRate: "150", maxGuests: "4", beds: "2", minNights: "2", maxNights: "28" };

await resetEmulators();
const owner = await signUp("owner@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"]]);
const session = await login(owner.idToken);

console.log("Staff — configure and publish");
let result = await api(session, "POST", "/api/properties", property);
check("create short-term property", result.status === 201, JSON.stringify(result));
const propertyId = result.body?.propertyId;
result = await api(session, "POST", "/api/properties", { ...property, code: "LT-1", name: "Largo Plazo", rentalCategory: "long_term" });
const longTermId = result.body?.propertyId;
result = await api(session, "POST", `/api/properties/${longTermId}/units`, { ...unitBase, stay });
check("publishing on a long-term property returns 409", result.status === 409, JSON.stringify(result));

result = await api(session, "POST", `/api/properties/${propertyId}/units`, { ...unitBase, stay: { ...stay, published: false } });
check("create unpublished unit", result.status === 201, JSON.stringify(result));
const unitId = result.body?.unitId;
const imageId = await uploadImage(session, propertyId);

let page = await publicPage("/stays");
check("unpublished unit is not listed", page.status === 200 && !page.html.includes("Torre Mar"));
let image = await fetch(`${BASE}/api/public/stays/images/${propertyId}/${imageId}?variant=thumbnail`);
check("image is private while nothing is published", image.status === 404);

result = await api(session, "PATCH", `/api/properties/${propertyId}/units/${unitId}`, { ...unitBase, stay });
check("publish unit", result.status === 200, JSON.stringify(result));
const stored = (await db.doc(`organizations/org-a/properties/${propertyId}/units/${unitId}`).get()).data();
check("stay stored in minor units", stored?.stay?.nightlyRateMinor === 15000 && stored?.stay?.maxGuests === 4);

console.log("Public — search and detail");
page = await publicPage("/en/stays?guests=2");
check("old /en/stays redirects to /stays", page.status === 308 && page.location?.endsWith("/stays?guests=2"));
page = await publicPage(`/es/stays/${propertyId}/${unitId}`);
check("old /es/stays detail redirects to /estancias", page.status === 308 && (page.location ?? "").includes(`/estancias/${propertyId}/${unitId}`));
page = await publicPage("/estancias");
check("Spanish catalog lists the unit in Spanish", page.status === 200 && page.html.includes("Torre Mar") && page.html.includes("Explorar estadías"));
check("Spanish catalog links to /estancias detail", page.html.includes(`/estancias/${propertyId}/${unitId}`));
page = await publicPage("/stays");
check("published unit is listed", page.html.includes("Torre Mar"));
for (const secret of ["Calle Secreta", "TM-1", "999"]) {
  check(`catalog does not expose ${secret}`, !page.html.includes(secret));
}
check("guest filter excludes unit", !(await publicPage("/stays?guests=5")).html.includes("Torre Mar"));
check("pets filter excludes unit", !(await publicPage("/stays?pets=1")).html.includes("Torre Mar"));
check("price filter excludes unit", !(await publicPage("/stays?maxPrice=100")).html.includes("Torre Mar"));
page = await publicPage(`/stays?checkIn=${isoDate(10)}&checkOut=${isoDate(11)}`);
check("one night moves the unit to unavailable", page.html.includes("Not available for your dates"));

const checkIn = isoDate(10);
const checkOut = isoDate(13);
page = await publicPage(`/estancias/${propertyId}/${unitId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
check("detail renders", page.status === 200 && page.html.includes("Torre Mar"));
check("detail quotes 3 × 150 + 80 = 530", page.html.includes("530"));
check("detail does not expose the address", !page.html.includes("Calle Secreta"));
image = await fetch(`${BASE}/api/public/stays/images/${propertyId}/${imageId}?variant=thumbnail`);
check("image is public once published", image.status === 200);
check("unknown unit is 404", (await publicPage(`/estancias/${propertyId}/nope`)).status === 404);

console.log("Public — inquiries");
const inquiryBody = {
  propertyId,
  unitId,
  checkIn,
  checkOut,
  guests: 2,
  pets: 0,
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: "+1 809 555 0101",
  message: "Llegamos tarde.",
  consent: true,
  locale: "es",
  totalMinor: 1,
};
result = await inquiry(inquiryBody);
check("valid inquiry returns 201", result.status === 201, JSON.stringify(result));
let saved = await db.collection("organizations/org-a/stayInquiries").get();
const savedInquiry = saved.docs[0]?.data();
check("inquiry stored with server quote", saved.size === 1 && savedInquiry?.quote?.totalMinor === 53000 && savedInquiry?.status === "new");
check("client total is ignored", savedInquiry?.totalMinor === undefined);
const rateDocs = await db.collection("organizations/org-a/inquiryRateLimits").get();
check("rate limit stores a hash, not the IP", rateDocs.docs.every((doc) => !doc.id.includes("203.0.113.10")));

result = await inquiry({ ...inquiryBody, website: "http://spam.example" });
saved = await db.collection("organizations/org-a/stayInquiries").get();
check("honeypot answers 201 and stores nothing", result.status === 201 && saved.size === 1);
check("foreign origin returns 403", (await inquiry(inquiryBody, { origin: "http://evil.example" })).status === 403);
check("invalid body returns 400", (await inquiry({ ...inquiryBody, consent: false })).status === 400);
check("too many guests returns 409", (await inquiry({ ...inquiryBody, guests: 9 }, { ip: "203.0.113.20" })).status === 409);

for (let index = 0; index < 4; index += 1) await inquiry(inquiryBody, { ip: "203.0.113.30" });
result = await inquiry(inquiryBody, { ip: "203.0.113.30" });
check("fifth request from one IP is accepted", result.status === 201);
result = await inquiry(inquiryBody, { ip: "203.0.113.30" });
check("sixth request from one IP returns 429", result.status === 429, JSON.stringify(result));

console.log("Staff — inbox");
const inquiryId = saved.docs[0].id;
result = await api(session, "PATCH", `/api/stay-inquiries/${inquiryId}`, { status: "contacted" });
check("staff marks inquiry contacted", result.status === 200);
const audit = await db.collection("organizations/org-a/auditEvents").where("action", "==", "stay_inquiry.status_changed").get();
check("status change is audited", audit.size === 1);

console.log("Visibility — hide again");
await db.doc(`organizations/org-a/properties/${propertyId}`).update({ archived: true });
check("archived property hides the unit", !(await publicPage("/stays")).html.includes("Torre Mar"));
check("archived property detail is 404", (await publicPage(`/stays/${propertyId}/${unitId}`)).status === 404);
await db.doc(`organizations/org-a/properties/${propertyId}`).update({ archived: false });
await db.doc(`organizations/org-a/properties/${propertyId}/units/${unitId}`).update({ activeLeaseId: "lease-x" });
check("active lease hides the unit", !(await publicPage("/stays")).html.includes("Torre Mar"));

finish();
