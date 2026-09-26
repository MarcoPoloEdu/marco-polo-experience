import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Optional Stripe webhook stub.
 * Marks bookings as paid when checkout.session.completed fires.
 * Requires STRIPE_WEBHOOK_SECRET when verifying signatures in production.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { received: false, error: "Stripe no configurado." },
      { status: 503 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  let event;
  if (webhookSecret) {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
    }
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Firma inválida.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(body) as { type: string; data?: { object?: { id?: string; metadata?: Record<string, string>; payment_status?: string } } };
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session =
      "data" in event && event.data?.object
        ? event.data.object
        : null;
    // V1: confirmation via success_url; persist paid state in a later phase.
    console.info("[stripe webhook] checkout.session.completed", {
      id: session && "id" in session ? session.id : undefined,
      metadata: session && "metadata" in session ? session.metadata : undefined,
      payment_status:
        session && "payment_status" in session ? session.payment_status : undefined,
    });
  }

  return NextResponse.json({ received: true });
}
