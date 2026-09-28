import { NextResponse } from "next/server";
import { getCurationState, patchCurationToggle } from "@/lib/edvisor/curation";
import { verifyAdminRequest } from "@/lib/firebase/admin";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { isEdvisorApiConfigured } from "@/lib/edvisor/api";

export const runtime = "nodejs";

async function buildPayload(
  curation: Awaited<ReturnType<typeof getCurationState>>
) {
  const { catalog, source } = await resolveEdvisorCatalog();
  const services = catalog.services ?? [];

  // Admin shows ALL schools + incomplete (inventory gaps). Defaults OFF (=== true).
  const schools = catalog.schools.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    destinationId: s.destinationId,
    complete: s.complete,
    edvisorProviderId: s.edvisorProviderId,
    enabled: curation.schools[s.id] === true,
  }));

  const schoolName = new Map(schools.map((s) => [s.id, s.name]));

  const programs = catalog.programs.map((p) => ({
    id: p.id,
    title: p.title,
    schoolId: p.schoolId,
    schoolName: schoolName.get(p.schoolId) ?? "",
    weeklyPriceUsd: p.weeklyPriceUsd,
    kind: p.kind,
    destinationId: p.destinationId,
    complete: p.complete,
    enabled: curation.programs[p.id] === true,
  }));

  const destinations = catalog.destinations.map((d) => ({
    id: d.id,
    country: d.country,
    city: d.city,
    countryCode: d.countryCode,
    languageCodes: d.languageCodes,
    fromWeeklyUsd: d.fromWeeklyUsd,
    schoolCount: schools.filter((s) => s.destinationId === d.id).length,
    programCount: programs.filter((p) => p.destinationId === d.id).length,
  }));

  const serviceRows = services.map((s) => ({
    id: s.id,
    title: s.title,
    kind: s.kind,
    schoolId: s.schoolId,
    schoolName: schoolName.get(s.schoolId) ?? "",
    destinationId: s.destinationId,
    offeringTypeCode: s.offeringTypeCode,
    complete: s.complete,
    priceHintUsd: s.priceHintUsd,
    /** Services stay curation-gated / off checkout until exact-quote prices them. */
    checkoutEligible: false,
  }));

  return {
    source,
    sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
    metaNote: catalog.meta.note,
    edvisorApiConfigured: isEdvisorApiConfigured(),
    destinations,
    schools,
    programs,
    services: serviceRows,
    curation,
    stats: {
      destinationsTotal: destinations.length,
      schoolsTotal: schools.length,
      schoolsComplete: schools.filter((s) => s.complete).length,
      programsTotal: programs.length,
      programsComplete: programs.filter((p) => p.complete).length,
      servicesTotal: serviceRows.length,
      servicesComplete: serviceRows.filter((s) => s.complete).length,
    },
  };
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest(request.headers.get("authorization"));
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const curation = await getCurationState();
    return NextResponse.json(await buildPayload(curation));
  } catch (err) {
    console.error("[api/admin/catalog] GET failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "No se pudo cargar el catálogo admin",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await verifyAdminRequest(request.headers.get("authorization"));
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: { kind?: string; id?: string; enabled?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (
      (body.kind !== "school" && body.kind !== "program") ||
      typeof body.id !== "string" ||
      typeof body.enabled !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Expected { kind: 'school'|'program', id: string, enabled: boolean }" },
        { status: 400 }
      );
    }

    const { catalog } = await resolveEdvisorCatalog();
    if (body.kind === "school") {
      const school = catalog.schools.find((s) => s.id === body.id);
      if (!school) {
        return NextResponse.json({ error: "School not found in Edvisor catalog" }, { status: 400 });
      }
      if (body.enabled && !school.complete) {
        return NextResponse.json(
          { error: "Solo se pueden activar escuelas complete en Edvisor" },
          { status: 400 }
        );
      }
    } else {
      const program = catalog.programs.find((p) => p.id === body.id);
      if (!program) {
        return NextResponse.json({ error: "Program not found in Edvisor catalog" }, { status: 400 });
      }
      if (body.enabled && !program.complete) {
        return NextResponse.json(
          { error: "Solo se pueden activar programas complete en Edvisor" },
          { status: 400 }
        );
      }
    }

    const curation = await patchCurationToggle({
      kind: body.kind,
      id: body.id,
      enabled: body.enabled,
      actorEmail: auth.admin.email,
    });

    return NextResponse.json(await buildPayload(curation));
  } catch (err) {
    console.error("[api/admin/catalog] PATCH failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "No se pudo guardar la curación",
      },
      { status: 500 }
    );
  }
}
