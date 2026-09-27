# Marco Polo Experience

Partner ecommerce (LatAm-first, Spanish UI) for short language stays abroad. Sister of [Marco Polo Education](https://www.marcopoloeducation.com).

**Course prices come from Edvisor** (exact quote service). Experience only enables/disables complete products via admin curation. Stripe Checkout is the only charge path — there is **no mock success** without a verified webhook.

## Purchase flow (V2)

1. País (nacionalidad) + idioma (EN / IT / FR / DE / PT)
2. Destino → fechas → programa
3. Extras informativos (cobro de extras requiere precio Edvisor verificado)
4. Resumen + edad del estudiante
5. Contacto → **Stripe Checkout**
6. Webhook firmado marca pagado → emails

## Stack

- Next.js App Router, Tailwind, shadcn/ui
- Dual Edvisor GraphQL clients (`api-v2` + `federation-gateway`) — no blind host fallback
- Exact quote: `lib/quotes/exact-quote.ts` + `POST /api/quotes`
- Admin: `/admin` — Google Sign-In, allowlist `admin@marcopoloeducation.com`
- Firestore for curation, catalog versions, bookings, quotes, stripe events
- Stripe Checkout + signed webhooks (secret required)
- Resend for transactional email (`procesos@marcopoloeducation.com`)

## Run

```bash
cp .env.example .env.local   # fill secrets
npm install
npm run dev                  # http://127.0.0.1:4317
npm test
npm run typecheck
```

Admin: http://127.0.0.1:4317/admin

Without Stripe / Edvisor keys, browsing works; **checkout is blocked** (503/409) — never simulated as paid.

## Docs

- `docs/experience-implementation-plan.md` — inventory + stages
- `docs/vercel-prep.md` — env, Firestore, cron, launch checklist

## Safety invariants

- Webhook without `STRIPE_WEBHOOK_SECRET` → 503
- Invalid/missing signature → 400
- Success URL does not mark paid
- Curation default = disabled (`=== true` required)
- No JSON-as-prod persistence (opt-in `ALLOW_LOCAL_PERSISTENCE=1` only outside production)
