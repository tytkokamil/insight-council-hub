import { motion } from "framer-motion";
import {
  Brain, FileText, TrendingUp, Target, Shield, Zap,
} from "lucide-react";

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
  <section className="py-24 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <p className="text-[11px] font-medium text-muted-foreground/50 mb-3 tracking-[0.15em] uppercase">KI & Automation</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Intelligenz, die mitdenkt
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {capabilities.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="group p-5 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-violet/[0.06] flex items-center justify-center mb-3 group-hover:bg-accent-violet/10 transition-colors">
              <cap.icon className="w-4 h-4 text-accent-violet/50 group-hover:text-accent-violet transition-colors" />
            </div>
            <h4 className="text-sm font-semibold mb-1">{cap.title}</h4>
            <p className="text-xs text-muted-foreground/55 leading-relaxed">
              {cap.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;
