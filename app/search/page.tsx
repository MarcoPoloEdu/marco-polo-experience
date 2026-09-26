import { SearchResults } from "@/components/search/SearchResults";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { filterSchools } from "@/lib/data/schools";
import { VISA_DISCLAIMER } from "@/lib/data/visa-rules";

export default function SearchPage() {
  const schools = filterSchools({});

  return (
    <main className="flex-1">
      <SiteHeader />
      <SearchResults
        schools={schools}
        disclaimer={VISA_DISCLAIMER}
      />
      <SiteFooter />
    </main>
  );
}
