import { motion } from "framer-motion";
import { Brain, FileText, TrendingUp, Clock, Target, Zap, Shield } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const capabilities = [
  { icon: Brain, title: "KI Risk Scoring", description: "Automatische Risikobewertung jeder Entscheidung basierend auf historischen Mustern und Kontextanalyse." },
  { icon: FileText, title: "CEO Daily Briefing", description: "Jeden Morgen ein KI-generiertes Executive Summary mit den 3 kritischsten Entscheidungen und Handlungsempfehlungen." },
  { icon: TrendingUp, title: "Predictive Timeline", description: "KI-Prognosen für Entscheidungslaufzeiten auf Basis von Teamverhalten und historischer Velocity." },
  { icon: Target, title: "Decision DNA", description: "Mustererkennung über alle Entscheidungen hinweg — welche Faktoren zu erfolgreichen Outcomes führen." },
  { icon: Shield, title: "Compliance Audit", description: "Automatische Dokumentation und Prüfung gegen NIS2, ISO 9001, GMP und weitere Frameworks." },
  { icon: Zap, title: "Strategy Alignment", description: "Jede Entscheidung wird gegen strategische Ziele geprüft — mit Alignment-Score und Gap-Analyse." },
];

const AIShowcaseSection = () => {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.9, ease }}>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-muted/30 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">KI-gestützte Intelligenz</span>
            </motion.div>

            <h2 className="text-3xl md:text-[2.75rem] font-bold mb-6 tracking-[-0.04em] leading-[1.1]">
              Entscheidungsintelligenz{" "}
              <span className="gradient-text">die mitdenkt</span>
            </h2>

            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.6 }} className="text-[16px] text-muted-foreground leading-[1.7] mb-12 max-w-md">
              Unsere KI analysiert Muster, erkennt Risiken und liefert Empfehlungen — direkt im Entscheidungsprozess.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.7, ease }} className="relative rounded-2xl overflow-hidden border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-medium text-muted-foreground">Live-Analyse</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Analysierte Entscheidungen", value: "847", change: "+12%" },
                  { label: "Ø Zykluszeit", value: "3.2d", change: "-18%" },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <div className="text-xl font-bold tabular-nums">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground">{m.label}</div>
                    <div className="text-[10px] font-medium text-success">{m.change}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-1 h-16 px-1">
                {[30, 45, 38, 60, 50, 70, 55, 80, 65, 75].map((h, i) => (
                  <motion.div key={i} className="flex-1 rounded-sm" style={{ background: `linear-gradient(to top, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.2))` }} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-6 mt-12">
              {[
                { label: "Schnellere\nEntscheidungen", value: "3×", icon: Clock },
                { label: "Bessere\nOutcomes", value: "↑", icon: Target },
                { label: "Weniger\nEskalationen", value: "↓", icon: Shield },
              ].map((metric, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1, ease }}>
                  <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1 tabular-nums">{metric.value}</div>
                  <div className="text-[11px] text-muted-foreground whitespace-pre-line leading-snug">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {capabilities.map((cap, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease }}
                className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-card-hover transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-primary/[0.08] transition-colors duration-300">
                    <cap.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <h4 className="font-bold text-[14px] mb-2">{cap.title}</h4>
                  <p className="text-[12px] text-muted-foreground leading-[1.7]">{cap.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIShowcaseSection;
