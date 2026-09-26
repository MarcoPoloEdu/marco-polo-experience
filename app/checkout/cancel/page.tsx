import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CancelPageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function CheckoutCancelPage({
  searchParams,
}: CancelPageProps) {
  const { school } = await searchParams;
  const backHref = school ? `/courses/${school}` : "/";

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
          Cancelaste Stripe Checkout. Tu paquete sigue disponible: puedes volver al
          curso y reintentar cuando quieras.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={backHref}
            className={cn(buttonVariants(), "gradient-cta border-0 text-ink")}
          >
            Volver al curso
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Ir al inicio
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
