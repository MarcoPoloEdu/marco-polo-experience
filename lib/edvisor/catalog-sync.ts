/**
 * Client-safe Edvisor catalog load (no Node fs / firebase-admin).
 */

import {
  getEdvisorSchool,
  loadEdvisorCatalog,
  type EdvisorCatalog,
  type EdvisorDestination,
  type EdvisorProgram,
  type EdvisorSchool,
} from "@marco-polo/experience-edvisor";
import type { Destination, Program, ProgramKind } from "@/lib/data/types";

export type CatalogSource = "edvisor" | "fallback";

export interface ExperienceCatalog {
  destinations: Destination[];
  programs: Program[];
  schools: EdvisorSchool[];
  source: CatalogSource;
  sourceLabel: string;
  metaNote?: string;
}

function mapDestination(d: EdvisorDestination): Destination {
  const languageCodes: Destination["languageCodes"] = [];
  for (const c of d.languageCodes) {
    if (
      c === "english" ||
      c === "german" ||
      c === "french" ||
      c === "italian"
    ) {
      languageCodes.push(c);
    }
    // spanish dropped from V2 study languages; portuguese added when present in future exports
  }

  return {
    id: d.id,
    country: d.country,
    city: d.city,
    languageCodes,
    imageUrl: d.imageUrl,
    heroUrl: d.heroUrl,
    tagline: d.tagline,
    blurb: d.blurb,
    vibe: d.vibe,
    visaFriction: d.visaFriction,
    fromWeeklyUsd: d.fromWeeklyUsd,
  };
}

function mapProgram(
  p: EdvisorProgram,
  school: EdvisorSchool | undefined,
  enabled: boolean
): Program {
  return {
    id: p.id,
    destinationId: p.destinationId,
    schoolName: school?.name ?? "Escuela Edvisor",
    schoolEmail: school?.email ?? "schools@marcopoloeducation.com",
    kind: p.kind as ProgramKind,
    title: p.title,
    summary: p.summary,
    lessonsPerWeek: p.lessonsPerWeek,
    weeklyUsd: p.weeklyPriceUsd,
    highlights: p.highlights,
    imageUrl: p.imageUrl,
    enabled,
  };
}

/** Sync load of Edvisor catalog (vendor JSON or injected live snapshot). */
export function loadExperienceCatalogSync(
  curation?: { schools: Record<string, boolean>; programs: Record<string, boolean> },
  catalogOverride?: EdvisorCatalog
): ExperienceCatalog {
  try {
    const catalog = catalogOverride ?? loadEdvisorCatalog();
    const cur = curation ?? { schools: {}, programs: {} };

    const schools = catalog.schools.filter((s) => s.complete);
    const destinations = catalog.destinations.map(mapDestination);

    const programs = catalog.programs
      .filter((p) => p.complete)
      .filter((p) => {
        const school = getEdvisorSchool(p.schoolId, catalog);
        if (!school?.complete) return false;
        // V2: missing curation key = DISABLED (never ?? true)
        const schoolEnabled = cur.schools[school.id] === true;
        return schoolEnabled;
      })
      .map((p) => {
        const school = getEdvisorSchool(p.schoolId, catalog);
        const enabled = cur.programs[p.id] === true;
        return mapProgram(p, school, enabled);
      });

    for (const dest of destinations) {
      const weeks = programs
        .filter((p) => p.enabled && p.destinationId === dest.id)
        .map((p) => p.weeklyUsd);
      if (weeks.length) dest.fromWeeklyUsd = Math.min(...weeks);
    }

    return {
      destinations,
      programs,
      schools,
      source: "edvisor",
      sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
      metaNote: catalog.meta.note,
    };
  } catch (err) {
    console.error("[edvisor] Failed to load portable export — using labeled fallback", err);
    return {
      destinations: [],
      programs: [],
      schools: [],
      source: "fallback",
      sourceLabel: "fallback (Edvisor export unavailable)",
      metaNote:
        "Edvisor portable export failed to load. Cotizador has no live catalog until vendor package is restored.",
    };
  }
}

export function isEdvisorConfigured(): boolean {
  try {
    const c = loadEdvisorCatalog();
    return Boolean(c?.programs?.length);
  } catch {
    return false;
  }
}

export {
  getEdvisorSchool,
  loadEdvisorCatalog,
};
export type { EdvisorCatalog, EdvisorDestination, EdvisorProgram, EdvisorSchool };
