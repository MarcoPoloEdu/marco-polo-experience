import { NextResponse } from "next/server";
import { syncEdvisorLanguageSchools } from "@/lib/edvisor/live-sync";
import { isEdvisorApiConfigured } from "@/lib/edvisor/api";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { setCurationState } from "@/lib/edvisor/curation";
import { buildInitialCuration } from "@/lib/edvisor/initial-curation";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Server-side Edvisor inventory sync (no Firebase admin session).
 * Auth: Authorization: Bearer CRON_SECRET
 *
 * Optional: ?applyInitial=1 — enable only ILSC CA + Gateway St. Julians after sync.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado." },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const applyInitial = url.searchParams.get("applyInitial") === "1";

  try {
    const sync = await syncEdvisorLanguageSchools();
    const { catalog, source } = await resolveEdvisorCatalog();

    let initial: ReturnType<typeof buildInitialCuration> | null = null;
    if (sync.ok && applyInitial) {
      initial = buildInitialCuration(catalog, "cron:applyInitial");
      await setCurationState(initial.curation, "cron:applyInitial");
    }

    return NextResponse.json(
      {
        sync,
        edvisorApiConfigured: isEdvisorApiConfigured(),
        source,
        sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
        counts: {
          destinations: catalog.destinations.length,
          schools: catalog.schools.length,
          programs: catalog.programs.length,
          services: (catalog.services ?? []).length,
        },
        initialCuration: initial
          ? {
              schoolsEnabled: initial.matched.filter((m) => m.enabled).length,
              programsEnabled: initial.programsEnabled,
              matched: initial.matched,
              unmatchedTargets: initial.unmatchedTargets,
            }
          : null,
      },
      { status: sync.ok ? 200 : sync.configured ? 502 : 503 }
    );
  } catch (err) {
    console.error("[api/cron/sync-edvisor] failed", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Sync cron falló",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
