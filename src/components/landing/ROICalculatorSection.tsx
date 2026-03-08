import { useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Calculator, TrendingDown, ArrowRight, Factory, Landmark, Pill, Monitor } from "lucide-react";
import { useEffect, useRef } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

const presets = [
  { label: "Maschinenbau", icon: Factory, hourlyRate: 85, persons: 3, decisions: 5, delayDays: 8 },
  { label: "Finanzwesen", icon: Landmark, hourlyRate: 110, persons: 3, decisions: 6, delayDays: 5 },
  { label: "Pharma", icon: Pill, hourlyRate: 95, persons: 4, decisions: 4, delayDays: 9 },
  { label: "IT-Dienstleistung", icon: Monitor, hourlyRate: 90, persons: 3, decisions: 5, delayDays: 6 },
];

const AnimatedNumber = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, v => `€${Math.round(v).toLocaleString("de-DE")}`);

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value, motionVal]);

  useEffect(() => {
    return display.on("change", v => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [display]);

  return <span ref={ref}>€0</span>;
};

const SliderInput = ({ label, value, onChange, min, max, step = 1, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-[12px] text-muted-foreground font-medium">{label}</label>
        <span className="text-[13px] font-bold tabular-nums text-foreground">{value}{suffix}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted/60" />
        <div className="absolute left-0 h-1.5 rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full h-6 opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-primary border-2 border-background shadow-md pointer-events-none transition-[left] duration-100"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
};

const ROICalculatorSection = () => {
  const [hourlyRate, setHourlyRate] = useState(90);
  const [persons, setPersons] = useState(3);
  const [decisions, setDecisions] = useState(5);
  const [delayDays, setDelayDays] = useState(7);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  // Brutto-Verzögerungskosten: Stundensatz × 8h × Personen × Entscheidungen × Tage
  const grossCost = useMemo(
    () => Math.round(hourlyRate * 8 * persons * decisions * delayDays),
    [hourlyRate, persons, decisions, delayDays]
  );
  // 55% Effizienzfaktor — nicht alle Zeit ist produktiv verloren
  const monthlyCost = useMemo(() => Math.round(grossCost * 0.55), [grossCost]);
  // 73% Reduktion durch schnellere Approvals mit Decivio
  const savings = useMemo(() => Math.round(monthlyCost * 0.73), [monthlyCost]);
  const roiMultiple = useMemo(() => savings > 0 ? Math.round(savings / 149) : 0, [savings]);

  const applyPreset = (i: number) => {
    const p = presets[i];
    setHourlyRate(p.hourlyRate);
    setPersons(p.persons);
    setDecisions(p.decisions);
    setDelayDays(p.delayDays);
    setActivePreset(i);
  };

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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-muted/30 mb-6">
            <Calculator className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">ROI-Rechner</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Was kostet Entscheidungsverzögerung?
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
            Berechnen Sie Ihre unsichtbaren Kosten — und wie viel Sie mit Decivio einsparen.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="max-w-[680px] mx-auto"
        >
          {/* Presets */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => applyPreset(i)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 border ${
                  activePreset === i
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-7 space-y-6">
            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <SliderInput label="Stundensatz" value={hourlyRate} onChange={v => { setHourlyRate(v); setActivePreset(null); }} min={40} max={200} step={5} suffix=" €/h" />
              <SliderInput label="Betroffene Personen" value={persons} onChange={v => { setPersons(v); setActivePreset(null); }} min={1} max={15} suffix="" />
              <SliderInput label="Offene Entscheidungen" value={decisions} onChange={v => { setDecisions(v); setActivePreset(null); }} min={1} max={20} suffix="" />
              <SliderInput label="Ø Verzögerung" value={delayDays} onChange={v => { setDelayDays(v); setActivePreset(null); }} min={1} max={20} suffix=" Tage" />
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-destructive/15 bg-destructive/[0.04] p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-destructive/70" />
                  <span className="text-[11px] text-muted-foreground">Aktuelle Kosten</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold tabular-nums text-destructive">
                  <AnimatedNumber value={monthlyCost} />
                </div>
                <span className="text-[10px] text-destructive/60">/Monat</span>
              </div>

              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] text-muted-foreground">Einsparung mit Decivio</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold tabular-nums text-primary">
                  <AnimatedNumber value={savings} />
                </div>
                <span className="text-[10px] text-primary/60">/Monat (55% Reduktion)</span>
              </div>
            </div>

            {/* Calculation breakdown */}
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Berechnung: {hourlyRate}€/h × {persons} Personen × {decisions} Entscheidungen × {delayDays} Tage / 4,3 Wochen
            </p>

            {/* ROI Badge */}
            <motion.div
              key={roiMultiple}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease }}
              className="text-center pt-1"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/30">
                <span className="text-[12px] text-muted-foreground">{roiMultiple}× Return bei €149/Mo</span>
                <ArrowRight className="w-3 h-3 text-primary" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculatorSection;
