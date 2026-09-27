/** Shared catalog types used by cotizador + Edvisor bridge. */

export type NationalityCode =
  | "COL"
  | "MEX"
  | "PER"
  | "CHL"
  | "ARG"
  | "BRA"
  | "ECU"
  | "URY"
  | "CRI"
  | "PAN";

export type LanguageCode = "english" | "german" | "french" | "spanish" | "italian";

export type ProgramKind = "general" | "exam_prep" | "plus30";

export interface Nationality {
  code: NationalityCode;
  label: string;
  flag: string;
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  tagline: string;
}

export interface Destination {
  id: string;
  country: string;
  city: string;
  languageCodes: LanguageCode[];
  imageUrl: string;
  heroUrl: string;
  tagline: string;
  blurb: string;
  vibe: string[];
  visaFriction: "low" | "medium" | "high";
  fromWeeklyUsd: number;
}

export interface Program {
  id: string;
  destinationId: string;
  schoolName: string;
  schoolEmail: string;
  kind: ProgramKind;
  title: string;
  summary: string;
  lessonsPerWeek: number;
  weeklyUsd: number;
  highlights: string[];
  imageUrl: string;
  enabled: boolean;
}

export interface AccommodationOption {
  id: string;
  label: string;
  description: string;
  perWeekUsd: number;
  imageUrl: string;
}

export interface InsuranceOption {
  id: string;
  label: string;
  description: string;
  flatUsd: number;
}

export interface AirportOption {
  id: string;
  label: string;
  description: string;
  flatUsd: number;
}
