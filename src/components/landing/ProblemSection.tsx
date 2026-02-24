import { motion } from "framer-motion";
import { Clock, Users, MessageSquareX, EyeOff } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Entscheidungen dauern zu lange",
    description: "Wochen vergehen, bis strategische Entscheidungen freigegeben werden.",
  },
  {
    icon: Users,
    title: "Niemand weiß, wer verantwortlich ist",
    description: "Zuständigkeiten sind unklar, Reviews verzögern sich endlos.",
  },
  {
    icon: MessageSquareX,
    title: "Alles verstreut in Slack & E-Mail",
    description: "Kein zentraler Ort, keine Nachvollziehbarkeit, kein Audit Trail.",
  },
  {
    icon: EyeOff,
    title: "Keine Transparenz über Risiken",
    description: "C-Level hat keinen Überblick. Niemand weiß, wo es staut.",
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
          Kommt Ihnen das bekannt vor?
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
          >
            <problem.icon className="w-5 h-5 text-muted-foreground/40 mb-4" />
            <h3 className="text-[15px] font-semibold mb-2">{problem.title}</h3>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">{problem.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
