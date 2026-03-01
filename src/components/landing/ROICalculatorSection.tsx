import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const ROICalculatorSection = () => {
  const [hourlyRate, setHourlyRate] = useState(120);
  const [persons, setPersons] = useState(3);
  const [decisions, setDecisions] = useState(5);
  const [delayDays, setDelayDays] = useState(7);

  const monthlyCost = useMemo(() => {
    return hourlyRate * 8 * persons * decisions * delayDays;
  }, [hourlyRate, persons, decisions, delayDays]);

  const inputClass = "w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all tabular-nums";

  return (
    <section id="roi" className="py-24 relative bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">ROI-Rechner</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Was kostet Entscheidungsverzögerung in Ihrem Unternehmen?
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease }}
          className="max-w-[700px] mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Stundensatz (€/Stunde)</label>
                <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Betroffene Personen</label>
                <input type="number" value={persons} onChange={e => setPersons(Number(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Offene Entscheidungen</label>
                <input type="number" value={decisions} onChange={e => setDecisions(Number(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Ø Verzögerung (Tage)</label>
                <input type="number" value={delayDays} onChange={e => setDelayDays(Number(e.target.value) || 0)} className={inputClass} />
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl border border-warning/20 bg-warning/[0.04] p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                <span className="text-xs text-muted-foreground">Ihre Verzögerungskosten pro Monat</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-warning tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                €{monthlyCost.toLocaleString("de-DE")}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Decivio Professional kostet €149/Monat — ROI nach weniger als 1 Tag vermiedener Verzögerung.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculatorSection;
