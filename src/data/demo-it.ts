export const DEMO_DECISIONS = [
  { id: "demo-1", title: "Cloud-Architektur Migration AWS → Multi-Cloud", category: "IT-Infrastruktur", priority: "critical", status: "in_review", daysOpen: 10, costPerDay: 2400, health: 45, description: "Vendor Lock-in reduzieren, Kosten optimieren." },
  { id: "demo-2", title: "Security Incident Response Plan aktualisieren", category: "Compliance", priority: "high", status: "draft", daysOpen: 6, costPerDay: 1600, health: 62, description: "NIS2-Anforderungen erfordern überarbeiteten Plan." },
  { id: "demo-3", title: "Product Roadmap Q3 — Feature Priorisierung", category: "Strategie", priority: "high", status: "in_review", daysOpen: 3, costPerDay: 950, health: 75, description: "5 Feature-Requests, Budget für 2." },
  { id: "demo-4", title: "Remote-Work Policy überarbeiten", category: "Personal", priority: "medium", status: "approved", daysOpen: 0, costPerDay: 0, health: 89, description: "Hybrid-Modell beschlossen." },
  { id: "demo-5", title: "DevOps Toolchain — GitHub vs. GitLab", category: "IT-Infrastruktur", priority: "medium", status: "draft", daysOpen: 15, costPerDay: 680, health: 53, description: "Lizenzkosten um 40% gestiegen." },
];

export const DEMO_ORG = { name: "TechFlow GmbH", industry: "IT", icon: "💻", codHourlyRate: 105, avgPersonsInvolved: 3, totalWeeklyCod: 5630 };
export const DEMO_KPIS = { openDecisions: 4, overdue: 1, avgDecisionDays: 5.8, qualityScore: 76, velocityScore: 72, implementedThisMonth: 4, totalCostOfDelay: 5630 };
