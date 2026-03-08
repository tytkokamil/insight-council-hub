import { Factory, Car, Pill, Monitor, Landmark, LucideIcon } from "lucide-react";

export interface IndustryFaq {
  question: string;
  answer: string;
}

export interface IndustryRoiPreset {
  people: number;
  hourlyRate: number;
  delayDays: number;
  openDecisions: number;
}

export interface IndustryLanding {
  slug: string;
  name: string;
  icon: LucideIcon;
  color: string;
  headline: string;
  subheadline: string;
  heroPain: string;
  painPoints: string[];
  useCases: { title: string; description: string }[];
  compliance: string[];
  stats: { value: string; label: string }[];
  testimonial: { name: string; role: string; quote: string };
  metaTitle: string;
  metaDescription: string;
  ctaLabel: string;
  logoBar: string[];
  faqs: IndustryFaq[];
  roiPreset: IndustryRoiPreset;
}

export const industryLandings: IndustryLanding[] = [
  {
    slug: "maschinenbau",
    name: "Maschinenbau",
    icon: Factory,
    color: "hsl(220 45% 50%)",
    headline: "Decision Governance für den Maschinenbau",
    subheadline: "ECOs, Investitionsfreigaben, ISO 9001 — alles in einem System.",
    heroPain: "Engineering Change Orders blockieren die Produktion 4,2 Tage im Schnitt.",
    painPoints: [
      "ECOs bleiben wochenlang in E-Mail-Schleifen hängen — die Produktion steht",
      "Investitionsfreigaben brauchen 5+ Runden bis zur Unterschrift",
      "Audit-Nachweise für ISO 9001 kosten Stunden manueller Dokumentation",
    ],
    useCases: [
      { title: "ECO-Management", description: "Engineering Change Orders mit kryptographischem Audit Trail, automatischer Genehmigungs-Kette und SLA-Überwachung für Zeichnungsfreigaben." },
      { title: "Investitionsfreigabe", description: "Maschineninvestitionen mit Cost-of-Delay Berechnung und mehrstufigem Review-Workflow — sehen Sie in Echtzeit, was die Verzögerung kostet." },
      { title: "IATF 16949 Audit Trail", description: "Lückenlose Dokumentation aller Entscheidungen mit SHA-256-Hash-Kette. Jederzeit export-bereit für Audits." },
    ],
    compliance: ["ISO 9001", "IATF 16949", "VDI 2221", "ISO 13849"],
    stats: [
      { value: "73%", label: "Schnellere ECO-Freigaben" },
      { value: "4,2→1,1", label: "Tage Ø Freigabezeit" },
      { value: "100%", label: "Audit-Trail-Abdeckung" },
    ],
    testimonial: {
      name: "Michael H.",
      role: "Produktionsleiter, Maschinenbau GmbH (85 MA)",
      quote: "Wir haben nicht gewusst, wie viel unsere wochenlangen Freigabeprozesse wirklich kosten. Decivio hat das sichtbar gemacht — und wir konnten sofort handeln.",
    },
    metaTitle: "Decision Governance für den Maschinenbau — ECOs, Investitionsfreigaben, ISO 9001",
    metaDescription: "Engineering Change Orders blockieren die Produktion 4,2 Tage im Schnitt. Decivio automatisiert ECO-Workflows, Investitionsfreigaben und ISO 9001 Audit Trails.",
    ctaLabel: "ECO-Template kostenlos testen",
    logoBar: ["DMG MORI", "Trumpf", "KUKA", "Siemens", "Bosch Rexroth"],
    faqs: [
      { question: "Unterstützt Decivio IATF 16949?", answer: "Ja. Decivio bietet branchenspezifische Templates für IATF 16949 mit automatischem Audit Trail, mehrstufigen Review-Workflows und SHA-256-gesicherten Entscheidungsprotokollen." },
      { question: "Wie schnell können wir ECO-Prozesse umstellen?", answer: "In unter 3 Minuten erstellen Sie Ihre erste Entscheidung. Die Integration bestehender ECO-Workflows dauert typischerweise 1-2 Tage — ohne IT-Projekt." },
      { question: "Wie funktioniert die Integration mit bestehenden PLM-Systemen?", answer: "Decivio bietet Webhooks und API-Anbindung. Entscheidungen können automatisch mit Ihrem PLM synchronisiert werden. Teams-Integration ist direkt verfügbar." },
      { question: "Was kostet Decivio für Maschinenbau-Unternehmen?", answer: "Der Professional Plan kostet €149/Monat für bis zu 25 Nutzer — inkl. ECO-Templates, Audit Trail und KI-Briefings. Kostenloser Test ohne Kreditkarte." },
    ],
    roiPreset: { people: 4, hourlyRate: 85, delayDays: 5, openDecisions: 8 },
  },
  {
    slug: "automotive",
    name: "Automotive",
    icon: Car,
    color: "hsl(200 45% 50%)",
    headline: "PPAP & IATF 16949 Entscheidungsmanagement",
    subheadline: "PPAP Level 1-5 Dokumentation, OEM-spezifische Workflows, lückenloser Audit Trail.",
    heroPain: "PPAP Level 5 mit 18 Pflicht-Dokumenten — manuell nicht beherrschbar.",
    painPoints: [
      "PPAP-Dokumentation verstreut über E-Mails, Ordner und Excel-Listen",
      "OEM-Audits erfordern wochenlange manuelle Vorbereitung",
      "8D-Reports ohne nachvollziehbare Entscheidungshistorie",
    ],
    useCases: [
      { title: "PPAP-Workflow (Level 1-5)", description: "Strukturierte PPAP-Level-Verwaltung mit automatischer Compliance-Prüfung. Alle 18 Pflichtdokumente in einem Workflow." },
      { title: "OEM-spezifische Workflows", description: "Vordefinierte Genehmigungsabläufe für VW, BMW, Mercedes und weitere OEMs — anpassbar an Ihre Kundenanforderungen." },
      { title: "IATF Audit Trail", description: "Kryptographisch gesicherter Audit Trail für jede Entscheidung. Jederzeit export-bereit für IATF 16949 Audits." },
    ],
    compliance: ["IATF 16949", "VDA 6.3", "ISO 9001", "APQP"],
    stats: [
      { value: "68%", label: "Schnellere Genehmigungen" },
      { value: "340k€", label: "Ø CoD-Einsparung/Jahr" },
      { value: "99%", label: "Audit-Bestehensquote" },
    ],
    testimonial: {
      name: "Sandra K.",
      role: "Qualitätsmanagerin, Automotive Zulieferer (240 MA)",
      quote: "Die IATF-Compliance war unser Hauptgrund für Decivio. Jetzt haben wir den Audit Trail, den uns der Prüfer abverlangt hat — ohne Mehraufwand.",
    },
    metaTitle: "PPAP & IATF 16949 Entscheidungsmanagement — Decivio für Automotive",
    metaDescription: "PPAP Level 5 mit 18 Pflichtdokumenten manuell beherrschen? Decivio automatisiert PPAP-Workflows, OEM-Prozesse und IATF 16949 Audit Trails.",
    ctaLabel: "PPAP-Workflow ansehen",
    logoBar: ["Continental", "ZF", "Schaeffler", "Mahle", "Hella"],
    faqs: [
      { question: "Unterstützt Decivio alle PPAP-Level?", answer: "Ja. Decivio bietet Templates für PPAP Level 1 bis 5 mit automatischer Prüfung der Pflichtdokumente je Level. Der Workflow passt sich dynamisch an." },
      { question: "Können wir OEM-spezifische Anforderungen abbilden?", answer: "Absolut. Sie können eigene Templates erstellen oder unsere branchenspezifischen Vorlagen (VW, BMW, Mercedes etc.) anpassen." },
      { question: "Wie hilft Decivio bei IATF-Audits?", answer: "Jede Entscheidung wird automatisch mit SHA-256-Hash, Zeitstempel und Reviewer-Signatur dokumentiert. Der Export für Auditoren ist ein Klick." },
    ],
    roiPreset: { people: 5, hourlyRate: 95, delayDays: 7, openDecisions: 12 },
  },
  {
    slug: "pharma",
    name: "Pharma & Life Sciences",
    icon: Pill,
    color: "hsl(280 40% 55%)",
    headline: "GMP Change Control Software — FDA 21 CFR Part 11 konform",
    subheadline: "QP Pflicht-Reviewer, CAPA-Verknüpfung, elektronische Signatur — alles FDA-ready.",
    heroPain: "Change Control ohne Software: Durchschnittlich 23 Tage — mit Decivio: 6 Tage.",
    painPoints: [
      "Change-Control-Prozesse dauern 23 Tage statt 6 — jeder Tag kostet Geld",
      "CAPA-Maßnahmen ohne nachvollziehbare Freigabekette",
      "GMP-Audits erfordern stundenlange manuelle Zusammenstellung der Evidenz",
    ],
    useCases: [
      { title: "QP Pflicht-Reviewer", description: "Qualified Person als erzwungener Reviewer in der Genehmigungskette. Keine Change-Freigabe ohne QP-Signatur." },
      { title: "CAPA-Verknüpfung", description: "Corrective & Preventive Actions direkt mit Entscheidungen verknüpft. Automatische Eskalation bei SLA-Verletzung." },
      { title: "Elektronische Signatur (FDA-konform)", description: "21 CFR Part 11-konforme Signaturen mit Zeitstempel, Audit Trail und Unveränderlichkeitsnachweis." },
    ],
    compliance: ["GMP", "FDA 21 CFR Part 11", "EU-GMP Annex 11", "ICH Q10"],
    stats: [
      { value: "23→6", label: "Tage Ø Change Control" },
      { value: "100%", label: "FDA-Audit-Readiness" },
      { value: "< 24h", label: "Ø Deviation-Response" },
    ],
    testimonial: {
      name: "Thomas B.",
      role: "QA Director, Pharmaunternehmen (60 MA)",
      quote: "One-Click Approval hat unsere Review-Zeit von 5 Tagen auf 18 Stunden reduziert. Der ROI war nach 3 Wochen sichtbar.",
    },
    metaTitle: "GMP Change Control Software — FDA 21 CFR Part 11 konform",
    metaDescription: "Change Control ohne Software dauert 23 Tage. Decivio reduziert das auf 6 Tage — mit QP-Pflicht-Review, CAPA-Verknüpfung und FDA-konformer e-Signatur.",
    ctaLabel: "Change Control Demo starten",
    logoBar: ["Bayer", "Merck", "Boehringer Ingelheim", "Fresenius", "B. Braun"],
    faqs: [
      { question: "Ist Decivio FDA 21 CFR Part 11 konform?", answer: "Ja. Decivio bietet elektronische Signaturen mit Zeitstempel, kryptographisch gesicherten Audit Trail und Unveränderlichkeitsnachweis — alle Anforderungen von 21 CFR Part 11." },
      { question: "Wie wird die Qualified Person eingebunden?", answer: "Sie können die QP als Pflicht-Reviewer definieren. Keine Entscheidung wird freigegeben, ohne dass die QP elektronisch signiert hat." },
      { question: "Unterstützt Decivio CAPA-Prozesse?", answer: "CAPA-Maßnahmen werden direkt mit Entscheidungen verknüpft. Bei SLA-Verletzungen eskaliert das System automatisch an den zuständigen Prozesseigner." },
      { question: "Können wir Decivio validieren?", answer: "Ja. Wir stellen ein IQ/OQ-Paket bereit und unterstützen bei der CSV-Dokumentation. Der Audit Trail ist jederzeit export-bereit." },
    ],
    roiPreset: { people: 3, hourlyRate: 110, delayDays: 10, openDecisions: 6 },
  },
  {
    slug: "finanzdienstleister",
    name: "Finanzdienstleister",
    icon: Landmark,
    color: "hsl(160 35% 45%)",
    headline: "MaRisk-konforme Kreditentscheidungen — Vier-Augen-Prinzip automatisiert",
    subheadline: "Markt/Marktfolge-Trennung, BaFin-Export und lückenlose Dokumentation.",
    heroPain: "BaFin-Prüfung: Kreditentscheidungsprozesse müssen lückenlos dokumentiert sein.",
    painPoints: [
      "BaFin verlangt lückenlose Dokumentation — manuelle Prozesse haben Lücken",
      "Vier-Augen-Prinzip wird nicht konsequent durchgesetzt",
      "Markt- und Marktfolge-Voten vermischt oder undokumentiert",
    ],
    useCases: [
      { title: "Vier-Augen-Prinzip erzwungen", description: "Systemseitig erzwungenes Vier-Augen-Prinzip: Kein Kreditbeschluss ohne zwei unabhängige Freigaben. Audit-sicher dokumentiert." },
      { title: "Markt/Marktfolge getrennt", description: "Separate Votierung von Markt und Marktfolge in getrennten Review-Schritten. Keine Vermischung, keine Beeinflussung." },
      { title: "BaFin-Export", description: "Ein-Klick-Export aller Kreditentscheidungen mit vollständigem Audit Trail, Zeitstempeln und Signaturen — BaFin-prüfungsfertig." },
    ],
    compliance: ["MaRisk", "KWG", "Solvency II", "DSGVO"],
    stats: [
      { value: "100%", label: "Vier-Augen-Durchsetzung" },
      { value: "< 2h", label: "Ø Kreditentscheidung" },
      { value: "1 Klick", label: "BaFin-Export" },
    ],
    testimonial: {
      name: "Dr. Christina L.",
      role: "Compliance-Leiterin, Finanzdienstleister (150 MA)",
      quote: "Die letzte BaFin-Prüfung war die entspannteste seit Jahren. Alle Kreditentscheidungen waren sofort nachvollziehbar — mit einem Klick exportiert.",
    },
    metaTitle: "MaRisk-konforme Kreditentscheidungen — Vier-Augen-Prinzip automatisiert",
    metaDescription: "BaFin-Prüfung? Decivio automatisiert das Vier-Augen-Prinzip, trennt Markt-/Marktfolge-Voten und exportiert alle Kreditentscheidungen BaFin-konform.",
    ctaLabel: "MaRisk-Demo ansehen",
    logoBar: ["Sparkasse", "Volksbank", "DZ Bank", "Helaba", "LBBW"],
    faqs: [
      { question: "Wie wird das Vier-Augen-Prinzip technisch erzwungen?", answer: "Decivio konfiguriert Genehmigungsketten mit mindestens zwei unabhängigen Reviewern. Das System verhindert technisch, dass eine einzelne Person eine Kreditentscheidung freigeben kann." },
      { question: "Ist die Markt/Marktfolge-Trennung gewährleistet?", answer: "Ja. Markt und Marktfolge geben ihre Voten in getrennten, sequenziellen Review-Schritten ab. Die Voten sind erst nach Abgabe für die andere Seite sichtbar." },
      { question: "Erfüllt der Export BaFin-Anforderungen?", answer: "Der Export enthält alle Entscheidungsdetails, Zeitstempel, Reviewer-Signaturen und den vollständigen Audit Trail mit kryptographischer Verifizierung." },
    ],
    roiPreset: { people: 3, hourlyRate: 120, delayDays: 4, openDecisions: 15 },
  },
  {
    slug: "it-software",
    name: "IT & Software",
    icon: Monitor,
    color: "hsl(250 40% 55%)",
    headline: "Architecture Decision Records & NIS2-Compliance",
    subheadline: "ADR-Template, NIS2-Eskalation, RFC-Workflow — Decision Governance für IT-Teams.",
    heroPain: "ADRs in Confluence gehen unter. NIS2 fordert dokumentierte Sicherheitsentscheidungen.",
    painPoints: [
      "Technische Entscheidungen gehen in Slack und Confluence unter",
      "NIS2 fordert nachweisbar dokumentierte Sicherheitsentscheidungen",
      "Security-Reviews blockieren Releases ohne klare Timelines",
    ],
    useCases: [
      { title: "ADR-Template", description: "Architecture Decision Records mit strukturiertem Review-Workflow, Versionshistorie und automatischer Stakeholder-Benachrichtigung." },
      { title: "NIS2-Eskalation", description: "Automatische Eskalation bei sicherheitsrelevanten Entscheidungen. NIS2-konformer Audit Trail mit Unveränderlichkeitsnachweis." },
      { title: "RFC-Workflow", description: "Request for Change mit Impact-Analyse, mehrstufiger Genehmigung und SLA-Überwachung. GitHub-Integration geplant." },
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
      quote: "Unsere ADRs waren vorher in Confluence verstreut. Jetzt haben wir einen zentralen Ort mit klaren Review-Flows — und NIS2 ist gleich mit abgedeckt.",
    },
    metaTitle: "Architecture Decision Records & NIS2-Compliance — Decivio für IT-Teams",
    metaDescription: "ADRs in Confluence gehen unter. NIS2 fordert dokumentierte Sicherheitsentscheidungen. Decivio liefert ADR-Templates, RFC-Workflows und NIS2-Audit-Readiness.",
    ctaLabel: "ADR-Template kostenlos",
    logoBar: ["SAP", "Telekom", "TeamViewer", "Celonis", "Personio"],
    faqs: [
      { question: "Was unterscheidet Decivio von Confluence für ADRs?", answer: "Confluence speichert Dokumente. Decivio erzwingt Review-Workflows, trackt SLAs und liefert einen kryptographisch gesicherten Audit Trail. ADRs werden nicht nur geschrieben, sondern gelebt." },
      { question: "Wie hilft Decivio bei NIS2-Compliance?", answer: "NIS2 fordert nachweisbare Prozesse für Sicherheitsentscheidungen. Decivio dokumentiert jede Entscheidung mit Zeitstempel, Signatur und Audit Trail — automatisch und unveränderbar." },
      { question: "Ist eine GitHub-Integration verfügbar?", answer: "GitHub-Integration ist auf unserer Roadmap. Aktuell können ADRs über Webhooks mit Ihrem Dev-Workflow verbunden werden." },
      { question: "Wie funktioniert der RFC-Workflow?", answer: "Request for Change mit automatischer Impact-Analyse, konfigurierbaren Genehmigungsstufen und SLA-Überwachung. Bei Fristüberschreitung eskaliert das System automatisch." },
    ],
    roiPreset: { people: 4, hourlyRate: 100, delayDays: 3, openDecisions: 10 },
  },
];

export function getIndustryLanding(slug: string): IndustryLanding | undefined {
  // Support legacy slug
  if (slug === "pharma-medizin") return industryLandings.find(i => i.slug === "pharma");
  if (slug === "finanzdienstleistungen") return industryLandings.find(i => i.slug === "finanzdienstleister");
  return industryLandings.find(i => i.slug === slug);
}
