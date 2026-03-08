import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const PRESETS: Record<string, number> = { Maschinenbau: 85, Automotive: 95, Pharma: 90, Finanzwesen: 100 };

const ROICalculatorSection = memo(() => {
  const [tab, setTab] = useState("Maschinenbau");
  const [rate, setRate] = useState(85);
  const [people, setPeople] = useState(4);
  const [decisions, setDecisions] = useState(5);
  const [delay, setDelay] = useState(5);
  const [showFormula, setShowFormula] = useState(false);

  const selectTab = useCallback((t: string) => { setTab(t); setRate(PRESETS[t]); }, []);
  const monthlyCost = rate * 8 * people * decisions * delay;
  const breakeven = 149 / (rate * 8 * people);

  return (
    <section id="roi" className="dark">
      <div className="py-24 bg-background relative overflow-hidden">
        <div className="aurora-bg" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold mb-4 text-foreground">Was kostet Entscheidungsverzögerung bei Ihnen?</h2>
            <p className="text-lg text-muted-foreground">Berechnen Sie es selbst. Mit Ihren Zahlen.</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {Object.keys(PRESETS).map(t => (
              <button key={t} onClick={() => selectTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-destructive text-destructive-foreground" : "bg-card text-muted-foreground border border-border hover:border-destructive/40"}`}>{t}</button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                { label: "Stundensatz (€)", value: rate, set: setRate, min: 40, max: 200, step: 5, fmt: (v: number) => `€${v}` },
                { label: "Personen pro Entscheidung", value: people, set: setPeople, min: 1, max: 15, step: 1, fmt: (v: number) => `${v}` },
                { label: "Offene Entscheidungen", value: decisions, set: setDecisions, min: 1, max: 20, step: 1, fmt: (v: number) => `${v}` },
                { label: "Verzögerung (Tage)", value: delay, set: setDelay, min: 1, max: 20, step: 1, fmt: (v: number) => `${v} Tage` },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground" style={{ fontFamily: "var(--font-mono)" }}>{s.fmt(s.value)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.set(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-card" style={{ accentColor: "hsl(var(--destructive))" }} />
                </div>
              ))}
              <button onClick={() => setShowFormula(!showFormula)} className="text-xs underline text-muted-foreground">{showFormula ? "Ausblenden" : "Wie wird das berechnet?"}</button>
              {showFormula && <p className="text-xs p-3 rounded-lg bg-card text-muted-foreground border border-border">Stundensatz × 8h × Personen × Entscheidungen × Tage = Kosten/Monat</p>}
            </div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-ultra rounded-xl p-8">
              <p className="text-sm mb-2 text-muted-foreground">💸 Verzögerungskosten/Monat:</p>
              <motion.div key={monthlyCost} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}>
                <span className="text-[42px] font-bold tabular-nums text-destructive" style={{ fontFamily: "var(--font-mono)" }}>€{monthlyCost.toLocaleString("de-DE")}</span>
              </motion.div>
              <div className="my-6 pt-6 border-t border-border">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Decivio Professional:</span><span className="font-semibold text-foreground">€149/Mo</span></div>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <p className="text-sm text-foreground">💡 Wenn Decivio eine Entscheidung um <span className="font-bold text-destructive" style={{ fontFamily: "var(--font-mono)" }}>{breakeven.toFixed(1)}</span> Tage beschleunigt — ist es bezahlt.</p>
              </div>
              <Link to="/auth" className="mt-6 w-full inline-flex items-center justify-center text-sm font-semibold text-destructive-foreground px-6 py-3 rounded-lg min-h-[48px] bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                Diese Einsparung realisieren →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
});
ROICalculatorSection.displayName = "ROICalculatorSection";
export default ROICalculatorSection;
