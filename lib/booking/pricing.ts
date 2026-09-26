import {
  ACCOMMODATIONS,
  AIRPORT_OPTIONS,
  INSURANCE_OPTIONS,
  getProgram,
  type WeekOption,
} from "@/lib/data/mock-catalog";

export interface BookingPricingInput {
  programId: string;
  weeks: WeekOption;
  accommodationId: string;
  insuranceId: string;
  airportId: string;
}

export interface BookingPricing {
  courseTotal: number;
  accommodationTotal: number;
  insuranceTotal: number;
  airportTotal: number;
  total: number;
  weeklyCourse: number;
  weeks: WeekOption;
}

export function calculateBookingPricing(input: BookingPricingInput): BookingPricing {
  const program = getProgram(input.programId);
  const weeklyCourse = program?.weeklyUsd ?? 0;
  const weeks = input.weeks;
  const accommodation =
    ACCOMMODATIONS.find((a) => a.id === input.accommodationId)?.perWeekUsd ?? 0;
  const insurance =
    INSURANCE_OPTIONS.find((i) => i.id === input.insuranceId)?.flatUsd ?? 0;
  const airport = AIRPORT_OPTIONS.find((a) => a.id === input.airportId)?.flatUsd ?? 0;

  const courseTotal = weeklyCourse * weeks;
  const accommodationTotal = accommodation * weeks;

  return {
    courseTotal,
    accommodationTotal,
    insuranceTotal: insurance,
    airportTotal: airport,
    total: courseTotal + accommodationTotal + insurance + airport,
    weeklyCourse,
    weeks,
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function addWeeks(startIso: string, weeks: number): string {
  const d = new Date(`${startIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function formatDateEs(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
