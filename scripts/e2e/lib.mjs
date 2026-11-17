// Shared helpers for the e2e checks against the Firebase emulators.
// Each suite wipes the demo-mghpm emulator data before running.
import { createRequire } from "node:module";
import path from "node:path";

const projectRoot = process.argv[2] ?? process.cwd();
const require = createRequire(path.join(projectRoot, "package.json"));
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const PROJECT = "demo-mghpm";
export const BASE = "http://localhost:3100";
const app = initializeApp({ projectId: PROJECT }, "e2e");
export const db = getFirestore(app);
export const auth = getAuth(app);

let failures = 0;
let passes = 0;
export function check(name, condition, detail = "") {
  if (condition) {
    passes += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name} ${detail}`);
  }
}

export async function resetEmulators() {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

export async function signUp(email) {
  const response = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret-123", returnSecureToken: true }),
    },
  );
  const body = await response.json();
  if (!body.idToken) throw new Error(`signUp failed: ${JSON.stringify(body)}`);
  return { uid: body.localId, idToken: body.idToken };
}

function getCookie(response, name) {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const index = pair.indexOf("=");
    if (pair.slice(0, index) === name) return pair.slice(index + 1);
  }
  return null;
}

async function csrf() {
  const response = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await response.json();
  return csrfToken;
}

export async function login(idToken) {
  const token = await csrf();
  const response = await fetch(`${BASE}/api/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      "X-CSRF-Token": token,
      Cookie: `mghpm_csrf=${token}`,
    },
    body: JSON.stringify({ idToken }),
  });
  const session = getCookie(response, "mghpm_session");
  if (response.status !== 204 || !session) throw new Error(`login failed ${response.status}`);
  return session;
}

export async function api(session, method, url, body, { withCsrf = true } = {}) {
  const token = await csrf();
  const response = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      ...(withCsrf ? { "X-CSRF-Token": token } : {}),
      Cookie: `mghpm_session=${session}; mghpm_csrf=${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

export async function page(session, url) {
  const response = await fetch(`${BASE}${url}`, {
    headers: { Cookie: `mghpm_session=${session}` },
    redirect: "manual",
  });
  return { status: response.status, html: await response.text() };
}

export async function seedOrganization(organizationId, name, members) {
  const org = db.collection("organizations").doc(organizationId);
  await org.set({
    name,
    baseCurrency: "USD",
    supportedCurrencies: ["USD", "DOP"],
    supportedCountries: ["US", "DO"],
    supportedLanguages: ["es-DO", "en-US"],
    defaultTimeZone: "America/New_York",
    status: "active",
  });
  for (const [uid, role] of members) {
    await org.collection("memberships").doc(uid).set({
      userUid: uid,
      organizationId,
      role,
      status: "active",
    });
  }
}

export function finish() {
  console.log(`
${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

export async function signIn(email, password) {
  const response = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const body = await response.json();
  if (!body.idToken) throw new Error(`signIn failed: ${JSON.stringify(body)}`);
  return { uid: body.localId, idToken: body.idToken };
}

// Property wizard fields (Master 20) that every POST/PATCH /api/properties body must carry.
export const propertyWizardDefaults = {
  rentalCategory: "long_term",
  managementStartDate: "",
  description: "",
  location: null,
  currency: "USD",
  startingRent: "",
  securityDeposit: "",
  cleaningFee: "",
  electricityIncluded: false,
  electricityMeterRequired: false,
  waterIncluded: false,
  internetIncluded: false,
  electricityMeterNumber: "",
  initialMeterReading: "",
  electricityRatePerKwh: "",
  amenities: [],
};
