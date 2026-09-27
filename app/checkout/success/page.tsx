import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getBookingBySessionId } from "@/lib/bookings/store";

export const runtime = "nodejs";

/**
 * Success return URL — display only.
 * Does NOT mark the booking paid. Webhook with verified signature does that.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim();

  let display: {
    status: "paid_pending_webhook" | "unpaid" | "unknown" | "misconfigured";
    bookingId?: string;
    paymentStatus?: string;
    sessionPaymentStatus?: string;
  } = { status: "unknown" };

  if (!sessionId) {
    display = { status: "unknown" };
  } else if (!isStripeConfigured()) {
    display = { status: "misconfigured" };
  } else {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const booking = await getBookingBySessionId(sessionId);
        display = {
          status:
            session.payment_status === "paid"
              ? "paid_pending_webhook"
              : "unpaid",
          bookingId: booking?.bookingId ?? session.metadata?.bookingId,
          paymentStatus: booking?.paymentStatus,
          sessionPaymentStatus: session.payment_status ?? undefined,
        };
      } catch {
        display = { status: "unknown" };
      }
    }
  }

  const confirmedInApp = display.paymentStatus === "paid";

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full",
            confirmedInApp ? "bg-mint/20" : "bg-amber-100"
          )}
        >
          {confirmedInApp ? (
            <CheckCircle2 className="size-7 text-[#029a61]" />
          ) : (
            <AlertTriangle className="size-7 text-amber-700" />
          )}
        </div>
        <h1 className="font-heading text-3xl font-semibold text-ink">
          {confirmedInApp
            ? "Pago confirmado"
            : "Regreso desde Stripe"}
        </h1>
        <p className="text-muted-foreground">
          {confirmedInApp
            ? "El webhook firmado ya registró el pago. Revisa tu correo para el recibo y siguientes pasos de matrícula."
            : "Esta pantalla no acredita el pago por sí misma. La reserva queda pagada solo cuando Stripe envía un webhook con firma válida."}
        </p>
        {display.bookingId && (
          <p className="text-sm text-muted-foreground">
            Reserva: <code>{display.bookingId}</code>
            {display.sessionPaymentStatus
              ? ` · Stripe: ${display.sessionPaymentStatus}`
              : ""}
            {display.paymentStatus
              ? ` · App: ${display.paymentStatus}`
              : ""}
          </p>
        )}
        <Link href="/" className={cn(buttonVariants(), "gradient-cta border-0 text-ink")}>
          Volver al inicio
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
