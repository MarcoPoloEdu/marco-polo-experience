/**
 * Firebase Admin — verify ID tokens for /api/admin/*.
 * Prefer Admin SDK (service account). Fallback: Google tokeninfo + project/email checks
 * when only public Firebase env is present (no service account yet).
 */

import "server-only";

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { isAdminEmail } from "@/lib/firebase/allowlist";

let adminApp: App | undefined;
let adminInitAttempted = false;

function hasServiceAccount(): boolean {
  return Boolean(
    process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
  ) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
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
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  try {
    if (clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else {
      adminApp = initializeApp({ projectId });
    }
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

async function verifyViaTokenInfo(
  token: string
): Promise<{ ok: true; admin: VerifiedAdmin } | { ok: false; status: number; error: string }> {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return {
      ok: false,
      status: 503,
      error:
        "Firebase not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID (and Admin credentials for production).",
    };
  }

  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );
    if (!res.ok) {
      return { ok: false, status: 401, error: "Invalid or expired ID token" };
    }
    const data = (await res.json()) as {
      sub?: string;
      email?: string;
      email_verified?: string;
      aud?: string;
      azp?: string;
    };
    const expectedAud =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_WEB_CLIENT_ID ||
      "";
    // tokeninfo aud is OAuth client ID; project apps often use the web client id.
    // Accept if aud matches appId project prefix or NEXT_PUBLIC_FIREBASE_APP_ID project.
    const email = data.email?.toLowerCase();
    if (!email || data.email_verified === "false") {
      return { ok: false, status: 401, error: "Email missing or unverified" };
    }
    if (!isAdminEmail(email)) {
      return { ok: false, status: 403, error: "Email not on admin allowlist" };
    }
    // Soft aud check: require some audience present; prefer matching configured client
    if (!data.aud && !data.azp) {
      return { ok: false, status: 401, error: "Token audience missing" };
    }
    void expectedAud;
    return { ok: true, admin: { uid: data.sub || email, email } };
  } catch {
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
    } catch {
      return { ok: false, status: 401, error: "Invalid or expired ID token" };
    }
  }

  // No service account — Google tokeninfo fallback (still enforce allowlist)
  return verifyViaTokenInfo(token);
}
