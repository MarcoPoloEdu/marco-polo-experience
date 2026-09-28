import { LiveSearchResults } from "@/components/search/LiveSearchResults";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { mapCatalogToSearchSchools } from "@/lib/catalog/map-search-schools";
import { loadExperienceCatalog } from "@/lib/edvisor/client";
import { VISA_DISCLAIMER } from "@/lib/data/visa-rules";
import type { PublicSchool } from "@/lib/catalog/public-catalog";

export const runtime = "nodejs";

/** /search — live enabled schools from Edvisor curation (no Berlin/London seed). */
export default async function SearchPage() {
  const catalog = await loadExperienceCatalog();
  const schoolsRaw = catalog.schools.filter((s) => s.enabled);
  const programs = catalog.programs.filter((p) => p.enabled);
  const enabledSchoolDestIds = new Set(schoolsRaw.map((s) => s.destinationId));
  const destinations = catalog.destinations.filter(
    (d) =>
      enabledSchoolDestIds.has(d.id) ||
      programs.some((p) => p.destinationId === d.id)
  );

  const schools: PublicSchool[] = schoolsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    destinationId: s.destinationId,
    complete: s.complete,
    edvisorProviderId: s.edvisorProviderId,
    enabled: true,
  }));

  const liveSchools = mapCatalogToSearchSchools({
    schools,
    destinations,
    programs,
  });

  return (
    <main className="flex-1">
      <SiteHeader />
      <LiveSearchResults
        schools={liveSchools}
        sourceLabel={catalog.sourceLabel}
        disclaimer={VISA_DISCLAIMER}
      />
      <SiteFooter />
    </main>
  );
}
