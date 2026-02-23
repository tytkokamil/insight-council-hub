import { motion } from "framer-motion";
import { Briefcase, DollarSign, Target, ShieldAlert, GitBranch, Users } from "lucide-react";

const useCases = [
  { icon: DollarSign, title: "Budgetfreigaben", description: "SLA-gesteuerte Freigabe mit Risiko-Scoring und automatischer Eskalation." },
  { icon: Target, title: "Strategische Initiativen", description: "M&A, Expansionen und Partnerschaften mit Stakeholder-Alignment und What-If Szenarien." },
  { icon: ShieldAlert, title: "Compliance & Regulatorik", description: "Vollständiger Audit Trail, vertrauliche Entscheidungen und DSGVO-konforme Archivierung." },
  { icon: Briefcase, title: "Führungsentscheidungen", description: "Hiring, Restrukturierung und Org-Changes mit klaren Verantwortlichkeiten und Reviews." },
  { icon: GitBranch, title: "Produkt-Roadmap", description: "Feature-Priorisierung mit Abhängigkeits-Graph und Impact-Analyse über Teams hinweg." },
  { icon: Users, title: "Team-Governance", description: "Team-Defaults, Delegationen und konfigurierbare Review-Flows pro Abteilung." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const UseCasesSection = () => (
  <section className="py-32 relative">
    <div id="use-cases" className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">Use Cases</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em]">
            Gebaut für Entscheidungsdruck.
          </h2>
        </motion.div>

        <div className="space-y-0">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              className="group grid md:grid-cols-[40px_1fr_1fr] gap-4 md:gap-8 items-baseline py-6 border-b border-border hover:border-foreground/20 transition-colors duration-300"
            >
              <uc.icon className="w-5 h-5 text-muted-foreground/25 group-hover:text-primary transition-colors duration-300" />
              <h3 className="text-lg font-semibold tracking-tight group-hover:translate-x-1 transition-transform duration-300">{uc.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{uc.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default UseCasesSection;
