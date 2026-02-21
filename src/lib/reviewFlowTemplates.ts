export interface ReviewFlowStep {
  role: string;
  label: string;
  required: boolean;
}

export interface ReviewFlowTemplate {
  id: string;
  name: string;
  description: string;
  icon: "zap" | "shield" | "crown";
  color: string;
  steps: ReviewFlowStep[];
  estimatedDays: number;
}

export const reviewFlowTemplates: ReviewFlowTemplate[] = [
  {
    id: "fast_track",
    name: "Fast Track",
    description: "Schnellfreigabe mit nur einem Reviewer. Ideal für operative und risikoarme Entscheidungen.",
    icon: "zap",
    color: "text-success",
    steps: [
      { role: "reviewer", label: "Fachlicher Review", required: true },
    ],
    estimatedDays: 2,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Dreistufiger Prozess mit Fach-Review, Team-Lead und optionaler Freigabe. Für die meisten Entscheidungen.",
    icon: "shield",
    color: "text-primary",
    steps: [
      { role: "reviewer", label: "Fachlicher Review", required: true },
      { role: "lead", label: "Team-Lead Freigabe", required: true },
      { role: "reviewer", label: "Qualitäts-Check", required: false },
    ],
    estimatedDays: 5,
  },
  {
    id: "strategic",
    name: "Strategic",
    description: "Vollständiger Freigabeprozess mit Executive Approval. Für strategische und budgetrelevante Entscheidungen.",
    icon: "crown",
    color: "text-warning",
    steps: [
      { role: "reviewer", label: "Fachlicher Review", required: true },
      { role: "lead", label: "Abteilungsleitung", required: true },
      { role: "admin", label: "Executive Review", required: true },
      { role: "admin", label: "Vorstandsfreigabe", required: true },
    ],
    estimatedDays: 14,
  },
];

export const getReviewFlowById = (id: string): ReviewFlowTemplate | undefined =>
  reviewFlowTemplates.find(t => t.id === id);

/** Suggest a review flow based on category and priority */
export const suggestReviewFlow = (category: string, priority: string): string => {
  if (priority === "critical" || category === "strategic") return "strategic";
  if (priority === "high" || category === "budget" || category === "hr") return "standard";
  return "fast_track";
};
