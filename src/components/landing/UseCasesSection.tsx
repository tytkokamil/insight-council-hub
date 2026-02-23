import { motion } from "framer-motion";
import { Briefcase, DollarSign, Target, ShieldAlert, GitBranch, Users } from "lucide-react";

const useCases = [
  {
    icon: DollarSign,
    title: "Budgetfreigaben",
    description: "SLA-gesteuerte Freigabe mit Risiko-Scoring und automatischer Eskalation.",
  },
  {
    icon: Target,
    title: "Strategische Initiativen",
    description: "M&A, Expansionen und Partnerschaften mit Stakeholder-Alignment und What-If Szenarien.",
  },
  {
    icon: ShieldAlert,
    title: "Compliance & Regulatorik",
    description: "Vollständiger Audit Trail, vertrauliche Entscheidungen und DSGVO-konforme Archivierung.",
  },
  {
    icon: Briefcase,
    title: "Führungsentscheidungen",
    description: "Hiring, Restrukturierung und Org-Changes mit klaren Verantwortlichkeiten und Reviews.",
  },
  {
    icon: GitBranch,
    title: "Produkt-Roadmap",
    description: "Feature-Priorisierung mit Abhängigkeits-Graph und Impact-Analyse über Teams hinweg.",
  },
  {
    icon: Users,
    title: "Team-Governance",
    description: "Team-Defaults, Delegationen und konfigurierbare Review-Flows pro Abteilung.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const UseCasesSection = () => (
  <section className="py-28 relative">
    <div id="use-cases" className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-3xl mx-auto mb-16"
      >
        <p className="text-xs font-medium text-muted-foreground/50 mb-4 tracking-[0.15em] uppercase">Use Cases</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
          Gebaut für{" "}
          <span className="text-muted-foreground/40">Entscheidungsdruck</span>
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {useCases.map((useCase, i) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.6, ease }}
            className="group p-6 rounded-2xl border border-border/40 bg-card hover:border-border/80 transition-all duration-500"
          >
            <useCase.icon className="w-5 h-5 text-muted-foreground/25 mb-4 group-hover:text-primary/50 transition-colors duration-500" />
            <h3 className="text-base font-semibold mb-2 tracking-tight">{useCase.title}</h3>
            <p className="text-sm text-muted-foreground/45 leading-relaxed">{useCase.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default UseCasesSection;
