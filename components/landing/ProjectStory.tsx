import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Compass,
  Headphones,
  Lock,
  MapPinned,
  Receipt,
  Sparkles,
  Stamp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    icon: Stamp,
    title: "Pasaporte e idioma",
    body: "Nos dices de dónde eres y qué idioma quieres vivir. Filtramos destinos según tu pasaporte para que no pierdas tiempo con opciones que no te sirven.",
  },
  {
    n: "02",
    icon: MapPinned,
    title: "Destino y escuela",
    body: "Eliges país, ciudad y escuela entre centros acreditados que Marco Polo Education ya conoce y recomienda.",
  },
  {
    n: "03",
    icon: Receipt,
    title: "Cotización exacta y reserva",
    body: "Ves el precio real del curso, directo del sistema de la escuela, y reservas en línea con pago seguro. Sin sorpresas después.",
  },
] as const;

const PROMOS = [
  {
    icon: CalendarClock,
    kicker: "Early bird",
    title: "Reserva con tiempo, paga menos",
    body: "Algunas escuelas premian a quien reserva con anticipación. Si tu fecha aplica, el beneficio aparece en tu cotización.",
    cta: "Consulta en tu cotización",
    tone: "mint",
    featured: true,
  },
  {
    icon: Headphones,
    kicker: "Siempre incluido",
    title: "Asesoría gratis",
    body: "Un asesor de Marco Polo Education te acompaña antes, durante y después del viaje. Sin costo extra.",
    cta: "Hablar con un asesor",
    tone: "indigo",
  },
  {
    icon: BadgeCheck,
    kicker: "Cupos limitados",
    title: "Matrícula prioritaria",
    body: "Aseguramos tu cupo en fechas de alta demanda (verano del norte, diciembre) apenas confirmas tu reserva.",
    cta: "Ver fechas disponibles",
    tone: "sky",
  },
  {
    icon: Sparkles,
    kicker: "Promos de escuela",
    title: "Descuentos oficiales de temporada",
    body: "Cuando una escuela lanza una promoción para LatAm, la aplicamos automáticamente. Lo que ves en la cotización es lo que pagas.",
    cta: "Cotizar ahora",
    tone: "amber",
  },
  {
    icon: Users,
    kicker: "Viaja acompañado",
    title: "Planes para grupos y amigos",
    body: "¿Van dos o más? Tu asesor revisa con la escuela condiciones para grupos y fechas compartidas.",
    cta: "Hablar con un asesor",
    tone: "rose",
  },
] as const;

const TONES: Record<(typeof PROMOS)[number]["tone"], string> = {
  mint: "from-mint/30 via-mint/5 to-transparent text-mint",
  indigo: "from-indigo/35 via-indigo/5 to-transparent text-indigo-300",
  sky: "from-sky-400/30 via-sky-400/5 to-transparent text-sky-300",
  amber: "from-amber-300/30 via-amber-300/5 to-transparent text-amber-200",
  rose: "from-rose-400/30 via-rose-400/5 to-transparent text-rose-300",
};

export function ProjectStory() {
  return (
    <div className="relative left-1/2 mt-10 -ml-[50vw] w-screen bg-gradient-to-b from-transparent via-ink via-15% to-ink pt-12 sm:mt-16 sm:pt-20">
      <div className="mx-auto max-w-6xl space-y-20 px-3 sm:space-y-28 sm:px-6">
      <section aria-labelledby="que-es" className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="space-y-5">
          <p className="text-xs font-semibold tracking-[0.2em] text-mint uppercase">
            Qué es Marco Polo Experience
          </p>
          <h2
            id="que-es"
            className="font-heading text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
          >
            Tu inmersión en otro idioma,{" "}
            <span className="bg-gradient-to-r from-mint to-indigo bg-clip-text text-transparent">
              reservada en minutos.
            </span>
          </h2>
          <p className="max-w-md text-base leading-relaxed text-white/70">
            Somos la plataforma de Marco Polo Education para cursos cortos de
            idiomas en el exterior: de 4 a 12 semanas, en escuelas reales, con
            precio exacto antes de pagar. Pensada para estudiantes de
            Latinoamérica que quieren vivir el idioma, no solo estudiarlo.
          </p>
          <ul className="grid gap-3 text-sm text-white/80 sm:grid-cols-2">
            {[
              { icon: Users, label: "Asesores con experiencia en LatAm" },
              { icon: Compass, label: "Escuelas acreditadas" },
              { icon: Receipt, label: "Precio oficial de la escuela" },
              { icon: Lock, label: "Pago seguro con Stripe" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/8 ring-1 ring-white/15">
                  <Icon className="size-4 text-mint" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <ol className="relative space-y-3 sm:space-y-4">
          {STEPS.map(({ n, icon: Icon, title, body }, i) => (
            <li
              key={n}
              className="group relative flex gap-4 overflow-hidden rounded-3xl border border-white/12 bg-white/[0.05] p-5 transition hover:border-white/25 hover:bg-white/[0.08] sm:gap-6 sm:p-6"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-2 font-heading text-[7rem] leading-none font-extrabold text-white/[0.04] transition group-hover:text-white/[0.07] sm:text-[9rem]"
              >
                {n}
              </span>
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl text-ink sm:size-14",
                  i === 0 && "bg-mint",
                  i === 1 && "bg-sky-300",
                  i === 2 && "bg-indigo text-white"
                )}
              >
                <Icon className="size-5 sm:size-6" strokeWidth={2.25} />
              </span>
              <div className="relative space-y-1.5">
                <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-white/45">
                  PASO {n}
                </p>
                <h3 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-white/65">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="promociones" className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-mint uppercase">
              Promociones
            </p>
            <h2
              id="promociones"
              className="font-heading text-3xl leading-[1.05] font-bold tracking-tight sm:text-5xl"
            >
              Beneficios que viajan contigo
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Las condiciones cambian por escuela y fecha. El valor final de cada
            beneficio siempre aparece en tu cotización exacta.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {PROMOS.map((p) => {
            const Icon = p.icon;
            const featured = "featured" in p && p.featured;
            const href = p.cta === "Hablar con un asesor"
              ? "https://www.marcopoloeducation.com"
              : "#empezar";
            return (
              <article
                key={p.title}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/30",
                  featured && "sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:p-8"
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition group-hover:opacity-100",
                    TONES[p.tone]
                  )}
                />
                {featured && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full border-[28px] border-mint/15"
                  />
                )}
                <div className="relative flex items-center justify-between gap-3">
                  <span className={cn("flex size-11 items-center justify-center rounded-2xl bg-black/25 ring-1 ring-white/15", TONES[p.tone].split(" ").pop())}>
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/80 uppercase">
                    {p.kicker}
                  </span>
                </div>
                <h3
                  className={cn(
                    "relative mt-6 font-heading font-bold tracking-tight text-white",
                    featured ? "text-3xl leading-[1.05] sm:text-4xl" : "text-xl"
                  )}
                >
                  {p.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/70">
                  {p.body}
                </p>
                <a
                  href={href}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="relative mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-white transition group-hover:gap-2.5"
                >
                  {p.cta}
                  <ArrowRight className="size-4" />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] p-8 text-ink sm:p-12 gradient-cta">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="font-heading text-3xl leading-[1.05] font-extrabold tracking-tight sm:text-4xl">
              ¿Listo para tu próxima experiencia?
            </h2>
            <p className="text-sm font-medium text-ink/75 sm:text-base">
              Elige tu pasaporte y tu idioma. En pocos pasos ves la cotización
              exacta de tu curso.
            </p>
          </div>
          <a
            href="#empezar"
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-7 font-heading text-lg font-bold text-white transition hover:bg-ink/90"
          >
            Empezar ahora
            <ArrowRight className="size-5" />
          </a>
        </div>
      </section>

      <p className="pb-4 text-center text-xs text-white/40">
        Marco Polo Experience · by Marco Polo Education
      </p>
      </div>
    </div>
  );
}
