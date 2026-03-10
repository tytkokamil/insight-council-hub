import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const beforeSteps = [
  { time: "Tag 1", icon: "📧", title: "E-Mail an 5 Personen gesendet", pain: "Kein Tracking. Kein Fälligkeitsdatum." },
  { time: "Tag 3", icon: "⏳", title: "Kein Feedback eingegangen", pain: "Manuelles Follow-up per WhatsApp nötig. Kontext geht in E-Mail-Threads verloren." },
  { time: "Tag 6", icon: "✓", title: "Entscheidung irgendwie gefallen", pain: "Begründung nicht dokumentiert. Alternativen nicht festgehalten." },
  { time: "Audit", icon: "❌", title: "Prüfer fragt nach Dokumentation", pain: "Nicht vorhanden. Nacharbeit erforderlich." },
];

const afterSteps = [
  { time: "Tag 1", icon: "✅", title: "Entscheidung angelegt, SLA startet", win: "CoD-Ticker läuft. Reviewer per E-Mail automatisch benachrichtigt." },
  { time: "Tag 1", icon: "✅", title: "Reviewer genehmigt per One-Click", win: "Direkt aus E-Mail. Kein Login nötig. Audit Trail: vollständig, SHA-256." },
  { time: "Tag 1", icon: "✅", title: "Entscheidung implementiert", win: "Begründung, Alternativen, Genehmigung — alles dokumentiert." },
  { time: "Audit", icon: "✅", title: "Export als PDF — ein Klick", win: "ISO 9001 Kap. 7.5 erfüllt." },
];

const BeforeAfterTimeline = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineProgress = useTransform(scrollYProgress, [0.15, 0.65], [0, 1]);

  return (
    <section ref={ref} id="before-after" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold text-primary tracking-[0.15em] uppercase">Der Unterschied</span>
          </motion.div>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-[-0.04em] mb-5 leading-[1.1]">
            Eine Entscheidung. Zwei Realitäten.
          </h2>
          <p className="text-[16px] text-muted-foreground">
            Lieferantenwechsel. Maschinenbau. 5 Beteiligte.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-6">
          {/* BEFORE */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5 mb-7"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-destructive/80">Ohne Decivio</span>
            </motion.div>

            <div className="relative space-y-3.5">
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-destructive/10">
                <motion.div className="absolute inset-x-0 top-0 bg-destructive/25 origin-top" style={{ scaleY: lineProgress }} />
              </div>

              {beforeSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease }}
                  className="relative flex items-start gap-4 pl-10"
                >
                  <div className="absolute left-0 top-1 w-9 h-9 rounded-full border border-destructive/20 bg-card flex items-center justify-center text-sm shadow-sm">
                    {step.icon}
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-destructive/10 bg-card/80 hover:border-destructive/20 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[13px] font-bold">{step.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-destructive/60">{step.time}</span>
                    </div>
                    <p className="text-[12px] text-destructive/55">⚠ {step.pain}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="ml-10 mt-5 px-5 py-3.5 rounded-xl border border-destructive/15 bg-destructive/[0.04]"
              >
                <span className="text-[13px] font-bold text-destructive">6 Tage Laufzeit · 0% dokumentiert</span>
              </motion.div>
            </div>
          </div>

          {/* AFTER */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5 mb-7"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-primary/80">Mit Decivio</span>
            </motion.div>

            <div className="relative space-y-3.5">
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-primary/10">
                <motion.div className="absolute inset-x-0 top-0 bg-primary/25 origin-top" style={{ scaleY: lineProgress }} />
              </div>

              {afterSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.1, duration: 0.6, ease }}
                  className="relative flex items-start gap-4 pl-10"
                >
                  <div className="absolute left-0 top-1 w-9 h-9 rounded-full border border-primary/20 bg-card flex items-center justify-center text-sm shadow-sm">
                    {step.icon}
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-primary/10 bg-card/80 hover:border-primary/20 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[13px] font-bold">{step.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-primary/60">{step.time}</span>
                    </div>
                    <p className="text-[12px] text-primary/65">✓ {step.win}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="ml-10 mt-5 px-5 py-3.5 rounded-xl border border-primary/15 bg-primary/[0.04]"
              >
                <span className="text-[13px] font-bold text-primary">1 Tag Laufzeit · 100% dokumentiert</span>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-center mt-16"
        >
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2.5 text-[14px] font-semibold text-primary hover:gap-3.5 transition-all duration-300 px-6 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10"
          >
            Den Unterschied selbst erleben <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BeforeAfterTimeline;
