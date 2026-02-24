import { motion } from "framer-motion";
import { Mail, Users, FileSearch } from "lucide-react";

const problems = [
  {
    icon: Mail,
    title: "Entscheidungen verschwinden in E-Mails",
    description: "Kritische Freigaben liegen in Postfächern begraben. Kein zentraler Ort, keine Nachvollziehbarkeit.",
    stat: "67%",
    statLabel: "aller Entscheidungen sind nicht dokumentiert",
  },
  {
    icon: Users,
    title: "Niemand weiß, wer zuständig ist",
    description: "Zuständigkeiten sind unklar, Reviews verzögern sich endlos. Eskalationen kommen zu spät.",
    stat: "12 Tage",
    statLabel: "durchschnittliche Verzögerung pro Freigabe",
  },
  {
    icon: FileSearch,
    title: "Audits kosten Wochen manueller Arbeit",
    description: "Compliance-Teams suchen wochenlang nach Entscheidungsprotokollen die nie existierten.",
    stat: "5 Wochen",
    statLabel: "typische Audit-Vorbereitung ohne Tool",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => (
  <section className="py-28 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-16"
      >
        <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">Das Problem</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Kennt ihr das?
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease }}
            className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-accent-rose/20 transition-all duration-300"
          >
            <problem.icon className="w-5 h-5 text-accent-rose/60 mb-4" />
            <h3 className="text-[15px] font-semibold mb-2">{problem.title}</h3>
            <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4">{problem.description}</p>
            <div className="pt-3 border-t border-border/30">
              <span className="text-xl font-bold text-accent-rose">{problem.stat}</span>
              <span className="block text-[10px] text-muted-foreground/50 mt-0.5">{problem.statLabel}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
