import { motion } from "framer-motion";
import {
  Brain, FileText, TrendingUp, Sparkles, Clock, Target, Zap, Shield,
} from "lucide-react";
import productAnalyticsFrame from "@/assets/product-analytics-frame.jpg";

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
  <section className="py-32 relative overflow-hidden">
    {/* Ambient backgrounds */}
    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />
    <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
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
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
            Unsere KI analysiert nicht nur — sie lernt aus deinen Entscheidungsmustern,
            erkennt Risiken bevor sie auftreten, und liefert personalisierte Empfehlungen.
          </p>

          {/* Product screenshot with glow frame */}
          <div className="relative rounded-xl overflow-hidden border border-border/50 group">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <img
              src={productAnalyticsFrame}
              alt="KI-Analyse Dashboard"
              className="w-full h-auto relative"
              loading="lazy"
            />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-6 mt-10">
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
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="grid grid-cols-2 gap-4"
        >
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, ease }}
              className="group relative p-5 rounded-xl border border-border/40 bg-card hover:border-primary/20 transition-all duration-500 overflow-hidden"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Subtle gradient on hover */}
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
        </motion.div>
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;
