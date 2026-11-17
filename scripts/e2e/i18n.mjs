// E2E for the language of the private area (paso 4E): request language (cookie →
// browser → Spanish), the ES | EN preference API, restoring it at sign-in, and the
// pages translated so far. Requires the emulators and a server on port 3100
// (see README). Wipes demo-mghpm data.
import { api, BASE, check, db, finish, login, resetEmulators, seedOrganization, signUp } from "./lib.mjs";

await resetEmulators();
const owner = await signUp("owner@example.test");
const portal = await signUp("portal@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"]]);
const session = await login(owner.idToken);
const ownerPerson = (await api(session, "POST", "/api/people", {
  kind: "individual", name: "Olga Owner", email: "portal@example.test", phone: "", status: "active",
  relationships: { owner: true, tenant: false },
})).body?.personId;
await db.doc(`organizations/org-a/memberships/${portal.uid}`).set({
  userUid: portal.uid, organizationId: "org-a", staffRole: null, portals: ["owner"],
  portalPersonIds: { owner: ownerPerson }, status: "active",
});
const portalSession = await login(portal.idToken);

function setCookie(response, name) {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const index = pair.indexOf("=");
    if (pair.slice(0, index) === name) return pair.slice(index + 1);
  }
  return null;
}

async function csrf() {
  return (await (await fetch(`${BASE}/api/auth/csrf`)).json()).csrfToken;
}

/** GET a page with optional session, language cookie and Accept-Language. */
async function view(url, { session: sessionCookie, locale, acceptLanguage } = {}) {
  const cookies = [sessionCookie && `mghpm_session=${sessionCookie}`, locale && `mghpm_locale=${locale}`].filter(Boolean);
  const response = await fetch(`${BASE}${url}`, {
    headers: {
      ...(cookies.length ? { Cookie: cookies.join("; ") } : {}),
      ...(acceptLanguage ? { "Accept-Language": acceptLanguage } : {}),
    },
    redirect: "manual",
  });
  return { status: response.status, html: await response.text() };
}

async function choose(locale, sessionCookie) {
  const token = await csrf();
  const response = await fetch(`${BASE}/api/preferences/locale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      "X-CSRF-Token": token,
      Cookie: [`mghpm_csrf=${token}`, sessionCookie && `mghpm_session=${sessionCookie}`].filter(Boolean).join("; "),
    },
    body: JSON.stringify({ locale }),
  });
  return { status: response.status, cookie: setCookie(response, "mghpm_locale") };
}

const lang = (html) => html.match(/<html[^>]*\blang="(\w+)"/)?.[1];

console.log("Request language");
let result = await view("/acceder");
check("default is Spanish", lang(result.html) === "es" && result.html.includes("¿Cómo quieres acceder?"));
result = await view("/acceder", { acceptLanguage: "en-US,en;q=0.9" });
check("an English browser gets English", lang(result.html) === "en" && result.html.includes("How do you want to sign in?"));
result = await view("/acceder", { acceptLanguage: "en-US", locale: "es" });
check("the saved preference beats the browser", lang(result.html) === "es");
result = await view("/login", { locale: "en" });
check("login page in English", result.html.includes("Welcome back") && result.html.includes("Sign in"));

console.log("Admin in English");
result = await view("/admin/properties", { session, locale: "en" });
check("html lang is en", lang(result.html) === "en");
for (const text of ["Portfolio", "Leasing", "Properties", "Ownerships", "Audit log", "Search…", "Sign out", ">Home<"]) {
  check(`admin shows “${text}”`, result.html.includes(text));
}
check("create menu in English", result.html.includes("New property") && result.html.includes("New lease"));
result = await view("/admin/buscar?q=x", { session, locale: "en" });
check("search page in English", result.html.includes("Type what you are looking for"));
result = await view("/admin/properties", { session });
check("admin stays Spanish by default", lang(result.html) === "es" && result.html.includes("Cartera"));

console.log("Portal and access states in English");
result = await view("/propietario", { session: portalSession, locale: "en" });
check("portal frame in English", result.html.includes("Owner portal") && result.html.includes("My profile"));
result = await view("/admin", { session: portalSession, locale: "en" });
check("denied screen in English", result.html.includes("You don&#x27;t have access to this section") || result.html.includes("You don't have access to this section"));

console.log("Preference API");
let saved = await choose("en", session);
check("signed in: 200 and cookie", saved.status === 200 && saved.cookie === "en", JSON.stringify(saved));
check("signed in: saved in users/{uid}", (await db.doc(`users/${owner.uid}`).get()).get("locale") === "en");
saved = await choose("fr", session);
check("unsupported language → 400", saved.status === 400);
saved = await choose("es");
check("signed out: cookie only", saved.status === 200 && saved.cookie === "es");

console.log("Restored at sign-in");
const token = await csrf();
const response = await fetch(`${BASE}/api/auth/session`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE, "X-CSRF-Token": token, Cookie: `mghpm_csrf=${token}` },
  body: JSON.stringify({ idToken: owner.idToken }),
});
check("sign-in sets the saved language", response.status === 204 && setCookie(response, "mghpm_locale") === "en");
const fresh = await fetch(`${BASE}/api/auth/session`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE, "X-CSRF-Token": token, Cookie: `mghpm_csrf=${token}` },
  body: JSON.stringify({ idToken: portal.idToken }),
});
check("no saved language → no cookie", fresh.status === 204 && setCookie(fresh, "mghpm_locale") === null);

finish();
