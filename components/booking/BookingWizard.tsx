"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Plane,
  Shield,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCOMMODATIONS,
  AIRPORT_OPTIONS,
  CATALOG_SOURCE,
  CATALOG_SOURCE_LABEL,
  INSURANCE_OPTIONS,
  LANGUAGES,
  NATIONALITIES,
  PROGRAM_KIND_LABELS,
  WEEK_OPTIONS,
  enabledPrograms,
  getDestination,
  getProgram,
  suggestDestinations,
  type LanguageCode,
  type NationalityCode,
  type WeekOption,
} from "@/lib/data/mock-catalog";
import {
  addWeeks,
  calculateBookingPricing,
  formatDateEs,
  formatUsd,
} from "@/lib/booking/pricing";
import { cn } from "@/lib/utils";

const PASSPORT_SLUG: Record<NationalityCode, string> = {
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

const LANGUAGE_CHIPS: LanguageCode[] = [
  "english",
  "french",
  "german",
  "italian",
  "portuguese",
];

const DEST_LINE =
  "🇨🇦 Toronto · 🇬🇧 Londres · 🇮🇪 Dublín · 🇺🇸 Nueva York · y más";

const STEPS = [
  { id: 1, label: "País" },
  { id: 2, label: "Destino" },
  { id: 3, label: "Fechas" },
  { id: 4, label: "Programa" },
  { id: 5, label: "Extras" },
  { id: 6, label: "Resumen" },
  { id: 7, label: "Contacto" },
  { id: 8, label: "Listo" },
] as const;

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2400&q=80";

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

export function BookingWizard({
  initialNationality,
  initialLanguage,
  initialDestinationId,
  initialProgramId,
  startAtStep,
}: {
  initialNationality?: NationalityCode;
  initialLanguage?: LanguageCode;
  initialDestinationId?: string;
  initialProgramId?: string;
  startAtStep?: number;
} = {}) {
  const router = useRouter();
  const [step, setStep] = useState(startAtStep && startAtStep >= 1 && startAtStep <= 8 ? startAtStep : 1);
  const [nationality, setNationality] = useState<NationalityCode | "">(
    initialNationality ?? ""
  );
  const [language, setLanguage] = useState<LanguageCode | "">(
    initialLanguage ?? ""
  );
  const [destinationId, setDestinationId] = useState(initialDestinationId ?? "");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [weeks, setWeeks] = useState<WeekOption>(4);
  const [programId, setProgramId] = useState(initialProgramId ?? "");
  const [accommodationId, setAccommodationId] = useState("none");
  const [insuranceId, setInsuranceId] = useState("none");
  const [airportId, setAirportId] = useState("none");
  const [studentAge, setStudentAge] = useState<number | "">("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);

  const nationalityItems = useMemo(
    () =>
      Object.fromEntries(
        NATIONALITIES.map((n) => [n.code, `${n.flag} ${n.label}`])
      ),
    []
  );

  const currentStepMeta = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const endDate = useMemo(() => addWeeks(startDate, weeks), [startDate, weeks]);
  const destinations = useMemo(
    () => (language ? suggestDestinations(language) : []),
    [language]
  );
  const programs = useMemo(
    () =>
      destinationId && language ? enabledPrograms(destinationId, language) : [],
    [destinationId, language]
  );
  const destination = destinationId ? getDestination(destinationId) : undefined;
  const program = programId ? getProgram(programId) : undefined;

  const pricing = useMemo(() => {
    if (!programId) {
      return {
        courseTotal: 0,
        accommodationTotal: 0,
        insuranceTotal: 0,
        airportTotal: 0,
        total: 0,
        weeklyCourse: 0,
        weeks,
      };
    }
    return calculateBookingPricing({
      programId,
      weeks,
      accommodationId,
      insuranceId,
      airportId,
    });
  }, [programId, weeks, accommodationId, insuranceId, airportId]);

  const showSidebar = step >= 5 && step <= 7;
  const atmosphereUrl = destination?.heroUrl ?? HERO_FALLBACK;

  function submitSearch() {
    if (!nationality || !language) return;
    const passport = PASSPORT_SLUG[nationality];
    const params = new URLSearchParams({ passport, language });
    router.push(`/courses?${params.toString()}`);
  }

  function goNext() {
    setError(null);
    setPriceOpen(false);
    setStep((s) => Math.min(8, s + 1));
  }

  function goBack() {
    setError(null);
    setPriceOpen(false);
    setStep((s) => Math.max(1, s - 1));
  }

  function continueFromSummary() {
    setError(null);
    if (!studentAge || studentAge < 1) {
      setError("Indica la edad del estudiante antes de continuar.");
      return;
    }
    if (
      accommodationId !== "none" ||
      insuranceId !== "none" ||
      airportId !== "none"
    ) {
      setError(
        "En esta versión solo se cobra el curso con precio Edvisor exacto. Deja extras en «sin»."
      );
      return;
    }
    goNext();
  }

  async function chargeOnContact() {
    setError(null);
    if (
      contactName.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) ||
      contactPhone.trim().length < 7
    ) {
      setError("Completa nombre, email y teléfono.");
      return;
    }
    if (!studentAge || studentAge < 1) {
      setError("Indica la edad del estudiante. No se asume automáticamente.");
      return;
    }

    setLoading(true);
    const payload = {
      nationality,
      language,
      destinationId,
      programId,
      startDate,
      weeks,
      accommodationId: "none",
      insuranceId: "none",
      airportId: "none",
      studentAge,
      travelDepartureDate: startDate,
      contact: {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
      },
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        bookingId?: string;
        checkoutUrl?: string;
        error?: string;
        code?: string;
        charged?: boolean;
      };

      if (!res.ok || !data.checkoutUrl) {
        setError(
          data.error ??
            "No se pudo iniciar el pago seguro. No hay cobro simulado."
        );
        return;
      }

      // Never mark paid in the browser — Stripe Checkout + webhook only.
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de red al iniciar Checkout. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-ink text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div
          className="absolute inset-0 animate-drift bg-cover bg-center"
          style={{ backgroundImage: `url(${atmosphereUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/78 to-ink" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 10%, rgba(0,230,153,0.28), transparent 42%), radial-gradient(ellipse at 90% 0%, rgba(77,101,255,0.32), transparent 45%)",
          }}
        />
        <div className="absolute inset-0 mpe-grain opacity-40" />
      </div>

      <div
        className={cn(
          "relative mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6",
          showSidebar
            ? "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-16"
            : "pb-12 sm:pb-16"
        )}
      >
        <BrandHeader />

        {step > 1 && (
          <ProgressTrail step={step} label={currentStepMeta.label} />
        )}

        {/* STEP 1 — brand-first hero + search */}
        {step === 1 && (
          <section className="flex min-h-0 flex-col justify-end gap-4 pb-2 pt-6 sm:min-h-[78dvh] sm:gap-7 sm:pb-6 sm:pt-10">
            <div className="max-w-3xl space-y-3 sm:space-y-5">
              <div className="animate-rise space-y-1">
                <p className="font-heading text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Marco Polo Experience
                </p>
                <p className="text-xs font-medium text-white/60 sm:text-sm">
                  by Marco Polo Education
                </p>
              </div>
              <h1 className="animate-rise-delay-1 font-heading text-[1.85rem] leading-[1.12] font-semibold tracking-tight sm:text-5xl md:text-6xl">
                Vive un idioma.{" "}
                <span className="bg-gradient-to-r from-mint via-sky-300 to-indigo bg-clip-text text-transparent">
                  No solo lo estudies.
                </span>
              </h1>
              <p className="animate-rise-delay-2 max-w-xl text-sm leading-snug text-white/75 sm:text-lg sm:leading-relaxed">
                Encuentra, compara y reserva cursos cortos de idiomas alrededor del
                mundo. Todo online.
              </p>
              <p className="animate-rise-delay-2 text-xs text-white/55 sm:text-sm">
                {DEST_LINE}
              </p>
            </div>

            <div className="animate-rise-delay-2 space-y-3 rounded-[1.35rem] border border-white/15 bg-white/10 p-3.5 backdrop-blur-xl sm:space-y-4 sm:rounded-[1.5rem] sm:p-5">
              <div className="space-y-1">
                <p className="text-xs text-white/65 sm:text-sm">
                  Te mostraremos destinos y cursos compatibles con tu pasaporte.
                </p>
                <h2 className="font-heading text-base font-semibold text-white sm:text-xl">
                  ¿Dónde quieres vivir tu próxima experiencia?
                </h2>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="nationality-select"
                  className="text-xs font-medium text-white/70"
                >
                  País de pasaporte
                </label>
                <Select
                  value={nationality || undefined}
                  onValueChange={(v) => {
                    if (v) setNationality(v as NationalityCode);
                  }}
                  items={nationalityItems}
                >
                  <SelectTrigger
                    id="nationality-select"
                    className="h-11 min-h-11 w-full border-white/20 bg-white/95 text-base text-ink sm:h-12"
                  >
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((n) => (
                      <SelectItem key={n.code} value={n.code}>
                        {n.flag} {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-white/70">
                  Idioma que quieres aprender
                </p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_CHIPS.map((code) => {
                    const l = LANGUAGES.find((x) => x.code === code);
                    if (!l) return null;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setDestinationId("");
                          setProgramId("");
                        }}
                        className={cn(
                          "min-h-11 rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-[0.98]",
                          language === l.code
                            ? "border-transparent bg-indigo text-white"
                            : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"
                        )}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-0.5">
                <button
                  type="button"
                  disabled={!nationality || !language}
                  onClick={submitSearch}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 min-h-12 w-full gap-2 border-0 text-base text-ink gradient-cta disabled:opacity-40"
                  )}
                >
                  Ver cursos
                  <ArrowRight className="size-4" />
                </button>
                <p className="text-center text-[11px] leading-snug text-white/50 sm:text-xs">
                  Asesoría disponible · Escuelas verificadas · Reserva segura
                </p>
              </div>
            </div>
          </section>
        )}

        {step > 1 && (
          <div
            className={cn(
              "mt-4 grid gap-6 lg:mt-6",
              showSidebar && "lg:grid-cols-[1.4fr_0.85fr] lg:items-start"
            )}
          >
            <div
              key={step}
              className="animate-rise min-w-0 rounded-[1.35rem] border border-white/12 bg-white/[0.08] p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:rounded-[1.6rem] sm:p-7"
            >
              {step === 2 && language && (
                <StepShell
                  kicker="Destinos sugeridos"
                  title="¿Dónde quieres vivir el idioma?"
                  subtitle="Ordenados por fricción de visa y precio de entrada (demo)."
                >
                  <div className="space-y-3">
                    {destinations.map((d, i) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDestinationId(d.id);
                          setProgramId("");
                        }}
                        className={cn(
                          "group relative block w-full overflow-hidden rounded-[1.25rem] text-left transition active:scale-[0.995]",
                          destinationId === d.id
                            ? "ring-2 ring-mint ring-offset-2 ring-offset-ink"
                            : "ring-1 ring-white/15 hover:ring-white/35"
                        )}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="relative aspect-[16/11] sm:aspect-[21/9]">
                          <Image
                            src={d.heroUrl || d.imageUrl}
                            alt={`${d.city}, ${d.country}`}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-[1.04]"
                            sizes="(max-width: 768px) 100vw, 720px"
                            priority={i === 0}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold tracking-[0.18em] text-mint uppercase">
                                {d.country}
                              </span>
                              <FrictionPill level={d.visaFriction} />
                            </div>
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <h3 className="font-heading text-2xl font-semibold sm:text-3xl">
                                  {d.city}
                                </h3>
                                <p className="mt-1 max-w-xl text-sm text-white/75">
                                  {d.tagline}
                                </p>
                              </div>
                              <p className="shrink-0 text-right text-sm font-semibold">
                                desde {formatUsd(d.fromWeeklyUsd)}
                                <span className="block text-[11px] font-normal text-white/60">
                                  / semana
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <NavRow
                    onBack={goBack}
                    onNext={() => destinationId && goNext()}
                    nextDisabled={!destinationId}
                    nextLabel="Elegir fechas"
                  />
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  kicker="Fechas de viaje"
                  title="¿Cuándo arranca tu experiencia?"
                  subtitle="Inicio + duración. Calculamos el fin en vivo."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-white/65">
                        Fecha de inicio
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink outline-none focus:ring-2 focus:ring-mint"
                      />
                    </label>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-white/65">Duración</span>
                      <div className="grid grid-cols-3 gap-2">
                        {WEEK_OPTIONS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setWeeks(w)}
                            className={cn(
                              "min-h-14 rounded-xl border px-2 py-3 text-center text-sm font-semibold active:scale-[0.98]",
                              weeks === w
                                ? "border-mint bg-mint/25 text-white"
                                : "border-white/15 bg-white/5 hover:bg-white/10"
                            )}
                          >
                            {w} sem
                            <span className="mt-0.5 block text-[10px] font-normal text-white/60">
                              {w / 4} mes{w > 4 ? "es" : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-mint/35 bg-mint/10 p-4">
                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-mint" />
                    <div>
                      <p className="text-sm font-semibold">Fin estimado del viaje</p>
                      <p className="mt-1 text-sm text-white/80">
                        {formatDateEs(startDate)}
                        <span className="mx-2 text-white/40">→</span>
                        <strong>{formatDateEs(endDate)}</strong>
                      </p>
                    </div>
                  </div>
                  <NavRow onBack={goBack} onNext={goNext} nextLabel="Ver programas" />
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  kicker="Programa"
                  title="Elige cómo estudiar"
                  subtitle="General, prep de exámenes o +30 — catálogo demo."
                >
                  {programs.length === 0 ? (
                    <p className="text-sm text-white/70">
                      No hay programas para esta combinación. Vuelve y cambia el destino.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {programs.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProgramId(p.id)}
                          className={cn(
                            "grid w-full overflow-hidden rounded-2xl border text-left transition active:scale-[0.995] sm:grid-cols-[160px_1fr]",
                            programId === p.id
                              ? "border-mint bg-mint/10 ring-1 ring-mint/50"
                              : "border-white/15 bg-white/5 hover:border-white/30"
                          )}
                        >
                          <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-full">
                            <Image
                              src={p.imageUrl}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 160px"
                            />
                          </div>
                          <div className="space-y-1.5 p-4">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-mint uppercase">
                              {PROGRAM_KIND_LABELS[p.kind]} · {p.schoolName}
                            </p>
                            <p className="font-heading text-lg font-semibold sm:text-xl">
                              {p.title}
                            </p>
                            <p className="text-sm leading-snug text-white/70">{p.summary}</p>
                            <p className="text-sm">
                              {p.lessonsPerWeek} lecciones/sem ·{" "}
                              <strong>{formatUsd(p.weeklyUsd)}</strong>/semana
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {p.highlights.map((h) => (
                                <span
                                  key={h}
                                  className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <NavRow
                    onBack={goBack}
                    onNext={() => programId && goNext()}
                    nextDisabled={!programId}
                    nextLabel="Armar extras"
                  />
                </StepShell>
              )}

              {step === 5 && (
                <StepShell
                  kicker="Extras"
                  title="Aloja, asegúrate y llega tranquilo"
                  subtitle="El total se actualiza a la derecha (o abajo en móvil)."
                >
                  <ExtrasBlock
                    title="Alojamiento"
                    icon={<MapPin className="size-4" />}
                  >
                    {ACCOMMODATIONS.map((a) => (
                      <ChoiceRow
                        key={a.id}
                        selected={accommodationId === a.id}
                        onSelect={() => setAccommodationId(a.id)}
                        title={a.label}
                        description={a.description}
                        price={
                          a.perWeekUsd === 0
                            ? "$0"
                            : `+${formatUsd(a.perWeekUsd)}/sem`
                        }
                        imageUrl={a.imageUrl}
                      />
                    ))}
                  </ExtrasBlock>
                  <ExtrasBlock title="Seguro de viaje" icon={<Shield className="size-4" />}>
                    {INSURANCE_OPTIONS.map((i) => (
                      <ChoiceRow
                        key={i.id}
                        selected={insuranceId === i.id}
                        onSelect={() => setInsuranceId(i.id)}
                        title={i.label}
                        description={i.description}
                        price={i.flatUsd === 0 ? "$0" : `+${formatUsd(i.flatUsd)}`}
                      />
                    ))}
                  </ExtrasBlock>
                  <ExtrasBlock
                    title="Recepción aeropuerto"
                    icon={<Plane className="size-4" />}
                  >
                    {AIRPORT_OPTIONS.map((a) => (
                      <ChoiceRow
                        key={a.id}
                        selected={airportId === a.id}
                        onSelect={() => setAirportId(a.id)}
                        title={a.label}
                        description={a.description}
                        price={a.flatUsd === 0 ? "$0" : `+${formatUsd(a.flatUsd)}`}
                      />
                    ))}
                  </ExtrasBlock>
                  <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-xs text-amber-50/90">
                    Los precios de extras locales son informativos. El cobro V2 solo
                    incluye el curso con cotización Edvisor exacta — deja extras en
                    «sin» para pagar.
                  </p>
                  <NavRow onBack={goBack} onNext={goNext} nextLabel="Ver resumen" />
                </StepShell>
              )}

              {step === 6 && (
                <StepShell
                  kicker="Resumen"
                  title="Revisa antes de pagar"
                  subtitle="El cargo se hace en Stripe Checkout (página segura). Esta pantalla no confirma el pago."
                >
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-white/15 bg-ink/40 px-3 py-2.5 text-xs text-white/70">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-mint" />
                    No pedimos número de tarjeta aquí. Stripe procesa el cobro al
                    100% por adelantado tras confirmar contacto.
                  </div>
                  <div className="grid gap-3">
                    <FieldInput
                      label="Edad del estudiante (en la fecha de inicio)"
                      value={studentAge === "" ? "" : String(studentAge)}
                      onChange={(v) => {
                        const n = Number(v.replace(/\D/g, ""));
                        setStudentAge(v.trim() === "" || !Number.isFinite(n) ? "" : n);
                      }}
                      inputMode="numeric"
                      placeholder="Ej. 22"
                    />
                    <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white/80">
                      <p>
                        {program?.title ?? "Programa"} · {weeks} semanas · inicio{" "}
                        {formatDateEs(startDate)}
                      </p>
                      <p className="mt-1 text-white/50">
                        Total informativo catálogo: {formatUsd(pricing.courseTotal)}{" "}
                        (el total cobrado será el de la cotización Edvisor exacta).
                      </p>
                    </div>
                  </div>
                  {error && <ErrorBox message={error} />}
                  <NavRow
                    onBack={goBack}
                    onNext={continueFromSummary}
                    nextLabel="Continuar"
                    nextIcon={<CreditCard className="size-4" />}
                  />
                </StepShell>
              )}

              {step === 7 && (
                <StepShell
                  kicker="Contacto"
                  title="Tus datos para el pago"
                  subtitle="Al enviar te llevamos a Stripe Checkout. El pago solo se confirma por webhook firmado."
                >
                  <div className="grid gap-3">
                    <FieldInput
                      label="Nombre completo"
                      value={contactName}
                      onChange={setContactName}
                      autoComplete="name"
                    />
                    <FieldInput
                      label="Email"
                      value={contactEmail}
                      onChange={setContactEmail}
                      autoComplete="email"
                      type="email"
                    />
                    <FieldInput
                      label="Teléfono"
                      value={contactPhone}
                      onChange={setContactPhone}
                      autoComplete="tel"
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                  {error && <ErrorBox message={error} />}
                  <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={goBack}
                      className={cn(
                        buttonVariants({ size: "lg", variant: "outline" }),
                        "min-h-12 h-12 w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                      )}
                    >
                      <ArrowLeft className="size-4" />
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={chargeOnContact}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "min-h-12 h-12 w-full flex-1 gap-2 border-0 text-ink gradient-cta disabled:opacity-50"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Lock className="size-4" />
                      )}
                      {loading
                        ? "Abriendo Stripe…"
                        : "Ir a pago seguro (Stripe)"}
                    </button>
                  </div>
                </StepShell>
              )}

              {step === 8 && (
                <StepShell
                  kicker="Siguiente"
                  title="Completa el pago en Stripe"
                  subtitle="Si cerraste la ventana, vuelve a intentar desde Contacto. Esta app no marca la reserva como pagada hasta el webhook."
                >
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-mint/40 bg-mint/15 p-4">
                    <Lock className="mt-0.5 size-6 shrink-0 text-mint" />
                    <p className="text-sm text-white/85">
                      Tras pagar verás la página de éxito. La confirmación operativa
                      llega cuando Stripe firma el evento{" "}
                      <code className="text-xs">checkout.session.completed</code>.
                    </p>
                  </div>
                  <NavRow
                    onBack={() => setStep(7)}
                    onNext={() => setStep(1)}
                    nextLabel="Volver al inicio"
                  />
                </StepShell>
              )}
            </div>

            {showSidebar && (
              <aside className="hidden lg:sticky lg:top-6 lg:block">
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white text-ink shadow-[0_28px_70px_-36px_rgba(0,0,0,0.65)]">
                  {destination && (
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={destination.imageUrl}
                        alt={destination.city}
                        fill
                        className="object-cover"
                        sizes="340px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-mint uppercase">
                          Tu paquete
                        </p>
                        <p className="font-heading text-2xl font-semibold">
                          {destination.city}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <PriceBreakdown
                      programTitle={program?.title}
                      weeks={weeks}
                      pricing={pricing}
                    />
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      {showSidebar && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          {priceOpen && (
            <button
              type="button"
              aria-label="Cerrar resumen"
              className="absolute inset-x-0 bottom-full h-[100dvh] bg-ink/55"
              onClick={() => setPriceOpen(false)}
            />
          )}
          <div className="animate-sheet-up border-t border-white/10 bg-white text-ink shadow-[0_-16px_50px_-18px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => setPriceOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 pt-3.5 pb-2 text-left"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-indigo uppercase">
                  Tu paquete
                </p>
                <p className="truncate text-sm font-medium">
                  {destination?.city ?? "Destino"} · {weeks} sem
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-heading text-lg font-semibold">
                  {formatUsd(pricing.total)}
                </span>
                {priceOpen ? (
                  <ChevronDown className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="size-5 text-muted-foreground" />
                )}
              </div>
            </button>
            {priceOpen ? (
              <div className="max-h-[50dvh] overflow-y-auto border-t border-border px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3">
                <PriceBreakdown
                  programTitle={program?.title}
                  weeks={weeks}
                  pricing={pricing}
                />
              </div>
            ) : (
              <p className="px-4 pb-[calc(0.7rem+env(safe-area-inset-bottom))] text-center text-[11px] text-muted-foreground">
                Toca para ver el desglose
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BrandHeader() {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
          <Compass className="size-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
            Marco Polo Experience
          </p>
          <p className="truncate text-[11px] font-medium text-white/55">
            by Marco Polo Education
          </p>
        </div>
      </div>
      <a
        href="https://www.marcopoloeducation.com"
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-full bg-white/10 px-3 py-2.5 text-xs font-semibold ring-1 ring-white/25 transition hover:bg-white/15 sm:px-4 sm:text-sm"
      >
        Hablar con un asesor
      </a>
    </header>
  );
}

function ProgressTrail({ step, label }: { step: number; label: string }) {
  return (
    <nav className="mt-5 mb-1" aria-label="Progreso">
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <p className="text-sm font-semibold">
          Paso {step}
          <span className="text-white/45"> / {STEPS.length}</span>
        </p>
        <p className="text-xs font-medium text-mint">{label}</p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10 sm:hidden">
        <div
          className="h-full rounded-full bg-mint transition-all duration-300"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="hidden items-center gap-1 sm:flex">
        {STEPS.map((s) => (
          <li key={s.id} className="flex items-center gap-1">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[11px] font-bold",
                step === s.id
                  ? "bg-mint text-ink"
                  : step > s.id
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-white/35"
              )}
            >
              {step > s.id ? <Check className="size-3.5" /> : s.id}
            </span>
            <span
              className={cn(
                "mr-1 hidden text-[11px] font-medium md:inline",
                step === s.id ? "text-white" : "text-white/40"
              )}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-mint uppercase">
          {kicker}
        </p>
        <h1 className="mt-1.5 font-heading text-[1.45rem] leading-tight font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/70">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function PriceBreakdown({
  programTitle,
  weeks,
  pricing,
}: {
  programTitle?: string;
  weeks: number;
  pricing: {
    courseTotal: number;
    accommodationTotal: number;
    insuranceTotal: number;
    airportTotal: number;
    total: number;
  };
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {programTitle ?? "Programa"} · {weeks} semanas
      </p>
      <div className="mt-3 space-y-2 text-sm">
        <Row label="Curso" value={formatUsd(pricing.courseTotal)} />
        <Row label="Alojamiento" value={formatUsd(pricing.accommodationTotal)} />
        <Row label="Seguro" value={formatUsd(pricing.insuranceTotal)} />
        <Row label="Aeropuerto" value={formatUsd(pricing.airportTotal)} />
        <div className="flex justify-between border-t border-border pt-2.5 font-heading text-lg font-semibold">
          <span>Total</span>
          <span>{formatUsd(pricing.total)}</span>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Curso: precios Edvisor ({CATALOG_SOURCE_LABEL}
        {CATALOG_SOURCE === "fallback" ? " — fallback" : ""}). Extras MPE aparte.
      </p>
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  nextIcon,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse gap-2.5 pt-4 sm:flex-row">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "min-h-12 h-12 w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
          )}
        >
          <ArrowLeft className="size-4" />
          Atrás
        </button>
      )}
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className={cn(
          buttonVariants({ size: "lg" }),
          "min-h-12 h-12 w-full flex-1 gap-2 border-0 text-ink gradient-cta disabled:opacity-40"
        )}
      >
        {nextIcon}
        <span className="truncate">{nextLabel}</span>
        <ArrowRight className="size-4 shrink-0" />
      </button>
    </div>
  );
}

function FrictionPill({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    low: "Visa fácil",
    medium: "Revisar visa",
    high: "Visa probable",
  };
  const color = {
    low: "bg-mint/25 text-mint",
    medium: "bg-amber-300/20 text-amber-100",
    high: "bg-rose-400/25 text-rose-100",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", color[level])}>
      {map[level]}
    </span>
  );
}

function ExtrasBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 space-y-2.5">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ChoiceRow({
  selected,
  onSelect,
  title,
  description,
  price,
  imageUrl,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  price: string;
  imageUrl?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full gap-3 rounded-xl border p-3.5 text-left transition active:scale-[0.99]",
        selected
          ? "border-mint bg-mint/15"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      )}
    >
      {imageUrl && (
        <span className="relative hidden h-14 w-16 shrink-0 overflow-hidden rounded-lg sm:block">
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="64px" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-white/65">
          {description}
        </span>
      </span>
      <span className="shrink-0 self-center text-sm font-semibold text-mint">{price}</span>
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  type = "text",
  className,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  type?: string;
  className?: string;
  inputMode?: "numeric" | "text" | "email" | "tel" | "search" | "url" | "none" | "decimal";
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-white/65">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        className={cn(
          "h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink outline-none focus:ring-2 focus:ring-mint",
          className
        )}
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-xl border border-rose-300/40 bg-rose-500/15 px-3 py-2.5 text-sm leading-snug text-rose-100"
    >
      {message}
    </div>
  );
}
