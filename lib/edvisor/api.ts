/**
 * Edvisor GraphQL client (server-only).
 * Docs: https://edvisor-io.github.io/api-v2-docs/
 * Schema queries: schoolsList, schoolCompanyConnectedList, offeringsList, coursesList
 */

import "server-only";

const DEFAULT_ENDPOINT = "https://api.edvisor.io/graphql";
const FALLBACK_ENDPOINT = "https://api-v2.edvisor.io/graphql";

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
    public details?: unknown
  ) {
    super(message);
    this.name = "EdvisorApiError";
  }
}

export async function edvisorGraphql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const apiKey = getEdvisorApiKey();
  if (!apiKey) {
    throw new EdvisorApiError(
      "EDVISOR_API_KEY missing. Add the agency Bearer key to pull live schools from Edvisor."
    );
  }

  const endpoints = [
    process.env.EDVISOR_API_URL?.trim() || DEFAULT_ENDPOINT,
    FALLBACK_ENDPOINT,
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: unknown;
  for (const endpoint of endpoints) {
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
      });

      const json = (await res.json()) as {
        data?: T;
        errors?: Array<{ message?: string }>;
      };

      if (!res.ok) {
        lastError = new EdvisorApiError(
          `Edvisor HTTP ${res.status} at ${endpoint}`,
          res.status,
          json
        );
        continue;
      }

      if (json.errors?.length) {
        const msg = json.errors.map((e) => e.message).filter(Boolean).join("; ");
        // Unauthenticated on this host — try next endpoint
        if (/unauth/i.test(msg)) {
          lastError = new EdvisorApiError(msg || "Unauthenticated", 401, json.errors);
          continue;
        }
        throw new EdvisorApiError(msg || "Edvisor GraphQL error", res.status, json.errors);
      }

      if (!json.data) {
        throw new EdvisorApiError("Edvisor returned empty data", res.status, json);
      }

      return json.data;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError instanceof EdvisorApiError) throw lastError;
  throw new EdvisorApiError(
    lastError instanceof Error ? lastError.message : "Edvisor request failed"
  );
}
