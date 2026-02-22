import { motion } from "framer-motion";
import { Zap, Shield, Brain, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Schnellere Entscheidungen",
    subtitle: "73% kürzere Zykluszeiten",
    description: "Strukturierte Templates, klare Review-Flows und automatische Erinnerungen. Keine Entscheidung bleibt länger liegen als nötig.",
    details: ["Vordefinierte Templates", "Review-Flows mit SLA", "Automatische Erinnerungen"],
    accent: "text-accent-blue",
    accentBg: "bg-accent-blue/8",
    accentBorder: "border-accent-blue/15",
  },
  {
    icon: Shield,
    title: "Mehr Kontrolle & Governance",
    subtitle: "Lückenloser Audit Trail",
    description: "SLA-Tracking, Eskalations-Engine und vollständiger Audit Trail. Jede Entscheidung ist nachvollziehbar und compliant.",
    details: ["Auto-Eskalation", "Audit Trail & Compliance", "Rollen & Berechtigungen"],
    accent: "text-accent-teal",
    accentBg: "bg-accent-teal/8",
    accentBorder: "border-accent-teal/15",
  },
  {
    icon: Brain,
    title: "KI-Intelligenz die mitdenkt",
    subtitle: "Risiko-Scoring & Szenarien",
    description: "Automatische Risikoanalyse, What-If-Simulationen und personalisierte Empfehlungen basierend auf Ihren Entscheidungsmustern.",
    details: ["Explainable AI Scores", "Szenario-Simulationen", "Confidence Meter"],
    accent: "text-accent-violet",
    accentBg: "bg-accent-violet/8",
    accentBorder: "border-accent-violet/15",
  },
  {
    icon: BarChart3,
    title: "Transparenz für Führung",
    subtitle: "Executive Dashboard & Briefings",
    description: "CEO Briefings, Decision Health Heatmap und Bottleneck Intelligence. Ihr C-Level sieht auf einen Blick, was Aufmerksamkeit braucht.",
    details: ["CEO Briefing (KI)", "Health Heatmap", "Bottleneck Analytics"],
    accent: "text-accent-amber",
    accentBg: "bg-accent-amber/8",
    accentBorder: "border-accent-amber/15",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const BenefitsSection = () => (
  <section id="features" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">Warum Decivio</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Entscheidungsqualität wird <span className="gradient-text">messbar</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Der Decision Quality Index macht sichtbar, was bisher unsichtbar war — und zeigt, wo Ihre Organisation sich verbessern kann.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {benefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.7, ease }}
            className={`group relative p-7 rounded-2xl border ${benefit.accentBorder} bg-card hover:border-foreground/10 transition-all duration-300`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${benefit.accentBg} flex items-center justify-center shrink-0`}>
                <benefit.icon className={`w-6 h-6 ${benefit.accent}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1">{benefit.title}</h3>
                <p className={`text-xs font-medium ${benefit.accent} mb-3`}>{benefit.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {benefit.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {benefit.details.map((detail) => (
                    <span
                      key={detail}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/50 border border-border text-muted-foreground"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
