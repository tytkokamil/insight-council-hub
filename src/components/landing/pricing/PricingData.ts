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
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: t("landing.pricing.freeDesc", { defaultValue: "Zum Kennenlernen. Keine Kreditkarte." }),
    features: [
      { label: t("landing.pricing.feat1user", { defaultValue: "1 Nutzer" }), included: true },
      { label: t("landing.pricing.feat10decisions", { defaultValue: "10 Entscheidungen" }), included: true },
      { label: t("landing.pricing.featAudit30", { defaultValue: "30 Tage Audit Trail" }), included: true },
      { label: t("landing.pricing.feat3templates", { defaultValue: "3 Standard-Templates" }), included: true },
      { label: t("landing.pricing.featBasicNotif", { defaultValue: "Basis-Benachrichtigungen" }), included: true },
      { label: t("landing.pricing.featNoTeam", { defaultValue: "Kein Team" }), included: false },
      { label: t("landing.pricing.featNoAiBrief", { defaultValue: "Kein KI Daily Brief" }), included: false },
      { label: t("landing.pricing.featNoIndustryTemplates", { defaultValue: "Keine Branchen-Templates" }), included: false },
      { label: t("landing.pricing.featNoCompliance", { defaultValue: "Keine Compliance" }), included: false },
    ],
    cta: t("landing.pricing.freeCta", { defaultValue: "Kostenlos starten" }),
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: t("landing.pricing.freeIdeal", { defaultValue: "Ideal für Einzelpersonen die Decivio testen wollen." }),
  },
  {
    name: "Starter",
    monthlyPrice: 59,
    annualPrice: 49,
    description: t("landing.pricing.starterDesc", { defaultValue: "Für kleine Teams die strukturiert arbeiten wollen." }),
    minSeats: 2,
    features: [
      { label: t("landing.pricing.feat8users", { defaultValue: "Bis 8 Nutzer" }), included: true },
      { label: t("landing.pricing.featUnlimitedDec", { defaultValue: "Unbegrenzte Entscheidungen" }), included: true },
      { label: t("landing.pricing.featAudit1y", { defaultValue: "1 Jahr Audit Trail" }), included: true },
      { label: t("landing.pricing.feat15templates", { defaultValue: "Alle 15 Branchen-Templates" }), included: true },
      { label: t("landing.pricing.featSla", { defaultValue: "SLA-System & Eskalationen" }), included: true },
      { label: t("landing.pricing.featApproval", { defaultValue: "One-Click Approval via E-Mail" }), included: true },
      { label: t("landing.pricing.featExtReview", { defaultValue: "Externe Reviewer" }), included: true },
      { label: t("landing.pricing.featRisk", { defaultValue: "Risk Register" }), included: true },
      { label: t("landing.pricing.featMeeting", { defaultValue: "Meeting Mode" }), included: true },
      { label: t("landing.pricing.feat5auto", { defaultValue: "5 Automation Rules" }), included: true },
      { label: t("landing.pricing.feat1compliance", { defaultValue: "1 Compliance Framework" }), included: true },
      { label: t("landing.pricing.featNoAiBrief", { defaultValue: "Kein KI Daily Brief" }), included: false },
      { label: t("landing.pricing.featNoAnalytics", { defaultValue: "Keine Analytics" }), included: false },
    ],
    cta: t("landing.pricing.starterCta", { defaultValue: "14 Tage kostenlos testen" }),
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: t("landing.pricing.starterIdeal", { defaultValue: "Ideal für kleine Teams (2–10 Personen)." }),
  },
  {
    name: "Professional",
    monthlyPrice: 149,
    annualPrice: 124,
    description: t("landing.pricing.proDesc", { defaultValue: "Vollständige Decision Intelligence für den Mittelstand." }),
    minSeats: 10,
    features: [
      { label: t("landing.pricing.feat25users", { defaultValue: "Bis 25 Nutzer" }), included: true },
      { label: t("landing.pricing.featUnlimitedAudit", { defaultValue: "Unlimitierter Audit Trail (SHA-256)" }), included: true },
      { label: t("landing.pricing.featAiBrief", { defaultValue: "KI Daily Brief täglich 07:30 Uhr" }), included: true, ai: true },
      { label: t("landing.pricing.featCodLive", { defaultValue: "Echtzeit Cost-of-Delay Zähler" }), included: true, ai: true },
      { label: t("landing.pricing.featAiCopilot", { defaultValue: "KI-Analyse & CoPilot" }), included: true, ai: true },
      { label: t("landing.pricing.featAnomaly", { defaultValue: "Anomalie-Erkennung (KI)" }), included: true, ai: true },
      { label: t("landing.pricing.featAnalytics9", { defaultValue: "Alle Analytics-Module (9)" }), included: true },
      { label: t("landing.pricing.featExecHub", { defaultValue: "Executive Hub & Board Reports" }), included: true },
      { label: t("landing.pricing.featAllCompliance", { defaultValue: "Alle Compliance Frameworks" }), included: true },
      { label: t("landing.pricing.featStrategy", { defaultValue: "Strategy Layer" }), included: true },
      { label: t("landing.pricing.featKnowledge", { defaultValue: "Knowledge Base & Lessons Learned" }), included: true },
      { label: t("landing.pricing.featWarRoom", { defaultValue: "War Room & What-If Simulator" }), included: true },
      { label: t("landing.pricing.featWebhooks", { defaultValue: "Webhooks & MS Teams" }), included: true },
      { label: t("landing.pricing.featUnlimitedAuto", { defaultValue: "Unbegrenzte Automation Rules" }), included: true },
      { label: t("landing.pricing.featPdfClean", { defaultValue: "PDF-Export ohne Branding" }), included: true },
    ],
    cta: t("landing.pricing.proCta", { defaultValue: "14 Tage kostenlos testen" }),
    ctaLink: "/auth",
    ctaVariant: "hero",
    highlighted: true,
    idealFor: t("landing.pricing.proIdeal", { defaultValue: "Ideal für wachsende Mittelständler (10–100 MA)." }),
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    description: t("landing.pricing.enterpriseDesc", { defaultValue: "Für Unternehmen mit komplexen Anforderungen und 25+ Nutzern." }),
    features: [
      { label: t("landing.pricing.featUnlimitedUsers", { defaultValue: "Unbegrenzte Nutzer" }), included: true },
      { label: t("landing.pricing.featAllPro", { defaultValue: "Alles aus Professional" }), included: true },
      { label: t("landing.pricing.featSso", { defaultValue: "SSO / SAML" }), included: true },
      { label: t("landing.pricing.featBranding", { defaultValue: "Custom Branding" }), included: true },
      { label: t("landing.pricing.featOnPremise", { defaultValue: "On-Premise Option" }), included: true },
      { label: t("landing.pricing.featCsm", { defaultValue: "Dedicated Success Manager" }), included: true },
      { label: t("landing.pricing.featSla999", { defaultValue: "SLA-Garantie 99,9%" }), included: true },
      { label: t("landing.pricing.featAdminConsole", { defaultValue: "Admin-Konsole & Feature Flags" }), included: true },
      { label: t("landing.pricing.featOnboarding", { defaultValue: "Onboarding-Workshop (remote)" }), included: true },
      { label: t("landing.pricing.featPrioritySupport", { defaultValue: "Prioritäts-Support (< 4h)" }), included: true },
    ],
    cta: t("landing.pricing.enterpriseCta", { defaultValue: "Gespräch vereinbaren" }),
    ctaLink: "mailto:hallo@decivio.com",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: t("landing.pricing.enterpriseIdeal", { defaultValue: "Ideal für Unternehmen mit 100+ Mitarbeitern." }),
  },
];

export const getTrustItems = (t: TFunction): string[] => [
  t("landing.pricing.trustGdpr", { defaultValue: "DSGVO-konform" }),
  t("landing.pricing.trustIso", { defaultValue: "ISO 27001 ready" }),
  t("landing.pricing.trustEu", { defaultValue: "Server in Deutschland" }),
];

export const getValueStats = (t: TFunction) => [
  { metric: "Mio. €", description: t("landing.pricing.valueCod", { defaultValue: "Vermiedene Verzögerungskosten" }) },
  { metric: ">95%", description: t("landing.pricing.valueSla", { defaultValue: "SLA-Einhaltung" }) },
  { metric: "bis zu 3×", description: t("landing.pricing.valueFaster", { defaultValue: "Schnellere Entscheidungen" }) },
  { metric: "schnell", description: t("landing.pricing.valueRoi", { defaultValue: "ROI nach < 2 Stunden" }) },
];

export const getFaqItems = (t: TFunction) => [
  { question: t("landing.pricing.faq1q", { defaultValue: "Kann ich den Plan jederzeit wechseln?" }), answer: t("landing.pricing.faq1a", { defaultValue: "Ja, du kannst jederzeit upgraden oder downgraden. Bei einem Upgrade wird der neue Plan sofort aktiv." }) },
  { question: t("landing.pricing.faq2q", { defaultValue: "Was passiert nach der Testphase?" }), answer: t("landing.pricing.faq2a", { defaultValue: "Nach 14 Tagen wirst du automatisch auf den Free-Plan zurückgestuft, wenn du nicht upgradest. Keine Kreditkarte nötig." }) },
  { question: t("landing.pricing.faq3q", { defaultValue: "Gibt es Rabatte für gemeinnützige Organisationen?" }), answer: t("landing.pricing.faq3a", { defaultValue: "Ja, kontaktiere uns für spezielle Konditionen für NGOs und Bildungseinrichtungen." }) },
  { question: t("landing.pricing.faq4q", { defaultValue: "Wo werden meine Daten gespeichert?" }), answer: t("landing.pricing.faq4a", { defaultValue: "Alle Daten werden auf Servern in Deutschland (EU) gespeichert und sind DSGVO-konform." }) },
  { question: t("landing.pricing.faq5q", { defaultValue: "Kann ich zusätzliche Nutzer einzeln hinzubuchen?" }), answer: t("landing.pricing.faq5a", { defaultValue: "Ja, zusätzliche Nutzer-Pakete (+5 Nutzer) sind als Add-On für €29/Monat verfügbar." }) },
  { question: t("landing.pricing.faq6q", { defaultValue: "Gibt es eine On-Premise Option?" }), answer: t("landing.pricing.faq6a", { defaultValue: "Ja, im Enterprise-Plan bieten wir eine On-Premise Option für Unternehmen mit besonderen Datenschutz-Anforderungen." }) },
];

// Keep backward-compatible exports
export const plans = [] as Plan[];
export const trustItems = [] as string[];
export const valueStats = [] as { metric: string; description: string }[];
export const faqItems = [] as { question: string; answer: string }[];
