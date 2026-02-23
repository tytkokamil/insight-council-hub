import { motion } from "framer-motion";

const problems = [
  { number: "01", title: "Entscheidungen dauern Wochen", detail: "Ø 14 Tage bis zur Freigabe" },
  { number: "02", title: "Verantwortung ist unklar", detail: "73% ohne klaren Owner" },
  { number: "03", title: "Kontext verstreut", detail: "Slack, E-Mail, Meetings" },
  { number: "04", title: "Risiken werden unsichtbar", detail: "Kein Echtzeit-Überblick" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const ProblemSection = () => (
  <section className="py-32 relative">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-destructive/50" />
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-destructive/60">Das Problem</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.05] max-w-3xl">
            Entscheidungen scheitern nicht an Daten — sondern an fehlender Struktur.
          </h2>
        </motion.div>

        <div className="space-y-0">
          {problems.map((p, i) => (
            <motion.div
              key={p.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="group flex items-baseline gap-6 md:gap-10 py-6 border-b border-border hover:border-foreground/20 transition-colors duration-300"
            >
              <span className="text-xs font-mono text-muted-foreground/40 w-6">{p.number}</span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight flex-1 group-hover:translate-x-1 transition-transform duration-300">
                {p.title}
              </h3>
              <span className="text-sm text-muted-foreground hidden md:block">{p.detail}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ProblemSection;
