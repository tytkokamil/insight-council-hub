export const DEMO_DECISIONS = [
  { id: "demo-1", title: "CNC-Fräsmaschine 5-Achs — Investition genehmigen", category: "Investitionen", priority: "critical", status: "in_review", daysOpen: 11, costPerDay: 3100, health: 42, description: "Alte Maschine hat 15% Ausfallquote. Angebot von DMG Mori liegt vor." },
  { id: "demo-2", title: "Konstruktionssoftware: SolidWorks vs. Inventor", category: "IT-Infrastruktur", priority: "high", status: "draft", daysOpen: 9, costPerDay: 980, health: 58, description: "Lizenzverlängerung steht an — Wechsel evaluieren." },
  { id: "demo-3", title: "ISO 9001 Audit-Vorbereitung Q3", category: "Compliance", priority: "high", status: "in_review", daysOpen: 5, costPerDay: 1500, health: 65, description: "Dokumentation unvollständig, Auditor kommt in 4 Wochen." },
  { id: "demo-4", title: "Fachkräftemangel — Azubi-Programm erweitern", category: "Personal", priority: "medium", status: "draft", daysOpen: 18, costPerDay: 450, health: 48, description: "3 offene Stellen seit 6 Monaten unbesetzt." },
  { id: "demo-5", title: "Materialpreis-Eskalation Stahl — Einkaufsstrategie", category: "Lieferanten", priority: "critical", status: "approved", daysOpen: 0, costPerDay: 0, health: 88, description: "Rahmenvertrag mit Fixpreisen abgeschlossen." },
];

export const DEMO_ORG = { name: "Präzision Meier GmbH", industry: "Maschinenbau", icon: "⚙️", codHourlyRate: 85, avgPersonsInvolved: 3, totalWeeklyCod: 6030 };
export const DEMO_KPIS = { openDecisions: 4, overdue: 2, avgDecisionDays: 9.1, qualityScore: 62, velocityScore: 51, implementedThisMonth: 2, totalCostOfDelay: 6030 };
