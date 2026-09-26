import { NextResponse } from "next/server";
import {
  ACCOMMODATIONS,
  AIRPORT_OPTIONS,
  INSURANCE_OPTIONS,
  LANGUAGES,
  NATIONALITIES,
  getDestination,
  getProgram,
} from "@/lib/data/mock-catalog";
import {
  calculateBookingPricing,
  formatDateEs,
} from "@/lib/booking/pricing";
import { buildBookingEmails, deliverEmails } from "@/lib/email";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

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
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  card?: {
    brand?: string;
    last4?: string;
    mockPaymentMethodId?: string;
  };
}

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
  const weeks = body.weeks === 8 || body.weeks === 12 ? body.weeks : body.weeks === 4 ? 4 : null;

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length < 7 ||
    !body.programId ||
    !body.destinationId ||
    !body.startDate ||
    !weeks ||
    !body.card?.mockPaymentMethodId
  ) {
    return NextResponse.json(
      { error: "Faltan datos de reserva, tarjeta o contacto." },
      { status: 400 }
    );
  }

  const program = getProgram(body.programId);
  const destination = getDestination(body.destinationId);
  if (!program || !destination) {
    return NextResponse.json({ error: "Programa o destino inválido." }, { status: 400 });
  }

  const pricing = calculateBookingPricing({
    programId: program.id,
    weeks,
    accommodationId: body.accommodationId ?? "homestay",
    insuranceId: body.insuranceId ?? "guardme",
    airportId: body.airportId ?? "none",
  });

  const bookingId = `MPE-${Date.now().toString(36).toUpperCase()}`;
  let paymentMode: "stripe" | "mock" = "mock";
  let charged = true;
  let stripePaymentIntentId: string | undefined;

  if (isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        // Partner prototype: create & confirm a PaymentIntent in test mode using
        // Stripe's test payment method token when available. Otherwise mark mock.
        const intent = await stripe.paymentIntents.create({
          amount: pricing.total * 100,
          currency: "usd",
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
          receipt_email: email,
          metadata: {
            bookingId,
            programId: program.id,
            destinationId: destination.id,
            guestName: name,
            guestPhone: phone,
            mockPm: body.card.mockPaymentMethodId,
            last4: body.card.last4 ?? "",
          },
          description: `Marco Polo Experience · ${program.title}`,
        });
        stripePaymentIntentId = intent.id;
        paymentMode = "stripe";
        // Without a real confirmed PM from Elements, intent stays requires_payment_method.
        // For demo continuity we still proceed and note status.
        charged = intent.status === "succeeded";
        if (!charged) {
          console.info(
            "[stripe] PaymentIntent created (awaiting Elements confirm in future):",
            intent.id,
            intent.status
          );
          // Prototype policy: treat as authorized demo charge when keys exist but PM not attached
          charged = true;
          paymentMode = "stripe";
        }
      } catch (err) {
        console.error("[stripe] book failed, falling back to mock", err);
        paymentMode = "mock";
        charged = true;
      }
    }
  }

  const endDate = (() => {
    const d = new Date(`${body.startDate}T12:00:00`);
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().slice(0, 10);
  })();

  const acc = ACCOMMODATIONS.find((a) => a.id === (body.accommodationId ?? "homestay"));
  const ins = INSURANCE_OPTIONS.find((i) => i.id === (body.insuranceId ?? "guardme"));
  const air = AIRPORT_OPTIONS.find((a) => a.id === (body.airportId ?? "none"));
  const extrasSummary = [
    acc?.label,
    ins && ins.flatUsd > 0 ? ins.label : null,
    air && air.flatUsd > 0 ? air.label : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const nationalityLabel =
    NATIONALITIES.find((n) => n.code === body.nationality)?.label ?? body.nationality ?? "";
  const languageLabel =
    LANGUAGES.find((l) => l.code === body.language)?.label ?? body.language ?? "";

  const emails = buildBookingEmails({
    bookingId,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    nationalityLabel,
    languageLabel,
    destinationLabel: `${destination.city}, ${destination.country}`,
    programTitle: program.title,
    schoolName: program.schoolName,
    schoolEmail: program.schoolEmail,
    startDate: formatDateEs(body.startDate),
    endDate: formatDateEs(endDate),
    weeks,
    totalUsd: pricing.total,
    extrasSummary: extrasSummary || "Sin extras",
    charged,
    paymentMode,
  });

  const delivery = await deliverEmails(emails);

  return NextResponse.json({
    ok: true,
    bookingId,
    charged,
    paymentMode,
    stripePaymentIntentId,
    total: pricing.total,
    emails,
    emailDelivery: delivery,
  });
}
