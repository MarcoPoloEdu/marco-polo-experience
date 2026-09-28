"use client";

import Image from "next/image";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { usePublicCatalog } from "@/hooks/usePublicCatalog";
import { destLineFromCatalog } from "@/lib/catalog/public-catalog";

/** Landing strip — live /api/catalog cities only (not Berlin/London seed). */
export function FeaturedDestinations() {
  const catalogState = usePublicCatalog();
  const destinations =
    catalogState.status === "ready" ? catalogState.catalog.destinations : [];
  const blurb =
    catalogState.status === "ready"
      ? destLineFromCatalog(destinations)
      : catalogState.status === "error"
        ? "No pudimos cargar destinos live."
        : "Cargando destinos curados…";

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-indigo uppercase">
              Destinos destacados
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Elige tu próxima ciudad
            </h2>
            <p className="mt-2 text-muted-foreground">{blurb}</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-indigo"
          >
            Abrir cotizador
            <ArrowUpRight className="size-4" />
          </a>
        </div>

        {catalogState.status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando catálogo live…
          </div>
        )}

        {catalogState.status === "error" && (
          <div className="rounded-[1.4rem] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="font-heading text-lg font-semibold text-ink">
              Catálogo no disponible
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {catalogState.error}
            </p>
            <a href="/" className="mt-4 inline-block text-sm font-semibold text-indigo">
              Ir al cotizador →
            </a>
          </div>
        )}

        {catalogState.status === "ready" && destinations.length === 0 && (
          <div className="rounded-[1.4rem] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="font-heading text-lg font-semibold text-ink">
              Aún no hay destinos activados
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              El cotizador solo muestra escuelas del catálogo live.
            </p>
          </div>
        )}

        {destinations.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {destinations.map((dest, index) => {
              const language = dest.languageCodes[0] ?? "english";
              return (
                <a
                  key={dest.id}
                  href={`/?book=1&passport=colombia&language=${language}&destination=${dest.id}`}
                  className="group relative block min-h-[320px] overflow-hidden rounded-[1.5rem] sm:min-h-[380px]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Image
                    src={dest.imageUrl || dest.heroUrl}
                    alt={`${dest.city}, ${dest.country}`}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white">
                    <p className="text-xs font-semibold tracking-[0.16em] text-mint uppercase">
                      {dest.country}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-heading text-2xl font-semibold">
                        {dest.city}
                      </h3>
                      <span className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-mint group-hover:text-ink">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                    <p className="text-sm text-white/75">{dest.tagline}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
