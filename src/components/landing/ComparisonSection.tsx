import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const criteria = [
  "Echtzeit Cost-of-Delay",
  "Kryptographischer Audit Trail",
  "KI-gestützte Briefings",
  "SLA-Tracking & Eskalation",
  "Compliance-Dokumentation",
  "One-Click Approval per E-Mail",
  "Branchen-Templates",
  "Predictive SLA",
];

const tools = [
  { name: "Excel / E-Mail", scores: [false, false, false, false, false, false, false, false] },
  { name: "Jira / Monday", scores: [false, false, false, true, false, false, false, false] },
  { name: "Decivio", scores: [true, true, true, true, true, true, true, true], highlighted: true },
];

const ComparisonSection = () => (
  <section id="comparison" className="py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-muted/10 to-transparent" />

    <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4" style={{ color: 'hsl(220 45% 50%)' }}>
          Vergleich
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Warum nicht einfach Excel oder Jira?
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Projektmanagement-Tools managen Aufgaben — nicht Entscheidungen.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.7, ease }}
        className="rounded-2xl border border-border/40 bg-white/80 backdrop-blur-sm overflow-hidden"
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_repeat(3,100px)] md:grid-cols-[1fr_repeat(3,140px)] items-center border-b border-border/30 px-5 py-3.5" style={{ background: 'hsl(220 30% 97%)' }}>
          <div className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">Funktion</div>
          {tools.map((tool) => (
            <div
              key={tool.name}
              className={`text-xs font-semibold text-center ${
                tool.highlighted ? "" : "text-muted-foreground/70"
              }`}
              style={tool.highlighted ? { color: 'hsl(220 45% 50%)' } : undefined}
            >
              {tool.name}
            </div>
          ))}
        </div>

        {/* Rows */}
        {criteria.map((criterion, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, duration: 0.4, ease }}
            className={`grid grid-cols-[1fr_repeat(3,100px)] md:grid-cols-[1fr_repeat(3,140px)] items-center px-5 py-3.5 ${
              i < criteria.length - 1 ? "border-b border-border/20" : ""
            } hover:bg-muted/10 transition-colors`}
          >
            <span className="text-[13px]">{criterion}</span>
            {tools.map((tool, ti) => (
              <div key={ti} className="flex justify-center">
                {tool.scores[i] ? (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: tool.highlighted ? 'hsl(220 45% 50% / 0.08)' : 'hsl(160 40% 50% / 0.08)',
                      color: tool.highlighted ? 'hsl(220 45% 50%)' : 'hsl(160 40% 50%)',
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/40 text-muted-foreground/20">
                    <X className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-center mt-8"
      >
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: 'hsl(220 45% 50%)' }}
        >
          Selbst überzeugen — 14 Tage kostenlos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default ComparisonSection;
