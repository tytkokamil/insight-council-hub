export const DEMO_DECISIONS = [
  { id: "demo-1", title: "Zulieferer für Bremsscheiben wechseln", category: "Lieferanten", priority: "critical", status: "in_review", daysOpen: 8, costPerDay: 2800, health: 38, description: "Aktueller Lieferant hat Qualitätsprobleme. 3 Rückrufe in 6 Monaten.", reviewers: ["Maria K. (Einkauf)", "Thomas H. (Qualität)"] },
  { id: "demo-2", title: "ERP-System Update auf SAP S/4HANA", category: "IT-Infrastruktur", priority: "high", status: "draft", daysOpen: 14, costPerDay: 1200, health: 55, description: "Migration von Legacy-System notwendig." },
  { id: "demo-3", title: "Produktionsanlage Linie 3 — Investitionsentscheidung", category: "Investitionen", priority: "high", status: "draft", daysOpen: 2, costPerDay: 3400, health: 72, description: "Kapazitätserweiterung für neue Baureihe." },
  { id: "demo-4", title: "IATF 16949 Re-Zertifizierung 2024", category: "Compliance", priority: "critical", status: "approved", daysOpen: 0, costPerDay: 0, health: 92, description: "Audit-Termin in 6 Wochen, Maßnahmenplan steht." },
  { id: "demo-5", title: "Kurzarbeit Q2 2024 — Personalentscheidung", category: "Personal", priority: "medium", status: "in_review", daysOpen: 6, costPerDay: 890, health: 61, description: "Auftragsrückgang erfordert Personalanpassung." },
];

export const DEMO_ORG = {
  name: "Mustermann GmbH",
  industry: "Automotive",
  icon: "🏭",
  codHourlyRate: 95,
  avgPersonsInvolved: 4,
  totalWeeklyCod: 8290,
};

export const DEMO_KPIS = {
  openDecisions: 4,
  overdue: 1,
  avgDecisionDays: 7.2,
  qualityScore: 71,
  velocityScore: 64,
  implementedThisMonth: 3,
  totalCostOfDelay: 8290,
};
