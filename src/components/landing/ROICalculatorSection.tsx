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

  const inputClass = "w-full h-10 px-3 rounded-xl bg-white/80 border border-border/40 text-sm font-medium focus:border-[hsl(220,45%,55%)] focus:outline-none focus:ring-1 focus:ring-[hsl(220,45%,55%,0.2)] transition-all tabular-nums";

  return (
    <section id="roi" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase" style={{ color: 'hsl(220 45% 50%)' }}>ROI-Rechner</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Was kostet Entscheidungsverzögerung?
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="max-w-[640px] mx-auto"
        >
          <div className="rounded-2xl border border-border/40 bg-white/80 backdrop-blur-sm p-7">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] mb-1.5" style={{ color: 'hsl(220 10% 58%)' }}>Stundensatz (€/h)</label>
                <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] mb-1.5" style={{ color: 'hsl(220 10% 58%)' }}>Betroffene Personen</label>
                <input type="number" value={persons} onChange={e => setPersons(Number(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] mb-1.5" style={{ color: 'hsl(220 10% 58%)' }}>Offene Entscheidungen</label>
                <input type="number" value={decisions} onChange={e => setDecisions(Number(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] mb-1.5" style={{ color: 'hsl(220 10% 58%)' }}>Ø Verzögerung (Tage)</label>
                <input type="number" value={delayDays} onChange={e => setDelayDays(Number(e.target.value) || 0)} className={inputClass} />
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(220,40%,70%,0.15)] p-5 text-center" style={{ background: 'hsl(220 45% 96%)' }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(220 45% 55%)' }} />
                <span className="text-[11px]" style={{ color: 'hsl(220 12% 58%)' }}>Verzögerungskosten pro Monat</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold tabular-nums font-mono" style={{ color: 'hsl(220 45% 45%)' }}>
                €{monthlyCost.toLocaleString("de-DE")}
              </div>
              <p className="text-[12px] mt-2" style={{ color: 'hsl(220 10% 58%)' }}>
                Decivio Professional: €149/Monat — ROI nach weniger als 1 Tag.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculatorSection;
