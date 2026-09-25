"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Lock } from "lucide-react";
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
  initialWeeks?: DurationWeeks;
}

export function CheckoutBuilder({
  school,
  initialWeeks = 4,
}: CheckoutBuilderProps) {
  const [weeks, setWeeks] = useState<DurationWeeks>(initialWeeks);
  const [accommodation, setAccommodation] =
    useState<AccommodationType>("homestay");
  const [guardMe, setGuardMe] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

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

  if (confirmed) {
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
            reservado por {weeks} semanas. En la versión final te enviamos el correo —
            este MVP solo muestra la confirmación (sin cobro real con Stripe).
          </p>
          <div className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total asegurado</span>
              <span className="font-semibold text-ink">{formatUsd(pricing.total)}</span>
            </div>
          </div>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            onClick={() => setConfirmed(false)}
          >
            Editar detalles de la reserva
          </button>
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

        <button
          type="button"
          data-testid="book-now"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full cursor-pointer gap-2 border-0 text-ink gradient-cta hover:opacity-95"
          )}
          onClick={() => setConfirmed(true)}
        >
          <CreditCard className="size-4" />
          Reservar ahora con tarjeta
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Pago seguro impulsado por Stripe
        </p>
      </div>
    </div>
  );
}
