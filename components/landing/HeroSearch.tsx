"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANGUAGE_OPTIONS,
  PASSPORT_OPTIONS,
} from "@/lib/data/schools";
import type { LanguageCode, PassportCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HeroSearch() {
  const [passport, setPassport] = useState<PassportCode>("COL");
  const [language, setLanguage] = useState<LanguageCode>("english");

  const searchHref = useMemo(() => {
    const params = new URLSearchParams({ passport, language });
    return `/search?${params.toString()}`;
  }, [passport, language]);

  const passportItems = useMemo(
    () => Object.fromEntries(PASSPORT_OPTIONS.map((o) => [o.value, o.label])),
    []
  );
  const languageItems = useMemo(
    () => Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.label])),
    []
  );

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-ink text-white">
      <div
        className="absolute inset-0 animate-drift bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/70 to-ink" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(3,206,129,0.35), transparent 35%), radial-gradient(circle at 85% 10%, rgba(77,101,255,0.35), transparent 40%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end gap-10 px-4 pb-14 pt-28 sm:px-6 sm:pb-20">
        <div className="max-w-3xl space-y-5">
          <p className="animate-rise text-sm font-semibold tracking-[0.2em] text-mint uppercase">
            Marco Polo Experience
          </p>
          <h1 className="animate-rise-delay-1 font-heading text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Vive el idioma.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-mint via-sky-300 to-indigo">
              Reserva tu aventura.
            </span>
          </h1>
          <p className="animate-rise-delay-2 max-w-xl text-base text-white/75 sm:text-lg">
            Cursos cortos en destinos icónicos —con precio al instante— para latinos
            que quieren viajar, estudiar y sentirse Polers desde el día uno.
          </p>
        </div>

        <div className="animate-rise-delay-2 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Pasaporte</label>
              <Select
                value={passport}
                onValueChange={(v) => {
                  if (v) setPassport(v as PassportCode);
                }}
                items={passportItems}
              >
                <SelectTrigger className="w-full border-white/20 bg-white/95 text-ink">
                  <SelectValue placeholder="Elige tu país" />
                </SelectTrigger>
                <SelectContent>
                  {PASSPORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Idioma</label>
              <Select
                value={language}
                onValueChange={(v) => {
                  if (v) setLanguage(v as LanguageCode);
                }}
                items={languageItems}
              >
                <SelectTrigger className="w-full border-white/20 bg-white/95 text-ink">
                  <SelectValue placeholder="Elige el idioma" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Link
                href={searchHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-10 w-full gap-2 border-0 px-5 text-ink sm:w-auto",
                  "gradient-cta hover:opacity-95"
                )}
              >
                <Search className="size-4" />
                Buscar destinos
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
