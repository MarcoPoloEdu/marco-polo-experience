/**
 * Firebase Admin — verify ID tokens for /api/admin/*.
 * Prefer Admin SDK (service account). On failure, fall back to Identity Toolkit
 * accounts:lookup (API key) so Google-signed Firebase ID tokens still work.
 */

import "server-only";

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { isAdminEmail } from "@/lib/firebase/allowlist";

let adminApp: App | undefined;
let adminInitAttempted = false;

function hasServiceAccount(): boolean {
  return (
    Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Strip wrapping quotes from .env parsers
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function initAdmin(): App | null {
  if (getApps().length) {
    adminApp = getApps()[0]!;
    return adminApp;
  }
  if (adminInitAttempted) return adminApp ?? null;
  adminInitAttempted = true;

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !hasServiceAccount()) return null;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) return null;

  try {
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

export function getAdminApp(): App | null {
  return adminApp ?? initAdmin();
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export type VerifiedAdmin = {
  uid: string;
  email: string;
};

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

  const auth = getAdminAuth();
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
        "[firebase-admin] verifyIdToken failed, falling back to Identity Toolkit",
        err instanceof Error ? err.message : err
      );
      // Fall through — SA may lack token-verify capability or key may be misparsed
    }
  }

  return verifyViaIdentityToolkit(token);
}
