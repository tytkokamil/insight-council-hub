import { motion } from "framer-motion";
import { Zap, Shield, Brain, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Schnellere Entscheidungen",
    stat: "73%",
    statLabel: "kürzere Zykluszeiten",
    description: "SLA-gesteuerte Workflows, automatische Reviewer-Zuweisung und konfigurierbare Eskalation.",
  },
  {
    icon: Shield,
    title: "Governance & Compliance",
    stat: "100%",
    statLabel: "Audit-Trail-Abdeckung",
    description: "Vollständiger Audit Trail, Review-Delegation, DSGVO-konforme Datenverarbeitung.",
  },
  {
    icon: Brain,
    title: "KI-Explainability",
    stat: "87%",
    statLabel: "Confidence Score",
    description: "Transparente Risikoanalyse mit Einflussfaktoren, Datengrundlage und Feedback-Loop.",
  },
  {
    icon: BarChart3,
    title: "Executive Insights",
    stat: "60s",
    statLabel: "zum Management-Überblick",
    description: "CEO Briefing, Board Pack Export, Health Heatmap und Bottleneck Intelligence.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const BenefitsSection = () => (
  <section id="features" className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <p className="text-[11px] font-medium text-muted-foreground/50 mb-3 tracking-[0.15em] uppercase">Vorteile</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Entscheidungsqualität wird messbar
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {benefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="group relative p-6 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/[0.05] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.08] transition-colors">
                <benefit.icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1">{benefit.title}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-xl font-bold text-primary font-display">{benefit.stat}</span>
                  <span className="text-[11px] text-muted-foreground/50">{benefit.statLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
