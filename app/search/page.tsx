import Link from "next/link";
import { SearchResults } from "@/components/search/SearchResults";
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
    <main className="flex-1 bg-white">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            FastEdu
          </Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
            New search
          </Link>
        </div>
      </header>
      <SearchResults
        schools={schools}
        languageLabel={languageLabel}
        passportLabel={passportLabel}
      />
    </main>
  );
}
