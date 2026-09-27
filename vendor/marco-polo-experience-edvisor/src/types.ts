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
}
