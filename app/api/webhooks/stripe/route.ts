import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  claimStripeEvent,
  getBooking,
  markBookingPaid,
  markEmailsSent,
} from "@/lib/bookings/store";
import { buildBookingEmails, deliverEmails } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Stripe webhook — signature REQUIRED.
 * Missing STRIPE_WEBHOOK_SECRET is a configuration error (503), not a permit to accept JSON.
 * Return URL never marks paid; only verified events do.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { received: false, error: "Stripe no configurado." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { received: false, error: "STRIPE_SECRET_KEY ausente." },
      { status: 503 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      {
        received: false,
        error:
          "STRIPE_WEBHOOK_SECRET ausente. Configuración incompleta — no se aceptan webhooks sin firma.",
      },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Falta stripe-signature." },
      { status: 400 }
    );
  }

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firma inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const claimed = await claimStripeEvent(event.id);
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      payment_status?: string;
      amount_total?: number | null;
      currency?: string | null;
      metadata?: Record<string, string>;
      payment_intent?: string | { id?: string } | null;
    };

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      console.warn("[stripe webhook] session without bookingId metadata", session.id);
      return NextResponse.json({ received: true, warning: "missing_booking_id" });
    }

    const booking = await getBooking(bookingId);
    if (!booking) {
      console.warn("[stripe webhook] booking not found", bookingId);
      return NextResponse.json({ received: true, warning: "booking_not_found" });
    }

    // Validate amount/currency against immutable quote snapshot
    const expectedMinor = Math.round(
      booking.quoteSnapshot.total *
        Math.pow(
          10,
          booking.quoteSnapshot.currency.toUpperCase() === "JPY" ? 0 : 2
        )
    );
    if (
      session.amount_total != null &&
      session.amount_total !== expectedMinor
    ) {
      console.error("[stripe webhook] amount mismatch", {
        bookingId,
        expectedMinor,
        got: session.amount_total,
      });
      return NextResponse.json(
        { error: "Amount mismatch — not marking paid." },
        { status: 409 }
      );
    }
    if (
      session.currency &&
      session.currency.toLowerCase() !==
        booking.quoteSnapshot.currency.toLowerCase()
    ) {
      console.error("[stripe webhook] currency mismatch", {
        bookingId,
        expected: booking.quoteSnapshot.currency,
        got: session.currency,
      });
      return NextResponse.json(
        { error: "Currency mismatch — not marking paid." },
        { status: 409 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({
        received: true,
        payment_status: session.payment_status,
      });
    }

    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const updated = await markBookingPaid({
      bookingId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: pi,
    });

    if (updated?.paymentStatus === "needs_reconciliation") {
      console.warn(
        "[stripe webhook] paid event on expired/cancelled booking — reconciliation required",
        bookingId
      );
      return NextResponse.json({
        received: true,
        reconciliation: true,
        bookingId,
      });
    }

    // Emails only after confirmed payment, once
    if (updated?.paymentStatus === "paid" && !updated.emailsSent) {
      const q = updated.quoteSnapshot;
      const emails = buildBookingEmails({
        bookingId: updated.bookingId,
        customerName: updated.contact.name,
        customerEmail: updated.contact.email,
        customerPhone: updated.contact.phone,
        nationalityLabel: q.inputs.nationalityIso2,
        languageLabel: q.inputs.languageCode,
        destinationLabel: q.inputs.destinationCountryCode || "—",
        programTitle: q.inputs.programId,
        schoolName: q.inputs.schoolId,
        schoolEmail:
          process.env.MPE_SCHOOL_FALLBACK_EMAIL ||
          "procesos@marcopoloeducation.com",
        startDate: q.inputs.startDate,
        endDate: q.inputs.startDate,
        weeks: q.inputs.weeks,
        totalUsd: q.total,
        extrasSummary: "Curso (sin extras locales genéricos)",
        charged: true,
        paymentMode: "stripe",
      });
      await deliverEmails(emails);
      await markEmailsSent(updated.bookingId);
    }
  }

  return NextResponse.json({ received: true });
}
