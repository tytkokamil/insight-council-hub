import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, GitBranch, AlertTriangle, TrendingUp, BarChart3,
  Shield, Clock, Target, Zap, ArrowRight, CheckCircle2, XOctagon, Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const accentStyles: Record<string, { bg: string; text: string }> = {
  "accent-violet": { bg: "bg-accent-violet/10", text: "text-accent-violet" },
  "accent-blue": { bg: "bg-accent-blue/10", text: "text-accent-blue" },
  "accent-rose": { bg: "bg-accent-rose/10", text: "text-accent-rose" },
  "accent-teal": { bg: "bg-accent-teal/10", text: "text-accent-teal" },
  "accent-amber": { bg: "bg-accent-amber/10", text: "text-accent-amber" },
  "primary": { bg: "bg-primary/10", text: "text-primary" },
};

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Mini preview components ─── */

const CopilotPreview = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-3 rounded-xl bg-accent-violet/5 border border-accent-violet/15">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-accent-violet" />
          <span className="text-xs font-semibold text-foreground">{t("landing.features.aiAnalysisActive")}</span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-violet/50 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("landing.features.risk"), value: "32%" },
            { label: t("landing.features.impact"), value: t("landing.features.high") },
            { label: t("landing.features.success"), value: "87%" },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="text-center p-2 rounded-lg bg-card border border-border">
              <div className="text-lg font-bold tabular-nums">{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent-violet mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">{t("landing.features.recommendation")}</span> {t("landing.features.recommendationText")}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const GraphPreview = () => (
  <div className="relative h-44">
    <svg className="absolute inset-0 w-full h-full">
      {[["18%", "30%", "45%", "15%"], ["45%", "15%", "75%", "25%"], ["18%", "30%", "35%", "70%"], ["45%", "15%", "60%", "60%"], ["75%", "25%", "85%", "70%"]].map(([x1, y1, x2, y2], i) => (
        <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--accent-blue) / 0.3)" strokeWidth="1.5" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} />
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
        <div className="px-3 py-1.5 rounded-lg border border-accent-blue/20 bg-accent-blue/5 text-[10px] font-medium whitespace-nowrap">{node.label}</div>
      </motion.div>
    ))}
  </div>
);

const WarRoomPreview = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2.5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/15">
        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-xs font-semibold text-destructive">{t("landing.features.criticalDecisions")}</span>
        <span className="ml-auto text-[10px] text-destructive/70">{t("landing.features.live")}</span>
      </motion.div>
      {[
        { title: t("landing.features.serverMigration"), urgency: t("landing.features.critical"), time: t("landing.features.overdue2h"), icon: XOctagon, color: "text-destructive" },
        { title: t("landing.features.vendorContract"), urgency: t("landing.features.highUrgency"), time: t("landing.features.deadlineToday"), icon: AlertTriangle, color: "text-warning" },
        { title: t("landing.features.securityPatch"), urgency: t("landing.features.critical"), time: t("landing.features.escalated"), icon: Shield, color: "text-destructive" },
      ].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
          <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{item.title}</div>
            <div className="text-[10px] text-muted-foreground">{item.time}</div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.urgency === t("landing.features.critical") ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{item.urgency}</span>
        </motion.div>
      ))}
    </div>
  );
};

const ScenariosPreview = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2.5">
      {[
        { title: t("landing.features.bestCase"), prob: "35%", impact: "+€2.4M", color: "text-success", bar: "bg-success" },
        { title: t("landing.features.baseCase"), prob: "50%", impact: "+€800K", color: "text-foreground", bar: "bg-foreground/40" },
        { title: t("landing.features.worstCase"), prob: "15%", impact: "-€400K", color: "text-destructive", bar: "bg-destructive" },
      ].map((s, i) => (
        <motion.div key={s.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">{s.title}</span>
            <span className={`text-xs font-semibold tabular-nums ${s.color}`}>{s.impact}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div className={`h-full rounded-full ${s.bar}`} initial={{ width: 0 }} animate={{ width: s.prob }} transition={{ delay: 0.4 + i * 0.12, duration: 0.8 }} />
            </div>
            <span className="text-xs text-muted-foreground font-mono w-8">{s.prob}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const EscalationPreview = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2.5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
        {[1, 2, 3, 4].map((level) => (
          <motion.div key={level} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + level * 0.1, type: "spring" }} className={`flex-1 h-2 rounded-full ${level <= 3 ? "bg-accent-amber/40" : "bg-muted"}`} />
        ))}
        <span className="text-xs text-muted-foreground font-semibold ml-1">{t("landing.features.level3")}</span>
      </motion.div>
      {[
        { time: t("landing.features.day1"), action: t("landing.features.reminderAssignee"), done: true },
        { time: t("landing.features.day3"), action: t("landing.features.escalationTeamLead"), done: true },
        { time: t("landing.features.day5"), action: t("landing.features.escalationVP"), done: true },
        { time: t("landing.features.day7"), action: t("landing.features.executiveAlert"), done: false },
      ].map((step, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-accent-amber/15" : "bg-muted"}`}>
            {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-amber" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.action}</div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{step.time}</span>
        </motion.div>
      ))}
    </div>
  );
};

const AnalyticsPreview = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: t("landing.features.avgCycleTime"), value: t("landing.features.days42"), change: t("landing.features.minus23"), positive: true },
          { label: t("landing.features.bottleneckScore"), value: t("landing.features.reviewPhase"), change: t("landing.features.longerReview"), positive: false },
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
          <motion.div key={i} className="flex-1 rounded-sm bg-primary/20" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
        ))}
      </motion.div>
    </div>
  );
};

const previewMap: Record<string, React.FC> = {
  copilot: CopilotPreview,
  graph: GraphPreview,
  warroom: WarRoomPreview,
  scenarios: ScenariosPreview,
  escalation: EscalationPreview,
  analytics: AnalyticsPreview,
};

const FeaturesSection = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);

  const features = [
    { id: "ai-copilot", label: t("landing.features.copilotLabel"), icon: Brain, title: t("landing.features.copilotTitle"), description: t("landing.features.copilotDesc"), preview: "copilot", accent: "accent-violet" },
    { id: "decision-graph", label: t("landing.features.graphLabel"), icon: GitBranch, title: t("landing.features.graphTitle"), description: t("landing.features.graphDesc"), preview: "graph", accent: "accent-blue" },
    { id: "war-room", label: t("landing.features.warRoomLabel"), icon: Zap, title: t("landing.features.warRoomTitle"), description: t("landing.features.warRoomDesc"), preview: "warroom", accent: "accent-rose" },
    { id: "scenario-engine", label: t("landing.features.scenarioLabel"), icon: TrendingUp, title: t("landing.features.scenarioTitle"), description: t("landing.features.scenarioDesc"), preview: "scenarios", accent: "accent-teal" },
    { id: "escalation", label: t("landing.features.escalationLabel"), icon: AlertTriangle, title: t("landing.features.escalationTitle"), description: t("landing.features.escalationDesc"), preview: "escalation", accent: "accent-amber" },
    { id: "analytics", label: t("landing.features.analyticsLabel"), icon: BarChart3, title: t("landing.features.analyticsTitle"), description: t("landing.features.analyticsDesc"), preview: "analytics", accent: "primary" },
  ];

  const current = features[active];
  const Preview = previewMap[current.preview];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">{t("landing.features.label")}</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            {t("landing.features.title")}{" "}
            <span className="text-foreground">{t("landing.features.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{t("landing.features.subtitle")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, ease }} className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative flex overflow-x-auto border-b border-border bg-muted/20">
              {features.map((f, i) => (
                <button key={f.id} onClick={() => setActive(i)} className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}>
                  <f.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{f.label}</span>
                  {i === active && <motion.div layoutId="activeFeatureTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                </button>
              ))}
            </div>

            <div className="relative grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-10 flex flex-col justify-center border-r border-border">
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }}>
                    <div className={`w-12 h-12 rounded-xl ${accentStyles[current.accent]?.bg} flex items-center justify-center mb-5`}>
                      <current.icon className={`w-6 h-6 ${accentStyles[current.accent]?.text}`} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{current.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{current.description}</p>
                    <div className="flex items-center gap-1.5 text-sm text-foreground font-medium cursor-pointer group">
                      <span>{t("landing.features.learnMore")}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-6 md:p-8 bg-muted/10 min-h-[280px] flex items-center">
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      {Preview && <Preview />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }} className="mt-12 flex flex-wrap justify-center gap-3">
          {["CEO Briefing", "Decision DNA", "Health Heatmap", "Predictive Timeline", "Friction Map", "Benchmarking", "Audit Trail", "Strategy Alignment"].map((badge, i) => (
            <motion.span key={badge} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }} className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 border border-border text-muted-foreground hover:border-foreground/15 hover:text-foreground hover:shadow-[var(--shadow-card)] transition-all duration-300 cursor-default select-none">
              {badge}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
