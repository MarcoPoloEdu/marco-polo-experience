import type { DestinationSlug, PassportCode } from "@/lib/types";

/**
 * Static curated matrix for LatAm → destination consular-visa friction.
 * Orientation only — not legal advice. Rules change; confirm with official sources.
 */

/** Nationalities that typically need a Schengen consular visa for short stays. */
const SCHENGEN_VISA_REQUIRED: PassportCode[] = [
  "BOL",
  "ECU",
  "VEN",
  "DOM",
];

/** Nationalities that typically need a UK visitor/study consular visa. */
const UK_VISA_REQUIRED: PassportCode[] = [
  "COL",
  "PER",
  "BOL",
  "ECU",
  "VEN",
  "DOM",
  "GTM",
  "HND",
  "SLV",
  "NIC",
  "PRY",
];

const DESTINATION_VISA_SETS: Record<DestinationSlug, PassportCode[]> = {
  berlin: SCHENGEN_VISA_REQUIRED,
  valletta: SCHENGEN_VISA_REQUIRED,
  london: UK_VISA_REQUIRED,
};

export const VISA_DISCLAIMER =
  "Orientación general, no es asesoría legal. Las reglas migratorias cambian: confirma siempre con la embajada o consulado correspondiente.";

export function isVisaRequired(
  nationality: PassportCode,
  destination: DestinationSlug
): boolean {
  return DESTINATION_VISA_SETS[destination].includes(nationality);
}

export function getVisaFreeDestinations(
  nationality: PassportCode
): DestinationSlug[] {
  return (Object.keys(DESTINATION_VISA_SETS) as DestinationSlug[]).filter(
    (slug) => !isVisaRequired(nationality, slug)
  );
}

export function getVisaRule(
  nationality: PassportCode,
  destination: DestinationSlug
): { visaRequired: boolean } {
  return { visaRequired: isVisaRequired(nationality, destination) };
}
