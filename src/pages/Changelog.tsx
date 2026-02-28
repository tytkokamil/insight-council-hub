import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Zap, Shield, Brain, BarChart3, Users, Calendar, GitBranch } from "lucide-react";
import { motion } from "framer-motion";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "feature" | "improvement" | "security";
  items: string[];
}

const entries: ChangelogEntry[] = [
  {
    version: "1.4.0",
    date: "2026-02-20",
    title: "Intelligence Center & Pattern Engine",
    description: "KI-gestützte Musteranalyse und Bottleneck-Erkennung für datengetriebene Governance.",
    icon: <Brain className="w-4 h-4" />,
    type: "feature",
    items: [
      "Pattern Engine: Erkennt wiederkehrende Entscheidungsmuster automatisch",
      "Bottleneck Intelligence: Identifiziert Engpässe im Entscheidungsprozess",
      "Friction Map: Visualisiert Reibungspunkte zwischen Teams",
      "Health Heatmap: Echtzeit-Gesundheitsstatus aller Entscheidungen",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-02-10",
    title: "Executive Hub & Board Reports",
    description: "Dedizierter Bereich für C-Level mit automatischen Board-Reports und CEO-Briefings.",
    icon: <BarChart3 className="w-4 h-4" />,
    type: "feature",
    items: [
      "Executive Dashboard mit Portfolio-Risiko-Übersicht",
      "Automatische CEO-Briefings (KI-generiert)",
      "Board Report PDF-Export mit Branding",
      "Decision Quality Index (DQI) als Leit-KPI",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-01-28",
    title: "Team Collaboration & Decision Rooms",
    description: "Echtzeit-Zusammenarbeit mit Meeting-Modus, Team-Chat und Abstimmungen.",
    icon: <Users className="w-4 h-4" />,
    type: "feature",
    items: [
      "Decision Rooms für Live-Abstimmungen im Meeting",
      "Team-Chat mit @Mentions und Entscheidungs-Links",
      "Stakeholder Alignment Panel",
      "Smart Reviewer Suggestions (KI-gestützt)",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-01-15",
    title: "Risk Register & Scenario Engine",
    description: "Umfassendes Risikomanagement mit KI-basierter Szenarioanalyse.",
    icon: <Shield className="w-4 h-4" />,
    type: "feature",
    items: [
      "Risk Register mit Likelihood × Impact Matrix",
      "What-If Simulator für Entscheidungsszenarien",
      "Automatische Risiko-Bewertung per KI",
      "Risk-Decision Linking für Traceability",
    ],
  },
  {
    version: "1.0.2",
    date: "2026-01-08",
    title: "Performance & Sicherheits-Updates",
    description: "Optimierte Ladezeiten, RBAC Phase 2 und verbesserte Audit-Trails.",
    icon: <Zap className="w-4 h-4" />,
    type: "improvement",
    items: [
      "Dashboard-Ladezeit deutlich reduziert (Server-Side KPI-Berechnung)",
      "RBAC: Granulare Berechtigungen pro Rolle konfigurierbar",
      "Audit Trail mit vollständiger Versionierung",
      "Rate Limiting für alle API-Endpunkte",
    ],
  },
  {
    version: "1.0.1",
    date: "2025-12-20",
    title: "Automation Rules & SLA Engine",
    description: "Regelbasierte Automatisierung und SLA-Überwachung für konsistente Governance.",
    icon: <GitBranch className="w-4 h-4" />,
    type: "improvement",
    items: [
      "Automation Rules mit Trigger → Condition → Action",
      "SLA-basierte Deadline-Berechnung pro Kategorie/Priorität",
      "Automatische Eskalation bei SLA-Verletzung",
      "Regel-Ausführungsprotokoll im Audit Trail",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-12-01",
    title: "Decivio Launch 🚀",
    description: "Die erste Version von Decivio — Decision Intelligence für wachsende Unternehmen.",
    icon: <Sparkles className="w-4 h-4" />,
    type: "feature",
    items: [
      "Decision Hub mit Lifecycle-Management",
      "KI-Analyse (Risiko, Impact, Optionen)",
      "Team-Management mit rollenbasiertem Zugriff",
      "Dashboard mit Echtzeit-KPIs",
      "Decision Calendar & Timeline",
      "Export (PDF, Excel, ICS)",
      "Deutsch & Englisch (i18n)",
    ],
  },
];

const typeBadge = (type: ChangelogEntry["type"]) => {
  const styles = {
    feature: "bg-primary/10 text-primary border-primary/20",
    improvement: "bg-accent-teal/10 text-accent-teal border-accent-teal/20",
    security: "bg-warning/10 text-warning border-warning/20",
  };
  const labels = { feature: "Feature", improvement: "Verbesserung", security: "Sicherheit" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
};

const Changelog = () => (
  <>
    <Helmet>
      <title>Changelog — Decivio</title>
      <meta name="description" content="Alle Updates und neuen Features von Decivio auf einen Blick." />
    </Helmet>

    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Changelog</h1>
            <p className="text-xs text-muted-foreground">Was gibt es Neues bei Decivio?</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-0 w-px bg-border/50 hidden md:block" />

          <div className="space-y-12">
            {entries.map((entry, i) => (
              <motion.article
                key={entry.version}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="relative md:pl-12"
              >
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background hidden md:block" />

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground/60">{entry.date}</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{entry.version}</span>
                  {typeBadge(entry.type)}
                </div>

                <h2 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
                  <span className="text-primary">{entry.icon}</span>
                  {entry.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>

                <ul className="space-y-1.5">
                  {entry.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
    </div>
  </>
);

export default Changelog;
