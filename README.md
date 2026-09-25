# Marco Polo Experience

Marketplace MVP para reservar cursos cortos de idiomas en el exterior. Empresa hermana de [Marco Polo Education](https://www.marcopoloeducation.com).

UI en español, catálogo estático, precio en vivo y confirmación de reserva (sin cobro real con Stripe).

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS + shadcn/ui + Lucide React
- Tipografía Syne + Manrope
- Paleta alineada a MPE: navy `#26263b`, mint `#03ce81`, indigo `#4d65ff`

## Flujo

1. Landing — pasaporte + idioma + buscar destinos
2. Búsqueda — tarjetas de escuelas + filtro 1–3 meses (4/8/12 semanas)
3. Curso — galería + checkout sticky con total en vivo → confirmar

## Precios

- Matrícula = precio semanal × semanas
- Homestay +USD 180/semana · Residencia +USD 220/semana
- Guard.me +USD 45 fijos

## Correr en local

```bash
npm install
npm run dev -- -p 4317 -H 0.0.0.0
```

Abre [http://127.0.0.1:4317](http://127.0.0.1:4317).
