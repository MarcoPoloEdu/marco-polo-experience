/**
 * Money helpers — distinguish missing / invalid / valid zero.
 * Keep decimal precision during calc; minor units for Stripe.
 */

export type MoneyAmount = {
  /** Decimal major units (e.g. 199.50 CAD) */
  amount: number;
  currency: string;
  /** ISO 4217 exponent override; default 2 */
  exponent?: number;
};

export type MoneyPresence =
  | { kind: "present"; amount: number }
  | { kind: "zero"; amount: 0 }
  | { kind: "absent" }
  | { kind: "invalid"; reason: string };

export function readMoney(value: unknown): MoneyPresence {
  if (value === null || value === undefined) return { kind: "absent" };
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { kind: "invalid", reason: "not a finite number" };
  }
  if (value === 0) return { kind: "zero", amount: 0 };
  if (value < 0) return { kind: "invalid", reason: "negative" };
  return { kind: "present", amount: value };
}

/** Do not use `value || fallback` when zero is legitimate. */
export function coalesceMoney(
  primary: unknown,
  secondary: unknown
): MoneyPresence {
  const a = readMoney(primary);
  if (a.kind === "present" || a.kind === "zero") return a;
  return readMoney(secondary);
}

export function currencyExponent(currency: string): number {
  const c = currency.toUpperCase();
  // Zero-decimal currencies commonly used with Stripe
  if (["JPY", "KRW", "CLP", "VND", "XAF", "XOF"].includes(c)) return 0;
  if (["BHD", "JOD", "KWD", "OMR", "TND"].includes(c)) return 3;
  return 2;
}

export function toMinorUnits(amount: number, currency: string): number {
  const exp = currencyExponent(currency);
  const factor = 10 ** exp;
  return Math.round(amount * factor);
}

export function fromMinorUnits(minor: number, currency: string): number {
  const exp = currencyExponent(currency);
  return minor / 10 ** exp;
}

export function assertSameCurrency(lines: Array<{ currency: string }>): string {
  if (!lines.length) throw new Error("No currency lines");
  const first = lines[0]!.currency.toUpperCase();
  for (const line of lines) {
    if (line.currency.toUpperCase() !== first) {
      throw new Error(
        `Currency mismatch: ${line.currency} vs ${first}`
      );
    }
  }
  return first;
}
