/**
 * Shared PDF branding for all Decivio exports.
 * Provides consistent header, footer, and logo placement.
 */
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import i18n from "@/i18n";

const dateLoc = () => (i18n.language === "en" ? enUS : de);

// Decivio brand colors
const BRAND_DARK = [15, 23, 42] as const;   // slate-900
const BRAND_PRIMARY = [99, 102, 241] as const; // indigo-500

/**
 * Draw the Decivio branded header on the current page.
 * Returns the Y position after the header (ready for content).
 */
export function addPdfHeader(
  doc: any,
  title: string,
  subtitle?: string,
  meta?: string,
): number {
  const pw = doc.internal.pageSize.getWidth();
  const headerH = 32;

  // Dark header bar
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pw, headerH, "F");

  // Logo mark — small branded square
  doc.setFillColor(...BRAND_PRIMARY);
  doc.roundedRect(14, 8, 16, 16, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("D", 19.5, 19);

  // Brand name
  doc.setFontSize(14);
  doc.text("Decivio", 34, 15);

  // Report title
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(title, 34, 22);

  // Right side: date and meta
  const now = format(new Date(), "dd.MM.yyyy HH:mm", { locale: dateLoc() });
  doc.setFontSize(7);
  doc.text(now, pw - 14, 13, { align: "right" });
  if (meta) {
    doc.text(meta, pw - 14, 18, { align: "right" });
  }
  if (subtitle) {
    doc.text(subtitle, pw - 14, 23, { align: "right" });
  }

  // Reset text color
  doc.setTextColor(30, 30, 30);

  return headerH + 10;
}

/**
 * Add consistent footer to all pages of the document.
 * Call this AFTER all content has been added.
 */
export function addPdfFooter(doc: any, confidentialText?: string) {
  const pageCount = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const label = confidentialText || (i18n.language === "de"
    ? "Decivio · Vertraulich"
    : "Decivio · Confidential");

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, ph - 14, pw - 14, ph - 14);

    // Left: brand + confidential
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(label, 14, ph - 8);

    // Right: page number
    const pageLabel = i18n.language === "de"
      ? `Seite ${i} von ${pageCount}`
      : `Page ${i} of ${pageCount}`;
    doc.text(pageLabel, pw - 14, ph - 8, { align: "right" });
  }
}

/**
 * Section heading helper for consistent section titles.
 */
export function addSectionTitle(doc: any, title: string, y: number): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, y);
  return y + 6;
}
