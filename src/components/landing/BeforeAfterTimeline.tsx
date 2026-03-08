import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mail, Clock, AlertTriangle, FileX, ArrowRight, Zap, Shield, Bot, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const beforeSteps = [
  {
    icon: Mail,
    title: "E-Mail an 5 Personen",
    desc: "Entscheidung wird per E-Mail kommuniziert",
    time: "Tag 1",
    pain: "Kein Tracking, kein SLA",
  },
  {
    icon: Clock,
    title: "Warten auf Feedback",
    desc: "2 von 5 antworten nach 3 Tagen",
    time: "Tag 4",
    pain: "€2.400 unsichtbare Kosten",
  },
  {
    icon: AlertTriangle,
    title: "Erinnerung per Chat",
    desc: "Follow-up über Slack & Teams",
    time: "Tag 7",
    pain: "Kontext geht verloren",
  },
  {
    icon: FileX,
    title: "Audit? Keine Dokumentation",
    desc: "Entscheidung irgendwo im Posteingang",
    time: "Tag 12",
    pain: "Compliance-Risiko",
  },
];

const afterSteps = [
  {
    icon: Zap,
    title: "Entscheidung angelegt",
    desc: "Template gewählt, Reviewer zugewiesen",
    time: "Minute 1",
    win: "SLA startet automatisch",
  },
  {
    icon: Bot,
    title: "KI-Analyse & Briefing",
    desc: "Risikoeinschätzung, Optionen, Empfehlung",
    time: "Minute 2",
    win: "Datenbasierte Grundlage",
  },
  {
    icon: CheckCircle2,
    title: "One-Click Approval",
    desc: "Reviewer genehmigen direkt aus der E-Mail",
    time: "Tag 1",
    win: "73% schnellere Freigabe",
  },
  {
    icon: Shield,
    title: "Audit-ready dokumentiert",
    desc: "SHA-256 Hash-Kette, lückenloser Trail",
    time: "Automatisch",
    win: "100% Compliance",
  },
];

const BeforeAfterTimeline = () => {
  const [activeView, setActiveView] = useState<"before" | "after">("before");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineProgress = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  const steps = activeView === "before" ? beforeSteps : afterSteps;
  const isBefore = activeView === "before";

  return (
    <section ref={sectionRef} id="before-after" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4 text-primary">
            Der Unterschied
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Eine Entscheidung. Zwei Realitäten.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Sehen Sie den Unterschied — Schritt für Schritt.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex rounded-xl border border-border/50 bg-card p-1 shadow-sm">
            <button
              onClick={() => setActiveView("before")}
              className={`relative px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
                isBefore
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isBefore && (
                <motion.div
                  layoutId="timeline-toggle"
                  className="absolute inset-0 rounded-lg bg-destructive/8 border border-destructive/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">❌ Ohne Decivio</span>
            </button>
            <button
              onClick={() => setActiveView("after")}
              className={`relative px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
                !isBefore
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {!isBefore && (
                <motion.div
                  layoutId="timeline-toggle"
                  className="absolute inset-0 rounded-lg bg-primary/8 border border-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">✅ Mit Decivio</span>
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px">
            <div className={`absolute inset-0 ${isBefore ? "bg-destructive/10" : "bg-primary/10"}`} />
            <motion.div
              className={`absolute top-0 left-0 w-full origin-top ${isBefore ? "bg-destructive/30" : "bg-primary/30"}`}
              style={{ scaleY: lineProgress }}
            />
          </div>

          <div className="space-y-6 md:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={`${activeView}-${i}`}
                  initial={{ opacity: 0, y: 24, x: isLeft ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease }}
                  className={`relative md:flex md:items-center md:gap-8 pl-20 md:pl-0 pb-8 md:pb-16 ${
                    isLeft ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content card */}
                  <div className={`flex-1 ${isLeft ? "md:text-right" : "md:text-left"}`}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`inline-block p-5 rounded-2xl border transition-all duration-300 ${
                        isBefore
                          ? "border-destructive/15 bg-card hover:border-destructive/30 hover:shadow-[0_8px_30px_-12px_hsl(0_60%_50%/0.1)]"
                          : "border-primary/15 bg-card hover:border-primary/30 hover:shadow-[0_8px_30px_-12px_hsl(220_50%_50%/0.1)]"
                      }`}
                    >
                      <div className={`flex items-center gap-2 mb-2 ${isLeft ? "md:justify-end" : ""}`}>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isBefore ? "bg-destructive/8 text-destructive" : "bg-primary/8 text-primary"
                        }`}>
                          {step.time}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-semibold mb-1 text-foreground">{step.title}</h3>
                      <p className="text-[13px] text-muted-foreground mb-2">{step.desc}</p>
                      <p className={`text-[11px] font-medium ${
                        isBefore ? "text-destructive/70" : "text-primary/80"
                      }`}>
                        {isBefore ? `⚠ ${(step as typeof beforeSteps[0]).pain}` : `✓ ${(step as typeof afterSteps[0]).win}`}
                      </p>
                    </motion.div>
                  </div>

                  {/* Center node */}
                  <div className="absolute left-8 md:left-1/2 top-5 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 300, damping: 15 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isBefore
                          ? "border-destructive/30 bg-card text-destructive"
                          : "border-primary/30 bg-card text-primary"
                      }`}
                    >
                      <step.icon className="w-4 h-4" />
                    </motion.div>
                  </div>

                  {/* Spacer for other side */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>

          {/* Result badge */}
          <motion.div
            key={activeView}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            className="relative flex justify-center mt-4"
          >
            <div className={`px-6 py-3 rounded-2xl border shadow-sm ${
              isBefore
                ? "border-destructive/20 bg-destructive/5"
                : "border-primary/20 bg-primary/5"
            }`}>
              <span className={`text-sm font-bold ${isBefore ? "text-destructive" : "text-primary"}`}>
                {isBefore ? "12 Tage · €4.800 verloren · 0% Dokumentation" : "1 Tag · €0 Verzögerungskosten · 100% Audit-ready"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-12"
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
