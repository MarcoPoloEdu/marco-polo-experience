"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Plane,
  Shield,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  ACCOMMODATIONS,
  AIRPORT_OPTIONS,
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
import type { EmailPayload } from "@/lib/email";

const STEPS = [
  { id: 1, label: "País e idioma" },
  { id: 2, label: "Destino" },
  { id: 3, label: "Fechas" },
  { id: 4, label: "Programa" },
  { id: 5, label: "Extras" },
  { id: 6, label: "Tarjeta" },
  { id: 7, label: "Contacto" },
  { id: 8, label: "Confirmación" },
] as const;

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

function luhnOk(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function BookingWizard() {
  const [step, setStep] = useState(1);
  const [nationality, setNationality] = useState<NationalityCode | "">("");
  const [language, setLanguage] = useState<LanguageCode | "">("");
  const [destinationId, setDestinationId] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [weeks, setWeeks] = useState<WeekOption>(4);
  const [programId, setProgramId] = useState("");
  const [accommodationId, setAccommodationId] = useState("homestay");
  const [insuranceId, setInsuranceId] = useState("guardme");
  const [airportId, setAirportId] = useState("shared");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("visa");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailPayload[]>([]);
  const [paymentMode, setPaymentMode] = useState<"stripe" | "mock" | null>(null);
  const [emailProvider, setEmailProvider] = useState<"resend" | "log" | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);

  const currentStepMeta = STEPS.find((s) => s.id === step) ?? STEPS[0];

  const endDate = useMemo(() => addWeeks(startDate, weeks), [startDate, weeks]);
  const destinations = useMemo(
    () => (language ? suggestDestinations(language) : []),
    [language]
  );
  const programs = useMemo(
    () =>
      destinationId && language
        ? enabledPrograms(destinationId, language)
        : [],
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

  function validateCardAndContinue() {
    setError(null);
    const digits = cardNumber.replace(/\D/g, "");
    if (cardName.trim().length < 2) {
      setError("Ingresa el nombre como aparece en la tarjeta.");
      return;
    }
    if (!luhnOk(digits)) {
      setError("Número de tarjeta inválido. Tip demo: usa 4242 4242 4242 4242.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExp)) {
      setError("Fecha MM/AA inválida.");
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvc)) {
      setError("CVC inválido.");
      return;
    }
    const pm = `mock_pm_${digits.slice(-4)}_${Date.now().toString(36)}`;
    setPaymentMethodId(pm);
    setCardLast4(digits.slice(-4));
    setCardBrand(digits.startsWith("4") ? "visa" : "card");
    goNext();
  }

  async function chargeOnContact() {
    setError(null);
    if (!paymentMethodId) {
      setError("Primero valida tu tarjeta.");
      setStep(6);
      return;
    }
    if (
      contactName.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) ||
      contactPhone.trim().length < 7
    ) {
      setError("Completa nombre, email y teléfono.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationality,
          language,
          destinationId,
          programId,
          startDate,
          weeks,
          accommodationId,
          insuranceId,
          airportId,
          contact: {
            name: contactName.trim(),
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
          },
          card: {
            brand: cardBrand,
            last4: cardLast4,
            mockPaymentMethodId: paymentMethodId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos cobrar. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      setBookingId(data.bookingId);
      setEmails(data.emails ?? []);
      setPaymentMode(data.paymentMode);
      setEmailProvider(data.emailDelivery?.provider ?? null);
      setStep(8);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-ink text-white">
      {/* Full-bleed atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            destination?.heroUrl
              ? `url(${destination.heroUrl})`
              : "url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/85 to-ink" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(3,206,129,0.28), transparent 40%), radial-gradient(circle at 88% 8%, rgba(77,101,255,0.3), transparent 42%)",
        }}
      />

      <div
        className={cn(
          "relative mx-auto max-w-6xl px-3 pt-5 sm:px-6 sm:pt-8",
          showSidebar ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-20" : "pb-16 sm:pb-20"
        )}
      >
        <header className="mb-5 flex items-start justify-between gap-3 sm:mb-8 sm:items-center sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-mint uppercase sm:text-xs sm:tracking-[0.22em]">
              Marco Polo Experience
            </p>
            <p className="mt-0.5 text-xs leading-snug text-white/60 sm:text-sm">
              <span className="sm:hidden">Vive el idioma. Reserva en minutos.</span>
              <span className="hidden sm:inline">
                No se trata solo de aprender un idioma — se trata de vivirlo.
              </span>
            </p>
          </div>
          <a
            href="https://www.marcopoloeducation.com"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-white/10 px-3 py-2.5 text-xs font-semibold ring-1 ring-white/25 hover:bg-white/15 sm:px-3.5 sm:text-sm"
          >
            MPE
            <span className="hidden sm:inline"> · Asesoría</span>
          </a>
        </header>

        {/* Progress — compact on mobile, pills on desktop */}
        <nav className="mb-5 sm:mb-8" aria-label="Progreso de reserva">
          <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                Paso {step} de {STEPS.length}
              </p>
              <p className="truncate text-xs text-mint">{currentStepMeta.label}</p>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-mint transition-all duration-300"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="hidden gap-1.5 sm:flex sm:flex-wrap">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "rounded-full px-3 py-1.5 text-center text-[11px] font-medium tracking-wide",
                  step === s.id
                    ? "bg-mint text-ink"
                    : step > s.id
                      ? "bg-white/15 text-white"
                      : "bg-white/5 text-white/40"
                )}
              >
                {s.id}. {s.label}
              </div>
            ))}
          </div>
        </nav>

        <div className={cn("grid gap-6 sm:gap-8", showSidebar && "lg:grid-cols-[1.35fr_0.9fr]")}>
          <div className="min-w-0 rounded-[1.25rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:rounded-[1.6rem] sm:p-7">
            {step === 1 && (
              <StepShell
                title="¿De dónde eres y qué idioma quieres vivir?"
                subtitle="Empezamos por tu nacionalidad y el idioma que vas a estudiar."
              >
                <div className="space-y-5">
                  <Field label="Tu país (nacionalidad)">
                    <div className="grid grid-cols-2 gap-2.5">
                      {NATIONALITIES.map((n) => (
                        <button
                          key={n.code}
                          type="button"
                          onClick={() => setNationality(n.code)}
                          className={cn(
                            "min-h-12 rounded-xl border px-3 py-3 text-left text-sm transition active:scale-[0.98]",
                            nationality === n.code
                              ? "border-mint bg-mint/20 text-white"
                              : "border-white/15 bg-white/5 hover:bg-white/10"
                          )}
                        >
                          <span className="mr-1.5">{n.flag}</span>
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Idioma a estudiar">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLanguage(l.code);
                            setDestinationId("");
                            setProgramId("");
                          }}
                          className={cn(
                            "min-h-14 rounded-xl border px-4 py-3.5 text-left transition active:scale-[0.98]",
                            language === l.code
                              ? "border-mint bg-mint/20"
                              : "border-white/15 bg-white/5 hover:bg-white/10"
                          )}
                        >
                          <p className="font-heading text-base font-semibold">{l.label}</p>
                          <p className="text-xs text-white/65">{l.tagline}</p>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <NavRow
                    onBack={undefined}
                    onNext={() => nationality && language && goNext()}
                    nextDisabled={!nationality || !language}
                    nextLabel="Ver destinos"
                  />
                </div>
              </StepShell>
            )}

            {step === 2 && language && (
              <StepShell
                title="Destinos sugeridos para ti"
                subtitle="Ordenados por menor fricción de visa y precio de entrada (datos demo)."
              >
                <div className="grid gap-3 sm:gap-4">
                  {destinations.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDestinationId(d.id);
                        setProgramId("");
                      }}
                      className={cn(
                        "group overflow-hidden rounded-2xl border text-left transition active:scale-[0.99]",
                        destinationId === d.id
                          ? "border-mint ring-2 ring-mint/40"
                          : "border-white/15 hover:border-white/35"
                      )}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
                        <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[140px]">
                          <Image
                            src={d.imageUrl}
                            alt={d.city}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 180px"
                          />
                        </div>
                        <div className="space-y-2 bg-white/5 p-3.5 sm:p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold tracking-wide text-mint uppercase">
                              {d.country}
                            </p>
                            <FrictionPill level={d.visaFriction} />
                          </div>
                          <p className="font-heading text-lg font-semibold sm:text-xl">{d.city}</p>
                          <p className="text-sm leading-snug text-white/75">{d.tagline}</p>
                          <p className="hidden text-xs text-white/55 line-clamp-2 sm:block">{d.blurb}</p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {d.vibe.map((v) => (
                              <span
                                key={v}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-white">
                            Desde {formatUsd(d.fromWeeklyUsd)}
                            <span className="font-normal text-white/60"> / semana</span>
                          </p>
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
                title="¿Cuándo viajas?"
                subtitle="Elige fecha de inicio y duración — calculamos el fin de tu experiencia en vivo."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Fecha de inicio">
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-white/95 px-3 text-base text-ink outline-none focus:ring-2 focus:ring-mint"
                    />
                  </Field>
                  <Field label="Duración">
                    <div className="grid grid-cols-3 gap-2">
                      {WEEK_OPTIONS.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWeeks(w)}
                          className={cn(
                            "min-h-14 rounded-xl border px-2 py-3 text-center text-sm font-semibold active:scale-[0.98]",
                            weeks === w
                              ? "border-mint bg-mint/25"
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
                  </Field>
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint/10 p-4">
                  <CalendarDays className="mt-0.5 size-5 text-mint" />
                  <div>
                    <p className="text-sm font-semibold">Calculadora de fin de viaje</p>
                    <p className="mt-1 text-sm text-white/80">
                      Salida: <strong>{formatDateEs(startDate)}</strong>
                      <br />
                      Regreso estimado: <strong>{formatDateEs(endDate)}</strong>
                    </p>
                  </div>
                </div>
                <NavRow
                  onBack={goBack}
                  onNext={goNext}
                  nextLabel="Ver programas"
                />
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="Elige tu programa"
                subtitle="Sugerencias demo: idioma general, prep exámenes e idioma +30."
              >
                {programs.length === 0 ? (
                  <p className="text-sm text-white/70">
                    No hay programas mock para esta combinación. Vuelve y elige otro destino.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {programs.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProgramId(p.id)}
                        className={cn(
                          "overflow-hidden rounded-2xl border text-left transition active:scale-[0.99]",
                          programId === p.id
                            ? "border-mint ring-2 ring-mint/40"
                            : "border-white/15 hover:border-white/35"
                        )}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr]">
                          <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[120px]">
                            <Image
                              src={p.imageUrl}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 140px"
                            />
                          </div>
                          <div className="space-y-1.5 p-3.5 sm:p-4">
                            <p className="text-[11px] font-semibold tracking-wide text-mint uppercase">
                              {PROGRAM_KIND_LABELS[p.kind]} · {p.schoolName}
                            </p>
                            <p className="font-heading text-base font-semibold sm:text-lg">{p.title}</p>
                            <p className="text-sm leading-snug text-white/70">{p.summary}</p>
                            <p className="text-sm">
                              {p.lessonsPerWeek} lecciones/sem ·{" "}
                              <strong>{formatUsd(p.weeklyUsd)}</strong>/semana
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {p.highlights.map((h) => (
                                <span
                                  key={h}
                                  className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
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
                title="Extras para tu experiencia"
                subtitle="Alojamiento, seguro y recepción en aeropuerto. El total se actualiza a la derecha."
              >
                <ExtrasGroup
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
                          ? "Incluido $0"
                          : `+${formatUsd(a.perWeekUsd)}/sem`
                      }
                      imageUrl={a.imageUrl}
                    />
                  ))}
                </ExtrasGroup>
                <ExtrasGroup title="Seguro de viaje" icon={<Shield className="size-4" />}>
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
                </ExtrasGroup>
                <ExtrasGroup
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
                </ExtrasGroup>
                <NavRow onBack={goBack} onNext={goNext} nextLabel="Agregar tarjeta" />
              </StepShell>
            )}

            {step === 6 && (
              <StepShell
                title="Valida tu tarjeta"
                subtitle="Aún no cobramos. Solo guardamos el método de pago; el cargo ocurre al enviar tus datos de contacto."
              >
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/70">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-mint" />
                  Demo partner: valida con{" "}
                  <code className="rounded bg-black/30 px-1">4242 4242 4242 4242</code>,
                  cualquier MM/AA futuro y CVC de 3 dígitos. Stripe real se activa con env keys.
                </div>
                <div className="grid gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Nombre en la tarjeta</span>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink"
                      placeholder="Como aparece en la tarjeta"
                      autoComplete="cc-name"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Número</span>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 font-mono text-base text-ink"
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1 text-sm">
                      <span className="text-white/70">MM/AA</span>
                      <input
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink"
                        placeholder="12/28"
                        autoComplete="cc-exp"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-white/70">CVC</span>
                      <input
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink"
                        placeholder="123"
                        autoComplete="cc-csc"
                      />
                    </label>
                  </div>
                </div>
                {error && <ErrorBox message={error} />}
                <NavRow
                  onBack={goBack}
                  onNext={validateCardAndContinue}
                  nextLabel="Tarjeta validada — continuar"
                  nextIcon={<CreditCard className="size-4" />}
                />
              </StepShell>
            )}

            {step === 7 && (
              <StepShell
                title="Tus datos de contacto"
                subtitle="Al enviar, cobramos la tarjeta y disparamos las 3 confirmaciones (cliente, escuela, MPE)."
              >
                {paymentMethodId && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-mint/30 bg-mint/10 px-3 py-2 text-sm">
                    <Check className="size-4 text-mint" />
                    Tarjeta {cardBrand.toUpperCase()} ···· {cardLast4} lista para cobrar
                  </div>
                )}
                <div className="grid gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Nombre completo</span>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink"
                      autoComplete="name"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Email</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink"
                      autoComplete="email"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Teléfono</span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-white px-3 text-base text-ink"
                      placeholder="+57 300 000 0000"
                      autoComplete="tel"
                    />
                  </label>
                </div>
                {error && <ErrorBox message={error} />}
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
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
                      <Sparkles className="size-4" />
                    )}
                    {loading
                      ? "Cobrando…"
                      : `Confirmar y pagar ${formatUsd(pricing.total)}`}
                  </button>
                </div>
              </StepShell>
            )}

            {step === 8 && bookingId && (
              <StepShell
                title="¡Experiencia reservada!"
                subtitle={`Booking ${bookingId} · cobro ${paymentMode === "stripe" ? "Stripe" : "demo mock"} · emails vía ${emailProvider === "resend" ? "Resend" : "log/UI"}`}
              >
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-mint/40 bg-mint/15 p-4">
                  <Check className="mt-0.5 size-6 text-mint" />
                  <div>
                    <p className="font-heading text-xl font-semibold">
                      {contactName}, ya eres parte de Marco Polo Experience
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      {destination?.city} · {program?.title} · {formatDateEs(startDate)} →{" "}
                      {formatDateEs(endDate)}
                    </p>
                  </div>
                </div>

                <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
                  <Mail className="size-4 text-mint" />
                  Tres correos disparados
                </h3>
                <div className="space-y-3">
                  {emails.map((e) => (
                    <details
                      key={e.id}
                      className="rounded-xl border border-white/15 bg-black/20 open:bg-black/30"
                      open={e.id === "cliente"}
                    >
                      <summary className="cursor-pointer list-none px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-mint uppercase">
                          {e.id === "cliente"
                            ? "1 · Cliente"
                            : e.id === "escuela"
                              ? "2 · Escuela"
                              : "3 · Marco Polo interno"}
                        </p>
                        <p className="text-sm font-medium">{e.subject}</p>
                        <p className="text-xs text-white/55">Para: {e.to}</p>
                      </summary>
                      <pre className="overflow-x-auto whitespace-pre-wrap border-t border-white/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-white/80">
                        {e.body}
                      </pre>
                    </details>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => window.location.assign("/")}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "mt-6 h-11 border-0 text-ink gradient-cta"
                  )}
                >
                  Nueva reserva demo
                </button>
              </StepShell>
            )}
          </div>

          {showSidebar && (
            <aside className="hidden h-fit rounded-[1.6rem] border border-white/15 bg-white p-5 text-ink shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)] lg:sticky lg:top-6 lg:block">
              <PricePanel
                city={destination?.city}
                programTitle={program?.title}
                weeks={weeks}
                imageUrl={destination?.imageUrl}
                pricing={pricing}
              />
            </aside>
          )}
        </div>
      </div>

      {/* Mobile sticky / collapsible price bar */}
      {showSidebar && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          {priceOpen && (
            <button
              type="button"
              aria-label="Cerrar resumen"
              className="absolute inset-x-0 bottom-full h-[100dvh] bg-black/45"
              onClick={() => setPriceOpen(false)}
            />
          )}
          <div className="border-t border-white/10 bg-white text-ink shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setPriceOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 pt-3 pb-2 text-left"
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
            {priceOpen && (
              <div className="max-h-[55dvh] overflow-y-auto border-t border-border px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
                <PricePanel
                  city={destination?.city}
                  programTitle={program?.title}
                  weeks={weeks}
                  imageUrl={destination?.imageUrl}
                  pricing={pricing}
                  compact
                />
              </div>
            )}
            {!priceOpen && (
              <div className="px-4 pb-[calc(0.65rem+env(safe-area-inset-bottom))] text-center text-[11px] text-muted-foreground">
                Toca para ver el desglose
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="font-heading text-[1.35rem] leading-tight font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/70">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function PricePanel({
  city,
  programTitle,
  weeks,
  imageUrl,
  pricing,
  compact = false,
}: {
  city?: string;
  programTitle?: string;
  weeks: number;
  imageUrl?: string;
  pricing: {
    courseTotal: number;
    accommodationTotal: number;
    insuranceTotal: number;
    airportTotal: number;
    total: number;
  };
  compact?: boolean;
}) {
  return (
    <div>
      {!compact && (
        <>
          <p className="text-xs font-semibold tracking-[0.16em] text-indigo uppercase">
            Tu paquete
          </p>
          <h2 className="mt-1 font-heading text-2xl font-semibold">{city ?? "Destino"}</h2>
          <p className="text-sm text-muted-foreground">
            {programTitle ?? "Programa"} · {weeks} semanas
          </p>
          {imageUrl && (
            <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-xl">
              <Image
                src={imageUrl}
                alt={city ?? "Destino"}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          )}
        </>
      )}
      {compact && (
        <p className="mb-3 text-sm text-muted-foreground">
          {programTitle ?? "Programa"} · {weeks} semanas
        </p>
      )}
      <div className={cn("space-y-2 text-sm", !compact && "mt-4")}>
        <Row label="Curso" value={formatUsd(pricing.courseTotal)} />
        <Row label="Alojamiento" value={formatUsd(pricing.accommodationTotal)} />
        <Row label="Seguro" value={formatUsd(pricing.insuranceTotal)} />
        <Row label="Aeropuerto" value={formatUsd(pricing.airportTotal)} />
        <div className="flex justify-between border-t border-border pt-2 font-heading text-lg font-semibold">
          <span>Total</span>
          <span>{formatUsd(pricing.total)}</span>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Precios demo (mock). Edvisor será la fuente de verdad de tarifas reales.
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/70">{label}</p>
      {children}
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
    <div className="flex flex-col-reverse gap-2.5 pt-3 sm:flex-row">
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
    medium: "bg-amber-400/20 text-amber-100",
    high: "bg-rose-400/20 text-rose-100",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", color[level])}>
      {map[level]}
    </span>
  );
}

function ExtrasGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
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
        selected ? "border-mint bg-mint/15" : "border-white/15 bg-white/5 hover:bg-white/10"
      )}
    >
      {imageUrl && (
        <span className="relative hidden h-14 w-16 shrink-0 overflow-hidden rounded-lg sm:block">
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="64px" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-white/65">{description}</span>
      </span>
      <span className="shrink-0 self-center text-sm font-semibold text-mint">{price}</span>
    </button>
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
