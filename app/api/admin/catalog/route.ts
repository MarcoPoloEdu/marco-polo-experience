import { NextResponse } from "next/server";
import {
  CurationLimitError,
  getCurationState,
  isDestinationEnabled,
  patchCurationToggle,
  type SchoolCountryLookup,
} from "@/lib/edvisor/curation";
import { verifyAdminRequest } from "@/lib/firebase/admin";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { isEdvisorApiConfigured } from "@/lib/edvisor/api";

export const runtime = "nodejs";

function buildSchoolCountries(
  catalog: Awaited<ReturnType<typeof resolveEdvisorCatalog>>["catalog"]
): SchoolCountryLookup[] {
  const destById = new Map(catalog.destinations.map((d) => [d.id, d]));
  return catalog.schools.map((s) => {
    const dest = destById.get(s.destinationId);
    const countryCode = (dest?.countryCode || "").trim();
    const country = (dest?.country || "").trim();
    const countryKey = countryCode || country || "unknown";
    const countryLabel = country || countryCode || "desconocido";
    return {
      schoolId: s.id,
      destinationId: s.destinationId,
      countryKey,
      countryLabel,
      schoolName: s.name,
    };
  });
}

async function buildPayload(
  curation: Awaited<ReturnType<typeof getCurationState>>
) {
  const { catalog, source } = await resolveEdvisorCatalog();
  const services = catalog.services ?? [];
  const schoolCountries = buildSchoolCountries(catalog);
  const countryOf = new Map(schoolCountries.map((r) => [r.schoolId, r]));

  // Admin shows ALL schools + incomplete (inventory gaps). Defaults OFF (=== true).
  const schools = catalog.schools.map((s) => {
    const meta = countryOf.get(s.id);
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      destinationId: s.destinationId,
      complete: s.complete,
      edvisorProviderId: s.edvisorProviderId,
      enabled: curation.schools[s.id] === true,
      countryKey: meta?.countryKey ?? "",
      countryLabel: meta?.countryLabel ?? "",
    };
  });

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

  const enabledByCountry: Record<string, number> = {};
  for (const s of schools) {
    if (!s.enabled) continue;
    const key = s.countryKey || "unknown";
    enabledByCountry[key] = (enabledByCountry[key] ?? 0) + 1;
  }

  const destinations = catalog.destinations.map((d) => {
    const schoolsHere = schools.filter((s) => s.destinationId === d.id);
    const enabledSchoolCount = schoolsHere.filter((s) => s.enabled).length;
    const enabled = isDestinationEnabled(
      curation,
      d.id,
      enabledSchoolCount > 0
    );
    return {
      id: d.id,
      country: d.country,
      city: d.city,
      countryCode: d.countryCode,
      languageCodes: d.languageCodes,
      fromWeeklyUsd: d.fromWeeklyUsd,
      schoolCount: schoolsHere.length,
      programCount: programs.filter((p) => p.destinationId === d.id).length,
      enabledSchoolCount,
      enabled,
      countryKey: (d.countryCode || d.country || "").trim(),
    };
  });

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
    maxSchoolsPerCountry: 3,
    enabledByCountry,
    destinations,
    schools,
    programs,
    services: serviceRows,
    curation,
    stats: {
      destinationsTotal: destinations.length,
      destinationsEnabled: destinations.filter((d) => d.enabled).length,
      schoolsTotal: schools.length,
      schoolsComplete: schools.filter((s) => s.complete).length,
      schoolsEnabled: schools.filter((s) => s.enabled).length,
      programsTotal: programs.length,
      programsComplete: programs.filter((p) => p.complete).length,
      programsEnabled: programs.filter((p) => p.enabled).length,
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
      (body.kind !== "school" &&
        body.kind !== "program" &&
        body.kind !== "destination") ||
      typeof body.id !== "string" ||
      typeof body.enabled !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Expected { kind: 'school'|'program'|'destination', id: string, enabled: boolean }",
        },
        { status: 400 }
      );
    }

    const { catalog } = await resolveEdvisorCatalog();
    const schoolCountries = buildSchoolCountries(catalog);

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
      const programIdsForSchool = catalog.programs
        .filter((p) => p.schoolId === school.id)
        .map((p) => p.id);

      try {
        const curation = await patchCurationToggle({
          kind: "school",
          id: body.id,
          enabled: body.enabled,
          actorEmail: auth.admin.email,
          schoolName: school.name,
          schoolCountries,
          programIdsForSchool,
          destinationId: school.destinationId,
        });
        return NextResponse.json(await buildPayload(curation));
      } catch (err) {
        if (err instanceof CurationLimitError) {
          return NextResponse.json(
            {
              error: err.message,
              code: err.code,
              country: err.country,
              limit: err.limit,
            },
            { status: 409 }
          );
        }
        throw err;
      }
    }

    if (body.kind === "program") {
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
      const curation = await patchCurationToggle({
        kind: "program",
        id: body.id,
        enabled: body.enabled,
        actorEmail: auth.admin.email,
      });
      return NextResponse.json(await buildPayload(curation));
    }

    // destination
    const destination = catalog.destinations.find((d) => d.id === body.id);
    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found in Edvisor catalog" },
        { status: 400 }
      );
    }
    const schoolIdsInDestination = catalog.schools
      .filter((s) => s.destinationId === destination.id)
      .map((s) => s.id);
    const schoolIdSet = new Set(schoolIdsInDestination);
    const programIdsToDisable = catalog.programs
      .filter((p) => schoolIdSet.has(p.schoolId))
      .map((p) => p.id);

    const curation = await patchCurationToggle({
      kind: "destination",
      id: body.id,
      enabled: body.enabled,
      actorEmail: auth.admin.email,
      schoolIdsInDestination: body.enabled ? undefined : schoolIdsInDestination,
      programIdsToDisable: body.enabled ? undefined : programIdsToDisable,
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
