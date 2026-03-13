import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const problems = [
  {
    icon: "⏳",
    title: "Freigaben dauern zu lange",
    text: "Operative Entscheidungen im Mittelstand warten durchschnittlich 4–6 Tage auf Freigabe. Jeder Tag Verzögerung hat wirtschaftliche Konsequenzen — die meistens niemand quantifiziert.",
    source: "McKinsey Decision Research",
    accentColor: "hsl(var(--destructive))",
  },
  {
    icon: "📧",
    title: "Entscheidungen laufen per E-Mail",
    text: "Freigabeprozesse über E-Mail-Chains haben kein zentrales Tracking, kein Fälligkeitsdatum und keine Eskalationslogik. Der Status einer Entscheidung kennt oft nur der Absender.",
    source: "Intern beobachtbar",
    accentColor: "hsl(var(--warning))",
  },
  {
    icon: "📋",
    title: "Compliance-Dokumentation fehlt",
    text: "ISO 9001 Kapitel 7.5, IATF 16949 und NIS2 fordern nachvollziehbare, dokumentierte Entscheidungsprozesse. Bei den meisten Unternehmen ist diese Dokumentation im Audit-Fall nicht vorhanden.",
    source: "ISO 9001:2015 Kap. 7.5",
    accentColor: "hsl(var(--accent-amber))",
  },
  {
    icon: "💸",
    title: "Die Kosten bleiben unsichtbar",
    text: "Was Verzögerungen wirklich kosten — in Stunden, in gebundenem Kapital, in verpassten Marktfenstern — rechnet kaum jemand aus. Bis jetzt.",
    link: { text: "Eigene Kosten berechnen →", href: "#roi" },
    accentColor: "hsl(var(--destructive))",
  },
];

const ProblemSection = () => (
  <section id="problem" className="py-28 relative">
    <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="text-center max-w-2xl mx-auto mb-20"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-destructive/20 bg-destructive/5 mb-6"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-destructive"
          />
          <span className="text-[11px] font-semibold text-destructive tracking-[0.15em] uppercase">Das Problem</span>
        </motion.div>
        <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-[-0.04em] mb-5 leading-[1.1]">
          Was in Ihrem Unternehmen gerade passiert.
        </h2>
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          Täglich. In jedem Unternehmen. Unsichtbar.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {problems.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            className="spotlight-card card-shine group relative p-7 rounded-2xl bg-card/80 border border-border/20 transition-all duration-300"
            style={{
              backdropFilter: "blur(12px)",
              borderLeft: `3px solid ${p.accentColor}`,
            }}
          >
            <div className="relative z-10 flex items-start gap-4">
              <span className="text-2xl shrink-0 mt-1">{p.icon}</span>
              <div className="flex-1">
                <h3 className="text-[16px] font-bold mb-3">{p.title}</h3>
                <p className="text-[14px] leading-[1.7] text-muted-foreground mb-3">{p.text}</p>
                {p.source && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider px-2 py-1 rounded-md bg-muted/30">
                    Quelle: {p.source}
                  </span>
                )}
                {p.link && (
                  <a
                    href={p.link.href}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(p.link!.href)?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {p.link.text}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
