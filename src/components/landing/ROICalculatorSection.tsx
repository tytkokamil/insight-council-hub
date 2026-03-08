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
    <section id="roi" className="py-24" style={{ background: "#0F1729" }}>
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#F1F5F9" }}>Was kostet Entscheidungsverzögerung bei Ihnen?</h2>
          <p className="text-lg" style={{ color: "#94A3B8" }}>Berechnen Sie es selbst. Mit Ihren Zahlen.</p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {Object.keys(PRESETS).map(t => (
            <button key={t} onClick={() => selectTab(t)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t ? { background: "#EF4444", color: "#fff" } : { background: "#1E293B", color: "#94A3B8", border: "1px solid #334155" }}>{t}</button>
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
                  <span className="text-sm" style={{ color: "#94A3B8" }}>{s.label}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "#F1F5F9", fontFamily: "'JetBrains Mono', monospace" }}>{s.fmt(s.value)}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.set(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ accentColor: "#EF4444", background: "#1E293B" }} />
              </div>
            ))}
            <button onClick={() => setShowFormula(!showFormula)} className="text-xs underline" style={{ color: "#64748B" }}>{showFormula ? "Ausblenden" : "Wie wird das berechnet?"}</button>
            {showFormula && <p className="text-xs p-3 rounded-lg" style={{ background: "#1E293B", color: "#94A3B8" }}>Stundensatz × 8h × Personen × Entscheidungen × Tage = Kosten/Monat</p>}
          </div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-xl p-8" style={{ background: "#0A0F1E", border: "1px solid #1E293B" }}>
            <p className="text-sm mb-2" style={{ color: "#94A3B8" }}>💸 Verzögerungskosten/Monat:</p>
            <motion.div key={monthlyCost} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}>
              <span className="text-[42px] font-bold tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#EF4444" }}>€{monthlyCost.toLocaleString("de-DE")}</span>
            </motion.div>
            <div className="my-6 pt-6" style={{ borderTop: "1px solid #1E293B" }}>
              <div className="flex justify-between text-sm"><span style={{ color: "#94A3B8" }}>Decivio Professional:</span><span className="font-semibold" style={{ color: "#F1F5F9" }}>€149/Mo</span></div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "#1E293B" }}>
              <p className="text-sm" style={{ color: "#F1F5F9" }}>💡 Wenn Decivio eine Entscheidung um <span className="font-bold" style={{ color: "#EF4444", fontFamily: "'JetBrains Mono', monospace" }}>{breakeven.toFixed(1)}</span> Tage beschleunigt — ist es bezahlt.</p>
            </div>
            <Link to="/auth" className="mt-6 w-full inline-flex items-center justify-center text-sm font-semibold text-white px-6 py-3 rounded-lg min-h-[48px] shadow-lg"
              style={{ background: "#EF4444" }}>Diese Einsparung realisieren →</Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
ROICalculatorSection.displayName = "ROICalculatorSection";
export default ROICalculatorSection;
