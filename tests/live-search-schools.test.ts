/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { mapCatalogToSearchSchools } from "@/lib/catalog/map-search-schools";
import type { Destination } from "@/lib/data/types";
import type { PublicSchool } from "@/lib/catalog/public-catalog";

const destinations: Destination[] = [
  {
    id: "edv-ca-vancouver",
    country: "Canada",
    city: "Vancouver",
    languageCodes: ["english"],
    imageUrl: "https://example.com/van.jpg",
    heroUrl: "https://example.com/van-h.jpg",
    tagline: "Idiomas en Vancouver",
    blurb: "…",
    vibe: ["Edvisor"],
    visaFriction: "medium",
    fromWeeklyUsd: 0,
  },
  {
    id: "edv-mt-san-gwann",
    country: "Malta",
    city: "San Gwann",
    languageCodes: ["english"],
    imageUrl: "https://example.com/mt.jpg",
    heroUrl: "https://example.com/mt-h.jpg",
    tagline: "Idiomas en San Gwann",
    blurb: "…",
    vibe: ["Edvisor"],
    visaFriction: "medium",
    fromWeeklyUsd: 0,
  },
];

const schools: PublicSchool[] = [
  {
    id: "edv-school-54",
    name: "ILSC - Vancouver",
    destinationId: "edv-ca-vancouver",
    enabled: true,
  },
  {
    id: "edv-school-3846",
    name: "Gateway School of English GSE",
    destinationId: "edv-mt-san-gwann",
    enabled: true,
  },
];

describe("mapCatalogToSearchSchools", () => {
  it("maps live schools to cotizador deep-links (no berlin/london)", () => {
    const rows = mapCatalogToSearchSchools({ schools, destinations, programs: [] });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.city).sort()).toEqual(["San Gwann", "Vancouver"]);
    expect(rows.every((r) => r.href.startsWith("/?book=1"))).toBe(true);
    expect(rows.every((r) => !/berlin|london|valletta/i.test(r.href))).toBe(
      true
    );
    expect(rows.every((r) => !/berlin|london|londres|valeta/i.test(r.city))).toBe(
      true
    );
  });

  it("skips disabled schools", () => {
    const rows = mapCatalogToSearchSchools({
      schools: [
        ...schools,
        {
          id: "x",
          name: "Off",
          destinationId: "edv-ca-vancouver",
          enabled: false,
        },
      ],
      destinations,
    });
    expect(rows).toHaveLength(2);
  });
});
