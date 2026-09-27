# Vercel preparation — Marco Polo Experience V2

## Stack

Next.js App Router on Vercel. Node.js runtime for Route Handlers that touch Firebase Admin, Edvisor, Stripe, and Resend.

## Environments

| Env | Purpose |
| --- | --- |
| Development | Local `.env.local`; Stripe test; optional `ALLOW_LOCAL_PERSISTENCE=1` |
| Preview | Stripe test; Firestore; no live enrollments; Edvisor read-only |
| Production | Explicit activation after review — **not** auto-enabled by deploy |

## Required env vars

See `.env.example`. Critical:

- Dual Edvisor URLs (`EDVISOR_API_V2_URL`, `EDVISOR_GATEWAY_URL`) + `EDVISOR_API_KEY` (server-only)
- Firebase client + Admin service account
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, **`STRIPE_WEBHOOK_SECRET` (required)**
- `RESEND_API_KEY`, `MPE_INTERNAL_EMAIL=procesos@marcopoloeducation.com`
- `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`

Missing Stripe webhook secret → webhook returns **503** (configuration error). Missing Stripe keys → checkout returns **503** (no mock charge).

## Firestore

Collections (Admin SDK only for writes):

- `curation/experience`
- `catalogVersions/{versionId}`, `catalogMeta/active`
- `quotes/{quoteId}`, `bookings/{bookingId}`
- `stripeEvents/{eventId}`, `jobs/{jobId}`

Deploy rules: `npx firebase deploy --only firestore:rules,firestore:indexes`

## Cron

Plan a Vercel Cron hitting an authenticated `/api/cron/jobs` with `Authorization: Bearer $CRON_SECRET` once jobs are wired. Document plan limits before promising SLA.

## Stripe webhook

Endpoint: `https://<host>/api/webhooks/stripe`  
Events: `checkout.session.completed` (extend as needed)  
Signature verification is mandatory.

## Launch checklist (not done by deploy)

1. Technical review of payment + curation defaults
2. Commercial enablement of schools/programs in `/admin`
3. Stripe live keys + webhook secret
4. Edvisor gateway access verified for the agency account
5. Minors / tax / ancillary policy sign-off
6. No DNS or production enrollment without explicit authorization

## Region / cost

Choose a Vercel + Firestore region close to LatAm traffic. Estimate function invocations for sync + webhooks + cron; do not assume free tier.
