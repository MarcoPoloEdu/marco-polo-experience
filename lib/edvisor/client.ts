/**
 * Edvisor bridge stub — wire to portable export / API later.
 * Experience admin should only enable/disable complete Edvisor products.
 */

export interface EdvisorSchool {
  id: string;
  name: string;
  enabled: boolean;
}

export interface EdvisorProgram {
  id: string;
  schoolId: string;
  title: string;
  weeklyPriceUsd: number;
  enabled: boolean;
  complete: boolean;
}

export function isEdvisorConfigured(): boolean {
  return Boolean(process.env.EDVISOR_API_KEY && process.env.EDVISOR_API_URL);
}

/** Placeholder — returns empty; UI uses mock-catalog until export is wired. */
export async function fetchEdvisorCatalog(): Promise<{
  schools: EdvisorSchool[];
  programs: EdvisorProgram[];
  source: "edvisor" | "mock";
}> {
  if (!isEdvisorConfigured()) {
    return { schools: [], programs: [], source: "mock" };
  }
  // TODO: pull from exports/marco-polo-experience-edvisor or live API
  return { schools: [], programs: [], source: "edvisor" };
}
