/**
 * Resolve Edvisor catalog: prefer live sync snapshot, else vendored portable seed.
 * Server-only.
 */

import "server-only";

import { loadEdvisorCatalog as loadVendorCatalog } from "@marco-polo/experience-edvisor";
import type { EdvisorCatalog } from "@marco-polo/experience-edvisor";
import { readLiveEdvisorCatalog } from "@/lib/edvisor/live-sync";

function withServices(catalog: EdvisorCatalog): EdvisorCatalog {
  return { ...catalog, services: catalog.services ?? [] };
}

export async function resolveEdvisorCatalog(): Promise<{
  catalog: EdvisorCatalog;
  source: "edvisor-live" | "edvisor-vendor";
}> {
  const live = await readLiveEdvisorCatalog();
  if (live?.schools?.length) {
    return { catalog: withServices(live), source: "edvisor-live" };
  }
  return { catalog: withServices(loadVendorCatalog()), source: "edvisor-vendor" };
}
