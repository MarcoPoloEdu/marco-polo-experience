import { BadgeCheck, CircleDollarSign, ShieldCheck } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "100% Money-Back Guarantee",
    description: "Cancel before your start date for a full tuition refund.",
  },
  {
    icon: CircleDollarSign,
    title: "Low Price Guarantee",
    description: "Find a lower published rate and we refund the difference within 48h.",
  },
  {
    icon: BadgeCheck,
    title: "Zero Visa Required",
    description: "Destinations where US passport holders travel without a consular visa.",
  },
];

export function TrustBadges() {
  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
        {badges.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
