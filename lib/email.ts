export interface EmailPayload {
  id: "cliente" | "escuela" | "interno";
  to: string;
  subject: string;
  preview: string;
  body: string;
}

export interface BookingEmailContext {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  nationalityLabel: string;
  languageLabel: string;
  destinationLabel: string;
  programTitle: string;
  schoolName: string;
  schoolEmail: string;
  startDate: string;
  endDate: string;
  weeks: number;
  totalUsd: number;
  extrasSummary: string;
  charged: boolean;
  paymentMode: "stripe" | "mock";
}

export function buildBookingEmails(ctx: BookingEmailContext): EmailPayload[] {
  const money = `USD ${ctx.totalUsd}`;
  return [
    {
      id: "cliente",
      to: ctx.customerEmail,
      subject: `Confirmación Marco Polo Experience · ${ctx.bookingId}`,
      preview: `Tu experiencia en ${ctx.destinationLabel} está reservada.`,
      body: [
        `Hola ${ctx.customerName},`,
        ``,
        `¡Listo! Tu reserva ${ctx.bookingId} quedó confirmada.`,
        ``,
        `Destino: ${ctx.destinationLabel}`,
        `Programa: ${ctx.programTitle} (${ctx.schoolName})`,
        `Fechas: ${ctx.startDate} → ${ctx.endDate} (${ctx.weeks} semanas)`,
        `Extras: ${ctx.extrasSummary}`,
        `Total cobrado: ${money} (${ctx.paymentMode === "stripe" ? "Stripe" : "demo mock"})`,
        ``,
        `En las próximas horas la escuela te contactará con onboarding.`,
        `Equipo Marco Polo Experience`,
        `(hermana de Marco Polo Education)`,
      ].join("\n"),
    },
    {
      id: "escuela",
      to: ctx.schoolEmail,
      subject: `[MPE] Nueva reserva ${ctx.bookingId} · ${ctx.customerName}`,
      preview: `Procesar inscripción · ${ctx.programTitle}`,
      body: [
        `Hola equipo ${ctx.schoolName},`,
        ``,
        `Nueva reserva pagada vía Marco Polo Experience.`,
        ``,
        `Booking ID: ${ctx.bookingId}`,
        `Estudiante: ${ctx.customerName}`,
        `Email: ${ctx.customerEmail}`,
        `Teléfono: ${ctx.customerPhone}`,
        `Nacionalidad: ${ctx.nationalityLabel}`,
        `Idioma: ${ctx.languageLabel}`,
        `Programa: ${ctx.programTitle}`,
        `Fechas: ${ctx.startDate} → ${ctx.endDate}`,
        `Extras: ${ctx.extrasSummary}`,
        `Total: ${money}`,
        ``,
        `Por favor confirmen plaza y envíen welcome pack al estudiante.`,
        `Marco Polo Experience — operaciones`,
      ].join("\n"),
    },
    {
      id: "interno",
      to: process.env.MPE_INTERNAL_EMAIL ?? "ops@marcopoloexperience.example",
      subject: `[Interno] Paid booking ${ctx.bookingId}`,
      preview: `${ctx.destinationLabel} · ${money} · ${ctx.customerEmail}`,
      body: [
        `Reserva cobrada.`,
        `ID: ${ctx.bookingId}`,
        `Cliente: ${ctx.customerName} <${ctx.customerEmail}>`,
        `Tel: ${ctx.customerPhone}`,
        `Pasaporte: ${ctx.nationalityLabel}`,
        `Destino/Programa: ${ctx.destinationLabel} / ${ctx.programTitle}`,
        `Escuela: ${ctx.schoolName} <${ctx.schoolEmail}>`,
        `Fechas: ${ctx.startDate} → ${ctx.endDate} (${ctx.weeks} sem)`,
        `Extras: ${ctx.extrasSummary}`,
        `Total: ${money}`,
        `Payment: ${ctx.paymentMode}`,
        `Charged: ${ctx.charged}`,
      ].join("\n"),
    },
  ];
}

export async function deliverEmails(
  emails: EmailPayload[]
): Promise<{ delivered: boolean; provider: "resend" | "log" }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Marco Polo Experience <onboarding@resend.dev>";

  if (!key) {
    for (const email of emails) {
      console.info("[email:mock]", email.id, "→", email.to, email.subject);
      console.info(email.body);
    }
    return { delivered: false, provider: "log" };
  }

  try {
    const results = await Promise.all(
      emails.map(async (email) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: email.to,
            subject: email.subject,
            text: email.body,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("[email:resend:fail]", email.id, text);
          return false;
        }
        return true;
      })
    );
    return { delivered: results.every(Boolean), provider: "resend" };
  } catch (err) {
    console.error("[email:resend:error]", err);
    for (const email of emails) {
      console.info("[email:fallback-log]", email.id, email.subject);
    }
    return { delivered: false, provider: "log" };
  }
}
