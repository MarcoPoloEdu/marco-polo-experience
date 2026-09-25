"use client";

import { useMemo, useState } from "react";
import { DurationFilter } from "@/components/search/DurationFilter";
import { SchoolCard } from "@/components/search/SchoolCard";
import type { DurationWeeks, School } from "@/lib/types";

interface SearchResultsProps {
  schools: School[];
  languageLabel?: string;
  passportLabel?: string;
}

export function SearchResults({
  schools,
  languageLabel,
  passportLabel,
}: SearchResultsProps) {
  const [weeks, setWeeks] = useState<DurationWeeks>(4);

  const countLabel = useMemo(() => {
    const n = schools.length;
    return `${n} school${n === 1 ? "" : "s"}`;
  }, [schools.length]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Visa-free language courses
        </h1>
        <p className="text-muted-foreground">
          {countLabel}
          {languageLabel ? ` for ${languageLabel}` : ""}
          {passportLabel ? ` · Passport: ${passportLabel}` : ""}
        </p>
      </div>

      <DurationFilter value={weeks} onChange={setWeeks} />

      {schools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="font-medium text-foreground">No schools match this search</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another language from the homepage—Berlin, Valletta, and London
            are our featured hubs.
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
