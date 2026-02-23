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
  <section className="py-28 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-aurora-violet/[0.07] blur-[130px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-aurora-mint/[0.05] blur-[110px]" />
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-3xl mx-auto mb-16"
      >
        <p className="text-xs font-medium text-accent-violet/60 mb-4 tracking-[0.15em] uppercase">KI & Automation</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
          Intelligenz, die{" "}
          <span className="bg-gradient-to-r from-accent-violet to-aurora-mint bg-clip-text text-transparent">mitdenkt</span>
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {capabilities.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.6, ease }}
            className="group aurora-card p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-violet/[0.06] flex items-center justify-center mb-4 group-hover:bg-accent-violet/[0.12] transition-colors duration-500">
              <cap.icon className="w-5 h-5 text-accent-violet/50 group-hover:text-accent-violet transition-colors duration-500" />
            </div>
            <h4 className="text-base font-semibold mb-2 tracking-tight">{cap.title}</h4>
            <p className="text-sm text-muted-foreground/55 leading-relaxed">{cap.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;
