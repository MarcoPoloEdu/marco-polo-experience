"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DESTINATION_OPTIONS,
  PASSPORT_OPTIONS,
  getDestination,
} from "@/lib/data/schools";
import {
  VISA_DISCLAIMER,
  getVisaFreeDestinations,
  isVisaRequired,
} from "@/lib/data/visa-rules";
import type { DestinationSlug, PassportCode } from "@/lib/types";
import { cn } from "@/lib/utils";

type WizardStep = "nacionalidad" | "destino" | "visa" | "bloqueado";

function searchHref(passport: PassportCode, destination: DestinationSlug) {
  const dest = getDestination(destination);
  const language = dest?.languages[0] ?? "english";
  const params = new URLSearchParams({
    passport,
    destination,
    language,
  });
  return `/search?${params.toString()}`;
}

export function HeroSearch() {
  const [step, setStep] = useState<WizardStep>("nacionalidad");
  const [passport, setPassport] = useState<PassportCode | "">("");
  const [destination, setDestination] = useState<DestinationSlug | "">("");

  const passportItems = useMemo(
    () => Object.fromEntries(PASSPORT_OPTIONS.map((o) => [o.value, o.label])),
    []
  );
  const destinationItems = useMemo(
    () => Object.fromEntries(DESTINATION_OPTIONS.map((o) => [o.value, o.label])),
    []
  );

  const visaFree = useMemo(() => {
    if (!passport) return [];
    return getVisaFreeDestinations(passport)
      .map((slug) => getDestination(slug))
      .filter(Boolean);
  }, [passport]);

  function continueFromNationality() {
    if (!passport) return;
    setStep("destino");
  }

  function continueFromDestination() {
    if (!passport || !destination) return;
    if (isVisaRequired(passport, destination)) {
      setStep("visa");
      return;
    }
    window.location.href = searchHref(passport, destination);
  }

  function confirmHasVisa() {
    if (!passport || !destination) return;
    window.location.href = searchHref(passport, destination);
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
            Cursos cortos en ciudades icónicas, con precio claro desde el primer clic.
            Para latinos listos a estudiar, viajar y hacer del idioma parte de su vida.
          </p>
        </div>

        <div className="animate-rise-delay-2 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wide text-white/60 uppercase">
            <StepDot active={step === "nacionalidad"} label="1 · Nacionalidad" />
            <span className="text-white/30">/</span>
            <StepDot
              active={step === "destino" || step === "visa" || step === "bloqueado"}
              label="2 · Destino"
            />
            {(step === "visa" || step === "bloqueado") && (
              <>
                <span className="text-white/30">/</span>
                <StepDot active label="3 · Visa" />
              </>
            )}
          </div>

          {step === "nacionalidad" && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
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
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!passport}
                  onClick={continueFromNationality}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-10 w-full gap-2 border-0 px-5 text-ink sm:w-auto",
                    "gradient-cta hover:opacity-95 disabled:opacity-40"
                  )}
                >
                  Continuar
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {step === "destino" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">
                    ¿A dónde quieres ir?
                  </label>
                  <Select
                    value={destination || undefined}
                    onValueChange={(v) => {
                      if (v) setDestination(v as DestinationSlug);
                    }}
                    items={destinationItems}
                  >
                    <SelectTrigger className="w-full border-white/20 bg-white/95 text-ink">
                      <SelectValue placeholder="Elige ciudad / idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("nacionalidad")}
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "h-10 border-white/30 bg-transparent text-white hover:bg-white/10"
                    )}
                    aria-label="Volver"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!destination}
                    onClick={continueFromDestination}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-10 w-full gap-2 border-0 px-5 text-ink sm:w-auto",
                      "gradient-cta hover:opacity-95 disabled:opacity-40"
                    )}
                  >
                    <Search className="size-4" />
                    Ver escuelas
                  </button>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-white/55">
                {VISA_DISCLAIMER}
              </p>
            </div>
          )}

          {step === "visa" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-200" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Este destino suele requerir visa consular para tu nacionalidad.
                  </p>
                  <p className="text-xs text-white/70">{VISA_DISCLAIMER}</p>
                </div>
              </div>
              <p className="text-sm text-white/85">¿Tienes visa vigente para este destino?</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={confirmHasVisa}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-10 flex-1 border-0 text-ink gradient-cta hover:opacity-95"
                  )}
                >
                  Sí, tengo visa
                </button>
                <button
                  type="button"
                  onClick={() => setStep("bloqueado")}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-10 flex-1 border-white/30 bg-transparent text-white hover:bg-white/10"
                  )}
                >
                  No tengo visa
                </button>
                <button
                  type="button"
                  onClick={() => setStep("destino")}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" }),
                    "h-10 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  Cambiar destino
                </button>
              </div>
            </div>
          )}

          {step === "bloqueado" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-heading text-lg font-semibold text-white">
                  Sin visa, este destino no está disponible por ahora
                </p>
                <p className="text-sm text-white/75">
                  Te mostramos alternativas sin fricción de visa consular para tu
                  nacionalidad. También puedes explorar asesoría con{" "}
                  <a
                    href="https://www.marcopoloeducation.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-mint underline-offset-2 hover:underline"
                  >
                    Marco Polo Education
                  </a>
                  .
                </p>
                <p className="text-[11px] text-white/55">{VISA_DISCLAIMER}</p>
              </div>

              {visaFree.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {visaFree.map((dest) =>
                    dest && passport ? (
                      <Link
                        key={dest.slug}
                        href={searchHref(passport, dest.slug)}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 transition hover:bg-white/15"
                      >
                        <p className="text-xs font-semibold tracking-wide text-mint uppercase">
                          {dest.country}
                        </p>
                        <p className="font-heading text-lg font-semibold">{dest.city}</p>
                        <p className="text-xs text-white/65">{dest.tagline}</p>
                      </Link>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/70">
                  No hay destinos sin visa en el catálogo actual. Vuelve al inicio o habla
                  con un asesor MPE.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setDestination("");
                  setStep("destino");
                }}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-10 border-white/30 bg-transparent text-white hover:bg-white/10"
                )}
              >
                Elegir otro destino
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={cn(active ? "text-mint" : "text-white/45")}>{label}</span>
  );
}
