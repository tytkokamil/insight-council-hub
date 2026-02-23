import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, GitBranch, AlertTriangle, TrendingUp, BarChart3,
  Shield, Clock, Target, Zap, CheckCircle2, XOctagon, Sparkles,
} from "lucide-react";

const features = [
  {
    id: "ai-copilot", label: "KI Co-Pilot", icon: Brain,
    title: "Decision Co-Pilot mit Explainability",
    description: "Automatische Risikoanalyse, Reviewer-Vorschläge und Delegations-Empfehlungen. Jede KI-Bewertung zeigt Confidence-Level, Einflussfaktoren und Datengrundlage.",
    preview: "copilot",
  },
  {
    id: "decision-graph", label: "Decision Graph", icon: GitBranch,
    title: "Abhängigkeiten & Kaskadeneffekte",
    description: "Visualisiere Entscheidungs-Netzwerke mit allen Abhängigkeiten. Erkenne kritische Pfade und blockierende Entscheidungen bevor sie Projekte verzögern.",
    preview: "graph",
  },
  {
    id: "war-room", label: "War Room", icon: Zap,
    title: "Krisenmanagement in Echtzeit",
    description: "Bündelt kritische Entscheidungen nach Priorität: Eskalationen → Überfällige → Ausstehende Reviews → Blockierte Tasks.",
    preview: "warroom",
  },
  {
    id: "scenario-engine", label: "Szenario Engine", icon: TrendingUp,
    title: "What-If Simulationen mit KI",
    description: "Drei automatisch generierte Handlungsoptionen mit Pro/Contra, ROI-Schätzung und Confidence Score.",
    preview: "scenarios",
  },
  {
    id: "escalation", label: "Auto-Eskalation", icon: AlertTriangle,
    title: "SLA-gesteuerte Eskalations-Engine",
    description: "Konfigurierbare Eskalationsstufen pro Kategorie und Priorität. Automatische Reassignment und Executive Alerts.",
    preview: "escalation",
  },
  {
    id: "analytics", label: "Deep Analytics", icon: BarChart3,
    title: "Bottleneck Intelligence & Cost Radar",
    description: "Heatmaps für Status × Team, Cost-of-Delay Prognosen und 60-Sekunden Management-Übersicht.",
    preview: "analytics",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Mini preview components ─── */

const CopilotPreview = () => (
  <div className="space-y-3">
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl border border-border/50 bg-card/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold">Analyse</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">High Confidence</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Risiko", value: "32%" },
          { label: "Impact", value: "Hoch" },
          { label: "Ablehn.", value: "12%" },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="text-center p-2 rounded-md bg-muted/50">
            <div className="text-sm font-bold font-display">{m.value}</div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="p-3 rounded-lg border border-border bg-card">
      <div className="flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Reviewer-Vorschlag:</span> Engineering-Lead — +34% Erfolgsrate mit technischem Review.
        </p>
      </div>
    </motion.div>
  </div>
);

const GraphPreview = () => (
  <div className="relative h-44">
    <svg className="absolute inset-0 w-full h-full">
      {[
        ["18%", "30%", "45%", "15%"],
        ["45%", "15%", "75%", "25%"],
        ["18%", "30%", "35%", "70%"],
        ["45%", "15%", "60%", "60%"],
        ["75%", "25%", "85%", "70%"],
      ].map(([x1, y1, x2, y2], i) => (
        <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} />
      ))}
    </svg>
    {[
      { x: "10%", y: "18%", label: "Budget Q4" },
      { x: "38%", y: "3%", label: "Hiring" },
      { x: "68%", y: "13%", label: "Tech Stack" },
      { x: "28%", y: "58%", label: "Marketing" },
      { x: "55%", y: "48%", label: "Expansion" },
      { x: "78%", y: "58%", label: "Partner" },
    ].map((node, i) => (
      <motion.div key={node.label} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 200 }} className="absolute" style={{ left: node.x, top: node.y }}>
        <div className="px-3 py-1.5 rounded-md border border-border bg-card text-[10px] font-medium whitespace-nowrap">
          {node.label}
        </div>
      </motion.div>
    ))}
  </div>
);

const WarRoomPreview = () => (
  <div className="space-y-2">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
      <span className="text-xs font-semibold text-destructive">3 Kritisch</span>
      <span className="ml-auto text-[10px] text-destructive/70 font-mono">LIVE</span>
    </motion.div>
    {[
      { title: "Server Migration", time: "2h überfällig", icon: XOctagon, critical: true },
      { title: "Vendor Vertrag", time: "Deadline heute", icon: AlertTriangle, critical: false },
      { title: "Security Patch", time: "Eskaliert", icon: Shield, critical: true },
    ].map((item, i) => (
      <motion.div key={item.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card">
        <item.icon className={`w-4 h-4 shrink-0 ${item.critical ? "text-destructive" : "text-warning"}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.title}</div>
          <div className="text-[10px] text-muted-foreground">{item.time}</div>
        </div>
      </motion.div>
    ))}
  </div>
);

const ScenariosPreview = () => (
  <div className="space-y-2.5">
    {[
      { title: "Best Case", prob: "35%", impact: "+€2.4M", positive: true },
      { title: "Base Case", prob: "50%", impact: "+€800K", positive: true },
      { title: "Worst Case", prob: "15%", impact: "-€400K", positive: false },
    ].map((s, i) => (
      <motion.div key={s.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{s.title}</span>
          <span className={`text-xs font-semibold font-mono ${s.positive ? "text-success" : "text-destructive"}`}>{s.impact}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div className={`h-full rounded-full ${s.positive ? "bg-foreground/30" : "bg-destructive/40"}`} initial={{ width: 0 }} animate={{ width: s.prob }} transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }} />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono w-8">{s.prob}</span>
        </div>
      </motion.div>
    ))}
  </div>
);

const EscalationPreview = () => (
  <div className="space-y-2.5">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
      {[1, 2, 3, 4].map((level) => (
        <motion.div key={level} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + level * 0.1, type: "spring" }} className={`flex-1 h-1.5 rounded-full ${level <= 3 ? "bg-warning/50" : "bg-muted"}`} />
      ))}
      <span className="text-xs text-muted-foreground font-mono ml-1">L3</span>
    </motion.div>
    {[
      { time: "Tag 1", action: "Erinnerung an Assignee", done: true },
      { time: "Tag 3", action: "Eskalation an Team-Lead", done: true },
      { time: "Tag 5", action: "Eskalation an VP", done: true },
      { time: "Tag 7", action: "Executive Alert", done: false },
    ].map((step, i) => (
      <motion.div key={step.time} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-foreground/5" : "bg-muted"}`}>
          {step.done ? <CheckCircle2 className="w-3 h-3 text-foreground/40" /> : <Clock className="w-3 h-3 text-muted-foreground/40" />}
        </div>
        <span className={`text-xs flex-1 ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.action}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{step.time}</span>
      </motion.div>
    ))}
  </div>
);

const AnalyticsPreview = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Avg. Zykluszeit", value: "4.2d", change: "-23%", positive: true },
        { label: "Bottleneck", value: "Review", change: "3.1x", positive: false },
      ].map((m, i) => (
        <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="p-3 rounded-lg border border-border bg-card">
          <div className="text-[10px] text-muted-foreground mb-1">{m.label}</div>
          <div className="text-sm font-bold font-display">{m.value}</div>
          <div className={`text-[10px] font-medium ${m.positive ? "text-success" : "text-destructive"}`}>{m.change}</div>
        </motion.div>
      ))}
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-end gap-[3px] h-14 px-1">
      {[35, 52, 40, 68, 45, 72, 58, 80, 65, 90, 75, 85].map((h, i) => (
        <motion.div key={i} className="flex-1 rounded-sm bg-foreground/10" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
      ))}
    </motion.div>
  </div>
);

const previewMap: Record<string, React.FC> = {
  copilot: CopilotPreview,
  graph: GraphPreview,
  warroom: WarRoomPreview,
  scenarios: ScenariosPreview,
  escalation: EscalationPreview,
  analytics: AnalyticsPreview,
};

const FeaturesSection = () => {
  const [active, setActive] = useState(0);
  const current = features[active];
  const Preview = previewMap[current.preview];

  return (
    <section className="py-32 relative bg-muted/30">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">Governance Engine</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] max-w-3xl">
              Nicht nur Tracking — volle Kontrolle.
            </h2>
          </motion.div>

          {/* Feature showcase */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              {/* Tabs — clean, no bg */}
              <div className="flex overflow-x-auto border-b border-border">
                {features.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setActive(i)}
                    className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                      i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <f.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{f.label}</span>
                    {i === active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-px bg-foreground"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-10 flex flex-col justify-center md:border-r border-border">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight">{current.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{current.description}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="p-6 md:p-8 min-h-[280px] flex items-center">
                  <div className="w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {Preview && <Preview />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature tags */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-10 flex flex-wrap gap-2"
          >
            {[
              "CEO Briefing", "Decision DNA", "Health Heatmap", "Predictive Timeline",
              "Friction Map", "Benchmarking", "Audit Trail", "Strategy Alignment",
              "Review Delegation", "Template Engine", "Board Pack Export",
            ].map((badge) => (
              <span
                key={badge}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-200 cursor-default"
              >
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
