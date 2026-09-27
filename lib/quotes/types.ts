/**
 * Exact quote types — single server contract for cotizador + checkout.
 */

export type QuoteLineKind =
  | "tuition_original"
  | "tuition_promotion"
  | "tuition_final"
  | "registration_fee"
  | "materials"
  | "books"
  | "insurance"
  | "accommodation"
  | "airport"
  | "other_mandatory"
  | "other";

export type QuoteLine = {
  kind: QuoteLineKind;
  label: string;
  amount: number;
  currency: string;
  /** Provider reference when known */
  providerRef?: string;
  /** True when amount came from live Edvisor; false for blocked/unavailable */
  source: "edvisor-gateway" | "edvisor-api-v2" | "blocked" | "catalog-informational";
};

export type QuoteInputs = {
  nationalityIso2: string;
  studentAge: number;
  languageCode: string;
  destinationCountryCode: string;
  schoolCompanyId?: string;
  schoolId: string;
  offeringId: string;
  programId: string;
  startDate: string;
  /** Course duration in weeks (program units may differ — weeks is UX input) */
  weeks: number;
  currency: string;
  accommodationOfferingId?: string | null;
  insuranceOfferingId?: string | null;
  airportOfferingId?: string | null;
  travelDepartureDate?: string;
};

export type ExactQuote = {
  quoteId: string;
  version: number;
  createdAt: string;
  expiresAt: string;
  inputs: QuoteInputs;
  currency: string;
  lines: QuoteLine[];
  /** Sale total after promotions (what student pays in provider currency) */
  total: number;
  /** Course subtotal (tuition final + fees) */
  courseSubtotal: number;
  warnings: string[];
  /** Blocks checkout when true */
  checkoutAllowed: boolean;
  blockReason?: string;
  providerRefs: {
    gatewayTuition?: string;
    apiV2Quote?: string;
    accommodation?: string;
    insurance?: string;
    airport?: string;
  };
  rulesVersion?: string;
  policyVersion?: string;
  /** Informational catalog weekly used only when live quote unavailable */
  informationalWeekly?: number;
};

export type QuoteRequest = QuoteInputs & {
  /** Force live Edvisor; refuse informational */
  requireLive?: boolean;
};
