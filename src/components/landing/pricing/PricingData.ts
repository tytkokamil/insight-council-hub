import type { TFunction } from "i18next";

export const ANNUAL_DISCOUNT_MONTHS = 2;

export interface PlanFeature {
  label: string;
  included: boolean;
  ai?: boolean;
}

export interface Plan {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  minSeats?: number;
  features: PlanFeature[];
  cta: string;
  ctaLink: string;
  ctaVariant: "default" | "outline" | "hero";
  highlighted: boolean;
  idealFor: string;
}

export const getPlans = (t: TFunction): Plan[] => [
  {
    name: t("landing.pricing.freeName"),
    monthlyPrice: 0,
    annualPrice: 0,
    description: t("landing.pricing.freeDesc"),
    features: [
      { label: t("landing.pricing.feat1user"), included: true },
      { label: t("landing.pricing.featDecisionHub"), included: true },
      { label: t("landing.pricing.featAudit30"), included: true },
      { label: t("landing.pricing.featCommunity"), included: true },
      { label: t("landing.pricing.featNoAi"), included: false },
      { label: t("landing.pricing.featNoSla"), included: false },
      { label: t("landing.pricing.featNoReview"), included: false },
      { label: t("landing.pricing.featNoIntelligence"), included: false },
      { label: t("landing.pricing.featNoCalendar"), included: false },
    ],
    cta: t("landing.pricing.freeCta"),
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: t("landing.pricing.freeIdeal"),
  },
  {
    name: t("landing.pricing.starterName"),
    monthlyPrice: 49,
    annualPrice: 39,
    description: t("landing.pricing.starterDesc"),
    minSeats: 3,
    features: [
      { label: t("landing.pricing.feat10users"), included: true },
      { label: t("landing.pricing.featFullHub"), included: true },
      { label: t("landing.pricing.featSla3"), included: true },
      { label: t("landing.pricing.feat5auto"), included: true },
      { label: t("landing.pricing.featAi100"), included: true, ai: true },
      { label: t("landing.pricing.featAnalyticsPdf"), included: true },
      { label: t("landing.pricing.featAudit1y"), included: true },
      { label: t("landing.pricing.featTeamChat"), included: true },
      { label: t("landing.pricing.featEmailSupport"), included: true },
      { label: t("landing.pricing.featNoIntelligenceCenter"), included: false },
      { label: t("landing.pricing.featNoRisk"), included: false },
    ],
    cta: t("landing.pricing.starterCta"),
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: t("landing.pricing.starterIdeal"),
  },
  {
    name: t("landing.pricing.proName"),
    monthlyPrice: 149,
    annualPrice: 119,
    description: t("landing.pricing.proDesc"),
    minSeats: 10,
    features: [
      { label: t("landing.pricing.featAllStarter"), included: true },
      { label: t("landing.pricing.feat50users"), included: true },
      { label: t("landing.pricing.featUnlimited"), included: true },
      { label: t("landing.pricing.featCod"), included: true },
      { label: t("landing.pricing.featRisk"), included: true },
      { label: t("landing.pricing.featCompliance"), included: true },
      { label: t("landing.pricing.featIntelligence"), included: true, ai: true },
      { label: t("landing.pricing.featAiUnlimited"), included: true, ai: true },
      { label: t("landing.pricing.featCeoBriefing"), included: true, ai: true },
      { label: t("landing.pricing.featScenario"), included: true, ai: true },
      { label: t("landing.pricing.featPredictiveTimeline"), included: true, ai: true },
      { label: t("landing.pricing.featDecisionDna"), included: true, ai: true },
      { label: t("landing.pricing.featProcessHub"), included: true },
      { label: t("landing.pricing.featHealthHeatmap"), included: true },
      { label: t("landing.pricing.featStrategyLink"), included: true },
      { label: t("landing.pricing.featDecisionRoom"), included: true },
      { label: t("landing.pricing.featSla995"), included: true },
      { label: t("landing.pricing.featPrioritySupport"), included: true },
    ],
    cta: t("landing.pricing.proCta"),
    ctaLink: "/auth",
    ctaVariant: "hero",
    highlighted: true,
    idealFor: t("landing.pricing.proIdeal"),
  },
  {
    name: t("landing.pricing.enterpriseName"),
    monthlyPrice: 499,
    annualPrice: null,
    description: t("landing.pricing.enterpriseDesc"),
    features: [
      { label: t("landing.pricing.featAllPro"), included: true },
      { label: t("landing.pricing.featUnlimitedUsers"), included: true },
      { label: t("landing.pricing.featSso"), included: true },
      { label: t("landing.pricing.featOwnLlm"), included: true, ai: true },
      { label: t("landing.pricing.featDelegation"), included: true },
      { label: t("landing.pricing.featWarRoom"), included: true },
      { label: t("landing.pricing.featAuditUnlimited"), included: true },
      { label: t("landing.pricing.featGdprFull"), included: true },
      { label: t("landing.pricing.featBranding"), included: true },
      { label: t("landing.pricing.featCsm"), included: true },
      { label: t("landing.pricing.featOnboarding"), included: true },
      { label: t("landing.pricing.featSecReview"), included: true },
      { label: t("landing.pricing.featSla999"), included: true },
    ],
    cta: t("landing.pricing.enterpriseCta"),
    ctaLink: "mailto:sales@decivio.com",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: t("landing.pricing.enterpriseIdeal"),
  },
];

export const getTrustItems = (t: TFunction): string[] => [
  t("landing.pricing.trustGdpr"),
  t("landing.pricing.trustIso"),
  t("landing.pricing.trustSoc2"),
  t("landing.pricing.trustRls"),
  t("landing.pricing.trustEu"),
];

export const getValueStats = (t: TFunction) => [
  { metric: "Mio. €", description: t("landing.pricing.valueCod") },
  { metric: ">95%", description: t("landing.pricing.valueSla") },
  { metric: "bis zu 3×", description: t("landing.pricing.valueFaster") },
  { metric: "schnell", description: t("landing.pricing.valueRoi") },
];

export const getFaqItems = (t: TFunction) => [
  { question: t("landing.pricing.faq1q"), answer: t("landing.pricing.faq1a") },
  { question: t("landing.pricing.faq2q"), answer: t("landing.pricing.faq2a") },
  { question: t("landing.pricing.faq3q"), answer: t("landing.pricing.faq3a") },
  { question: t("landing.pricing.faq4q"), answer: t("landing.pricing.faq4a") },
  { question: t("landing.pricing.faq5q"), answer: t("landing.pricing.faq5a") },
  { question: t("landing.pricing.faq6q"), answer: t("landing.pricing.faq6a") },
];

// Keep backward-compatible exports for any external consumers
export const plans = [] as Plan[];
export const trustItems = [] as string[];
export const valueStats = [] as { metric: string; description: string }[];
export const faqItems = [] as { question: string; answer: string }[];
