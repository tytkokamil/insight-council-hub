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
      { title: "Compliance-Checkliste aktualisieren", status: "open", priority: "critical", category: "operational", dueInDays: 7 },
      { title: "Versicherungspolicen vergleichen", status: "open", priority: "medium", category: "budget", dueInDays: 20 },
      { title: "Reisekostenrichtlinie Entwurf", status: "open", priority: "low", category: "operational", dueInDays: 21 },
      { title: "Vendor-Bewertungsmatrix erstellen", status: "in_progress", priority: "medium", category: "operational", dueInDays: 14 },
    ],
    risks: [
      { title: "DSGVO-Verstoß durch KI-Module", description: "Unbeabsichtigte Verarbeitung personenbezogener Daten.", likelihood: 2, impact: 5, risk_score: 10, status: "open", mitigation_plan: "DPIA durchführen, Anonymisierung implementieren." },
      { title: "Budget-Überschreitung Cloud", description: "Unkontrolliertes Wachstum der Cloud-Kosten.", likelihood: 3, impact: 3, risk_score: 9, status: "open", mitigation_plan: "Budget-Alerts und monatliches Review." },
      { title: "Steuerliche Compliance Multi-Jurisdiktion", description: "Falsche Steuersätze in neuen Märkten.", likelihood: 4, impact: 5, risk_score: 20, status: "open", mitigation_plan: "Externe Steuerberatung pro Markt, automatisierte Tax Engine." },
      { title: "Währungsrisiko bei Internationalisierung", description: "Wechselkursschwankungen bei EUR/USD Umsatz.", likelihood: 1, impact: 2, risk_score: 2, status: "accepted", mitigation_plan: "Hedging ab >100k Fremdwährungsumsatz." },
    ],
    goals: [
      { title: "ARR auf €2M steigern", description: "Annual Recurring Revenue.", goal_type: "okr", target_value: 2000000, current_value: 1350000, unit: "€", quarter: "Q4" },
      { title: "Operative Marge >15%", description: "Operative Effizienz steigern.", goal_type: "kpi", target_value: 15, current_value: 11.5, unit: "%", quarter: "Q4" },
      { title: "Cash Runway >18 Monate", description: "Finanzielle Sicherheit gewährleisten.", goal_type: "kpi", target_value: 18, current_value: 14, unit: "Monate", quarter: "Q3" },
    ],
  },
  {
    name: "People & Culture",
    description: "HR, Employer Branding und Teamkultur",
    hourly_rate: 75,
    decisions: [
      { title: "Employer Branding Kampagne", description: "Arbeitgebermarke stärken über LinkedIn, Glassdoor und Karriereseite.", status: "approved", priority: "high", category: "marketing", dueInDays: 20, createdDaysAgo: 8, ai_risk_score: 15, ai_impact_score: 60 },
      { title: "Gehaltsstruktur-Überarbeitung", description: "Marktgerechte Vergütung mit transparenten Bändern.", status: "review", priority: "critical", category: "hr", dueInDays: 14, createdDaysAgo: 12, ai_risk_score: 45, ai_impact_score: 80 },
      { title: "Learning & Development Budget", description: "€2k pro Mitarbeiter für Weiterbildung.", status: "proposed", priority: "medium", category: "budget", dueInDays: 30, createdDaysAgo: 5, ai_risk_score: 10, ai_impact_score: 55 },
      { title: "Onboarding-Prozess Standardisierung", description: "30-60-90 Tage Plan für alle Neuzugänge.", status: "draft", priority: "high", category: "hr", dueInDays: 21, createdDaysAgo: 3, ai_risk_score: 10, ai_impact_score: 65 },
      { title: "Diversity & Inclusion Initiative", description: "Workshops, Mentoring und Recruiting-Ziele.", status: "approved", priority: "high", category: "hr", dueInDays: 45, createdDaysAgo: 15, ai_risk_score: 15, ai_impact_score: 70 },
      { title: "Performance Review Framework", description: "360-Grad-Feedback und OKR-basierte Reviews.", status: "review", priority: "high", category: "hr", dueInDays: 18, createdDaysAgo: 7, ai_risk_score: 20, ai_impact_score: 65 },
      { title: "Mental Health Programm", description: "Coaching-Zugang, flexible Arbeitszeiten, Wellness-Budget.", status: "proposed", priority: "medium", category: "hr", dueInDays: 28, createdDaysAgo: 4, ai_risk_score: 5, ai_impact_score: 50 },
      { title: "Team-Offsite Q3 Planung", description: "3-tägiges Offsite für Team Building und Strategie.", status: "draft", priority: "medium", category: "operational", dueInDays: 40, createdDaysAgo: 2, ai_risk_score: 5, ai_impact_score: 35 },
      { title: "Intern-Programm Sommer 2026", description: "Praktikantenprogramm für 5 Positionen.", status: "proposed", priority: "low", category: "hr", dueInDays: 35, createdDaysAgo: 6, ai_risk_score: 10, ai_impact_score: 40 },
      { title: "Exit-Interview Prozess", description: "Standardisierte Abgangsgespräche für Insights.", status: "draft", priority: "medium", category: "hr", dueInDays: 15, createdDaysAgo: 3, ai_risk_score: 5, ai_impact_score: 40 },
      { title: "Mitarbeiter-Zufriedenheitsumfrage Q1", description: "Anonyme Umfrage mit eNPS.", status: "implemented", priority: "high", category: "hr", createdDaysAgo: 30, implementedDaysAgo: 10, ai_risk_score: 5, ai_impact_score: 60, outcome_type: "successful", outcome: "eNPS von 28 auf 45 gestiegen.", actual_impact_score: 65 },
      { title: "Benefits-Paket Überarbeitung", description: "Neue Benefits: ÖPNV-Ticket, Sport-Zuschuss, Sabbatical.", status: "implemented", priority: "high", category: "hr", createdDaysAgo: 45, implementedDaysAgo: 20, ai_risk_score: 10, ai_impact_score: 55, outcome_type: "successful", outcome: "Bewerbungen +60%, Fluktuation -15%.", actual_impact_score: 65 },
      { title: "Remote-First Kultur etabliert", description: "Async-first Kommunikation und Tools.", status: "implemented", priority: "medium", category: "operational", createdDaysAgo: 55, implementedDaysAgo: 30, ai_risk_score: 20, ai_impact_score: 50, outcome_type: "successful", outcome: "Produktivität stabil, Zufriedenheit +25%.", actual_impact_score: 55 },
    ],
    tasks: [
      { title: "Gehaltsbänder recherchieren", status: "in_progress", priority: "high", category: "hr", dueInDays: 7 },
      { title: "Onboarding-Checkliste erstellen", status: "open", priority: "medium", category: "hr", dueInDays: 14 },
      { title: "D&I Workshop planen", status: "open", priority: "medium", category: "hr", dueInDays: 21 },
      { title: "Karriereseite aktualisieren", status: "in_progress", priority: "high", category: "marketing", dueInDays: 10 },
      { title: "Performance Review Template", status: "open", priority: "high", category: "hr", dueInDays: 12 },
      { title: "Mental Health Partner evaluieren", status: "open", priority: "medium", category: "hr", dueInDays: 20 },
      { title: "Offsite-Location recherchieren", status: "open", priority: "low", category: "operational", dueInDays: 30 },
    ],
    risks: [
      { title: "Fluktuation Schlüsselpositionen", description: "3 Senior-Rollen offen seit >6 Wochen.", likelihood: 3, impact: 4, risk_score: 12, status: "open", mitigation_plan: "Retention-Bonus und Entwicklungspläne." },
      { title: "Burnout-Risiko durch Wachstum", description: "Schnelles Wachstum ohne proportionale Einstellungen.", likelihood: 3, impact: 4, risk_score: 12, status: "open", mitigation_plan: "Workload-Monitoring und proaktives Hiring." },
      { title: "Diskriminierungsklage durch Bias", description: "Unbewusster Bias im Recruiting-Prozess.", likelihood: 1, impact: 5, risk_score: 5, status: "open", mitigation_plan: "Strukturierte Interviews, Blind Screening, D&I Training." },
    ],
    goals: [
      { title: "eNPS über 50", description: "Employee Net Promoter Score.", goal_type: "kpi", target_value: 50, current_value: 45, unit: "Score", quarter: "Q3" },
      { title: "Time-to-Hire unter 30 Tage", description: "Schnellerer Recruiting-Prozess.", goal_type: "kpi", target_value: 30, current_value: 42, unit: "Tage", quarter: "Q3" },
      { title: "Retention Rate >92%", description: "Mitarbeiterbindung stärken.", goal_type: "kpi", target_value: 92, current_value: 88, unit: "%", quarter: "Q4" },
    ],
  },
  {
    name: "Data & Analytics",
    description: "Business Intelligence, Dateninfrastruktur und Reporting",
    hourly_rate: 90,
    decisions: [
      { title: "Data Warehouse Migration zu Snowflake", description: "Migration von Redshift zu Snowflake für bessere Skalierung.", status: "review", priority: "critical", category: "technical", dueInDays: 14, createdDaysAgo: 10, ai_risk_score: 50, ai_impact_score: 80, cost_per_day: 2000 },
      { title: "Self-Service BI Tool Auswahl", description: "Metabase vs. Looker vs. PowerBI für nicht-technische Teams.", status: "proposed", priority: "high", category: "technical", dueInDays: 21, createdDaysAgo: 7, ai_risk_score: 25, ai_impact_score: 65 },
      { title: "Data Governance Framework", description: "Datenqualität, Ownership und Zugriffsrechte definieren.", status: "draft", priority: "high", category: "operational", dueInDays: 30, createdDaysAgo: 4, ai_risk_score: 35, ai_impact_score: 75 },
      { title: "ML Pipeline für Churn-Prediction", description: "Predictive Analytics für Kundenabwanderung.", status: "approved", priority: "medium", category: "technical", dueInDays: 25, createdDaysAgo: 6, ai_risk_score: 30, ai_impact_score: 70 },
      { title: "Real-Time Analytics Pipeline", description: "Streaming-Daten für Live-Dashboards.", status: "proposed", priority: "high", category: "technical", dueInDays: 35, createdDaysAgo: 5, ai_risk_score: 40, ai_impact_score: 75 },
      { title: "Data Retention Policy", description: "Aufbewahrungsfristen und automatische Löschung definieren.", status: "review", priority: "high", category: "operational", dueInDays: 14, createdDaysAgo: 8, ai_risk_score: 30, ai_impact_score: 60 },
      { title: "Customer 360 View", description: "Vereinheitlichte Kundensicht über alle Touchpoints.", status: "draft", priority: "critical", category: "strategic", dueInDays: 45, createdDaysAgo: 3, ai_risk_score: 35, ai_impact_score: 85 },
      { title: "Experimentation Platform", description: "A/B Testing Infrastruktur für datengetriebene Entscheidungen.", status: "proposed", priority: "medium", category: "technical", dueInDays: 28, createdDaysAgo: 4, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "Data Catalog einführen", description: "Zentrale Dokumentation aller Datenquellen und Metriken.", status: "draft", priority: "medium", category: "operational", dueInDays: 25, createdDaysAgo: 2, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "Revenue Attribution Model", description: "Multi-Touch Attribution für Marketing-Kanäle.", status: "approved", priority: "high", category: "marketing", dueInDays: 18, createdDaysAgo: 9, ai_risk_score: 25, ai_impact_score: 65 },
      { title: "ETL-Automatisierung", description: "dbt + Airflow für automatisierte Datenpipelines.", status: "implemented", priority: "high", category: "technical", createdDaysAgo: 40, implementedDaysAgo: 15, ai_risk_score: 20, ai_impact_score: 65, outcome_type: "successful", outcome: "Manuelle Datenaufbereitung um 90% reduziert.", actual_impact_score: 75 },
      { title: "Dashboard-Konsolidierung", description: "Von 25 auf 8 Standard-Dashboards.", status: "implemented", priority: "medium", category: "operational", createdDaysAgo: 35, implementedDaysAgo: 12, ai_risk_score: 10, ai_impact_score: 50, outcome_type: "successful", outcome: "Datengetriebene Entscheidungen +40%.", actual_impact_score: 55 },
      { title: "Data Lake Architektur", description: "S3-basierter Data Lake für unstrukturierte Daten.", status: "implemented", priority: "high", category: "technical", createdDaysAgo: 50, implementedDaysAgo: 25, ai_risk_score: 30, ai_impact_score: 70, outcome_type: "successful", outcome: "Datensilos aufgelöst, Analysezeit -60%.", actual_impact_score: 65 },
    ],
    tasks: [
      { title: "Snowflake POC aufsetzen", status: "in_progress", priority: "critical", category: "technical", dueInDays: 5 },
      { title: "BI-Tool Demo Sessions planen", status: "open", priority: "high", category: "technical", dueInDays: 10 },
      { title: "Data Quality Audit durchführen", status: "open", priority: "high", category: "operational", dueInDays: 14 },
      { title: "ML-Modell Prototyp trainieren", status: "in_progress", priority: "medium", category: "technical", dueInDays: 18 },
      { title: "ETL-Monitoring Dashboard", status: "done", priority: "high", category: "technical", completedDaysAgo: 10 },
      { title: "Data Catalog Tooling evaluieren", status: "open", priority: "medium", category: "operational", dueInDays: 18 },
      { title: "Attribution-Modell dokumentieren", status: "in_progress", priority: "high", category: "marketing", dueInDays: 12 },
    ],
    risks: [
      { title: "Datenqualität unter Schwellenwert", description: "Inkonsistente Daten in 3 kritischen Tabellen.", likelihood: 4, impact: 3, risk_score: 12, status: "open", mitigation_plan: "Data Quality Checks in Pipeline integrieren." },
      { title: "Vendor Lock-in Snowflake", description: "Hohe Abhängigkeit von Snowflake-Ökosystem.", likelihood: 2, impact: 4, risk_score: 8, status: "open", mitigation_plan: "Abstraktionsschicht und regelmäßige Evaluation." },
      { title: "Datenleck durch fehlende Zugriffskontrolle", description: "Zu breite Zugriffsrechte auf sensitive Daten.", likelihood: 4, impact: 5, risk_score: 20, status: "mitigating", mitigation_plan: "RBAC für alle Datenquellen, Audit-Logs aktivieren." },
    ],
    goals: [
      { title: "Data Quality Score >95%", description: "Automatisierte Qualitätsprüfung.", goal_type: "kpi", target_value: 95, current_value: 82, unit: "%", quarter: "Q3" },
      { title: "Self-Service Adoption >60%", description: "Teams nutzen BI-Tools selbstständig.", goal_type: "kpi", target_value: 60, current_value: 25, unit: "%", quarter: "Q4" },
      { title: "Report-Latenz <2 Sekunden", description: "Schnelle Dashboard-Ladezeiten.", goal_type: "kpi", target_value: 2, current_value: 3.5, unit: "Sekunden", quarter: "Q3" },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = user.id;
    const u = userId;

    // ── Helpers ──
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const dueDate = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
    const currentYear = now.getFullYear();
    const base = { created_by: u, owner_id: u };

    // ── Check if personal data exists ──
    const { count: personalDecCount } = await supabase.from("decisions").select("id", { count: "exact", head: true }).eq("created_by", u).is("team_id", null);
    const { count: personalTaskCount } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("created_by", u).is("team_id", null);
    
    let personalMsg = "";

    if ((personalDecCount || 0) === 0 && (personalTaskCount || 0) === 0) {
      // ── Seed personal data (decisions, tasks, risks, goals) ──
      const personalDecisions = [
        { title: "Weiterbildung: Leadership-Programm vs. Fachzertifikat", description: "Führungskräfteentwicklung: Internes Leadership-Programm oder externes Product-Management-Zertifikat für das Team.", status: "draft", priority: "high", category: "hr", due_date: dueDate(30), created_at: daysAgo(3), ...base, ai_risk_score: 20, ai_impact_score: 70 },
        { title: "Home-Office Setup Upgrade", description: "Ergonomischer Arbeitsplatz: Standing Desk, Monitor-Arm, Noise-Cancelling Headset.", status: "approved", priority: "medium", category: "operational", due_date: dueDate(14), created_at: daysAgo(5), ...base, ai_risk_score: 5, ai_impact_score: 35 },
        { title: "Quartals-OKRs für persönlichen Bereich definieren", description: "Individuelle Ziele und Key Results für das kommende Quartal festlegen.", status: "proposed", priority: "medium", category: "strategic", due_date: dueDate(7), created_at: daysAgo(2), ...base, ai_risk_score: 5, ai_impact_score: 50 },
        { title: "Vendor-Evaluierung: CRM-System Migration", description: "Vergleich von Salesforce, HubSpot und Pipedrive für die Vertriebsabteilung — Kosten, Integrations-Aufwand und Migrationszeitplan.", status: "draft", priority: "low", category: "strategic", due_date: dueDate(60), created_at: daysAgo(1), ...base, ai_risk_score: 30, ai_impact_score: 45 },
        { title: "Konferenz-Teilnahme WebSummit 2026", description: "Teilnahme, Reiseplanung und Networking-Strategie.", status: "review", priority: "medium", category: "marketing", due_date: dueDate(45), created_at: daysAgo(4), ...base, ai_risk_score: 10, ai_impact_score: 40 },
        { title: "Mentoring-Programm starten", description: "Regelmäßiges Mentoring für 2 Junior-Kollegen aufsetzen.", status: "proposed", priority: "medium", category: "hr", due_date: dueDate(21), created_at: daysAgo(6), ...base, ai_risk_score: 5, ai_impact_score: 55 },
        { title: "Business Continuity Plan aktualisieren", description: "Notfallpläne, IT-Disaster-Recovery und Kommunikationsketten für kritische Geschäftsprozesse überprüfen.", status: "draft", priority: "high", category: "budget", due_date: dueDate(20), created_at: daysAgo(2), ...base, ai_risk_score: 15, ai_impact_score: 60 },
        { title: "Produktivitäts-Workflow optimiert", description: "GTD-System mit Notion + Kalender-Blocking eingeführt.", status: "implemented", priority: "medium", category: "operational", created_at: daysAgo(40), implemented_at: daysAgo(15), ...base, ai_risk_score: 5, ai_impact_score: 45, outcome_type: "successful", outcome: "Deep-Work-Stunden pro Woche von 8 auf 18 gestiegen.", actual_impact_score: 55 },
        { title: "Remote-Work Policy überarbeiten", description: "Hybridmodell, Kernzeiten und Home-Office-Ausstattungspauschale für alle Abteilungen definieren.", status: "implemented", priority: "high", category: "operational", created_at: daysAgo(60), implemented_at: daysAgo(30), ...base, ai_risk_score: 5, ai_impact_score: 50, outcome_type: "successful", outcome: "Mitarbeiterzufriedenheit und Produktivität deutlich verbessert.", actual_impact_score: 60 },
        { title: "Networking-Strategie LinkedIn", description: "Wöchentliches Posting, Kommentar-Routine, 3 Events/Monat.", status: "implemented", priority: "low", category: "marketing", created_at: daysAgo(50), implemented_at: daysAgo(20), ...base, ai_risk_score: 5, ai_impact_score: 35, outcome_type: "successful", outcome: "LinkedIn-Reichweite +300%. 4 Leads über Netzwerk.", actual_impact_score: 45 },
        { title: "Wissensmanagement Obsidian-Setup", description: "Second Brain mit Zettelkasten-Methode aufgebaut.", status: "implemented", priority: "medium", category: "technical", created_at: daysAgo(45), implemented_at: daysAgo(25), ...base, ai_risk_score: 5, ai_impact_score: 40, outcome_type: "successful", outcome: "Wissen schneller abrufbar. Entscheidungen besser fundiert.", actual_impact_score: 50 },
        { title: "Delegation Framework", description: "Klare Regeln definiert, welche Aufgaben delegiert werden.", status: "implemented", priority: "high", category: "operational", created_at: daysAgo(35), implemented_at: daysAgo(12), ...base, ai_risk_score: 10, ai_impact_score: 65, outcome_type: "successful", outcome: "20% mehr strategische Zeit pro Woche.", actual_impact_score: 60 },
      ];

      const { data: pDecs } = await supabase.from("decisions").insert(personalDecisions as any[]).select("id, status, created_at");

      const personalTasks = [
        { title: "Weiterbildungsbudget Q2 recherchieren", status: "in_progress", priority: "high", category: "hr", due_date: dueDate(7), created_by: u },
        { title: "Home-Office Ausstattung finalisieren", status: "open", priority: "medium", category: "operational", due_date: dueDate(3), created_by: u },
        { title: "Quartals-OKRs definieren", status: "open", priority: "medium", category: "strategic", due_date: dueDate(5), created_by: u },
        { title: "LinkedIn-Artikel schreiben", status: "backlog", priority: "low", category: "marketing", created_by: u },
        { title: "Konferenz-Teilnahme beantragen", status: "open", priority: "high", category: "budget", due_date: dueDate(14), created_by: u },
        { title: "Mentoring Kick-off vorbereiten", status: "open", priority: "medium", category: "hr", due_date: dueDate(10), created_by: u },
        { title: "Obsidian Templates anlegen", status: "done", priority: "medium", category: "technical", created_by: u, completed_at: daysAgo(20) },
        { title: "Delegations-Matrix erstellen", status: "done", priority: "high", category: "operational", created_by: u, completed_at: daysAgo(10) },
      ];
      await supabase.from("tasks").insert(personalTasks as any[]);

      await supabase.from("risks").insert([
        { title: "Burnout-Risiko im Team durch Überarbeitung", description: "Hohe Arbeitslast seit 3 Monaten ohne Entlastung.", likelihood: 3, impact: 4, risk_score: 12, status: "open", created_by: u, mitigation_plan: "Workload-Review, Delegationsmatrix, wöchentlicher Team-Check-in." },
        { title: "Wissensverlust bei Schlüsselpersonen", description: "Kritisches Wissen nicht dokumentiert.", likelihood: 3, impact: 3, risk_score: 9, status: "open", created_by: u, mitigation_plan: "Knowledge Base pflegen, Cross-Training einführen." },
      ]);

      await supabase.from("strategic_goals").insert([
        { title: "50 Deep-Work-Blöcke pro Quartal", description: "Fokussierte Arbeit ohne Unterbrechungen.", goal_type: "kpi", target_value: 50, current_value: 32, unit: "Blöcke", year: currentYear, quarter: "Q2", status: "active", created_by: u },
        { title: "12 Networking-Events besuchen", description: "Mindestens 1 Event pro Monat.", goal_type: "okr", target_value: 12, current_value: 5, unit: "Events", year: currentYear, quarter: "Q4", status: "active", created_by: u },
      ]);

      // Lessons for personal implemented decisions
      const pImpl = pDecs?.filter(d => d.status === "implemented") || [];
      const pLessonData = [
        { key_takeaway: "Persönliche Systeme brauchen 3 Wochen bis sie zur Gewohnheit werden.", what_went_well: "Produktivität messbar gestiegen.", what_went_wrong: "Anfangs zu viel auf einmal geändert.", recommendations: "Eine Gewohnheit nach der anderen einführen." },
        { key_takeaway: "Delegation erfordert Vertrauen UND Struktur.", what_went_well: "Strategische Zeit gewonnen.", what_went_wrong: "Erste Woche Kontrollverlust-Gefühl.", recommendations: "Check-in-Rhythmus vereinbaren." },
        { key_takeaway: "Netzwerken ist ein Langzeit-Investment.", what_went_well: "Unerwartete Opportunities.", what_went_wrong: "Konsistenz schwer durchzuhalten.", recommendations: "Feste Slots im Kalender blocken." },
      ];
      const pLessons = pImpl.slice(0, 3).map((d, i) => ({ decision_id: d.id, created_by: u, ...pLessonData[i % pLessonData.length] }));
      if (pLessons.length > 0) await supabase.from("lessons_learned").insert(pLessons);

      // Audit logs for personal
      if (pDecs && pDecs.length > 0) {
        await supabase.from("audit_logs").insert(pDecs.slice(0, 5).map(d => ({ decision_id: d.id, user_id: u, action: "created", created_at: d.created_at })));

        // Personal decision dependencies
        if (pDecs.length >= 5) {
          const pIds = pDecs.map(d => d.id);
          await supabase.from("decision_dependencies").insert([
            { source_decision_id: pIds[0], target_decision_id: pIds[2], dependency_type: "influences", created_by: u },
            { source_decision_id: pIds[2], target_decision_id: pIds[3], dependency_type: "requires", created_by: u },
            { source_decision_id: pIds[6], target_decision_id: pIds[0], dependency_type: "blocks", created_by: u },
            ...(pIds.length > 5 ? [{ source_decision_id: pIds[4], target_decision_id: pIds[5], dependency_type: "influences", created_by: u }] : []),
          ]);
        }
      }

      personalMsg = " + 12 persönliche Entscheidungen, 8 Tasks, 2 Risiken, 2 Ziele";
    }

    // ── Determine which team to create next ──
    const { data: existingTeams } = await supabase.from("teams").select("name").eq("created_by", userId);
    const existingNames = new Set((existingTeams || []).map((t: any) => t.name));

    let template = teamTemplates.find(t => !existingNames.has(t.name));
    if (!template) {
      const baseTpl = teamTemplates[existingTeams!.length % teamTemplates.length];
      const count = (existingTeams || []).filter((t: any) => t.name.startsWith(baseTpl.name)).length;
      template = { ...baseTpl, name: `${baseTpl.name} ${count + 1}` };
    }

    // ── 1. Create Team ──
    const { data: newTeam, error: teamErr } = await supabase.from("teams").insert({
      name: template.name,
      description: template.description,
      created_by: userId,
      hourly_rate: template.hourly_rate,
    }).select("id, name").single();

    if (teamErr || !newTeam) throw new Error(teamErr?.message || "Team creation failed");

    await supabase.from("team_members").insert({ team_id: newTeam.id, user_id: userId, role: "lead" });

    // ── 2. Create Decisions ──
    const decisionsToInsert = template.decisions.map(d => {
      const rec: any = {
        title: d.title,
        description: d.description,
        status: d.status,
        priority: d.priority,
        category: d.category,
        created_at: daysAgo(d.createdDaysAgo),
        created_by: userId,
        owner_id: userId,
        team_id: newTeam.id,
        ai_risk_score: d.ai_risk_score || 0,
        ai_impact_score: d.ai_impact_score || 0,
        cost_per_day: d.cost_per_day || 0,
        escalation_level: d.escalation_level || 0,
      };
      if (d.dueInDays !== undefined) rec.due_date = dueDate(d.dueInDays);
      if (d.escalation_level) rec.last_escalated_at = daysAgo(1);
      if (d.implementedDaysAgo) rec.implemented_at = daysAgo(d.implementedDaysAgo);
      if (d.outcome_type) rec.outcome_type = d.outcome_type;
      if (d.outcome) rec.outcome = d.outcome;
      if (d.actual_impact_score) rec.actual_impact_score = d.actual_impact_score;
      return rec;
    });

    const { data: insertedDecisions, error: decErr } = await supabase.from("decisions").insert(decisionsToInsert).select("id, title, status, created_at");
    if (decErr) {
      console.error("Decision insert error:", JSON.stringify(decErr));
      throw new Error("Decisions insert failed: " + decErr.message);
    }

    // ── 3. Create Tasks ──
    const tasksToInsert = template.tasks.map((t, idx) => {
      const rec: any = {
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category,
        created_by: userId,
        team_id: newTeam.id,
        assignee_id: idx % 2 === 0 ? userId : null,
      };
      if (t.dueInDays !== undefined) rec.due_date = dueDate(t.dueInDays);
      if (t.completedDaysAgo) rec.completed_at = daysAgo(t.completedDaysAgo);
      return rec;
    });
    await supabase.from("tasks").insert(tasksToInsert);

    // ── 4. Create Risks ──
    const { data: insertedRisks } = await supabase.from("risks").insert(template.risks.map(r => ({ ...r, created_by: userId, team_id: newTeam.id }))).select("id");

    // ── 4b. Link risks to decisions ──
    if (insertedRisks && insertedDecisions && insertedRisks.length > 0 && insertedDecisions.length > 0) {
      const riskDecLinks = insertedRisks.slice(0, Math.min(insertedRisks.length, 4)).map((r, i) => ({
        risk_id: r.id,
        decision_id: insertedDecisions[i % insertedDecisions.length].id,
        linked_by: userId,
      }));
      await supabase.from("risk_decision_links").insert(riskDecLinks);
    }

    // ── 5. Create Strategic Goals & Link to Decisions ──
    const { data: insertedGoals } = await supabase.from("strategic_goals").insert(template.goals.map(g => ({ ...g, created_by: userId, team_id: newTeam.id, year: currentYear, status: "active" }))).select("id");

    // Link decisions to goals (2-3 decisions per goal)
    if (insertedGoals && insertedGoals.length > 0 && insertedDecisions && insertedDecisions.length > 0) {
      const goalLinks: any[] = [];
      insertedGoals.forEach((goal, gIdx) => {
        // Each goal gets 2-3 linked decisions, cycling through available decisions
        const linksPerGoal = gIdx % 2 === 0 ? 3 : 2;
        for (let j = 0; j < linksPerGoal && j < insertedDecisions.length; j++) {
          const decIdx = (gIdx * 3 + j) % insertedDecisions.length;
          goalLinks.push({
            goal_id: goal.id,
            decision_id: insertedDecisions[decIdx].id,
            impact_weight: [40, 60, 80, 50, 70][j % 5],
            linked_by: userId,
          });
        }
      });
      await supabase.from("decision_goal_links").insert(goalLinks);
    }

    // ── 5b. Archive some older implemented decisions ──
    const implementedDecs = insertedDecisions?.filter(d => d.status === "implemented") || [];
    // Archive the oldest 2 implemented decisions (if we have enough)
    const toArchive = implementedDecs.slice(-2);
    for (const dec of toArchive) {
      await supabase.from("decisions").update({
        status: "archived",
        archived_at: daysAgo(5),
      }).eq("id", dec.id);
    }

    // ── 6. Lessons Learned for implemented decisions ──
    const lessonTemplates = [
      { key_takeaway: "Frühzeitige Planung reduziert Risiken signifikant.", what_went_well: "Termingerecht umgesetzt.", what_went_wrong: "Scope anfangs nicht klar definiert.", recommendations: "Scope-Dokument vor Kickoff erstellen." },
      { key_takeaway: "Automatisierung spart langfristig enorme Ressourcen.", what_went_well: "ROI höher als erwartet.", what_went_wrong: "Einarbeitungszeit unterschätzt.", recommendations: "Training-Budget einplanen." },
      { key_takeaway: "Cross-funktionale Zusammenarbeit beschleunigt Entscheidungen.", what_went_well: "Team-Alignment verbessert.", what_went_wrong: "Zu viele Stakeholder anfangs.", recommendations: "RACI-Matrix vorab definieren." },
    ];
    const lessons = implementedDecs.map((d, i) => ({ decision_id: d.id, created_by: userId, ...lessonTemplates[i % lessonTemplates.length] }));
    if (lessons.length > 0) await supabase.from("lessons_learned").insert(lessons);

    // ── 7. Reviews ──
    const reviewDecs = insertedDecisions?.filter(d => d.status === "review" || d.status === "approved") || [];
    const reviews = reviewDecs.slice(0, 5).map(d => ({
      decision_id: d.id, reviewer_id: userId, step_order: 1,
      status: d.status === "approved" ? "approved" : "review",
      feedback: d.status === "approved" ? "Freigabe erteilt." : null,
      reviewed_at: d.status === "approved" ? daysAgo(2) : null,
    }));
    if (reviews.length > 0) await supabase.from("decision_reviews").insert(reviews as any[]);

    // ── 8. Audit Logs ──
    if (insertedDecisions && insertedDecisions.length > 0) {
      const auditLogs = insertedDecisions.slice(0, 6).map(d => ({ decision_id: d.id, user_id: userId, action: "created", created_at: d.created_at }));
      await supabase.from("audit_logs").insert(auditLogs);
    }

    // ── 8b. Decision Dependencies (Graph Edges) ──
    if (insertedDecisions && insertedDecisions.length >= 6) {
      const ids = insertedDecisions.map(d => d.id);
      // Create meaningful dependency chains within each team
      // Pattern: first few decisions form a chain, plus some cross-links
      const depInserts = [
        // Chain: 0 blocks 1, 1 requires 2
        { source_decision_id: ids[0], target_decision_id: ids[1], dependency_type: "blocks", created_by: userId },
        { source_decision_id: ids[1], target_decision_id: ids[2], dependency_type: "requires", created_by: userId },
        // 0 influences 3
        { source_decision_id: ids[0], target_decision_id: ids[3], dependency_type: "influences", created_by: userId },
        // 2 blocks 4
        { source_decision_id: ids[2], target_decision_id: ids[4], dependency_type: "blocks", created_by: userId },
        // 3 requires 5
        { source_decision_id: ids[3], target_decision_id: ids[5], dependency_type: "requires", created_by: userId },
        // 5 influences 6 (if exists)
        ...(ids.length > 6 ? [{ source_decision_id: ids[5], target_decision_id: ids[6], dependency_type: "influences", created_by: userId }] : []),
        // Cross-link: 4 influences 7 (if exists)
        ...(ids.length > 7 ? [{ source_decision_id: ids[4], target_decision_id: ids[7], dependency_type: "influences", created_by: userId }] : []),
        // 6 blocks 8 (if exists)
        ...(ids.length > 8 ? [{ source_decision_id: ids[6], target_decision_id: ids[8], dependency_type: "blocks", created_by: userId }] : []),
        // 7 requires 9 (if exists)
        ...(ids.length > 9 ? [{ source_decision_id: ids[7], target_decision_id: ids[9], dependency_type: "requires", created_by: userId }] : []),
      ];
      await supabase.from("decision_dependencies").insert(depInserts);
    }

    // ── 9. Example Chat Messages ──
    const chatMessages = [
      { team_id: newTeam.id, user_id: userId, content: `Willkommen im Team "${newTeam.name}"! 🎉 Hier koordinieren wir unsere Entscheidungen.`, created_at: daysAgo(7) },
      { team_id: newTeam.id, user_id: userId, content: "Ich habe die offenen Entscheidungen priorisiert. Bitte schaut euch die kritischen Reviews an.", created_at: daysAgo(5) },
      { team_id: newTeam.id, user_id: userId, content: "Reminder: Deadline für die Cloud-Migration rückt näher. Status-Update im Command Center.", created_at: daysAgo(3) },
      { team_id: newTeam.id, user_id: userId, content: "Gute Fortschritte diese Woche! 3 Entscheidungen abgeschlossen. 💪", created_at: daysAgo(1) },
    ];
    await supabase.from("team_messages").insert(chatMessages);

    const decCount = insertedDecisions?.length || 0;

    return new Response(JSON.stringify({
      success: true,
      message: `Team "${newTeam.name}" erstellt mit ${decCount} Entscheidungen, ${template.tasks.length} Aufgaben, ${template.risks.length} Risiken und ${template.goals.length} Zielen${personalMsg}.`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
