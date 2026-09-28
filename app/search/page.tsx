import { redirect } from "next/navigation";

/**
 * Legacy /search used a static Berlin/Valletta/London school list.
 * Cotizador browse is the BookingWizard on `/` fed by live `/api/catalog`.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) qs.set(key, value);
  }
  // Keep passport/language if present; destination slugs from the old demo
  // list are not valid live ids — drop them so the wizard starts clean.
  qs.delete("destination");
  const suffix = qs.toString();
  redirect(suffix ? `/?${suffix}` : "/");
}
