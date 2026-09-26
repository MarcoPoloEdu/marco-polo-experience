import { SearchResults } from "@/components/search/SearchResults";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  LANGUAGE_OPTIONS,
  PASSPORT_OPTIONS,
  filterSchools,
  getDestination,
} from "@/lib/data/schools";
import { VISA_DISCLAIMER } from "@/lib/data/visa-rules";

interface SearchPageProps {
  searchParams: Promise<{
    passport?: string;
    language?: string;
    destination?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const schools = filterSchools({
    passport: params.passport,
    language: params.language,
    destination: params.destination,
  });

  const languageLabel = LANGUAGE_OPTIONS.find(
    (l) => l.value === params.language
  )?.label;
  const passportLabel = PASSPORT_OPTIONS.find(
    (p) => p.value === params.passport
  )?.label;
  const destination = params.destination
    ? getDestination(params.destination)
    : undefined;
  const destinationLabel = destination
    ? `${destination.city}, ${destination.country}`
    : undefined;

  return (
    <main className="flex-1">
      <SiteHeader />
      <SearchResults
        schools={schools}
        languageLabel={languageLabel}
        passportLabel={passportLabel}
        destinationLabel={destinationLabel}
        disclaimer={VISA_DISCLAIMER}
      />
      <SiteFooter />
    </main>
  );
}
