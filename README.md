# FastEdu

Marketplace MVP for booking short, visa-free language courses (Berlin, Valletta, London). Built for US passport holders with instant pricing—no database, auth, or live payments.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS + shadcn/ui + Lucide React
- Static school catalog in `lib/data/schools.ts`

## Features

- **Landing** — Passport + language search, trust badges, featured destinations
- **Search** — School cards with duration filter (1–3 months → 4/8/12 weeks)
- **Course detail** — Gallery, amenities, sticky checkout builder with live total
- **Book Now** — Confirmation UI only (Stripe copy, no real charge)

## Pricing rules

- Base tuition = weekly price × weeks (4 / 8 / 12)
- Homestay +$180/week · Student Residence +$220/week
- Guard.me Global Coverage +$45 flat when enabled

## Run locally

```bash
npm install
npm run dev -- -p 4317 -H 0.0.0.0
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

```bash
npm run build
npm start -- -p 4317
```

## Project layout

```
app/                  # Landing, search, course detail routes
components/landing/   # HeroSearch, TrustBadges, FeaturedDestinations
components/search/    # SchoolCard, DurationFilter
components/course/    # CourseGallery, CheckoutBuilder
components/ui/        # shadcn primitives
lib/data/schools.ts   # Destinations + schools
lib/pricing.ts        # Live total helpers
lib/types.ts
```
