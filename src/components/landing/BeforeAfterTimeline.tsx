import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mail, Clock, AlertTriangle, FileX, ArrowRight, Zap, Bot, CheckCircle2, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const beforeSteps = [
  { icon: Mail, title: "E-Mail an 5 Personen", time: "Tag 1", pain: "Kein Tracking" },
  { icon: Clock, title: "Warten auf Feedback", time: "Tag 4", pain: "€2.400 verbrannt" },
  { icon: AlertTriangle, title: "Follow-up per Chat", time: "Tag 7", pain: "Kontext verloren" },
  { icon: FileX, title: "Audit? Keine Doku", time: "Tag 12", pain: "Compliance-Risiko" },
];

const afterSteps = [
  { icon: Zap, title: "Entscheidung angelegt", time: "Min 1", win: "SLA läuft" },
  { icon: Bot, title: "KI-Analyse", time: "Min 2", win: "Datenbasiert" },
  { icon: CheckCircle2, title: "One-Click Approval", time: "Tag 1", win: "73% schneller" },
  { icon: Shield, title: "Audit-ready", time: "Auto", win: "100% dokumentiert" },
];

const BeforeAfterTimeline = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineProgress = useTransform(scrollYProgress, [0.15, 0.65], [0, 1]);

  return (
    <section ref={ref} id="before-after" className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4 text-primary">Der Unterschied</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Eine Entscheidung. Zwei Realitäten.
          </h2>
        </motion.div>

        {/* Side by side — no toggle, show the truth simultaneously */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-4">
          {/* BEFORE column */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-destructive/60" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-destructive/80">Ohne Decivio</span>
            </motion.div>

            <div className="relative space-y-3">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-destructive/10">
                <motion.div className="absolute inset-x-0 top-0 bg-destructive/25 origin-top" style={{ scaleY: lineProgress }} />
              </div>

              {beforeSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  className="relative flex items-start gap-4 pl-10"
                >
                  <div className="absolute left-0 top-1 w-9 h-9 rounded-full border border-destructive/20 bg-card flex items-center justify-center">
                    <step.icon className="w-3.5 h-3.5 text-destructive/70" />
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-destructive/10 bg-card/80">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[13px] font-semibold">{step.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-destructive/60">{step.time}</span>
                    </div>
                    <p className="text-[11px] text-destructive/60">⚠ {step.pain}</p>
                  </div>
                </motion.div>
              ))}

              {/* Result */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="ml-10 mt-4 px-4 py-3 rounded-xl border border-destructive/15 bg-destructive/[0.04]"
              >
                <span className="text-[12px] font-bold text-destructive">12 Tage · €4.800 verloren · 0% Doku</span>
              </motion.div>
            </div>
          </div>

          {/* AFTER column */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary/80">Mit Decivio</span>
            </motion.div>

            <div className="relative space-y-3">
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-primary/10">
                <motion.div className="absolute inset-x-0 top-0 bg-primary/25 origin-top" style={{ scaleY: lineProgress }} />
              </div>

              {afterSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.1, duration: 0.5, ease }}
                  className="relative flex items-start gap-4 pl-10"
                >
                  <div className="absolute left-0 top-1 w-9 h-9 rounded-full border border-primary/20 bg-card flex items-center justify-center">
                    <step.icon className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-primary/10 bg-card/80">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[13px] font-semibold">{step.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-primary/60">{step.time}</span>
                    </div>
                    <p className="text-[11px] text-primary/70">✓ {step.win}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="ml-10 mt-4 px-4 py-3 rounded-xl border border-primary/15 bg-primary/[0.04]"
              >
                <span className="text-[12px] font-bold text-primary">1 Tag · €0 Kosten · 100% Audit-ready</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-14"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            Jetzt den Unterschied erleben <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BeforeAfterTimeline;
