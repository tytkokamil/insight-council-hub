import { motion } from "framer-motion";
import { Clock, Users, MessageSquareX, EyeOff } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Entscheidungen dauern Wochen",
    cost: "Ø 14 Tage bis zur Freigabe",
  },
  {
    icon: Users,
    title: "Verantwortung ist unklar",
    cost: "73% ohne klaren Owner",
  },
  {
    icon: MessageSquareX,
    title: "Kontext verstreut",
    cost: "Slack, E-Mail, Meetings",
  },
  {
    icon: EyeOff,
    title: "Risiken werden unsichtbar",
    cost: "Kein Echtzeit-Überblick",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <p className="text-[11px] font-medium text-destructive/60 mb-3 tracking-[0.15em] uppercase">Das Problem</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Kommt Ihnen das bekannt vor?
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="group p-5 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-destructive/15 transition-all duration-300"
          >
            <problem.icon className="w-4 h-4 text-destructive/30 mb-3 group-hover:text-destructive/50 transition-colors" />
            <h3 className="text-sm font-semibold mb-1.5">{problem.title}</h3>
            <p className="text-xs text-muted-foreground/50">{problem.cost}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
