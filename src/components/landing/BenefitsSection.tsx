import { motion } from "framer-motion";

const benefits = [
  { stat: "73%", label: "kürzere Zykluszeiten", title: "Schnellere Entscheidungen", description: "SLA-gesteuerte Workflows, automatische Reviewer-Zuweisung und konfigurierbare Eskalation." },
  { stat: "100%", label: "Audit-Trail-Abdeckung", title: "Governance & Compliance", description: "Vollständiger Audit Trail, Review-Delegation, DSGVO-konforme Datenverarbeitung." },
  { stat: "87%", label: "Confidence Score", title: "KI-Explainability", description: "Transparente Risikoanalyse mit Einflussfaktoren, Datengrundlage und Feedback-Loop." },
  { stat: "60s", label: "zum Management-Überblick", title: "Executive Insights", description: "CEO Briefing, Board Pack Export, Health Heatmap und Bottleneck Intelligence." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const BenefitsSection = () => (
  <section id="features" className="py-32 relative">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-primary" />
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">Vorteile</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em]">
            Messbare Ergebnisse.
          </h2>
        </motion.div>

        <div className="space-y-0">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="group grid md:grid-cols-[200px_1fr] gap-6 md:gap-12 py-10 border-b border-border"
            >
              {/* Stat */}
              <div>
                <span className="text-4xl md:text-5xl font-bold font-display tracking-[-0.04em] text-primary">{b.stat}</span>
                <span className="block text-sm text-muted-foreground mt-1">{b.label}</span>
              </div>
              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">{b.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-lg">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default BenefitsSection;
