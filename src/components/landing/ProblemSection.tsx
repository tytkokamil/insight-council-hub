import { motion } from "framer-motion";
import { Clock, Users, MessageSquareX, EyeOff, ArrowRight } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Entscheidungen dauern zu lange",
    description: "Wochen vergehen, bis strategische Entscheidungen freigegeben werden. Jeder Tag Verzögerung kostet Geld.",
    accent: "text-accent-rose",
    accentBg: "bg-accent-rose/8",
  },
  {
    icon: Users,
    title: "Niemand weiß, wer verantwortlich ist",
    description: "Zuständigkeiten sind unklar, Reviews verzögern sich, Eskalationen passieren zu spät oder gar nicht.",
    accent: "text-accent-amber",
    accentBg: "bg-accent-amber/8",
  },
  {
    icon: MessageSquareX,
    title: "Entscheidungen verschwinden in Slack & E-Mail",
    description: "Wichtige Beschlüsse gehen unter. Es gibt keinen zentralen Ort, keine Nachvollziehbarkeit, keinen Audit Trail.",
    accent: "text-accent-violet",
    accentBg: "bg-accent-violet/8",
  },
  {
    icon: EyeOff,
    title: "Keine Transparenz über Risiken",
    description: "C-Level hat keinen Überblick. Welche Entscheidungen sind kritisch? Wo staut es sich? Niemand weiß es.",
    accent: "text-accent-blue",
    accentBg: "bg-accent-blue/8",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => (
  <section className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">Das Problem</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Kommt Ihnen das <span className="gradient-text">bekannt vor?</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          In den meisten Unternehmen fehlt ein System für das, was am meisten zählt: Entscheidungen.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease }}
            className="group relative p-6 rounded-2xl border border-border bg-card hover:border-foreground/10 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl ${problem.accentBg} flex items-center justify-center mb-4`}>
              <problem.icon className={`w-5 h-5 ${problem.accent}`} />
            </div>
            <h3 className="text-base font-semibold mb-2">{problem.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6, ease }}
        className="text-center mt-12"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/[0.04]">
          <ArrowRight className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Decivio löst genau das.</span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ProblemSection;
