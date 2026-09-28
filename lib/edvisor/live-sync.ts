/**
 * Pull ALL language schools connected to the Marco Polo Edvisor agency
 * and map them into the Experience catalog shape.
 *
 * Primary API (api-v2 GraphQL, Bearer EDVISOR_API_KEY — server-only):
 *   schoolCompanyConnectedList → campuses (School[]) + googlePlace city
 *   offeringsList(filter: { schoolIds, isEnabled }) → COURSE + service offerings
 *
 * No blind host fallback. Prices here are inventory hints only —
 * exact-quote remains the charge source of truth.
 */

import "server-only";

import { edvisorGraphql, isEdvisorApiConfigured } from "@/lib/edvisor/api";
import {
  activateCatalogVersion,
  readActiveCatalog,
} from "@/lib/edvisor/catalog-store";
import type {
  EdvisorCatalog,
  EdvisorDestination,
  EdvisorLanguageCode,
  EdvisorProgram,
  EdvisorProgramKind,
  EdvisorSchool,
  EdvisorService,
  EdvisorServiceKind,
} from "@marco-polo/experience-edvisor";

// Diagnostics label — real persistence is Firestore catalogVersions
const LIVE_CATALOG_PATH = "firestore:catalogVersions/active";

type ConnectedSchool = {
  schoolId: number;
  schoolCompanyId: number;
  name: string;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  isDeleted?: number | null;
  hidden?: boolean | null;
  country?: {
    countryId?: number;
    code?: string | null;
    nameTranslation?: string | null;
  } | null;
  googlePlace?: {
    translation?: string | null;
    countryId?: number | null;
  } | null;
  offeredMainRootCourseCategories?: Array<{
    codeName?: string | null;
    offeringCourseCategoryContent?: { codeName?: string | null } | null;
  }> | null;
};

type ConnectedCompany = {
  schoolCompanyId: number;
  name: string;
  isVerified?: boolean | null;
  isAccountInactive?: boolean | null;
  campusCount?: number | null;
  schools?: ConnectedSchool[] | null;
};

type OfferingPrice = {
  durationAmount?: number | null;
  durationTypeId?: number | null;
  originalPriceUsd?: number | null;
  bestPromotionalPriceUsd?: number | null;
  amountIsPerDuration?: boolean | null;
};

type OfferingRow = {
  offeringId: number;
  schoolId: number;
  isEnabled?: boolean | null;
  isDeleted?: boolean | null;
  isVisible?: boolean | null;
  name?: string | null;
  offeringType?: { codeName?: string | null } | null;
  school?: { name?: string | null; email?: string | null } | null;
  offeringCourse?: {
    name?: string | null;
    prices?: OfferingPrice[] | null;
  } | null;
  offeringService?: {
    name?: string | null;
    location?: string | null;
    provider?: string | null;
    prices?: OfferingPrice[] | null;
  } | null;
  offeringAccommodation?: {
    name?: string | null;
    prices?: OfferingPrice[] | null;
  } | null;
  offeringInsurance?: {
    name?: string | null;
  } | null;
};

const CONNECTED_QUERY = `
query ConnectedLanguageSchools($limit: Int!, $offset: Int!) {
  schoolCompanyConnectedList(
    pagination: { limit: $limit, offset: $offset }
    filter: {}
  ) {
    metadata { total }
    data {
      schoolCompanyId
      name
      isVerified
      isAccountInactive
      campusCount
      schools {
        schoolId
        schoolCompanyId
        name
        email
        website
        address
        isDeleted
        hidden
        country {
          countryId
          code
          nameTranslation(languageCode: en)
        }
        googlePlace {
          translation(languageCode: en)
          countryId
        }
        offeredMainRootCourseCategories {
          codeName
          offeringCourseCategoryContent { codeName }
        }
      }
    }
  }
}
`;

const OFFERINGS_QUERY = `
query SchoolOfferingsInventory($schoolIds: [Int!]!, $limit: Int!, $offset: Int!) {
  offeringsList(
    pagination: { limit: $limit, offset: $offset }
    filter: {
      schoolIds: $schoolIds
      isEnabled: true
    }
  ) {
    count
    data {
      offeringId
      schoolId
      isEnabled
      isDeleted
      isVisible
      name(languageCode: en)
      offeringType { codeName }
      school { name email }
      offeringCourse {
        name(languageCode: en)
        prices(limit: 8) {
          durationAmount
          durationTypeId
          originalPriceUsd
          bestPromotionalPriceUsd
          amountIsPerDuration
        }
      }
      offeringService {
        name(languageCode: en)
        location
        provider
        prices(limit: 4) {
          durationAmount
          durationTypeId
          originalPriceUsd
          bestPromotionalPriceUsd
          amountIsPerDuration
        }
      }
      offeringAccommodation {
        name(languageCode: en)
        prices(limit: 4) {
          durationAmount
          durationTypeId
          originalPriceUsd
          bestPromotionalPriceUsd
          amountIsPerDuration
        }
      }
      offeringInsurance {
        name(languageCode: en)
      }
    }
  }
}
`;

function liveCatalogPath() {
  return LIVE_CATALOG_PATH;
}

export async function readLiveEdvisorCatalog(): Promise<EdvisorCatalog | null> {
  return readActiveCatalog();
}

export async function writeLiveEdvisorCatalog(catalog: EdvisorCatalog): Promise<void> {
  await activateCatalogVersion(catalog);
}

function categoryLooksLikeLanguage(school: ConnectedSchool): boolean {
  const cats = school.offeredMainRootCourseCategories ?? [];
  if (!cats.length) {
    // Unknown categories — keep school; later offeringsList will decide completeness
    return true;
  }
  const blob = cats
    .map(
      (c) =>
        `${c.codeName ?? ""} ${c.offeringCourseCategoryContent?.codeName ?? ""}`
    )
    .join(" ")
    .toLowerCase();
  // Exclude obvious non-language roots when present
  if (
    /higher.?ed|university|pathway|vocational|high.?school|k-12/.test(blob) &&
    !/language|english|french|german|spanish|italian|exam|ielts|toefl|goethe|delf/.test(
      blob
    )
  ) {
    return false;
  }
  return true;
}

function inferLanguageCodes(
  school: ConnectedSchool,
  titles: string[]
): EdvisorLanguageCode[] {
  const blob = [
    school.name,
    ...(school.offeredMainRootCourseCategories ?? []).map(
      (c) => `${c.codeName ?? ""} ${c.offeringCourseCategoryContent?.codeName ?? ""}`
    ),
    ...titles,
  ]
    .join(" ")
    .toLowerCase();

  const codes: EdvisorLanguageCode[] = [];
  if (/german|deutsch|alem[aá]n|goethe|testdaf/.test(blob)) codes.push("german");
  if (/french|fran[cç]ais|franc[eé]s|delf|dalf/.test(blob)) codes.push("french");
  if (/italian|italiano/.test(blob)) codes.push("italian");
  if (/spanish|espa[nñ]ol|castellano|dele/.test(blob)) codes.push("spanish");
  if (
    /english|ingl[eé]s|ielts|toefl|cambridge|general english/.test(blob) ||
    codes.length === 0
  ) {
    codes.push("english");
  }
  return [...new Set(codes)];
}

function inferProgramKind(title: string): EdvisorProgramKind {
  if (/\+ ?30|30\+|senior|mature/.test(title)) return "plus30";
  if (/ielts|toefl|cambridge|goethe|testdaf|delf|dalf|exam|prep/.test(title)) {
    return "exam_prep";
  }
  return "general";
}

function mapServiceKind(codeName: string | null | undefined): EdvisorServiceKind {
  const code = (codeName ?? "").toUpperCase();
  if (code.includes("ACCOMMOD") || code === "HOUSING") return "accommodation";
  if (code.includes("INSUR")) return "insurance";
  if (code.includes("TRANSFER") || code.includes("AIRPORT") || code.includes("PICKUP")) {
    return "transfer";
  }
  if (code.includes("FEE") || code.includes("MATERIAL") || code.includes("REGIST")) {
    return "fee";
  }
  if (code.includes("SERVICE") || code.includes("ADDON") || code.includes("ADD-ON")) {
    return "addon";
  }
  return "other";
}

function isCourseOffering(o: OfferingRow): boolean {
  const code = (o.offeringType?.codeName ?? "").toUpperCase();
  if (code === "COURSE" || code.includes("COURSE")) return true;
  if (o.offeringCourse && !o.offeringService && !o.offeringAccommodation && !o.offeringInsurance) {
    return true;
  }
  return false;
}

/** durationTypeId: common Edvisor convention — prefer per-duration weekly hints */
function weeklyUsdFromPrices(prices: OfferingPrice[] | null | undefined): number | null {
  if (!prices?.length) return null;
  const candidates: number[] = [];
  for (const p of prices) {
    const usd = p.bestPromotionalPriceUsd ?? p.originalPriceUsd;
    if (usd == null || usd <= 0) continue;
    const amount = p.durationAmount && p.durationAmount > 0 ? p.durationAmount : 1;
    if (p.amountIsPerDuration && amount === 1) {
      candidates.push(usd);
    } else {
      candidates.push(usd / amount);
    }
  }
  if (!candidates.length) return null;
  return Math.round(Math.min(...candidates));
}

function hintUsdFromPrices(prices: OfferingPrice[] | null | undefined): number | undefined {
  const weekly = weeklyUsdFromPrices(prices);
  if (weekly != null) return weekly;
  if (!prices?.length) return undefined;
  for (const p of prices) {
    const usd = p.bestPromotionalPriceUsd ?? p.originalPriceUsd;
    if (usd != null && usd > 0) return Math.round(usd);
  }
  return undefined;
}

/**
 * Prefer googlePlace.translation city segment, else address parse, else country.
 * Never invents a tourist city name.
 */
function resolveCity(campus: ConnectedSchool, countryName: string): string {
  const place = campus.googlePlace?.translation?.trim();
  if (place) {
    // Typical: "Auckland, New Zealand" or "Berlin"
    const first = place.split(",")[0]?.trim();
    if (first) return first;
  }
  const address = campus.address?.trim();
  if (address) {
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Prefer penultimate segment (city before country)
      return parts[parts.length - 2]!;
    }
    if (parts.length === 1) return parts[0]!;
  }
  return countryName;
}

async function fetchAllConnectedCompanies(): Promise<ConnectedCompany[]> {
  const pageSize = 50;
  let offset = 0;
  let total = Infinity;
  const all: ConnectedCompany[] = [];

  while (offset < total) {
    const data = await edvisorGraphql<{
      schoolCompanyConnectedList: {
        metadata?: { total?: number };
        data?: ConnectedCompany[];
      };
    }>(CONNECTED_QUERY, { limit: pageSize, offset });

    const page = data.schoolCompanyConnectedList?.data ?? [];
    total = data.schoolCompanyConnectedList?.metadata?.total ?? page.length;
    all.push(...page);
    offset += pageSize;
    if (!page.length) break;
  }

  return all;
}

async function fetchOfferingsForSchools(schoolIds: number[]): Promise<OfferingRow[]> {
  const pageSize = 50;
  const all: OfferingRow[] = [];

  for (let i = 0; i < schoolIds.length; i += 25) {
    const batch = schoolIds.slice(i, i + 25);
    let offset = 0;
    let count = Infinity;
    while (offset < count) {
      const data = await edvisorGraphql<{
        offeringsList: { count?: number; data?: OfferingRow[] };
      }>(OFFERINGS_QUERY, { schoolIds: batch, limit: pageSize, offset });

      const page = data.offeringsList?.data ?? [];
      count = data.offeringsList?.count ?? page.length;
      all.push(...page);
      offset += pageSize;
      if (!page.length) break;
    }
  }

  return all;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export type EdvisorSyncResult = {
  ok: boolean;
  configured: boolean;
  schoolCompanies: number;
  schools: number;
  languageSchools: number;
  programs: number;
  destinations: number;
  services: number;
  catalogPath: string;
  error?: string;
};

/**
 * Sync live Edvisor language schools → Firestore catalogVersions (active).
 */
export async function syncEdvisorLanguageSchools(): Promise<EdvisorSyncResult> {
  if (!isEdvisorApiConfigured()) {
    return {
      ok: false,
      configured: false,
      schoolCompanies: 0,
      schools: 0,
      languageSchools: 0,
      programs: 0,
      destinations: 0,
      services: 0,
      catalogPath: liveCatalogPath(),
      error:
        "EDVISOR_API_KEY no configurada. Pide la API key de la agencia en Edvisor (Bearer) y añádela al entorno.",
    };
  }

  try {
    const companies = await fetchAllConnectedCompanies();
    const campuses = companies
      .filter((c) => !c.isAccountInactive)
      .flatMap((c) =>
        (c.schools ?? []).map((s) => ({
          ...s,
          schoolCompanyId: s.schoolCompanyId || c.schoolCompanyId,
          name: s.name || c.name,
        }))
      )
      .filter((s) => !s.isDeleted && !s.hidden)
      .filter(categoryLooksLikeLanguage);

    const schoolIds = campuses.map((s) => s.schoolId);
    const offerings = schoolIds.length ? await fetchOfferingsForSchools(schoolIds) : [];

    const courseBySchool = new Map<number, OfferingRow[]>();
    const serviceBySchool = new Map<number, OfferingRow[]>();
    for (const o of offerings) {
      if (o.isDeleted || o.isEnabled === false) continue;
      if (isCourseOffering(o)) {
        const list = courseBySchool.get(o.schoolId) ?? [];
        list.push(o);
        courseBySchool.set(o.schoolId, list);
      } else {
        const list = serviceBySchool.get(o.schoolId) ?? [];
        list.push(o);
        serviceBySchool.set(o.schoolId, list);
      }
    }

    const languageCampuses = campuses.filter((s) => {
      const courses = courseBySchool.get(s.schoolId) ?? [];
      if (courses.length) return true;
      // If offerings API returned nothing globally, still include connected campuses
      return offerings.length === 0;
    });

    const destinationsMap = new Map<string, EdvisorDestination>();
    const schools: EdvisorSchool[] = [];
    const programs: EdvisorProgram[] = [];
    const services: EdvisorService[] = [];

    for (const campus of languageCampuses) {
      const countryName =
        campus.country?.nameTranslation || campus.country?.code || "International";
      const countryCode = (campus.country?.code || "XX").toUpperCase();
      const city = resolveCity(campus, countryName);

      const destId = `edv-${countryCode.toLowerCase()}-${slugify(city)}`;
      const courseTitles = (courseBySchool.get(campus.schoolId) ?? []).map(
        (o) => o.offeringCourse?.name || o.name || ""
      );
      const languageCodes = inferLanguageCodes(campus, courseTitles);

      if (!destinationsMap.has(destId)) {
        destinationsMap.set(destId, {
          id: destId,
          country: countryName,
          city,
          countryCode,
          languageCodes,
          imageUrl:
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
          heroUrl:
            "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1800&q=80",
          tagline: `Idiomas en ${city}`,
          blurb: `Escuelas conectadas vía Edvisor en ${city}, ${countryName}.`,
          vibe: ["Edvisor", "Idiomas"],
          visaFriction: "medium",
          fromWeeklyUsd: 0,
        });
      } else {
        const dest = destinationsMap.get(destId)!;
        dest.languageCodes = [...new Set([...dest.languageCodes, ...languageCodes])];
      }

      const schoolId = `edv-school-${campus.schoolId}`;
      const campusCourses = courseBySchool.get(campus.schoolId) ?? [];
      const hasPricedCourse = campusCourses.some(
        (o) => weeklyUsdFromPrices(o.offeringCourse?.prices ?? []) != null
      );

      schools.push({
        id: schoolId,
        name: campus.name,
        email: campus.email || "schools@marcopoloeducation.com",
        destinationId: destId,
        complete: campusCourses.length > 0 ? hasPricedCourse || campusCourses.length > 0 : false,
        edvisorProviderId: String(campus.schoolId),
      });

      for (const off of campusCourses) {
        const title =
          off.offeringCourse?.name || off.name || `Course #${off.offeringId}`;
        const weekly = weeklyUsdFromPrices(off.offeringCourse?.prices ?? []);
        const complete = weekly != null && weekly > 0;
        programs.push({
          id: `edv-offering-${off.offeringId}`,
          destinationId: destId,
          schoolId,
          kind: inferProgramKind(title),
          title,
          summary: `${campus.name} · Edvisor offering ${off.offeringId}`,
          lessonsPerWeek: 0,
          weeklyPriceUsd: weekly ?? 0,
          highlights: complete
            ? ["Precio Edvisor (informativo de catálogo)", "Curso conectado"]
            : ["Sin precio semanal verificable"],
          imageUrl:
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
          complete,
          currency: "USD",
          minWeeks: 0,
          maxWeeks: 0,
        });
      }

      for (const off of serviceBySchool.get(campus.schoolId) ?? []) {
        const typeCode = off.offeringType?.codeName ?? undefined;
        const kind = mapServiceKind(typeCode);
        const title =
          off.offeringAccommodation?.name ||
          off.offeringService?.name ||
          off.offeringInsurance?.name ||
          off.name ||
          `Service #${off.offeringId}`;
        const priceHintUsd =
          hintUsdFromPrices(off.offeringAccommodation?.prices) ??
          hintUsdFromPrices(off.offeringService?.prices);
        // Inventory only — never auto-complete for checkout (exact-quote remains SoT)
        services.push({
          id: `edv-service-${off.offeringId}`,
          schoolId,
          destinationId: destId,
          kind,
          title,
          summary: [
            campus.name,
            typeCode,
            off.offeringService?.location,
            off.offeringService?.provider,
          ]
            .filter(Boolean)
            .join(" · "),
          offeringTypeCode: typeCode,
          edvisorOfferingId: String(off.offeringId),
          complete: false,
          priceHintUsd,
        });
      }
    }

    for (const dest of destinationsMap.values()) {
      const weeks = programs
        .filter((p) => p.destinationId === dest.id && p.complete && p.weeklyPriceUsd > 0)
        .map((p) => p.weeklyPriceUsd);
      dest.fromWeeklyUsd = weeks.length ? Math.min(...weeks) : 0;
    }

    const catalog: EdvisorCatalog = {
      meta: {
        source: "edvisor-live-api",
        version: new Date().toISOString().slice(0, 10),
        exportedAt: new Date().toISOString(),
        note: `Synced from Edvisor schoolCompanyConnectedList + offeringsList. ${languageCampuses.length} language campuses · ${services.length} services (inventory, not checkout).`,
      },
      destinations: [...destinationsMap.values()],
      schools,
      programs,
      services,
    };

    await writeLiveEdvisorCatalog(catalog);

    return {
      ok: true,
      configured: true,
      schoolCompanies: companies.length,
      schools: campuses.length,
      languageSchools: languageCampuses.length,
      programs: programs.length,
      destinations: destinationsMap.size,
      services: services.length,
      catalogPath: liveCatalogPath(),
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      schoolCompanies: 0,
      schools: 0,
      languageSchools: 0,
      programs: 0,
      destinations: 0,
      services: 0,
      catalogPath: liveCatalogPath(),
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}
