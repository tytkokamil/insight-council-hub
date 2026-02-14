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

const AIShowcaseSection = () => {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide uppercase">
                AI-Powered
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 tracking-tight leading-tight">
              Künstliche Intelligenz die
              <span className="gradient-text block">mitdenkt</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Unsere KI analysiert nicht nur — sie lernt aus deinen Entscheidungsmustern,
              erkennt Risiken bevor sie auftreten, und liefert personalisierte Empfehlungen
              für bessere Outcomes.
            </p>

            {/* Animated metrics */}
            <div className="grid grid-cols-3 gap-4">
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
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="font-display text-2xl md:text-3xl font-bold gradient-text mb-1">
                    {metric.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-pre-line leading-tight">
                    {metric.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Capability grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <cap.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{cap.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cap.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIShowcaseSection;
