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
  <section id="problem" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-destructive/80">Das Problem</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Was in Ihrem Unternehmen gerade passiert.
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          Täglich. In jedem Unternehmen. Unsichtbar.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        {problems.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="p-6 rounded-2xl bg-card border border-border/30 shadow-sm hover:shadow-card-hover transition-all duration-300"
            style={{ borderLeft: `3px solid ${p.accentColor}` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl shrink-0">{p.icon}</span>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold mb-2">{p.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground mb-3">{p.text}</p>
                {p.source && (
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Quelle: {p.source}
                  </span>
                )}
                {p.link && (
                  <a
                    href={p.link.href}
                    className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
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
