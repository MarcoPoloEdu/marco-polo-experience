/**
 * Nationality mapping: UI codes (COL) ↔ ISO2 (CO) ↔ Edvisor countryId.
 * Never default to Colombia for real buyers.
 */

/** UI nationality codes used in the cotizador → ISO 3166-1 alpha-2 */
const UI_TO_ISO2: Record<string, string> = {
  COL: "CO",
  MEX: "MX",
  PER: "PE",
  CHL: "CL",
  ARG: "AR",
  BRA: "BR",
  ECU: "EC",
  URY: "UY",
  CRI: "CR",
  PAN: "PA",
};

/**
 * Edvisor countryId map — verify against live API before enabling purchases
 * that depend on nationality-specific pricing. CO→46 is from prior MPE integration.
 */
const ISO2_TO_EDVISOR_COUNTRY_ID: Record<string, number> = {
  CO: 46,
};

export function iso2FromUiNationality(code: string): string | null {
  const upper = code.trim().toUpperCase();
  if (upper.length === 2 && !UI_TO_ISO2[upper]) return upper;
  return UI_TO_ISO2[upper] ?? null;
}

export function edvisorCountryIdFromIso2(iso2: string): number | null {
  return ISO2_TO_EDVISOR_COUNTRY_ID[iso2.toUpperCase()] ?? null;
}

export function requireNationalityIso2(raw: string | undefined | null): string {
  if (!raw?.trim()) {
    throw new Error("Nacionalidad requerida");
  }
  const iso = iso2FromUiNationality(raw);
  if (!iso) {
    throw new Error(`Nacionalidad no mapeada: ${raw}`);
  }
  return iso;
}
