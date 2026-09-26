import { SearchResults } from "@/components/search/SearchResults";
import { VisaGate } from "@/components/search/VisaGate";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  LANGUAGE_OPTIONS,
  PASSPORT_OPTIONS,
  filterSchools,
  getDestination,
  isPassportCode,
} from "@/lib/data/schools";
import {
  VISA_DISCLAIMER,
  isVisaRequired,
} from "@/lib/data/visa-rules";
import type { DestinationSlug } from "@/lib/types";

interface SearchPageProps {
  searchParams: Promise<{
    passport?: string;
    language?: string;
    destination?: string;
    visa?: string;
  }>;
}

function isDestinationSlug(value: string): value is DestinationSlug {
  return value === "berlin" || value === "valletta" || value === "london";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const passport =
    params.passport && isPassportCode(params.passport)
      ? params.passport
      : undefined;
  const destination =
    params.destination && isDestinationSlug(params.destination)
      ? params.destination
      : undefined;
  const visaConfirmed = params.visa === "ok";

  const needsVisaGate =
    Boolean(passport && destination) &&
    passport !== undefined &&
    destination !== undefined &&
    isVisaRequired(passport, destination) &&
    !visaConfirmed;

  if (needsVisaGate && passport && destination) {
    const passportLabel =
      PASSPORT_OPTIONS.find((p) => p.value === passport)?.label ?? passport;
    const dest = getDestination(destination);
    const destinationLabel = dest
      ? `${dest.city}, ${dest.country}`
      : destination;

    return (
      <main className="flex-1">
        <SiteHeader />
        <VisaGate
          passport={passport}
          passportLabel={passportLabel}
          destination={destination}
          destinationLabel={destinationLabel}
        />
        <SiteFooter />
      </main>
    );
  }

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
  const destMeta = destination ? getDestination(destination) : undefined;
  const destinationLabel = destMeta
    ? `${destMeta.city}, ${destMeta.country}`
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
