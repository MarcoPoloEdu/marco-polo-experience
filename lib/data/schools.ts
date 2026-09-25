import type { Destination, LanguageCode, PassportCode, School } from "@/lib/types";

export const PASSPORT_OPTIONS: { value: PassportCode; label: string }[] = [
  { value: "COL", label: "Colombia" },
  { value: "MEX", label: "México" },
  { value: "PER", label: "Perú" },
  { value: "CHL", label: "Chile" },
  { value: "ARG", label: "Argentina" },
  { value: "ESP", label: "España" },
  { value: "USA", label: "Estados Unidos" },
];

export const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: "german", label: "Alemán" },
  { value: "english", label: "Inglés" },
  { value: "spanish", label: "Español" },
  { value: "french", label: "Francés" },
  { value: "italian", label: "Italiano" },
  { value: "maltese", label: "Maltés" },
];

export const destinations: Destination[] = [
  {
    slug: "berlin",
    city: "Berlín",
    country: "Alemania",
    tagline: "Inmersión en alemán en la capital creativa de Europa",
    imageUrl:
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1600&q=80",
    languages: ["german", "english"],
  },
  {
    slug: "valletta",
    city: "La Valeta",
    country: "Malta",
    tagline: "Inglés mediterráneo con vibra internacional",
    imageUrl:
      "https://images.unsplash.com/photo-1606046604972-77cc76aee944?auto=format&fit=crop&w=1600&q=80",
    languages: ["english", "maltese"],
  },
  {
    slug: "london",
    city: "Londres",
    country: "Reino Unido",
    tagline: "Escuelas de primer nivel a pasos del Tube",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
    languages: ["english"],
  },
];

export const schools: School[] = [
  {
    slug: "berlin-lingua-hub",
    name: "Berlin Lingua Hub",
    destinationSlug: "berlin",
    city: "Berlín",
    country: "Alemania",
    language: "german",
    weeklyPrice: 295,
    rating: 4.8,
    reviewCount: 214,
    featured: true,
    description:
      "Cursos intensivos de alemán en grupos pequeños en Mitte, con laboratorios de conversación dos veces por semana. Clases en la mañana para dejar las tardes libres: museos, cafés y tours del barrio con profesores locales.",
    amenities: [
      "Máximo 10 estudiantes por clase",
      "Campus en Mitte",
      "Test de nivel gratuito",
      "Clubes de conversación semanales",
      "Lounge estudiantil y Wi‑Fi",
    ],
    images: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "spree-deutsch-institute",
    name: "Spree Deutsch Institute",
    destinationSlug: "berlin",
    city: "Berlín",
    country: "Alemania",
    language: "german",
    weeklyPrice: 320,
    rating: 4.7,
    reviewCount: 168,
    description:
      "Rutas estructuradas de alemán A1–C1 con preparación para TestDaF y Goethe. Familias anfitrionas a menos de 25 minutos del campus en Kreuzberg.",
    amenities: [
      "Preparación de examen incluida",
      "Campus en Kreuzberg",
      "Red de homestay cercana",
      "Electivas de alemán profesional",
      "Opciones de pickup en aeropuerto",
    ],
    images: [
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "valletta-english-academy",
    name: "Valletta English Academy",
    destinationSlug: "valletta",
    city: "La Valeta",
    country: "Malta",
    language: "english",
    weeklyPrice: 245,
    rating: 4.9,
    reviewCount: 301,
    featured: true,
    description:
      "Aulas con vista al Grand Harbour. Combina intensivos de inglés con paseos en barco por la tarde y práctica en cafés con anfitriones malteses.",
    amenities: [
      "Aulas con vista al puerto",
      "20 lecciones por semana",
      "Acceso a beach club",
      "Residencia estudiantil al lado",
      "Excursiones de fin de semana",
    ],
    images: [
      "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1606046604972-77cc76aee944?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "mediterranean-language-house",
    name: "Mediterranean Language House",
    destinationSlug: "valletta",
    city: "Sliema",
    country: "Malta",
    language: "english",
    weeklyPrice: 265,
    rating: 4.6,
    reviewCount: 142,
    description:
      "Escuela boutique de inglés frente al mar en Sliema, ideal para profesionales que quieren horarios flexibles y coaching 1:1 dos veces por semana.",
    amenities: [
      "Horarios mañana/noche flexibles",
      "Coaching 1:1 dos veces por semana",
      "Campus frente al mar",
      "Módulos de Business English",
      "Residencias con cocina propia",
    ],
    images: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523240795612-9a85b54ece25?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "thames-fluent-school",
    name: "Thames Fluent School",
    destinationSlug: "london",
    city: "Londres",
    country: "Reino Unido",
    language: "english",
    weeklyPrice: 355,
    rating: 4.8,
    reviewCount: 412,
    featured: true,
    description:
      "Programas de inglés en el centro de Londres, cerca de Covent Garden. Combina clases intensivas con talleres en museos y coaching de pronunciación.",
    amenities: [
      "Ubicación en Covent Garden",
      "Talleres de museo los viernes",
      "Lab de pronunciación",
      "Asesoría pathway universitaria",
      "Línea de soporte 24/7",
    ],
    images: [
      "https://images.unsplash.com/photo-1523240795612-9a85b54ece25?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "camden-global-english",
    name: "Camden Global English",
    destinationSlug: "london",
    city: "Londres",
    country: "Reino Unido",
    language: "english",
    weeklyPrice: 310,
    rating: 4.5,
    reviewCount: 189,
    description:
      "Campus amigable en Camden con agenda social fuerte: pub quizzes, caminatas al río y day trips a Oxford y Brighton en estancias largas.",
    amenities: [
      "Campus en Camden Town",
      "Agenda social incluida",
      "Day trips por el Reino Unido",
      "Residencias compartidas cerca",
      "Preparación IELTS disponible",
    ],
    images: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

export function getDestination(slug: string): Destination | undefined {
  return destinations.find((d) => d.slug === slug);
}

export function getSchool(slug: string): School | undefined {
  return schools.find((s) => s.slug === slug);
}

export function getLanguageLabel(code: LanguageCode): string {
  return LANGUAGE_OPTIONS.find((l) => l.value === code)?.label ?? code;
}

export function filterSchools(params: {
  language?: string | null;
  passport?: string | null;
}): School[] {
  const language = params.language?.toLowerCase();
  let results = [...schools];

  if (language) {
    results = results.filter((s) => s.language === language);
  }

  void params.passport;
  return results;
}
