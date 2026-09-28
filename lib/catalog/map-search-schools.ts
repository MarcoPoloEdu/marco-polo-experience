/**
 * Map public /api/catalog schools+destinations → search browse cards.
 * Links into BookingWizard (exact quote stays /api/quotes).
 */

import type { Destination } from "@/lib/data/types";
import type { PublicSchool } from "@/lib/catalog/public-catalog";

export type LiveSearchSchool = {
  id: string;
  name: string;
  city: string;
  country: string;
  language: string;
  languageLabel: string;
  imageUrl: string;
  destinationId: string;
  /** Cotizador deep-link */
  href: string;
  /** Catalog hint only — not charge SoT */
  weeklyHintUsd: number;
  programCount: number;
};

const LANGUAGE_LABELS: Record<string, string> = {
  english: "Inglés",
  french: "Francés",
  german: "Alemán",
  italian: "Italiano",
  portuguese: "Portugués",
};

export function languageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}

export function mapCatalogToSearchSchools(input: {
  schools: PublicSchool[];
  destinations: Destination[];
  programs?: { destinationId: string; enabled?: boolean; weeklyUsd?: number }[];
}): LiveSearchSchool[] {
  const destById = new Map(input.destinations.map((d) => [d.id, d]));
  const programs = input.programs ?? [];

  return input.schools
    .filter((s) => s.enabled !== false)
    .map((school) => {
      const dest = destById.get(school.destinationId);
      const language = dest?.languageCodes?.[0] ?? "english";
      const destPrograms = programs.filter(
        (p) => p.destinationId === school.destinationId && p.enabled !== false
      );
      const priced = destPrograms
        .map((p) => p.weeklyUsd ?? 0)
        .filter((n) => n > 0);
      const weeklyHintUsd = priced.length ? Math.min(...priced) : 0;

      const params = new URLSearchParams({
        book: "1",
        language,
        destination: school.destinationId,
      });

      return {
        id: school.id,
        name: school.name,
        city: dest?.city ?? "—",
        country: dest?.country ?? "—",
        language,
        languageLabel: languageLabel(language),
        imageUrl:
          dest?.imageUrl ||
          dest?.heroUrl ||
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
        destinationId: school.destinationId,
        href: `/?${params.toString()}`,
        weeklyHintUsd,
        programCount: destPrograms.length,
      };
    })
    .sort((a, b) =>
      a.country.localeCompare(b.country, "es") || a.city.localeCompare(b.city, "es")
    );
}
