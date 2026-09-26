import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { buttonVariants } from "@/components/ui/button";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  let schoolName: string | null = null;
  let guestEmail: string | null = null;
  let totalLabel: string | null = null;
  let paid = false;

  if (sessionId && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        paid = session.payment_status === "paid";
        guestEmail = session.customer_details?.email ?? session.customer_email;
        schoolName = session.metadata?.schoolSlug ?? null;
        if (session.metadata?.totalUsd) {
          totalLabel = `USD ${session.metadata.totalUsd}`;
        }
      } catch {
        // Fall through to generic success copy
      }
    }
  }

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-mint/20">
          <CheckCircle2 className="size-7 text-[#029a61]" />
        </div>
        <h1 className="font-heading text-3xl font-semibold text-ink">
          {paid ? "Pago confirmado" : "Gracias por tu reserva"}
        </h1>
        <p className="text-muted-foreground">
          {paid
            ? "Stripe confirmó tu pago en modo test. Recibirás el recibo en tu correo."
            : "Si completaste el checkout, Stripe te enviará el recibo. Si acabas de volver, puede tomar unos segundos en reflejarse."}
        </p>
        <div className="w-full space-y-2 rounded-2xl border border-border bg-white p-4 text-sm">
          {schoolName && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Curso</span>
              <span className="font-medium text-ink">{schoolName}</span>
            </div>
          )}
          {guestEmail && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-ink">{guestEmail}</span>
            </div>
          )}
          {totalLabel && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-ink">{totalLabel}</span>
            </div>
          )}
          {sessionId && (
            <div className="flex justify-between gap-3 border-t border-border pt-2">
              <span className="text-muted-foreground">Sesión</span>
              <span className="max-w-[60%] truncate font-mono text-xs text-ink">
                {sessionId}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className={cn(buttonVariants(), "gradient-cta border-0 text-ink")}>
            Volver al inicio
          </Link>
          <Link
            href="/search?passport=COL&destination=valletta&language=english"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Explorar más cursos
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
