/**
 * Dual Edvisor GraphQL clients (server-only Bearer).
 * API v2 and Gateway are separate — never retry the other host as a silent fallback.
 */

import "server-only";

import {
  getEdvisorAgencyId,
  resolveEdvisorGatewayUrl,
  resolveEdvisorV2Url,
  type EdvisorHostKind,
} from "@/lib/edvisor/hosts";

const DEFAULT_TIMEOUT_MS = 25_000;

export function getEdvisorApiKey(): string | null {
  const key = process.env.EDVISOR_API_KEY?.trim();
  return key || null;
}

export function isEdvisorApiConfigured(): boolean {
  return Boolean(getEdvisorApiKey());
}

export class EdvisorApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
    public host?: EdvisorHostKind
  ) {
    super(message);
    this.name = "EdvisorApiError";
  }
}

export type EdvisorRequestOptions = {
  timeoutMs?: number;
  /** AbortSignal from caller */
  signal?: AbortSignal;
};

async function edvisorGraphqlOnHost<T>(
  host: EdvisorHostKind,
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
  options?: EdvisorRequestOptions
): Promise<T> {
  const apiKey = getEdvisorApiKey();
  if (!apiKey) {
    throw new EdvisorApiError(
      "EDVISOR_API_KEY missing. Add the agency Bearer key (server-only).",
      503,
      undefined,
      host
    );
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: controller.signal,
    });

    let json: {
      data?: T;
      errors?: Array<{ message?: string }>;
    };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      throw new EdvisorApiError(
        `Edvisor ${host} returned non-JSON (HTTP ${res.status})`,
        res.status,
        undefined,
        host
      );
    }

    if (!res.ok) {
      throw new EdvisorApiError(
        `Edvisor ${host} HTTP ${res.status}`,
        res.status,
        json,
        host
      );
    }

    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).filter(Boolean).join("; ");
      throw new EdvisorApiError(
        msg || `Edvisor ${host} GraphQL error`,
        res.status,
        json.errors,
        host
      );
    }

    if (json.data === undefined || json.data === null) {
      throw new EdvisorApiError(
        `Edvisor ${host} returned empty data`,
        res.status,
        json,
        host
      );
    }

    return json.data;
  } catch (err) {
    if (err instanceof EdvisorApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new EdvisorApiError(`Edvisor ${host} timeout`, 504, undefined, host);
    }
    throw new EdvisorApiError(
      err instanceof Error ? err.message : `Edvisor ${host} request failed`,
      undefined,
      err,
      host
    );
  } finally {
    clearTimeout(timer);
    options?.signal?.removeEventListener("abort", onAbort);
  }
}

/** API v2 client — catalog, generateQuotePrice, enrollments. */
export async function edvisorApiV2Graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: EdvisorRequestOptions
): Promise<T> {
  return edvisorGraphqlOnHost<T>(
    "api-v2",
    resolveEdvisorV2Url(),
    query,
    variables,
    options
  );
}

/** Federation Gateway client — searchLanguageCourses, addons, accommodationPrice. */
export async function edvisorGatewayGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: EdvisorRequestOptions
): Promise<T> {
  return edvisorGraphqlOnHost<T>(
    "gateway",
    resolveEdvisorGatewayUrl(),
    query,
    variables,
    options
  );
}

export function edvisorClientDiagnostics(): {
  apiKeyConfigured: boolean;
  apiV2Url: string;
  gatewayUrl: string;
  agencyId: number | null;
} {
  return {
    apiKeyConfigured: isEdvisorApiConfigured(),
    apiV2Url: resolveEdvisorV2Url(),
    gatewayUrl: resolveEdvisorGatewayUrl(),
    agencyId: getEdvisorAgencyId(),
  };
}
