"use client";

import {
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { z } from "zod";

const publicConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  appId: z.string().min(1),
});

let client: { app: FirebaseApp; auth: Auth; db: Firestore } | undefined;
let emulatorsConnected = false;

export function getFirebaseClient() {
  if (client) return client;

  const config = publicConfigSchema.safeParse({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  if (!config.success) {
    const configKeys: Record<string, string> = {
      apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
      authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
    };
    throw new Error(
      `Firebase client configuration is incomplete: ${config.error.issues
        .map((issue) => configKeys[String(issue.path[0])] ?? String(issue.path[0]))
        .join(", ")}`,
    );
  }

  const app = getApps().find((existingApp) => existingApp.name === "[DEFAULT]") ??
    initializeApp(config.data);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (!emulatorsConnected && process.env.NODE_ENV !== "production") {
    const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    const firestoreHost = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST;

    if (authHost) connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });

    if (firestoreHost) {
      const [host, port] = firestoreHost.split(":");
      if (!host || !port || !/^\d+$/.test(port)) {
        throw new Error("NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST must use host:port.");
      }
      connectFirestoreEmulator(db, host, Number(port));
    }

    emulatorsConnected = true;
  }

  client = { app, auth, db };
  return client;
}
