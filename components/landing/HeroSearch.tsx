"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function HeroSearch() {
  const router = useRouter();
  const [passport, setPassport] = useState<PassportCode>("USA");
  const [language, setLanguage] = useState<LanguageCode>("german");

  function onSearch() {
    const params = new URLSearchParams({
      passport,
      language,
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-border bg-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #0066ff 0%, transparent 45%), radial-gradient(circle at 80% 0%, #00a3ff 0%, transparent 40%)",
        }}
      />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold tracking-wide text-primary">
            FastEdu
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Book visa-free language courses in minutes
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Compare trusted schools in Berlin, Valletta, and London—built for
            US passport holders who want clear prices and zero consular delay.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Passport
              </label>
              <Select
                value={passport}
                onValueChange={(v) => {
                  if (v) setPassport(v as PassportCode);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select passport" />
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
              <label className="text-xs font-medium text-muted-foreground">
                Language
              </label>
              <Select
                value={language}
                onValueChange={(v) => {
                  if (v) setLanguage(v as LanguageCode);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
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
              <Button
                size="lg"
                className="h-9 w-full gap-2 px-5 sm:w-auto"
                onClick={onSearch}
              >
                <Search className="size-4" />
                Search Destinations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
