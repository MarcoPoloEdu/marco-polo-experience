# Marco Polo Experience

Marketplace ecommerce (LatAm-first) para reservar cursos cortos de idiomas en el exterior. Empresa hermana de [Marco Polo Education](https://www.marcopoloeducation.com).

UI en español · catálogo estático · matriz de visa orientativa · **Stripe Checkout** real (modo test).

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS + shadcn/ui + Lucide React
- Stripe Checkout Sessions
- Tipografía Syne + Manrope
- Paleta alineada a MPE: navy `#26263b`, mint `#03ce81`, indigo `#4d65ff`

## Flujo (Fase 1)

1. **Nacionalidad** (pasaporte LatAm)
2. **Destino** (ciudad / idioma del catálogo)
3. **Visa** — solo si el destino suele requerir visa consular; si no tienes visa → alternativas sin visa
4. Resultados de escuelas → course builder (duración, alojamiento, seguro)
5. Datos de invitado (nombre, email, teléfono) → **Stripe Checkout** → success / cancel

La matriz de visa es orientación general, no asesoría legal.

## Variables de entorno

Copia `.env.example` a `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Opcional — verificación de webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
# Opcional — URL pública (túnel / deploy) para success/cancel de Checkout
NEXT_PUBLIC_APP_URL=http://127.0.0.1:4317
```

Sin las keys de Stripe, el CTA de pago muestra un mensaje claro de setup; el código de Checkout Session ya está cableado en `POST /api/checkout`.

Webhook opcional: `POST /api/webhooks/stripe` (evento `checkout.session.completed`).

## Precios

- Matrícula = precio semanal × semanas (4 / 8 / 12)
- Homestay +USD 180/semana · Residencia +USD 220/semana
- Guard.me +USD 45 fijos

## Correr en local

```bash
npm install
npm run build
npm start
```

Abre [http://127.0.0.1:4317](http://127.0.0.1:4317).

Para desarrollo con hot reload:

```bash
npm run dev
```

> En este entorno, `next start` (producción) es más fiable para el checkout que Turbopack HMR.
