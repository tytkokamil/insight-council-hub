import { Factory, Car, Pill, Monitor, HardHat, Landmark, HeartPulse, Zap, ShoppingCart, Shield, Truck, UtensilsCrossed, Heart, GraduationCap, Building2, LucideIcon } from "lucide-react";

export interface IndustryLanding {
  slug: string;
  name: string;
  icon: LucideIcon;
  color: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  useCases: { title: string; description: string }[];
  compliance: string[];
  stats: { value: string; label: string }[];
  testimonial: { name: string; role: string; quote: string };
  metaTitle: string;
  metaDescription: string;
}

export const industryLandings: IndustryLanding[] = [
  {
    slug: "maschinenbau",
    name: "Maschinenbau",
    icon: Factory,
    color: "hsl(220 45% 50%)",
    headline: "Decivio für den Maschinenbau",
    subheadline: "IATF 16949 und ISO 9001 Entscheidungs-Compliance. Automatisch.",
    painPoints: [
      "Engineering Change Orders bleiben wochenlang liegen",
      "Investitionsfreigaben brauchen 5+ E-Mail-Runden",
      "Audit-Nachweise kosten Stunden manueller Dokumentation",
    ],
    useCases: [
      { title: "Engineering Change Orders", description: "ECOs mit kryptographischem Audit Trail und automatischer Genehmigungs-Kette." },
      { title: "Investitionsfreigabe", description: "Maschineninvestitionen mit Cost-of-Delay Berechnung und Review-Workflow." },
      { title: "Projektmeilenstein-Freigaben", description: "Gate-Reviews mit automatischer SLA-Überwachung und Eskalation." },
      { title: "Lieferantenqualifikation", description: "Strukturierte Bewertung und Freigabe neuer Lieferanten." },
    ],
    compliance: ["ISO 9001", "ISO 13849", "VDI 2221", "IATF 16949"],
    stats: [
      { value: "73%", label: "Schnellere ECO-Freigaben" },
      { value: "< 3 Min", label: "Bis zur ersten Entscheidung" },
      { value: "100%", label: "Audit-Trail-Abdeckung" },
    ],
    testimonial: {
      name: "Michael H.",
      role: "Produktionsleiter, Maschinenbau GmbH (85 MA)",
      quote: "Wir haben nicht gewusst wie viel unsere wochenlangen Freigabeprozesse wirklich kosten. Decivio hat das sichtbar gemacht.",
    },
    metaTitle: "Decivio für Maschinenbau — Decision Governance mit ISO 9001",
    metaDescription: "Entscheidungs-Governance für den Maschinenbau. ECOs, Investitionsfreigaben und Audit Trail — ISO 9001 und IATF 16949 konform.",
  },
  {
    slug: "automotive",
    name: "Automotive",
    icon: Car,
    color: "hsl(200 45% 50%)",
    headline: "Decivio für die Automotive-Branche",
    subheadline: "PPAP, 8D und APQP Dokumentation mit einem Klick.",
    painPoints: [
      "PPAP-Dokumentation verstreut über E-Mails und Ordner",
      "8D-Reports ohne nachvollziehbare Entscheidungshistorie",
      "IATF-Audits erfordern wochenlange Vorbereitung",
    ],
    useCases: [
      { title: "PPAP-Dokumentation", description: "Strukturierte PPAP-Level-Verwaltung mit automatischer Compliance-Prüfung." },
      { title: "8D-Problemlösung", description: "8D-Reports mit integriertem Review-Workflow und Maßnahmen-Tracking." },
      { title: "APQP-Prozesse", description: "Gate-Reviews für Produktentstehungsprozesse mit SLA-Überwachung." },
      { title: "FMEA-Management", description: "Risikobewertungen mit KI-gestützter Analyse und Audit Trail." },
    ],
    compliance: ["IATF 16949", "VDA 6.3", "ISO 9001"],
    stats: [
      { value: "68%", label: "Schnellere Genehmigungen" },
      { value: "340k€", label: "Ø CoD-Einsparung/Jahr" },
      { value: "99%", label: "Audit-Bestehensquote" },
    ],
    testimonial: {
      name: "Sandra K.",
      role: "Qualitätsmanagerin, Automotive Zulieferer (240 MA)",
      quote: "Die IATF-Compliance war unser Hauptgrund für Decivio. Jetzt haben wir den Audit Trail der uns der Prüfer abverlangt hat.",
    },
    metaTitle: "Decivio für Automotive — IATF 16949 Decision Governance",
    metaDescription: "Decision Governance für Automotive-Zulieferer. PPAP, 8D, APQP — IATF 16949 konform mit kryptographischem Audit Trail.",
  },
  {
    slug: "pharma-medizin",
    name: "Pharma & Life Sciences",
    icon: Pill,
    color: "hsl(280 40% 55%)",
    headline: "Decivio für Pharma & Life Sciences",
    subheadline: "GMP-konforme Entscheidungsdokumentation. FDA-ready.",
    painPoints: [
      "Change-Control-Prozesse dauern Wochen statt Tage",
      "CAPA-Maßnahmen ohne nachvollziehbare Freigabekette",
      "GMP-Audits erfordern manuelle Zusammenstellung der Evidenz",
    ],
    useCases: [
      { title: "Change-Control-Prozesse", description: "Strukturierte Change Requests mit mehrstufiger Genehmigung und Impact Assessment." },
      { title: "CAPA-Management", description: "Corrective & Preventive Actions mit automatischer Eskalation bei SLA-Verletzung." },
      { title: "Batch-Record-Freigaben", description: "Chargenfreigaben mit kryptographischer Signatur und Vier-Augen-Prinzip." },
      { title: "Deviation-Handling", description: "Abweichungs-Management mit Risikobewertung und Maßnahmen-Tracking." },
    ],
    compliance: ["GMP", "FDA 21 CFR Part 11", "EU-GMP", "ICH Q10"],
    stats: [
      { value: "82%", label: "Schnellere Change Controls" },
      { value: "100%", label: "Audit-Trail-Abdeckung" },
      { value: "< 24h", label: "Ø Deviation-Response" },
    ],
    testimonial: {
      name: "Thomas B.",
      role: "QA Director, Pharmaunternehmen (60 MA)",
      quote: "One-Click Approval hat unsere Review-Zeit von 5 Tagen auf 18 Stunden reduziert. Der ROI war nach 3 Wochen sichtbar.",
    },
    metaTitle: "Decivio für Pharma — GMP-konforme Decision Governance",
    metaDescription: "Decision Governance für Pharma & Life Sciences. Change Control, CAPA, Deviation Handling — GMP und FDA 21 CFR Part 11 konform.",
  },
  {
    slug: "it-software",
    name: "IT & Software",
    icon: Monitor,
    color: "hsl(250 40% 55%)",
    headline: "Decivio für IT & Software",
    subheadline: "Architecture Decision Records, Security Reviews und Release-Governance.",
    painPoints: [
      "Technische Entscheidungen gehen in Slack und Confluence unter",
      "Security-Reviews blockieren Releases ohne klare Timelines",
      "NIS2-Compliance erfordert nachweisbare Entscheidungsprozesse",
    ],
    useCases: [
      { title: "Architecture Decision Records", description: "ADRs mit strukturiertem Review-Workflow und Versionshistorie." },
      { title: "Release-Management", description: "Go/No-Go-Entscheidungen mit automatischer SLA-Überwachung." },
      { title: "Security-Reviews", description: "Security-Assessments mit Risikobewertung und Audit Trail." },
      { title: "RFC-Prozesse", description: "Request for Change mit Impact-Analyse und mehrstufiger Genehmigung." },
    ],
    compliance: ["NIS2", "ISO 27001", "BSI IT-Grundschutz", "SOC 2"],
    stats: [
      { value: "65%", label: "Schnellere Release-Freigaben" },
      { value: "3x", label: "Mehr dokumentierte ADRs" },
      { value: "100%", label: "NIS2-Audit-Readiness" },
    ],
    testimonial: {
      name: "Jan M.",
      role: "CTO, SaaS-Unternehmen (45 MA)",
      quote: "Unsere ADRs waren vorher in Confluence verstreut. Jetzt haben wir einen zentralen Ort mit klaren Review-Flows.",
    },
    metaTitle: "Decivio für IT & Software — NIS2-konforme Decision Governance",
    metaDescription: "Decision Governance für IT-Teams. ADRs, Security Reviews, Release-Management — NIS2 und ISO 27001 konform.",
  },
  {
    slug: "bau-industrie",
    name: "Bau & Industrie",
    icon: HardHat,
    color: "hsl(30 50% 50%)",
    headline: "Decivio für Bau & Industrie",
    subheadline: "Nachtragsmanagement, Subunternehmer-Freigaben und Bauabnahmen digital.",
    painPoints: [
      "Nachtragsentscheidungen verzögern Bauprojekte um Wochen",
      "Subunternehmer-Freigaben per E-Mail sind nicht nachvollziehbar",
      "Bauabnahmen ohne strukturierten Entscheidungsprozess",
    ],
    useCases: [
      { title: "Nachtragsmanagement", description: "Nachtragsentscheidungen mit Cost-of-Delay Berechnung und Freigabekette." },
      { title: "Subunternehmer-Freigaben", description: "Qualifikationsprüfung und Freigabe mit mehrstufigem Review." },
      { title: "Bauabnahmen", description: "Strukturierte Abnahmeentscheidungen mit Fotodokumentation." },
      { title: "Materialfreigaben", description: "Materialwechsel mit Impact-Analyse und automatischer Benachrichtigung." },
    ],
    compliance: ["VOB/B", "HOAI", "VgV"],
    stats: [
      { value: "45%", label: "Schnellere Nachtragsfreigaben" },
      { value: "< 48h", label: "Ø Subunternehmer-Freigabe" },
      { value: "100%", label: "Dokumentierte Abnahmen" },
    ],
    testimonial: {
      name: "Andreas W.",
      role: "Projektleiter, Bauunternehmen (120 MA)",
      quote: "Nachtragsentscheidungen haben unser Projekt früher wochenlang blockiert. Mit Decivio sehen wir sofort was das kostet.",
    },
    metaTitle: "Decivio für Bau & Industrie — Decision Governance für Bauprojekte",
    metaDescription: "Decision Governance für die Baubranche. Nachtragsmanagement, Subunternehmer-Freigaben, Bauabnahmen — VOB/B konform.",
  },
];

export function getIndustryLanding(slug: string): IndustryLanding | undefined {
  return industryLandings.find(i => i.slug === slug);
}
