/**
 * Exact quote service — single source for cotizador, propuestas, and checkout.
 * Live Edvisor when configured; otherwise informational-only (checkout blocked).
 */

import "server-only";

import { randomUUID } from "crypto";
import {
  edvisorApiV2Graphql,
  edvisorGatewayGraphql,
  isEdvisorApiConfigured,
  EdvisorApiError,
} from "@/lib/edvisor/clients";
import { getEdvisorAgencyId } from "@/lib/edvisor/hosts";
import { getCurationState } from "@/lib/edvisor/curation";
import { resolveEdvisorCatalog } from "@/lib/edvisor/resolve-catalog";
import { coalesceMoney, readMoney } from "@/lib/quotes/money";
import type {
  ExactQuote,
  QuoteInputs,
  QuoteLine,
  QuoteRequest,
} from "@/lib/quotes/types";
import { iso2FromUiNationality } from "@/lib/nationality";
import { supplierPaymentNotBefore } from "@/lib/rules/d14";

const QUOTE_TTL_MS = 30 * 60 * 1000;

const SEARCH_LANGUAGE_COURSES = `
query SearchLanguageCourses($filter: LanguageCourseSearchFilterInput) {
  searchLanguageCourses(filter: $filter) {
    offeringId
    schoolId
    tuitionPriceAmount
    tuitionPriceCurrency { code }
    promotionalPriceAmount
    promotionalPriceCurrency { code }
  }
}
`;

const GENERATE_QUOTE_PRICE = `
query GenerateQuotePrice($items: [FindPriceQuoteItemInput], $params: FindPriceQuoteParams) {
  generateQuotePrice(items: $items, params: $params) {
    total
    currency { code }
    items {
      __typename
      ... on CoursePriceItem {
        priceAmount
        originalPriceAmount
        currency { code }
        fees { priceAmount name currency { code } }
        discounts { amount name }
      }
    }
  }
}
`;

function quoteExpiry(from = new Date()): string {
  return new Date(from.getTime() + QUOTE_TTL_MS).toISOString();
}

function blockedQuote(
  inputs: QuoteInputs,
  reason: string,
  warnings: string[] = []
): ExactQuote {
  return {
    quoteId: `Q-BLOCK-${randomUUID().slice(0, 8)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    expiresAt: quoteExpiry(),
    inputs,
    currency: inputs.currency,
    lines: [],
    total: 0,
    courseSubtotal: 0,
    warnings,
    checkoutAllowed: false,
    blockReason: reason,
    providerRefs: {},
  };
}

async function assertPurchasable(programId: string, schoolId: string): Promise<
  | { ok: true }
  | { ok: false; reason: string }
> {
  const curation = await getCurationState();
  const schoolEnabled = curation.schools[schoolId] === true;
  const programEnabled = curation.programs[programId] === true;
  if (!schoolEnabled || !programEnabled) {
    return {
      ok: false,
      reason:
        "Producto no habilitado por administración. No se puede cotizar para compra.",
    };
  }
  return { ok: true };
}

/**
 * Create an exact quote. Prefer Gateway tuition + API v2 fees.
 * Never invents chargeable prices from min(USD)×weeks.
 */
export async function createExactQuote(
  request: QuoteRequest
): Promise<ExactQuote> {
  const nationalityIso2 =
    request.nationalityIso2.length === 2
      ? request.nationalityIso2.toUpperCase()
      : iso2FromUiNationality(request.nationalityIso2) ?? "";

  const inputs: QuoteInputs = {
    ...request,
    nationalityIso2,
  };

  if (!nationalityIso2) {
    return blockedQuote(
      inputs,
      "Nacionalidad ISO requerida; no se asume un país por defecto."
    );
  }
  if (!request.programId || !request.schoolId || !request.offeringId) {
    return blockedQuote(inputs, "Faltan identificadores de programa/escuela/offering.");
  }
  if (!request.startDate || !request.weeks || request.weeks < 1) {
    return blockedQuote(inputs, "Fechas/duración inválidas.");
  }
  if (request.studentAge == null || request.studentAge < 1) {
    return blockedQuote(inputs, "Edad del estudiante requerida; no se infiere.");
  }

  const purchasable = await assertPurchasable(request.programId, request.schoolId);
  if (!purchasable.ok) {
    return blockedQuote(inputs, purchasable.reason);
  }

  if (request.travelDepartureDate) {
    const notBefore = supplierPaymentNotBefore(request.travelDepartureDate);
    // Quote itself is allowed; D-14 gates supplier payouts later.
    void notBefore;
  }

  const requireLive = request.requireLive !== false;
  if (!isEdvisorApiConfigured()) {
    const informational = await informationalFromCatalog(inputs);
    if (requireLive) {
      return {
        ...informational,
        checkoutAllowed: false,
        blockReason:
          "EDVISOR_API_KEY no configurada. Cotización informativa solamente; checkout bloqueado.",
      };
    }
    return informational;
  }

  const warnings: string[] = [];
  const lines: QuoteLine[] = [];
  const providerRefs: ExactQuote["providerRefs"] = {};
  let currency = inputs.currency.toUpperCase() || "USD";

  try {
    const agencyId = getEdvisorAgencyId();
    const offeringNum = Number(String(inputs.offeringId).replace(/\D/g, ""));
    const schoolNum = Number(String(inputs.schoolId).replace(/\D/g, ""));

    // Gateway: tuition + promotion
    try {
      const gatewayData = await edvisorGatewayGraphql<{
        searchLanguageCourses?: Array<{
          offeringId?: number;
          schoolId?: number;
          tuitionPriceAmount?: number | null;
          tuitionPriceCurrency?: { code?: string } | null;
          promotionalPriceAmount?: number | null;
          promotionalPriceCurrency?: { code?: string } | null;
        }>;
      }>(SEARCH_LANGUAGE_COURSES, {
        filter: {
          offeringIds: Number.isFinite(offeringNum) ? [offeringNum] : undefined,
          schoolIds: Number.isFinite(schoolNum) ? [schoolNum] : undefined,
          startDate: inputs.startDate,
          durationWeeks: inputs.weeks,
          ...(agencyId ? { agencyId } : {}),
        },
      });

      const row =
        gatewayData.searchLanguageCourses?.find(
          (r) => r.offeringId === offeringNum
        ) ?? gatewayData.searchLanguageCourses?.[0];

      if (!row) {
        return blockedQuote(
          inputs,
          "Gateway no devolvió tuition para este offering/fechas.",
          warnings
        );
      }

      const tuitionCur =
        row.tuitionPriceCurrency?.code?.toUpperCase() || currency;
      const promoCur =
        row.promotionalPriceCurrency?.code?.toUpperCase() || tuitionCur;
      currency = tuitionCur;

      const original = readMoney(row.tuitionPriceAmount);
      const promo = readMoney(row.promotionalPriceAmount);

      if (original.kind === "absent" || original.kind === "invalid") {
        return blockedQuote(
          inputs,
          "Tuition ausente o inválido en Gateway.",
          warnings
        );
      }

      lines.push({
        kind: "tuition_original",
        label: "Tuition (tarifa lista)",
        amount: original.amount,
        currency: tuitionCur,
        source: "edvisor-gateway",
        providerRef: String(row.offeringId ?? offeringNum),
      });

      let tuitionFinal = original.amount;
      if (promo.kind === "present" || promo.kind === "zero") {
        if (promoCur !== tuitionCur) {
          return blockedQuote(
            inputs,
            `Moneda de promoción (${promoCur}) distinta de tuition (${tuitionCur}).`,
            warnings
          );
        }
        const savings = original.amount - promo.amount;
        if (savings > 0) {
          lines.push({
            kind: "tuition_promotion",
            label: "Promoción de tuition",
            amount: -savings,
            currency: tuitionCur,
            source: "edvisor-gateway",
          });
        }
        tuitionFinal = promo.amount;
      }

      lines.push({
        kind: "tuition_final",
        label: "Tuition final",
        amount: tuitionFinal,
        currency: tuitionCur,
        source: "edvisor-gateway",
      });
      providerRefs.gatewayTuition = String(row.offeringId ?? offeringNum);
    } catch (err) {
      const msg =
        err instanceof EdvisorApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Gateway error";
      return blockedQuote(
        inputs,
        `No se pudo obtener tuition del Gateway: ${msg}`,
        warnings
      );
    }

    // API v2: fees / materials (do NOT re-add tuition)
    try {
      const v2 = await edvisorApiV2Graphql<{
        generateQuotePrice?: {
          total?: number | null;
          currency?: { code?: string } | null;
          items?: Array<{
            __typename?: string;
            priceAmount?: number | null;
            originalPriceAmount?: number | null;
            currency?: { code?: string } | null;
            fees?: Array<{
              priceAmount?: number | null;
              name?: string | null;
              currency?: { code?: string } | null;
            } | null>;
            discounts?: Array<{
              amount?: number | null;
              name?: string | null;
            } | null>;
          }>;
        };
      }>(GENERATE_QUOTE_PRICE, {
        items: [
          {
            offeringId: offeringNum,
            durationAmount: inputs.weeks,
            startDate: inputs.startDate,
          },
        ],
        params: {
          exactStudentAge: inputs.studentAge,
          ...(agencyId ? { agencyId } : {}),
        },
      });

      const quote = v2.generateQuotePrice;
      if (!quote) {
        warnings.push("generateQuotePrice vacío; se usan solo líneas Gateway.");
      } else {
        providerRefs.apiV2Quote = "generateQuotePrice";
        const feeCur = quote.currency?.code?.toUpperCase();
        if (feeCur && feeCur !== currency) {
          return blockedQuote(
            inputs,
            `Moneda API v2 (${feeCur}) distinta de Gateway (${currency}).`,
            warnings
          );
        }
        for (const item of quote.items ?? []) {
          for (const fee of item.fees ?? []) {
            if (!fee) continue;
            const m = coalesceMoney(fee.priceAmount, null);
            if (m.kind === "absent") continue;
            if (m.kind === "invalid") {
              return blockedQuote(inputs, `Fee inválido: ${fee.name}`, warnings);
            }
            const fCur = fee.currency?.code?.toUpperCase() || currency;
            if (fCur !== currency) {
              return blockedQuote(
                inputs,
                `Fee currency mismatch ${fCur} vs ${currency}`,
                warnings
              );
            }
            const label = (fee.name || "Cargo").toLowerCase();
            const kind =
              /regist|inscrip|enrol/i.test(label)
                ? "registration_fee"
                : /material|book|libro/i.test(label)
                  ? /book|libro/i.test(label)
                    ? "books"
                    : "materials"
                  : "other_mandatory";
            lines.push({
              kind,
              label: fee.name || "Cargo",
              amount: m.amount,
              currency: fCur,
              source: "edvisor-api-v2",
            });
          }
        }
      }
    } catch (err) {
      const msg =
        err instanceof EdvisorApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "API v2 error";
      // Fees missing is a hard block for checkout (incomplete monetary data)
      return blockedQuote(
        inputs,
        `Cargos API v2 no disponibles: ${msg}`,
        warnings
      );
    }

    // Add-ons: only when concrete offering IDs provided — no generic local flats for checkout
    if (inputs.accommodationOfferingId && inputs.accommodationOfferingId !== "none") {
      warnings.push(
        "Alojamiento solicitado: precio exacto pendiente de accommodationPrice (Gateway)."
      );
      return blockedQuote(
        inputs,
        "Alojamiento requiere precio Gateway accommodationPrice verificado antes de cobrar.",
        warnings
      );
    }
    if (inputs.insuranceOfferingId && inputs.insuranceOfferingId !== "none") {
      warnings.push(
        "Seguro solicitado: precio exacto Edvisor pendiente de verificación."
      );
      return blockedQuote(
        inputs,
        "Seguro requiere precio Edvisor verificado antes de cobrar.",
        warnings
      );
    }
    if (inputs.airportOfferingId && inputs.airportOfferingId !== "none") {
      return blockedQuote(
        inputs,
        "Recepción requiere precio Edvisor verificado antes de cobrar.",
        warnings
      );
    }

    const tuitionFinalLine = lines.find((l) => l.kind === "tuition_final");
    const feeLines = lines.filter((l) =>
      ["registration_fee", "materials", "books", "other_mandatory"].includes(
        l.kind
      )
    );
    const courseSubtotal =
      (tuitionFinalLine?.amount ?? 0) +
      feeLines.reduce((s, l) => s + l.amount, 0);
    const total = courseSubtotal;

    if (total <= 0 && (tuitionFinalLine?.amount ?? 0) !== 0) {
      return blockedQuote(inputs, "Total inválido tras composición.", warnings);
    }

    return {
      quoteId: `Q-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      expiresAt: quoteExpiry(),
      inputs,
      currency,
      lines,
      total,
      courseSubtotal,
      warnings,
      checkoutAllowed: true,
      providerRefs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Quote failed";
    return blockedQuote(inputs, msg, warnings);
  }
}

/** Catalog-only informational quote — never checkoutAllowed. */
async function informationalFromCatalog(
  inputs: QuoteInputs
): Promise<ExactQuote> {
  const { catalog } = await resolveEdvisorCatalog();
  const program = catalog.programs.find((p) => p.id === inputs.programId);
  const weekly = program?.weeklyPriceUsd;
  const m = readMoney(weekly);
  if (m.kind !== "present") {
    return blockedQuote(
      inputs,
      "Sin precio de catálogo utilizable; checkout bloqueado."
    );
  }
  const informationalTotal = m.amount * inputs.weeks;
  const lines: QuoteLine[] = [
    {
      kind: "tuition_original",
      label: "Tuition informativo (catálogo · no cobrable)",
      amount: informationalTotal,
      currency: "USD",
      source: "catalog-informational",
    },
  ];
  return {
    quoteId: `Q-INFO-${randomUUID().slice(0, 8)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    expiresAt: quoteExpiry(),
    inputs,
    currency: "USD",
    lines,
    total: informationalTotal,
    courseSubtotal: informationalTotal,
    warnings: [
      "Precio informativo del catálogo. No usar para cobro hasta cotización Edvisor exacta.",
    ],
    checkoutAllowed: false,
    blockReason: "Cotización informativa — checkout bloqueado sin Edvisor live.",
    providerRefs: {},
    informationalWeekly: m.amount,
  };
}
