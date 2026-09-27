/**
 * Edvisor GraphQL — compatibility shim.
 * Prefer importing from `@/lib/edvisor/clients` (explicit api-v2 / gateway).
 * This module no longer falls back across hosts.
 */

import "server-only";

export {
  EdvisorApiError,
  edvisorApiV2Graphql,
  edvisorGatewayGraphql,
  edvisorClientDiagnostics,
  getEdvisorApiKey,
  isEdvisorApiConfigured,
} from "@/lib/edvisor/clients";

import { edvisorApiV2Graphql } from "@/lib/edvisor/clients";

/**
 * @deprecated Use edvisorApiV2Graphql or edvisorGatewayGraphql explicitly.
 * Kept for live-sync catalog queries against API v2 only — no gateway fallback.
 */
export async function edvisorGraphql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return edvisorApiV2Graphql<T>(query, variables);
}
