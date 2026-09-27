/**
 * Persistence policy: Firestore for operational data.
 * Local JSON only when ALLOW_LOCAL_PERSISTENCE=1 and NODE_ENV !== production.
 */

import "server-only";

export function allowLocalPersistence(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.ALLOW_LOCAL_PERSISTENCE === "1";
}

export function firestoreConfigured(): boolean {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      (process.env.FIREBASE_CLIENT_EMAIL ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}
