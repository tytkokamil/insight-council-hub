import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Valid categories: strategic, budget, hr, technical, operational, marketing

const teamTemplates = [
  {
    name: "Produktteam",
    description: "Cross-funktionales Produktteam für Plattform-Entwicklung",
    hourly_rate: 85,
    decisions: [
      { title: "Cloud-Migration der Legacy-Systeme", description: "Migration der On-Premise-Infrastruktur zu Cloud-nativem Setup.", status: "review", priority: "critical", category: "technical", dueInDays: -2, createdDaysAgo: 14, escalation_level: 1, ai_risk_score: 72, ai_impact_score: 85, cost_per_day: 2500 },
      { title: "Senior Developer Hiring Pipeline", description: "Recruiting-Strategie: Interne Beförderung vs. Headhunter vs. Freelancer.", status: "proposed", priority: "high", category: "hr", dueInDays: 22, createdDaysAgo: 5, ai_risk_score: 40, ai_impact_score: 70, cost_per_day: 1200 },
      { title: "Vendor Lock-in Bewertung AWS", description: "Risikobewertung AWS-Abhängigkeit. Multi-Cloud vs. Single-Cloud.", status: "review", priority: "medium", category: "strategic", dueInDays: 6, createdDaysAgo: 8, ai_risk_score: 55, ai_impact_score: 65 },
      { title: "Feature-Flag-Architektur", description: "Schrittweise Feature-Releases mit Flag-basierter Steuerung.", status: "draft", priority: "medium", category: "technical", dueInDays: 28, createdDaysAgo: 1, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "A/B Testing Framework", description: "Systematische A/B Tests für Conversion-Optimierung.", status: "approved", priority: "medium", category: "marketing", dueInDays: 11, createdDaysAgo: 6, ai_risk_score: 15, ai_impact_score: 55 },
      { title: "Backup & Disaster Recovery Plan", description: "RTO/RPO Definition und automatisierte Backup-Strategie.", status: "approved", priority: "critical", category: "operational", dueInDays: 3, createdDaysAgo: 8, ai_risk_score: 60, ai_impact_score: 85 },
      { title: "Security Penetration Test", description: "Externer Pentest durch zertifizierten Anbieter.", status: "review", priority: "critical", category: "operational", dueInDays: -3, createdDaysAgo: 10, ai_risk_score: 55, ai_impact_score: 85 },
      { title: "Technical Debt Sprint", description: "Dedizierter Sprint für kritische technische Schulden.", status: "review", priority: "high", category: "technical", dueInDays: 16, createdDaysAgo: 9, ai_risk_score: 30, ai_impact_score: 60, cost_per_day: 1800 },
      { title: "API Rate-Limiting Strategie", description: "Rate-Limiting für öffentliche API-Endpunkte.", status: "proposed", priority: "high", category: "technical", dueInDays: 9, createdDaysAgo: 4, ai_risk_score: 30, ai_impact_score: 65 },
      { title: "Infrastruktur-Budget Q3 Planung", description: "Budget-Allokation für Cloud-Services und Tooling.", status: "draft", priority: "high", category: "budget", dueInDays: 25, createdDaysAgo: 2, ai_risk_score: 25, ai_impact_score: 60 },
      { title: "Monitoring & Alerting Stack", description: "Grafana Cloud für Observability einführen.", status: "approved", priority: "high", category: "technical", dueInDays: 1, createdDaysAgo: 7, ai_risk_score: 15, ai_impact_score: 60 },
      { title: "CI/CD Pipeline Modernisierung", description: "Migration von Jenkins zu GitHub Actions.", status: "implemented", priority: "high", category: "technical", createdDaysAgo: 35, implementedDaysAgo: 15, ai_risk_score: 20, ai_impact_score: 60, outcome_type: "successful", outcome: "Deploy-Zeit von 45min auf 8min.", actual_impact_score: 70 },
      { title: "Onboarding-Flow Redesign", description: "Guided Tour und Checkliste für neue Nutzer.", status: "implemented", priority: "high", category: "marketing", createdDaysAgo: 25, implementedDaysAgo: 10, ai_risk_score: 15, ai_impact_score: 70, outcome_type: "successful", outcome: "Activation Rate von 35% auf 58%.", actual_impact_score: 80 },
      { title: "Design System v2", description: "Token-basiertes Theming und Komponenten-Bibliothek.", status: "implemented", priority: "medium", category: "technical", createdDaysAgo: 50, implementedDaysAgo: 22, ai_risk_score: 10, ai_impact_score: 55, outcome_type: "successful", outcome: "UI-Konsistenz +40%. Dev-Zeit -25%.", actual_impact_score: 60 },
      { title: "Incident Response Playbook", description: "Standardisierte Prozesse für Incidents.", status: "implemented", priority: "critical", category: "operational", createdDaysAgo: 42, implementedDaysAgo: 20, ai_risk_score: 40, ai_impact_score: 80, outcome_type: "successful", outcome: "MTTR bei Incidents von 4h auf 30min.", actual_impact_score: 75 },
    ],
    tasks: [
      { title: "Cloud-Provider Vergleichsmatrix", status: "in_progress", priority: "high", category: "strategic", dueInDays: 3 },
      { title: "Migrationstimeline erstellen", status: "open", priority: "critical", category: "technical", dueInDays: 7 },
      { title: "Stellenausschreibung Senior Dev", status: "open", priority: "medium", category: "hr", dueInDays: 10 },
      { title: "Pentest-Anbieter evaluieren", status: "in_progress", priority: "critical", category: "operational", dueInDays: 3 },
      { title: "Backup-Skripte automatisieren", status: "open", priority: "high", category: "operational", dueInDays: 6 },
      { title: "GitHub Actions Pipeline", status: "done", priority: "high", category: "technical", completedDaysAgo: 16 },
      { title: "Feature-Flag SDK integrieren", status: "open", priority: "medium", category: "technical", dueInDays: 12 },
      { title: "Grafana Dashboards aufsetzen", status: "in_progress", priority: "high", category: "technical", dueInDays: 5 },
      { title: "Budget-Forecast Q3 vorbereiten", status: "open", priority: "high", category: "budget", dueInDays: 14 },
      { title: "Produkt-Demo für Leads erstellen", status: "in_progress", priority: "medium", category: "marketing", dueInDays: 8 },
    ],
    risks: [
      { title: "Datenverlust bei Cloud-Migration", description: "Partieller Datenverlust während Migrationsphase.", likelihood: 3, impact: 5, risk_score: 15, status: "open", mitigation_plan: "Inkrementelle Migration mit Rollback und 3x Backup." },
      { title: "Key-Person Dependency Engineering", description: "Kritisches Wissen bei 2 Senior Engineers.", likelihood: 4, impact: 4, risk_score: 16, status: "open", mitigation_plan: "Knowledge-Sharing und Dokumentation." },
      { title: "API-Downtime bei Migration", description: "Unerwartete Downtime während Cloud-Umzug.", likelihood: 2, impact: 5, risk_score: 10, status: "open", mitigation_plan: "Blue-Green Deployment nutzen." },
      { title: "Supply Chain Angriff auf Dependencies", description: "Kompromittierte NPM-Packages in der Build-Pipeline.", likelihood: 5, impact: 5, risk_score: 25, status: "open", mitigation_plan: "Lockfile Pinning, Snyk Scanning, Private Registry." },
      { title: "Skalierungsprobleme bei Lastspitzen", description: "Datenbank-Engpässe bei >10k gleichzeitigen Nutzern.", likelihood: 3, impact: 4, risk_score: 12, status: "mitigating", mitigation_plan: "Read-Replicas, Connection Pooling, Auto-Scaling." },
      { title: "Lizenzkosten-Explosion SaaS-Tools", description: "Unkontrollierte Lizenzkosten durch dezentrale Beschaffung.", likelihood: 2, impact: 2, risk_score: 4, status: "open", mitigation_plan: "Zentrales Tool-Management und jährliche Reviews." },
    ],
    goals: [
      { title: "Ø Entscheidungszeit unter 5 Tage", description: "Draft → Implementierung.", goal_type: "kpi", target_value: 5, current_value: 7.2, unit: "Tage", quarter: "Q2" },
      { title: "Deployment Frequency >3x/Woche", description: "Häufigere, kleinere Releases.", goal_type: "kpi", target_value: 3, current_value: 1.8, unit: "pro Woche", quarter: "Q3" },
      { title: "Zero Critical Incidents", description: "Keine Severity-1 Incidents im Quartal.", goal_type: "okr", target_value: 0, current_value: 1, unit: "Incidents", quarter: "Q2" },
      { title: "Test Coverage >80%", description: "Unit- und Integration-Tests.", goal_type: "kpi", target_value: 80, current_value: 62, unit: "%", quarter: "Q3" },
    ],
  },
  {
    name: "Marketing & Growth",
    description: "Wachstumsstrategie, Kampagnen und Content",
    hourly_rate: 70,
    decisions: [
      { title: "Q2 Marketing-Budget Allokation", description: "Verteilung €180k Q2-Budget auf Performance Marketing, Content und Events.", status: "approved", priority: "high", category: "budget", dueInDays: 2, createdDaysAgo: 10, ai_risk_score: 25, ai_impact_score: 60, cost_per_day: 800 },
      { title: "Partner-Programm Konzept", description: "Reseller- und Integrations-Partnerprogramm.", status: "proposed", priority: "high", category: "strategic", dueInDays: 30, createdDaysAgo: 4, ai_risk_score: 35, ai_impact_score: 75 },
      { title: "Content-Strategie Q2/Q3", description: "Blog, Whitepaper und Case Studies.", status: "approved", priority: "medium", category: "marketing", dueInDays: 7, createdDaysAgo: 7, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "Social Media Rebranding", description: "Einheitliches Brand-Design über alle Kanäle.", status: "draft", priority: "medium", category: "marketing", dueInDays: 19, createdDaysAgo: 3, ai_risk_score: 10, ai_impact_score: 45 },
      { title: "Influencer-Kooperationsprogramm", description: "Zusammenarbeit mit B2B-Influencern für Lead-Generierung.", status: "proposed", priority: "medium", category: "marketing", dueInDays: 13, createdDaysAgo: 5, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "Webinar-Serie für Enterprise Leads", description: "Monatliche Webinare mit Branchenexperten.", status: "review", priority: "high", category: "marketing", dueInDays: 4, createdDaysAgo: 6, ai_risk_score: 15, ai_impact_score: 60 },
      { title: "SEO-Strategie Überarbeitung", description: "Keyword-Analyse und Content-Optimierung für organisches Wachstum.", status: "draft", priority: "high", category: "marketing", dueInDays: 24, createdDaysAgo: 3, ai_risk_score: 10, ai_impact_score: 55 },
      { title: "Product-Led Growth Strategie", description: "Freemium-Modell und In-App-Upselling.", status: "review", priority: "critical", category: "strategic", dueInDays: 10, createdDaysAgo: 8, ai_risk_score: 40, ai_impact_score: 85 },
      { title: "Referral-Programm launchen", description: "Empfehlungsprogramm mit Credits für bestehende Kunden.", status: "proposed", priority: "medium", category: "marketing", dueInDays: 17, createdDaysAgo: 4, ai_risk_score: 15, ai_impact_score: 50 },
      { title: "Event-Sponsoring Strategie H2", description: "Sponsoring auf 4 relevanten Branchenkonferenzen.", status: "draft", priority: "medium", category: "budget", dueInDays: 27, createdDaysAgo: 2, ai_risk_score: 20, ai_impact_score: 45 },
      { title: "Customer Success Team Aufbau", description: "Dediziertes CS-Team mit 3 FTEs.", status: "implemented", priority: "high", category: "hr", createdDaysAgo: 45, implementedDaysAgo: 12, ai_risk_score: 35, ai_impact_score: 80, outcome_type: "successful", outcome: "Churn-Rate -22%. NPS von 42 auf 67.", actual_impact_score: 85 },
      { title: "Brand Awareness Kampagne Q1", description: "Multimediale Kampagne mit Video und LinkedIn Ads.", status: "implemented", priority: "high", category: "marketing", createdDaysAgo: 60, implementedDaysAgo: 30, ai_risk_score: 15, ai_impact_score: 55, outcome_type: "successful", outcome: "Brand Awareness +45% in Zielgruppe.", actual_impact_score: 60 },
      { title: "Pricing-Seite A/B Test", description: "Neue Pricing-Darstellung vs. bestehende.", status: "implemented", priority: "medium", category: "marketing", createdDaysAgo: 35, implementedDaysAgo: 18, ai_risk_score: 10, ai_impact_score: 40, outcome_type: "successful", outcome: "Conversion +18% auf Pricing-Seite.", actual_impact_score: 50 },
    ],
    tasks: [
      { title: "Content-Kalender Q2", status: "open", priority: "medium", category: "marketing", dueInDays: 8 },
      { title: "Competitor Feature Matrix", status: "done", priority: "medium", category: "strategic", completedDaysAgo: 3 },
      { title: "Landing Page für Partner-Programm", status: "open", priority: "high", category: "marketing", dueInDays: 14 },
      { title: "Case Study Kunde X schreiben", status: "in_progress", priority: "medium", category: "marketing", dueInDays: 5 },
      { title: "Webinar-Einladungen versenden", status: "open", priority: "high", category: "marketing", dueInDays: 6 },
      { title: "SEO Keyword-Analyse durchführen", status: "in_progress", priority: "high", category: "marketing", dueInDays: 7 },
      { title: "Referral-Programm Mockups", status: "open", priority: "medium", category: "marketing", dueInDays: 12 },
    ],
    risks: [
      { title: "Churn bei Pricing-Umstellung", description: "Kunden könnten bei Preiserhöhung abwandern.", likelihood: 3, impact: 3, risk_score: 9, status: "mitigated", mitigation_plan: "Bestandskundenpreise 12 Monate grandfathered." },
      { title: "Content-Qualität bei Skalierung", description: "Mehr Content = Qualitätsrisiko.", likelihood: 3, impact: 3, risk_score: 9, status: "open", mitigation_plan: "Editorial Guidelines und Review-Prozess." },
      { title: "Markenreputation durch KI-Content", description: "KI-generierter Content könnte als minderwertig wahrgenommen werden.", likelihood: 4, impact: 3, risk_score: 12, status: "open", mitigation_plan: "Human Review für alle KI-Inhalte, Brand Voice Guidelines." },
      { title: "Wettbewerber-Preiskampf", description: "Aggressive Preissenkung durch etablierte Wettbewerber.", likelihood: 2, impact: 4, risk_score: 8, status: "open", mitigation_plan: "Value-Differenzierung statt Preiskampf." },
    ],
    goals: [
      { title: "NPS über 60", description: "Net Promoter Score Enterprise.", goal_type: "kpi", target_value: 60, current_value: 67, unit: "Score", quarter: "Q2" },
      { title: "MQL +50% YoY", description: "Marketing Qualified Leads steigern.", goal_type: "okr", target_value: 150, current_value: 95, unit: "MQLs/Monat", quarter: "Q4" },
      { title: "Brand Awareness +30%", description: "Gestützte Markenbekanntheit in Zielgruppe.", goal_type: "okr", target_value: 30, current_value: 18, unit: "%", quarter: "Q3" },
      { title: "CAC unter €200", description: "Customer Acquisition Cost optimieren.", goal_type: "kpi", target_value: 200, current_value: 245, unit: "€", quarter: "Q3" },
    ],
  },
  {
    name: "Finance & Operations",
    description: "Budgetplanung, Controlling und operative Prozesse",
    hourly_rate: 95,
    decisions: [
      { title: "Datenschutz-Folgenabschätzung KI-Module", description: "DPIA für alle KI-gestützten Features gemäß Art. 35 DSGVO.", status: "proposed", priority: "critical", category: "operational", dueInDays: 5, createdDaysAgo: 3, ai_risk_score: 60, ai_impact_score: 80 },
      { title: "Remote Work Policy Update", description: "3 Tage Home-Office, 2 Tage Office. Auswirkung auf Produktivität.", status: "draft", priority: "medium", category: "operational", dueInDays: 18, createdDaysAgo: 2, ai_risk_score: 15, ai_impact_score: 45 },
      { title: "SOC 2 Type II Zertifizierung", description: "Zertifizierung für Enterprise-Kunden.", status: "proposed", priority: "critical", category: "operational", dueInDays: 26, createdDaysAgo: 6, ai_risk_score: 45, ai_impact_score: 90 },
      { title: "SLA-Framework für Enterprise", description: "SLAs mit Uptime-Garantien und Response-Times.", status: "review", priority: "high", category: "operational", dueInDays: 2, createdDaysAgo: 7, ai_risk_score: 30, ai_impact_score: 75 },
      { title: "Kosten-Optimierung Cloud-Infrastruktur", description: "Reserved Instances, Spot-Instances und Auto-Scaling.", status: "approved", priority: "high", category: "budget", dueInDays: 8, createdDaysAgo: 7, ai_risk_score: 20, ai_impact_score: 65 },
      { title: "Versicherungsportfolio Review", description: "D&O, Cyber und Haftpflicht prüfen.", status: "draft", priority: "medium", category: "budget", dueInDays: 23, createdDaysAgo: 3, ai_risk_score: 25, ai_impact_score: 50 },
      { title: "Reisekostenrichtlinie Überarbeitung", description: "Neue Richtlinie für Dienstreisen und Remote-Meetings.", status: "proposed", priority: "low", category: "operational", dueInDays: 14, createdDaysAgo: 5, ai_risk_score: 5, ai_impact_score: 25 },
      { title: "Jahresabschluss-Vorbereitung", description: "Prüfungsvorbereitung und Dokumentation.", status: "review", priority: "critical", category: "budget", dueInDays: -1, createdDaysAgo: 10, ai_risk_score: 35, ai_impact_score: 70 },
      { title: "Vendor Management Prozess", description: "Standardisierter Bewertungs- und Onboarding-Prozess für Lieferanten.", status: "draft", priority: "medium", category: "operational", dueInDays: 12, createdDaysAgo: 4, ai_risk_score: 15, ai_impact_score: 45 },
      { title: "Budgetplanung 2027", description: "Strategische Budgetplanung für nächstes Geschäftsjahr.", status: "proposed", priority: "high", category: "budget", dueInDays: 29, createdDaysAgo: 3, ai_risk_score: 30, ai_impact_score: 80 },
      { title: "Pricing-Modell für Enterprise", description: "Tiered-Pricing mit Volumenrabatten.", status: "implemented", priority: "critical", category: "strategic", createdDaysAgo: 30, implementedDaysAgo: 3, ai_risk_score: 55, ai_impact_score: 95, outcome_type: "successful", outcome: "Revenue pro Enterprise-Kunde +32%.", actual_impact_score: 90 },
      { title: "DSGVO-Audit Q1", description: "Vollständiges Audit aller Datenverarbeitungsprozesse.", status: "implemented", priority: "critical", category: "operational", createdDaysAgo: 40, implementedDaysAgo: 18, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Audit bestanden. 3 Minor Findings behoben.", actual_impact_score: 80 },
      { title: "OKR Framework Einführung", description: "Objectives & Key Results für alle Teams.", status: "implemented", priority: "high", category: "strategic", createdDaysAgo: 55, implementedDaysAgo: 25, ai_risk_score: 25, ai_impact_score: 70, outcome_type: "successful", outcome: "Cross-Team Projekte +35%.", actual_impact_score: 65 },
      { title: "Compliance-Audit ISO 27001", description: "ISO 27001 Zertifizierung erreicht.", status: "implemented", priority: "critical", category: "operational", createdDaysAgo: 120, implementedDaysAgo: 92, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Zertifizierung erhalten.", actual_impact_score: 85 },
    ],
    tasks: [
      { title: "Budget-Proposal Q2 finalisieren", status: "done", priority: "high", category: "budget", dueInDays: -1, completedDaysAgo: 1 },
      { title: "Pricing-Tabelle für Sales", status: "done", priority: "high", category: "strategic", completedDaysAgo: 5 },
      { title: "SLA-Dokument für Enterprise", status: "in_progress", priority: "high", category: "operational", dueInDays: 5 },
      { title: "Cost-Optimization Report AWS", status: "open", priority: "high", category: "budget", dueInDays: 10 },
      { title: "DPIA Dokumentation erstellen", status: "open", priority: "critical", category: "operational", dueInDays: 4 },
      { title: "SOC 2 Gap Assessment", status: "in_progress", priority: "critical", category: "operational", dueInDays: 8 },
      { title: "Vendor-Bewertungsmatrix erstellen", status: "open", priority: "medium", category: "operational", dueInDays: 15 },
    ],
    risks: [
      { title: "Compliance-Verzögerung NIS2", description: "Deadline droht zu reißen.", likelihood: 3, impact: 5, risk_score: 15, status: "open", mitigation_plan: "Prio-1 Compliance-Sprint starten." },
      { title: "Budget-Überschreitung Cloud", description: "Cloud-Kosten übersteigen Planung um >20%.", likelihood: 3, impact: 3, risk_score: 9, status: "mitigating", mitigation_plan: "Wöchentliches Budget-Monitoring." },
      { title: "Steuerfrist versäumt", description: "Verspätete Steuererklärung wegen fehlender Belege.", likelihood: 2, impact: 4, risk_score: 8, status: "open", mitigation_plan: "Automatisierte Belegerfassung." },
      { title: "Datenschutzverstoß Mitarbeiterdaten", description: "Ungeschützte Personalakten in SharePoint.", likelihood: 2, impact: 5, risk_score: 10, status: "mitigating", mitigation_plan: "Zugriffskontrolle und Verschlüsselung." },
    ],
    goals: [
      { title: "Betriebskosten-Senkung um 15%", description: "Operative Effizienzsteigerung.", goal_type: "kpi", target_value: 15, current_value: 8, unit: "%", quarter: "Q3" },
      { title: "SOC 2 Zertifizierung erreichen", description: "Type II Zertifizierung.", goal_type: "milestone", target_value: 1, current_value: 0, unit: "Zertifizierung", quarter: "Q4" },
      { title: "MTTR unter 2 Stunden", description: "Mean Time To Resolve für operative Probleme.", goal_type: "kpi", target_value: 2, current_value: 3.5, unit: "Stunden", quarter: "Q2" },
    ],
  },
];

/* ── Quick-start demo data: 3 focused decisions for first-time users ── */
const quickStartDecisions = [
  {
    title: "Lieferantenwechsel: Hydraulikkomponenten Serie 7",
    description: "Aktueller Lieferant (Müller GmbH) hat Lieferzeit von 4 auf 9 Wochen erhöht. Alternativangebot von Weber Hydraulik liegt vor. Entscheidung blockiert Produktionsplanung Q2.",
    category: "operational",
    priority: "high",
    status: "open",
    cost_per_day: 1200,
    createdDaysAgo: 3,
    dueInDays: 2,
    options: [
      { label: "Weber Hydraulik", description: "Lieferzeit 3 Wo, +8% Preis" },
      { label: "Müller GmbH behalten", description: "Eskalation vereinbaren" },
      { label: "Dual-Sourcing", description: "Beide Lieferanten parallel" },
    ],
    review: { status: "pending" },
  },
  {
    title: "Investitionsfreigabe: CNC-Fräsmaschine Halle 3",
    description: "Ersatz der DMG Mori NLX 2500 (Baujahr 2009). Angebot liegt vor: €187.000 netto. ROI-Berechnung Controlling: Break-even nach 2,4 Jahren.",
    category: "budget",
    priority: "critical",
    status: "review",
    cost_per_day: 800,
    createdDaysAgo: 6,
    dueInDays: 1,
    options: [],
    review: { status: "approved", comment: "ROI-Berechnung plausibel. Finanzierung über KfW-Programm empfohlen.", reviewedDaysAgo: 1 },
  },
  {
    title: "Homeoffice-Regelung 2025 — Betriebsvereinbarung",
    description: "Neue Regelung: max. 2 Tage/Woche Homeoffice. Betriebsrat zugestimmt.",
    category: "hr",
    priority: "medium",
    status: "approved",
    cost_per_day: 0,
    createdDaysAgo: 14,
    dueInDays: -7,
    options: [],
    review: null,
    implementedDaysAgo: 7,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mode } = await req.json().catch(() => ({ mode: undefined }));

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
    if (!profile?.org_id) {
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profile.org_id;

    // ── Quick-start mode: lightweight 3-decision seed for first login ──
    if (mode === "quickstart") {
      // Check if org already has decisions
      const { count } = await supabase.from("decisions").select("id", { count: "exact", head: true }).eq("org_id", orgId);
      if ((count ?? 0) > 0) {
        return new Response(JSON.stringify({ skipped: true, reason: "Org already has decisions" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = [];
      for (const tpl of quickStartDecisions) {
        const now = new Date();
        const createdAt = new Date(now.getTime() - tpl.createdDaysAgo * 86400000);
        const dueDate = new Date(now.getTime() + tpl.dueInDays * 86400000);
        const implementedAt = tpl.implementedDaysAgo ? new Date(now.getTime() - tpl.implementedDaysAgo * 86400000) : null;

        const { data: dec, error: decErr } = await supabase.from("decisions").insert({
          title: tpl.title,
          description: tpl.description,
          category: tpl.category,
          priority: tpl.priority,
          status: tpl.status,
          cost_per_day: tpl.cost_per_day,
          due_date: dueDate.toISOString().split("T")[0],
          created_at: createdAt.toISOString(),
          created_by: user.id,
          owner_id: user.id,
          org_id: orgId,
          options: tpl.options.length > 0 ? tpl.options : null,
          is_demo: true,
          implemented_at: implementedAt?.toISOString() || null,
        }).select("id").single();

        if (decErr || !dec) continue;
        results.push(dec.id);

        // Add review if specified
        if (tpl.review) {
          const reviewedAt = tpl.review.status !== "pending" && (tpl.review as any).reviewedDaysAgo
            ? new Date(now.getTime() - (tpl.review as any).reviewedDaysAgo * 86400000).toISOString()
            : null;
          await supabase.from("decision_reviews").insert({
            decision_id: dec.id,
            reviewer_id: user.id,
            status: tpl.review.status === "pending" ? "proposed" : tpl.review.status,
            feedback: (tpl.review as any).comment || null,
            reviewed_at: reviewedAt,
            step_order: 1,
          });
        }

        // Add audit log entry
        await supabase.from("audit_logs").insert({
          decision_id: dec.id,
          user_id: user.id,
          action: "decision.created",
          new_value: tpl.title,
          org_id: orgId,
        });
      }

      return new Response(JSON.stringify({ success: true, mode: "quickstart", decisions_created: results.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Full demo mode (existing behavior) ──
    // Delete existing demo data first
    await supabase.from("decisions").delete().eq("org_id", orgId).eq("is_demo", true);

    const now = new Date();

    function daysAgo(d: number) {
      return new Date(now.getTime() - d * 86400000).toISOString();
    }
    function daysFromNow(d: number) {
      return new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
    }

    const createdDecisions: string[] = [];
    const createdTasks: string[] = [];
    const createdRisks: string[] = [];

    for (const template of teamTemplates) {
      // Create team
      const { data: team } = await supabase.from("teams").insert({
        name: template.name,
        description: template.description,
        org_id: orgId,
        created_by: user.id,
        hourly_rate: template.hourly_rate,
      }).select("id").single();

      if (!team) continue;

      // Add user as team lead
      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "lead",
      });

      // Create decisions
      for (const dec of template.decisions) {
        const createdAt = daysAgo(dec.createdDaysAgo);
        const implementedAt = (dec as any).implementedDaysAgo ? daysAgo((dec as any).implementedDaysAgo) : null;
        const dueDate = (dec as any).dueInDays !== undefined ? daysFromNow((dec as any).dueInDays) : null;

        const statusMap: Record<string, string> = { review: "review", proposed: "proposed", draft: "draft", approved: "approved", implemented: "implemented" };

        const { data: newDec } = await supabase.from("decisions").insert({
          title: dec.title,
          description: dec.description,
          category: dec.category,
          priority: dec.priority,
          status: statusMap[dec.status] || dec.status,
          cost_per_day: dec.cost_per_day || null,
          due_date: dueDate,
          created_at: createdAt,
          created_by: user.id,
          owner_id: user.id,
          org_id: orgId,
          team_id: team.id,
          escalation_level: (dec as any).escalation_level || null,
          ai_risk_score: dec.ai_risk_score || null,
          ai_impact_score: dec.ai_impact_score || null,
          outcome_type: (dec as any).outcome_type || null,
          outcome: (dec as any).outcome || null,
          actual_impact_score: (dec as any).actual_impact_score || null,
          implemented_at: implementedAt,
          is_demo: true,
        }).select("id").single();

        if (newDec) {
          createdDecisions.push(newDec.id);
          // Audit log
          await supabase.from("audit_logs").insert({
            decision_id: newDec.id,
            user_id: user.id,
            action: "decision.created",
            new_value: dec.title,
            org_id: orgId,
          });
        }
      }

      // Create tasks
      for (const task of template.tasks) {
        const dueDate = (task as any).dueInDays !== undefined ? daysFromNow((task as any).dueInDays) : null;
        const completedAt = (task as any).completedDaysAgo ? daysAgo((task as any).completedDaysAgo) : null;

        const { data: newTask } = await supabase.from("tasks").insert({
          title: task.title,
          status: task.status,
          priority: task.priority,
          due_date: dueDate,
          created_by: user.id,
          assignee_id: user.id,
          org_id: orgId,
          team_id: team.id,
          completed_at: completedAt,
        }).select("id").single();

        if (newTask) createdTasks.push(newTask.id);
      }

      // Create risks
      for (const risk of template.risks) {
        const { data: newRisk } = await supabase.from("risks").insert({
          title: risk.title,
          description: risk.description,
          likelihood: risk.likelihood,
          impact: risk.impact,
          risk_score: risk.risk_score,
          status: risk.status,
          mitigation_plan: risk.mitigation_plan,
          created_by: user.id,
          org_id: orgId,
          team_id: team.id,
        }).select("id").single();

        if (newRisk) createdRisks.push(newRisk.id);
      }

      // Create goals
      for (const goal of template.goals) {
        await supabase.from("strategic_goals").insert({
          title: goal.title,
          description: goal.description,
          goal_type: goal.goal_type,
          target_value: goal.target_value,
          current_value: goal.current_value,
          unit: goal.unit,
          quarter: goal.quarter,
          org_id: orgId,
          created_by: user.id,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: "full",
      decisions: createdDecisions.length,
      tasks: createdTasks.length,
      risks: createdRisks.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
