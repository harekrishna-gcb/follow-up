/**
 * Normalises an Indian mobile number to 10 digits:
 * strips spaces, dashes, brackets, a leading 0 or +91 / 91.
 */
export function normalizePhone(raw: string | null | undefined): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  while (d.length > 10 && (d.startsWith('0') || d.startsWith('91'))) {
    d = d.startsWith('0') ? d.slice(1) : d.slice(2);
  }
  return d;
}

export function isValidPhone(raw: string | null | undefined): boolean {
  return /^\d{10}$/.test(normalizePhone(raw));
}

/** tel:+91XXXXXXXXXX */
export function telHref(raw: string): string {
  return `tel:+91${normalizePhone(raw)}`;
}

/** https://wa.me/91XXXXXXXXXX */
export function whatsappHref(raw: string): string {
  return `https://wa.me/91${normalizePhone(raw)}`;
}

/** 98765 43210 */
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : raw;
}
