export type PassportCode =
  | "COL"
  | "MEX"
  | "PER"
  | "CHL"
  | "ARG"
  | "BRA"
  | "ECU"
  | "BOL"
  | "URY"
  | "PRY"
  | "CRI"
  | "PAN"
  | "GTM"
  | "HND"
  | "SLV"
  | "NIC"
  | "DOM"
  | "VEN";

export type LanguageCode =
  | "german"
  | "english"
  | "spanish"
  | "french"
  | "italian"
  | "maltese";

export type DurationWeeks = 4 | 8 | 12;

export type AccommodationType = "homestay" | "residence";

export type DestinationSlug = "berlin" | "valletta" | "london";

export interface Destination {
  slug: DestinationSlug;
  city: string;
  country: string;
  tagline: string;
  imageUrl: string;
  languages: LanguageCode[];
}

export interface School {
  slug: string;
  name: string;
  destinationSlug: DestinationSlug;
  city: string;
  country: string;
  language: LanguageCode;
  weeklyPrice: number;
  rating: number;
  reviewCount: number;
  description: string;
  amenities: string[];
  images: string[];
  featured?: boolean;
}

export interface PricingInput {
  weeklyPrice: number;
  weeks: DurationWeeks;
  accommodation: AccommodationType;
  guardMe: boolean;
}

export interface PricingBreakdown {
  courseTotal: number;
  accommodationTotal: number;
  insuranceTotal: number;
  total: number;
  weeks: DurationWeeks;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}
