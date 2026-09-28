/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { EdvisorCatalog } from "@marco-polo/experience-edvisor";
import {
  KNOWN_INITIAL_SCHOOL_IDS,
  buildInitialCuration,
  matchInitialCampus,
} from "@/lib/edvisor/initial-curation";

const sampleCatalog: EdvisorCatalog = {
  meta: {
    source: "test",
    version: "0",
    exportedAt: new Date().toISOString(),
  },
  destinations: [
    {
      id: "edv-ca-vancouver",
      country: "Canada",
      city: "Vancouver",
      countryCode: "CA",
      languageCodes: ["english"],
      imageUrl: "",
      heroUrl: "",
      tagline: "",
      blurb: "",
      vibe: [],
      visaFriction: "medium",
      fromWeeklyUsd: 0,
    },
    {
      id: "edv-mt-san-gwann",
      country: "Malta",
      city: "San Gwann",
      countryCode: "MT",
      languageCodes: ["english"],
      imageUrl: "",
      heroUrl: "",
      tagline: "",
      blurb: "",
      vibe: [],
      visaFriction: "low",
      fromWeeklyUsd: 0,
    },
    {
      id: "edv-ca-toronto",
      country: "Canada",
      city: "Toronto",
      countryCode: "CA",
      languageCodes: ["english"],
      imageUrl: "",
      heroUrl: "",
      tagline: "",
      blurb: "",
      vibe: [],
      visaFriction: "medium",
      fromWeeklyUsd: 0,
    },
  ],
  schools: [
    {
      id: "edv-school-54",
      name: "ILSC - Vancouver",
      email: "a@x.com",
      destinationId: "edv-ca-vancouver",
      complete: true,
      edvisorProviderId: "54",
    },
    {
      id: "edv-school-junior",
      name: "ILSC Junior Programs - Toronto",
      email: "j@x.com",
      destinationId: "edv-ca-toronto",
      complete: true,
      edvisorProviderId: "3167",
    },
    {
      id: "edv-school-ilac",
      name: "ILAC Toronto",
      email: "b@x.com",
      destinationId: "edv-ca-toronto",
      complete: true,
      edvisorProviderId: "999",
    },
    {
      id: "edv-school-gw",
      name: "Gateway School of English GSE",
      email: "c@x.com",
      destinationId: "edv-mt-san-gwann",
      complete: true,
      edvisorProviderId: "3846",
    },
    {
      id: "edv-school-gw-junior",
      name: "Gateway School of English - Junior",
      email: "cj@x.com",
      destinationId: "edv-mt-san-gwann",
      complete: true,
      edvisorProviderId: "4839",
    },
  ],
  programs: [
    {
      id: "p1",
      destinationId: "edv-ca-vancouver",
      schoolId: "edv-school-54",
      kind: "general",
      title: "GE",
      summary: "",
      lessonsPerWeek: 20,
      weeklyPriceUsd: 300,
      highlights: [],
      imageUrl: "",
      complete: false,
      currency: "USD",
      minWeeks: 1,
      maxWeeks: 52,
    },
    {
      id: "p-no-price",
      destinationId: "edv-ca-vancouver",
      schoolId: "edv-school-54",
      kind: "general",
      title: "No price",
      summary: "",
      lessonsPerWeek: 20,
      weeklyPriceUsd: 0,
      highlights: [],
      imageUrl: "",
      complete: false,
      currency: "USD",
      minWeeks: 1,
      maxWeeks: 52,
    },
    {
      id: "p-junior",
      destinationId: "edv-ca-toronto",
      schoolId: "edv-school-junior",
      kind: "general",
      title: "Junior camp",
      summary: "",
      lessonsPerWeek: 20,
      weeklyPriceUsd: 400,
      highlights: [],
      imageUrl: "",
      complete: true,
      currency: "USD",
      minWeeks: 1,
      maxWeeks: 52,
    },
  ],
  services: [],
};

describe("initial curation set", () => {
  it("seeds known adult ids 54/114/115/3846", () => {
    expect(KNOWN_INITIAL_SCHOOL_IDS.sort((a, b) => a - b)).toEqual([
      54, 114, 115, 3846,
    ]);
  });

  it("matches adults by id; excludes Junior and ILAC", () => {
    expect(matchInitialCampus(sampleCatalog.schools[0]!, sampleCatalog)?.label).toContain(
      "ILSC Vancouver"
    );
    expect(matchInitialCampus(sampleCatalog.schools[1]!, sampleCatalog)).toBeNull();
    expect(matchInitialCampus(sampleCatalog.schools[2]!, sampleCatalog)).toBeNull();
    expect(matchInitialCampus(sampleCatalog.schools[3]!, sampleCatalog)?.label).toContain(
      "Gateway"
    );
    expect(matchInitialCampus(sampleCatalog.schools[4]!, sampleCatalog)).toBeNull();
  });

  it("enables ALL programs under enabled schools (no weeklyPrice gate)", () => {
    const result = buildInitialCuration(sampleCatalog, "admin@marcopoloeducation.com");
    expect(result.curation.schools["edv-school-54"]).toBe(true);
    expect(result.curation.schools["edv-school-gw"]).toBe(true);
    expect(result.curation.schools["edv-school-junior"]).toBeUndefined();
    expect(result.curation.programs["p1"]).toBe(true);
    expect(result.curation.programs["p-no-price"]).toBe(true);
    expect(result.curation.programs["p-junior"]).toBeUndefined();
    expect(result.curation.destinations?.["edv-ca-vancouver"]).toBe(true);
    expect(result.programsEnabled).toBe(2);
  });
});
