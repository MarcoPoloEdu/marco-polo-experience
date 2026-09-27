/**
 * Firebase Admin — verify ID tokens for /api/admin/*.
 * Prefer Admin SDK (service account) when available; otherwise Identity Toolkit
 * accounts:lookup (API key). firebase-admin is lazy-imported so Vercel serverless
 * does not crash the module graph when the package fails to bundle/load.
 */

import "server-only";

import { isAdminEmail } from "@/lib/firebase/allowlist";

export type VerifiedAdmin = {
  uid: string;
  email: string;
};

type AdminApp = import("firebase-admin/app").App;
type Auth = import("firebase-admin/auth").Auth;
type Firestore = import("firebase-admin/firestore").Firestore;

let adminApp: AdminApp | undefined;
let adminInitAttempted = false;

function hasServiceAccount(): boolean {
  return (
    Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

async function initAdmin(): Promise<AdminApp | null> {
  if (adminApp) return adminApp;
  if (adminInitAttempted) return adminApp ?? null;
  adminInitAttempted = true;

  if (!hasServiceAccount()) return null;

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  try {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    if (getApps().length) {
      adminApp = getApps()[0]!;
      return adminApp;
    }
    const privateKey = normalizePrivateKey(privateKeyRaw);
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    return adminApp;
  } catch (err) {
    console.warn("[firebase-admin] init failed", err);
    return null;
  }
}

export async function getAdminApp(): Promise<AdminApp | null> {
  return initAdmin();
}

export async function getAdminAuth(): Promise<Auth | null> {
  const app = await getAdminApp();
  if (!app) return null;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    return getAuth(app);
  } catch (err) {
    console.warn("[firebase-admin] getAuth failed", err);
    return null;
  }
}

export async function getAdminDb(): Promise<Firestore | null> {
  const app = await getAdminApp();
  if (!app) return null;
  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    return getFirestore(app);
  } catch (err) {
    console.warn("[firebase-admin] getFirestore failed", err);
    return null;
  }
}

/**
 * Verify Firebase ID token via Identity Toolkit (works with client SDK tokens).
 * Uses NEXT_PUBLIC_FIREBASE_API_KEY — no service account required.
 */
async function verifyViaIdentityToolkit(
  token: string
): Promise<{ ok: true; admin: VerifiedAdmin } | { ok: false; status: number; error: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "NEXT_PUBLIC_FIREBASE_API_KEY missing for token verification fallback",
    };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    const data = (await res.json()) as {
      error?: { message?: string };
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };

    if (!res.ok || data.error) {
      return {
        ok: false,
        status: 401,
        error: data.error?.message || "Invalid or expired ID token",
      };
    }

    const user = data.users?.[0];
    if (!user) {
      return { ok: false, status: 401, error: "Invalid or expired ID token" };
    }
    const email = user.email?.toLowerCase();
    if (!email) {
      return { ok: false, status: 401, error: "Email missing on token" };
    }
    if (user.emailVerified === false) {
      return { ok: false, status: 401, error: "Email not verified" };
    }
    if (!isAdminEmail(email)) {
      return { ok: false, status: 403, error: "Email not on admin allowlist" };
    }
    return { ok: true, admin: { uid: user.localId || email, email } };
  } catch (err) {
    console.warn("[firebase-admin] Identity Toolkit lookup failed", err);
    return { ok: false, status: 401, error: "Token verification failed" };
  }
}

/**
 * Verify Bearer ID token and enforce admin email allowlist.
 */
export async function verifyAdminRequest(
  authorizationHeader: string | null
): Promise<{ ok: true; admin: VerifiedAdmin } | { ok: false; status: number; error: string }> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Bearer token" };
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Empty token" };
  }

  // Prefer Identity Toolkit first on serverless — no native SA bundle required.
  // Fall back to Admin SDK when available.
  const toolkit = await verifyViaIdentityToolkit(token);
  if (toolkit.ok) return toolkit;

  const auth = await getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(token);
      const email = decoded.email?.toLowerCase();
      if (!isAdminEmail(email)) {
        return { ok: false, status: 403, error: "Email not on admin allowlist" };
      }
      return { ok: true, admin: { uid: decoded.uid, email: email! } };
    } catch (err) {
      console.warn(
        "[firebase-admin] verifyIdToken failed",
        err instanceof Error ? err.message : err
      );
    }
  }

  return toolkit;
}
