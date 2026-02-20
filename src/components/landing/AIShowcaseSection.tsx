import { motion } from "framer-motion";
import {
  Brain, FileText, TrendingUp, Sparkles, Clock, Target, Zap, Shield,
} from "lucide-react";

const capabilities = [
  { icon: Brain, title: "Risiko-Scoring", description: "Automatische Bewertung von Risiken basierend auf historischen Daten und Kontext." },
  { icon: FileText, title: "CEO Briefing", description: "Tägliches KI-generiertes Executive Summary aller kritischen Entscheidungen." },
  { icon: TrendingUp, title: "Predictive Timeline", description: "Vorhersage wann Entscheidungen abgeschlossen werden basierend auf Team-Velocity." },
  { icon: Target, title: "Decision DNA", description: "Analysiere Muster in deinen Entscheidungen und lerne aus vergangenen Outcomes." },
  { icon: Shield, title: "Compliance Audit", description: "Lückenlose Dokumentation für regulatorische Anforderungen und Governance." },
  { icon: Zap, title: "Strategy Alignment", description: "Verknüpfe jede Entscheidung mit strategischen Zielen und messe den Impact." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const AIShowcaseSection = () => (
  <section className="py-20 relative overflow-hidden">
    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />
    <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-muted/30 mb-8"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">
              AI-Powered
            </span>
          </motion.div>

          <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 tracking-tight leading-tight">
            {"Künstliche Intelligenz die".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.7, ease }}
              className="gradient-text block"
            >
              mitdenkt
            </motion.span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-muted-foreground leading-relaxed mb-10 max-w-md"
          >
            Unsere KI analysiert nicht nur — sie lernt aus deinen Entscheidungsmustern,
            erkennt Risiken bevor sie auftreten, und liefert personalisierte Empfehlungen.
          </motion.p>

          {/* Code-based analytics mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease }}
            className="relative rounded-xl overflow-hidden border border-border/50 bg-card p-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-medium text-primary">Live Analyse</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Entscheidungen", value: "847", change: "+12%" },
                { label: "Ø Zykluszeit", value: "3.2d", change: "-18%" },
              ].map((m) => (
                <div key={m.label} className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <div className="text-lg font-bold font-display">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  <div className="text-[10px] font-medium text-success">{m.change}</div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1 h-14 px-1">
              {[30, 45, 38, 60, 50, 70, 55, 80, 65, 75].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/20 hover:bg-primary/35 transition-colors"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          </motion.div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-6 mt-10">
            {[
              { label: "Schnellere\nEntscheidungen", value: "73%", icon: Clock },
              { label: "Bessere\nOutcomes", value: "2.5x", icon: Target },
              { label: "Weniger\nEskalationen", value: "45%", icon: Shield },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1, ease }}
              >
                <div className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1">
                  {metric.value}
                </div>
                <div className="text-[11px] text-muted-foreground/70 whitespace-pre-line leading-snug">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — capability grid */}
        <div className="grid grid-cols-2 gap-4">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease }}
              className="group relative p-5 rounded-xl border border-border/40 bg-card hover:border-primary/20 transition-all duration-500 overflow-hidden card-interactive"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors duration-500">
                  <cap.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                </div>
                <h4 className="font-semibold text-sm mb-1.5">{cap.title}</h4>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;
