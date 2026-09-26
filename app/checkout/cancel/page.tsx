import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutCancelPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold tracking-[0.16em] text-indigo uppercase">
          Pago cancelado
        </p>
        <h1 className="font-heading text-3xl font-semibold text-ink">
          No se realizó ningún cargo
        </h1>
        <p className="text-muted-foreground">
          Cancelaste el checkout. Puedes volver al inicio y completar la reserva demo.
        </p>
        <Link href="/" className={cn(buttonVariants(), "gradient-cta border-0 text-ink")}>
          Ir al inicio
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
