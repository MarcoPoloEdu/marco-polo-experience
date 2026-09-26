"use client";

import { useMemo, useState } from "react";
import { DurationFilter } from "@/components/search/DurationFilter";
import { SchoolCard } from "@/components/search/SchoolCard";
import type { DurationWeeks, School } from "@/lib/types";

interface SearchResultsProps {
  schools: School[];
  languageLabel?: string;
  passportLabel?: string;
  destinationLabel?: string;
  disclaimer?: string;
}

export function SearchResults({
  schools,
  languageLabel,
  passportLabel,
  destinationLabel,
  disclaimer,
}: SearchResultsProps) {
  const [weeks, setWeeks] = useState<DurationWeeks>(4);

  const countLabel = useMemo(() => {
    const n = schools.length;
    return `${n} escuela${n === 1 ? "" : "s"}`;
  }, [schools.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.16em] text-indigo uppercase">
          Resultados
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Cursos de idioma listos para reservar
        </h1>
        <p className="text-muted-foreground">
          {countLabel}
          {destinationLabel ? ` en ${destinationLabel}` : ""}
          {languageLabel ? ` · ${languageLabel}` : ""}
          {passportLabel ? ` · Nacionalidad: ${passportLabel}` : ""}
        </p>
        {disclaimer && (
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
            {disclaimer}
          </p>
        )}
      </div>

      <DurationFilter value={weeks} onChange={setWeeks} />

      {schools.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold text-ink">
            No hay escuelas para esta búsqueda
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Prueba otro destino desde el inicio — Berlín, La Valeta y Londres son
            nuestros hubs destacados.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {schools.map((school) => (
            <SchoolCard key={school.slug} school={school} weeks={weeks} />
          ))}
        </div>
      )}
    </div>
  );
}
