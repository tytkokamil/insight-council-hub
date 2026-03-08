export const DEMO_DECISIONS = [
  { id: "demo-1", title: "MaRisk-Compliance Anpassung 2024", category: "Compliance", priority: "critical", status: "in_review", daysOpen: 9, costPerDay: 3800, health: 40, description: "BaFin-Prüfung angekündigt. Lücken im Risikomanagement." },
  { id: "demo-2", title: "Core Banking System Modernisierung", category: "IT-Infrastruktur", priority: "high", status: "draft", daysOpen: 22, costPerDay: 5200, health: 32, description: "Legacy-System aus 2008 muss abgelöst werden." },
  { id: "demo-3", title: "ESG-Reporting Framework implementieren", category: "Compliance", priority: "high", status: "in_review", daysOpen: 5, costPerDay: 1200, health: 68, description: "EU-Taxonomie Anforderungen ab 2025." },
  { id: "demo-4", title: "Filialkonzept 2025 — Standortoptimierung", category: "Strategie", priority: "medium", status: "approved", daysOpen: 0, costPerDay: 0, health: 85, description: "3 Filialen werden zu Smart-Branches." },
  { id: "demo-5", title: "KI-basierte Betrugserkennung einführen", category: "IT-Infrastruktur", priority: "high", status: "draft", daysOpen: 8, costPerDay: 2100, health: 55, description: "Verlustrate durch Betrug: €340k/Jahr." },
];

export const DEMO_ORG = { name: "Mittelstand Bank eG", industry: "Finanzen", icon: "🏦", codHourlyRate: 130, avgPersonsInvolved: 4, totalWeeklyCod: 12300 };
export const DEMO_KPIS = { openDecisions: 4, overdue: 2, avgDecisionDays: 12.4, qualityScore: 55, velocityScore: 38, implementedThisMonth: 1, totalCostOfDelay: 12300 };
