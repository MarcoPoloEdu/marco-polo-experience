"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-6">
        <div className="flex flex-col items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Booking confirmed
          </h2>
          <p className="text-sm text-muted-foreground">
            Your place at <span className="font-medium text-foreground">{school.name}</span>{" "}
            is reserved for {weeks} weeks. A confirmation email would go out next—
            this MVP shows confirmation only (no live Stripe charge).
          </p>
          <div className="w-full rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total secured</span>
              <span className="font-semibold">{formatUsd(pricing.total)}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setConfirmed(false)}>
            Edit booking details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">From</p>
        <p className="text-2xl font-semibold text-foreground">
          {formatUsd(school.weeklyPrice)}
          <span className="text-sm font-normal text-muted-foreground"> / week</span>
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Duration</p>
          <RadioGroup
            value={String(weeks)}
            onValueChange={(v) => setWeeks(Number(v) as DurationWeeks)}
            className="gap-2"
          >
            {DURATION_OPTIONS.map((opt) => (
              <label
                key={opt.weeks}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
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
          <p className="text-sm font-medium">Accommodation</p>
          <RadioGroup
            value={accommodation}
            onValueChange={(v) => setAccommodation(v as AccommodationType)}
            className="gap-2"
          >
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
              <span className="flex items-center gap-3">
                <RadioGroupItem value="homestay" />
                <span className="text-sm">Homestay</span>
              </span>
              <span className="text-sm text-muted-foreground">
                +{formatUsd(HOMESTAY_PER_WEEK)}/wk
              </span>
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
              <span className="flex items-center gap-3">
                <RadioGroupItem value="residence" />
                <span className="text-sm">Student Residence</span>
              </span>
              <span className="text-sm text-muted-foreground">
                +{formatUsd(RESIDENCE_PER_WEEK)}/wk
              </span>
            </label>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
          <div>
            <p className="text-sm font-medium">Guard.me Global Coverage</p>
            <p className="text-xs text-muted-foreground">
              Flat {formatUsd(GUARD_ME_FLAT)} medical & travel insurance
            </p>
          </div>
          <Switch checked={guardMe} onCheckedChange={setGuardMe} />
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Tuition ({weeks} weeks)
            </span>
            <span>{formatUsd(pricing.courseTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accommodation</span>
            <span>{formatUsd(pricing.accommodationTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Guard.me</span>
            <span>{formatUsd(pricing.insuranceTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatUsd(pricing.total)}</span>
          </div>
        </div>

        <Button
          size="lg"
          className="h-11 w-full gap-2"
          onClick={() => setConfirmed(true)}
        >
          <CreditCard className="size-4" />
          Book Now with Credit Card
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}
