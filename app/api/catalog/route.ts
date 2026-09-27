import { NextResponse } from "next/server";
import { loadExperienceCatalog } from "@/lib/edvisor/client";

export const runtime = "nodejs";

/** Public curated catalog for cotizador refresh (Edvisor prices + enable flags). */
export async function GET() {
  const catalog = await loadExperienceCatalog();
  return NextResponse.json({
    source: catalog.source,
    sourceLabel: catalog.sourceLabel,
    metaNote: catalog.metaNote,
    destinations: catalog.destinations,
    programs: catalog.programs.filter((p) => p.enabled),
    schools: catalog.schools,
  });
}
