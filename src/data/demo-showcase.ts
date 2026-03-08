/** Demo data for /demo — fully hardcoded, no DB calls */

export interface DemoReviewer {
  name: string;
  role: string;
  status: "approved" | "pending" | "rejected";
  avatar: string;
}

export interface DemoDecision {
  id: string;
  title: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "draft" | "review" | "approved" | "implemented";
  statusLabel: string;
  daysOpen: number;
  costPerDay: number;
  health: number;
  description: string;
  context: string;
  dueDate: string;
  dueStatus: string;
  owner: string;
  reviewers: DemoReviewer[];
  aiAnalysis: {
    riskScore: number;
    impactScore: number;
    summary: string;
    risks: string[];
    recommendations: string[];
    options: { title: string; pros: string[]; cons: string[]; roi: string }[];
  };
}

const today = new Date();
const addDays = (d: number) => {
  const r = new Date(today);
  r.setDate(r.getDate() + d);
  return r.toISOString().split("T")[0];
};

export const DEMO_DECISIONS: DemoDecision[] = [
  {
    id: "demo-cnc",
    title: "Investitionsfreigabe CNC-Fräsmaschine DMG MORI",
    category: "Investitionen",
    priority: "critical",
    status: "review",
    statusLabel: "In Prüfung",
    daysOpen: 14,
    costPerDay: 4071, // €28.500/7
    health: 35,
    description: "Die aktuelle 3-Achs-CNC hat eine Ausfallquote von 18% und verursacht Produktionsverzögerungen. DMG MORI bietet die DMU 50 3rd Generation zum Angebotspreis von €485.000.",
    context: "Angebot gültig bis Monatsende. 2 Wettbewerber haben bereits 5-Achs umgerüstet. Lieferzeit 12 Wochen.",
    dueDate: addDays(-2),
    dueStatus: "2 Tage überfällig",
    owner: "Thomas Müller",
    reviewers: [
      { name: "Dr. Stefan Weber", role: "Geschäftsführer", status: "approved", avatar: "SW" },
      { name: "Maria Schmidt", role: "Controlling", status: "approved", avatar: "MS" },
      { name: "Klaus Bauer", role: "Produktionsleiter", status: "pending", avatar: "KB" },
    ],
    aiAnalysis: {
      riskScore: 72,
      impactScore: 89,
      summary: "Hohe strategische Relevanz. Die Investition amortisiert sich bei aktueller Auslastung in 18 Monaten. Hauptrisiko: Qualifizierung der Bediener für 5-Achs-Bearbeitung.",
      risks: [
        "Umschulungsbedarf für 4 Maschinenbediener (ca. 3 Wochen)",
        "Produktionsausfall während Installation (geschätzt 5 Werktage)",
        "Angebotspreisbindung läuft aus — Preiserhöhung von 8% droht",
      ],
      recommendations: [
        "Sofortige Freigabe empfohlen — jeder Tag Verzögerung kostet €4.071",
        "Parallele Schulungsplanung mit DMG MORI Academy starten",
        "Leasingoption prüfen für Cashflow-Schonung (€8.200/Monat)",
      ],
      options: [
        { title: "Sofortkauf", pros: ["€485k Festpreis gesichert", "Lieferung in 12 Wochen"], cons: ["Hohe Einmalinvestition", "Liquiditätsbelastung"], roi: "ROI nach 18 Monaten" },
        { title: "Leasing über 48 Monate", pros: ["€8.200/Monat planbar", "Steuerliche Vorteile"], cons: ["Gesamtkosten €393.600 + Restwert", "Längere Bindung"], roi: "Cashflow-neutral ab Monat 3" },
        { title: "Gebrauchtmaschine prüfen", pros: ["30-40% günstiger", "Schnellere Verfügbarkeit"], cons: ["Keine Garantie", "Ältere Technologie", "Höhere Ausfallgefahr"], roi: "ROI nach 12 Monaten, höheres Risiko" },
      ],
    },
  },
  {
    id: "demo-hydraulik",
    title: "Lieferantenwechsel Hydraulik-Komponenten",
    category: "Lieferanten",
    priority: "high",
    status: "review",
    statusLabel: "In Prüfung",
    daysOpen: 8,
    costPerDay: 1763, // €12.340/7
    health: 52,
    description: "Aktueller Lieferant Bosch Rexroth hat 3x Lieferverzögerungen in Q2. Alternativangebot von Parker Hannifin liegt 12% günstiger.",
    context: "Rahmenvertrag läuft in 6 Wochen aus. Parker hat ISO 9001 und IATF 16949 Zertifizierung.",
    dueDate: addDays(0),
    dueStatus: "Heute fällig",
    owner: "Andrea Fischer",
    reviewers: [
      { name: "Thomas Müller", role: "Einkaufsleiter", status: "pending", avatar: "TM" },
      { name: "Klaus Bauer", role: "Produktionsleiter", status: "pending", avatar: "KB" },
    ],
    aiAnalysis: {
      riskScore: 58,
      impactScore: 74,
      summary: "Lieferantenwechsel birgt mittleres Risiko bei hohem Einsparpotenzial. Dual-Sourcing-Strategie empfohlen als Kompromiss.",
      risks: [
        "Qualitätsunterschiede möglich — Erstmusterprüfung erforderlich",
        "Umstellung der Bestellprozesse und Artikelnummern",
        "Know-how-Verlust bei Bosch Rexroth Speziallösungen",
      ],
      recommendations: [
        "Dual-Sourcing: 70% Parker / 30% Bosch Rexroth als Absicherung",
        "3-monatige Pilotphase mit Parker für unkritische Komponenten",
        "Verhandlungshebel: Parker-Angebot bei Bosch vorlegen",
      ],
      options: [
        { title: "Vollständiger Wechsel zu Parker", pros: ["12% Kostenersparnis", "Bessere Liefertreue"], cons: ["Abhängigkeit von neuem Lieferanten", "Umstellungsrisiko"], roi: "€87.000/Jahr Einsparung" },
        { title: "Dual-Sourcing Strategie", pros: ["Risikominimierung", "Verhandlungsposition gestärkt"], cons: ["Höherer Verwaltungsaufwand", "Geringere Einsparung (8%)"], roi: "€58.000/Jahr Einsparung" },
        { title: "Bei Bosch Rexroth bleiben + Nachverhandlung", pros: ["Kein Umstellungsrisiko", "Etablierte Beziehung"], cons: ["Max. 5% Nachlass realistisch", "Lieferprobleme bleiben"], roi: "€29.000/Jahr Einsparung" },
      ],
    },
  },
  {
    id: "demo-makeorbuy",
    title: "Make-or-Buy Steuerungsplatine Typ X47",
    category: "Produktion",
    priority: "high",
    status: "draft",
    statusLabel: "Entwurf",
    daysOpen: 5,
    costPerDay: 1271, // €8.900/7
    health: 68,
    description: "Aktuelle Fremdfertigung der Steuerungsplatine Typ X47 kostet €34/Stück. Eigenfertigung wäre bei Investition von €120.000 in SMD-Linie möglich.",
    context: "Jahresbedarf: 8.000 Stück. Break-Even bei Eigenfertigung: 4.200 Stück/Jahr.",
    dueDate: addDays(3),
    dueStatus: "In 3 Tagen",
    owner: "Klaus Bauer",
    reviewers: [],
    aiAnalysis: {
      riskScore: 45,
      impactScore: 67,
      summary: "Eigenfertigung lohnt sich bei aktuellem Bedarf. IP-Schutz und Flexibilität sprechen dafür. Anlaufrisiken sind beherrschbar.",
      risks: [
        "SMD-Bestückung erfordert 2 qualifizierte Elektroniker",
        "Anlaufschwierigkeiten: 3-6 Monate bis Soll-Qualität",
        "Investition von €120.000 bei unsicherer Marktentwicklung",
      ],
      recommendations: [
        "Hybridmodell: Eigenfertigung + Backup-Lieferant für Spitzen",
        "Pilotlauf mit 500 Stück vor Volumen-Commitment",
        "Förderprogramm 'Digitalisierung im Mittelstand' prüfen",
      ],
      options: [
        { title: "Eigenfertigung", pros: ["€14/Stück Ersparnis bei 8.000/Jahr", "IP-Schutz", "Schnellere Iterationen"], cons: ["€120.000 Investition", "2 neue Mitarbeiter nötig"], roi: "Break-Even nach 14 Monaten" },
        { title: "Fremdfertigung beibehalten", pros: ["Kein Investitionsrisiko", "Flexibel skalierbar"], cons: ["Hohe Stückkosten", "Abhängigkeit", "Lange Lieferzeiten"], roi: "Kein ROI — laufende Kosten €272.000/Jahr" },
        { title: "Hybrid: Eigenfertigung + Backup", pros: ["Risikominimierung", "Flexibilität"], cons: ["Doppelte Prozesse", "Höherer Overhead"], roi: "€89.000/Jahr Einsparung" },
      ],
    },
  },
  {
    id: "demo-cloud",
    title: "AWS zu Azure Cloud-Migration",
    category: "IT-Infrastruktur",
    priority: "medium",
    status: "review",
    statusLabel: "In Prüfung",
    daysOpen: 3,
    costPerDay: 600, // €4.200/7
    health: 75,
    description: "IT-Team empfiehlt Migration zu Azure wegen besserer Integration mit bestehender Microsoft 365 Infrastruktur.",
    context: "AWS-Vertrag läuft in 4 Monaten aus. Azure Enterprise Agreement mit 22% Rabatt verhandelt.",
    dueDate: addDays(7),
    dueStatus: "In 7 Tagen",
    owner: "Lisa Hoffmann",
    reviewers: [
      { name: "Thomas Müller", role: "Geschäftsführung", status: "pending", avatar: "TM" },
    ],
    aiAnalysis: {
      riskScore: 38,
      impactScore: 55,
      summary: "Migration ist strategisch sinnvoll. Risiko liegt hauptsächlich in der Umstellungsphase. Azure-Integration mit M365 bietet Effizienzgewinne.",
      risks: [
        "Migrationsaufwand: geschätzt 320 Personenstunden",
        "2-4 Wochen Parallelbetrieb beider Clouds",
        "Schulungsbedarf für DevOps-Team (Azure-Zertifizierung)",
      ],
      recommendations: [
        "Phasenweise Migration: erst Dev/Test, dann Produktion",
        "Azure Migrate Assessment Tool vorab nutzen",
        "Rückfall-Plan für kritische Workloads definieren",
      ],
      options: [
        { title: "Vollmigration zu Azure", pros: ["22% Kostenersparnis", "M365-Integration", "Einheitliches Ökosystem"], cons: ["Einmaliger Migrationsaufwand", "Vendor Lock-In"], roi: "€18.000/Jahr Einsparung" },
        { title: "Multi-Cloud beibehalten", pros: ["Kein Migrationsrisiko", "Flexibilität"], cons: ["Höhere Komplexität", "Doppelte Expertise nötig"], roi: "Kostenneutral" },
        { title: "AWS-Vertrag verlängern + optimieren", pros: ["Kein Umstellungsaufwand"], cons: ["Kein M365-Synergieeffekt", "Höhere Kosten"], roi: "-€12.000/Jahr (Mehrkosten)" },
      ],
    },
  },
  {
    id: "demo-erp",
    title: "Neues ERP-System Einführung",
    category: "IT-Infrastruktur",
    priority: "low",
    status: "draft",
    statusLabel: "Entwurf",
    daysOpen: 2,
    costPerDay: 300, // €2.100/7
    health: 82,
    description: "Das aktuelle ERP (SAP Business One) ist seit 8 Jahren im Einsatz. Evaluierung von SAP S/4HANA, Microsoft Dynamics 365 und Haufe X360.",
    context: "Wartungsvertrag wird teurer. Mitarbeiter beschweren sich über mangelnde Usability. Budget: max. €350.000.",
    dueDate: addDays(14),
    dueStatus: "In 14 Tagen",
    owner: "Thomas Müller",
    reviewers: [],
    aiAnalysis: {
      riskScore: 25,
      impactScore: 82,
      summary: "ERP-Wechsel ist ein langfristiges Strategieprojekt. Empfehlung: strukturierter Evaluierungsprozess mit Proof-of-Concept.",
      risks: [
        "Hohe Gesamtkosten (TCO über 5 Jahre: €500k-900k je nach System)",
        "Change Management: Widerstand bei Mitarbeitern",
        "Datenmigration: Historische Daten seit 8 Jahren überführen",
      ],
      recommendations: [
        "Anforderungskatalog mit allen Abteilungen erstellen",
        "3 Anbieter in 2-wöchigem PoC vergleichen",
        "Referenzkunden im Maschinenbau besuchen",
      ],
      options: [
        { title: "SAP S/4HANA", pros: ["Nahtlose Migration", "Branchenlösung Maschinenbau"], cons: ["Teuerste Option (€780k TCO)", "Komplexe Implementierung"], roi: "Strategisch — ROI nach 3+ Jahren" },
        { title: "Microsoft Dynamics 365", pros: ["M365-Integration", "Gute Usability", "Mittleres Budget"], cons: ["Weniger Branchenspezifisch"], roi: "ROI nach 2 Jahren" },
        { title: "Haufe X360", pros: ["Cloud-native", "Günstigste Option", "Gute Mittelstandslösung"], cons: ["Weniger bekannt", "Kleineres Ökosystem"], roi: "ROI nach 18 Monaten" },
      ],
    },
  },
];

export const DEMO_ORG = {
  name: "Mustermann Maschinenbau GmbH",
  industry: "Maschinenbau",
  employees: 47,
  plan: "professional",
};

export const DEMO_KPIS = {
  economicExposure: 56040,
  openDecisions: 5,
  slaCompliance: 73,
  pendingReviews: 12,
  avgDecisionDays: 8.4,
  qualityScore: 67,
  velocityScore: 58,
  overdueCount: 1,
  implementedThisMonth: 3,
};
