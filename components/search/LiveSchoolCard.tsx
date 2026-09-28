"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUsd } from "@/lib/pricing";
import type { LiveSearchSchool } from "@/lib/catalog/map-search-schools";
import { cn } from "@/lib/utils";

interface LiveSchoolCardProps {
  school: LiveSearchSchool;
}

/** Browse card for live /api/catalog schools → BookingWizard. */
export function LiveSchoolCard({ school }: LiveSchoolCardProps) {
  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-border bg-white shadow-[0_18px_40px_-30px_rgba(38,38,59,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(38,38,59,0.55)]">
      <a
        href={school.href}
        className="block focus-visible:outline-none"
        data-testid="live-school-card"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={school.imageUrl}
            alt={school.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute top-3 left-3">
            <Badge className="border-0 bg-white/95 text-ink capitalize shadow-sm">
              {school.languageLabel}
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

          <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
            <div>
              {school.weeklyHintUsd > 0 ? (
                <>
                  <p className="font-heading text-2xl font-semibold text-ink">
                    desde {formatUsd(school.weeklyHintUsd)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / semana
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hint de catálogo · cobro exacto al cotizar
                  </p>
                </>
              ) : (
                <>
                  <p className="font-heading text-lg font-semibold text-ink">
                    Cotización en vivo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {school.programCount > 0
                      ? `${school.programCount} programas · precio exacto al reservar`
                      : "Precio exacto vía cotizador Edvisor"}
                  </p>
                </>
              )}
            </div>
            <span
              className={cn(
                buttonVariants({ size: "default" }),
                "shrink-0 bg-ink text-white"
              )}
            >
              Cotizar
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}
