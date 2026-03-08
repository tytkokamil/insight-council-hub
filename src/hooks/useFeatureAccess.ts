import { useCallback, useState } from "react";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";

/** Feature → minimum plan + specific messaging */
const FEATURE_CONFIG: Record<string, {
  minPlan: string;
  label: string;
  description: string;
  bullets: string[];
  price: string;
}> = {
  ai_analysis: {
    minPlan: "professional",
    label: "KI-Analyse & Copilot",
    description: "Lassen Sie KI Ihre Entscheidungen analysieren, Risiken erkennen und Handlungsoptionen generieren.",
    bullets: [
      "Automatische Risiko- & Impact-Bewertung",
      "3 konkrete Handlungsoptionen mit ROI-Schätzung",
      "KI-gestützter Entscheidungs-Copilot",
    ],
    price: "€149/Monat",
  },
  ai_brief: {
    minPlan: "professional",
    label: "KI Daily Brief",
    description: "Täglich automatisch die 3 kritischsten Entscheidungen in Ihrem Postfach.",
    bullets: [
      "Die 3 kritischsten offenen Entscheidungen",
      "Aktuelle Verzögerungskosten (Cost-of-Delay)",
      "Konkrete Handlungsempfehlung pro Entscheidung",
    ],
    price: "€149/Monat",
  },
  analytics: {
    minPlan: "professional",
    label: "Analytics Hub",
    description: "9 Analytics-Module für datengetriebene Entscheidungsoptimierung.",
    bullets: [
      "Health Heatmap & Friction Map",
      "Decision DNA & Pattern Engine",
      "Bottleneck Intelligence & Predictive Timeline",
    ],
    price: "€149/Monat",
  },
  executive: {
    minPlan: "professional",
    label: "Executive Hub",
    description: "Board-Ready KPIs und Portfolio-Übersicht für die Geschäftsleitung.",
    bullets: [
      "CEO Briefing auf Knopfdruck",
      "Portfolio Risk Overview",
      "Board-Ready Report Generator",
    ],
    price: "€149/Monat",
  },
  strategy: {
    minPlan: "professional",
    label: "Strategieebene",
    description: "Verknüpfen Sie Entscheidungen mit strategischen Zielen und OKRs.",
    bullets: [
      "Strategische Ziele & OKR-Tracking",
      "Entscheidungs-Strategie-Mapping",
      "Impact-Analyse auf Unternehmensebene",
    ],
    price: "€149/Monat",
  },
  live_cod: {
    minPlan: "professional",
    label: "Echtzeit Cost-of-Delay",
    description: "Sehen Sie in Echtzeit, was verzögerte Entscheidungen Ihr Unternehmen kosten.",
    bullets: [
      "Live-Ticker der täglichen Verzögerungskosten",
      "Kumulierte Kosten pro Team & Entscheidung",
      "ROI-Nachweis für schnelle Entscheidungen",
    ],
    price: "€149/Monat",
  },
  teams: {
    minPlan: "starter",
    label: "Teams & Zusammenarbeit",
    description: "Arbeiten Sie mit Ihrem Team zusammen an Entscheidungen.",
    bullets: [
      "Mehrere Teams erstellen & verwalten",
      "Team-Chat & @Mentions",
      "Rollenbasierte Zugriffssteuerung",
    ],
    price: "€59/Monat",
  },
  automations: {
    minPlan: "starter",
    label: "Automatisierungsregeln",
    description: "Automatisieren Sie wiederkehrende Entscheidungsprozesse mit WENN-DANN-Regeln.",
    bullets: [
      "Automatische Priorisierung & Eskalation",
      "SLA-Fristen automatisch setzen",
      "Benachrichtigungen bei Bedingungen",
    ],
    price: "€59/Monat",
  },
  sla: {
    minPlan: "starter",
    label: "SLA-System",
    description: "Definieren Sie Fristen für Entscheidungen und erhalten Sie automatische Warnungen.",
    bullets: [
      "Automatische Frist-Berechnung",
      "Eskalation bei Überschreitung",
      "SLA-Compliance Tracking",
    ],
    price: "€59/Monat",
  },
  compliance: {
    minPlan: "starter",
    label: "Compliance Frameworks",
    description: "Integrieren Sie regulatorische Anforderungen direkt in Ihren Entscheidungsprozess.",
    bullets: [
      "NIS2, ISO 9001, IATF, GMP, MaRisk",
      "Automatische Compliance-Termine",
      "Audit-Vorbereitung & Dokumentation",
    ],
    price: "€59/Monat",
  },
  webhooks: {
    minPlan: "professional",
    label: "Webhooks & API",
    description: "Integrieren Sie Decivio in Ihre bestehenden Tools und Workflows.",
    bullets: [
      "Outgoing Webhooks bei Statusänderungen",
      "API-Keys für externe Integration",
      "Microsoft Teams & Slack Notifications",
    ],
    price: "€149/Monat",
  },
  crypto_audit: {
    minPlan: "professional",
    label: "Kryptographischer Audit Trail",
    description: "SHA-256 Hash-Kette für manipulationssichere, lückenlose Nachweisführung.",
    bullets: [
      "Kryptographische Integritätsprüfung",
      "Unbegrenzte Aufbewahrung",
      "Audit-Export für externe Prüfer",
    ],
    price: "€149/Monat",
  },
  sso: {
    minPlan: "enterprise",
    label: "Single Sign-On (SSO)",
    description: "SAML/OIDC Single Sign-On für Ihr Unternehmen.",
    bullets: [
      "SAML 2.0 & OpenID Connect",
      "Active Directory Integration",
      "Zentrales Benutzer-Management",
    ],
    price: "Individuell",
  },
  custom_branding: {
    minPlan: "enterprise",
    label: "Custom Branding",
    description: "Passen Sie Decivio an Ihre Unternehmensmarke an.",
    bullets: [
      "Eigenes Logo & Farben",
      "White-Label PDF-Exporte",
      "Eigene E-Mail-Domain",
    ],
    price: "Individuell",
  },
};

interface FeatureAccessResult {
  /** Check if user can access a specific feature */
  canAccess: (feature: string) => boolean;
  /** Check if a resource limit is reached */
  isAtLimit: (resource: "decisions" | "users" | "teams" | "automations" | "compliance") => boolean;
  /** Get specific upgrade message for a feature */
  getLimitMessage: (feature: string) => string;
  /** Get feature config for modal display */
  getFeatureConfig: (feature: string) => typeof FEATURE_CONFIG[string] | null;
  /** Open the upgrade modal for a specific feature */
  openUpgradeModal: (feature: string) => void;
  /** Current modal state */
  upgradeModal: { open: boolean; feature: string } | null;
  /** Close upgrade modal */
  closeUpgradeModal: () => void;
  /** All limits from useFreemiumLimits */
  limits: ReturnType<typeof useFreemiumLimits>;
}

export const useFeatureAccess = (): FeatureAccessResult => {
  const limits = useFreemiumLimits();
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string } | null>(null);

  const canAccess = useCallback((feature: string): boolean => {
    const featureMap: Record<string, boolean> = {
      ai_analysis: limits.aiAnalysisAvailable,
      ai_brief: limits.aiBriefAvailable,
      analytics: limits.analyticsAvailable,
      executive: limits.executiveAvailable,
      strategy: limits.strategyAvailable,
      live_cod: limits.liveCodAvailable,
      teams: limits.teamsAvailable,
      automations: limits.automationAvailable,
      sla: limits.slaAvailable,
      webhooks: limits.webhooksAvailable,
      crypto_audit: limits.cryptoAuditAvailable,
      sso: limits.ssoAvailable,
      custom_branding: limits.customBrandingAvailable,
      compliance: (limits.maxComplianceFrameworks ?? 1) > 0,
    };
    return featureMap[feature] ?? true;
  }, [limits]);

  const isAtLimit = useCallback((resource: "decisions" | "users" | "teams" | "automations" | "compliance"): boolean => {
    switch (resource) {
      case "decisions":
        return limits.isDecisionLimitReached;
      case "users":
        return false; // checked server-side via RLS
      case "teams":
        return false; // checked server-side
      case "automations":
        return limits.maxAutomationRules !== null && limits.maxAutomationRules <= 0;
      case "compliance":
        return limits.maxComplianceFrameworks !== null && limits.maxComplianceFrameworks <= 0;
      default:
        return false;
    }
  }, [limits]);

  const getLimitMessage = useCallback((feature: string): string => {
    const config = FEATURE_CONFIG[feature];
    if (!config) return "Dieses Feature ist in Ihrem aktuellen Plan nicht enthalten. Upgraden Sie für vollen Zugang.";
    
    const planNames: Record<string, string> = {
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    };
    return `${config.label} ist ab dem ${planNames[config.minPlan] || config.minPlan}-Plan (${config.price}) verfügbar. ${config.description}`;
  }, []);

  const getFeatureConfig = useCallback((feature: string) => {
    return FEATURE_CONFIG[feature] || null;
  }, []);

  const openUpgradeModal = useCallback((feature: string) => {
    setUpgradeModal({ open: true, feature });
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModal(null);
  }, []);

  return {
    canAccess,
    isAtLimit,
    getLimitMessage,
    getFeatureConfig,
    openUpgradeModal,
    upgradeModal,
    closeUpgradeModal,
    limits,
  };
};

export { FEATURE_CONFIG };
