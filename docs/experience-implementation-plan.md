# Marco Polo Experience — V2 implementation plan

Inventory before code changes · branch `cursor/v2-experience-hardening-f7cb` · base `origin/cursor/phase1-latam-stripe-9987`.

## Repo snapshot

| Item | Finding |
| --- | --- |
| Stack | Next.js 16.3 App Router, React 19, Tailwind 4, Stripe, Firebase Admin, Resend |
| Public UI | `BookingWizard` (home) + legacy `CheckoutBuilder` / courses |
| Catalog | Vendor seed `@marco-polo/experience-edvisor` + optional live sync JSON |
| Admin | `/admin` Firebase Google allowlist `admin@marcopoloeducation.com` |
| Edvisor ref | Upstream export **not readable** this session (private GitHub, no token). Vendor is a **seed JSON**, not the portable client. |

## Critical defects (V2 §3) — must fix first

1. **`POST /api/book`** marks `charged: true` without Stripe confirmation; falls back to mock success on Stripe errors.
2. **`BookingWizard`** client-side mock invents a paid booking if `/api/book` fails.
3. **Webhook** accepts unsigned JSON when `STRIPE_WEBHOOK_SECRET` missing; only logs events.
4. **Dual pricing**: `lib/booking/pricing.ts` (mock-catalog) vs `lib/pricing.ts` (schools weekly × weeks + generic extras).
5. **Curation default `?? true`** — unpublished products sellable.
6. **JSON persistence**: `data/curation.json`, `data/edvisor-live-catalog.json` under `process.cwd()` as write targets.
7. **Live sync** invents `lessonsPerWeek: 20`, `minWeeks: 4`, uses `Math.min(...prices)` as weekly charge basis.
8. **Edvisor client** blind-falls-back between `api.edvisor.io` and `api-v2.edvisor.io`.
9. **Success page** copy implies payment confirmed without server verify.
10. Internal email default `ops@` — must be `procesos@marcopoloeducation.com`.

## Stages (this branch)

### A — Safety + persistence (first) ✅ in progress / largely done
- Single checkout path: pending booking in Firestore → Stripe Checkout Session → webhook verifies signature → paid.
- Reject book/checkout without Stripe config; never mock-charge.
- Webhook requires secret; persist idempotent Stripe events + booking payment state.
- Success page verifies session status for display only; does not mark paid.
- Curation defaults **disabled** (`=== true`); apply curation on all purchase paths.
- Firestore for catalog versions / bookings / quotes; local JSON only with explicit `ALLOW_LOCAL_PERSISTENCE=1` and non-production.

### B — Dual Edvisor clients + exact quote ✅ scaffolded
- Explicit `api-v2` and `federation-gateway` clients; **no** host fallback on schema/auth errors.
- Server-only Bearer; agency configurable (`EDVISOR_AGENCY_ID`).
- One `createExactQuote` service used by cotizador preview + checkout.
- Parity harness pending live credentials.

### C–F — Catalog admin polish, enrollment/jobs depth, more acceptance tests
Continuing in follow-up commits on this branch.

## Reversible vs external blockers

| Reversible (ship now) | Blocked externally |
| --- | --- |
| Payment safety, defaults, Firestore models, dual clients, quote API shape, tests | Live Edvisor parity (needs API key + gateway access) |
| Admin sync → Firestore | Upstream portable package replace (needs GitHub token) |
| Stripe test Checkout | Production Stripe / DNS / real school enrollments (user auth required) |

## Decision log

- Keep Next.js; do not rebuild UI from scratch.
- Stripe Checkout hosted is the only charge path; `/api/book` delegates to it.
- Vendor catalog remains browse/seed only — **not** a production charge source when Edvisor live quote fails.
- Local JSON writes are opt-in for offline admin demos only.
