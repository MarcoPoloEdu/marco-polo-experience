import catalogJson from "../data/catalog.json";
import type {
  EdvisorCatalog,
  EdvisorDestination,
  EdvisorProgram,
  EdvisorSchool,
} from "./types";

export type * from "./types";

/** Load the portable Edvisor snapshot shipped with this package. */
export function loadEdvisorCatalog(): EdvisorCatalog {
  return catalogJson as EdvisorCatalog;
}

export function listCompleteSchools(catalog: EdvisorCatalog = loadEdvisorCatalog()): EdvisorSchool[] {
  return catalog.schools.filter((s) => s.complete);
}

export function listCompletePrograms(
  catalog: EdvisorCatalog = loadEdvisorCatalog()
): EdvisorProgram[] {
  return catalog.programs.filter((p) => p.complete);
}

export function getEdvisorSchool(
  id: string,
  catalog: EdvisorCatalog = loadEdvisorCatalog()
): EdvisorSchool | undefined {
  return catalog.schools.find((s) => s.id === id);
}

export function getEdvisorProgram(
  id: string,
  catalog: EdvisorCatalog = loadEdvisorCatalog()
): EdvisorProgram | undefined {
  return catalog.programs.find((p) => p.id === id);
}

export function getEdvisorDestination(
  id: string,
  catalog: EdvisorCatalog = loadEdvisorCatalog()
): EdvisorDestination | undefined {
  return catalog.destinations.find((d) => d.id === id);
}

export function catalogSourceLabel(catalog: EdvisorCatalog = loadEdvisorCatalog()): string {
  return `${catalog.meta.source}@${catalog.meta.version}`;
}
