import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-mint/20">
          <CheckCircle2 className="size-7 text-[#029a61]" />
        </div>
        <h1 className="font-heading text-3xl font-semibold text-ink">Pago confirmado</h1>
        <p className="text-muted-foreground">
          Si completaste Stripe Checkout, el recibo llega a tu correo. Para la reserva
          guiada del demo partner usa el flujo en la{" "}
          <Link href="/" className="font-medium text-indigo hover:underline">
            página de inicio
          </Link>
          .
        </p>
        <Link href="/" className={cn(buttonVariants(), "gradient-cta border-0 text-ink")}>
          Volver al inicio
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
