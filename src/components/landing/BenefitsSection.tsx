import { motion } from "framer-motion";
import { Zap, Shield, Brain, BarChart3 } from "lucide-react";

const benefits = [
  { icon: Zap, title: "Schnellere Entscheidungen", stat: "73%", statLabel: "kürzere Zykluszeiten", description: "SLA-gesteuerte Workflows, automatische Reviewer-Zuweisung und konfigurierbare Eskalation." },
  { icon: Shield, title: "Governance & Compliance", stat: "100%", statLabel: "Audit-Trail-Abdeckung", description: "Vollständiger Audit Trail, Review-Delegation, DSGVO-konforme Datenverarbeitung." },
  { icon: Brain, title: "KI-Explainability", stat: "87%", statLabel: "Confidence Score", description: "Transparente Risikoanalyse mit Einflussfaktoren, Datengrundlage und Feedback-Loop." },
  { icon: BarChart3, title: "Executive Insights", stat: "60s", statLabel: "zum Management-Überblick", description: "CEO Briefing, Board Pack Export, Health Heatmap und Bottleneck Intelligence." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const BenefitsSection = () => (
  <section id="features" className="py-28 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-aurora-violet/[0.06] blur-[130px]" />
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-3xl mx-auto mb-16"
      >
        <p className="text-xs font-medium text-accent-violet/60 mb-4 tracking-[0.15em] uppercase">Vorteile</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
          Entscheidungsqualität wird{" "}
          <span className="bg-gradient-to-r from-aurora-blue to-aurora-violet bg-clip-text text-transparent">messbar</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {benefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className={`group aurora-card p-7 overflow-hidden ${i < 2 ? "md:min-h-[220px]" : ""}`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/[0.1] transition-colors duration-500">
                  <benefit.icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors duration-500" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">{benefit.title}</h3>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-primary font-display tracking-tight">{benefit.stat}</span>
                <span className="text-sm text-muted-foreground/50">{benefit.statLabel}</span>
              </div>

              <p className="text-sm text-muted-foreground/60 leading-relaxed">{benefit.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
