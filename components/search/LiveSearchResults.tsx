"use client";

import { useMemo } from "react";
import Link from "next/link";
import { LiveSchoolCard } from "@/components/search/LiveSchoolCard";
import type { LiveSearchSchool } from "@/lib/catalog/map-search-schools";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveSearchResultsProps {
  schools: LiveSearchSchool[];
  sourceLabel?: string;
  disclaimer?: string;
}

export function LiveSearchResults({
  schools,
  sourceLabel,
  disclaimer,
}: LiveSearchResultsProps) {
  const countLabel = useMemo(() => {
    const n = schools.length;
    return `${n} escuela${n === 1 ? "" : "s"} activada${n === 1 ? "" : "s"}`;
  }, [schools.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.16em] text-indigo uppercase">
          Resultados
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Escuelas del catálogo live
        </h1>
        <p className="text-muted-foreground">
          {countLabel}
          {sourceLabel ? ` · ${sourceLabel}` : ""}
        </p>
        {disclaimer && (
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
            {disclaimer}
          </p>
        )}
      </div>

      {schools.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold text-ink">
            No hay escuelas activadas
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            El cotizador solo muestra escuelas del catálogo live. Abre el
            cotizador o vuelve cuando haya destinos curados.
          </p>
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 h-11 border-0 text-ink gradient-cta"
            )}
          >
            Abrir cotizador
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {schools.map((school) => (
            <LiveSchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}
    </div>
  );
}
