/**
 * Authorized checkout: pending booking + Stripe Checkout Session.
 * Single charge path used by /api/book and /api/checkout.
 */

import "server-only";

import { createExactQuote } from "@/lib/quotes/exact-quote";
import type { QuoteRequest } from "@/lib/quotes/types";
import {
  attachCheckoutSession,
  createPendingBooking,
  saveQuote,
  type BookingRecord,
} from "@/lib/bookings/store";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { toMinorUnits } from "@/lib/quotes/money";

export type CheckoutResult =
  | {
      ok: true;
      booking: BookingRecord;
      checkoutUrl: string;
      sessionId: string;
    }
  | { ok: false; status: number; error: string; code?: string };

export async function startStripeCheckout(input: {
  quoteRequest: QuoteRequest;
  contact: { name: string; email: string; phone: string };
  idempotencyKey: string;
  cancelPath?: string;
}): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      status: 503,
      code: "stripe_not_configured",
      error:
        "Stripe no está configurado. Define STRIPE_SECRET_KEY y NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. No hay cobro simulado.",
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      status: 503,
      code: "stripe_not_configured",
      error: "STRIPE_SECRET_KEY ausente.",
    };
  }

  const name = input.contact.name.trim();
  const email = input.contact.email.trim();
  const phone = input.contact.phone.trim();
  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length < 7
  ) {
    return {
      ok: false,
      status: 400,
      error: "Datos de contacto incompletos (nombre, email, teléfono).",
    };
  }

  const quote = await createExactQuote({
    ...input.quoteRequest,
    requireLive: true,
  });
  await saveQuote(quote);

  if (!quote.checkoutAllowed) {
    return {
      ok: false,
      status: 409,
      code: "quote_blocked",
      error:
        quote.blockReason ||
        "Cotización no apta para cobro. No se inicia Checkout.",
    };
  }

  if (quote.total <= 0) {
    // Zero can be valid only if tuition_final is explicitly zero — still refuse unpaid zero checkouts for V1
    const tuitionZero = quote.lines.some(
      (l) => l.kind === "tuition_final" && l.amount === 0
    );
    if (!tuitionZero) {
      return {
        ok: false,
        status: 409,
        error: "Total inválido para Checkout.",
      };
    }
  }

  const booking = await createPendingBooking({
    quote,
    contact: { name, email, phone },
    idempotencyKey: input.idempotencyKey,
  });

  if (booking.stripeCheckoutSessionId && booking.paymentStatus === "checkout_pending") {
    // Idempotent retry: retrieve existing session URL if possible
    try {
      const existing = await stripe.checkout.sessions.retrieve(
        booking.stripeCheckoutSessionId
      );
      if (existing.url) {
        return {
          ok: true,
          booking,
          checkoutUrl: existing.url,
          sessionId: existing.id,
        };
      }
    } catch {
      // create a new session below
    }
  }

  const currency = quote.currency.toLowerCase();
  const unitAmount = toMinorUnits(quote.total, quote.currency);
  const baseUrl = getAppBaseUrl();
  const cancelPath = input.cancelPath ?? "/checkout/cancel";

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name: `Marco Polo Experience · ${quote.inputs.programId}`,
                description: `Cotización ${quote.quoteId} · ${quote.inputs.weeks} semanas · inicio ${quote.inputs.startDate}`,
              },
            },
          },
        ],
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}${cancelPath}`,
        metadata: {
          bookingId: booking.bookingId,
          quoteId: quote.quoteId,
          quoteVersion: String(quote.version),
          total: String(quote.total),
          currency: quote.currency,
          guestName: name,
          guestPhone: phone,
        },
        payment_intent_data: {
          metadata: {
            bookingId: booking.bookingId,
            quoteId: quote.quoteId,
          },
        },
      },
      { idempotencyKey: `checkout_${input.idempotencyKey}` }
    );

    if (!session.url) {
      return {
        ok: false,
        status: 502,
        error: "Stripe no devolvió URL de Checkout.",
      };
    }

    await attachCheckoutSession(booking.bookingId, session.id);
    const updated = (await import("@/lib/bookings/store")).getBooking(
      booking.bookingId
    );
    const finalBooking = (await updated) ?? booking;

    return {
      ok: true,
      booking: finalBooking,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error creando Checkout Session.";
    return { ok: false, status: 502, error: message };
  }
}
