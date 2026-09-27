import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readMoney, coalesceMoney, toMinorUnits } from "@/lib/quotes/money";
import {
  supplierPaymentNotBefore,
  isSupplierPaymentAllowed,
} from "@/lib/rules/d14";
import { iso2FromUiNationality } from "@/lib/nationality";
import { isProgramEnabled, isSchoolEnabled } from "@/lib/edvisor/curation";

describe("money presence", () => {
  it("distinguishes zero from absent", () => {
    expect(readMoney(0)).toEqual({ kind: "zero", amount: 0 });
    expect(readMoney(null).kind).toBe("absent");
    expect(readMoney(undefined).kind).toBe("absent");
    expect(readMoney(12.5)).toEqual({ kind: "present", amount: 12.5 });
  });

  it("does not treat zero as missing when coalescing", () => {
    expect(coalesceMoney(0, 99)).toEqual({ kind: "zero", amount: 0 });
    expect(coalesceMoney(null, 99)).toEqual({ kind: "present", amount: 99 });
  });

  it("converts minor units with currency exponent", () => {
    expect(toMinorUnits(10.5, "USD")).toBe(1050);
    expect(toMinorUnits(1000, "JPY")).toBe(1000);
  });
});

describe("D-14 supplier payment window", () => {
  it("computes not-before as departure minus 14 calendar days", () => {
    expect(supplierPaymentNotBefore("2026-10-20")).toBe("2026-10-06");
  });

  it("allows payment on/after not-before", () => {
    expect(isSupplierPaymentAllowed("2026-10-20", "2026-10-06")).toBe(true);
    expect(isSupplierPaymentAllowed("2026-10-20", "2026-10-05")).toBe(false);
  });
});

describe("nationality mapping", () => {
  it("maps UI codes to ISO2 without defaulting", () => {
    expect(iso2FromUiNationality("COL")).toBe("CO");
    expect(iso2FromUiNationality("MEX")).toBe("MX");
    expect(iso2FromUiNationality("ZZZ")).toBeNull();
  });
});

describe("curation defaults", () => {
  it("treats missing keys as disabled", () => {
    const curation = { schools: {}, programs: {} };
    expect(isSchoolEnabled(curation, "edv-school-1")).toBe(false);
    expect(isProgramEnabled(curation, "edv-offering-1")).toBe(false);
    expect(
      isSchoolEnabled({ schools: { a: true }, programs: {} }, "a")
    ).toBe(true);
  });
});
