// E2E check for property images (local server storage) against
// the Firebase emulators. Requires a server on port 3100; see "Prueba end-to-end"
// in README.md. It wipes the demo-mghpm emulator data.
// Usage: npm run test:e2e
import { createRequire } from "node:module";
import path from "node:path";
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

const require = createRequire(path.join(process.cwd(), "package.json"));
const sharp = require("sharp");
const { readdir } = await import("node:fs/promises");
const storageRoot = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "storage");

async function storedFiles(propertyId, imageId) {
  const folder = path.join(storageRoot, "organizations", "org-a", "properties", propertyId, "images", imageId);
  return (await readdir(folder).catch(() => [])).sort();
}

async function makeImage(format, width = 1200, height = 800) {
  return sharp({ create: { width, height, channels: 3, background: { r: 0, g: 107, b: 104 } } })
    .toFormat(format)
    .toBuffer();
}

async function csrf() {
  const response = await fetch(`${BASE}/api/auth/csrf`);
  return (await response.json()).csrfToken;
}

async function upload(session, propertyId, bytes, name, type, { withCsrf = true } = {}) {
  const token = await csrf();
  const body = new FormData();
  body.append("file", new Blob([bytes], { type }), name);
  const response = await fetch(`${BASE}/api/properties/${propertyId}/images`, {
    method: "POST",
    headers: {
      Origin: BASE,
      ...(withCsrf ? { "X-CSRF-Token": token } : {}),
      Cookie: `mghpm_session=${session}; mghpm_csrf=${token}`,
    },
    body,
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function download(session, propertyId, imageId, variant) {
  const response = await fetch(`${BASE}/api/properties/${propertyId}/images/${imageId}?variant=${variant}`, {
    headers: { Cookie: `mghpm_session=${session}` },
  });
  return {
    status: response.status,
    type: response.headers.get("content-type"),
    cache: response.headers.get("cache-control"),
    bytes: Buffer.from(await response.arrayBuffer()),
  };
}

async function readProperty(propertyId) {
  return (await db.doc(`organizations/org-a/properties/${propertyId}`).get()).data();
}

async function readOrder(propertyId) {
  const snapshot = await db.collection(`organizations/org-a/properties/${propertyId}/images`).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => a.position - b.position)
    .map((image) => image.id);
}

await resetEmulators();
const owner = await signUp("owner@example.test");
const manager = await signUp("manager@example.test");
const outsider = await signUp("outsider@example.test");
await seedOrganization("org-a", "Org A", [[owner.uid, "org_owner"], [manager.uid, "manager"]]);
await seedOrganization("org-b", "Org B", [[outsider.uid, "org_owner"]]);
const ownerSession = await login(owner.idToken);
const managerSession = await login(manager.idToken);
const outsiderSession = await login(outsider.idToken);

const created = await api(ownerSession, "POST", "/api/properties", {
  ...propertyWizardDefaults,
  name: "Villa Fotos",
  code: "VF-1",
  type: "residential",
  status: "draft",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
});
const propertyId = created.body?.propertyId;
// Separate property so the manager upload does not disturb the counts checked below.
const managerProperty = await api(ownerSession, "POST", "/api/properties", {
  ...propertyWizardDefaults,
  name: "Villa Manager",
  code: "VM-1",
  type: "residential",
  status: "draft",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
});
const managerPropertyId = managerProperty.body?.propertyId;

console.log("Upload");
const jpeg = await makeImage("jpeg");
let result = await upload(ownerSession, propertyId, jpeg, "fachada.jpg", "image/jpeg");
check("upload JPG returns 201", result.status === 201, JSON.stringify(result));
const firstId = result.body?.imageId;
let property = await readProperty(propertyId);
check("first image becomes cover and count is 1", property?.coverImageId === firstId && property?.imageCount === 1);
const firstDoc = (await db.doc(`organizations/org-a/properties/${propertyId}/images/${firstId}`).get()).data();
check("image metadata stored",
  firstDoc?.contentType === "image/jpeg" && firstDoc?.width === 1200 && firstDoc?.height === 800 &&
  firstDoc?.originalName === "fachada.jpg" && firstDoc?.position === 0 &&
  firstDoc?.storagePath === `organizations/org-a/properties/${propertyId}/images/${firstId}/original.jpg`);

result = await upload(ownerSession, propertyId, await makeImage("png", 600, 900), "sala.png", "image/png");
const secondId = result.body?.imageId;
result = await upload(ownerSession, propertyId, await makeImage("webp"), "patio.webp", "image/webp");
const thirdId = result.body?.imageId;
check("PNG and WebP accepted", Boolean(secondId && thirdId));
check("cover unchanged by later uploads", (await readProperty(propertyId))?.coverImageId === firstId);

result = await upload(ownerSession, propertyId, Buffer.from("not an image at all"), "virus.jpg", "image/jpeg");
check("non-image bytes with .jpg name return 415", result.status === 415, JSON.stringify(result));
result = await upload(ownerSession, propertyId, await makeImage("gif"), "anim.gif", "image/gif");
check("GIF rejected (415)", result.status === 415);
result = await upload(ownerSession, propertyId, Buffer.alloc(11 * 1024 * 1024, 1), "big.jpg", "image/jpeg");
check("over 10 MB returns 413", result.status === 413);
result = await upload(ownerSession, propertyId, jpeg, "x.jpg", "image/jpeg", { withCsrf: false });
check("missing CSRF returns 403", result.status === 403);
result = await upload(managerSession, managerPropertyId, jpeg, "x.jpg", "image/jpeg");
check("manager can upload (201)", result.status === 201, JSON.stringify(result));
result = await upload(outsiderSession, propertyId, jpeg, "x.jpg", "image/jpeg");
check("other organization gets 404", result.status === 404);
check("rejected uploads leave count at 3", (await readProperty(propertyId))?.imageCount === 3);

console.log("Serve");
let file = await download(ownerSession, propertyId, firstId, "original");
check("original served with its type", file.status === 200 && file.type === "image/jpeg" && file.bytes.equals(jpeg));
check("private cache header", file.cache?.startsWith("private"));
file = await download(ownerSession, propertyId, secondId, "thumbnail");
const thumbMeta = await sharp(file.bytes).metadata();
check("thumbnail is 640×480 WebP", file.status === 200 && thumbMeta.format === "webp" && thumbMeta.width === 640 && thumbMeta.height === 480);
file = await download(managerSession, propertyId, firstId, "original");
check("manager can read image (200)", file.status === 200 && file.bytes.equals(jpeg));
file = await download(outsiderSession, propertyId, firstId, "original");
check("other organization cannot read image (404)", file.status === 404);
file = await download(ownerSession, propertyId, firstId, "huge");
check("unknown variant returns 400", file.status === 400);
const anonymous = await fetch(`${BASE}/api/properties/${propertyId}/images/${firstId}?variant=original`);
check("anonymous request rejected (401)", anonymous.status === 401);

console.log("Cover and order");
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/images`, { coverImageId: secondId });
check("set cover returns 200", result.status === 200, JSON.stringify(result));
check("cover updated", (await readProperty(propertyId))?.coverImageId === secondId);
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/images`, { order: [thirdId, firstId, secondId] });
check("reorder returns 200", result.status === 200);
check("positions follow the new order", JSON.stringify(await readOrder(propertyId)) === JSON.stringify([thirdId, firstId, secondId]));
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/images`, { order: [thirdId, firstId] });
check("incomplete order returns 409", result.status === 409);
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/images`, { coverImageId: "missing" });
check("unknown cover returns 404", result.status === 404);
result = await api(ownerSession, "PATCH", `/api/properties/${propertyId}/images`, {});
check("empty update returns 400", result.status === 400);

console.log("Delete");
result = await api(ownerSession, "DELETE", `/api/properties/${propertyId}/images/${secondId}`, {});
check("delete cover returns 200", result.status === 200, JSON.stringify(result));
property = await readProperty(propertyId);
check("next image in order becomes cover", property?.coverImageId === thirdId && property?.imageCount === 2);
file = await download(ownerSession, propertyId, secondId, "original");
check("deleted image no longer served (404)", file.status === 404);
check("kept image still has both files in storage",
  JSON.stringify(await storedFiles(propertyId, firstId)) === '["original.jpg","thumbnail.webp"]');
check("deleted image files removed from storage", (await storedFiles(propertyId, secondId)).length === 0);
result = await api(outsiderSession, "DELETE", `/api/properties/${propertyId}/images/${firstId}`, {});
check("other organization cannot delete (404)", result.status === 404);
const audit = await db.collection("organizations/org-a/auditEvents").where("propertyId", "==", propertyId).get();
const actions = audit.docs.map((doc) => doc.data().action);
check("audit events recorded",
  ["property.image_added", "property.image_cover_set", "property.images_reordered", "property.image_removed"].every((action) => actions.includes(action)));

console.log("Limit");
for (let index = 0; index < 28; index += 1) {
  await upload(ownerSession, propertyId, jpeg, `foto-${index}.jpg`, "image/jpeg");
}
check("gallery fills to 30", (await readProperty(propertyId))?.imageCount === 30);
result = await upload(ownerSession, propertyId, jpeg, "extra.jpg", "image/jpeg");
check("31st image returns 409", result.status === 409 && (await readProperty(propertyId))?.imageCount === 30);

console.log("Pages");
let response = await page(ownerSession, `/admin/properties/${propertyId}?tab=images`);
check("images tab renders gallery", response.status === 200 && response.html.includes("Subir imágenes") && response.html.includes(`/images/${firstId}?variant=thumbnail`));
response = await page(ownerSession, `/admin/properties/${propertyId}`);
check("overview shows cover thumbnail", response.html.includes(`/images/${thirdId}?variant=thumbnail`));
response = await page(ownerSession, "/admin/properties");
check("list shows cover thumbnail", response.html.includes(`/images/${thirdId}?variant=thumbnail`));

finish();
