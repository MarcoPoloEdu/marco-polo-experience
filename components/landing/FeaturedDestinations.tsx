import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { destinations } from "@/lib/data/schools";

export function FeaturedDestinations() {
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
            <p className="mt-2 text-muted-foreground">
              Berlín, La Valeta y Londres: destinos para estudiar el idioma donde se vive todos los días.
            </p>
          </div>
          <a
            href="https://www.marcopoloeducation.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-indigo"
          >
            Ver más rutas en MPE
            <ArrowUpRight className="size-4" />
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {destinations.map((dest, index) => (
            <Link
              key={dest.slug}
              href={`/search?passport=COL&language=${dest.languages[0]}`}
              className="group relative block min-h-[380px] overflow-hidden rounded-[1.5rem]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={dest.imageUrl}
                alt={`${dest.city}, ${dest.country}`}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white">
                <p className="text-xs font-semibold tracking-[0.16em] text-mint uppercase">
                  {dest.country}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl font-semibold">{dest.city}</h3>
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-mint group-hover:text-ink">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
                <p className="text-sm text-white/75">{dest.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
