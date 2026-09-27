/**
 * Experience curation layer — enable/disable complete Edvisor schools & programs.
 * Prefer Firestore when Firebase Admin is configured; otherwise local JSON file.
 * Server-only.
 */

import "server-only";

import { promises as fs } from "fs";
import path from "path";

export interface CurationState {
  schools: Record<string, boolean>;
  programs: Record<string, boolean>;
  updatedAt?: string;
  updatedBy?: string;
}

const EMPTY: CurationState = { schools: {}, programs: {} };

function localCurationPath() {
  return path.join(process.cwd(), "data", "curation.json");
}

async function readLocalCuration(): Promise<CurationState> {
  try {
    const raw = await fs.readFile(localCurationPath(), "utf8");
    const parsed = JSON.parse(raw) as CurationState;
    return {
      schools: parsed.schools ?? {},
      programs: parsed.programs ?? {},
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeLocalCuration(state: CurationState): Promise<void> {
  const dir = path.dirname(localCurationPath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(localCurationPath(), JSON.stringify(state, null, 2), "utf8");
}

function firestoreConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      (process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

export async function getCurationState(): Promise<CurationState> {
  if (firestoreConfigured()) {
    try {
      const { getAdminDb } = await import("@/lib/firebase/admin");
      const db = getAdminDb();
      if (!db) return readLocalCuration();
      const snap = await db.collection("curation").doc("experience").get();
      if (!snap.exists) return readLocalCuration();
      const data = snap.data() as CurationState;
      return {
        schools: data.schools ?? {},
        programs: data.programs ?? {},
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
    } catch (err) {
      console.warn("[curation] Firestore read failed, using local file", err);
      return readLocalCuration();
    }
  }
  return readLocalCuration();
}

export async function setCurationState(
  next: CurationState,
  actorEmail: string
): Promise<CurationState> {
  const state: CurationState = {
    schools: next.schools ?? {},
    programs: next.programs ?? {},
    updatedAt: new Date().toISOString(),
    updatedBy: actorEmail,
  };

  if (firestoreConfigured()) {
    try {
      const { getAdminDb } = await import("@/lib/firebase/admin");
      const db = getAdminDb();
      if (db) {
        await db.collection("curation").doc("experience").set(state, { merge: true });
        return state;
      }
    } catch (err) {
      console.warn("[curation] Firestore write failed, writing local file", err);
    }
  }

  await writeLocalCuration(state);
  return state;
}

export async function patchCurationToggle(input: {
  kind: "school" | "program";
  id: string;
  enabled: boolean;
  actorEmail: string;
}): Promise<CurationState> {
  const current = await getCurationState();
  if (input.kind === "school") {
    current.schools[input.id] = input.enabled;
  } else {
    current.programs[input.id] = input.enabled;
  }
  return setCurationState(current, input.actorEmail);
}
