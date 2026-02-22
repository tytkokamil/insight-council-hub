import { Check, X, type LucideIcon } from "lucide-react";

export const ANNUAL_DISCOUNT_MONTHS = 2; // 2 months free

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

export const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Für Einzelpersonen und kleine Teams, die Struktur testen möchten.",
    features: [
      { label: "Bis zu 3 Nutzer", included: true },
      { label: "Decision Lifecycle (Basic)", included: true },
      { label: "Status-Tracking (Draft → Approved → Implemented)", included: true },
      { label: "Standard-Templates", included: true },
      { label: "Einfaches Dashboard", included: true },
      { label: "Aufgaben-Board (Kanban)", included: true },
      { label: "CSV-Export", included: true },
      { label: "Community-Support", included: true },
      { label: "SLA & Eskalationen", included: false },
      { label: "Review-Workflows", included: false },
      { label: "KI-Analyse", included: false },
      { label: "Audit Trail", included: false },
      { label: "Executive Reporting", included: false },
    ],
    cta: "Kostenlos starten",
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: "Ideal zum Testen der Struktur.",
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "Für operative Teams, die Entscheidungen beschleunigen und kontrollieren wollen.",
    minSeats: 5,
    features: [
      { label: "Alles aus Starter, plus:", included: true },
      { label: "Mehrstufige Review-Workflows", included: true },
      { label: "SLA-Tracking & Eskalations-Engine", included: true },
      { label: "Audit Trail & Versionierung", included: true },
      { label: "KI-Risiko- & Impact-Score", included: true, ai: true },
      { label: "Decision Health Score", included: true },
      { label: "Slack Integration", included: true },
      { label: "Team Analytics", included: true },
      { label: "Risiko-Register", included: true },
      { label: "Entscheidungsgraph", included: true },
      { label: "Board Pack Export (PDF)", included: true },
      { label: "Prioritäts-Support", included: true },
    ],
    cta: "Pro testen",
    ctaLink: "/auth",
    ctaVariant: "hero",
    highlighted: true,
    idealFor: "Reduziert Blocker und Eskalationen messbar.",
  },
  {
    name: "Business",
    monthlyPrice: 89,
    annualPrice: 69,
    description: "Für Management & Portfolio-Steuerung.",
    minSeats: 10,
    features: [
      { label: "Alles aus Pro, plus:", included: true },
      { label: "Executive Hub (CEO Briefing)", included: true },
      { label: "Predictive Timeline", included: true },
      { label: "Opportunity Cost Engine", included: true },
      { label: "Portfolio- & Team-Benchmarking", included: true },
      { label: "Bottleneck Intelligence", included: true },
      { label: "Process Analytics", included: true },
      { label: "Automatisierungsregeln", included: true },
      { label: "Strategische Ziel-Verknüpfung", included: true },
      { label: "Szenario-Simulation (AI)", included: true, ai: true },
      { label: "Advanced Analytics", included: true },
      { label: "Dedizierter Support", included: true },
    ],
    cta: "Demo anfragen",
    ctaLink: "mailto:demo@decivio.com",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: "Macht Entscheidungsperformance messbar auf Management-Ebene.",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    description: "Für Organisationen mit erweiterten Governance- und Compliance-Anforderungen.",
    features: [
      { label: "Alles aus Business, plus:", included: true },
      { label: "SSO (SAML / LDAP)", included: true },
      { label: "Erweiterte Audit-Logs", included: true },
      { label: "Data Retention Policies", included: true },
      { label: "EU-Hosting-Option", included: true },
      { label: "API-Zugang", included: true },
      { label: "Custom Integrationen", included: true },
      { label: "Custom Branding", included: true },
      { label: "SLA-Vertrag", included: true },
      { label: "Dedicated Account Manager", included: true },
      { label: "Onboarding & Schulung", included: true },
    ],
    cta: "Vertrieb kontaktieren",
    ctaLink: "mailto:sales@decivio.com",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: "Enterprise-Ready Governance.",
  },
];

export const trustItems = [
  "DSGVO-konform",
  "Rollenbasierte Zugriffskontrolle",
  "Immutable Audit Logs",
  "Enterprise-Security-Architektur",
  "EU-Hosting verfügbar",
];

export const valueStats = [
  { metric: "30%", description: "schnellere Entscheidungen" },
  { metric: "40%", description: "weniger Eskalationen" },
  { metric: "SLA", description: "Verzögerungskosten vermeiden" },
  { metric: "100%", description: "Transparenz fürs Management" },
];

export const faqItems = [
  {
    question: "Wie funktioniert die Abrechnung?",
    answer: "Monatlich oder jährlich. Jährliche Zahlung beinhaltet 2 Monate kostenlos.",
  },
  {
    question: "Gibt es ein Seat-Minimum?",
    answer: "Ja. Pro ab 5 Nutzern, Business ab 10 Nutzern.",
  },
  {
    question: "Können wir upgraden?",
    answer: "Jederzeit. Abrechnung wird anteilig angepasst.",
  },
  {
    question: "Sind Integrationen enthalten?",
    answer: "Slack ist in Pro enthalten. Weitere Integrationen in Business und Enterprise.",
  },
  {
    question: "Wie sicher sind unsere Daten?",
    answer: "Rollenbasierte Zugriffskontrolle, Audit Trail, verschlüsselte Speicherung und optionale Data-Retention-Policies.",
  },
];
