/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EDVISOR_DURATION_TERM,
  EDVISOR_DURATION_WEEK,
  isShortLanguageCourse,
} from "@/lib/edvisor/live-sync";

describe("isShortLanguageCourse", () => {
  it("keeps COURSE with WEEK durationTypeId 3", () => {
    expect(
      isShortLanguageCourse({
        offeringId: 1,
        schoolId: 114,
        offeringType: { codeName: "COURSE" },
        offeringCourse: {
          name: "General English",
          prices: [
            {
              durationTypeId: EDVISOR_DURATION_WEEK,
              originalPriceUsd: 320,
              amountIsPerDuration: true,
              durationAmount: 1,
            },
          ],
        },
      })
    ).toBe(true);
  });

  it("rejects TERM-only (durationTypeId 9) courses", () => {
    expect(
      isShortLanguageCourse({
        offeringId: 2,
        schoolId: 114,
        offeringType: { codeName: "COURSE" },
        offeringCourse: {
          name: "Academic Year",
          prices: [
            {
              durationTypeId: EDVISOR_DURATION_TERM,
              originalPriceUsd: 9000,
              durationAmount: 1,
            },
          ],
        },
      })
    ).toBe(false);
  });

  it("rejects university / pathway / high school titles", () => {
    expect(
      isShortLanguageCourse({
        offeringId: 3,
        schoolId: 1,
        offeringType: { codeName: "COURSE" },
        offeringCourse: {
          name: "University Pathway Program",
          prices: [{ durationTypeId: EDVISOR_DURATION_WEEK, originalPriceUsd: 400 }],
        },
      })
    ).toBe(false);
    expect(
      isShortLanguageCourse({
        offeringId: 4,
        schoolId: 1,
        offeringType: { codeName: "COURSE" },
        offeringCourse: {
          name: "High School Diploma",
          prices: [{ durationTypeId: EDVISOR_DURATION_WEEK, originalPriceUsd: 400 }],
        },
      })
    ).toBe(false);
  });
});
