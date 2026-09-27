"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Lock, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DURATION_OPTIONS, formatUsd } from "@/lib/pricing";
import type { DurationWeeks, School } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CheckoutBuilderProps {
  school: School;
  reserved?: boolean;
  initialWeeks?: DurationWeeks;
  stripeConfigured?: boolean;
}

/**
 * Legacy course builder — informational weekly × weeks only.
 * Checkout requires nationality, age, startDate and delegates to exact quote service.
 * No generic accommodation/insurance charges.
 */
export function CheckoutBuilder({
  school,
  reserved = false,
  initialWeeks = 4,
  stripeConfigured = false,
}: CheckoutBuilderProps) {
  const [weeks, setWeeks] = useState<DurationWeeks>(initialWeeks);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [nationality, setNationality] = useState("COL");
  const [studentAge, setStudentAge] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const informationalTotal = useMemo(
    () => school.weeklyPrice * weeks,
    [school.weeklyPrice, weeks]
  );

  const guestValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.trim().length >= 7;

  async function handleCheckout() {
    setError(null);

    if (!stripeConfigured) {
      setError(
        "Stripe no está configurado. No hay cobro simulado."
      );
      return;
    }

    if (!guestValid) {
      setError("Completa nombre, email y teléfono antes de pagar.");
      return;
    }

    const age = Number(studentAge);
    if (!Number.isFinite(age) || age < 1) {
      setError("Edad del estudiante requerida.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolSlug: school.slug,
          weeks,
          startDate,
          nationality,
          studentAge: age,
          guest: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
        }),
      });

      const data = (await res.json()) as {
        url?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok || !data.url) {
        setError(
          data.error ??
            "No pudimos iniciar Stripe Checkout. Se requiere cotización Edvisor exacta."
        );
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Error de red al contactar Stripe.");
      setLoading(false);
    }
  }

  if (reserved) {
    return (
      <div className="rounded-[1.4rem] border border-border bg-white p-6 shadow-[0_24px_60px_-36px_rgba(38,38,59,0.55)] lg:sticky lg:top-6">
        <p className="font-heading text-xl font-semibold text-ink">
          Reserva en proceso
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si ya pagaste en Stripe, la confirmación llega por webhook firmado — no
          por esta pantalla.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-white p-6 shadow-[0_24px_60px_-36px_rgba(38,38,59,0.55)] lg:sticky lg:top-6">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-indigo uppercase">
        Checkout
      </p>
      <h2 className="mt-1 font-heading text-2xl font-semibold text-ink">
        {school.name}
      </h2>
      <p className="mt-2 flex items-start gap-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        El total informativo del catálogo no se cobra. Stripe usa la cotización
        Edvisor exacta; sin ella el checkout se bloquea.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="text-muted-foreground">Duración</span>
          <select
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value) as DurationWeeks)}
          >
            {DURATION_OPTIONS.map((o) => (
              <option key={o.weeks} value={o.weeks}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Inicio del curso</span>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Nacionalidad (ISO UI)</span>
          <select
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          >
            {["COL", "MEX", "PER", "CHL", "ARG", "BRA", "ECU", "URY", "CRI", "PAN"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Edad del estudiante</span>
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            value={studentAge}
            onChange={(e) => setStudentAge(e.target.value)}
            placeholder="22"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Nombre</span>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Teléfono</span>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-mist/60 px-4 py-3 text-sm">
        <p className="text-muted-foreground">Informativo catálogo</p>
        <p className="font-heading text-2xl font-semibold text-ink">
          {formatUsd(informationalTotal)}
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleCheckout}
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-4 h-12 w-full gap-2 border-0 text-ink gradient-cta disabled:opacity-50"
        )}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : stripeConfigured ? (
          <Lock className="size-4" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {loading ? "Abriendo Stripe…" : "Pagar con Stripe Checkout"}
      </button>
    </div>
  );
}
