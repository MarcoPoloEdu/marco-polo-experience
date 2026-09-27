import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  LANGUAGES,
  NATIONALITIES,
  PROGRAM_KIND_LABELS,
  enabledPrograms,
  suggestDestinations,
  type LanguageCode,
  type NationalityCode,
} from "@/lib/data/mock-catalog";
import { formatUsd } from "@/lib/booking/pricing";
import { cn } from "@/lib/utils";

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

interface CoursesPageProps {
  searchParams: Promise<{ passport?: string; language?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const passportSlug = (params.passport ?? "colombia").toLowerCase();
  const language = (params.language ?? "english").toLowerCase() as LanguageCode;
  const nationality = PASSPORT_FROM_SLUG[passportSlug] ?? "COL";
  const passportLabel =
    NATIONALITIES.find((n) => n.code === nationality)?.label ?? passportSlug;
  const languageLabel =
    LANGUAGES.find((l) => l.code === language)?.label ?? language;

  const destinations = suggestDestinations(language);
  const programs = destinations.flatMap((d) =>
    enabledPrograms(d.id, language).map((p) => ({ program: p, destination: d }))
  );

  return (
    <main className="min-h-[100dvh] bg-sand text-ink">
      <header className="border-b border-border bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-mint text-ink">
              <Compass className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-heading text-sm font-semibold sm:text-base">
                Marco Polo Experience
              </span>
              <span className="block text-[10px] text-white/55">
                by Marco Polo Education
              </span>
            </span>
          </Link>
          <a
            href="https://www.marcopoloeducation.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/25 sm:text-sm"
          >
            Hablar con un asesor
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-indigo uppercase">
            Cursos compatibles
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-4xl">
            Cursos de {languageLabel}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Pasaporte: {passportLabel} · Destinos sugeridos según tu búsqueda (demo)
          </p>
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-indigo hover:underline"
          >
            ← Cambiar búsqueda
          </Link>
        </div>

        {destinations.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Destinos</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => (
                <article
                  key={d.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={d.imageUrl}
                      alt={d.city}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                      <p className="text-[10px] font-semibold tracking-wide text-mint uppercase">
                        {d.country}
                      </p>
                      <p className="font-heading text-xl font-semibold">{d.city}</p>
                    </div>
                  </div>
                  <div className="space-y-1 p-3.5">
                    <p className="text-sm text-muted-foreground">{d.tagline}</p>
                    <p className="text-sm font-semibold">
                      Desde {formatUsd(d.fromWeeklyUsd)}
                      <span className="font-normal text-muted-foreground"> / semana</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            Programas ({programs.length})
          </h2>
          {programs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-12 text-center">
              <p className="font-heading text-lg font-semibold">
                Aún no hay cursos para esta combinación
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba otro idioma o habla con un asesor.
              </p>
              <Link
                href="/"
                className={cn(buttonVariants(), "mt-4 gradient-cta border-0 text-ink")}
              >
                Nueva búsqueda
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {programs.map(({ program, destination }) => (
                <article
                  key={program.id}
                  className="grid overflow-hidden rounded-2xl border border-border bg-white sm:grid-cols-[140px_1fr]"
                >
                  <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[120px]">
                    <Image
                      src={program.imageUrl}
                      alt={program.title}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-semibold tracking-wide text-indigo uppercase">
                        {PROGRAM_KIND_LABELS[program.kind]} · {program.schoolName}
                      </p>
                      <h3 className="font-heading text-lg font-semibold">
                        {program.title}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" />
                        {destination.city}, {destination.country}
                      </p>
                      <p className="text-sm">
                        {program.lessonsPerWeek} lecciones/sem ·{" "}
                        <strong>{formatUsd(program.weeklyUsd)}</strong>/semana
                      </p>
                    </div>
                    <Link
                      href={`/?book=1&passport=${passportSlug}&language=${language}&destination=${destination.id}&program=${program.id}`}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 min-h-11 shrink-0 gap-1.5 border-0 text-ink gradient-cta"
                      )}
                    >
                      Reservar
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Asesoría disponible · Escuelas verificadas · Reserva segura
        </p>
      </div>
    </main>
  );
}
