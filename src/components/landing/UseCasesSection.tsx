import { motion } from "framer-motion";
import { Briefcase, DollarSign, Target, ShieldAlert } from "lucide-react";

const useCases = [
  {
    icon: Briefcase,
    title: "Produktentscheidungen",
    description: "Feature-Priorisierung, Roadmap-Änderungen und technische Architekturentscheidungen mit klaren Verantwortlichkeiten.",
  },
  {
    icon: DollarSign,
    title: "Budgetfreigaben",
    description: "Investitionsentscheidungen mit Szenario-Analyse, Risiko-Scoring und automatischer Eskalation bei Überschreitung.",
  },
  {
    icon: Target,
    title: "Strategische Initiativen",
    description: "Markteintritte, Partnerschaften und Expansionspläne mit vollständigem Stakeholder-Alignment und Audit Trail.",
  },
  {
    icon: ShieldAlert,
    title: "Risikoentscheidungen",
    description: "Compliance, Security und regulatorische Entscheidungen mit vertraulicher Markierung und eingeschränktem Zugriff.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const UseCasesSection = () => (
  <section className="py-20 relative overflow-hidden">
    <div id="use-cases" className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">Use Cases</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Gebaut für die Entscheidungen, <span className="gradient-text">die zählen</span>
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {useCases.map((useCase, i) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="group p-6 rounded-2xl border border-border bg-card hover:border-foreground/10 transition-all duration-300 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4 group-hover:bg-foreground/[0.06] transition-colors">
              <useCase.icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-sm font-semibold mb-2">{useCase.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{useCase.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default UseCasesSection;
