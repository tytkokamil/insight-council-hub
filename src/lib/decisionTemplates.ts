export interface RequiredField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface ApprovalStep {
  role: string;
  label: string;
  required: boolean;
}

export interface DecisionTemplate {
  name: string;
  category: string;
  priority: string;
  description: string;
  defaultDurationDays: number;
  requiredFields: RequiredField[];
  approvalSteps: ApprovalStep[];
  governanceNotes?: string;
}

// Shared fields used across multiple templates
const contextField: RequiredField = { key: "context", label: "Kontext & Hintergrund", type: "textarea", placeholder: "Warum ist diese Entscheidung notwendig?" };
const riskField: RequiredField = { key: "risk_assessment", label: "Risikobewertung", type: "textarea", placeholder: "Welche Risiken bestehen?" };
const alternativesField: RequiredField = { key: "alternatives", label: "Geprüfte Alternativen", type: "textarea", placeholder: "Welche Alternativen wurden evaluiert?" };
const budgetField: RequiredField = { key: "budget_impact", label: "Budget-Auswirkung (€)", type: "text", placeholder: "z.B. 50.000€" };
const timelineField: RequiredField = { key: "timeline", label: "Zeithorizont", type: "select", options: [
  { value: "short", label: "Kurzfristig (< 3 Monate)" },
  { value: "medium", label: "Mittelfristig (3–12 Monate)" },
  { value: "long", label: "Langfristig (> 12 Monate)" },
]};
const stakeholdersField: RequiredField = { key: "stakeholders", label: "Betroffene Stakeholder", type: "text", placeholder: "z.B. Vertrieb, Produkt, Vorstand" };

export const decisionTemplates: DecisionTemplate[] = [
  {
    name: "Strategische Ausrichtung",
    category: "strategic",
    priority: "critical",
    description: "Grundlegende strategische Richtungsentscheidung mit langfristiger Auswirkung auf das Unternehmen.",
    defaultDurationDays: 30,
    requiredFields: [contextField, alternativesField, riskField, budgetField, timelineField, stakeholdersField],
    approvalSteps: [
      { role: "decision_maker", label: "Fachverantwortlicher", required: true },
      { role: "reviewer", label: "Strategie-Review", required: true },
      { role: "admin", label: "Vorstandsfreigabe", required: true },
    ],
    governanceNotes: "Strategische Entscheidungen erfordern vollständige Dokumentation aller Alternativen und eine dreistufige Freigabe.",
  },
  {
    name: "Budgetfreigabe",
    category: "budget",
    priority: "high",
    description: "Freigabe eines Budgets für ein Projekt oder eine Abteilung. Finanzielle Prüfung erforderlich.",
    defaultDurationDays: 14,
    requiredFields: [
      contextField,
      budgetField,
      { key: "cost_breakdown", label: "Kostenaufschlüsselung", type: "textarea", placeholder: "Personal, Lizenzen, Infrastruktur..." },
      { key: "roi_estimate", label: "ROI-Schätzung", type: "text", placeholder: "z.B. 200% in 12 Monaten" },
      riskField,
    ],
    approvalSteps: [
      { role: "decision_maker", label: "Budget-Verantwortlicher", required: true },
      { role: "reviewer", label: "Finanz-Review", required: true },
      { role: "admin", label: "CFO / Geschäftsführung", required: true },
    ],
    governanceNotes: "Budget-Entscheidungen > 10.000€ erfordern CFO-Freigabe. ROI-Schätzung ist Pflicht.",
  },
  {
    name: "Personalentscheidung",
    category: "hr",
    priority: "high",
    description: "Entscheidung zu Einstellung, Beförderung oder Teamstruktur.",
    defaultDurationDays: 21,
    requiredFields: [
      contextField,
      { key: "hr_type", label: "Art der Personalentscheidung", type: "select", options: [
        { value: "hiring", label: "Neueinstellung" },
        { value: "promotion", label: "Beförderung" },
        { value: "restructure", label: "Umstrukturierung" },
        { value: "termination", label: "Trennung" },
      ]},
      { key: "headcount_impact", label: "Headcount-Auswirkung", type: "text", placeholder: "z.B. +2 FTE" },
      budgetField,
      riskField,
    ],
    approvalSteps: [
      { role: "decision_maker", label: "Hiring Manager", required: true },
      { role: "reviewer", label: "HR-Review", required: true },
      { role: "admin", label: "Geschäftsführung", required: false },
    ],
    governanceNotes: "Personalentscheidungen mit Budget-Auswirkung > 80.000€/Jahr benötigen GF-Freigabe.",
  },
  {
    name: "Technische Architektur",
    category: "technical",
    priority: "medium",
    description: "Technologische Entscheidung zu Architektur, Stack oder Infrastruktur.",
    defaultDurationDays: 14,
    requiredFields: [
      contextField,
      alternativesField,
      { key: "tech_stack", label: "Betroffene Technologien", type: "text", placeholder: "z.B. React, PostgreSQL, AWS" },
      { key: "migration_effort", label: "Migrationsaufwand", type: "select", options: [
        { value: "low", label: "Gering (< 1 Woche)" },
        { value: "medium", label: "Mittel (1–4 Wochen)" },
        { value: "high", label: "Hoch (> 1 Monat)" },
      ]},
      riskField,
    ],
    approvalSteps: [
      { role: "decision_maker", label: "Tech Lead", required: true },
      { role: "reviewer", label: "Architecture Review", required: true },
    ],
    governanceNotes: "Architektur-Entscheidungen mit hohem Migrationsaufwand erfordern zusätzliche Stakeholder-Abstimmung.",
  },
  {
    name: "Operative Prozessänderung",
    category: "operational",
    priority: "medium",
    description: "Anpassung eines operativen Prozesses zur Effizienzsteigerung.",
    defaultDurationDays: 7,
    requiredFields: [
      contextField,
      { key: "current_process", label: "Aktueller Prozess", type: "textarea", placeholder: "Beschreibung des Ist-Zustands" },
      { key: "expected_improvement", label: "Erwartete Verbesserung", type: "text", placeholder: "z.B. 30% schnellere Bearbeitung" },
      stakeholdersField,
    ],
    approvalSteps: [
      { role: "decision_maker", label: "Prozessverantwortlicher", required: true },
      { role: "reviewer", label: "Operations Review", required: false },
    ],
    governanceNotes: "Operative Änderungen mit teamübergreifender Wirkung benötigen Review.",
  },
  {
    name: "Marketing-Kampagne",
    category: "marketing",
    priority: "medium",
    description: "Planung und Freigabe einer Marketing-Kampagne oder -Initiative.",
    defaultDurationDays: 10,
    requiredFields: [
      contextField,
      budgetField,
      { key: "target_audience", label: "Zielgruppe", type: "text", placeholder: "z.B. B2B SaaS, 50–200 MA" },
      { key: "kpis", label: "Erfolgs-KPIs", type: "text", placeholder: "z.B. 500 Leads, 10% Conversion" },
      timelineField,
    ],
    approvalSteps: [
      { role: "decision_maker", label: "Marketing Lead", required: true },
      { role: "reviewer", label: "Budget-Review", required: false },
    ],
    governanceNotes: "Kampagnen > 5.000€ Budget benötigen Budget-Review.",
  },
];

export const getTemplateByCategory = (category: string): DecisionTemplate | undefined =>
  decisionTemplates.find(t => t.category === category);
