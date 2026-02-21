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

/** A rule that conditionally adds fields or approval steps based on current form values */
export interface ConditionalRule {
  /** Which form field to evaluate */
  when: "priority" | "category" | "budget_impact" | "stakeholder_count";
  /** Comparison operator */
  operator: "equals" | "not_equals" | "greater_than" | "in";
  /** Value(s) to compare against */
  value: string | string[];
  /** Extra fields to require when condition is met */
  addFields?: RequiredField[];
  /** Extra approval steps to add when condition is met */
  addApprovalSteps?: ApprovalStep[];
  /** Governance hint shown when condition is met */
  governanceHint?: string;
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
  conditionalRules?: ConditionalRule[];
  /** Short "when to use" hint for the template picker */
  whenToUse?: string;
  /** Icon key for visual differentiation */
  iconColor?: string;
  /** Template version — increment when structure/rules change */
  version: number;
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

// Conditional-only fields (added dynamically)
const alignmentField: RequiredField = { key: "stakeholder_alignment", label: "Stakeholder-Alignment-Plan", type: "textarea", placeholder: "Wie wird Alignment zwischen den Stakeholdern hergestellt?" };
const executiveJustification: RequiredField = { key: "executive_justification", label: "Executive Justification", type: "textarea", placeholder: "Begründung für die Geschäftsführung..." };
const detailedRiskField: RequiredField = { key: "detailed_risk", label: "Detaillierte Risikoanalyse", type: "textarea", placeholder: "Eintrittswahrscheinlichkeit, Impact, Mitigationsmaßnahmen..." };
const complianceField: RequiredField = { key: "compliance_check", label: "Compliance-Prüfung", type: "textarea", placeholder: "Relevante regulatorische oder rechtliche Aspekte..." };

// Shared conditional rules reused across templates
const highPriorityRiskRule: ConditionalRule = {
  when: "priority",
  operator: "in",
  value: ["high", "critical"],
  addFields: [detailedRiskField],
  governanceHint: "Bei hoher/kritischer Priorität ist eine detaillierte Risikoanalyse Pflicht.",
};

const criticalApprovalRule: ConditionalRule = {
  when: "priority",
  operator: "equals",
  value: "critical",
  addApprovalSteps: [{ role: "admin", label: "Geschäftsführung (Pflicht bei Kritisch)", required: true }],
  governanceHint: "Kritische Entscheidungen erfordern zwingend eine Geschäftsführungsfreigabe.",
};

const largeBudgetRule: ConditionalRule = {
  when: "budget_impact",
  operator: "greater_than",
  value: "50000",
  addFields: [executiveJustification, complianceField],
  addApprovalSteps: [{ role: "admin", label: "CFO-Freigabe (> 50.000€)", required: true }],
  governanceHint: "Budget-Entscheidungen > 50.000€ erfordern CFO-Freigabe und Compliance-Prüfung.",
};

export const decisionTemplates: DecisionTemplate[] = [
  {
    name: "Strategische Ausrichtung",
    category: "strategic",
    priority: "critical",
    version: 1,
    description: "Grundlegende strategische Richtungsentscheidung mit langfristiger Auswirkung auf das Unternehmen.",
    whenToUse: "Für Markteintritte, Pivots, M&A oder langfristige Weichenstellungen.",
    iconColor: "text-primary",
    defaultDurationDays: 30,
    requiredFields: [contextField, alternativesField, riskField, budgetField, timelineField, stakeholdersField],
    approvalSteps: [
      { role: "decision_maker", label: "Fachverantwortlicher", required: true },
      { role: "reviewer", label: "Strategie-Review", required: true },
      { role: "admin", label: "Vorstandsfreigabe", required: true },
    ],
    governanceNotes: "Strategische Entscheidungen erfordern vollständige Dokumentation aller Alternativen und eine dreistufige Freigabe.",
    conditionalRules: [
      {
        when: "stakeholder_count",
        operator: "greater_than",
        value: "5",
        addFields: [alignmentField],
        governanceHint: "Bei mehr als 5 Stakeholdern ist ein expliziter Alignment-Plan erforderlich.",
      },
      largeBudgetRule,
    ],
  },
  {
    name: "Budgetfreigabe",
    category: "budget",
    priority: "high",
    version: 1,
    description: "Freigabe eines Budgets für ein Projekt oder eine Abteilung. Finanzielle Prüfung erforderlich.",
    whenToUse: "Für Projektbudgets, Investitionen oder Kostenstellen-Freigaben.",
    iconColor: "text-success",
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
    conditionalRules: [
      largeBudgetRule,
      highPriorityRiskRule,
    ],
  },
  {
    name: "Personalentscheidung",
    category: "hr",
    priority: "high",
    version: 1,
    description: "Entscheidung zu Einstellung, Beförderung oder Teamstruktur.",
    whenToUse: "Für Hiring, Beförderungen, Umstrukturierungen oder Trennungen.",
    iconColor: "text-warning",
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
    conditionalRules: [
      criticalApprovalRule,
      {
        when: "budget_impact",
        operator: "greater_than",
        value: "80000",
        addApprovalSteps: [{ role: "admin", label: "GF-Freigabe (> 80.000€/Jahr)", required: true }],
        governanceHint: "Personalkosten > 80.000€/Jahr erfordern Geschäftsführungsfreigabe.",
      },
    ],
  },
  {
    name: "Technische Architektur",
    category: "technical",
    priority: "medium",
    version: 1,
    description: "Technologische Entscheidung zu Architektur, Stack oder Infrastruktur.",
    whenToUse: "Für Stack-Wechsel, neue Services, Infrastruktur oder Architektur-Änderungen.",
    iconColor: "text-accent-foreground",
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
    conditionalRules: [
      highPriorityRiskRule,
      criticalApprovalRule,
      {
        when: "budget_impact",
        operator: "greater_than",
        value: "30000",
        addFields: [executiveJustification],
        governanceHint: "Tech-Investitionen > 30.000€ erfordern eine Executive Justification.",
      },
    ],
  },
  {
    name: "Operative Prozessänderung",
    category: "operational",
    priority: "medium",
    version: 1,
    description: "Anpassung eines operativen Prozesses zur Effizienzsteigerung.",
    whenToUse: "Für Workflow-Optimierungen, Tool-Einführungen oder Prozess-Standardisierungen.",
    iconColor: "text-muted-foreground",
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
    conditionalRules: [
      highPriorityRiskRule,
      {
        when: "stakeholder_count",
        operator: "greater_than",
        value: "3",
        addFields: [alignmentField],
        governanceHint: "Bei >3 betroffenen Stakeholdern ist ein Alignment-Plan empfohlen.",
      },
    ],
  },
  {
    name: "Marketing-Kampagne",
    category: "marketing",
    priority: "medium",
    version: 1,
    description: "Planung und Freigabe einer Marketing-Kampagne oder -Initiative.",
    whenToUse: "Für Kampagnen, Launch-Events, Rebrandings oder Partner-Kooperationen.",
    iconColor: "text-destructive",
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
    conditionalRules: [
      largeBudgetRule,
      highPriorityRiskRule,
    ],
  },
];

/**
 * Evaluate conditional rules against the current form state.
 * Returns extra fields, approval steps, and governance hints that should be applied.
 */
export function evaluateConditionalRules(
  rules: ConditionalRule[] | undefined,
  formState: {
    priority: string;
    category: string;
    extraFields: Record<string, string>;
  }
): {
  extraFields: RequiredField[];
  extraApprovalSteps: ApprovalStep[];
  governanceHints: string[];
} {
  const result = {
    extraFields: [] as RequiredField[],
    extraApprovalSteps: [] as ApprovalStep[],
    governanceHints: [] as string[],
  };

  if (!rules) return result;

  // Count stakeholders from the stakeholders field (comma-separated)
  const stakeholderText = formState.extraFields["stakeholders"] || "";
  const stakeholderCount = stakeholderText.trim()
    ? stakeholderText.split(",").filter(s => s.trim()).length
    : 0;

  // Parse budget from budget_impact field
  const budgetText = formState.extraFields["budget_impact"] || "";
  const budgetValue = parseFloat(budgetText.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;

  for (const rule of rules) {
    let fieldValue: string | number;

    switch (rule.when) {
      case "priority":
        fieldValue = formState.priority;
        break;
      case "category":
        fieldValue = formState.category;
        break;
      case "budget_impact":
        fieldValue = budgetValue;
        break;
      case "stakeholder_count":
        fieldValue = stakeholderCount;
        break;
      default:
        continue;
    }

    let conditionMet = false;

    switch (rule.operator) {
      case "equals":
        conditionMet = String(fieldValue) === String(rule.value);
        break;
      case "not_equals":
        conditionMet = String(fieldValue) !== String(rule.value);
        break;
      case "greater_than":
        conditionMet = Number(fieldValue) > Number(rule.value);
        break;
      case "in":
        conditionMet = Array.isArray(rule.value) && rule.value.includes(String(fieldValue));
        break;
    }

    if (conditionMet) {
      if (rule.addFields) {
        // Avoid duplicates by key
        for (const f of rule.addFields) {
          if (!result.extraFields.some(ef => ef.key === f.key)) {
            result.extraFields.push(f);
          }
        }
      }
      if (rule.addApprovalSteps) {
        for (const s of rule.addApprovalSteps) {
          if (!result.extraApprovalSteps.some(es => es.label === s.label)) {
            result.extraApprovalSteps.push(s);
          }
        }
      }
      if (rule.governanceHint) {
        if (!result.governanceHints.includes(rule.governanceHint)) {
          result.governanceHints.push(rule.governanceHint);
        }
      }
    }
  }

  return result;
}

export const getTemplateByCategory = (category: string): DecisionTemplate | undefined =>
  decisionTemplates.find(t => t.category === category);
