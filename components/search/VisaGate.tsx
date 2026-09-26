"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDestination } from "@/lib/data/schools";
import {
  VISA_DISCLAIMER,
  getVisaFreeDestinations,
} from "@/lib/data/visa-rules";
import type { DestinationSlug, PassportCode } from "@/lib/types";
import { cn } from "@/lib/utils";

function searchHref(
  passport: PassportCode,
  destination: DestinationSlug,
  opts?: { visaOk?: boolean }
) {
  const dest = getDestination(destination);
  const language = dest?.languages[0] ?? "english";
  const params = new URLSearchParams({
    passport,
    destination,
    language,
  });
  if (opts?.visaOk) params.set("visa", "ok");
  return `/search?${params.toString()}`;
}

interface VisaGateProps {
  passport: PassportCode;
  passportLabel: string;
  destination: DestinationSlug;
  destinationLabel: string;
}

export function VisaGate({
  passport,
  passportLabel,
  destination,
  destinationLabel,
}: VisaGateProps) {
  const visaFree = getVisaFreeDestinations(passport)
    .map((slug) => getDestination(slug))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">
            {destinationLabel} suele requerir visa consular para pasaporte{" "}
            {passportLabel}.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {VISA_DISCLAIMER}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold text-ink">
          ¿Tienes visa vigente?
        </h1>
        <p className="text-muted-foreground">
          Si ya tienes visa, puedes ver escuelas. Si no, te mostramos destinos sin
          esa fricción.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={searchHref(passport, destination, { visaOk: true })}
          data-testid="visa-yes"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 flex-1 border-0 text-ink gradient-cta hover:opacity-95"
          )}
        >
          Sí, tengo visa
        </a>
        <a
          href={`#alternativas`}
          data-testid="visa-no"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 flex-1")}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("alternativas")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          No tengo visa
        </a>
      </div>

      <div id="alternativas" className="space-y-3 scroll-mt-8">
        <h2 className="font-heading text-xl font-semibold text-ink">
          Alternativas sin visa consular
        </h2>
        {visaFree.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {visaFree.map((dest) =>
              dest ? (
                <a
                  key={dest.slug}
                  href={searchHref(passport, dest.slug)}
                  className="rounded-2xl border border-border bg-white p-4 transition hover:border-mint"
                >
                  <p className="text-xs font-semibold tracking-wide text-indigo uppercase">
                    {dest.country}
                  </p>
                  <p className="font-heading text-lg font-semibold text-ink">
                    {dest.city}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{dest.tagline}</p>
                </a>
              ) : null
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay destinos sin visa en el catálogo actual.{" "}
            <Link href="/" className="font-medium text-indigo hover:underline">
              Volver al inicio
            </Link>{" "}
            o consulta{" "}
            <a
              href="https://www.marcopoloeducation.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo hover:underline"
            >
              Marco Polo Education
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
