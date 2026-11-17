// Fase 2A-2: rewrites legacy people (type owner|tenant) and memberships (single role)
// into the new formats (kind + relationships, staffRole + portals).
//
//   node scripts/migrate-relationships.mjs [--dry-run] [--yes] [--org <organizationId>]
//
// Writing to a real project (no FIRESTORE_EMULATOR_HOST) requires --yes.
//
// Targets the project in FIREBASE_PROJECT_ID with application default credentials
// (or the emulators when FIRESTORE_EMULATOR_HOST is set). It is idempotent: documents
// already in the new format are not touched. The old `type`/`role` fields are kept
// for compatibility, and old email reservations are kept (the app releases them on save).
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const orgIndex = args.indexOf("--org");
const onlyOrg = orgIndex >= 0 ? args[orgIndex + 1] : null;
if (orgIndex >= 0 && (!onlyOrg || onlyOrg.startsWith("--"))) {
  console.error("--org needs an organization id.");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID to the target Firebase project.");
  process.exit(1);
}
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (projectId.startsWith("demo-") && !emulatorHost) {
  console.error(
    `Project "${projectId}" is a demo project but FIRESTORE_EMULATOR_HOST is not set; refusing to run against the real Firestore.`,
  );
  process.exit(1);
}
console.log(
  emulatorHost
    ? `TARGET: EMULATOR ${emulatorHost} (project ${projectId})`
    : `TARGET: REAL project ${projectId}`,
);
if (!emulatorHost && !dryRun && !args.includes("--yes")) {
  console.error(
    "Refusing to write to a REAL project without --yes. Re-run with --dry-run first, then:\n" +
      `  node scripts/migrate-relationships.mjs --yes${onlyOrg ? ` --org ${onlyOrg}` : ""}`,
  );
  process.exit(1);
}
const app = initializeApp({ credential: applicationDefault(), projectId }, "migrate-relationships");
const db = getFirestore(app);

const STAFF_ROLES = ["org_owner", "admin", "manager", "operations"];
const PORTAL_LANES = ["owner", "tenant", "applicant", "guest"];
const RELATIONSHIP_TYPES = ["owner", "tenant", "applicant", "guest", "owner_prospect"];
const STATUSES = ["active", "pending", "inactive"];

// Same rules as normalizePersonIdentity in src/lib/people/relationships.ts.
function normalizePersonIdentity(data) {
  const legacySince = data.createdAt ?? Timestamp.fromMillis(0);
  const legacy =
    data.type === "tenant"
      ? {
          kind: "individual",
          relationships: {
            tenant: {
              status: "active",
              since: legacySince,
              propertyId: data.propertyId ?? null,
              unitId: data.unitId ?? null,
            },
          },
        }
      : {
          kind: data.contactName ? "entity" : "individual",
          relationships: data.type === "owner" ? { owner: { status: "active", since: legacySince } } : {},
        };
  return {
    kind: data.kind ?? legacy.kind,
    relationships: data.relationships ?? legacy.relationships,
  };
}

const activeTypes = (relationships) =>
  RELATIONSHIP_TYPES.filter((type) => relationships[type]?.status === "active");

// Same rules as src/lib/people/search-index.ts.
const normalizeSearch = (value) =>
  value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

function createSearchIndex(person) {
  const filterKeys = [];
  for (const relationship of [...new Set(person.relationshipTypes), "*"]) {
    for (const status of [person.status, "*"]) {
      for (const archived of [String(person.archived), "*"]) {
        filterKeys.push(`relationship=${relationship}&status=${status}&archived=${archived}`);
      }
    }
  }

  const terms = new Set();
  for (const field of [person.name, person.contactName ?? "", person.email]) {
    const normalized = normalizeSearch(field);
    if (!normalized) continue;
    terms.add(normalized);
    for (const term of normalized.split(/[\s/_.@+-]+/u)) if (term) terms.add(term);
  }
  const phoneDigits = (person.phone ?? "").replace(/\D/gu, "");
  if (phoneDigits) terms.add(phoneDigits);

  const prefixes = new Set();
  for (const term of terms) {
    const characters = Array.from(term);
    for (let length = 1; length <= characters.length; length += 1) {
      prefixes.add(characters.slice(0, length).join(""));
    }
  }

  return {
    searchName: normalizeSearch(person.name),
    filterKeys,
    searchKeys: filterKeys.flatMap((filterKey) =>
      Array.from(prefixes, (prefix) => `${filterKey}&search=${encodeURIComponent(prefix)}`),
    ),
  };
}

const counts = {
  organizations: 0,
  peopleMigrated: 0,
  peopleSkipped: 0,
  peopleInvalid: 0,
  reservationsCreated: 0,
  reservationConflicts: 0,
  membershipsMigrated: 0,
  membershipsSkipped: 0,
};

async function migratePeople(organizationReference, organizationId) {
  const snapshot = await organizationReference.collection("people").get();
  for (const document of snapshot.docs) {
    const data = document.data();
    if (data.relationships && Array.isArray(data.relationshipTypes) && data.kind) {
      counts.peopleSkipped += 1;
      continue;
    }
    if (
      typeof data.name !== "string" ||
      typeof data.email !== "string" ||
      !STATUSES.includes(data.status)
    ) {
      console.warn(`  skip invalid person ${organizationId}/${document.id}`);
      counts.peopleInvalid += 1;
      continue;
    }

    const { kind, relationships } = normalizePersonIdentity(data);
    const relationshipTypes = activeTypes(relationships);
    const archived = data.archived === true;
    const emailKey = data.emailKey ?? data.email.trim().toLowerCase();
    const update = {
      kind,
      relationships,
      relationshipTypes,
      ...createSearchIndex({ ...data, relationshipTypes, archived }),
    };

    let reservationReference = null;
    if (!archived) {
      const id = createHash("sha256").update(`${kind}:${emailKey}`).digest("hex");
      reservationReference = organizationReference.collection("personEmails").doc(id);
      const reservation = await reservationReference.get();
      if (reservation.exists && reservation.data()?.personId !== document.id) {
        // e.g. an owner and a tenant that shared an email when reservations were per type.
        console.warn(
          `  email reservation conflict ${organizationId}/${document.id} (${kind}:${emailKey}); leaving it unreserved`,
        );
        counts.reservationConflicts += 1;
        reservationReference = null;
      } else if (reservation.exists) {
        reservationReference = null;
      }
    }

    console.log(
      `  person ${organizationId}/${document.id}: ${kind} [${relationshipTypes.join(", ") || "-"}]` +
        (reservationReference ? " + reservation" : ""),
    );
    if (!dryRun) {
      const batch = db.batch();
      batch.update(document.ref, update);
      if (reservationReference) {
        batch.create(reservationReference, {
          personId: document.id,
          type: kind,
          createdAt: Timestamp.now(),
        });
      }
      await batch.commit();
    }
    counts.peopleMigrated += 1;
    if (reservationReference) counts.reservationsCreated += 1;
  }
}

// Same rules as normalizeMembership in src/lib/access/membership.ts, but it always
// writes both staffRole (null when none) and portals ([] when none).
function migrateMembershipData(data) {
  const role = data.role ?? "";
  const isPortal = PORTAL_LANES.includes(role);
  const legacyPortals = isPortal ? [role] : [];
  const legacyPersonIds = isPortal && data.personId ? { [role]: data.personId } : {};
  if (data.staffRole !== undefined || data.portals !== undefined) {
    // A document with staffRole but no portals still derives its portals from the legacy role.
    const hasPortals = Array.isArray(data.portals);
    return {
      staffRole: data.staffRole ?? null,
      portals: hasPortals ? data.portals.filter((lane) => PORTAL_LANES.includes(lane)) : legacyPortals,
      portalPersonIds: data.portalPersonIds ?? (hasPortals ? {} : legacyPersonIds),
    };
  }
  return {
    staffRole: STAFF_ROLES.includes(role) ? role : null,
    portals: legacyPortals,
    portalPersonIds: legacyPersonIds,
  };
}

async function migrateMemberships(organizationReference, organizationId) {
  const snapshot = await organizationReference.collection("memberships").get();
  for (const document of snapshot.docs) {
    const data = document.data();
    const complete =
      data.staffRole !== undefined && Array.isArray(data.portals) && data.portalPersonIds !== undefined;
    if (complete) {
      counts.membershipsSkipped += 1;
      continue;
    }
    const update = migrateMembershipData(data);
    console.log(
      `  membership ${organizationId}/${document.id}: staffRole=${update.staffRole ?? "null"} portals=[${update.portals.join(", ")}]`,
    );
    if (!dryRun) await document.ref.update(update);
    counts.membershipsMigrated += 1;
  }
}

async function main() {
  console.log(`${dryRun ? "[dry-run] " : ""}Migrating relationships in project ${projectId}`);
  const organizations = onlyOrg
    ? [db.collection("organizations").doc(onlyOrg)]
    : (await db.collection("organizations").get()).docs.map((document) => document.ref);

  for (const organizationReference of organizations) {
    console.log(`Organization ${organizationReference.id}`);
    counts.organizations += 1;
    await migratePeople(organizationReference, organizationReference.id);
    await migrateMemberships(organizationReference, organizationReference.id);
  }

  console.log(`\n${dryRun ? "Would change" : "Changed"}:`);
  console.log(JSON.stringify(counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
