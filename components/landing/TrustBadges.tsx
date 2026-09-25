import { BadgeCheck, CircleDollarSign, ShieldCheck } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "Garantía 100% de devolución",
    description: "Cancela antes de tu fecha de inicio y recupera tu matrícula.",
  },
  {
    icon: CircleDollarSign,
    title: "Garantía de mejor precio",
    description: "Si encuentras una tarifa publicada más baja, te devolvemos la diferencia en 48h.",
  },
  {
    icon: BadgeCheck,
    title: "Rutas con menos fricción",
    description: "Destinos pensados para latinos que quieren empezar rápido su viaje.",
  },
];

export function TrustBadges() {
  return (
    <section className="relative z-10 -mt-8">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 sm:grid-cols-3 sm:px-6">
        {badges.map(({ icon: Icon, title, description }, index) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-white p-5 shadow-[0_20px_50px_-28px_rgba(38,38,59,0.45)]"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-mint/15 text-ink">
              <Icon className="size-5 text-[#029a61]" />
            </div>
            <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
