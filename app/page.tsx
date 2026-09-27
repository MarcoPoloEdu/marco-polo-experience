import { BookingWizard } from "@/components/booking/BookingWizard";
import type { LanguageCode, NationalityCode } from "@/lib/data/mock-catalog";

const PASSPORT_FROM_SLUG: Record<string, NationalityCode> = {
  colombia: "COL",
  mexico: "MEX",
  peru: "PER",
  chile: "CHL",
  argentina: "ARG",
  brasil: "BRA",
  brazil: "BRA",
  ecuador: "ECU",
  uruguay: "URY",
  "costa-rica": "CRI",
  panama: "PAN",
};

interface HomePageProps {
  searchParams: Promise<{
    book?: string;
    passport?: string;
    language?: string;
    destination?: string;
    program?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const passportSlug = params.passport?.toLowerCase();
  const nationality = passportSlug
    ? PASSPORT_FROM_SLUG[passportSlug]
    : undefined;

  return (
    <main className="flex-1">
      <BookingWizard
        initialNationality={nationality}
        initialLanguage={params.language as LanguageCode | undefined}
        initialDestinationId={params.destination}
        initialProgramId={params.program}
        startAtStep={params.book === "1" && params.program ? 6 : undefined}
      />
    </main>
  );
}
