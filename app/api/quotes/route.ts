import { NextResponse } from "next/server";
import { createExactQuote } from "@/lib/quotes/exact-quote";
import { saveQuote } from "@/lib/bookings/store";
import type { QuoteRequest } from "@/lib/quotes/types";

export const runtime = "nodejs";

/** Server-side exact quote — used by cotizador preview and checkout revalidation. */
export async function POST(request: Request) {
  let body: QuoteRequest;
  try {
    body = (await request.json()) as QuoteRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const quote = await createExactQuote(body);
  await saveQuote(quote);

  return NextResponse.json({
    quote,
    checkoutAllowed: quote.checkoutAllowed,
    blockReason: quote.blockReason,
  });
}
