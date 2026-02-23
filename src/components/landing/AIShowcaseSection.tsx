import { motion } from "framer-motion";
import { Brain, FileText, TrendingUp, Target, Shield, Zap } from "lucide-react";

const capabilities = [
  { icon: Brain, title: "Decision Co-Pilot", description: "KI-Risikoanalyse, Reviewer-Vorschläge, Ablehnungs-Prognose und Explainability Layer." },
  { icon: FileText, title: "CEO Briefing", description: "Tägliches KI-generiertes Executive Summary mit den wichtigsten Entscheidungen und Risiken." },
  { icon: TrendingUp, title: "Predictive Timeline", description: "Vorhersage der Fertigstellung basierend auf Team-Velocity und historischen Daten." },
  { icon: Target, title: "Decision DNA", description: "Muster-Erkennung in deinen Entscheidungen — lerne aus vergangenen Outcomes." },
  { icon: Shield, title: "Compliance & Audit", description: "Lückenloser Audit Trail, Review-Delegation, SLA-Konfiguration pro Kategorie." },
  { icon: Zap, title: "Automation Rules", description: "Trigger-basierte Automatisierung: Status-Änderungen, Benachrichtigungen, Reassignment." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const AIShowcaseSection = () => (
  <section className="py-32 relative">
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
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">KI & Automation</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em]">
            Intelligenz, die mitdenkt.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              className="group p-8 bg-card hover:bg-muted/30 transition-colors duration-300"
            >
              <cap.icon className="w-5 h-5 text-muted-foreground/30 mb-5 group-hover:text-primary transition-colors duration-300" />
              <h4 className="text-base font-semibold mb-2 tracking-tight">{cap.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;
