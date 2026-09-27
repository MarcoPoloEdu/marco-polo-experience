/**
 * Cotizador catalog — destinations/programs/prices from Edvisor portable export.
 * Nationalities, languages, and extras (accommodation/insurance/airport) stay local.
 * If Edvisor vendor fails to load, source is labeled "fallback".
 */

import { loadExperienceCatalogSync } from "@/lib/edvisor/catalog-sync";
import type {
  AccommodationOption,
  AirportOption,
  Destination,
  InsuranceOption,
  LanguageCode,
  LanguageOption,
  Nationality,
  NationalityCode,
  Program,
  ProgramKind,
} from "@/lib/data/types";

export type {
  AccommodationOption,
  AirportOption,
  Destination,
  InsuranceOption,
  LanguageCode,
  LanguageOption,
  Nationality,
  NationalityCode,
  Program,
  ProgramKind,
} from "@/lib/data/types";

const edvisorSlice = loadExperienceCatalogSync();

/** Destinations from Edvisor export (or empty if fallback). */
export const DESTINATIONS: Destination[] = edvisorSlice.destinations;

/** Programs + weekly prices from Edvisor (enabled filtered by curation defaults). */
export const PROGRAMS: Program[] = edvisorSlice.programs;

export const CATALOG_SOURCE = edvisorSlice.source;
export const CATALOG_SOURCE_LABEL = edvisorSlice.sourceLabel;

export const NATIONALITIES: Nationality[] = [
  { code: "COL", label: "Colombia", flag: "🇨🇴" },
  { code: "MEX", label: "México", flag: "🇲🇽" },
  { code: "PER", label: "Perú", flag: "🇵🇪" },
  { code: "CHL", label: "Chile", flag: "🇨🇱" },
  { code: "ARG", label: "Argentina", flag: "🇦🇷" },
  { code: "BRA", label: "Brasil", flag: "🇧🇷" },
  { code: "ECU", label: "Ecuador", flag: "🇪🇨" },
  { code: "URY", label: "Uruguay", flag: "🇺🇾" },
  { code: "CRI", label: "Costa Rica", flag: "🇨🇷" },
  { code: "PAN", label: "Panamá", flag: "🇵🇦" },
];

export const LANGUAGES: LanguageOption[] = [
  {
    code: "english",
    label: "Inglés",
    tagline: "El idioma que abre puertas en el mundo",
  },
  {
    code: "german",
    label: "Alemán",
    tagline: "Carrera, ingeniería y vida en Europa",
  },
  {
    code: "french",
    label: "Francés",
    tagline: "Cultura, gastronomía y diplomacia",
  },
  {
    code: "italian",
    label: "Italiano",
    tagline: "Arte, design y dolce vita",
  },
  {
    code: "portuguese",
    label: "Portugués",
    tagline: "Brasil, Portugal y el atlántico lusófono",
  },
];

/** Extras are agency add-ons (not Edvisor course prices). */
export const ACCOMMODATIONS: AccommodationOption[] = [
  {
    id: "none",
    label: "Sin alojamiento",
    description: "Ya tienes donde quedarte o lo gestionas por tu cuenta.",
    perWeekUsd: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "homestay",
    label: "Homestay / Familia",
    description: "Habitación privada, desayuno incluido, inmersión real.",
    perWeekUsd: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "residence",
    label: "Residencia estudiantil",
    description: "Habitación en residencia con cocina compartida y Wi‑Fi.",
    perWeekUsd: 220,
    imageUrl:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "studio",
    label: "Studio privado",
    description: "Apartamento estudio cerca del campus. Más independencia.",
    perWeekUsd: 320,
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  },
];

export const INSURANCE_OPTIONS: InsuranceOption[] = [
  {
    id: "none",
    label: "Sin seguro (por ahora)",
    description: "Puedes añadirlo después con tu asesor MPE.",
    flatUsd: 0,
  },
  {
    id: "guardme",
    label: "Guard.me Global Coverage",
    description: "Médico + viaje para toda la estancia. Recomendado.",
    flatUsd: 89,
  },
  {
    id: "premium",
    label: "Seguro premium + cancelación",
    description: "Incluye cancelación por enfermedad y cobertura ampliada.",
    flatUsd: 149,
  },
];

export const AIRPORT_OPTIONS: AirportOption[] = [
  {
    id: "none",
    label: "Sin recepción",
    description: "Llegas por tu cuenta (te enviamos indicaciones).",
    flatUsd: 0,
  },
  {
    id: "shared",
    label: "Traslado compartido",
    description: "Van compartida aeropuerto → alojamiento.",
    flatUsd: 45,
  },
  {
    id: "private",
    label: "Traslado privado",
    description: "Pickup privado con conductor que habla español/inglés.",
    flatUsd: 95,
  },
];

export const WEEK_OPTIONS = [4, 8, 12] as const;
export type WeekOption = (typeof WEEK_OPTIONS)[number];

export const PROGRAM_KIND_LABELS: Record<ProgramKind, string> = {
  general: "Idioma general",
  exam_prep: "Prep exámenes",
  plus30: "Idioma +30",
};

export function getDestination(id: string) {
  return DESTINATIONS.find((d) => d.id === id);
}

export function getProgram(id: string) {
  return PROGRAMS.find((p) => p.id === id);
}

export function suggestDestinations(language: LanguageCode): Destination[] {
  const matched = DESTINATIONS.filter((d) => d.languageCodes.includes(language));
  return [...matched].sort((a, b) => {
    const rank = { low: 0, medium: 1, high: 2 };
    return rank[a.visaFriction] - rank[b.visaFriction] || a.fromWeeklyUsd - b.fromWeeklyUsd;
  });
}

export function programsForDestination(
  destinationId: string,
  language: LanguageCode
): Program[] {
  return enabledPrograms(destinationId, language);
}

/** Programs enabled for destination + language (Edvisor prices, curation on/off). */
export function enabledPrograms(destinationId: string, language: LanguageCode): Program[] {
  const dest = getDestination(destinationId);
  if (!dest || !dest.languageCodes.includes(language)) return [];

  const all = PROGRAMS.filter((p) => p.enabled && p.destinationId === destinationId);

  if (language === "english") {
    return all.filter(
      (p) =>
        !/alemán|goethe|testdaf|francés|delf|italiano|español peninsular/i.test(p.title)
    );
  }
  if (language === "german") {
    return all.filter((p) => /alemán|goethe|testdaf/i.test(p.title));
  }
  if (language === "french") {
    return all.filter((p) => /francés|delf/i.test(p.title));
  }
  if (language === "italian") {
    return all.filter((p) => /italiano/i.test(p.title));
  }
  if (language === "portuguese") {
    // No inventar programas: si no hay oferta compatible, lista vacía.
    return all.filter((p) => /portugu[eé]s|brazilian|lisboa|portugal/i.test(p.title));
  }
  return all;
}
