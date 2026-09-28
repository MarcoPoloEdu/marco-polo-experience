"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASSPORT_OPTIONS } from "@/lib/data/schools";
import { VISA_DISCLAIMER } from "@/lib/data/visa-rules";
import { usePublicCatalog } from "@/hooks/usePublicCatalog";
import type { PassportCode } from "@/lib/types";
import { cn } from "@/lib/utils";

const PASSPORT_TO_SLUG: Partial<Record<PassportCode, string>> = {
  COL: "colombia",
  MEX: "mexico",
  PER: "peru",
  CHL: "chile",
  ARG: "argentina",
  BRA: "brasil",
  ECU: "ecuador",
  URY: "uruguay",
  CRI: "costa-rica",
  PAN: "panama",
};

/** Hero entry — live catalog cities → BookingWizard (no Berlin/London seed). */
export function HeroSearch() {
  const catalogState = usePublicCatalog();
  const destinations =
    catalogState.status === "ready" ? catalogState.catalog.destinations : [];

  const [passport, setPassport] = useState<PassportCode | "">("");
  const [destinationId, setDestinationId] = useState("");

  const passportItems = useMemo(
    () => Object.fromEntries(PASSPORT_OPTIONS.map((o) => [o.value, o.label])),
    []
  );
  const destinationItems = useMemo(
    () =>
      Object.fromEntries(
        destinations.map((d) => [
          d.id,
          `${d.city} · ${d.country}${
            d.languageCodes[0] ? ` · ${labelLanguage(d.languageCodes[0])}` : ""
          }`,
        ])
      ),
    [destinations]
  );

  function openCotizador() {
    if (!passport || !destinationId) return;
    const dest = destinations.find((d) => d.id === destinationId);
    const language = dest?.languageCodes[0] ?? "english";
    const slug = PASSPORT_TO_SLUG[passport] ?? passport.toLowerCase();
    const params = new URLSearchParams({
      book: "1",
      passport: slug,
      language,
      destination: destinationId,
    });
    window.location.href = `/?${params.toString()}`;
  }

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
            No se trata solo de aprender un idioma.
            <span className="mt-2 block bg-gradient-to-r from-mint via-sky-300 to-indigo bg-clip-text text-transparent">
              Se trata de vivirlo.
            </span>
          </h1>
          <p className="animate-rise-delay-2 max-w-xl text-base text-white/75 sm:text-lg">
            Cotiza cursos cortos con el catálogo live (escuelas activadas). Precio
            exacto al reservar.
          </p>
        </div>

        <div className="animate-rise-delay-2 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          {catalogState.status === "loading" && (
            <div className="flex items-center gap-2 py-6 text-sm text-white/70">
              <Loader2 className="size-4 animate-spin" />
              Cargando destinos del catálogo live…
            </div>
          )}

          {catalogState.status === "error" && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-white/85">
                No pudimos cargar el catálogo live. Abre el cotizador directo.
              </p>
              <a
                href="/"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-10 border-0 text-ink gradient-cta"
                )}
              >
                Abrir cotizador
              </a>
            </div>
          )}

          {catalogState.status === "ready" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">
                    ¿Cuál es tu nacionalidad?
                  </label>
                  <Select
                    value={passport || undefined}
                    onValueChange={(v) => {
                      if (v) setPassport(v as PassportCode);
                    }}
                    items={passportItems}
                  >
                    <SelectTrigger className="w-full border-white/20 bg-white/95 text-ink">
                      <SelectValue placeholder="Elige tu país de pasaporte" />
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
                  <label className="text-xs font-medium text-white/70">
                    ¿A dónde quieres ir?
                  </label>
                  <Select
                    value={destinationId || undefined}
                    onValueChange={(v) => {
                      if (v) setDestinationId(v);
                    }}
                    items={destinationItems}
                    disabled={destinations.length === 0}
                  >
                    <SelectTrigger className="w-full border-white/20 bg-white/95 text-ink">
                      <SelectValue
                        placeholder={
                          destinations.length
                            ? "Elige ciudad live"
                            : "Sin destinos activados"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.city} · {d.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-relaxed text-white/55">
                  {VISA_DISCLAIMER}
                </p>
                <button
                  type="button"
                  disabled={!passport || !destinationId}
                  onClick={openCotizador}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-10 gap-2 border-0 px-5 text-ink",
                    "gradient-cta hover:opacity-95 disabled:opacity-40"
                  )}
                >
                  <Search className="size-4" />
                  Cotizar
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function labelLanguage(code: string): string {
  const map: Record<string, string> = {
    english: "Inglés",
    french: "Francés",
    german: "Alemán",
    italian: "Italiano",
    portuguese: "Portugués",
  };
  return map[code] ?? code;
}
