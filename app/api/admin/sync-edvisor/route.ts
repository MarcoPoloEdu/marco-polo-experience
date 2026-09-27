import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/firebase/admin";
import { syncEdvisorLanguageSchools } from "@/lib/edvisor/live-sync";
import { getCurationState } from "@/lib/edvisor/curation";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { isEdvisorApiConfigured } from "@/lib/edvisor/api";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Pull all connected language schools from Edvisor GraphQL into live catalog. */
export async function POST(request: Request) {
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
      curationUpdatedAt: curation.updatedAt,
    },
    { status: result.ok ? 200 : result.configured ? 502 : 503 }
  );
}
