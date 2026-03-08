import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, ArrowRight, Minus } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const criteria = [
  { label: "Echtzeit Cost-of-Delay", category: "intelligence" },
  { label: "Kryptographischer Audit Trail", category: "governance" },
  { label: "KI-gestützte Briefings", category: "intelligence" },
  { label: "SLA-Tracking & Eskalation", category: "execution" },
  { label: "Compliance-Dokumentation", category: "governance" },
  { label: "One-Click Approval per E-Mail", category: "execution" },
  { label: "Branchen-Templates", category: "execution" },
  { label: "Predictive SLA", category: "intelligence" },
  { label: "Decision Graph & Abhängigkeiten", category: "intelligence" },
  { label: "Meeting Mode", category: "execution" },
];

type Score = true | false | "partial";

const tools: { name: string; scores: Score[]; highlighted?: boolean }[] = [
  { name: "Excel / E-Mail", scores: [false, false, false, false, false, false, false, false, false, false] },
  { name: "Jira / ClickUp", scores: [false, false, false, true, false, "partial", false, false, "partial", false] },
  { name: "SAP / ERP", scores: [false, "partial", false, true, "partial", false, false, false, "partial", false] },
  { name: "Kissflow", scores: [false, false, false, "partial", "partial", "partial", false, false, false, false] },
  { name: "Consulting", scores: [false, false, "partial", false, true, false, "partial", false, false, false] },
  { name: "Decivio", scores: [true, true, true, true, true, true, true, true, true, true], highlighted: true },
];

const categoryColors: Record<string, string> = {
  intelligence: "hsl(var(--primary))",
  governance: "hsl(350 45% 55%)",
  execution: "hsl(250 40% 55%)",
};

const ScoreIcon = ({ score, highlighted }: { score: Score; highlighted?: boolean }) => {
  if (score === true) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`w-7 h-7 rounded-full flex items-center justify-center ${
          highlighted ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
        }`}
      >
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </motion.div>
    );
  }
  if (score === "partial") {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-warning/10 text-warning">
        <Minus className="w-4 h-4" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground/20">
      <X className="w-3.5 h-3.5" />
    </div>
  );
};

const ComparisonSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Count scores for summary
  const totals = tools.map(t => t.scores.filter(s => s === true).length);

  return (
    <section id="comparison" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4 text-primary">Vergleich</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Warum nicht einfach Excel oder Jira?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Projektmanagement-Tools managen Aufgaben — nicht Entscheidungen.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease }}
          className="rounded-2xl border border-border/40 bg-background/80 backdrop-blur-sm overflow-x-auto shadow-sm -mx-4 sm:mx-0"
        >
          {/* Header */}
            <div className="grid grid-cols-[140px_repeat(6,56px)] sm:grid-cols-[1fr_repeat(6,60px)] md:grid-cols-[1fr_repeat(6,100px)] items-center border-b border-border/30 px-3 sm:px-5 py-4 bg-muted/30 min-w-[480px]">
            <div className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">Funktion</div>
            {tools.map((tool, ti) => (
              <div key={tool.name} className="text-center">
                <span className={`text-xs font-semibold ${tool.highlighted ? "text-primary" : "text-muted-foreground/70"}`}>
                  {tool.name}
                </span>
                {isInView && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5 + ti * 0.15, duration: 0.6, ease }}
                    className="mx-auto mt-1.5"
                  >
                    <div className={`h-1 rounded-full mx-auto ${tool.highlighted ? "bg-primary/20" : "bg-muted"}`}
                      style={{ maxWidth: `${(totals[ti] / criteria.length) * 100}%` }}
                    />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Rows */}
          {criteria.map((criterion, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease }}
              className={`grid grid-cols-[1fr_repeat(6,60px)] md:grid-cols-[1fr_repeat(6,100px)] items-center px-5 py-3.5 group ${
                i < criteria.length - 1 ? "border-b border-border/15" : ""
              } hover:bg-primary/[0.02] transition-colors`}
            >
              <span className="text-[13px] flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: categoryColors[criterion.category] }}
                />
                {criterion.label}
              </span>
              {tools.map((tool, ti) => (
                <div key={ti} className="flex justify-center">
                  <ScoreIcon score={tool.scores[i]} highlighted={tool.highlighted} />
                </div>
              ))}
            </motion.div>
          ))}

          {/* Score summary row */}
          <div className="grid grid-cols-[1fr_repeat(6,60px)] md:grid-cols-[1fr_repeat(6,100px)] items-center px-5 py-4 border-t border-border/30 bg-muted/20">
            <span className="text-[12px] font-semibold text-muted-foreground">Abdeckung</span>
            {tools.map((tool, ti) => (
              <div key={ti} className="text-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + ti * 0.1 }}
                  className={`text-lg font-bold ${tool.highlighted ? "text-primary" : "text-muted-foreground/50"}`}
                >
                  {totals[ti]}/{criteria.length}
                </motion.span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-8"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            Selbst überzeugen — 14 Tage kostenlos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
