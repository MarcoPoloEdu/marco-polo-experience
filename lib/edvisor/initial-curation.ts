/**
 * Felipe’s initial Experience curation set.
 * Prefer known Edvisor campus IDs (Asesoría SoT). Enable only these adults;
 * exclude Junior by id and name. Never enable ILAC.
 */

import type { EdvisorCatalog, EdvisorSchool } from "@marco-polo/experience-edvisor";
import type { CurationState } from "@/lib/edvisor/curation";
import { FORCE_DISABLED_SCHOOL_NAME_PATTERNS } from "@/lib/edvisor/curation";

export type InitialCampusTarget = {
  /** School / brand name needles (case-insensitive). */
  schoolNeedles: RegExp[];
  /** City / campus needles — any match counts. */
  cityNeedles: RegExp[];
  label: string;
  /** Optional known Edvisor campus id (Asesoría AGENTS.md). */
  knownSchoolId?: number;
};

/** Junior campuses — never enable for Experience Phase A adults. */
export const EXCLUDED_JUNIOR_SCHOOL_IDS = new Set([3167, 3171, 23941, 4839]);

/** Curated adult campuses: ILSC YVR/YYZ/YUL + Gateway GSE San Gwann. */
export const INITIAL_CAMPUS_TARGETS: InitialCampusTarget[] = [
  {
    label: "ILSC Vancouver",
    schoolNeedles: [/\bilsc\b/i],
    cityNeedles: [/vancouver/i],
    knownSchoolId: 54,
  },
  {
    label: "ILSC Toronto",
    schoolNeedles: [/\bilsc\b/i],
    cityNeedles: [/toronto/i],
    knownSchoolId: 114,
  },
  {
    label: "ILSC Montreal",
    schoolNeedles: [/\bilsc\b/i],
    cityNeedles: [/montr[eé]al/i],
    knownSchoolId: 115,
  },
  {
    label: "Gateway School of English GSE — San Gwann",
    schoolNeedles: [
      /gateway\s+school\s+of\s+english/i,
      /\bgateway\b/i,
      /\bgse\b/i,
    ],
    cityNeedles: [
      /san\s*gwann/i,
      /\bgse\b/i,
      /st\.?\s*julian/i,
      /saint\s*julian/i,
      /san\s*julian/i,
      /malta/i,
    ],
    knownSchoolId: 3846,
  },
];

/** Seed campus ids we already know — used to skip full catalog dumps. */
export const KNOWN_INITIAL_SCHOOL_IDS: number[] = INITIAL_CAMPUS_TARGETS.map(
  (t) => t.knownSchoolId
).filter((id): id is number => typeof id === "number" && id > 0);

export function isJuniorSchoolId(id: string | number | null | undefined): boolean {
  const n = typeof id === "number" ? id : Number(id);
  return Number.isFinite(n) && EXCLUDED_JUNIOR_SCHOOL_IDS.has(n);
}

export function isJuniorCampusName(name: string): boolean {
  return /\bjunior\b/i.test(name);
}

function schoolBlob(school: EdvisorSchool, catalog: EdvisorCatalog): string {
  const dest = catalog.destinations.find((d) => d.id === school.destinationId);
  return [school.name, school.id, school.edvisorProviderId, dest?.city, dest?.country, dest?.id]
    .filter(Boolean)
    .join(" ");
}

export function isForceDisabledSchool(name: string): boolean {
  return FORCE_DISABLED_SCHOOL_NAME_PATTERNS.some((re) => re.test(name));
}

function isExcludedJunior(
  name: string,
  edvisorProviderId?: string | number | null
): boolean {
  if (isJuniorSchoolId(edvisorProviderId)) return true;
  if (isJuniorCampusName(name)) return true;
  return false;
}

/** Match a live campus name/city blob to an initial target (pre-catalog). */
export function matchInitialCampusBlob(blob: string): InitialCampusTarget | null {
  if (isForceDisabledSchool(blob)) return null;
  if (isJuniorCampusName(blob)) return null;
  for (const target of INITIAL_CAMPUS_TARGETS) {
    const schoolOk = target.schoolNeedles.some((re) => re.test(blob));
    const cityOk = target.cityNeedles.some((re) => re.test(blob));
    if (schoolOk && cityOk) return target;
  }
  return null;
}

export function matchInitialCampus(
  school: EdvisorSchool,
  catalog: EdvisorCatalog
): InitialCampusTarget | null {
  if (isForceDisabledSchool(school.name)) return null;
  if (isExcludedJunior(school.name, school.edvisorProviderId)) return null;
  const byId = INITIAL_CAMPUS_TARGETS.find(
    (t) =>
      t.knownSchoolId != null &&
      String(t.knownSchoolId) === String(school.edvisorProviderId)
  );
  if (byId) return byId;
  return matchInitialCampusBlob(schoolBlob(school, catalog));
}

export type InitialCurationApplyResult = {
  matched: Array<{
    schoolId: string;
    schoolName: string;
    label: string;
    edvisorProviderId: string;
    complete: boolean;
    enabled: boolean;
  }>;
  unmatchedTargets: string[];
  programsEnabled: number;
  curation: CurationState;
};

/**
 * Build curation that enables ONLY matched initial campuses (complete schools)
 * and ALL programs under those schools (complete not required — demo/browse).
 * All other keys omitted (= off).
 */
export function buildInitialCuration(
  catalog: EdvisorCatalog,
  actorEmail: string
): InitialCurationApplyResult {
  const schools: Record<string, boolean> = {};
  const programs: Record<string, boolean> = {};
  const matched: InitialCurationApplyResult["matched"] = [];
  const hitLabels = new Set<string>();

  for (const school of catalog.schools) {
    const target = matchInitialCampus(school, catalog);
    if (!target) continue;
    hitLabels.add(target.label);
    const enable = school.complete === true;
    if (enable) schools[school.id] = true;
    matched.push({
      schoolId: school.id,
      schoolName: school.name,
      label: target.label,
      edvisorProviderId: school.edvisorProviderId,
      complete: school.complete,
      enabled: enable,
    });
  }

  let programsEnabled = 0;
  for (const program of catalog.programs) {
    // Enable priced programs under enabled schools — do not require program.complete
    if (schools[program.schoolId] !== true) continue;
    if (!(program.weeklyPriceUsd > 0)) continue;
    programs[program.id] = true;
    programsEnabled += 1;
  }

  const unmatchedTargets = INITIAL_CAMPUS_TARGETS.map((t) => t.label).filter(
    (l) => !hitLabels.has(l)
  );

  return {
    matched,
    unmatchedTargets,
    programsEnabled,
    curation: {
      schools,
      programs,
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail,
    },
  };
}
