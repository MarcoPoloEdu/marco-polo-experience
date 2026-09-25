import type { Destination, LanguageCode, PassportCode, School } from "@/lib/types";

export const PASSPORT_OPTIONS: { value: PassportCode; label: string }[] = [
  { value: "USA", label: "United States" },
  { value: "CAN", label: "Canada" },
  { value: "GBR", label: "United Kingdom" },
  { value: "AUS", label: "Australia" },
];

export const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: "german", label: "German" },
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "italian", label: "Italian" },
  { value: "maltese", label: "Maltese" },
];

export const destinations: Destination[] = [
  {
    slug: "berlin",
    city: "Berlin",
    country: "Germany",
    tagline: "Vibrant German immersion in Europe’s creative capital",
    imageUrl:
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80",
    languages: ["german", "english"],
  },
  {
    slug: "valletta",
    city: "Valletta",
    country: "Malta",
    tagline: "Mediterranean English courses with zero visa hassle",
    imageUrl:
      "https://images.unsplash.com/photo-1606046604972-77cc76aee944?auto=format&fit=crop&w=1200&q=80",
    languages: ["english", "maltese"],
  },
  {
    slug: "london",
    city: "London",
    country: "United Kingdom",
    tagline: "World-class English schools steps from the Tube",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    languages: ["english"],
  },
];

export const schools: School[] = [
  {
    slug: "berlin-lingua-hub",
    name: "Berlin Lingua Hub",
    destinationSlug: "berlin",
    city: "Berlin",
    country: "Germany",
    language: "german",
    weeklyPrice: 295,
    rating: 4.8,
    reviewCount: 214,
    featured: true,
    description:
      "Small-group German intensive courses in Mitte with conversation labs twice a week. Morning classes leave afternoons free for museums, cafés, and neighborhood walking tours led by local teachers.",
    amenities: [
      "Max 10 students per class",
      "Central Mitte campus",
      "Free placement test",
      "Weekly conversation clubs",
      "Student lounge & Wi‑Fi",
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
    city: "Berlin",
    country: "Germany",
    language: "german",
    weeklyPrice: 320,
    rating: 4.7,
    reviewCount: 168,
    description:
      "Structured A1–C1 German tracks with exam prep for TestDaF and Goethe. Homestay families are within a 25-minute commute of the Kreuzberg campus.",
    amenities: [
      "Exam prep included",
      "Kreuzberg campus",
      "Homestay network nearby",
      "Career German electives",
      "Airport pickup options",
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
    city: "Valletta",
    country: "Malta",
    language: "english",
    weeklyPrice: 245,
    rating: 4.9,
    reviewCount: 301,
    featured: true,
    description:
      "Sunlit classrooms overlooking the Grand Harbour. Combine English intensives with afternoon boat trips and after-class café practice with Maltese hosts.",
    amenities: [
      "Harbour-view classrooms",
      "20 lessons per week",
      "Beach club access",
      "Student residence next door",
      "Weekend island excursions",
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
      "A boutique English school on the Sliema waterfront, ideal for professionals who want flexible schedules and one-to-one coaching twice a week.",
    amenities: [
      "Flexible morning/evening slots",
      "1:1 coaching twice weekly",
      "Waterfront campus",
      "Business English modules",
      "Self-catering residences",
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
    city: "London",
    country: "United Kingdom",
    language: "english",
    weeklyPrice: 355,
    rating: 4.8,
    reviewCount: 412,
    featured: true,
    description:
      "Central London English programs near Covent Garden. Combine intensive classes with museum workshops and pronunciation coaching from native-speaking tutors.",
    amenities: [
      "Covent Garden location",
      "Museum workshop Fridays",
      "Pronunciation lab",
      "University pathway advice",
      "24/7 student support line",
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
    city: "London",
    country: "United Kingdom",
    language: "english",
    weeklyPrice: 310,
    rating: 4.5,
    reviewCount: 189,
    description:
      "Friendly Camden campus with strong social calendars—pub quizzes, river walks, and weekend day trips to Oxford and Brighton included in longer stays.",
    amenities: [
      "Camden Town campus",
      "Social calendar included",
      "Weekend UK day trips",
      "Shared residences nearby",
      "IELTS prep available",
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

  // Passport is accepted for URL continuity; MVP catalog is visa-free for US travelers.
  void params.passport;

  return results;
}
