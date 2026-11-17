// Paso 4A: adds `area` to audit events written before it existed.
//
//   node scripts/migrate-audit-area.mjs          simulation: counts what would change
//   node scripts/migrate-audit-area.mjs --yes    writes
//
// Targets FIREBASE_PROJECT_ID with application default credentials, or the emulators when
// FIRESTORE_EMULATOR_HOST is set. Idempotent: events that already have `area` are skipped.
import { createRequire } from "node:module";
import path from "node:path";
import { auditArea } from "../src/lib/audit/area.ts";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const write = process.argv.includes("--yes");
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID to the target Firebase project.");
  process.exit(1);
}
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (projectId.startsWith("demo-") && !emulatorHost) {
  console.error(`Project "${projectId}" is a demo project but FIRESTORE_EMULATOR_HOST is not set.`);
  process.exit(1);
}
console.log(emulatorHost ? `TARGET: EMULATOR ${emulatorHost} (project ${projectId})` : `TARGET: REAL project ${projectId}`);
console.log(write ? "MODE: write" : "MODE: simulation (re-run with --yes to write)");

const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId }, "migrate-audit-area"));
let scanned = 0;
let pending = 0;
let unknown = 0;

for (const organization of await db.collection("organizations").listDocuments()) {
  const snapshot = await organization.collection("auditEvents").get();
  let batch = db.batch();
  let inBatch = 0;
  for (const document of snapshot.docs) {
    scanned += 1;
    if (typeof document.get("area") === "string") continue;
    let area;
    try {
      area = auditArea(String(document.get("action") ?? ""));
    } catch {
      unknown += 1;
      console.warn(`  unknown action at ${document.ref.path}: ${document.get("action")}`);
      continue;
    }
    pending += 1;
    if (!write) continue;
    batch.update(document.ref, { area });
    inBatch += 1;
    if (inBatch === 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();
}

console.log(`RESULT scanned=${scanned} ${write ? "updated" : "would_update"}=${pending} unknown=${unknown}`);
