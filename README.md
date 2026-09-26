# Marco Polo Experience

Partner-demo ecommerce (LatAm-first, Spanish UI) for short language stays abroad. Sister of [Marco Polo Education](https://www.marcopoloeducation.com).

**This build runs on rich static mock data** (dummy prices/content). Edvisor is stubbed for later.

## Locked purchase flow

1. País (nacionalidad) + idioma  
2. Países destino sugeridos  
3. Fechas (inicio + semanas + calculadora de fin)  
4. Programa (general / prep exámenes / +30)  
5. Extras + precio sticky (alojamiento, seguro, aeropuerto)  
6. Tarjeta (validar método — aún no cobra)  
7. Contacto → **cobra al enviar**  
8. Confirmación + 3 emails (cliente, escuela, MPE interno)

## Stack

- Next.js App Router, Tailwind, shadcn/ui  
- Stripe path (optional env) · Resend path (optional env)  
- Mock catalog: `lib/data/mock-catalog.ts`  
- Edvisor stub: `lib/edvisor/client.ts`

## Env

```bash
# Optional — real Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional — real email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Marco Polo Experience <onboarding@resend.dev>
MPE_INTERNAL_EMAIL=ops@yourdomain.com

NEXT_PUBLIC_APP_URL=http://127.0.0.1:4317
```

Without Stripe/Resend keys the full click-through still works: mock charge + email payloads in UI/logs.

Demo card: `4242 4242 4242 4242`, any future MM/AA, any 3-digit CVC.

## Run

```bash
npm install
npm run build
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).
