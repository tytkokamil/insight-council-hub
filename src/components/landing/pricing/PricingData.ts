import { Check, X, type LucideIcon } from "lucide-react";

export const ANNUAL_DISCOUNT_MONTHS = 2; // 2 months free = 20% Rabatt

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
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Für Einzelpersonen und erste Einblicke.",
    features: [
      { label: "1 Nutzer", included: true },
      { label: "Decision Hub", included: true },
      { label: "Einfacher Audit Trail (30 Tage)", included: true },
      { label: "Community Support", included: true },
      { label: "Keine KI-Funktionen", included: false },
      { label: "SLA & Eskalationen", included: false },
      { label: "Review-Workflows", included: false },
      { label: "Intelligence Center", included: false },
      { label: "Kalender mit Heat Overlay", included: false },
    ],
    cta: "Kostenlos starten",
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: "Ideal zum Kennenlernen der Plattform.",
  },
  {
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "Für kleine Teams bis 10 Personen.",
    minSeats: 1,
    features: [
      { label: "Bis zu 10 Nutzer", included: true },
      { label: "Vollständiger Decision Hub", included: true },
      { label: "SLA & Eskalation (3 Regeln)", included: true },
      { label: "5 Automation Rules", included: true },
      { label: "KI Copilot (100 Analysen/Mo)", included: true, ai: true },
      { label: "Analytics Hub + PDF Export", included: true },
      { label: "Audit Trail (1 Jahr)", included: true },
      { label: "Team-Chat", included: true },
      { label: "E-Mail Support", included: true },
      { label: "Intelligence Center", included: false },
      { label: "Risk Register (5×5 Heatmap)", included: false },
    ],
    cta: "Starter testen",
    ctaLink: "/auth",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: "Struktur und Kontrolle für kleine Teams.",
  },
  {
    name: "Professional",
    monthlyPrice: 149,
    annualPrice: 119,
    description: "Für wachsende Unternehmen mit bis zu 50 Nutzern.",
    minSeats: 10,
    features: [
      { label: "Alles aus Starter, plus:", included: true },
      { label: "Bis zu 50 Nutzer", included: true },
      { label: "Unbegrenzte Entscheidungen", included: true },
      { label: "Cost-of-Delay (Custom Faktoren)", included: true },
      { label: "Risk Register (5×5 Heatmap)", included: true },
      { label: "Compliance Export (PDF/CSV/API)", included: true },
      { label: "Intelligence Center", included: true, ai: true },
      { label: "KI Copilot unbegrenzt", included: true, ai: true },
      { label: "CEO / Daily Briefing", included: true, ai: true },
      { label: "Scenario Engine", included: true, ai: true },
      { label: "Decision Room (Meeting Mode)", included: true },
      { label: "SLA Garantie (99,5% Uptime)", included: true },
      { label: "Priority E-Mail Support", included: true },
    ],
    cta: "Professional starten",
    ctaLink: "/auth",
    ctaVariant: "hero",
    highlighted: true,
    idealFor: "Der beliebteste Plan — volle Power für wachsende Unternehmen.",
  },
  {
    name: "Enterprise",
    monthlyPrice: 499,
    annualPrice: null,
    description: "Für Organisationen mit erweiterten Governance- und Compliance-Anforderungen.",
    features: [
      { label: "Alles aus Professional, plus:", included: true },
      { label: "Unbegrenzte Nutzer", included: true },
      { label: "SSO / SAML 2.0 (Okta, Azure AD)", included: true },
      { label: "Eigener LLM-Endpoint", included: true, ai: true },
      { label: "Audit Trail unbegrenzt + API", included: true },
      { label: "DSGVO Full-Layer", included: true },
      { label: "Eigenes Branding", included: true },
      { label: "Dedicated Customer Success", included: true },
      { label: "Onboarding-Workshop", included: true },
      { label: "Security Review & Pen Test", included: true },
      { label: "SLA Garantie (99,9% Uptime)", included: true },
    ],
    cta: "Vertrieb kontaktieren",
    ctaLink: "mailto:sales@decivio.com",
    ctaVariant: "outline",
    highlighted: false,
    idealFor: "Enterprise-Ready Governance mit individuellem Pricing.",
  },
];

export const trustItems = [
  "DSGVO-konform",
  "ISO 27001 ready",
  "SOC 2 ready",
  "Row-Level Security",
  "EU-Hosting (Frankfurt)",
];

export const valueStats = [
  { metric: "€4.2M", description: "Cost-of-Delay vermieden" },
  { metric: "98%", description: "SLA-Bestehensquote" },
  { metric: "40%", description: "schnellere Entscheidungen" },
  { metric: "2.585%", description: "ROI im ersten Monat" },
];

export const faqItems = [
  {
    question: "Wie funktioniert die Abrechnung?",
    answer: "Monatlich oder jährlich. Jährliche Zahlung gibt 20% Rabatt — das entspricht 2 Monaten gratis.",
  },
  {
    question: "Brauche ich eine Kreditkarte für den Free-Plan?",
    answer: "Nein. Der Free-Plan ist komplett ohne Kreditkarte nutzbar.",
  },
  {
    question: "Können wir jederzeit upgraden?",
    answer: "Jederzeit. Die Abrechnung wird anteilig angepasst.",
  },
  {
    question: "Was passiert nach den 100 KI-Analysen im Starter?",
    answer: "Das Kontingent erneuert sich monatlich. Optional kann der KI-Analyse Boost (€29/Mo für +500 Analysen) zugebucht werden.",
  },
  {
    question: "Wie sicher sind unsere Daten?",
    answer: "Row-Level Security, verschlüsselte Speicherung (AES-256), MFA, EU-Hosting und revisionssicherer Audit Trail — NIS2/DSGVO-konform.",
  },
  {
    question: "Gibt es Add-ons?",
    answer: "Ja — Extra Nutzer-Blöcke (€19/10 User), KI-Analyse Boost (€29/Mo), Extended Audit Trail (€19/Mo), Decision Room Pro (€39/Mo), Benchmarking (€49/Mo), Custom Branding (€29/Mo) und API-Zugang (€99/Mo).",
  },
];
