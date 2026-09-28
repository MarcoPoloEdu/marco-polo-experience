/** Portable Edvisor export types for Marco Polo Experience. */

export type EdvisorLanguageCode =
  | "english"
  | "german"
  | "french"
  | "spanish"
  | "italian";

export type EdvisorProgramKind = "general" | "exam_prep" | "plus30";

export type EdvisorVisaFriction = "low" | "medium" | "high";

export interface EdvisorDestination {
  id: string;
  country: string;
  city: string;
  countryCode: string;
  languageCodes: EdvisorLanguageCode[];
  imageUrl: string;
  heroUrl: string;
  tagline: string;
  blurb: string;
  vibe: string[];
  visaFriction: EdvisorVisaFriction;
  fromWeeklyUsd: number;
}

export interface EdvisorSchool {
  id: string;
  name: string;
  email: string;
  destinationId: string;
  /** True when Edvisor record has enough fields for Experience to sell. */
  complete: boolean;
  edvisorProviderId: string;
}

export interface EdvisorProgram {
  id: string;
  destinationId: string;
  schoolId: string;
  kind: EdvisorProgramKind;
  title: string;
  summary: string;
  lessonsPerWeek: number;
  /** Canonical weekly course price from Edvisor (USD). */
  weeklyPriceUsd: number;
  highlights: string[];
  imageUrl: string;
  complete: boolean;
  currency: "USD";
  minWeeks: number;
  maxWeeks: number;
}

/** Inventory extras (accommodation, transfer, insurance, fees) — not charge SoT. */
export type EdvisorServiceKind =
  | "accommodation"
  | "insurance"
  | "transfer"
  | "addon"
  | "fee"
  | "other";

export interface EdvisorService {
  id: string;
  schoolId: string;
  destinationId: string;
  kind: EdvisorServiceKind;
  title: string;
  summary: string;
  /** Edvisor offeringType.codeName when known. */
  offeringTypeCode?: string;
  edvisorOfferingId?: string;
  /**
   * True only when a non-invented catalog price exists.
   * Still not chargeable until exact-quote prices the line.
   */
  complete: boolean;
  /** Informational USD hint only — never used as Stripe charge SoT. */
  priceHintUsd?: number;
}

export interface EdvisorCatalogMeta {
  source: string;
  version: string;
  exportedAt: string;
  note?: string;
}

export interface EdvisorCatalog {
  meta: EdvisorCatalogMeta;
  destinations: EdvisorDestination[];
  schools: EdvisorSchool[];
  programs: EdvisorProgram[];
  /** Optional — older vendor seeds omit this; treat missing as []. */
  services?: EdvisorService[];
}
