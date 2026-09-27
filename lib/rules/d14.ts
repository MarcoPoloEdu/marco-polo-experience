/**
 * Regla financiera D-14: ningún proveedor recibe dinero antes de
 * travelDepartureDate - 14 días calendario.
 */

export function supplierPaymentNotBefore(travelDepartureDate: string): string {
  const d = parseLocalDate(travelDepartureDate);
  if (!d) {
    throw new Error(`Fecha de salida inválida: ${travelDepartureDate}`);
  }
  d.setDate(d.getDate() - 14);
  return formatLocalDate(d);
}

export function isSupplierPaymentAllowed(
  travelDepartureDate: string,
  asOfIso: string = new Date().toISOString().slice(0, 10)
): boolean {
  const notBefore = supplierPaymentNotBefore(travelDepartureDate);
  return asOfIso >= notBefore;
}

export function parseLocalDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) {
    return null;
  }
  return d;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
