import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Check, X as XIcon, Minus, ChevronRight } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";

const ease = [0.16, 1, 0.3, 1] as const;

type FeatureStatus = "yes" | "no" | "partial";

interface CompetitorData {
  slug: string;
  name: string;
  heroTitle: string;
  heroSub: string;
  seoTitle: string;
  seoDesc: string;
  features: { label: string; competitor: FeatureStatus; competitorNote?: string; decivio: FeatureStatus; decivioNote?: string }[];
  reasons: { title: string; text: string }[];
  excelHook?: { cols: string[]; row: string[]; missing: string };
  sapNote?: string;
  migration: { step: string; time: string }[];
  ctaRef: string;
}

const competitors: Record<string, CompetitorData> = {
  monday: {
    slug: "monday",
    name: "Monday.com",
    heroTitle: "Monday.com ist für Aufgaben. Decivio ist für Entscheidungen.",
    heroSub: "Projektmanagement und Entscheidungs-Governance sind verschiedene Probleme. Decivio löst das richtige.",
    seoTitle: "Monday.com Alternative für den Mittelstand | Decivio",
    seoDesc: "Monday.com ist für Projektmanagement. Decivio ist für Entscheidungen. CoD-Tracking, Audit Trail, DSGVO. 14 Tage kostenlos.",
    features: [
      { label: "Echtzeit Cost-of-Delay", competitor: "no", decivio: "yes" },
      { label: "Audit Trail (unveränderbar)", competitor: "partial", competitorNote: "teilweise", decivio: "yes", decivioNote: "SHA-256" },
      { label: "Compliance (NIS2/ISO/IATF)", competitor: "no", decivio: "yes" },
      { label: "Externe Reviewer (kein Login)", competitor: "no", decivio: "yes" },
      { label: "KI Daily Brief", competitor: "no", decivio: "yes" },
      { label: "SLA-Automatisierung", competitor: "partial", competitorNote: "teilweise", decivio: "yes" },
      { label: "Preis (ab)", competitor: "partial", competitorNote: "12€/User", decivio: "yes", decivioNote: "49€/Org" },
      { label: "DSGVO / Server DE", competitor: "no", competitorNote: "USA", decivio: "yes", decivioNote: "Frankfurt" },
    ],
    reasons: [
      { title: "Monday kostet pro User — Decivio pro Organisation", text: "Bei 8 Nutzern: Monday ab €96/Mo. Decivio: €59/Mo. Flach." },
      { title: "Monday hat keine Cost-of-Delay Logik", text: "Sie tracken Aufgaben. Decivio misst was Verzögerung kostet." },
      { title: "Monday ist US-Server — Decivio DSGVO-nativ", text: "Für Compliance-pflichtige Branchen: kein Kompromiss." },
    ],
    migration: [
      { step: "Kostenlos registrieren", time: "2 Min" },
      { step: "Branche wählen — Templates sofort nutzbar", time: "1 Min" },
      { step: "CSV-Import Ihrer offenen Themen", time: "5 Min" },
      { step: "Erste Entscheidung anlegen + CoD konfigurieren", time: "7 Min" },
    ],
    ctaRef: "vs-monday",
  },
  jira: {
    slug: "jira",
    name: "Jira",
    heroTitle: "Jira trackt Tickets. Decivio trackt Entscheidungen.",
    heroSub: "Jira ist für Entwicklungsteams. Für unternehmensweite Entscheidungs-Governance brauchen Sie Decivio.",
    seoTitle: "Jira Alternative für Entscheidungen | Decivio",
    seoDesc: "Jira ist für Issue Tracking. Decivio ist für Entscheidungs-Governance. CoD-Tracking, Audit Trail, DSGVO. 14 Tage kostenlos.",
    features: [
      { label: "Echtzeit Cost-of-Delay", competitor: "no", decivio: "yes" },
      { label: "Audit Trail (SHA-256)", competitor: "no", decivio: "yes" },
      { label: "Compliance (NIS2/ISO/IATF)", competitor: "no", decivio: "yes" },
      { label: "Externe Reviewer (kein Login)", competitor: "no", decivio: "yes" },
      { label: "KI Daily Brief", competitor: "no", decivio: "yes" },
      { label: "SLA-Automatisierung", competitor: "partial", competitorNote: "Workflow Rules", decivio: "yes" },
      { label: "Preis (ab)", competitor: "partial", competitorNote: "~8€/User", decivio: "yes", decivioNote: "49€/Org" },
      { label: "DSGVO / Server DE", competitor: "partial", competitorNote: "EU verfügbar", decivio: "yes", decivioNote: "Frankfurt" },
    ],
    reasons: [
      { title: "Jira ist für Software-Teams — nicht für Management-Entscheidungen", text: "Boards und Sprints lösen ein anderes Problem als Investitionsfreigaben und Compliance-Entscheidungen." },
      { title: "Kein Cost-of-Delay, kein Economic Exposure", text: "Jira zeigt Ihnen nicht, was eine offene Entscheidung pro Tag kostet." },
      { title: "Kein Compliance-Audit-Trail", text: "SHA-256 Hash-Chain, GMP, IATF 16949 — das bietet Jira nicht." },
    ],
    migration: [
      { step: "Kostenlos registrieren", time: "2 Min" },
      { step: "Branche wählen — Templates sofort nutzbar", time: "1 Min" },
      { step: "Offene Entscheidungen aus Jira als CSV exportieren", time: "5 Min" },
      { step: "Import + CoD konfigurieren", time: "7 Min" },
    ],
    ctaRef: "vs-jira",
  },
  excel: {
    slug: "excel",
    name: "Excel",
    heroTitle: "Excel ist eine Tabelle. Decivio ist ein Entscheidungssystem.",
    heroSub: "Wer Entscheidungen in Excel trackt hat kein Audit Trail, keine Echtzeit-Kosten und keine automatische Eskalation.",
    seoTitle: "Excel Entscheidungen Alternative | Decivio",
    seoDesc: "Excel ist für Tabellen. Decivio ist für Entscheidungen. CoD-Tracking, Audit Trail, DSGVO. 14 Tage kostenlos.",
    excelHook: {
      cols: ["Entscheidung", "Verantwortlich", "Status", "Datum", "Kommentar"],
      row: ["Zulieferer..", "T. Müller", "Offen", "12.03", "Follow up!!!"],
      missing: "Was fehlt: Kosten. Eskalation. Hash-Chain. SLA.",
    },
    features: [
      { label: "Echtzeit Cost-of-Delay", competitor: "no", decivio: "yes" },
      { label: "Unveränderlicher Audit Trail", competitor: "no", decivio: "yes", decivioNote: "SHA-256" },
      { label: "Automatische Eskalation", competitor: "no", decivio: "yes" },
      { label: "Compliance-Dokumentation", competitor: "no", decivio: "yes" },
      { label: "KI-Analyse", competitor: "no", decivio: "yes" },
      { label: "Externe Reviewer", competitor: "no", decivio: "yes" },
      { label: "Versionierung", competitor: "partial", competitorNote: "manuell", decivio: "yes", decivioNote: "automatisch" },
      { label: "DSGVO / Server DE", competitor: "partial", competitorNote: "je nach Hosting", decivio: "yes", decivioNote: "Frankfurt" },
    ],
    reasons: [
      { title: "Excel hat kein Audit Trail", text: "Wer hat wann was geändert? In Excel wissen Sie es nicht." },
      { title: "Keine Echtzeit-Kosten", text: "Jede offene Entscheidung in Ihrem Excel kostet Geld — unsichtbar." },
      { title: "Keine Automatisierung", text: "Keine SLA-Warnungen, keine Eskalation, keine Benachrichtigungen." },
    ],
    migration: [
      { step: "Kostenlos registrieren", time: "2 Min" },
      { step: "Branche wählen", time: "1 Min" },
      { step: "Excel-Datei als CSV exportieren und importieren", time: "5 Min" },
      { step: "CoD konfigurieren + erste Reviewer einladen", time: "7 Min" },
    ],
    ctaRef: "vs-excel",
  },
  sap: {
    slug: "sap",
    name: "SAP",
    heroTitle: "SAP verwaltet Prozesse. Decivio entscheidet sie.",
    heroSub: "SAP ist für ERP. Für Entscheidungs-Governance außerhalb des ERPs — Change Requests, Investitionsfreigaben, strategische Entscheidungen — brauchen Sie Decivio.",
    seoTitle: "SAP Entscheidungsmanagement Alternative | Decivio",
    seoDesc: "SAP ist für ERP. Decivio ist für Entscheidungs-Governance. CoD-Tracking, Audit Trail, DSGVO. 14 Tage kostenlos.",
    sapNote: "SAP-Integration kommt: Decivio ergänzt SAP — es ersetzt es nicht.",
    features: [
      { label: "Echtzeit Cost-of-Delay", competitor: "no", decivio: "yes" },
      { label: "Entscheidungs-Governance", competitor: "no", competitorNote: "ERP-Fokus", decivio: "yes" },
      { label: "KI Daily Brief", competitor: "no", decivio: "yes" },
      { label: "Compliance Audit Trail", competitor: "partial", competitorNote: "SAP GRC", decivio: "yes", decivioNote: "SHA-256" },
      { label: "Externe Reviewer (kein Login)", competitor: "no", decivio: "yes" },
      { label: "Setup-Zeit", competitor: "partial", competitorNote: "Monate", decivio: "yes", decivioNote: "3 Minuten" },
      { label: "Preis", competitor: "partial", competitorNote: "Enterprise", decivio: "yes", decivioNote: "ab 49€/Mo" },
      { label: "DSGVO / Server DE", competitor: "yes", decivio: "yes", decivioNote: "Frankfurt" },
    ],
    reasons: [
      { title: "SAP hat kein Entscheidungs-Governance Modul", text: "Change Requests, Investitionsfreigaben, strategische Entscheidungen — das ist nicht in SAP." },
      { title: "Setup in Minuten statt Monaten", text: "Decivio ist in 3 Minuten startklar. Kein Berater nötig." },
      { title: "Decivio ergänzt SAP — es ersetzt es nicht", text: "Nutzen Sie beides zusammen. API-Integration geplant." },
    ],
    migration: [
      { step: "Kostenlos registrieren", time: "2 Min" },
      { step: "Branche wählen — Templates sofort nutzbar", time: "1 Min" },
      { step: "Offene Entscheidungen manuell oder per CSV anlegen", time: "10 Min" },
      { step: "Team einladen + CoD konfigurieren", time: "5 Min" },
    ],
    ctaRef: "vs-sap",
  },
  kissflow: {
    slug: "kissflow",
    name: "Kissflow",
    heroTitle: "Kissflow automatisiert Workflows. Decivio steuert Entscheidungen.",
    heroSub: "Kissflow ist ein Workflow-Tool. Für Entscheidungs-Governance mit CoD-Tracking und Compliance brauchen Sie Decivio.",
    seoTitle: "Kissflow Alternative Deutschland DSGVO | Decivio",
    seoDesc: "Kissflow ist für Workflows. Decivio ist für Entscheidungen. CoD-Tracking, Audit Trail, DSGVO. 14 Tage kostenlos.",
    features: [
      { label: "Echtzeit Cost-of-Delay", competitor: "no", decivio: "yes" },
      { label: "Audit Trail (SHA-256)", competitor: "no", decivio: "yes" },
      { label: "Compliance (NIS2/ISO/IATF)", competitor: "no", decivio: "yes" },
      { label: "KI-Analyse", competitor: "no", decivio: "yes" },
      { label: "Externe Reviewer", competitor: "no", decivio: "yes" },
      { label: "Workflow Automation", competitor: "yes", decivio: "yes" },
      { label: "Preis (ab)", competitor: "partial", competitorNote: "ab $1500/Mo", decivio: "yes", decivioNote: "49€/Org" },
      { label: "DSGVO / Server DE", competitor: "no", competitorNote: "USA", decivio: "yes", decivioNote: "Frankfurt" },
    ],
    reasons: [
      { title: "Kissflow kostet ab $1.500/Monat", text: "Decivio: ab €49/Mo für die ganze Organisation." },
      { title: "Keine DSGVO-native Lösung", text: "Kissflow-Server in den USA. Decivio: Frankfurt, ISO 27001." },
      { title: "Kein Cost-of-Delay", text: "Workflows automatisieren reicht nicht — Sie müssen wissen, was Verzögerung kostet." },
    ],
    migration: [
      { step: "Kostenlos registrieren", time: "2 Min" },
      { step: "Branche wählen — Templates sofort nutzbar", time: "1 Min" },
      { step: "Entscheidungen anlegen", time: "5 Min" },
      { step: "Automationen konfigurieren", time: "7 Min" },
    ],
    ctaRef: "vs-kissflow",
  },
};

const StatusIcon = ({ status, note }: { status: FeatureStatus; note?: string }) => {
  if (status === "yes") return <span className="flex items-center gap-1 text-green-600"><Check className="w-4 h-4" />{note && <span className="text-xs">{note}</span>}</span>;
  if (status === "no") return <span className="flex items-center gap-1 text-red-400"><XIcon className="w-4 h-4" />{note && <span className="text-xs text-gray-500">{note}</span>}</span>;
  return <span className="flex items-center gap-1 text-amber-500"><Minus className="w-4 h-4" />{note && <span className="text-xs text-gray-500">{note}</span>}</span>;
};

const CompetitorComparison = () => {
  const { slug } = useParams<{ slug: string }>();
  const data = competitors[slug || ""];

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Seite nicht gefunden</h1>
          <Link to="/" className="text-blue-600 hover:underline">Zur Startseite</Link>
        </div>
      </div>
    );
  }

  const month = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <>
      <Helmet>
        <title>{data.seoTitle}</title>
        <meta name="description" content={data.seoDesc} />
        <link rel="canonical" href={`https://decivio.com/vs/${data.slug}`} />
      </Helmet>

      <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
        {/* Nav */}
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded" />
              <span className="font-semibold text-sm text-gray-900">Decivio</span>
            </Link>
            <Link to="/auth" className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: "#1E3A5F" }}>
              Kostenlos starten
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4"
            >
              {data.heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease }}
              className="text-base md:text-lg text-gray-500 max-w-xl mx-auto"
            >
              {data.heroSub}
            </motion.p>
            {data.sapNote && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 text-sm font-medium text-blue-600"
              >
                {data.sapNote}
              </motion.p>
            )}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 pb-16">
          {/* Excel hook */}
          {data.excelHook && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-gray-200 bg-white p-6 mb-10"
            >
              <p className="text-sm font-semibold text-gray-900 mb-4">Diese Spalten haben Sie wahrscheinlich in Ihrer Excel-Tabelle:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      {data.excelHook.cols.map(c => <th key={c} className="py-2 px-3 text-left font-semibold text-gray-600 border-b border-gray-200">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {data.excelHook.row.map((c, i) => <td key={i} className="py-2 px-3 text-gray-700 border-b border-gray-100">{c}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm font-semibold text-red-600 mt-4">{data.excelHook.missing}</p>
            </motion.div>
          )}

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-10"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Funktion</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">{data.name}</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-green-700 uppercase bg-green-50">Decivio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.features.map((f, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{f.label}</td>
                      <td className="py-3 px-4 text-center"><StatusIcon status={f.competitor} note={f.competitorNote} /></td>
                      <td className="py-3 px-4 text-center bg-green-50/30"><StatusIcon status={f.decivio} note={f.decivioNote} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 p-3 border-t border-gray-50">
              Stand: {month}. Für aktuelle Preise: {data.name.toLowerCase().replace(/\s/g, "")}.com/pricing
            </p>
          </motion.div>

          {/* Why switch */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Warum wechseln?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {data.reasons.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease }}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{r.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Migration */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Wechsel von {data.name} in 15 Minuten</h2>
            <div className="space-y-4">
              {data.migration.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: "#1E3A5F" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-gray-900">{s.step}</p>
                    <p className="text-xs text-gray-400">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-8">
            <Link
              to={`/auth?ref=${data.ctaRef}`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "#1E3A5F" }}
            >
              Jetzt wechseln — kostenlos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompetitorComparison;
