import "server-only";

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { z } from "zod";

const serverConfigSchema = z.object({
  projectId: z.string().min(1),
});

function getFirebaseAdminApp() {
  const { projectId } = serverConfigSchema.parse({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  const existingApp = getApps().find((app) => app.name === "mghpm-admin");
  const app =
    existingApp ??
    initializeApp(
      {
        credential: applicationDefault(),
        projectId,
      },
      "mghpm-admin",
    );
  return app;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

/** Private bucket for uploaded files; set FIREBASE_STORAGE_BUCKET to the bucket shown in Firebase Console → Storage. */
export function getFirebaseAdminBucket() {
  const bucketName = z
    .string({ error: "FIREBASE_STORAGE_BUCKET is not configured." })
    .min(1, "FIREBASE_STORAGE_BUCKET is not configured.")
    .parse(process.env.FIREBASE_STORAGE_BUCKET);
  return getStorage(getFirebaseAdminApp()).bucket(bucketName);
}
