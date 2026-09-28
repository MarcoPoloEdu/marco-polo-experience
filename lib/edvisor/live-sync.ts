/**
 * Phase A — scoped Edvisor inventory for Experience (short language courses).
 *
 * Pull ONLY the initial campuses (ILSC YVR/YYZ/YUL + Gateway St. Julians),
 * COURSE / WEEK short offerings, then activate Firestore catalog.
 * Exact-quote remains charge SoT — prices here are inventory hints only.
 *
 * Full connected dump = optional Phase B (not this path).
 */

import "server-only";

import {
  edvisorGraphql,
  isEdvisorApiConfigured,
} from "@/lib/edvisor/api";
import { edvisorGatewayGraphql } from "@/lib/edvisor/clients";
import {
  activateCatalogVersion,
  readActiveCatalog,
} from "@/lib/edvisor/catalog-store";
import {
  INITIAL_CAMPUS_TARGETS,
  KNOWN_INITIAL_SCHOOL_IDS,
  isForceDisabledSchool,
  matchInitialCampusBlob,
  type InitialCampusTarget,
} from "@/lib/edvisor/initial-curation";
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

const LIVE_CATALOG_PATH = "firestore:catalogVersions/active";

/** api-v2 durationTypeId: 3 = WEEK (short), 9 = TERM (long/HS). */
export const EDVISOR_DURATION_WEEK = 3;
export const EDVISOR_DURATION_TERM = 9;

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
    offeringCourseCategory?: { codeName?: string | null } | null;
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

const SCHOOL_BY_ID_QUERY = `
query SchoolById($schoolId: Int!) {
  school(schoolId: $schoolId) {
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
        offeringCourseCategory { codeName }
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

const GATEWAY_LANGUAGE_COURSES = `
query SearchLanguageCourses($filter: LanguageCourseSearchFilterInput) {
  searchLanguageCourses(filter: $filter) {
    offeringId
    schoolId
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
  if (!cats.length) return true;
  const blob = cats
    .map(
      (c) =>
        `${c.codeName ?? ""} ${c.offeringCourseCategoryContent?.codeName ?? ""}`
    )
    .join(" ")
    .toLowerCase();
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

function campusMatchBlob(campus: ConnectedSchool, companyName?: string): string {
  return [
    campus.name,
    companyName,
    campus.address,
    campus.googlePlace?.translation,
    campus.country?.nameTranslation,
    campus.country?.code,
    String(campus.schoolId),
  ]
    .filter(Boolean)
    .join(" ");
}

function matchCampusTarget(
  campus: ConnectedSchool,
  companyName?: string
): InitialCampusTarget | null {
  if (isForceDisabledSchool(campus.name)) return null;
  const byKnown = INITIAL_CAMPUS_TARGETS.find(
    (t) => t.knownSchoolId === campus.schoolId
  );
  if (byKnown) return byKnown;
  return matchInitialCampusBlob(campusMatchBlob(campus, companyName));
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

/**
 * Experience = short language immersion by weeks.
 * Keep COURSE with WEEK (3) pricing; drop TERM-only (9), HS, university, pathway.
 */
export function isShortLanguageCourse(o: OfferingRow): boolean {
  if (!isCourseOffering(o)) return false;
  const title = `${o.offeringCourse?.name ?? ""} ${o.name ?? ""}`;
  const category = o.offeringCourse?.offeringCourseCategory?.codeName ?? "";
  const blob = `${title} ${category}`.toLowerCase();

  if (
    /high\s*school|junior\s*high|secondary\s*school|k-12|pathway|university|college|foundation\s*year|bachelor|master'?s|degree\s*pathway|academic\s*year|undergraduate|postgraduate|vocational\s*diploma/.test(
      blob
    )
  ) {
    return false;
  }

  const prices = o.offeringCourse?.prices ?? [];
  const hasWeek = prices.some((p) => p.durationTypeId === EDVISOR_DURATION_WEEK);
  const hasTerm = prices.some((p) => p.durationTypeId === EDVISOR_DURATION_TERM);
  if (hasTerm && !hasWeek) return false;
  // No duration metadata — still allow COURSE (gateway may confirm later)
  return true;
}

/** Prefer WEEK (3) prices for catalog hints; never invent charge amounts. */
function weeklyUsdFromPrices(prices: OfferingPrice[] | null | undefined): number | null {
  if (!prices?.length) return null;
  const weekFirst = [
    ...prices.filter((p) => p.durationTypeId === EDVISOR_DURATION_WEEK),
    ...prices.filter((p) => p.durationTypeId !== EDVISOR_DURATION_TERM),
  ];
  const candidates: number[] = [];
  for (const p of weekFirst) {
    if (p.durationTypeId === EDVISOR_DURATION_TERM) continue;
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

function hintUsdFromPrices(prices: OfferingPrice[] | null | undefined): number | null {
  const weekly = weeklyUsdFromPrices(prices);
  if (weekly != null) return weekly;
  if (!prices?.length) return null;
  for (const p of prices) {
    if (p.durationTypeId === EDVISOR_DURATION_TERM) continue;
    const usd = p.bestPromotionalPriceUsd ?? p.originalPriceUsd;
    if (usd != null && usd > 0) return Math.round(usd);
  }
  return null;
}

function resolveCity(campus: ConnectedSchool, countryName: string): string {
  const place = campus.googlePlace?.translation?.trim();
  if (place) {
    const first = place.split(",")[0]?.trim();
    if (first) return first;
  }
  const address = campus.address?.trim();
  if (address) {
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2]!;
    if (parts.length === 1) return parts[0]!;
  }
  return countryName;
}

/**
 * Lightweight connected-list scan — stop early once all Phase A targets match.
 * Never paginates offerings for the full agency graph.
 */
async function resolveInitialCampuses(): Promise<{
  campuses: ConnectedSchool[];
  companiesScanned: number;
  matchedLabels: string[];
}> {
  const pageSize = 50;
  let offset = 0;
  let total = Infinity;
  let companiesScanned = 0;
  const byId = new Map<number, ConnectedSchool>();
  const hitLabels = new Set<string>();

  while (offset < total && hitLabels.size < INITIAL_CAMPUS_TARGETS.length) {
    const data = await edvisorGraphql<{
      schoolCompanyConnectedList: {
        metadata?: { total?: number };
        data?: ConnectedCompany[];
      };
    }>(CONNECTED_QUERY, { limit: pageSize, offset });

    const page = data.schoolCompanyConnectedList?.data ?? [];
    total = data.schoolCompanyConnectedList?.metadata?.total ?? page.length;
    companiesScanned += page.length;

    for (const company of page) {
      if (company.isAccountInactive) continue;
      for (const raw of company.schools ?? []) {
        const campus: ConnectedSchool = {
          ...raw,
          schoolCompanyId: raw.schoolCompanyId || company.schoolCompanyId,
          name: raw.name || company.name,
        };
        if (campus.isDeleted || campus.hidden) continue;
        if (!categoryLooksLikeLanguage(campus)) continue;
        if (isForceDisabledSchool(campus.name)) continue;
        const target = matchCampusTarget(campus, company.name);
        if (!target) continue;
        byId.set(campus.schoolId, campus);
        hitLabels.add(target.label);
      }
    }

    offset += pageSize;
    if (!page.length) break;
  }

  // Seed known ids (e.g. ILSC Toronto 114) if name/city scan missed them
  for (const schoolId of KNOWN_INITIAL_SCHOOL_IDS) {
    if (byId.has(schoolId)) continue;
    try {
      const data = await edvisorGraphql<{ school?: ConnectedSchool | null }>(
        SCHOOL_BY_ID_QUERY,
        { schoolId }
      );
      const campus = data.school;
      if (!campus || campus.isDeleted || campus.hidden) continue;
      if (isForceDisabledSchool(campus.name)) continue;
      byId.set(campus.schoolId, campus);
      const target = matchCampusTarget(campus);
      if (target) hitLabels.add(target.label);
    } catch {
      // soft-fail — continue with what we have
    }
  }

  return {
    campuses: [...byId.values()],
    companiesScanned,
    matchedLabels: [...hitLabels],
  };
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

/**
 * Gateway language search (WEEK) — offering ids that are short-course quotable.
 * Soft-fail per campus so api-v2 COURSE/WEEK can still land.
 */
async function fetchGatewayShortCourseOfferingIds(
  schoolIds: number[]
): Promise<Set<number>> {
  const ids = new Set<number>();
  await Promise.all(
    schoolIds.map(async (schoolId) => {
      try {
        const data = await edvisorGatewayGraphql<{
          searchLanguageCourses?: Array<{ offeringId?: number; schoolId?: number }>;
        }>(GATEWAY_LANGUAGE_COURSES, {
          filter: {
            campusIds: [schoolId],
            durationType: "WEEK",
            minDurationAmount: 4,
          },
        });
        for (const row of data.searchLanguageCourses ?? []) {
          if (row.offeringId != null) ids.add(row.offeringId);
        }
      } catch {
        // soft-fail — campus still uses api-v2 short COURSE filter
      }
    })
  );
  return ids;
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
  mode: "phase-a-scoped";
  schoolCompanies: number;
  schools: number;
  languageSchools: number;
  programs: number;
  destinations: number;
  services: number;
  matchedLabels: string[];
  schoolIds: number[];
  catalogPath: string;
  error?: string;
};

/**
 * Phase A: sync only initial campuses + short COURSE offerings → Firestore active.
 */
export async function syncEdvisorLanguageSchools(): Promise<EdvisorSyncResult> {
  const empty = (partial: Partial<EdvisorSyncResult>): EdvisorSyncResult => ({
    ok: false,
    configured: false,
    mode: "phase-a-scoped",
    schoolCompanies: 0,
    schools: 0,
    languageSchools: 0,
    programs: 0,
    destinations: 0,
    services: 0,
    matchedLabels: [],
    schoolIds: [],
    catalogPath: liveCatalogPath(),
    ...partial,
  });

  if (!isEdvisorApiConfigured()) {
    return empty({
      error:
        "EDVISOR_API_KEY no configurada. Pide la API key de la agencia en Edvisor (Bearer) y añádela al entorno.",
    });
  }

  try {
    const { campuses, companiesScanned, matchedLabels } =
      await resolveInitialCampuses();

    if (!campuses.length) {
      return empty({
        configured: true,
        schoolCompanies: companiesScanned,
        error:
          "Phase A: no se resolvieron campuses iniciales (ILSC CA + Gateway St. Julians).",
      });
    }

    const schoolIds = campuses.map((s) => s.schoolId);
    const [offerings, gatewayOfferingIds] = await Promise.all([
      fetchOfferingsForSchools(schoolIds),
      fetchGatewayShortCourseOfferingIds(schoolIds),
    ]);

    const courseBySchool = new Map<number, OfferingRow[]>();
    const serviceBySchool = new Map<number, OfferingRow[]>();
    for (const o of offerings) {
      if (o.isDeleted || o.isEnabled === false) continue;
      if (isCourseOffering(o)) {
        if (!isShortLanguageCourse(o)) continue;
        // Prefer gateway-confirmed short courses when gateway returned data for any campus
        if (gatewayOfferingIds.size > 0 && !gatewayOfferingIds.has(o.offeringId)) {
          continue;
        }
        const list = courseBySchool.get(o.schoolId) ?? [];
        list.push(o);
        courseBySchool.set(o.schoolId, list);
      } else {
        const list = serviceBySchool.get(o.schoolId) ?? [];
        list.push(o);
        serviceBySchool.set(o.schoolId, list);
      }
    }

    // Always keep resolved Phase A campuses (even if a campus has 0 courses yet)
    const languageCampuses = campuses;

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
          summary: `${campus.name} · Edvisor short course ${off.offeringId}`,
          lessonsPerWeek: 0,
          weeklyPriceUsd: weekly ?? 0,
          highlights: complete
            ? ["Precio Edvisor (informativo de catálogo)", "Curso corto WEEK"]
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
          ...(typeCode ? { offeringTypeCode: typeCode } : {}),
          edvisorOfferingId: String(off.offeringId),
          complete: false,
          ...(priceHintUsd != null ? { priceHintUsd } : {}),
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
        note: `Phase A scoped sync: ${languageCampuses.length} campuses (${matchedLabels.join(", ")}) · short COURSE/WEEK only · ${services.length} services (inventory). Exact-quote remains charge SoT.`,
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
      mode: "phase-a-scoped",
      schoolCompanies: companiesScanned,
      schools: campuses.length,
      languageSchools: languageCampuses.length,
      programs: programs.length,
      destinations: destinationsMap.size,
      services: services.length,
      matchedLabels,
      schoolIds,
      catalogPath: liveCatalogPath(),
    };
  } catch (err) {
    return empty({
      configured: true,
      error: err instanceof Error ? err.message : "Sync failed",
    });
  }
}
