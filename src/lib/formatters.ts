import i18n from "@/i18n";

/**
 * Returns the current locale string for Intl APIs ("de-DE" or "en-US").
 */
export const getLocale = (): string =>
  i18n.language === "de" ? "de-DE" : "en-US";

/**
 * Format a currency value consistently.
 * - Values >= 1_000_000 → "1,2M €" / "1.2M €"
 * - Values >= 1_000 → "1,2k €" / "1.2k €"
 * - Otherwise → "350 €"
 */
export const formatCost = (cost: number): string => {
  const locale = getLocale();
  if (Math.abs(cost) >= 1_000_000) {
    return `${(cost / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M €`;
  }
  if (Math.abs(cost) >= 1_000) {
    return `${(cost / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 })}k €`;
  }
  return `${Math.round(cost)} €`;
};

/**
 * Format a currency value using Intl.NumberFormat (full precision).
 * Example: 45300 → "45.300 €" (de) or "€45,300" (en)
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Format a date string to localized short format.
 * Example: "2026-02-27T10:30:00Z" → "27.02.2026" (de) or "02/27/2026" (en)
 */
export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/**
 * Format a date string to localized date+time.
 * Example: "2026-02-27T10:30:00Z" → "27.02.2026, 10:30" (de)
 */
export const formatDateTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleString(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Format a date string to short date+time (no year).
 * Example: "2026-02-27T10:30:00Z" → "27.02., 10:30" (de)
 */
export const formatDateTimeShort = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Format a number with locale-appropriate separators.
 * Example: 543456 → "543.456" (de) or "543,456" (en)
 */
export const formatNumber = (value: number, fractionDigits = 0): string =>
  value.toLocaleString(getLocale(), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
