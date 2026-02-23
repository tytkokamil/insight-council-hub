import { motion } from "framer-motion";
import { Clock, Users, MessageSquareX, EyeOff } from "lucide-react";

const problems = [
  { icon: Clock, title: "Entscheidungen dauern Wochen", cost: "Ø 14 Tage bis zur Freigabe" },
  { icon: Users, title: "Verantwortung ist unklar", cost: "73% ohne klaren Owner" },
  { icon: MessageSquareX, title: "Kontext verstreut", cost: "Slack, E-Mail, Meetings" },
  { icon: EyeOff, title: "Risiken werden unsichtbar", cost: "Kein Echtzeit-Überblick" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => (
  <section className="py-28 relative overflow-hidden">
    {/* Subtle aurora tint */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] rounded-full bg-aurora-rose/[0.06] blur-[120px]" />
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-3xl mx-auto mb-16"
      >
        <p className="text-xs font-medium text-accent-rose/60 mb-4 tracking-[0.15em] uppercase">Das Problem</p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.1]">
          Entscheidungen scheitern nicht an{" "}
          <span className="text-muted-foreground/50">fehlenden Daten</span>
          {" "}— sondern an fehlender{" "}
          <span className="relative">
            Struktur
            <motion.span
              className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-aurora-rose/40 to-aurora-violet/30 rounded-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8, ease }}
              style={{ originX: 0 }}
            />
          </span>.
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="group aurora-card p-6 hover:border-aurora-rose/20"
          >
            <problem.icon className="w-5 h-5 text-muted-foreground/30 mb-5 group-hover:text-accent-rose/50 transition-colors duration-500" />
            <h3 className="text-base font-semibold mb-2 tracking-tight">{problem.title}</h3>
            <p className="text-sm text-muted-foreground/60">{problem.cost}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
