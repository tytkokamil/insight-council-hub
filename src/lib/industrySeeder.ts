/**
 * Seeds industry-specific demo decisions and templates when a user selects their industry.
 */
import { supabase } from "@/integrations/supabase/client";

interface SeedDecision {
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  cost_per_day?: number;
  escalation_level?: number;
  due_date_offset?: number; // days from today
}

interface SeedTemplate {
  name: string;
  category: string;
  priority: string;
  description: string;
  default_duration_days: number;
  required_fields?: any[];
  approval_steps?: any[];
}

interface IndustryData {
  decisions: SeedDecision[];
  templates: SeedTemplate[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-").replace(/(^-|-$)/g, "");
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const contextField = { key: "context", label: "Kontext & Hintergrund", type: "textarea", placeholder: "Warum ist diese Entscheidung notwendig?" };
const riskField = { key: "risk_assessment", label: "Risikobewertung", type: "textarea", placeholder: "Welche Risiken bestehen?" };
const budgetField = { key: "budget_impact", label: "Budget-Auswirkung (€)", type: "text", placeholder: "z.B. 50.000€" };
const alternativesField = { key: "alternatives", label: "Geprüfte Alternativen", type: "textarea", placeholder: "Welche Alternativen wurden evaluiert?" };

const defaultApproval = [
  { role: "decision_maker", label: "Fachverantwortlicher", required: true },
  { role: "reviewer", label: "Prüfer", required: true },
];

// ── Industry Data ──────────────────────────────────────

const DATA: Record<string, IndustryData> = {
  maschinenbau: {
    decisions: [
      { title: "Konstruktionsänderung Getriebe Projekt 2024-047", description: "Engineering Change Order für Getriebekomponente im laufenden Projekt.", status: "in_review", priority: "high", category: "operational", cost_per_day: 1200, due_date_offset: 5 },
      { title: "Investitionsfreigabe CNC-Fräsmaschine DMG Mori", description: "Investition in neue 5-Achs CNC-Fräsmaschine, Volumen €285.000.", status: "open", priority: "high", category: "strategic", cost_per_day: 800, due_date_offset: 14 },
      { title: "Maschinenabnahme Kunde Müller GmbH", description: "Abnahmeprotokoll für Sondermaschine, Projekt 2024-031.", status: "approved", priority: "medium", category: "operational", due_date_offset: -2 },
      { title: "Lieferantenwechsel Hydraulikkomponenten", description: "Bisheriger Lieferant kann Qualitätsanforderungen nicht mehr erfüllen.", status: "in_review", priority: "high", category: "operational", escalation_level: 1, due_date_offset: -5 },
      { title: "Make-or-Buy Steuerungsplatine", description: "Evaluation ob Steuerungsplatine intern gefertigt oder zugekauft wird.", status: "draft", priority: "medium", category: "tactical", due_date_offset: 21 },
    ],
    templates: [
      { name: "Engineering Change Order (ECO)", category: "operational", priority: "high", description: "Strukturierte Konstruktionsänderung mit Auswirkungsanalyse.", default_duration_days: 14, required_fields: [contextField, riskField, { key: "affected_parts", label: "Betroffene Teile/Baugruppen", type: "textarea", placeholder: "Teilenummern, Baugruppen..." }], approval_steps: [{ role: "decision_maker", label: "Konstruktionsleiter", required: true }, { role: "reviewer", label: "Prüfer", required: true }] },
      { name: "Projektfreigabe intern", category: "strategic", priority: "high", description: "Interne Freigabe für neues Projekt oder Projektphase.", default_duration_days: 7, required_fields: [contextField, budgetField, riskField], approval_steps: defaultApproval },
      { name: "Investitionsfreigabe Maschine", category: "strategic", priority: "high", description: "Freigabe für Maschineninvestition inkl. ROI-Betrachtung.", default_duration_days: 21, required_fields: [contextField, budgetField, alternativesField, { key: "roi_estimate", label: "ROI-Schätzung", type: "text", placeholder: "z.B. 24 Monate Amortisation" }], approval_steps: [{ role: "decision_maker", label: "Fertigungsleiter", required: true }, { role: "reviewer", label: "Controlling", required: true }, { role: "admin", label: "Geschäftsführung", required: true }] },
      { name: "Maschinenabnahme beim Kunden", category: "operational", priority: "medium", description: "Strukturiertes Abnahmeprotokoll für Kundenmaschinen.", default_duration_days: 5, required_fields: [contextField, { key: "checklist", label: "Prüfpunkte", type: "textarea", placeholder: "Funktionstest, Maßprüfung..." }], approval_steps: [{ role: "decision_maker", label: "Projektleiter", required: true }] },
      { name: "Make-or-Buy Entscheidung", category: "tactical", priority: "medium", description: "Evaluation Eigenfertigung vs. Fremdbezug.", default_duration_days: 14, required_fields: [contextField, alternativesField, budgetField, riskField], approval_steps: defaultApproval },
    ],
  },
  pharma: {
    decisions: [
      { title: "Change Control CC-2024-089: Lieferantenwechsel API", description: "Wirkstofflieferant muss gewechselt werden. GMP-relevante Änderung.", status: "in_review", priority: "high", category: "compliance", cost_per_day: 2500, due_date_offset: 7 },
      { title: "Batch-Freigabe Charge BN-447821", description: "Analytische Ergebnisse liegen vor, QP-Freigabe ausstehend.", status: "approved", priority: "high", category: "operational", due_date_offset: -1 },
      { title: "CAPA-2024-034: Abweichung Reinraum", description: "Partikelzahl-Überschreitung in Reinraum B2. Root-Cause-Analyse läuft.", status: "open", priority: "critical", category: "compliance", cost_per_day: 3000, due_date_offset: 3 },
      { title: "SOP-Freigabe QA-SOP-012 Rev. 3", description: "Revision der Qualitätssicherungs-SOP nach Audit-Finding.", status: "in_review", priority: "medium", category: "compliance", due_date_offset: 10 },
      { title: "Lieferanten-Qualifizierung Excipient GmbH", description: "Neuer Hilfsstoff-Lieferant muss qualifiziert werden.", status: "draft", priority: "medium", category: "operational", due_date_offset: 30 },
    ],
    templates: [
      { name: "Change Control", category: "compliance", priority: "high", description: "GMP-konformer Change-Control-Prozess für regulierte Änderungen.", default_duration_days: 21, required_fields: [contextField, riskField, { key: "gmp_impact", label: "GMP-Auswirkung", type: "select", options: [{ value: "minor", label: "Minor" }, { value: "major", label: "Major" }, { value: "critical", label: "Kritisch" }] }], approval_steps: [{ role: "decision_maker", label: "Fachverantwortlicher", required: true }, { role: "reviewer", label: "Qualified Person (QP)", required: true }] },
      { name: "Batch-Freigabe", category: "operational", priority: "high", description: "Freigabe einer Produktionscharge durch die QP.", default_duration_days: 3, required_fields: [contextField, { key: "batch_number", label: "Chargennummer", type: "text", placeholder: "BN-XXXXXX" }], approval_steps: [{ role: "reviewer", label: "Qualified Person (QP)", required: true }] },
      { name: "CAPA", category: "compliance", priority: "critical", description: "Corrective and Preventive Action für Abweichungen.", default_duration_days: 30, required_fields: [contextField, riskField, { key: "root_cause", label: "Root-Cause-Analyse", type: "textarea", placeholder: "Ursachenanalyse..." }], approval_steps: [{ role: "decision_maker", label: "QA-Leiter", required: true }, { role: "reviewer", label: "Qualified Person (QP)", required: true }] },
      { name: "Lieferanten-Qualifizierung", category: "operational", priority: "medium", description: "Strukturierte Qualifizierung neuer Lieferanten.", default_duration_days: 45, required_fields: [contextField, riskField, alternativesField], approval_steps: [{ role: "decision_maker", label: "Einkauf", required: true }, { role: "reviewer", label: "Qualified Person (QP)", required: true }] },
      { name: "SOP-Freigabe", category: "compliance", priority: "medium", description: "Freigabe neuer oder überarbeiteter Standard Operating Procedures.", default_duration_days: 14, required_fields: [contextField, { key: "revision_reason", label: "Änderungsgrund", type: "textarea", placeholder: "Warum wird die SOP geändert?" }], approval_steps: [{ role: "decision_maker", label: "Dokumentenverantwortlicher", required: true }, { role: "reviewer", label: "Qualified Person (QP)", required: true }] },
    ],
  },
  bau: {
    decisions: [
      { title: "Nachtragsfreigabe NTR-2024-156: Zusätzliche Erdarbeiten", description: "Unvorhergesehene Bodenverhältnisse erfordern Mehrkosten €47.500.", status: "in_review", priority: "high", category: "operational", escalation_level: 1, cost_per_day: 1500, due_date_offset: -3 },
      { title: "Subunternehmer-Beauftragung Elektro: Firma Schreiber GmbH", description: "Vergabe der Elektroinstallation an Subunternehmer.", status: "in_review", priority: "medium", category: "operational", due_date_offset: 7 },
      { title: "Planfreigabe Grundriss EG Stand C", description: "Aktualisierter Grundriss nach Kundenwunschänderung.", status: "approved", priority: "medium", category: "operational", due_date_offset: -1 },
      { title: "Abnahmeprotokoll Rohbau Bauabschnitt 2", description: "Rohbauabnahme vor Beginn des Innenausbaus.", status: "open", priority: "high", category: "operational", due_date_offset: 5 },
      { title: "Investitionsentscheidung Gewerbepark Nord", description: "Grundstückserwerb und Entwicklung, Volumen €4,2M.", status: "draft", priority: "critical", category: "strategic", cost_per_day: 2000, due_date_offset: 30 },
    ],
    templates: [
      { name: "Nachtragsfreigabe", category: "operational", priority: "high", description: "Freigabe von Nachträgen und Mehrkosten im Bauprojekt.", default_duration_days: 7, required_fields: [contextField, budgetField, riskField], approval_steps: [{ role: "decision_maker", label: "Bauleiter", required: true }, { role: "reviewer", label: "Projektleiter", required: true }] },
      { name: "Subunternehmer-Beauftragung", category: "operational", priority: "medium", description: "Vergabe von Gewerken an Subunternehmer.", default_duration_days: 10, required_fields: [contextField, budgetField, alternativesField], approval_steps: [{ role: "decision_maker", label: "Bauleiter", required: true }, { role: "reviewer", label: "Projektleiter", required: true }] },
      { name: "Planfreigabe", category: "operational", priority: "medium", description: "Freigabe von Planständen und Revisionen.", default_duration_days: 5, required_fields: [contextField], approval_steps: [{ role: "decision_maker", label: "Architekt", required: true }, { role: "reviewer", label: "Bauleiter", required: true }] },
      { name: "Abnahmeprotokoll", category: "operational", priority: "high", description: "Strukturiertes Abnahmeprotokoll für Bauabschnitte.", default_duration_days: 3, required_fields: [contextField, { key: "checklist", label: "Prüfpunkte", type: "textarea", placeholder: "Mängelliste, Prüfpunkte..." }], approval_steps: [{ role: "decision_maker", label: "Bauleiter", required: true }] },
      { name: "Investitionsentscheidung Immobilie", category: "strategic", priority: "critical", description: "Grundstücks- oder Immobilieninvestition.", default_duration_days: 30, required_fields: [contextField, budgetField, riskField, alternativesField], approval_steps: [{ role: "decision_maker", label: "Projektentwickler", required: true }, { role: "reviewer", label: "Geschäftsführung", required: true }] },
    ],
  },
  finanzen: {
    decisions: [
      { title: "Kreditentscheidung KD-2024-8821: Müller Maschinenbau GmbH €2,5M", description: "Kreditantrag mit Vier-Augen-Pflicht. Bonitätsprüfung abgeschlossen.", status: "in_review", priority: "high", category: "compliance", cost_per_day: 500, due_date_offset: 5 },
      { title: "Produkt-Launch Compliance: Nachhaltigkeitsfonds ESG-Green", description: "Regulatorische Prüfung für neuen ESG-Fonds abgeschlossen.", status: "approved", priority: "high", category: "compliance", due_date_offset: -3 },
      { title: "Risikoakzeptanz RA-2024-044: Klumpenrisiko Immobilien", description: "Überschreitung der internen Risikolimits im Immobilienportfolio.", status: "in_review", priority: "critical", category: "compliance", escalation_level: 1, due_date_offset: 3 },
      { title: "Outsourcing-Entscheidung: Cloud-Provider Datenhaltung", description: "Evaluation von Cloud-Anbietern unter BaFin-Anforderungen.", status: "in_review", priority: "high", category: "strategic", due_date_offset: 14 },
      { title: "Aufsichtsbehörden-Meldung: Datenpanne 15.02.2024", description: "Pflichtmeldung an BaFin nach Datenschutzvorfall.", status: "implemented", priority: "critical", category: "compliance", due_date_offset: -10 },
    ],
    templates: [
      { name: "Kreditentscheidung", category: "compliance", priority: "high", description: "Strukturierte Kreditentscheidung mit Vier-Augen-Prinzip.", default_duration_days: 7, required_fields: [contextField, budgetField, riskField, { key: "vier_augen", label: "Vier-Augen-Prüfung", type: "select", options: [{ value: "pending", label: "Ausstehend" }, { value: "completed", label: "Durchgeführt" }] }], approval_steps: [{ role: "decision_maker", label: "Markt", required: true }, { role: "reviewer", label: "Marktfolge", required: true }] },
      { name: "Produkt-Launch Compliance", category: "compliance", priority: "high", description: "Regulatorische Freigabe für neue Finanzprodukte.", default_duration_days: 21, required_fields: [contextField, riskField, { key: "regulatory_check", label: "Regulatorische Prüfung", type: "textarea", placeholder: "BaFin, MiFID II, etc." }], approval_steps: [{ role: "decision_maker", label: "Produktmanagement", required: true }, { role: "reviewer", label: "Compliance", required: true }] },
      { name: "Risikoakzeptanz", category: "compliance", priority: "critical", description: "Formale Akzeptanz von Risikoüberschreitungen.", default_duration_days: 5, required_fields: [contextField, riskField], approval_steps: [{ role: "decision_maker", label: "Risikomanagement", required: true }, { role: "reviewer", label: "Vorstand", required: true }] },
      { name: "Aufsichtsbehörden-Meldung", category: "compliance", priority: "critical", description: "Pflichtmeldung an Aufsichtsbehörden (BaFin, EZB).", default_duration_days: 3, required_fields: [contextField, { key: "deadline", label: "Meldefrist", type: "text", placeholder: "z.B. 72 Stunden" }], approval_steps: [{ role: "decision_maker", label: "Compliance-Officer", required: true }] },
      { name: "Outsourcing-Entscheidung", category: "strategic", priority: "high", description: "Bewertung und Freigabe von Outsourcing-Vorhaben.", default_duration_days: 30, required_fields: [contextField, budgetField, riskField, alternativesField], approval_steps: [{ role: "decision_maker", label: "Fachbereich", required: true }, { role: "reviewer", label: "Compliance", required: true }, { role: "admin", label: "Vorstand", required: true }] },
    ],
  },
  it: {
    decisions: [
      { title: "ADR-2024-012: Migration zu PostgreSQL", description: "Architecture Decision Record für Datenbank-Migration.", status: "approved", priority: "high", category: "tactical", due_date_offset: -5 },
      { title: "Release-Freigabe v2.4.1 — Security Hotfix", description: "Kritischer Security-Patch, alle Tests bestanden.", status: "approved", priority: "critical", category: "operational", due_date_offset: -1 },
      { title: "Security Patch: CVE-2024-1234 CVSS 9.8 — kritisch", description: "Kritische Sicherheitslücke, seit 18h offen.", status: "in_review", priority: "critical", category: "compliance", escalation_level: 1, cost_per_day: 5000, due_date_offset: 0 },
      { title: "Vendor-Auswahl: Monitoring-Tool (Datadog vs. Grafana)", description: "Evaluation und Auswahl eines Monitoring-Tools.", status: "in_review", priority: "medium", category: "tactical", due_date_offset: 14 },
      { title: "KI-Einsatz Freigabe: GPT-4 für Kundensupport", description: "Datenschutz- und Compliance-Prüfung für KI-Integration.", status: "draft", priority: "high", category: "strategic", due_date_offset: 21 },
    ],
    templates: [
      { name: "Architecture Decision Record (ADR)", category: "tactical", priority: "high", description: "Dokumentation und Freigabe von Architekturentscheidungen.", default_duration_days: 14, required_fields: [contextField, alternativesField, { key: "consequences", label: "Konsequenzen", type: "textarea", placeholder: "Positive und negative Auswirkungen..." }], approval_steps: [{ role: "decision_maker", label: "Tech Lead", required: true }, { role: "reviewer", label: "CTO", required: true }] },
      { name: "Release-Freigabe", category: "operational", priority: "high", description: "Freigabe eines Software-Releases für Produktion.", default_duration_days: 3, required_fields: [contextField, { key: "test_results", label: "Testergebnisse", type: "textarea", placeholder: "Unit Tests, Integration Tests..." }], approval_steps: [{ role: "decision_maker", label: "Tech Lead", required: true }] },
      { name: "Security Patch (Kritisch)", category: "compliance", priority: "critical", description: "Notfall-Patch für kritische Sicherheitslücken.", default_duration_days: 1, required_fields: [contextField, riskField, { key: "cvss_score", label: "CVSS Score", type: "text", placeholder: "z.B. 9.8" }], approval_steps: [{ role: "decision_maker", label: "Security Lead", required: true }, { role: "reviewer", label: "CTO", required: true }] },
      { name: "Vendor/SaaS Auswahl", category: "tactical", priority: "medium", description: "Strukturierte Evaluation und Auswahl von SaaS-Tools.", default_duration_days: 21, required_fields: [contextField, alternativesField, budgetField], approval_steps: [{ role: "decision_maker", label: "Tech Lead", required: true }, { role: "reviewer", label: "CTO", required: false }] },
      { name: "KI-Einsatz Freigabe", category: "strategic", priority: "high", description: "Prüfung und Freigabe von KI-Integrationen.", default_duration_days: 14, required_fields: [contextField, riskField, { key: "data_privacy", label: "Datenschutz-Bewertung", type: "textarea", placeholder: "Welche Daten werden verarbeitet?" }], approval_steps: [{ role: "decision_maker", label: "Produktverantwortlicher", required: true }, { role: "reviewer", label: "Datenschutzbeauftragter", required: true }, { role: "reviewer", label: "CTO", required: true }] },
    ],
  },
  handel: {
    decisions: [
      { title: "Neue Produkt-Listung: Winterkollektion 2024 — 847 Artikel", description: "Sortimentserweiterung mit 847 neuen Artikeln.", status: "in_review", priority: "high", category: "operational", due_date_offset: 10 },
      { title: "Großbestellung Freigabe: Weihnachtsware €1,2M", description: "Saisonale Großbestellung mit Volumenrabatt.", status: "approved", priority: "high", category: "strategic", due_date_offset: -2 },
      { title: "Rabattaktion Black Friday: bis -40%", description: "Promotion-Budget €85.000, Ziel: +60% Umsatz.", status: "in_review", priority: "medium", category: "tactical", due_date_offset: 14 },
      { title: "Lieferantenwechsel Textil: Von China zu Portugal", description: "Nearshoring-Initiative für kürzere Lieferketten.", status: "open", priority: "high", category: "strategic", cost_per_day: 800, due_date_offset: 21 },
      { title: "Neuer Verkaufskanal: Amazon Marketplace", description: "Evaluation des Einstiegs in den Amazon-Marktplatz.", status: "draft", priority: "medium", category: "strategic", due_date_offset: 30 },
    ],
    templates: [
      { name: "Neue Produkt-Listung", category: "operational", priority: "medium", description: "Freigabe neuer Produkte für das Sortiment.", default_duration_days: 7, required_fields: [contextField, { key: "article_count", label: "Anzahl Artikel", type: "text", placeholder: "z.B. 847" }], approval_steps: defaultApproval },
      { name: "Großbestellung Freigabe", category: "strategic", priority: "high", description: "Freigabe von Großbestellungen über Schwellenwert.", default_duration_days: 5, required_fields: [contextField, budgetField, riskField], approval_steps: [{ role: "decision_maker", label: "Einkaufsleiter", required: true }, { role: "reviewer", label: "Geschäftsführung", required: true }] },
      { name: "Rabattaktion Freigabe", category: "tactical", priority: "medium", description: "Freigabe von Promotions und Rabattaktionen.", default_duration_days: 7, required_fields: [contextField, budgetField, { key: "target_kpi", label: "Ziel-KPI", type: "text", placeholder: "z.B. +60% Umsatz" }], approval_steps: defaultApproval },
      { name: "Lieferantenwechsel", category: "strategic", priority: "high", description: "Bewertung und Durchführung eines Lieferantenwechsels.", default_duration_days: 30, required_fields: [contextField, alternativesField, riskField, budgetField], approval_steps: defaultApproval },
      { name: "Neuer Verkaufskanal", category: "strategic", priority: "medium", description: "Evaluation und Freigabe neuer Vertriebskanäle.", default_duration_days: 21, required_fields: [contextField, budgetField, riskField], approval_steps: defaultApproval },
    ],
  },
  healthcare: {
    decisions: [
      { title: "Medizingeräte-Investition: MRT Siemens MAGNETOM €1,8M", description: "Investition in neues MRT-System für die Radiologie.", status: "in_review", priority: "critical", category: "strategic", cost_per_day: 1500, due_date_offset: 14 },
      { title: "Medikamenten-Beschaffung neu: Biosimilar Adalimumab", description: "Umstellung auf Biosimilar zur Kostenreduktion.", status: "approved", priority: "high", category: "operational", due_date_offset: -3 },
      { title: "Behandlungsprotokoll-Änderung: Sepsis-Management", description: "Aktualisierung des Sepsis-Protokolls nach neuen Leitlinien.", status: "in_review", priority: "high", category: "compliance", due_date_offset: 10 },
      { title: "IT-Plattform Freigabe: Digitale Patientenakte", description: "Datenschutzprüfung für neue Patientenakte läuft.", status: "in_review", priority: "high", category: "strategic", escalation_level: 1, due_date_offset: 7 },
      { title: "Lieferantenauswahl: Medizinbedarf Verbrauchsmaterial", description: "Neuausschreibung des Verbrauchsmaterial-Rahmenvertrags.", status: "open", priority: "medium", category: "operational", due_date_offset: 21 },
    ],
    templates: [
      { name: "Medizingeräte-Investition", category: "strategic", priority: "critical", description: "Investitionsentscheidung für medizinische Großgeräte.", default_duration_days: 30, required_fields: [contextField, budgetField, alternativesField, riskField], approval_steps: [{ role: "decision_maker", label: "Chefarzt", required: true }, { role: "reviewer", label: "Verwaltungsleitung", required: true }] },
      { name: "Medikamenten-Beschaffung neu", category: "operational", priority: "high", description: "Freigabe neuer Medikamente oder Biosimilars.", default_duration_days: 14, required_fields: [contextField, riskField], approval_steps: [{ role: "decision_maker", label: "Chefapotheker", required: true }, { role: "reviewer", label: "Arzneimittelkommission", required: true }] },
      { name: "Behandlungsprotokoll-Änderung", category: "compliance", priority: "high", description: "Änderung klinischer Behandlungsprotokolle.", default_duration_days: 21, required_fields: [contextField, riskField, { key: "evidence_base", label: "Evidenzbasis", type: "textarea", placeholder: "Studien, Leitlinien..." }], approval_steps: [{ role: "decision_maker", label: "Chefarzt", required: true }, { role: "reviewer", label: "Qualitätsmanagement", required: true }] },
      { name: "IT-System Freigabe Patientendaten", category: "compliance", priority: "high", description: "Datenschutz- und Sicherheitsfreigabe für IT-Systeme.", default_duration_days: 14, required_fields: [contextField, riskField, { key: "data_privacy", label: "Datenschutz-Bewertung", type: "textarea", placeholder: "DSGVO-Konformität..." }], approval_steps: [{ role: "decision_maker", label: "IT-Leitung", required: true }, { role: "reviewer", label: "Datenschutzbeauftragter", required: true }] },
      { name: "Lieferantenauswahl Medizinbedarf", category: "operational", priority: "medium", description: "Strukturierte Lieferantenauswahl für Medizinprodukte.", default_duration_days: 21, required_fields: [contextField, alternativesField, budgetField], approval_steps: defaultApproval },
    ],
  },
  automotive: {
    decisions: [
      { title: "PPAP Freigabe: Bremssattel BMW 3er TN: 34.11.6.797.762", description: "Production Part Approval Process, SOP in 14 Tagen.", status: "in_review", priority: "critical", category: "compliance", cost_per_day: 3000, due_date_offset: 14 },
      { title: "8D-Report Reklamation BMW Q-Note 2024-4471", description: "Kundenreklamation, 3D-Frist läuft in 6 Stunden.", status: "open", priority: "critical", category: "compliance", cost_per_day: 5000, due_date_offset: 0 },
      { title: "Änderungsmanagement Serie: Dichtungsring Substitution", description: "Materialsubstitution in laufender Serie.", status: "approved", priority: "high", category: "operational", due_date_offset: -3 },
      { title: "Kapazitätserweiterung: Linie 3 +30% Schicht", description: "Zusätzliche Schicht zur Kapazitätserweiterung.", status: "in_review", priority: "high", category: "strategic", due_date_offset: 10 },
      { title: "Neuer Lieferant Rohstoff: Aluminium-Druckguss", description: "Qualifizierung eines neuen Druckguss-Lieferanten.", status: "in_review", priority: "medium", category: "operational", due_date_offset: 30 },
    ],
    templates: [
      { name: "PPAP Freigabe", category: "compliance", priority: "critical", description: "Production Part Approval Process für Serienanlauf.", default_duration_days: 14, required_fields: [contextField, riskField, { key: "part_number", label: "Teilenummer", type: "text", placeholder: "TN: XX.XX.X.XXX.XXX" }], approval_steps: [{ role: "decision_maker", label: "Qualitätsmanagement", required: true }, { role: "reviewer", label: "Kundenqualität", required: true }] },
      { name: "8D-Report Reklamation", category: "compliance", priority: "critical", description: "Strukturierter 8D-Prozess für Kundenreklamationen.", default_duration_days: 5, required_fields: [contextField, riskField, { key: "root_cause", label: "Root-Cause (5-Why)", type: "textarea", placeholder: "Ursachenanalyse..." }], approval_steps: [{ role: "decision_maker", label: "QM-Leiter", required: true }, { role: "reviewer", label: "Kundenqualität", required: true }] },
      { name: "Änderungsmanagement laufende Serie", category: "operational", priority: "high", description: "Änderungsantrag für laufende Serienproduktion.", default_duration_days: 14, required_fields: [contextField, riskField, alternativesField], approval_steps: [{ role: "decision_maker", label: "Fertigungsleiter", required: true }, { role: "reviewer", label: "QM-Leiter", required: true }] },
      { name: "Kapazitätserweiterung", category: "strategic", priority: "high", description: "Erweiterung der Produktionskapazität.", default_duration_days: 21, required_fields: [contextField, budgetField, riskField], approval_steps: defaultApproval },
      { name: "Neue Lieferanten-Qualifizierung", category: "operational", priority: "medium", description: "Qualifizierung neuer Lieferanten nach Automotive-Standards.", default_duration_days: 45, required_fields: [contextField, riskField, alternativesField], approval_steps: [{ role: "decision_maker", label: "Einkauf", required: true }, { role: "reviewer", label: "QM-Leiter", required: true }] },
    ],
  },
  energie: {
    decisions: [
      { title: "Netzinvestition: Umspannwerk Nord — €4,7M", description: "Erweiterung des Umspannwerks, Regulierungsprüfung läuft.", status: "in_review", priority: "critical", category: "strategic", cost_per_day: 2000, due_date_offset: 21 },
      { title: "IT/OT-System Freigabe: SCADA Update v3.2", description: "KRITIS-relevantes Update der Leittechnik.", status: "in_review", priority: "critical", category: "compliance", escalation_level: 1, due_date_offset: 5 },
      { title: "NIS2-Meldung: Sicherheitsvorfall 08.02.2024", description: "Pflichtmeldung nach NIS2-Richtlinie, fristgerecht eingereicht.", status: "implemented", priority: "critical", category: "compliance", due_date_offset: -14 },
      { title: "Lieferantenwechsel: Transformatoren — Siemens zu ABB", description: "Strategischer Wechsel des Transformatoren-Lieferanten.", status: "in_review", priority: "high", category: "strategic", due_date_offset: 14 },
      { title: "Wartungsmaßnahme: Revision Turbine Block 2", description: "Geplante Revision der Gasturbine.", status: "approved", priority: "high", category: "operational", due_date_offset: 7 },
    ],
    templates: [
      { name: "Netzinvestition Freigabe", category: "strategic", priority: "critical", description: "Investitionsfreigabe für Netzinfrastruktur.", default_duration_days: 30, required_fields: [contextField, budgetField, riskField, { key: "regulatory", label: "Regulatorische Anforderungen", type: "textarea", placeholder: "Genehmigungen, Auflagen..." }], approval_steps: [{ role: "decision_maker", label: "Netzplanung", required: true }, { role: "reviewer", label: "Regulierung", required: true }, { role: "admin", label: "Vorstand", required: true }] },
      { name: "Kritische IT/OT-System Freigabe", category: "compliance", priority: "critical", description: "Freigabe von Updates an KRITIS-relevanten Systemen.", default_duration_days: 7, required_fields: [contextField, riskField], approval_steps: [{ role: "decision_maker", label: "OT-Sicherheit", required: true }, { role: "reviewer", label: "KRITIS-Beauftragter", required: true }] },
      { name: "NIS2-Meldung", category: "compliance", priority: "critical", description: "Pflichtmeldung nach NIS2-Richtlinie.", default_duration_days: 1, required_fields: [contextField, { key: "incident_type", label: "Vorfallsart", type: "text", placeholder: "z.B. Cyberangriff, Systemausfall" }], approval_steps: [{ role: "decision_maker", label: "IT-Sicherheit", required: true }] },
      { name: "Lieferantenwechsel kritische Komponenten", category: "strategic", priority: "high", description: "Wechsel von Lieferanten für kritische Infrastruktur-Komponenten.", default_duration_days: 30, required_fields: [contextField, alternativesField, riskField, budgetField], approval_steps: defaultApproval },
      { name: "Wartungsmaßnahme Freigabe", category: "operational", priority: "high", description: "Freigabe geplanter Wartungs- und Revisionsmaßnahmen.", default_duration_days: 7, required_fields: [contextField, budgetField], approval_steps: [{ role: "decision_maker", label: "Instandhaltungsleiter", required: true }] },
    ],
  },
  oeffentlich: {
    decisions: [
      { title: "Vergabeentscheidung: IT-Infrastruktur Rathaus €890.000", description: "VgV-Verfahren, Angebote liegen vor.", status: "in_review", priority: "high", category: "compliance", cost_per_day: 400, due_date_offset: 14 },
      { title: "Fördermittel-Vergabe: Verein Stadtkultur e.V. €25.000", description: "Prüfung und Bewilligung des Förderantrags.", status: "approved", priority: "medium", category: "operational", due_date_offset: -5 },
      { title: "IT-Beschaffung: Dokumentenmanagementsystem", description: "Evaluation und Vergabe eines DMS.", status: "in_review", priority: "medium", category: "tactical", due_date_offset: 21 },
      { title: "Personalentscheidung: Abteilungsleitung Stadtplanung", description: "Besetzung der vakanten Abteilungsleitung.", status: "draft", priority: "high", category: "operational", due_date_offset: 30 },
      { title: "Baugenehmigung: Erweiterung Grundschule Nord", description: "Genehmigungsverfahren für Schulerweiterung.", status: "open", priority: "medium", category: "operational", due_date_offset: 45 },
    ],
    templates: [
      { name: "Vergabeentscheidung", category: "compliance", priority: "high", description: "Strukturierte Vergabeentscheidung nach VgV.", default_duration_days: 21, required_fields: [contextField, budgetField, alternativesField, { key: "legal_basis", label: "Rechtsgrundlage", type: "text", placeholder: "z.B. VgV, UVgO" }], approval_steps: [{ role: "decision_maker", label: "Vergabestelle", required: true }, { role: "reviewer", label: "Rechtsamt", required: true }] },
      { name: "Fördermittel-Vergabe", category: "operational", priority: "medium", description: "Prüfung und Bewilligung von Fördermittelanträgen.", default_duration_days: 14, required_fields: [contextField, budgetField], approval_steps: [{ role: "decision_maker", label: "Fachamt", required: true }, { role: "reviewer", label: "Kämmerei", required: true }] },
      { name: "IT-Beschaffung Behörde", category: "tactical", priority: "medium", description: "IT-Beschaffung unter Berücksichtigung von EVB-IT.", default_duration_days: 30, required_fields: [contextField, budgetField, alternativesField], approval_steps: defaultApproval },
      { name: "Personalentscheidung öffentlicher Dienst", category: "operational", priority: "high", description: "Stellenbesetzung im öffentlichen Dienst.", default_duration_days: 30, required_fields: [contextField, { key: "stellenplan", label: "Stellenplan-Nummer", type: "text", placeholder: "z.B. ST-2024-047" }], approval_steps: [{ role: "decision_maker", label: "Amtsleitung", required: true }, { role: "reviewer", label: "Personalamt", required: true }] },
      { name: "Baugenehmigung", category: "compliance", priority: "medium", description: "Genehmigungsverfahren für Bauprojekte.", default_duration_days: 45, required_fields: [contextField, { key: "legal_basis", label: "Rechtsgrundlage", type: "text", placeholder: "z.B. BauGB, LBO" }], approval_steps: [{ role: "decision_maker", label: "Bauamt", required: true }] },
    ],
  },
  lebensmittel: {
    decisions: [
      { title: "Neuer Rohstoff: Bio-Dinkelmehl Lieferant Mühlenhof", description: "Allergen-Check und Qualitätsprüfung erforderlich.", status: "in_review", priority: "high", category: "operational", due_date_offset: 7 },
      { title: "Rezeptur-Änderung: Vollkornbrot — Palmöl Substitution", description: "Austausch von Palmöl durch Sonnenblumenöl.", status: "approved", priority: "medium", category: "operational", due_date_offset: -5 },
      { title: "Rückruf-Entscheidung: Charge LB-2024-447 — Listerien-Verdacht", description: "DRINGEND: Verdacht auf Listerien-Kontamination.", status: "in_review", priority: "critical", category: "compliance", escalation_level: 2, cost_per_day: 10000, due_date_offset: 0 },
      { title: "Lieferanten-Audit: Fleischerei Schwarz GmbH", description: "Jährliches Lieferanten-Audit steht an.", status: "in_review", priority: "medium", category: "compliance", due_date_offset: 14 },
      { title: "Neue Produktionslinie Freigabe: Glutenfrei-Linie", description: "Investition in separate glutenfreie Produktionslinie.", status: "draft", priority: "high", category: "strategic", due_date_offset: 30 },
    ],
    templates: [
      { name: "Neuer Rohstoff / Zulieferer", category: "operational", priority: "high", description: "Freigabe neuer Rohstoffe inkl. Allergen-Prüfung.", default_duration_days: 14, required_fields: [contextField, riskField, { key: "allergen_check", label: "Allergen-Prüfung", type: "select", options: [{ value: "pending", label: "Ausstehend" }, { value: "passed", label: "Bestanden" }, { value: "failed", label: "Nicht bestanden" }] }], approval_steps: [{ role: "decision_maker", label: "Qualitätsmanagement", required: true }, { role: "reviewer", label: "Produktionsleitung", required: true }] },
      { name: "Rezeptur-Änderung", category: "operational", priority: "medium", description: "Änderung von Produktrezepturen.", default_duration_days: 14, required_fields: [contextField, riskField], approval_steps: [{ role: "decision_maker", label: "Produktentwicklung", required: true }, { role: "reviewer", label: "Qualitätsmanagement", required: true }] },
      { name: "Rückruf-Entscheidung", category: "compliance", priority: "critical", description: "Notfall-Rückruf bei Lebensmittelsicherheitsrisiko.", default_duration_days: 1, required_fields: [contextField, riskField, { key: "affected_batches", label: "Betroffene Chargen", type: "textarea", placeholder: "Chargennummern..." }], approval_steps: [{ role: "decision_maker", label: "QM-Leiter", required: true }, { role: "reviewer", label: "Geschäftsführung", required: true }] },
      { name: "Lieferanten-Audit Freigabe", category: "compliance", priority: "medium", description: "Freigabe nach Lieferanten-Audit.", default_duration_days: 7, required_fields: [contextField], approval_steps: [{ role: "decision_maker", label: "Qualitätsmanagement", required: true }] },
      { name: "Neue Produktionslinie Freigabe", category: "strategic", priority: "high", description: "Investition in neue Produktionslinien.", default_duration_days: 30, required_fields: [contextField, budgetField, riskField], approval_steps: [{ role: "decision_maker", label: "Produktionsleitung", required: true }, { role: "reviewer", label: "Geschäftsführung", required: true }] },
    ],
  },
  versicherungen: {
    decisions: [
      { title: "Großschaden SN-2024-88471: Betriebsunterbrechung €2,1M", description: "Komplexer Großschaden mit mehreren Beteiligten.", status: "in_review", priority: "critical", category: "operational", cost_per_day: 3000, due_date_offset: 7 },
      { title: "Neues Produkt: Cyberversicherung KMU", description: "Produktentwicklung abgeschlossen, BaFin-Meldung ausstehend.", status: "in_review", priority: "high", category: "compliance", due_date_offset: 14 },
      { title: "Underwriting-Ausnahme: Industrieanlage Sonderrisiko", description: "Risikoakzeptanz außerhalb der Zeichnungsrichtlinien.", status: "in_review", priority: "high", category: "compliance", escalation_level: 1, due_date_offset: 5 },
      { title: "Outsourcing: Schadensregulierung Kfz an extern", description: "Auslagerung der Kfz-Schadensregulierung.", status: "in_review", priority: "medium", category: "strategic", due_date_offset: 21 },
      { title: "Rückversicherungs-Entscheidung: Cat-Bond Renewal", description: "Erneuerung der Katastrophen-Anleihe.", status: "approved", priority: "high", category: "strategic", due_date_offset: -7 },
    ],
    templates: [
      { name: "Großschaden Regulierung", category: "operational", priority: "critical", description: "Strukturierte Regulierung von Großschäden.", default_duration_days: 14, required_fields: [contextField, budgetField, riskField], approval_steps: [{ role: "decision_maker", label: "Schadenregulierer", required: true }, { role: "reviewer", label: "Schadenleitung", required: true }] },
      { name: "Neues Versicherungsprodukt", category: "compliance", priority: "high", description: "Entwicklung und Freigabe neuer Versicherungsprodukte.", default_duration_days: 30, required_fields: [contextField, riskField, { key: "regulatory", label: "BaFin-Meldung", type: "select", options: [{ value: "pending", label: "Ausstehend" }, { value: "submitted", label: "Eingereicht" }, { value: "approved", label: "Genehmigt" }] }], approval_steps: [{ role: "decision_maker", label: "Produktentwicklung", required: true }, { role: "reviewer", label: "Aktuariat", required: true }, { role: "admin", label: "Vorstand", required: true }] },
      { name: "Underwriting-Ausnahme", category: "compliance", priority: "high", description: "Genehmigung von Risiken außerhalb der Zeichnungsrichtlinien.", default_duration_days: 5, required_fields: [contextField, riskField], approval_steps: [{ role: "decision_maker", label: "Underwriter", required: true }, { role: "reviewer", label: "Chief Underwriter", required: true }] },
      { name: "Outsourcing-Entscheidung", category: "strategic", priority: "medium", description: "Auslagerung von Geschäftsprozessen.", default_duration_days: 30, required_fields: [contextField, budgetField, riskField, alternativesField], approval_steps: defaultApproval },
      { name: "Rückversicherungs-Entscheidung", category: "strategic", priority: "high", description: "Abschluss oder Erneuerung von Rückversicherungsverträgen.", default_duration_days: 21, required_fields: [contextField, budgetField, riskField], approval_steps: [{ role: "decision_maker", label: "Rückversicherungsabteilung", required: true }, { role: "reviewer", label: "CFO", required: true }] },
    ],
  },
  bildung: {
    decisions: [
      { title: "Neuer Lehrgang: KI-Grundlagen für Führungskräfte", description: "Curriculum-Entwicklung für neuen Weiterbildungslehrgang.", status: "in_review", priority: "medium", category: "operational", due_date_offset: 14 },
      { title: "IT-Plattform: Microsoft Teams for Education", description: "Evaluierung und Rollout der Lernplattform.", status: "approved", priority: "high", category: "tactical", due_date_offset: -7 },
      { title: "Kooperationsvertrag: TU München Forschungsprojekt", description: "Gemeinsames Forschungsprojekt im Bereich Digitalisierung.", status: "in_review", priority: "medium", category: "strategic", due_date_offset: 21 },
      { title: "Dozenten-Einstellung: Prof. Dr. Schmidt Digitalisierung", description: "Berufung für den Lehrstuhl Digitale Transformation.", status: "draft", priority: "high", category: "operational", due_date_offset: 30 },
      { title: "Prüfungsordnung Änderung: Bachelor BWL 2025", description: "Überarbeitung der Prüfungsordnung, Gremium ausstehend.", status: "open", priority: "medium", category: "compliance", due_date_offset: 45 },
    ],
    templates: [
      { name: "Neuer Lehrgang/Kurs", category: "operational", priority: "medium", description: "Freigabe neuer Lehrgänge und Kurse.", default_duration_days: 21, required_fields: [contextField, budgetField], approval_steps: [{ role: "decision_maker", label: "Studiengangsleitung", required: true }, { role: "reviewer", label: "Dekanat", required: true }] },
      { name: "IT-Plattform Freigabe Lehre", category: "tactical", priority: "high", description: "Freigabe von IT-Plattformen für den Lehrbetrieb.", default_duration_days: 14, required_fields: [contextField, riskField, budgetField], approval_steps: [{ role: "decision_maker", label: "IT-Leitung", required: true }, { role: "reviewer", label: "Datenschutzbeauftragter", required: true }] },
      { name: "Kooperationsvertrag", category: "strategic", priority: "medium", description: "Abschluss von Kooperationsverträgen mit Partnern.", default_duration_days: 30, required_fields: [contextField, budgetField], approval_steps: [{ role: "decision_maker", label: "Institutsleitung", required: true }, { role: "reviewer", label: "Rechtsabteilung", required: true }] },
      { name: "Personalentscheidung Dozent", category: "operational", priority: "high", description: "Berufung und Einstellung von Dozenten.", default_duration_days: 45, required_fields: [contextField], approval_steps: [{ role: "decision_maker", label: "Berufungskommission", required: true }, { role: "reviewer", label: "Senat", required: true }] },
      { name: "Prüfungsordnung Änderung", category: "compliance", priority: "medium", description: "Überarbeitung von Prüfungsordnungen.", default_duration_days: 60, required_fields: [contextField, { key: "legal_basis", label: "Rechtsgrundlage", type: "text", placeholder: "z.B. HochSchG" }], approval_steps: [{ role: "decision_maker", label: "Prüfungsausschuss", required: true }, { role: "reviewer", label: "Senat", required: true }] },
    ],
  },
  nonprofit: {
    decisions: [
      { title: "Projektmittel-Vergabe: Klimaprojekt Kenia €85.000", description: "Evaluation und Bewilligung des Projektantrags.", status: "in_review", priority: "high", category: "operational", due_date_offset: 10 },
      { title: "Fördermittelantrag: EU-Programm Horizon €250.000", description: "Antragstellung beim EU-Förderprogramm.", status: "approved", priority: "high", category: "strategic", due_date_offset: -10 },
      { title: "Partnerorganisation aufnehmen: BUND Ortsgruppe", description: "Aufnahme einer neuen Partnerorganisation.", status: "open", priority: "medium", category: "operational", due_date_offset: 21 },
      { title: "Veranstaltungsbudget: Jahreskonferenz 2024 €35.000", description: "Budgetfreigabe für die jährliche Konferenz.", status: "in_review", priority: "medium", category: "tactical", due_date_offset: 14 },
      { title: "Personalentscheidung: Projektkoordinator Vollzeit", description: "Einstellung eines hauptamtlichen Projektkoordinators.", status: "draft", priority: "medium", category: "operational", due_date_offset: 30 },
    ],
    templates: [
      { name: "Projektmittel-Vergabe", category: "operational", priority: "high", description: "Bewilligung von Projektmitteln und Budgets.", default_duration_days: 14, required_fields: [contextField, budgetField, riskField], approval_steps: [{ role: "decision_maker", label: "Programmleitung", required: true }, { role: "reviewer", label: "Vorstand", required: true }] },
      { name: "Fördermittelantrag", category: "strategic", priority: "high", description: "Vorbereitung und Freigabe von Fördermittelanträgen.", default_duration_days: 30, required_fields: [contextField, budgetField, { key: "funding_source", label: "Fördergeber", type: "text", placeholder: "z.B. EU, BMBF, Stiftung" }], approval_steps: [{ role: "decision_maker", label: "Geschäftsführung", required: true }] },
      { name: "Partnerorganisation aufnehmen", category: "operational", priority: "medium", description: "Aufnahme neuer Partner in das Netzwerk.", default_duration_days: 14, required_fields: [contextField], approval_steps: [{ role: "decision_maker", label: "Vorstand", required: true }] },
      { name: "Veranstaltungsbudget", category: "tactical", priority: "medium", description: "Budgetfreigabe für Veranstaltungen und Events.", default_duration_days: 7, required_fields: [contextField, budgetField], approval_steps: defaultApproval },
      { name: "Personalentscheidung hauptamtlich", category: "operational", priority: "medium", description: "Einstellung hauptamtlicher Mitarbeiter.", default_duration_days: 21, required_fields: [contextField, budgetField], approval_steps: [{ role: "decision_maker", label: "Geschäftsführung", required: true }, { role: "reviewer", label: "Vorstand", required: true }] },
    ],
  },
  allgemein: {
    decisions: [
      { title: "Investitionsfreigabe: Neue Software-Plattform", description: "Evaluation und Beschaffung einer zentralen Plattform.", status: "in_review", priority: "high", category: "strategic", cost_per_day: 500, due_date_offset: 14 },
      { title: "Personalentscheidung: Teamleitung Marketing", description: "Besetzung der vakanten Teamleitungsposition.", status: "open", priority: "medium", category: "operational", due_date_offset: 21 },
      { title: "Lieferantenauswahl: Büroausstattung", description: "Neuausschreibung des Rahmenvertrags.", status: "approved", priority: "low", category: "operational", due_date_offset: -3 },
      { title: "Projektfreigabe: Digitalisierung Verwaltung", description: "Freigabe des Digitalisierungsprojekts Phase 1.", status: "in_review", priority: "high", category: "strategic", due_date_offset: 10 },
      { title: "Strategische Partnerschaft: Kooperationsvertrag", description: "Prüfung eines strategischen Kooperationsvertrags.", status: "draft", priority: "medium", category: "strategic", due_date_offset: 30 },
    ],
    templates: [
      { name: "Investitionsfreigabe", category: "strategic", priority: "high", description: "Allgemeine Investitionsfreigabe mit ROI-Betrachtung.", default_duration_days: 14, required_fields: [contextField, budgetField, alternativesField, riskField], approval_steps: [{ role: "decision_maker", label: "Fachverantwortlicher", required: true }, { role: "reviewer", label: "Geschäftsführung", required: true }] },
      { name: "Personalentscheidung", category: "operational", priority: "high", description: "Strukturierte Personalentscheidung.", default_duration_days: 21, required_fields: [contextField, budgetField], approval_steps: defaultApproval },
      { name: "Lieferantenauswahl", category: "operational", priority: "medium", description: "Strukturierte Lieferantenauswahl und -bewertung.", default_duration_days: 14, required_fields: [contextField, alternativesField, budgetField], approval_steps: defaultApproval },
      { name: "Projektfreigabe", category: "strategic", priority: "high", description: "Freigabe eines neuen Projekts oder einer Projektphase.", default_duration_days: 7, required_fields: [contextField, budgetField, riskField], approval_steps: defaultApproval },
      { name: "Strategische Entscheidung", category: "strategic", priority: "critical", description: "Grundlegende strategische Richtungsentscheidung.", default_duration_days: 30, required_fields: [contextField, alternativesField, riskField, budgetField], approval_steps: [{ role: "decision_maker", label: "Fachverantwortlicher", required: true }, { role: "reviewer", label: "Strategie-Review", required: true }, { role: "admin", label: "Geschäftsführung", required: true }] },
    ],
  },
};

export async function seedIndustryData(
  userId: string,
  industryId: string,
  teamId?: string | null,
): Promise<{ decisionsCount: number; templatesCount: number }> {
  const data = DATA[industryId];
  if (!data) return { decisionsCount: 0, templatesCount: 0 };

  // Seed templates
  const templateRows = data.templates.map(t => ({
    name: t.name,
    slug: slugify(t.name),
    category: t.category,
    priority: t.priority,
    description: t.description,
    default_duration_days: t.default_duration_days,
    required_fields: t.required_fields || [],
    approval_steps: t.approval_steps || [],
    conditional_rules: [],
    is_system: true,
    created_by: userId,
    version: 1,
    industry: industryId,
  }));

  const { error: tplErr } = await supabase
    .from("decision_templates")
    .insert(templateRows as any);

  if (tplErr) console.error("[seedIndustryData] templates error:", tplErr);

  // Seed demo decisions
  const decisionRows = data.decisions.map(d => ({
    title: d.title,
    description: d.description,
    status: d.status,
    priority: d.priority,
    category: d.category,
    created_by: userId,
    owner_id: userId,
    team_id: teamId || null,
    cost_per_day: d.cost_per_day || 0,
    escalation_level: d.escalation_level || 0,
    due_date: d.due_date_offset != null ? offsetDate(d.due_date_offset) : null,
  }));

  const { error: decErr } = await supabase
    .from("decisions")
    .insert(decisionRows as any);

  if (decErr) console.error("[seedIndustryData] decisions error:", decErr);

  return {
    decisionsCount: decisionRows.length,
    templatesCount: templateRows.length,
  };
}
