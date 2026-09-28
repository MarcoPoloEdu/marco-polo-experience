/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Edvisor catalog services field", () => {
  it("vendor load normalizes missing services to []", async () => {
    const { loadEdvisorCatalog } = await import("@marco-polo/experience-edvisor");
    const catalog = loadEdvisorCatalog();
    expect(Array.isArray(catalog.services)).toBe(true);
    expect(catalog.destinations.length).toBeGreaterThan(0);
    expect(catalog.schools.length).toBeGreaterThan(0);
  });
});
