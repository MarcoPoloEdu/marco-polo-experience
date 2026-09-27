/**
 * Server-only Edvisor helpers (curation + async catalog).
 * Do not import from Client Components.
 */

import "server-only";

import { loadExperienceCatalogSync, type ExperienceCatalog } from "@/lib/edvisor/catalog-sync";
import { getCurationState } from "@/lib/edvisor/curation";
import { loadEdvisorCatalog, type EdvisorProgram, type EdvisorSchool } from "@marco-polo/experience-edvisor";
import type { CatalogSource } from "@/lib/edvisor/catalog-sync";

export async function loadExperienceCatalog(): Promise<ExperienceCatalog> {
  const curation = await getCurationState();
  return loadExperienceCatalogSync(curation);
}

export async function fetchEdvisorCatalog(): Promise<{
  schools: EdvisorSchool[];
  programs: EdvisorProgram[];
  source: CatalogSource;
}> {
  const exp = await loadExperienceCatalog();
  const raw = loadEdvisorCatalog();
  return {
    schools: exp.schools,
    programs: raw.programs.filter((p) => p.complete),
    source: exp.source,
  };
}
