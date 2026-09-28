"use client";

import { Check } from "lucide-react";
import {
  LANGUAGES,
  NATIONALITIES,
  type LanguageCode,
  type NationalityCode,
} from "@/lib/data/mock-catalog";
import { FlagArt } from "@/components/booking/FlagArt";
import { cn } from "@/lib/utils";

const LANGUAGE_ORDER: LanguageCode[] = [
  "english",
  "french",
  "german",
  "italian",
  "portuguese",
];

const LANGUAGE_FACE: Record<
  LanguageCode,
  { greeting: string; tag: string; accent: string }
> = {
  english: {
    greeting: "Hello",
    tag: "EN",
    accent: "from-sky-400/35 via-indigo/30 to-transparent",
  },
  french: {
    greeting: "Bonjour",
    tag: "FR",
    accent: "from-indigo/40 via-rose-400/25 to-transparent",
  },
  german: {
    greeting: "Hallo",
    tag: "DE",
    accent: "from-amber-300/35 via-rose-500/25 to-transparent",
  },
  italian: {
    greeting: "Ciao",
    tag: "IT",
    accent: "from-mint/35 via-rose-400/25 to-transparent",
  },
  portuguese: {
    greeting: "Olá",
    tag: "PT",
    accent: "from-mint/40 via-amber-300/25 to-transparent",
  },
};

export function PassportGrid({
  value,
  onChange,
}: {
  value: NationalityCode | "";
  onChange: (code: NationalityCode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="País de pasaporte"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
    >
      {NATIONALITIES.map((n) => {
        const selected = value === n.code;
        return (
          <button
            key={n.code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(n.code)}
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left outline-none transition duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-mint sm:flex-col sm:items-start sm:gap-3 sm:p-3.5",
              selected
                ? "border-mint bg-mint/15 shadow-[0_18px_40px_-18px_rgba(0,230,153,0.7)]"
                : "border-white/12 bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.1]"
            )}
          >
            <span
              className={cn(
                "relative shrink-0 overflow-hidden rounded-lg shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)] ring-1 ring-black/10 transition duration-300",
                "h-8 w-12 sm:h-12 sm:w-[4.5rem] lg:h-14 lg:w-[5.25rem]",
                selected ? "scale-105" : "group-hover:scale-105 group-hover:-rotate-2"
              )}
            >
              <FlagArt code={n.code} className="size-full" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />
            </span>
            <span className="min-w-0 pr-4 font-heading text-[0.95rem] leading-tight font-bold sm:pr-0 sm:text-xl tracking-tight text-white lg:text-[1.35rem]">
              {n.label}
            </span>
            <span
              className={cn(
                "absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-mint text-ink transition duration-200 sm:top-2.5 sm:right-2.5 sm:size-6",
                selected ? "scale-100 opacity-100" : "scale-50 opacity-0"
              )}
            >
              <Check className="size-3 sm:size-3.5" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LanguageCards({
  value,
  onChange,
}: {
  value: LanguageCode | "";
  onChange: (code: LanguageCode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Idioma que quieres aprender"
      className="-mx-3.5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3.5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {LANGUAGE_ORDER.map((code) => {
        const l = LANGUAGES.find((x) => x.code === code);
        if (!l) return null;
        const face = LANGUAGE_FACE[code];
        const selected = value === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(code)}
            className={cn(
              "group relative min-w-[9.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border p-3.5 text-left outline-none transition duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-mint sm:min-w-0 sm:p-4",
              selected
                ? "border-indigo bg-indigo/25 shadow-[0_18px_40px_-18px_rgba(77,101,255,0.9)]"
                : "border-white/12 bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition duration-300 group-hover:opacity-100",
                face.accent
              )}
            />
            <span className="relative flex items-start justify-between gap-2">
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-white/80">
                {face.tag}
              </span>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full bg-white text-indigo transition duration-200",
                  selected ? "scale-100 opacity-100" : "scale-50 opacity-0"
                )}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            </span>
            <span className="relative mt-3 block font-heading text-2xl leading-none font-extrabold tracking-tight text-white sm:text-[1.7rem]">
              {face.greeting}
            </span>
            <span className="relative mt-1.5 block text-sm font-semibold text-white">
              {l.label}
            </span>
            <span className="relative mt-0.5 line-clamp-2 block text-[11px] leading-snug text-white/60">
              {l.tagline}
            </span>
          </button>
        );
      })}
    </div>
  );
}
