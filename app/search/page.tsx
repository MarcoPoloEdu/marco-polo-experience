import { SearchResults } from "@/components/search/SearchResults";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  LANGUAGE_OPTIONS,
  PASSPORT_OPTIONS,
  filterSchools,
} from "@/lib/data/schools";

interface SearchPageProps {
  searchParams: Promise<{
    passport?: string;
    language?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const schools = filterSchools({
    passport: params.passport,
    language: params.language,
  });

  const languageLabel = LANGUAGE_OPTIONS.find(
    (l) => l.value === params.language
  )?.label;
  const passportLabel = PASSPORT_OPTIONS.find(
    (p) => p.value === params.passport
  )?.label;

  return (
    <main className="flex-1">
      <SiteHeader />
      <SearchResults
        schools={schools}
        languageLabel={languageLabel}
        passportLabel={passportLabel}
      />
      <SiteFooter />
    </main>
  );
}
