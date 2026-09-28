import { NextResponse } from "next/server";
import { loadExperienceCatalog } from "@/lib/edvisor/client";

export const runtime = "nodejs";

/** Public curated catalog for cotizador refresh (Edvisor prices + enable flags). */
export async function GET() {
  const catalog = await loadExperienceCatalog();
  const schools = catalog.schools.filter((s) => s.enabled);
  const programs = catalog.programs.filter((p) => p.enabled);
  const enabledSchoolDestIds = new Set(schools.map((s) => s.destinationId));
  // Only destinations that have at least one enabled school (cotizador browse).
  const destinations = catalog.destinations.filter(
    (d) => enabledSchoolDestIds.has(d.id) || programs.some((p) => p.destinationId === d.id)
  );
  return NextResponse.json({
    source: catalog.source,
    sourceLabel: catalog.sourceLabel,
    metaNote: catalog.metaNote,
    destinations,
    programs,
    schools,
  });
}
