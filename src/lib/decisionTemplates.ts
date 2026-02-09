export interface DecisionTemplate {
  name: string;
  category: string;
  priority: string;
  description: string;
  defaultDurationDays: number;
}

export const decisionTemplates: DecisionTemplate[] = [
  {
    name: "Strategische Ausrichtung",
    category: "strategic",
    priority: "critical",
    description: "Grundlegende strategische Richtungsentscheidung mit langfristiger Auswirkung auf das Unternehmen.",
    defaultDurationDays: 30,
  },
  {
    name: "Budgetfreigabe",
    category: "budget",
    priority: "high",
    description: "Freigabe eines Budgets für ein Projekt oder eine Abteilung. Finanzielle Prüfung erforderlich.",
    defaultDurationDays: 14,
  },
  {
    name: "Personalentscheidung",
    category: "hr",
    priority: "high",
    description: "Entscheidung zu Einstellung, Beförderung oder Teamstruktur.",
    defaultDurationDays: 21,
  },
  {
    name: "Technische Architektur",
    category: "technical",
    priority: "medium",
    description: "Technologische Entscheidung zu Architektur, Stack oder Infrastruktur.",
    defaultDurationDays: 14,
  },
  {
    name: "Operative Prozessänderung",
    category: "operational",
    priority: "medium",
    description: "Anpassung eines operativen Prozesses zur Effizienzsteigerung.",
    defaultDurationDays: 7,
  },
  {
    name: "Marketing-Kampagne",
    category: "marketing",
    priority: "medium",
    description: "Planung und Freigabe einer Marketing-Kampagne oder -Initiative.",
    defaultDurationDays: 10,
  },
];
