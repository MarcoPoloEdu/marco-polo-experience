/**
 * Pull ALL language schools connected to the Marco Polo Edvisor agency
 * and map them into the Experience catalog shape.
 *
 * Primary API (from Edvisor GraphQL schema / docs.edvisor.io):
 *   schoolCompanyConnectedList → campuses (School[])
 *   offeringsList(filter: { schoolIds, isEnabled }) → COURSE offerings + prices
 *
 * Auth: Authorization: Bearer EDVISOR_API_KEY (server-only).
 */

import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { edvisorGraphql, isEdvisorApiConfigured } from "@/lib/edvisor/api";
import type {
  EdvisorCatalog,
  EdvisorDestination,
  EdvisorLanguageCode,
  EdvisorProgram,
  EdvisorProgramKind,
  EdvisorSchool,
} from "@marco-polo/experience-edvisor";

const LIVE_CATALOG_PATH = path.join(process.cwd(), "data", "edvisor-live-catalog.json");

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
    prices?: Array<{
      durationAmount?: number | null;
      durationTypeId?: number | null;
      originalPriceUsd?: number | null;
      bestPromotionalPriceUsd?: number | null;
      amountIsPerDuration?: boolean | null;
    }> | null;
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
query SchoolCourseOfferings($schoolIds: [Int!]!, $limit: Int!, $offset: Int!) {
  offeringsList(
    pagination: { limit: $limit, offset: $offset }
    filter: {
      schoolIds: $schoolIds
      isEnabled: true
      hasOfferingPriceTemplate: true
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
    }
  }
}
`;

function liveCatalogPath() {
  return LIVE_CATALOG_PATH;
}

export async function readLiveEdvisorCatalog(): Promise<EdvisorCatalog | null> {
  try {
    const raw = await fs.readFile(liveCatalogPath(), "utf8");
    return JSON.parse(raw) as EdvisorCatalog;
  } catch {
    return null;
  }
}

export async function writeLiveEdvisorCatalog(catalog: EdvisorCatalog): Promise<void> {
  await fs.mkdir(path.dirname(liveCatalogPath()), { recursive: true });
  await fs.writeFile(liveCatalogPath(), JSON.stringify(catalog, null, 2), "utf8");
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
  if (/higher.?ed|university|pathway|vocational|high.?school|k-12/.test(blob) &&
      !/language|english|french|german|spanish|italian|exam|ielts|toefl|goethe|delf/.test(blob)) {
    return false;
  }
  return true;
}

function inferLanguageCodes(school: ConnectedSchool, titles: string[]): EdvisorLanguageCode[] {
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
  if (/english|ingl[eé]s|ielts|toefl|cambridge|general english/.test(blob) || codes.length === 0) {
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

/** durationTypeId: common Edvisor convention — 3 often = week; we also check amountIsPerDuration */
function weeklyUsdFromPrices(
  prices: NonNullable<NonNullable<OfferingRow["offeringCourse"]>["prices"]>
): number | null {
  if (!prices?.length) return null;
  // Prefer weekly (durationAmount 1, type week-ish) else min USD / durationAmount
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

async function fetchCourseOfferingsForSchools(
  schoolIds: number[]
): Promise<OfferingRow[]> {
  const pageSize = 50;
  const all: OfferingRow[] = [];

  // Batch school IDs to keep queries bounded
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
      all.push(
        ...page.filter(
          (o) =>
            o.offeringType?.codeName === "COURSE" ||
            Boolean(o.offeringCourse) ||
            !o.offeringType?.codeName
        )
      );
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
  catalogPath: string;
  error?: string;
};

/**
 * Sync live Edvisor language schools → data/edvisor-live-catalog.json
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
          // Prefer campus name; fall back to company
          name: s.name || c.name,
        }))
      )
      .filter((s) => !s.isDeleted && !s.hidden)
      .filter(categoryLooksLikeLanguage);

    const schoolIds = campuses.map((s) => s.schoolId);
    const offerings = schoolIds.length
      ? await fetchCourseOfferingsForSchools(schoolIds)
      : [];

    const offeringsBySchool = new Map<number, OfferingRow[]>();
    for (const o of offerings) {
      if (o.isDeleted || o.isEnabled === false) continue;
      const list = offeringsBySchool.get(o.schoolId) ?? [];
      list.push(o);
      offeringsBySchool.set(o.schoolId, list);
    }

    // Language schools = campuses with at least one COURSE offering (or keep campus if offerings API empty but categories look language)
    const languageCampuses = campuses.filter((s) => {
      const offs = offeringsBySchool.get(s.schoolId) ?? [];
      if (offs.length) return true;
      // If we got zero offerings globally, still include connected campuses (API may restrict price fields)
      return offerings.length === 0;
    });

    const destinationsMap = new Map<string, EdvisorDestination>();
    const schools: EdvisorSchool[] = [];
    const programs: EdvisorProgram[] = [];

    for (const campus of languageCampuses) {
      const countryName =
        campus.country?.nameTranslation ||
        campus.country?.code ||
        "International";
      const countryCode = (campus.country?.code || "XX").toUpperCase();
      const cityGuess =
        campus.address?.split(",").slice(-2, -1)[0]?.trim() ||
        campus.address?.split(",")[0]?.trim() ||
        countryName;

      const destId = `edv-${countryCode.toLowerCase()}-${slugify(cityGuess)}`;
      const titles = (offeringsBySchool.get(campus.schoolId) ?? []).map(
        (o) => o.offeringCourse?.name || o.name || ""
      );
      const languageCodes = inferLanguageCodes(campus, titles);

      if (!destinationsMap.has(destId)) {
        destinationsMap.set(destId, {
          id: destId,
          country: countryName,
          city: cityGuess,
          countryCode,
          languageCodes,
          imageUrl:
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
          heroUrl:
            "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1800&q=80",
          tagline: `Idiomas en ${cityGuess}`,
          blurb: `Escuelas conectadas vía Edvisor en ${cityGuess}, ${countryName}.`,
          vibe: ["Edvisor", "Idiomas"],
          visaFriction: "medium",
          fromWeeklyUsd: 0,
        });
      } else {
        const dest = destinationsMap.get(destId)!;
        dest.languageCodes = [...new Set([...dest.languageCodes, ...languageCodes])];
      }

      const schoolId = `edv-school-${campus.schoolId}`;
      const campusOfferings = offeringsBySchool.get(campus.schoolId) ?? [];
      const hasPricedCourse = campusOfferings.some(
        (o) => weeklyUsdFromPrices(o.offeringCourse?.prices ?? []) != null
      );

      schools.push({
        id: schoolId,
        name: campus.name,
        email: campus.email || "schools@marcopoloeducation.com",
        destinationId: destId,
        complete: campusOfferings.length > 0 ? hasPricedCourse || campusOfferings.length > 0 : false,
        edvisorProviderId: String(campus.schoolId),
      });

      for (const off of campusOfferings) {
        const title =
          off.offeringCourse?.name || off.name || `Course #${off.offeringId}`;
        const weekly = weeklyUsdFromPrices(off.offeringCourse?.prices ?? []) ?? 0;
        const complete = weekly > 0;
        programs.push({
          id: `edv-offering-${off.offeringId}`,
          destinationId: destId,
          schoolId,
          kind: inferProgramKind(title),
          title,
          summary: `${campus.name} · Edvisor offering ${off.offeringId}`,
          lessonsPerWeek: 20,
          weeklyPriceUsd: weekly,
          highlights: complete ? ["Precio Edvisor", "Curso conectado"] : ["Sin precio semanal aún"],
          imageUrl:
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
          complete,
          currency: "USD",
          minWeeks: 4,
          maxWeeks: 24,
        });
      }
    }

    // Recompute fromWeeklyUsd
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
        note: `Synced from Edvisor schoolCompanyConnectedList + offeringsList (COURSE). ${languageCampuses.length} language campuses.`,
      },
      destinations: [...destinationsMap.values()],
      schools,
      programs,
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
      catalogPath: liveCatalogPath(),
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}
