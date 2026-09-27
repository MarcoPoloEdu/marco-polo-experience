import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { startStripeCheckout } from "@/lib/bookings/checkout";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { getCurationState, isProgramEnabled, isSchoolEnabled } from "@/lib/edvisor/curation";
import { iso2FromUiNationality } from "@/lib/nationality";

export const runtime = "nodejs";

interface BookBody {
  nationality?: string;
  language?: string;
  destinationId?: string;
  programId?: string;
  startDate?: string;
  weeks?: number;
  accommodationId?: string;
  insuranceId?: string;
  airportId?: string;
  studentAge?: number;
  travelDepartureDate?: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  /** @deprecated Mock card path removed — Stripe Checkout only */
  card?: unknown;
  idempotencyKey?: string;
}

/**
 * POST /api/book — creates pending booking + Stripe Checkout Session.
 * Never marks payment successful. Never mock-charges.
 */
export async function POST(request: Request) {
  let body: BookBody;
  try {
    body = (await request.json()) as BookBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = body.contact?.name?.trim() ?? "";
  const email = body.contact?.email?.trim() ?? "";
  const phone = body.contact?.phone?.trim() ?? "";
  const weeks =
    typeof body.weeks === "number" && body.weeks > 0 && body.weeks <= 52
      ? Math.floor(body.weeks)
      : null;

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length < 7 ||
    !body.programId ||
    !body.destinationId ||
    !body.startDate ||
    !weeks
  ) {
    return NextResponse.json(
      { error: "Faltan datos de reserva o contacto." },
      { status: 400 }
    );
  }

  if (body.studentAge == null || body.studentAge < 1) {
    return NextResponse.json(
      {
        error:
          "Edad del estudiante requerida. No se infiere automáticamente.",
      },
      { status: 400 }
    );
  }

  const nationalityIso2 = body.nationality
    ? iso2FromUiNationality(body.nationality)
    : null;
  if (!nationalityIso2) {
    return NextResponse.json(
      { error: "Nacionalidad inválida o ausente (ISO requerido)." },
      { status: 400 }
    );
  }

  const { catalog } = await resolveEdvisorCatalog();
  const program = catalog.programs.find((p) => p.id === body.programId);
  if (!program || !program.complete) {
    return NextResponse.json(
      { error: "Programa inválido o incompleto." },
      { status: 400 }
    );
  }

  const school = catalog.schools.find((s) => s.id === program.schoolId);
  if (!school?.complete) {
    return NextResponse.json(
      { error: "Escuela inválida o incompleta." },
      { status: 400 }
    );
  }

  const curation = await getCurationState();
  if (!isSchoolEnabled(curation, school.id) || !isProgramEnabled(curation, program.id)) {
    return NextResponse.json(
      {
        error:
          "Producto no habilitado por administración. No se puede iniciar el pago.",
      },
      { status: 403 }
    );
  }

  // Add-ons other than "none" require verified Edvisor prices — block early
  const acc = body.accommodationId && body.accommodationId !== "none";
  const ins = body.insuranceId && body.insuranceId !== "none";
  const air = body.airportId && body.airportId !== "none";
  if (acc || ins || air) {
    return NextResponse.json(
      {
        error:
          "Alojamiento, seguro y recepción requieren precio Edvisor verificado. En esta versión solo se cobra el curso cotizado exactamente.",
        code: "addons_require_live_price",
      },
      { status: 409 }
    );
  }

  const offeringId =
    program.id.startsWith("edv-offering-")
      ? program.id.replace("edv-offering-", "")
      : program.id;

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
    cancelPath: "/checkout/cancel",
    quoteRequest: {
      nationalityIso2,
      studentAge: body.studentAge,
      languageCode: body.language || "",
      destinationCountryCode: "",
      schoolId: school.edvisorProviderId || school.id,
      offeringId,
      programId: program.id,
      startDate: body.startDate,
      weeks,
      currency: program.currency || "USD",
      accommodationOfferingId: body.accommodationId ?? "none",
      insuranceOfferingId: body.insuranceId ?? "none",
      airportOfferingId: body.airportId ?? "none",
      travelDepartureDate: body.travelDepartureDate || body.startDate,
      requireLive: true,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, charged: false },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    bookingId: result.booking.bookingId,
    quoteId: result.booking.quoteId,
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    paymentStatus: result.booking.paymentStatus,
    charged: false,
    paymentMode: "stripe_checkout",
    total: result.booking.quoteSnapshot.total,
    currency: result.booking.quoteSnapshot.currency,
  });
}
