"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Lock, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  DURATION_OPTIONS,
  GUARD_ME_FLAT,
  HOMESTAY_PER_WEEK,
  RESIDENCE_PER_WEEK,
  calculatePricing,
  formatUsd,
} from "@/lib/pricing";
import type { AccommodationType, DurationWeeks, School } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CheckoutBuilderProps {
  school: School;
  reserved?: boolean;
  initialWeeks?: DurationWeeks;
  initialAccommodation?: AccommodationType;
  initialGuardMe?: boolean;
  stripeConfigured?: boolean;
}

export function CheckoutBuilder({
  school,
  reserved = false,
  initialWeeks = 4,
  initialAccommodation = "homestay",
  initialGuardMe = true,
  stripeConfigured = false,
}: CheckoutBuilderProps) {
  const [weeks, setWeeks] = useState<DurationWeeks>(initialWeeks);
  const [accommodation, setAccommodation] =
    useState<AccommodationType>(initialAccommodation);
  const [guardMe, setGuardMe] = useState(initialGuardMe);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricing = useMemo(
    () =>
      calculatePricing({
        weeklyPrice: school.weeklyPrice,
        weeks,
        accommodation,
        guardMe,
      }),
    [school.weeklyPrice, weeks, accommodation, guardMe]
  );

  const guestValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.trim().length >= 7;

  async function handleCheckout() {
    setError(null);

    if (!stripeConfigured) {
      setError(
        "Stripe no está configurado. Agrega STRIPE_SECRET_KEY y NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en el entorno (modo test) y reinicia el servidor."
      );
      return;
    }

    if (!guestValid) {
      setError("Completa nombre, email y teléfono antes de pagar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolSlug: school.slug,
          weeks,
          accommodation,
          guardMe,
          guest: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
        }),
      });

      const data = (await res.json()) as {
        url?: string;
        error?: string;
        configured?: boolean;
      };

      if (!res.ok || !data.url) {
        setError(
          data.error ??
            "No pudimos iniciar Stripe Checkout. Revisa la configuración e inténtalo de nuevo."
        );
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Error de red al contactar Stripe. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  if (reserved) {
    return (
      <div className="rounded-[1.4rem] border border-border bg-white p-6 shadow-[0_24px_60px_-36px_rgba(38,38,59,0.55)] lg:sticky lg:top-6">
        <div className="flex flex-col items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-mint/20 text-ink">
            <CheckCircle2 className="size-6 text-[#029a61]" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-ink">
            ¡Reserva confirmada!
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tu cupo en{" "}
            <span className="font-semibold text-ink">{school.name}</span> quedó
            reservado por {weeks} semanas. Te enviamos el detalle del pago a tu correo
            (recibo de Stripe en modo test).
          </p>
          <div className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-ink">{formatUsd(pricing.total)}</span>
            </div>
          </div>
          <a
            href={`/courses/${school.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            data-testid="edit-booking"
          >
            Editar detalles de la reserva
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-white p-6 shadow-[0_24px_60px_-36px_rgba(38,38,59,0.55)] lg:sticky lg:top-6">
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">Desde</p>
        <p className="font-heading text-3xl font-semibold text-ink">
          {formatUsd(school.weeklyPrice)}
          <span className="text-sm font-normal text-muted-foreground"> / semana</span>
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Duración</p>
          <RadioGroup
            value={String(weeks)}
            onValueChange={(v) => setWeeks(Number(v) as DurationWeeks)}
            className="gap-2"
          >
            {DURATION_OPTIONS.map((opt) => (
              <label
                key={opt.weeks}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition has-[[data-checked]]:border-mint has-[[data-checked]]:bg-mint/10"
              >
                <RadioGroupItem value={String(opt.weeks)} />
                <span className="text-sm">
                  {opt.label}
                  <span className="ml-1 text-muted-foreground">
                    ({opt.monthsLabel})
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Alojamiento</p>
          <RadioGroup
            value={accommodation}
            onValueChange={(v) => setAccommodation(v as AccommodationType)}
            className="gap-2"
          >
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 has-[[data-checked]]:border-mint has-[[data-checked]]:bg-mint/10">
              <span className="flex items-center gap-3">
                <RadioGroupItem value="homestay" />
                <span className="text-sm">Homestay / Familia</span>
              </span>
              <span className="text-sm text-muted-foreground">
                +{formatUsd(HOMESTAY_PER_WEEK)}/sem
              </span>
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 has-[[data-checked]]:border-mint has-[[data-checked]]:bg-mint/10">
              <span className="flex items-center gap-3">
                <RadioGroupItem value="residence" />
                <span className="text-sm">Residencia estudiantil</span>
              </span>
              <span className="text-sm text-muted-foreground">
                +{formatUsd(RESIDENCE_PER_WEEK)}/sem
              </span>
            </label>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Guard.me Global Coverage</p>
            <p className="text-xs text-muted-foreground">
              Seguro médico y de viaje por {formatUsd(GUARD_ME_FLAT)} fijos
            </p>
          </div>
          <Switch checked={guardMe} onCheckedChange={setGuardMe} />
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-sm font-semibold text-ink">Tus datos (checkout invitado)</p>
          <div className="space-y-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Nombre</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                autoComplete="name"
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Teléfono</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                autoComplete="tel"
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Curso ({weeks} semanas)</span>
            <span>{formatUsd(pricing.courseTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alojamiento</span>
            <span>{formatUsd(pricing.accommodationTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Guard.me</span>
            <span>{formatUsd(pricing.insuranceTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-heading text-base font-semibold text-ink">
            <span>Total</span>
            <span>{formatUsd(pricing.total)}</span>
          </div>
        </div>

        {!stripeConfigured && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
            Para activar el pago, configura{" "}
            <code className="font-mono">STRIPE_SECRET_KEY</code> y{" "}
            <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
            (modo test) en el entorno. El flujo de Checkout ya está implementado.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          data-testid="book-now"
          disabled={loading || !guestValid}
          onClick={handleCheckout}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full gap-2 border-0 text-ink gradient-cta hover:opacity-95 disabled:opacity-50"
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CreditCard className="size-4" />
          )}
          {loading ? "Redirigiendo a Stripe…" : "Pagar con Stripe Checkout"}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Pago seguro con Stripe Checkout (modo test)
        </p>
      </div>
    </div>
  );
}
