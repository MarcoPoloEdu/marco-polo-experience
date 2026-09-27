/**
 * Resolve Edvisor catalog: prefer live sync snapshot, else vendored portable seed.
 * Server-only.
 */

import "server-only";

import { loadEdvisorCatalog as loadVendorCatalog } from "@marco-polo/experience-edvisor";
import type { EdvisorCatalog } from "@marco-polo/experience-edvisor";
import { readLiveEdvisorCatalog } from "@/lib/edvisor/live-sync";

export async function resolveEdvisorCatalog(): Promise<{
  catalog: EdvisorCatalog;
  source: "edvisor-live" | "edvisor-vendor";
}> {
  const live = await readLiveEdvisorCatalog();
  if (live?.schools?.length) {
    return { catalog: live, source: "edvisor-live" };
  }
  return { catalog: loadVendorCatalog(), source: "edvisor-vendor" };
}
