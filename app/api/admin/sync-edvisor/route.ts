import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/firebase/admin";
import { syncEdvisorLanguageSchools } from "@/lib/edvisor/live-sync";
import { getCurationState } from "@/lib/edvisor/curation";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { isEdvisorApiConfigured } from "@/lib/edvisor/api";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Phase A: pull scoped short-course campuses (ILSC CA + Gateway) into live catalog. */
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminRequest(request.headers.get("authorization"));
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await syncEdvisorLanguageSchools();
    const curation = await getCurationState();
    const { catalog, source } = await resolveEdvisorCatalog();

    return NextResponse.json(
      {
        sync: result,
        edvisorApiConfigured: isEdvisorApiConfigured(),
        source,
        sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
        schools: catalog.schools.length,
        programs: catalog.programs.length,
        destinations: catalog.destinations.length,
        services: (catalog.services ?? []).length,
        curationUpdatedAt: curation.updatedAt,
      },
      { status: result.ok ? 200 : result.configured ? 502 : 503 }
    );
  } catch (err) {
    console.error("[api/admin/sync-edvisor] POST failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Sync Edvisor falló en el servidor",
      },
      { status: 500 }
    );
  }
}
