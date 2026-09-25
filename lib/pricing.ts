import type {
  AccommodationType,
  DurationWeeks,
  PricingBreakdown,
  PricingInput,
} from "@/lib/types";

export const HOMESTAY_PER_WEEK = 180;
export const RESIDENCE_PER_WEEK = 220;
export const GUARD_ME_FLAT = 45;

export const DURATION_OPTIONS: {
  weeks: DurationWeeks;
  label: string;
  monthsLabel: string;
}[] = [
  { weeks: 4, label: "4 weeks", monthsLabel: "1 month" },
  { weeks: 8, label: "8 weeks", monthsLabel: "2 months" },
  { weeks: 12, label: "12 weeks", monthsLabel: "3 months" },
];

export function accommodationRate(type: AccommodationType): number {
  return type === "homestay" ? HOMESTAY_PER_WEEK : RESIDENCE_PER_WEEK;
}

export function calculatePricing({
  weeklyPrice,
  weeks,
  accommodation,
  guardMe,
}: PricingInput): PricingBreakdown {
  const courseTotal = weeklyPrice * weeks;
  const accommodationTotal = accommodationRate(accommodation) * weeks;
  const insuranceTotal = guardMe ? GUARD_ME_FLAT : 0;

  return {
    courseTotal,
    accommodationTotal,
    insuranceTotal,
    total: courseTotal + accommodationTotal + insuranceTotal,
    weeks,
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function weeksFromMonths(months: 1 | 2 | 3): DurationWeeks {
  if (months === 1) return 4;
  if (months === 2) return 8;
  return 12;
}
