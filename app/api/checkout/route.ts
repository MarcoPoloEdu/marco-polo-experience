import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { startStripeCheckout } from "@/lib/bookings/checkout";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import {
  getCurationState,
  isProgramEnabled,
  isSchoolEnabled,
} from "@/lib/edvisor/curation";
import { iso2FromUiNationality } from "@/lib/nationality";

export const runtime = "nodejs";

interface CheckoutBody {
  /** Legacy school slug path — resolved via catalog when possible */
  schoolSlug?: string;
  programId?: string;
  schoolId?: string;
  offeringId?: string;
  weeks?: number;
  startDate?: string;
  nationality?: string;
  language?: string;
  studentAge?: number;
  travelDepartureDate?: string;
  guest?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  idempotencyKey?: string;
  /** Legacy fields — ignored for pricing (no generic addon charges) */
  accommodation?: string;
  guardMe?: boolean;
}

/**
 * POST /api/checkout — delegates to the same authorized checkout service as /api/book.
 * No second pricing engine.
 */
export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = body.guest?.name?.trim() ?? "";
  const email = body.guest?.email?.trim() ?? "";
  const phone = body.guest?.phone?.trim() ?? "";
  const weeks =
    typeof body.weeks === "number" && body.weeks > 0 && body.weeks <= 52
      ? Math.floor(body.weeks)
      : null;

  if (!weeks || !body.startDate) {
    return NextResponse.json(
      { error: "Duración e inicio de curso requeridos." },
      { status: 400 }
    );
  }

  if (body.studentAge == null || body.studentAge < 1) {
    return NextResponse.json(
      { error: "Edad del estudiante requerida." },
      { status: 400 }
    );
  }

  const nationalityIso2 = body.nationality
    ? iso2FromUiNationality(body.nationality)
    : null;
  if (!nationalityIso2) {
    return NextResponse.json(
      { error: "Nacionalidad ISO requerida." },
      { status: 400 }
    );
  }

  if (body.accommodation && body.accommodation !== "none") {
    return NextResponse.json(
      {
        error:
          "Alojamiento requiere precio Edvisor verificado; no se usan tarifas genéricas locales.",
        code: "addons_require_live_price",
      },
      { status: 409 }
    );
  }
  if (body.guardMe) {
    return NextResponse.json(
      {
        error:
          "Seguro requiere precio Edvisor verificado; no se usa tarifa plana local.",
        code: "addons_require_live_price",
      },
      { status: 409 }
    );
  }

  const { catalog } = await resolveEdvisorCatalog();
  let program = body.programId
    ? catalog.programs.find((p) => p.id === body.programId)
    : undefined;

  if (!program && body.schoolSlug) {
    // Legacy: map slug → school name loosely; still require curation + live quote
    const school = catalog.schools.find(
      (s) =>
        s.id.includes(body.schoolSlug!) ||
        s.name.toLowerCase().replace(/\s+/g, "-").includes(body.schoolSlug!)
    );
    if (school) {
      program = catalog.programs.find(
        (p) => p.schoolId === school.id && p.complete
      );
    }
  }

  if (!program?.complete) {
    return NextResponse.json(
      { error: "Programa no encontrado o incompleto en catálogo curado." },
      { status: 400 }
    );
  }

  const school = catalog.schools.find((s) => s.id === program!.schoolId);
  if (!school?.complete) {
    return NextResponse.json({ error: "Escuela incompleta." }, { status: 400 });
  }

  const curation = await getCurationState();
  if (
    !isSchoolEnabled(curation, school.id) ||
    !isProgramEnabled(curation, program.id)
  ) {
    return NextResponse.json(
      { error: "Producto no habilitado por administración." },
      { status: 403 }
    );
  }

  const offeringId =
    body.offeringId ||
    (program.id.startsWith("edv-offering-")
      ? program.id.replace("edv-offering-", "")
      : program.id);

  const idempotencyKey =
    body.idempotencyKey?.trim() ||
    createHash("sha256")
      .update(
        [
          email,
          program.id,
          body.startDate,
          String(weeks),
          nationalityIso2,
          String(body.studentAge),
        ].join("|")
      )
      .digest("hex")
      .slice(0, 32);

  const result = await startStripeCheckout({
    contact: { name, email, phone },
    idempotencyKey,
    cancelPath: body.schoolSlug
      ? `/checkout/cancel?school=${encodeURIComponent(body.schoolSlug)}`
      : "/checkout/cancel",
    quoteRequest: {
      nationalityIso2,
      studentAge: body.studentAge,
      languageCode: body.language || "",
      destinationCountryCode: "",
      schoolId: body.schoolId || school.edvisorProviderId || school.id,
      offeringId,
      programId: program.id,
      startDate: body.startDate,
      weeks,
      currency: program.currency || "USD",
      accommodationOfferingId: "none",
      insuranceOfferingId: "none",
      airportOfferingId: "none",
      travelDepartureDate: body.travelDepartureDate || body.startDate,
      requireLive: true,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        configured: result.code !== "stripe_not_configured",
        error: result.error,
        code: result.code,
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    url: result.checkoutUrl,
    sessionId: result.sessionId,
    bookingId: result.booking.bookingId,
    quoteId: result.booking.quoteId,
    charged: false,
  });
}
