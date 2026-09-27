/**
 * Server-only Edvisor helpers (curation + async catalog).
 * Do not import from Client Components.
 */

import "server-only";

import {
  loadExperienceCatalogSync,
  type ExperienceCatalog,
  type CatalogSource,
} from "@/lib/edvisor/catalog-sync";
import { getCurationState } from "@/lib/edvisor/curation";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import type { EdvisorProgram, EdvisorSchool } from "@marco-polo/experience-edvisor";

export async function loadExperienceCatalog(): Promise<ExperienceCatalog> {
  const curation = await getCurationState();
  const { catalog, source } = await resolveEdvisorCatalog();
  const mapped = loadExperienceCatalogSync(curation, catalog);
  if (source === "edvisor-live") {
    return {
      ...mapped,
      source: mapped.source === "fallback" ? "fallback" : "edvisor",
      sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
      metaNote: catalog.meta.note,
    };
  }
  return mapped;
}

export async function fetchEdvisorCatalog(): Promise<{
  schools: EdvisorSchool[];
  programs: EdvisorProgram[];
  source: CatalogSource;
}> {
  const exp = await loadExperienceCatalog();
  const { catalog } = await resolveEdvisorCatalog();
  return {
    schools: exp.schools,
    programs: catalog.programs.filter((p) => p.complete),
    source: exp.source,
  };
}
