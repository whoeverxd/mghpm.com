import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private file store on the server's disk. Files live outside `public/`, so
 * they are only reachable through API routes that check access first.
 * LOCAL_STORAGE_DIR overrides the default `./storage` folder.
 */
function getStorageRoot() {
  return path.resolve(process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "storage"));
}

/** Maps a storage path like `organizations/x/.../original.jpg` to a file inside the root. */
function resolveStoragePath(storagePath: string) {
  const root = getStorageRoot();
  const absolute = path.resolve(root, storagePath);
  if (!absolute.startsWith(root + path.sep)) {
    throw new Error("The storage path escapes the storage folder.");
  }
  return absolute;
}

export async function saveStoredFile(storagePath: string, data: Buffer) {
  const absolute = resolveStoragePath(storagePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, data);
}

export async function readStoredFile(storagePath: string) {
  return readFile(resolveStoragePath(storagePath));
}

/** Removes the file; a missing file is not an error. */
export async function deleteStoredFile(storagePath: string) {
  await rm(resolveStoragePath(storagePath), { force: true });
}
