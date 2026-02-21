/** Shared label maps for enums used across the app.
 *  Static maps (German) kept for backward-compat in non-React contexts (PDF export, etc.).
 *  For React components, use useTranslatedLabels() instead. */

export const categoryLabels: Record<string, string> = {
  strategic: "Strategisch",
  budget: "Budget",
  hr: "Personal",
  technical: "Technisch",
  operational: "Operativ",
  marketing: "Marketing",
};

export const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  proposed: "Vorschlag",
  review: "Review",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  implemented: "Umgesetzt",
  cancelled: "Abgebrochen",
  superseded: "Ersetzt",
  archived: "Archiviert",
};

export const priorityLabels: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

/** i18n-aware label hook for React components */
export function useTranslatedLabels(t: (key: string) => string) {
  const statusKeys = ["draft", "proposed", "review", "approved", "rejected", "implemented", "cancelled", "superseded", "archived"];
  const categoryKeys = ["strategic", "budget", "hr", "technical", "operational", "marketing"];
  const priorityKeys = ["low", "medium", "high", "critical"];

  const tStatus: Record<string, string> = {};
  statusKeys.forEach(k => { tStatus[k] = t(`status.${k}`); });

  const tCategory: Record<string, string> = {};
  categoryKeys.forEach(k => { tCategory[k] = t(`category.${k}`); });

  const tPriority: Record<string, string> = {};
  priorityKeys.forEach(k => { tPriority[k] = t(`priority.${k}`); });

  return { statusLabels: tStatus, categoryLabels: tCategory, priorityLabels: tPriority };
}
