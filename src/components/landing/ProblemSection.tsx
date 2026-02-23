import { motion } from "framer-motion";
import { Clock, Users, MessageSquareX, EyeOff } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Entscheidungen dauern Wochen",
    cost: "Ø 14 Tage bis zur Freigabe",
    number: "01",
  },
  {
    icon: Users,
    title: "Verantwortung ist unklar",
    cost: "73% ohne klaren Owner",
    number: "02",
  },
  {
    icon: MessageSquareX,
    title: "Kontext verstreut",
    cost: "Slack, E-Mail, Meetings",
    number: "03",
  },
  {
    icon: EyeOff,
    title: "Risiken werden unsichtbar",
    cost: "Kein Echtzeit-Überblick",
    number: "04",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => (
  <section className="py-28 relative">
    <div className="container mx-auto px-4">
      {/* Header — editorial style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-3xl mx-auto mb-16"
      >
        <p className="text-xs font-medium text-destructive/50 mb-4 tracking-[0.15em] uppercase">Das Problem</p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.1]">
          Entscheidungen scheitern nicht an{" "}
          <span className="text-muted-foreground/40">fehlenden Daten</span>
          {" "}— sondern an fehlender{" "}
          <span className="relative">
            Struktur
            <motion.span
              className="absolute -bottom-1 left-0 right-0 h-[2px] bg-destructive/30 rounded-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8, ease }}
              style={{ originX: 0 }}
            />
          </span>.
        </h2>
      </motion.div>

      {/* Problem cards — horizontal scroll on mobile, grid on desktop */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="group relative p-6 rounded-2xl border border-border/40 bg-card hover:border-destructive/20 transition-all duration-500"
          >
            {/* Number watermark */}
            <span className="absolute top-4 right-4 text-4xl font-bold text-foreground/[0.03] font-display">
              {problem.number}
            </span>
            
            <problem.icon className="w-5 h-5 text-muted-foreground/25 mb-5 group-hover:text-destructive/40 transition-colors duration-500" />
            <h3 className="text-base font-semibold mb-2 tracking-tight">{problem.title}</h3>
            <p className="text-sm text-muted-foreground/45">{problem.cost}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
