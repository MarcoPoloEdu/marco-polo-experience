import { NextResponse } from "next/server";
import { getSchool } from "@/lib/data/schools";
import { calculatePricing } from "@/lib/pricing";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import type { AccommodationType, DurationWeeks } from "@/lib/types";

export const runtime = "nodejs";

interface CheckoutBody {
  schoolSlug?: string;
  weeks?: number;
  accommodation?: AccommodationType;
  guardMe?: boolean;
  guest?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

function parseWeeks(value?: number): DurationWeeks | null {
  if (value === 4 || value === 8 || value === 12) return value;
  return null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Stripe no está configurado. Define STRIPE_SECRET_KEY y NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { configured: false, error: "STRIPE_SECRET_KEY ausente." },
      { status: 503 }
    );
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const school = body.schoolSlug ? getSchool(body.schoolSlug) : undefined;
  const weeks = parseWeeks(body.weeks);
  const accommodation: AccommodationType =
    body.accommodation === "residence" ? "residence" : "homestay";
  const guardMe = Boolean(body.guardMe);
  const name = body.guest?.name?.trim() ?? "";
  const email = body.guest?.email?.trim() ?? "";
  const phone = body.guest?.phone?.trim() ?? "";

  if (!school || !weeks) {
    return NextResponse.json(
      { error: "Escuela o duración inválida." },
      { status: 400 }
    );
  }

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length < 7
  ) {
    return NextResponse.json(
      { error: "Datos del huésped incompletos (nombre, email, teléfono)." },
      { status: 400 }
    );
  }

  const pricing = calculatePricing({
    weeklyPrice: school.weeklyPrice,
    weeks,
    accommodation,
    guardMe,
  });

  const baseUrl = getAppBaseUrl();
  const lineItems: {
    quantity: number;
    price_data: {
      currency: "usd";
      unit_amount: number;
      product_data: { name: string; description?: string };
    };
  }[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: pricing.courseTotal * 100,
        product_data: {
          name: `${school.name} · ${weeks} semanas`,
          description: `Curso de idioma en ${school.city}, ${school.country}`,
        },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: pricing.accommodationTotal * 100,
        product_data: {
          name:
            accommodation === "homestay"
              ? `Homestay · ${weeks} semanas`
              : `Residencia · ${weeks} semanas`,
        },
      },
    },
  ];

  if (pricing.insuranceTotal > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: pricing.insuranceTotal * 100,
        product_data: {
          name: "Guard.me Global Coverage",
          description: "Seguro médico y de viaje",
        },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?school=${encodeURIComponent(school.slug)}`,
      metadata: {
        schoolSlug: school.slug,
        weeks: String(weeks),
        accommodation,
        guardMe: guardMe ? "1" : "0",
        guestName: name,
        guestPhone: phone,
        totalUsd: String(pricing.total),
      },
      phone_number_collection: { enabled: true },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe no devolvió URL de Checkout." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error creando Checkout Session.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
