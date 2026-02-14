import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, GitBranch, AlertTriangle, TrendingUp, BarChart3, Sparkles,
  Shield, Clock, Target, Zap, ArrowRight, CheckCircle2, XOctagon,
} from "lucide-react";

const features = [
  {
    id: "ai-copilot",
    label: "KI Co-Pilot",
    icon: Brain,
    title: "KI-gestützter Decision Co-Pilot",
    description:
      "Dein persönlicher KI-Berater analysiert jede Entscheidung in Echtzeit — Risiko-Score, Erfolgswahrscheinlichkeit, und konkrete Handlungsempfehlungen.",
    preview: "copilot",
  },
  {
    id: "decision-graph",
    label: "Decision Graph",
    icon: GitBranch,
    title: "Visuelle Entscheidungs-Netzwerke",
    description:
      "Sieh wie deine Entscheidungen zusammenhängen. Identifiziere Abhängigkeiten, kritische Pfade und Kaskadeneffekte bevor sie zum Problem werden.",
    preview: "graph",
  },
  {
    id: "war-room",
    label: "War Room",
    icon: Zap,
    title: "Krisenmanagement in Echtzeit",
    description:
      "Wenn es brennt, zählt jede Sekunde. Der War Room bündelt kritische Entscheidungen, eskaliert automatisch und koordiniert dein Team.",
    preview: "warroom",
  },
  {
    id: "scenario-engine",
    label: "Szenario Engine",
    icon: TrendingUp,
    title: "What-If Simulationen",
    description:
      "Simuliere verschiedene Szenarien und deren Auswirkungen bevor du dich festlegst. Die KI berechnet Wahrscheinlichkeiten und Outcomes.",
    preview: "scenarios",
  },
  {
    id: "escalation",
    label: "Auto-Eskalation",
    icon: AlertTriangle,
    title: "Intelligente Eskalations-Engine",
    description:
      "Überfällige Entscheidungen werden automatisch eskaliert. Regeln, Schwellenwerte und Benachrichtigungen — alles konfigurierbar.",
    preview: "escalation",
  },
  {
    id: "analytics",
    label: "Deep Analytics",
    icon: BarChart3,
    title: "Bottleneck & Opportunity Cost Radar",
    description:
      "Finde heraus wo Entscheidungen steckenbleiben, was sie kosten, und wo die größten Optimierungspotenziale liegen.",
    preview: "analytics",
  },
];

/* ─── Mini preview components ─── */

const CopilotPreview = () => (
  <div className="space-y-3">
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-3 rounded-xl bg-primary/5 border border-primary/15">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary">KI-Analyse aktiv</span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Risiko", value: "32%", color: "text-success" },
          { label: "Impact", value: "Hoch", color: "text-warning" },
          { label: "Erfolg", value: "87%", color: "text-primary" },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="text-center p-2 rounded-lg bg-card border border-border">
            <div className={`text-lg font-bold font-display ${m.color}`}>{m.value}</div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="p-3 rounded-xl bg-muted/30 border border-border">
      <div className="flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Empfehlung:</span> Hole vor der Umsetzung Feedback vom Engineering-Team ein.
          Ähnliche Entscheidungen hatten +34% Erfolgsrate mit technischem Review.
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
      { x: "10%", y: "18%", label: "Budget Q4", color: "bg-success/10 text-success border-success/15" },
      { x: "38%", y: "3%", label: "Hiring", color: "bg-warning/10 text-warning border-warning/15" },
      { x: "68%", y: "13%", label: "Tech Stack", color: "bg-primary/10 text-primary border-primary/15" },
      { x: "28%", y: "58%", label: "Marketing", color: "bg-accent/10 text-accent border-accent/15" },
      { x: "55%", y: "48%", label: "Expansion", color: "bg-destructive/10 text-destructive border-destructive/15" },
      { x: "78%", y: "58%", label: "Partner", color: "bg-primary/10 text-primary border-primary/15" },
    ].map((node, i) => (
      <motion.div key={node.label} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 200 }} className="absolute" style={{ left: node.x, top: node.y }}>
        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-medium whitespace-nowrap ${node.color}`}>
          {node.label}
        </div>
      </motion.div>
    ))}
  </div>
);

const WarRoomPreview = () => (
  <div className="space-y-2.5">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/15">
      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
      <span className="text-xs font-semibold text-destructive">3 Kritische Entscheidungen</span>
      <span className="ml-auto text-[10px] text-destructive/70">LIVE</span>
    </motion.div>
    {[
      { title: "Server Migration", urgency: "Kritisch", time: "2h überfällig", icon: XOctagon, color: "text-destructive" },
      { title: "Vendor Vertrag", urgency: "Hoch", time: "Deadline heute", icon: AlertTriangle, color: "text-warning" },
      { title: "Security Patch", urgency: "Kritisch", time: "Eskaliert", icon: Shield, color: "text-destructive" },
    ].map((item, i) => (
      <motion.div key={item.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
        <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.title}</div>
          <div className="text-[10px] text-muted-foreground">{item.time}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.urgency === "Kritisch" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
          {item.urgency}
        </span>
      </motion.div>
    ))}
  </div>
);

const ScenariosPreview = () => (
  <div className="space-y-2.5">
    {[
      { title: "Best Case", prob: "35%", impact: "+€2.4M", color: "text-success", bg: "bg-success/5 border-success/15" },
      { title: "Base Case", prob: "50%", impact: "+€800K", color: "text-primary", bg: "bg-primary/5 border-primary/15" },
      { title: "Worst Case", prob: "15%", impact: "-€400K", color: "text-destructive", bg: "bg-destructive/5 border-destructive/15" },
    ].map((s, i) => (
      <motion.div key={s.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className={`p-3 rounded-xl border ${s.bg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">{s.title}</span>
          <span className={`text-xs font-semibold ${s.color}`}>{s.impact}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div className={`h-full rounded-full ${s.color === "text-success" ? "bg-success" : s.color === "text-primary" ? "bg-primary" : "bg-destructive"}`} initial={{ width: 0 }} animate={{ width: s.prob }} transition={{ delay: 0.4 + i * 0.12, duration: 0.8 }} />
          </div>
          <span className="text-xs text-muted-foreground font-mono w-8">{s.prob}</span>
        </div>
      </motion.div>
    ))}
  </div>
);

const EscalationPreview = () => (
  <div className="space-y-2.5">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
      {[1, 2, 3, 4].map((level) => (
        <motion.div key={level} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + level * 0.1, type: "spring" }} className={`flex-1 h-2 rounded-full ${level <= 3 ? "bg-warning" : "bg-muted"}`} />
      ))}
      <span className="text-xs text-warning font-semibold ml-1">Level 3</span>
    </motion.div>
    {[
      { time: "Tag 1", action: "Erinnerung an Assignee", done: true },
      { time: "Tag 3", action: "Eskalation an Team-Lead", done: true },
      { time: "Tag 5", action: "Eskalation an VP", done: true },
      { time: "Tag 7", action: "Executive Alert", done: false },
    ].map((step, i) => (
      <motion.div key={step.time} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-warning/10" : "bg-muted"}`}>
          {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-warning" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.action}</div>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{step.time}</span>
      </motion.div>
    ))}
  </div>
);

const AnalyticsPreview = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Avg. Zykluszeit", value: "4.2 Tage", change: "-23%", positive: true },
        { label: "Bottleneck-Score", value: "Review Phase", change: "3.1x länger", positive: false },
      ].map((m, i) => (
        <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="p-2.5 rounded-xl bg-card border border-border">
          <div className="text-[10px] text-muted-foreground mb-1">{m.label}</div>
          <div className="text-sm font-bold">{m.value}</div>
          <div className={`text-[10px] font-medium ${m.positive ? "text-success" : "text-destructive"}`}>{m.change}</div>
        </motion.div>
      ))}
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-end gap-1 h-16 px-1">
      {[35, 52, 40, 68, 45, 72, 58, 80, 65, 90, 75, 85].map((h, i) => (
        <motion.div key={i} className="flex-1 rounded-sm bg-primary/15" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
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
    <section id="features" className="py-32 relative">
      <div className="absolute inset-0 mesh-gradient opacity-40" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">Power Features</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Nicht nur Tracking —
            <span className="gradient-text block mt-1">echte Entscheidungs-Intelligenz</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Von KI-gestützter Analyse bis zur automatischen Eskalation — alles was Enterprise-Teams brauchen.
          </p>
        </motion.div>

        {/* Interactive feature showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-elevated">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-border bg-muted/20">
              {features.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setActive(i)}
                  className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    i === active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{f.label}</span>
                  {i === active && (
                    <motion.div
                      layoutId="activeFeatureTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-0">
              {/* Description */}
              <div className="p-8 md:p-10 flex flex-col justify-center border-r border-border">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <current.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl md:text-2xl font-bold mb-3 tracking-tight">
                      {current.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {current.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-primary font-medium cursor-pointer group">
                      <span>Mehr erfahren</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Preview */}
              <div className="p-6 md:p-8 bg-muted/10 min-h-[280px] flex items-center">
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      {Preview && <Preview />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {[
            "CEO Briefing", "Decision DNA", "Health Heatmap", "Predictive Timeline",
            "Friction Map", "Benchmarking", "Audit Trail", "Strategy Alignment",
          ].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 border border-border text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
