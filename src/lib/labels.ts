/** Shared German label maps for enums used across the app */

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
