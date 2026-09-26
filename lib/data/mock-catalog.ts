/**
 * Rich static mock catalog for partner demos.
 * Edvisor bridge will replace prices/programs later — do not invent live prices there.
 */

export type NationalityCode =
  | "COL"
  | "MEX"
  | "PER"
  | "CHL"
  | "ARG"
  | "BRA"
  | "ECU"
  | "URY"
  | "CRI"
  | "PAN";

export type LanguageCode = "english" | "german" | "french" | "spanish" | "italian";

export type ProgramKind = "general" | "exam_prep" | "plus30";

export interface Nationality {
  code: NationalityCode;
  label: string;
  flag: string;
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  tagline: string;
}

export interface Destination {
  id: string;
  country: string;
  city: string;
  languageCodes: LanguageCode[];
  imageUrl: string;
  heroUrl: string;
  tagline: string;
  blurb: string;
  vibe: string[];
  /** Mock: typically visa-free for most LatAm short stays */
  visaFriction: "low" | "medium" | "high";
  fromWeeklyUsd: number;
}

export interface Program {
  id: string;
  destinationId: string;
  schoolName: string;
  schoolEmail: string;
  kind: ProgramKind;
  title: string;
  summary: string;
  lessonsPerWeek: number;
  weeklyUsd: number;
  highlights: string[];
  imageUrl: string;
  enabled: boolean;
}

export interface AccommodationOption {
  id: string;
  label: string;
  description: string;
  perWeekUsd: number;
  imageUrl: string;
}

export interface InsuranceOption {
  id: string;
  label: string;
  description: string;
  flatUsd: number;
}

export interface AirportOption {
  id: string;
  label: string;
  description: string;
  flatUsd: number;
}

export const NATIONALITIES: Nationality[] = [
  { code: "COL", label: "Colombia", flag: "🇨🇴" },
  { code: "MEX", label: "México", flag: "🇲🇽" },
  { code: "PER", label: "Perú", flag: "🇵🇪" },
  { code: "CHL", label: "Chile", flag: "🇨🇱" },
  { code: "ARG", label: "Argentina", flag: "🇦🇷" },
  { code: "BRA", label: "Brasil", flag: "🇧🇷" },
  { code: "ECU", label: "Ecuador", flag: "🇪🇨" },
  { code: "URY", label: "Uruguay", flag: "🇺🇾" },
  { code: "CRI", label: "Costa Rica", flag: "🇨🇷" },
  { code: "PAN", label: "Panamá", flag: "🇵🇦" },
];

export const LANGUAGES: LanguageOption[] = [
  {
    code: "english",
    label: "Inglés",
    tagline: "El idioma que abre puertas en el mundo",
  },
  {
    code: "german",
    label: "Alemán",
    tagline: "Carrera, ingeniería y vida en Europa",
  },
  {
    code: "french",
    label: "Francés",
    tagline: "Cultura, gastronomía y diplomacia",
  },
  {
    code: "spanish",
    label: "Español",
    tagline: "Para latinos que quieren perfeccionar el acento peninsular",
  },
  {
    code: "italian",
    label: "Italiano",
    tagline: "Arte, design y dolce vita",
  },
];

export const DESTINATIONS: Destination[] = [
  {
    id: "malta-valletta",
    country: "Malta",
    city: "La Valeta",
    languageCodes: ["english"],
    imageUrl:
      "https://images.unsplash.com/photo-1606046604972-77cc76aee944?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1800&q=80",
    tagline: "Inglés mediterráneo con vibra internacional",
    blurb:
      "Isla compacta, sol casi todo el año y aulas con vista al Grand Harbour. Ideal para 4–12 semanas sin fricción de visa para la mayoría de pasaportes LatAm.",
    vibe: ["Playa", "Campus internacional", "Clima suave"],
    visaFriction: "low",
    fromWeeklyUsd: 245,
  },
  {
    id: "germany-berlin",
    country: "Alemania",
    city: "Berlín",
    languageCodes: ["german", "english"],
    imageUrl:
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=1800&q=80",
    tagline: "Capital creativa para vivir el alemán (o inglés)",
    blurb:
      "Mitte y Kreuzberg concentran escuelas boutique, cafés de estudio y una agenda cultural que convierte cada tarde en práctica real.",
    vibe: ["Cultura", "Startups", "Vida urbana"],
    visaFriction: "low",
    fromWeeklyUsd: 295,
  },
  {
    id: "uk-london",
    country: "Reino Unido",
    city: "Londres",
    languageCodes: ["english"],
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1800&q=80",
    tagline: "Inglés de primer nivel a pasos del Tube",
    blurb:
      "Covent Garden y Camden: escuelas premium, workshops en museos y networking global. Algunos pasaportes LatAm requieren visa — lo marcamos en la sugerencia.",
    vibe: ["Premium", "Networking", "Ciudad global"],
    visaFriction: "high",
    fromWeeklyUsd: 340,
  },
  {
    id: "ireland-dublin",
    country: "Irlanda",
    city: "Dublín",
    languageCodes: ["english"],
    imageUrl:
      "https://images.unsplash.com/photo-1549918864-48ac978794a8?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1800&q=80",
    tagline: "Inglés cálido, pubs y tech scene",
    blurb:
      "Escuelas frente al Liffey, homestays amables y una comunidad latina creciente. Excelente balance precio/experiencia.",
    vibe: ["Amigable", "Tech", "Historia"],
    visaFriction: "medium",
    fromWeeklyUsd: 275,
  },
  {
    id: "france-paris",
    country: "Francia",
    city: "París",
    languageCodes: ["french"],
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=80",
    tagline: "Francés en la ciudad de la luz",
    blurb:
      "Cursos intensivos cerca del Marais, con ateliers de conversación en cafés y salidas culturales incluidas.",
    vibe: ["Arte", "Gastronomía", "Moda"],
    visaFriction: "low",
    fromWeeklyUsd: 310,
  },
  {
    id: "italy-rome",
    country: "Italia",
    city: "Roma",
    languageCodes: ["italian"],
    imageUrl:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1800&q=80",
    tagline: "Italiano entre ruinas y espresso",
    blurb:
      "Escuelas boutique en Trastevere: grupos pequeños, cocina italiana los viernes y paseos lingüísticos por el centro histórico.",
    vibe: ["Historia", "Comida", "Paseos"],
    visaFriction: "low",
    fromWeeklyUsd: 260,
  },
  {
    id: "spain-madrid",
    country: "España",
    city: "Madrid",
    languageCodes: ["spanish"],
    imageUrl:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1800&q=80",
    tagline: "Español peninsular con energía capitalina",
    blurb:
      "Para quienes ya hablan español pero quieren precisión, networking europeo y vida cultural a full.",
    vibe: ["Vida nocturna", "Arte", "Networking"],
    visaFriction: "low",
    fromWeeklyUsd: 230,
  },
  {
    id: "canada-toronto",
    country: "Canadá",
    city: "Toronto",
    languageCodes: ["english"],
    imageUrl:
      "https://images.unsplash.com/photo-1517090504586-fde19ea7474d?auto=format&fit=crop&w=1200&q=80",
    heroUrl:
      "https://images.unsplash.com/photo-1507992781348-3102590762bf?auto=format&fit=crop&w=1800&q=80",
    tagline: "Inglés multicultural en Norteamérica",
    blurb:
      "Campus modernos, pathway universitario y una ciudad que habla el idioma de los negocios globales.",
    vibe: ["Diversidad", "Carrera", "Seguridad"],
    visaFriction: "high",
    fromWeeklyUsd: 355,
  },
];

export const PROGRAMS: Program[] = [
  {
    id: "valletta-general",
    destinationId: "malta-valletta",
    schoolName: "Valletta English Academy",
    schoolEmail: "bookings@valletta-english.example",
    kind: "general",
    title: "Inglés general intensivo",
    summary:
      "20 lecciones/semana en grupos pequeños. Mañanas de clase, tardes libres para explorar la isla.",
    lessonsPerWeek: 20,
    weeklyUsd: 245,
    highlights: ["Máx. 12 por clase", "Test de nivel gratis", "Beach club"],
    imageUrl:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "valletta-exam",
    destinationId: "malta-valletta",
    schoolName: "Valletta English Academy",
    schoolEmail: "bookings@valletta-english.example",
    kind: "exam_prep",
    title: "Prep IELTS / Cambridge",
    summary:
      "Enfoque en skills de examen con simulacros semanales y feedback 1:1.",
    lessonsPerWeek: 24,
    weeklyUsd: 285,
    highlights: ["Simulacros semanales", "Coaching 1:1", "Material incluido"],
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "valletta-plus30",
    destinationId: "malta-valletta",
    schoolName: "Mediterranean Language House",
    schoolEmail: "hello@med-language.example",
    kind: "plus30",
    title: "Inglés +30",
    summary:
      "Grupos solo adultos 30+. Ritmo profesional, networking y horarios flexibles.",
    lessonsPerWeek: 20,
    weeklyUsd: 295,
    highlights: ["Solo +30", "Business modules", "Happy hours"],
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a85b54ece25?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "berlin-general",
    destinationId: "germany-berlin",
    schoolName: "Berlin Lingua Hub",
    schoolEmail: "admissions@berlin-lingua.example",
    kind: "general",
    title: "Alemán general intensivo",
    summary: "A1–B2 en Mitte. Laboratorios de conversación dos veces por semana.",
    lessonsPerWeek: 20,
    weeklyUsd: 295,
    highlights: ["Campus Mitte", "Club de conversación", "Wi‑Fi lounge"],
    imageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "berlin-exam",
    destinationId: "germany-berlin",
    schoolName: "Spree Deutsch Institute",
    schoolEmail: "info@spree-deutsch.example",
    kind: "exam_prep",
    title: "Prep Goethe / TestDaF",
    summary: "Ruta estructurada a examen oficial con profesores examinadores.",
    lessonsPerWeek: 25,
    weeklyUsd: 330,
    highlights: ["Goethe ready", "Homework clinic", "Homestay cerca"],
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "berlin-english",
    destinationId: "germany-berlin",
    schoolName: "Berlin Lingua Hub",
    schoolEmail: "admissions@berlin-lingua.example",
    kind: "general",
    title: "Inglés en Berlín",
    summary: "Inglés internacional en la capital alemana — ambiente startup.",
    lessonsPerWeek: 20,
    weeklyUsd: 280,
    highlights: ["Grupos mixtos", "After-work English", "Kreuzberg"],
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "london-general",
    destinationId: "uk-london",
    schoolName: "Thames Fluent School",
    schoolEmail: "book@thamesfluent.example",
    kind: "general",
    title: "Inglés general Covent Garden",
    summary: "20 lecciones + talleres de museo los viernes.",
    lessonsPerWeek: 20,
    weeklyUsd: 355,
    highlights: ["Covent Garden", "Museum Fridays", "Pronunciation lab"],
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a85b54ece25?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "london-exam",
    destinationId: "uk-london",
    schoolName: "Camden Global English",
    schoolEmail: "hello@camden-global.example",
    kind: "exam_prep",
    title: "Prep IELTS Londres",
    summary: "Bootcamp IELTS con day trips opcionales a Oxford.",
    lessonsPerWeek: 25,
    weeklyUsd: 375,
    highlights: ["IELTS focus", "Agenda social", "Camden campus"],
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "london-plus30",
    destinationId: "uk-london",
    schoolName: "Thames Fluent School",
    schoolEmail: "book@thamesfluent.example",
    kind: "plus30",
    title: "Inglés +30 Londres",
    summary: "Cohortes adultas, business English y networking evening.",
    lessonsPerWeek: 20,
    weeklyUsd: 390,
    highlights: ["Solo +30", "Business English", "Support 24/7"],
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "dublin-general",
    destinationId: "ireland-dublin",
    schoolName: "Liffey Language Centre",
    schoolEmail: "study@liffey.example",
    kind: "general",
    title: "Inglés general Dublín",
    summary: "Campus junto al río, teachers nativos y social calendar fuerte.",
    lessonsPerWeek: 20,
    weeklyUsd: 275,
    highlights: ["River campus", "Social calendar", "Homestay IE"],
    imageUrl:
      "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "dublin-plus30",
    destinationId: "ireland-dublin",
    schoolName: "Liffey Language Centre",
    schoolEmail: "study@liffey.example",
    kind: "plus30",
    title: "Inglés +30 Dublín",
    summary: "Clases de mañana para profesionales; networking tech jueves.",
    lessonsPerWeek: 20,
    weeklyUsd: 305,
    highlights: ["+30 only", "Tech Thursday", "Flexible evenings"],
    imageUrl:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "paris-general",
    destinationId: "france-paris",
    schoolName: "Atelier du Marais",
    schoolEmail: "bonjour@atelier-marais.example",
    kind: "general",
    title: "Francés general",
    summary: "Inmersión en el Marais con ateliers de café conversation.",
    lessonsPerWeek: 20,
    weeklyUsd: 310,
    highlights: ["Marais", "Café ateliers", "Culture walks"],
    imageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "paris-exam",
    destinationId: "france-paris",
    schoolName: "Atelier du Marais",
    schoolEmail: "bonjour@atelier-marais.example",
    kind: "exam_prep",
    title: "Prep DELF / DALF",
    summary: "Preparación oficial con mock exams mensuales.",
    lessonsPerWeek: 24,
    weeklyUsd: 345,
    highlights: ["DELF/DALF", "Mock exams", "Oral coaching"],
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "rome-general",
    destinationId: "italy-rome",
    schoolName: "Trastevere Italiano",
    schoolEmail: "ciao@trastevere.example",
    kind: "general",
    title: "Italiano general",
    summary: "Grupos pequeños + cocina italiana los viernes.",
    lessonsPerWeek: 20,
    weeklyUsd: 260,
    highlights: ["Trastevere", "Cooking Friday", "Walking lessons"],
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a85b54ece25?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "madrid-general",
    destinationId: "spain-madrid",
    schoolName: "Castellana Language Hub",
    schoolEmail: "hola@castellana.example",
    kind: "general",
    title: "Español peninsular",
    summary: "Perfeccionamiento para hispanohablantes LatAm.",
    lessonsPerWeek: 20,
    weeklyUsd: 230,
    highlights: ["Acento peninsular", "Networking EU", "Malasaña"],
    imageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "toronto-general",
    destinationId: "canada-toronto",
    schoolName: "Harbourfront English",
    schoolEmail: "admissions@harbourfront.example",
    kind: "general",
    title: "Inglés general Toronto",
    summary: "Campus moderno con pathway universitario opcional.",
    lessonsPerWeek: 20,
    weeklyUsd: 355,
    highlights: ["Pathway uni", "Downtown", "Career workshops"],
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
  {
    id: "toronto-exam",
    destinationId: "canada-toronto",
    schoolName: "Harbourfront English",
    schoolEmail: "admissions@harbourfront.example",
    kind: "exam_prep",
    title: "Prep IELTS / TOEFL",
    summary: "Track intensivo para admisiones canadienses.",
    lessonsPerWeek: 25,
    weeklyUsd: 385,
    highlights: ["IELTS/TOEFL", "Uni advising", "Lab hours"],
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80",
    enabled: true,
  },
];

export const ACCOMMODATIONS: AccommodationOption[] = [
  {
    id: "none",
    label: "Sin alojamiento",
    description: "Ya tienes donde quedarte o lo gestionas por tu cuenta.",
    perWeekUsd: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "homestay",
    label: "Homestay / Familia",
    description: "Habitación privada, desayuno incluido, inmersión real.",
    perWeekUsd: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "residence",
    label: "Residencia estudiantil",
    description: "Habitación en residencia con cocina compartida y Wi‑Fi.",
    perWeekUsd: 220,
    imageUrl:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "studio",
    label: "Studio privado",
    description: "Apartamento estudio cerca del campus. Más independencia.",
    perWeekUsd: 320,
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  },
];

export const INSURANCE_OPTIONS: InsuranceOption[] = [
  {
    id: "none",
    label: "Sin seguro (por ahora)",
    description: "Puedes añadirlo después con tu asesor MPE.",
    flatUsd: 0,
  },
  {
    id: "guardme",
    label: "Guard.me Global Coverage",
    description: "Médico + viaje para toda la estancia. Recomendado.",
    flatUsd: 89,
  },
  {
    id: "premium",
    label: "Seguro premium + cancelación",
    description: "Incluye cancelación por enfermedad y cobertura ampliada.",
    flatUsd: 149,
  },
];

export const AIRPORT_OPTIONS: AirportOption[] = [
  {
    id: "none",
    label: "Sin recepción",
    description: "Llegas por tu cuenta (te enviamos indicaciones).",
    flatUsd: 0,
  },
  {
    id: "shared",
    label: "Traslado compartido",
    description: "Van compartida aeropuerto → alojamiento.",
    flatUsd: 45,
  },
  {
    id: "private",
    label: "Traslado privado",
    description: "Pickup privado con conductor que habla español/inglés.",
    flatUsd: 95,
  },
];

export const WEEK_OPTIONS = [4, 8, 12] as const;
export type WeekOption = (typeof WEEK_OPTIONS)[number];

export const PROGRAM_KIND_LABELS: Record<ProgramKind, string> = {
  general: "Idioma general",
  exam_prep: "Prep exámenes",
  plus30: "Idioma +30",
};

export function getDestination(id: string) {
  return DESTINATIONS.find((d) => d.id === id);
}

export function getProgram(id: string) {
  return PROGRAMS.find((p) => p.id === id);
}

export function suggestDestinations(language: LanguageCode): Destination[] {
  const matched = DESTINATIONS.filter((d) => d.languageCodes.includes(language));
  // Prefer low visa friction first for LatAm-first feel
  return [...matched].sort((a, b) => {
    const rank = { low: 0, medium: 1, high: 2 };
    return rank[a.visaFriction] - rank[b.visaFriction] || a.fromWeeklyUsd - b.fromWeeklyUsd;
  });
}

export function programsForDestination(
  destinationId: string,
  language: LanguageCode
): Program[] {
  return PROGRAMS.filter(
    (p) =>
      p.enabled &&
      p.destinationId === destinationId &&
      (language === "english"
        ? true
        : getDestination(destinationId)?.languageCodes.includes(language))
  ).filter((p) => {
    const dest = getDestination(destinationId);
    if (!dest) return false;
    // Filter programs that match language intent loosely via destination + title
    if (language === "german") return /alemán|german|deutsch/i.test(p.title + p.summary);
    if (language === "french") return /francés|french|delf/i.test(p.title + p.summary);
    if (language === "italian") return /italiano|italian/i.test(p.title + p.summary);
    if (language === "spanish") return /español|spanish|castellana/i.test(p.title + p.summary);
    // english: exclude clearly non-english titled german-only if destination has both
    if (destinationId === "germany-berlin") {
      return /inglés|english/i.test(p.title) || p.kind !== "general" || p.id.includes("english")
        ? /inglés|english/i.test(p.title) || p.id.includes("english")
        : !/alemán|goethe|testdaf/i.test(p.title);
    }
    return true;
  });
}

/** Simpler filter used by UI */
export function enabledPrograms(destinationId: string, language: LanguageCode): Program[] {
  const dest = getDestination(destinationId);
  if (!dest || !dest.languageCodes.includes(language)) return [];

  const all = PROGRAMS.filter((p) => p.enabled && p.destinationId === destinationId);

  if (language === "english") {
    return all.filter(
      (p) =>
        !/alemán|goethe|testdaf|francés|delf|italiano|español peninsular/i.test(p.title)
    );
  }
  if (language === "german") {
    return all.filter((p) => /alemán|goethe|testdaf/i.test(p.title));
  }
  if (language === "french") {
    return all.filter((p) => /francés|delf/i.test(p.title));
  }
  if (language === "italian") {
    return all.filter((p) => /italiano/i.test(p.title));
  }
  if (language === "spanish") {
    return all.filter((p) => /español/i.test(p.title));
  }
  return all;
}
