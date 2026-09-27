# Marco Polo Experience

Partner ecommerce (LatAm-first, Spanish UI) for short language stays abroad. Sister of [Marco Polo Education](https://www.marcopoloeducation.com).

**Cotizador prices/programs/schools come from the Edvisor portable export** vendored at `vendor/marco-polo-experience-edvisor`. Experience only enables/disables complete Edvisor products (admin curation). Agency extras (alojamiento, seguro, aeropuerto) stay local.

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
- Edvisor catalog: `vendor/marco-polo-experience-edvisor` → `lib/edvisor/client.ts` → cotizador  
- Admin: `/admin` — Google Sign-In (Firebase Auth), allowlist `admin@marcopoloeducation.com`  
- Stripe / Resend optional (mock when empty)

## Edvisor portable export

Upstream (private):  
`https://github.com/MarcoPoloEdu/marcopoloeducation/tree/cursor/mpe-edvisor-portable-5222/exports/marco-polo-experience-edvisor`

Until GitHub access is available, this repo vendors a seed shaped like that export. Replace `vendor/marco-polo-experience-edvisor/data/catalog.json` with the upstream package when you can clone it (set `GITHUB_TOKEN` if needed). Do not invent course prices in a separate CMS.

## Env

Copy `.env.example` → `.env.local`.

```bash
# --- Firebase client (required for /admin Google login) ---
# Ask the team for an EXISTING project ID or confirmation to create a NEW one.
# Do not invent a production project ID.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- Firebase Admin (preferred for production token verify + Firestore) ---
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# --- Stripe / Resend (optional) ---
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Marco Polo Experience <onboarding@resend.dev>
MPE_INTERNAL_EMAIL=ops@marcopoloeducation.com
NEXT_PUBLIC_APP_URL=http://127.0.0.1:4317
```

Without Firebase env, `/admin` shows a setup screen; the public cotizador still runs on the Edvisor vendor catalog. Without Stripe/Resend, booking uses mock charge + email payloads.

Demo card: `4242 4242 4242 4242`, any future MM/AA, any 3-digit CVC.

Authorized domains for Google Sign-In must include `localhost` (no protocol/port) and your deploy host — see Firebase Console → Authentication → Settings, or `firebase.json` auth block + `npx -y firebase-tools@latest deploy --only auth`.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317) · Admin [http://127.0.0.1:4317/admin](http://127.0.0.1:4317/admin)

## Firebase CLI

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use <PROJECT_ID>
npx -y firebase-tools@latest deploy --only auth,firestore:rules
```
