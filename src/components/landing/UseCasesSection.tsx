import { motion } from "framer-motion";
import { Briefcase, DollarSign, Target, ShieldAlert } from "lucide-react";

const useCases = [
  {
    icon: DollarSign,
    title: "Budgetfreigaben",
    description: "SLA-gesteuerte Freigabe-Workflows mit Risiko-Scoring und Eskalation.",
  },
  {
    icon: Target,
    title: "Strategische Initiativen",
    description: "M&A, Expansionen und Partnerschaften mit Stakeholder-Alignment.",
  },
  {
    icon: ShieldAlert,
    title: "Compliance & Regulatorik",
    description: "Audit-Trails sichern und vertrauliche Entscheidungen schützen.",
  },
  {
    icon: Briefcase,
    title: "Führungsentscheidungen",
    description: "Hiring und Restrukturierung mit klaren Verantwortlichkeiten.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const UseCasesSection = () => (
  <section className="py-28 relative">
    <div className="absolute inset-0 bg-muted/20" />
    
    <div id="use-cases" className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-16"
      >
        <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">Use Cases</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Gebaut für Entscheidungsdruck
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {useCases.map((useCase, i) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="group p-6 rounded-2xl border border-border/40 bg-card/80 hover:bg-card hover:border-border transition-all duration-300 text-center"
          >
            <useCase.icon className="w-5 h-5 text-muted-foreground/40 mx-auto mb-4 group-hover:text-foreground/60 transition-colors" />
            <h3 className="text-sm font-semibold mb-2">{useCase.title}</h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">{useCase.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default UseCasesSection;
