import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getLanguageLabel } from "@/lib/data/schools";
import { formatUsd } from "@/lib/pricing";
import type { DurationWeeks, School } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SchoolCardProps {
  school: School;
  weeks: DurationWeeks;
}

export function SchoolCard({ school, weeks }: SchoolCardProps) {
  const courseEstimate = school.weeklyPrice * weeks;
  const href = `/courses/${school.slug}`;

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-border bg-white shadow-[0_18px_40px_-30px_rgba(38,38,59,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(38,38,59,0.55)]">
      <Link
        href={href}
        className="absolute inset-0 z-10"
        aria-label={`Ver curso en ${school.name}`}
      />
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={school.images[0]}
          alt={school.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute top-3 left-3 z-[1]">
          <Badge className="border-0 bg-white/95 text-ink capitalize shadow-sm">
            {getLanguageLabel(school.language)}
          </Badge>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-ink">
            {school.name}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {school.city}, {school.country}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-ink">{school.rating}</span>
          <span className="text-muted-foreground">
            ({school.reviewCount} reseñas)
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="font-heading text-2xl font-semibold text-ink">
              {formatUsd(school.weeklyPrice)}
              <span className="text-sm font-normal text-muted-foreground"> / semana</span>
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ {formatUsd(courseEstimate)} por {weeks} semanas (solo matrícula)
            </p>
          </div>
          <span
            className={cn(
              buttonVariants({ size: "default" }),
              "pointer-events-none relative z-0 shrink-0 bg-ink text-white hover:bg-ink"
            )}
          >
            Ver curso
          </span>
        </div>
      </div>
    </article>
  );
}
