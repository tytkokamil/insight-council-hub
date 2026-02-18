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
  <section className="py-32 relative">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-muted/30 mb-8">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">
              AI-Powered
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 tracking-tight leading-tight">
            Künstliche Intelligenz die
            <span className="gradient-text block">mitdenkt</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-12 max-w-md">
            Unsere KI analysiert nicht nur — sie lernt aus deinen Entscheidungsmustern,
            erkennt Risiken bevor sie auftreten, und liefert personalisierte Empfehlungen.
          </p>

          {/* Metrics — minimal style */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Schnellere\nEntscheidungen", value: "73%", icon: Clock },
              { label: "Bessere\nOutcomes", value: "2.5x", icon: Target },
              { label: "Weniger\nEskalationen", value: "45%", icon: Shield },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08, ease }}
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
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="grid grid-cols-2 gap-4"
        >
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.06, ease }}
              className="group p-5 rounded-xl border border-border/40 bg-card hover:border-border transition-colors duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center mb-3 group-hover:bg-primary/8 transition-colors duration-300">
                <cap.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <h4 className="font-semibold text-sm mb-1.5">{cap.title}</h4>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                {cap.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;
