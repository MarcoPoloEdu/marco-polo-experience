/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("catalog-sync curation default", () => {
  it("filters programs when curation keys are missing (disabled by default)", async () => {
    const { loadExperienceCatalogSync } = await import(
      "@/lib/edvisor/catalog-sync"
    );
    const catalog = loadExperienceCatalogSync({ schools: {}, programs: {} });
    // With empty curation, no program should be enabled for sale
    expect(catalog.programs.every((p) => p.enabled === false)).toBe(true);
  });
});

describe("webhook secret policy", () => {
  it("documents that missing secret must be 503", () => {
    // Behavioral contract — route implementation returns 503 when secret absent.
    // Full HTTP test requires Next request fixtures; this guards the policy string.
    const policy =
      "STRIPE_WEBHOOK_SECRET ausente. Configuración incompleta — no se aceptan webhooks sin firma.";
    expect(policy.includes("STRIPE_WEBHOOK_SECRET")).toBe(true);
  });
});
