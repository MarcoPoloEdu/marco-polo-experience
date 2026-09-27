/**
 * Experience curation — enable/disable complete Edvisor schools & programs.
 * Firestore is the production store. Local JSON only with ALLOW_LOCAL_PERSISTENCE=1
 * outside production. Defaults: products are DISABLED until explicitly enabled.
 */

import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { allowLocalPersistence, firestoreConfigured } from "@/lib/persistence";

export interface CurationState {
  schools: Record<string, boolean>;
  programs: Record<string, boolean>;
  updatedAt?: string;
  updatedBy?: string;
}

const EMPTY: CurationState = { schools: {}, programs: {} };

/** Commercial decision: ILAC stays disabled (do not confuse with ILSC). */
export const FORCE_DISABLED_SCHOOL_NAME_PATTERNS = [/\bilac\b/i];

function localCurationPath() {
  return path.join(process.cwd(), "data", "curation.json");
}

async function readLocalCuration(): Promise<CurationState> {
  if (!allowLocalPersistence()) return { ...EMPTY };
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
  if (!allowLocalPersistence()) {
    throw new Error(
      "Local curation persistence disabled. Configure Firebase Admin or set ALLOW_LOCAL_PERSISTENCE=1 (non-production only)."
    );
  }
  const dir = path.dirname(localCurationPath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(localCurationPath(), JSON.stringify(state, null, 2), "utf8");
}

export async function getCurationState(): Promise<CurationState> {
  if (firestoreConfigured()) {
    try {
      const { getAdminDb } = await import("@/lib/firebase/admin");
      const db = await getAdminDb();
      if (db) {
        const snap = await db.collection("curation").doc("experience").get();
        if (snap.exists) {
          const data = snap.data() as CurationState;
          return {
            schools: data.schools ?? {},
            programs: data.programs ?? {},
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
          };
        }
        // Empty Firestore doc → defaults (all disabled), do not fall back to vendible JSON
        return { ...EMPTY };
      }
    } catch (err) {
      console.warn("[curation] Firestore read failed", err);
      if (!allowLocalPersistence()) {
        return { ...EMPTY };
      }
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
      const db = await getAdminDb();
      if (db) {
        await db.collection("curation").doc("experience").set(state, { merge: true });
        return state;
      }
    } catch (err) {
      console.warn("[curation] Firestore write failed", err);
      if (!allowLocalPersistence()) {
        throw new Error(
          "No se pudo persistir curación en Firestore y la escritura local está deshabilitada."
        );
      }
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
  schoolName?: string;
}): Promise<CurationState> {
  if (
    input.enabled &&
    input.kind === "school" &&
    input.schoolName &&
    FORCE_DISABLED_SCHOOL_NAME_PATTERNS.some((re) => re.test(input.schoolName!))
  ) {
    throw new Error(
      "ILAC permanece deshabilitada por decisión comercial; no se puede activar."
    );
  }

  const current = await getCurationState();
  if (input.kind === "school") {
    current.schools[input.id] = input.enabled;
  } else {
    current.programs[input.id] = input.enabled;
  }
  return setCurationState(current, input.actorEmail);
}

/** Effective enablement — missing key means DISABLED (not enabled). */
export function isSchoolEnabled(
  curation: CurationState,
  schoolId: string
): boolean {
  return curation.schools[schoolId] === true;
}

export function isProgramEnabled(
  curation: CurationState,
  programId: string
): boolean {
  return curation.programs[programId] === true;
}
