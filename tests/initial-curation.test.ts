/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { EdvisorCatalog } from "@marco-polo/experience-edvisor";
import {
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
      id: "edv-mt-st-julians",
      country: "Malta",
      city: "St. Julians",
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
  ],
  schools: [
    {
      id: "edv-school-1",
      name: "ILSC Vancouver",
      email: "a@x.com",
      destinationId: "edv-ca-vancouver",
      complete: true,
      edvisorProviderId: "100",
    },
    {
      id: "edv-school-ilac",
      name: "ILAC Toronto",
      email: "b@x.com",
      destinationId: "edv-ca-vancouver",
      complete: true,
      edvisorProviderId: "999",
    },
    {
      id: "edv-school-gw",
      name: "Gateway School of English",
      email: "c@x.com",
      destinationId: "edv-mt-st-julians",
      complete: true,
      edvisorProviderId: "200",
    },
    {
      id: "edv-school-other",
      name: "Random School Toronto",
      email: "d@x.com",
      destinationId: "edv-ca-vancouver",
      complete: true,
      edvisorProviderId: "300",
    },
  ],
  programs: [
    {
      id: "p1",
      destinationId: "edv-ca-vancouver",
      schoolId: "edv-school-1",
      kind: "general",
      title: "GE",
      summary: "",
      lessonsPerWeek: 20,
      weeklyPriceUsd: 300,
      highlights: [],
      imageUrl: "",
      complete: true,
      currency: "USD",
      minWeeks: 1,
      maxWeeks: 52,
    },
    {
      id: "p-other",
      destinationId: "edv-ca-vancouver",
      schoolId: "edv-school-other",
      kind: "general",
      title: "Other",
      summary: "",
      lessonsPerWeek: 20,
      weeklyPriceUsd: 200,
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
  it("matches ILSC Vancouver and Gateway St. Julians, never ILAC", () => {
    const ilsc = sampleCatalog.schools[0]!;
    const ilac = sampleCatalog.schools[1]!;
    const gw = sampleCatalog.schools[2]!;
    expect(matchInitialCampus(ilsc, sampleCatalog)?.label).toContain("ILSC Vancouver");
    expect(matchInitialCampus(ilac, sampleCatalog)).toBeNull();
    expect(matchInitialCampus(gw, sampleCatalog)?.label).toContain("Gateway");
  });

  it("buildInitialCuration enables only matched complete schools + their programs", () => {
    const result = buildInitialCuration(sampleCatalog, "admin@marcopoloeducation.com");
    expect(result.curation.schools["edv-school-1"]).toBe(true);
    expect(result.curation.schools["edv-school-gw"]).toBe(true);
    expect(result.curation.schools["edv-school-ilac"]).toBeUndefined();
    expect(result.curation.schools["edv-school-other"]).toBeUndefined();
    expect(result.curation.programs["p1"]).toBe(true);
    expect(result.curation.programs["p-other"]).toBeUndefined();
  });
});
