/** Client-safe helpers for the public curated catalog (/api/catalog). */

import type { Destination, LanguageCode, Program } from "@/lib/data/types";

export type PublicSchool = {
  id: string;
  name: string;
  email?: string;
  destinationId: string;
  complete?: boolean;
  edvisorProviderId?: string;
  enabled: boolean;
};

export type PublicCatalog = {
  source: string;
  sourceLabel: string;
  metaNote?: string;
  destinations: Destination[];
  programs: Program[];
  schools: PublicSchool[];
};

export async function fetchPublicCatalog(): Promise<PublicCatalog> {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Catalog HTTP ${res.status}`);
  }
  const data = (await res.json()) as PublicCatalog;
  return {
    source: data.source ?? "edvisor",
    sourceLabel: data.sourceLabel ?? "edvisor",
    metaNote: data.metaNote,
    destinations: Array.isArray(data.destinations) ? data.destinations : [],
    programs: Array.isArray(data.programs) ? data.programs : [],
    schools: Array.isArray(data.schools) ? data.schools : [],
  };
}

export function suggestDestinationsFromCatalog(
  destinations: Destination[],
  language: LanguageCode
): Destination[] {
  const matched = destinations.filter((d) => d.languageCodes?.includes(language));
  return [...matched].sort((a, b) => {
    const rank = { low: 0, medium: 1, high: 2 } as const;
    return (
      rank[a.visaFriction] - rank[b.visaFriction] ||
      (a.fromWeeklyUsd ?? 0) - (b.fromWeeklyUsd ?? 0)
    );
  });
}

export function enabledProgramsFromCatalog(
  destinations: Destination[],
  programs: Program[],
  destinationId: string,
  language: LanguageCode
): Program[] {
  const dest = destinations.find((d) => d.id === destinationId);
  if (!dest || !dest.languageCodes?.includes(language)) return [];

  const all = programs.filter(
    (p) => p.enabled && p.destinationId === destinationId
  );

  if (language === "english") {
    return all.filter(
      (p) =>
        !/alemán|goethe|testdaf|francés|delf|italiano|español peninsular/i.test(
          p.title
        )
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
    return all.filter((p) =>
      /portugu[eé]s|brazilian|lisboa|portugal/i.test(p.title)
    );
  }
  return all;
}

export function destLineFromCatalog(destinations: Destination[]): string {
  const cities = destinations.map((d) => d.city).filter(Boolean);
  if (cities.length === 0) return "Destinos curados en vivo";
  if (cities.length <= 4) return cities.join(" · ");
  return `${cities.slice(0, 3).join(" · ")} · y más`;
}
