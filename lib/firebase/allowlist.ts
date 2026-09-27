/** Shared admin allowlist — safe for client and server. */

export const ADMIN_ALLOWLIST = ["admin@marcopoloeducation.com"] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_ALLOWLIST as readonly string[]).includes(email.toLowerCase());
}
