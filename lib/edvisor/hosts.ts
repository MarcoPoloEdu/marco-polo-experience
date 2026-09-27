/**
 * Edvisor GraphQL hosts — explicit clients only.
 * Do NOT fall back across hosts on schema/auth errors.
 */

export const EDVISOR_API_V2_URL = "https://api-v2.edvisor.io/graphql";
export const EDVISOR_GATEWAY_URL = "https://federation-gateway.edvisor.io/graphql";

/** Legacy alias some agencies still use — only when EDVISOR_API_V2_URL override unset. */
export const EDVISOR_API_V2_ALT = "https://api.edvisor.io/graphql";

export type EdvisorHostKind = "api-v2" | "gateway";

export function resolveEdvisorV2Url(): string {
  return (
    process.env.EDVISOR_API_V2_URL?.trim() ||
    process.env.EDVISOR_API_URL?.trim() ||
    EDVISOR_API_V2_URL
  );
}

export function resolveEdvisorGatewayUrl(): string {
  return process.env.EDVISOR_GATEWAY_URL?.trim() || EDVISOR_GATEWAY_URL;
}

/** Agency/office reference from prior integration — configurable, not assumed valid. */
export function getEdvisorAgencyId(): number | null {
  const raw = process.env.EDVISOR_AGENCY_ID?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function getEdvisorOfficeId(): number | null {
  const raw = process.env.EDVISOR_OFFICE_ID?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
