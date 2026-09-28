/**
 * Experience curation — enable/disable complete Edvisor schools, programs & destinations.
 * Firestore is the production store. Local JSON only with ALLOW_LOCAL_PERSISTENCE=1
 * outside production. Defaults: products are DISABLED until explicitly enabled.
 *
 * Phase A: max 3 enabled schools per country (Asesoría-like inventory gate).
 */

import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { allowLocalPersistence, firestoreConfigured } from "@/lib/persistence";

export interface CurationState {
  schools: Record<string, boolean>;
  programs: Record<string, boolean>;
  /** Explicit destination enable; missing keys fall back to “has enabled school”. */
  destinations?: Record<string, boolean>;
  updatedAt?: string;
  updatedBy?: string;
}

export const MAX_ENABLED_SCHOOLS_PER_COUNTRY = 3;

export class CurationLimitError extends Error {
  readonly code = "MAX_SCHOOLS_PER_COUNTRY" as const;
  readonly country: string;
  readonly limit: number;

  constructor(country: string, limit = MAX_ENABLED_SCHOOLS_PER_COUNTRY) {
    super(
      `Máximo ${limit} escuelas activas por país (fase inicial). Ya hay ${limit} en ${country}. Desactiva otra antes de activar esta.`
    );
    this.name = "CurationLimitError";
    this.country = country;
    this.limit = limit;
  }
}

const EMPTY: CurationState = { schools: {}, programs: {}, destinations: {} };

/** Commercial decision: ILAC stays disabled (do not confuse with ILSC). */
export const FORCE_DISABLED_SCHOOL_NAME_PATTERNS = [/\bilac\b/i];

function localCurationPath() {
  return path.join(process.cwd(), "data", "curation.json");
}

function normalizeState(parsed: CurationState): CurationState {
  return {
    schools: parsed.schools ?? {},
    programs: parsed.programs ?? {},
    destinations: parsed.destinations ?? {},
    updatedAt: parsed.updatedAt,
    updatedBy: parsed.updatedBy,
  };
}

async function readLocalCuration(): Promise<CurationState> {
  if (!allowLocalPersistence()) return { ...EMPTY, destinations: {} };
  try {
    const raw = await fs.readFile(localCurationPath(), "utf8");
    const parsed = JSON.parse(raw) as CurationState;
    return normalizeState(parsed);
  } catch {
    return { ...EMPTY, destinations: {} };
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
          return normalizeState(snap.data() as CurationState);
        }
        // Empty Firestore doc → defaults (all disabled), do not fall back to vendible JSON
        return { ...EMPTY, destinations: {} };
      }
    } catch (err) {
      console.warn("[curation] Firestore read failed", err);
      if (!allowLocalPersistence()) {
        return { ...EMPTY, destinations: {} };
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
    destinations: next.destinations ?? {},
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

export type SchoolCountryLookup = {
  schoolId: string;
  destinationId: string;
  countryKey: string;
  countryLabel: string;
  schoolName?: string;
};

export type ProgramSchoolLookup = {
  programId: string;
  schoolId: string;
};

/**
 * Count enabled schools that share a country key (countryCode preferred, else country name).
 */
export function countEnabledSchoolsInCountry(
  curation: CurationState,
  countryKey: string,
  schoolCountries: SchoolCountryLookup[],
  exceptSchoolId?: string
): number {
  const key = countryKey.trim().toLowerCase();
  if (!key) return 0;
  let n = 0;
  for (const row of schoolCountries) {
    if (exceptSchoolId && row.schoolId === exceptSchoolId) continue;
    if (curation.schools[row.schoolId] !== true) continue;
    if (row.countryKey.trim().toLowerCase() !== key) continue;
    n += 1;
  }
  return n;
}

/**
 * Assert enabling this school would not exceed the per-country cap.
 * Throws CurationLimitError when the limit would be exceeded.
 */
export function assertCanEnableSchoolInCountry(
  curation: CurationState,
  school: SchoolCountryLookup,
  schoolCountries: SchoolCountryLookup[]
): void {
  if (curation.schools[school.schoolId] === true) return; // already on
  const enabled = countEnabledSchoolsInCountry(
    curation,
    school.countryKey,
    schoolCountries,
    school.schoolId
  );
  if (enabled >= MAX_ENABLED_SCHOOLS_PER_COUNTRY) {
    throw new CurationLimitError(
      school.countryLabel || school.countryKey,
      MAX_ENABLED_SCHOOLS_PER_COUNTRY
    );
  }
}

export async function patchCurationToggle(input: {
  kind: "school" | "program" | "destination";
  id: string;
  enabled: boolean;
  actorEmail: string;
  schoolName?: string;
  /** Required when enabling a school — used for max-3/country. */
  schoolCountries?: SchoolCountryLookup[];
  /** When enabling a school, also enable these program ids (surface inventory). */
  programIdsForSchool?: string[];
  /** Destination id for the school (auto-enable destination on school enable). */
  destinationId?: string;
  /** When disabling a destination, cascade-disable these school ids. */
  schoolIdsInDestination?: string[];
  /** Programs under schools being cascade-disabled. */
  programIdsToDisable?: string[];
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
  if (!current.destinations) current.destinations = {};

  if (input.kind === "school") {
    if (input.enabled) {
      const lookup = (input.schoolCountries ?? []).find((s) => s.schoolId === input.id);
      if (lookup && input.schoolCountries) {
        assertCanEnableSchoolInCountry(current, lookup, input.schoolCountries);
      }
      current.schools[input.id] = true;
      if (input.destinationId) {
        current.destinations[input.destinationId] = true;
      }
      // Surface programs under this school (exact-quote remains charge SoT).
      for (const pid of input.programIdsForSchool ?? []) {
        current.programs[pid] = true;
      }
    } else {
      current.schools[input.id] = false;
      for (const pid of input.programIdsForSchool ?? []) {
        current.programs[pid] = false;
      }
    }
  } else if (input.kind === "program") {
    current.programs[input.id] = input.enabled;
  } else {
    // destination
    current.destinations[input.id] = input.enabled;
    if (!input.enabled) {
      for (const sid of input.schoolIdsInDestination ?? []) {
        current.schools[sid] = false;
      }
      for (const pid of input.programIdsToDisable ?? []) {
        current.programs[pid] = false;
      }
    }
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

/**
 * Destination visible in public cotizador when explicitly enabled, or — for
 * legacy curation without destination keys — when it has an enabled school.
 */
export function isDestinationEnabled(
  curation: CurationState,
  destinationId: string,
  hasEnabledSchool: boolean
): boolean {
  const map = curation.destinations ?? {};
  if (Object.prototype.hasOwnProperty.call(map, destinationId)) {
    return map[destinationId] === true;
  }
  // Backward compat: pre-destination-curation docs → derive from schools
  return hasEnabledSchool;
}
