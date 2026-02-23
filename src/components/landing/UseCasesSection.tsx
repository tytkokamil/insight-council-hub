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
  <section className="py-24 relative">
    <div className="absolute inset-0 bg-muted/15" />
    
    <div id="use-cases" className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <p className="text-[11px] font-medium text-muted-foreground/50 mb-3 tracking-[0.15em] uppercase">Use Cases</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Gebaut für Entscheidungsdruck
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {useCases.map((useCase, i) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.05, duration: 0.5, ease }}
            className="group p-5 rounded-xl border border-border/35 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
          >
            <useCase.icon className="w-4 h-4 text-muted-foreground/30 mb-3 group-hover:text-primary/50 transition-colors" />
            <h3 className="text-sm font-semibold mb-1">{useCase.title}</h3>
            <p className="text-xs text-muted-foreground/50 leading-relaxed">{useCase.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default UseCasesSection;
