/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CurationLimitError,
  MAX_ENABLED_SCHOOLS_PER_COUNTRY,
  assertCanEnableSchoolInCountry,
  countEnabledSchoolsInCountry,
  isDestinationEnabled,
  type CurationState,
  type SchoolCountryLookup,
} from "@/lib/edvisor/curation";

const schools: SchoolCountryLookup[] = [
  {
    schoolId: "s1",
    destinationId: "d-van",
    countryKey: "CA",
    countryLabel: "Canada",
  },
  {
    schoolId: "s2",
    destinationId: "d-tor",
    countryKey: "CA",
    countryLabel: "Canada",
  },
  {
    schoolId: "s3",
    destinationId: "d-mtl",
    countryKey: "CA",
    countryLabel: "Canada",
  },
  {
    schoolId: "s4",
    destinationId: "d-cal",
    countryKey: "CA",
    countryLabel: "Canada",
  },
  {
    schoolId: "s-mt",
    destinationId: "d-malta",
    countryKey: "MT",
    countryLabel: "Malta",
  },
];

describe("max 3 schools per country", () => {
  it("exports phase-A cap of 3", () => {
    expect(MAX_ENABLED_SCHOOLS_PER_COUNTRY).toBe(3);
  });

  it("counts enabled schools in the same country", () => {
    const curation: CurationState = {
      schools: { s1: true, s2: true, s3: false, "s-mt": true },
      programs: {},
    };
    expect(countEnabledSchoolsInCountry(curation, "CA", schools)).toBe(2);
    expect(countEnabledSchoolsInCountry(curation, "MT", schools)).toBe(1);
  });

  it("allows enabling up to the cap", () => {
    const curation: CurationState = {
      schools: { s1: true, s2: true },
      programs: {},
    };
    expect(() =>
      assertCanEnableSchoolInCountry(curation, schools[2]!, schools)
    ).not.toThrow();
  });

  it("throws a clear error when enabling would exceed the cap", () => {
    const curation: CurationState = {
      schools: { s1: true, s2: true, s3: true },
      programs: {},
    };
    expect(() =>
      assertCanEnableSchoolInCountry(curation, schools[3]!, schools)
    ).toThrow(CurationLimitError);
    try {
      assertCanEnableSchoolInCountry(curation, schools[3]!, schools);
    } catch (err) {
      expect(err).toBeInstanceOf(CurationLimitError);
      const e = err as CurationLimitError;
      expect(e.code).toBe("MAX_SCHOOLS_PER_COUNTRY");
      expect(e.message).toMatch(/Máximo 3 escuelas/i);
      expect(e.message).toMatch(/Canada/i);
    }
  });

  it("does not block a different country", () => {
    const curation: CurationState = {
      schools: { s1: true, s2: true, s3: true },
      programs: {},
    };
    expect(() =>
      assertCanEnableSchoolInCountry(curation, schools[4]!, schools)
    ).not.toThrow();
  });

  it("does not block re-enabling an already-on school", () => {
    const curation: CurationState = {
      schools: { s1: true, s2: true, s3: true },
      programs: {},
    };
    expect(() =>
      assertCanEnableSchoolInCountry(curation, schools[0]!, schools)
    ).not.toThrow();
  });
});

describe("destination enablement", () => {
  it("uses explicit destination flags when present", () => {
    const curation: CurationState = {
      schools: { s1: true },
      programs: {},
      destinations: { "d-van": true, "d-tor": false },
    };
    expect(isDestinationEnabled(curation, "d-van", true)).toBe(true);
    expect(isDestinationEnabled(curation, "d-tor", true)).toBe(false);
  });

  it("falls back to enabled-school presence for legacy curation", () => {
    const curation: CurationState = {
      schools: { s1: true },
      programs: {},
      destinations: {},
    };
    expect(isDestinationEnabled(curation, "d-van", true)).toBe(true);
    expect(isDestinationEnabled(curation, "d-empty", false)).toBe(false);
  });
});
