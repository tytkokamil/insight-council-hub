export const DEMO_DECISIONS = [
  { id: "demo-1", title: "GMP-Validierung Produktionslinie B", category: "Compliance", priority: "critical", status: "in_review", daysOpen: 12, costPerDay: 4200, health: 35, description: "FDA-Audit in 8 Wochen. Validierung noch nicht abgeschlossen." },
  { id: "demo-2", title: "Wirkstofflieferant Diversifizierung", category: "Lieferanten", priority: "high", status: "draft", daysOpen: 7, costPerDay: 2100, health: 52, description: "Abhängigkeit von einem einzigen API-Lieferanten." },
  { id: "demo-3", title: "Klinische Studie Phase III — Go/No-Go", category: "Investitionen", priority: "critical", status: "in_review", daysOpen: 4, costPerDay: 8500, health: 68, description: "€12M Budget-Entscheidung für Phase III." },
  { id: "demo-4", title: "Reinraum-Modernisierung Klasse B", category: "Investitionen", priority: "high", status: "approved", daysOpen: 0, costPerDay: 0, health: 91, description: "Genehmigt, Umbau startet nächsten Monat." },
  { id: "demo-5", title: "QP-Nachfolge — Qualified Person ersetzen", category: "Personal", priority: "medium", status: "draft", daysOpen: 21, costPerDay: 1800, health: 41, description: "Aktuelle QP geht in Rente." },
];

export const DEMO_ORG = { name: "PharmaCure GmbH", industry: "Pharma", icon: "💊", codHourlyRate: 120, avgPersonsInvolved: 5, totalWeeklyCod: 16600 };
export const DEMO_KPIS = { openDecisions: 4, overdue: 1, avgDecisionDays: 11.3, qualityScore: 58, velocityScore: 42, implementedThisMonth: 1, totalCostOfDelay: 16600 };
