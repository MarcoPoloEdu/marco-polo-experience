import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/firebase/admin";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { setCurationState } from "@/lib/edvisor/curation";
import { buildInitialCuration } from "@/lib/edvisor/initial-curation";
import { isEdvisorApiConfigured } from "@/lib/edvisor/api";

export const runtime = "nodejs";

/**
 * Apply Felipe’s initial campus enable set (ILSC CA ×3 + Gateway St. Julians).
 * Replaces curation with only those matches — everything else off.
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminRequest(request.headers.get("authorization"));
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { catalog, source } = await resolveEdvisorCatalog();
    const applied = buildInitialCuration(catalog, auth.admin.email);
    const curation = await setCurationState(applied.curation, auth.admin.email);

    return NextResponse.json({
      ok: true,
      source,
      sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
      edvisorApiConfigured: isEdvisorApiConfigured(),
      matched: applied.matched,
      unmatchedTargets: applied.unmatchedTargets,
      programsEnabled: applied.programsEnabled,
      schoolsEnabled: applied.matched.filter((m) => m.enabled).length,
      curation,
    });
  } catch (err) {
    console.error("[api/admin/curation/apply-initial] failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "No se pudo aplicar curación inicial",
      },
      { status: 500 }
    );
  }
}
