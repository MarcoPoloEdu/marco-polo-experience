import { NextResponse } from "next/server";
import { loadEdvisorCatalog } from "@marco-polo/experience-edvisor";
import { getCurationState, patchCurationToggle } from "@/lib/edvisor/curation";
import { verifyAdminRequest } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function buildPayload(
  curation: Awaited<ReturnType<typeof getCurationState>>
) {
  const catalog = loadEdvisorCatalog();
  const schools = catalog.schools
    .filter((s) => s.complete)
    .map((s) => ({
      ...s,
      enabled: curation.schools[s.id] ?? true,
    }));

  const schoolName = new Map(schools.map((s) => [s.id, s.name]));

  const programs = catalog.programs
    .filter((p) => p.complete)
    .map((p) => ({
      id: p.id,
      title: p.title,
      schoolId: p.schoolId,
      schoolName: schoolName.get(p.schoolId) ?? "",
      weeklyPriceUsd: p.weeklyPriceUsd,
      kind: p.kind,
      destinationId: p.destinationId,
      complete: p.complete,
      enabled: curation.programs[p.id] ?? true,
    }));

  return {
    source: "edvisor",
    sourceLabel: `${catalog.meta.source}@${catalog.meta.version}`,
    metaNote: catalog.meta.note,
    schools,
    programs,
    curation,
  };
}

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request.headers.get("authorization"));
  if (!auth.ok) {
    // Soft path: if Firebase Admin not configured, still block mutations but allow
    // reading catalog only when a demo bypass is explicitly enabled is NOT allowed —
    // require token. Return the error.
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const curation = await getCurationState();
  return NextResponse.json(buildPayload(curation));
}

export async function PATCH(request: Request) {
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

  const catalog = loadEdvisorCatalog();
  if (body.kind === "school") {
    const school = catalog.schools.find((s) => s.id === body.id);
    if (!school?.complete) {
      return NextResponse.json(
        { error: "School not found or not complete in Edvisor" },
        { status: 400 }
      );
    }
  } else {
    const program = catalog.programs.find((p) => p.id === body.id);
    if (!program?.complete) {
      return NextResponse.json(
        { error: "Program not found or not complete in Edvisor" },
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

  return NextResponse.json(buildPayload(curation));
}
