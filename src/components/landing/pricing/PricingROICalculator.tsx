import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/formatters";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

function useAnimatedNumber(value: number, duration = 600) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<number>();
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);
  return display;
}

const PricingROICalculator = () => {
  const { t } = useTranslation();
  const [teamSize, setTeamSize] = useState(20);
  const [decisionsPerMonth, setDecisionsPerMonth] = useState(30);
  const [avgHourlyRate, setAvgHourlyRate] = useState(85);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const roi = useMemo(() => {
    const avgDaysWithout = 12;
    const avgDaysWith = 7;
    const escalationRateWithout = 0.15;
    const escalationRateWith = 0.04;
    const overheadHoursWithout = 2;
    const overheadHoursWith = 0.5;

    const daysSaved = (avgDaysWithout - avgDaysWith) * decisionsPerMonth;
    const timeSavingsPerMonth = daysSaved * 8 * avgHourlyRate * 0.3;
    const escalationsSavedPerMonth = decisionsPerMonth * (escalationRateWithout - escalationRateWith);
    const escalationCostSaved = escalationsSavedPerMonth * avgHourlyRate * 16;
    const overheadSaved = teamSize * (overheadHoursWithout - overheadHoursWith) * 4 * avgHourlyRate;

    const totalMonthlySavings = Math.round(timeSavingsPerMonth + escalationCostSaved + overheadSaved);
    const annualSavings = totalMonthlySavings * 12;
    const monthlyCost = teamSize <= 10 ? 49 : teamSize <= 50 ? 149 : 499;
    const annualCost = monthlyCost * 10;
    const netROI = annualSavings - annualCost;
    const roiMultiple = annualCost > 0 ? Math.round(annualSavings / annualCost) : 0;

    return { totalMonthlySavings, annualSavings, monthlyCost, annualCost, netROI, roiMultiple, daysSavedPerMonth: Math.round(daysSaved), escalationsSaved: Math.round(escalationsSavedPerMonth * 12) };
  }, [teamSize, decisionsPerMonth, avgHourlyRate]);

  const animatedSavings = useAnimatedNumber(roi.annualSavings);
  const animatedNet = useAnimatedNumber(roi.netROI);
  const animatedDays = useAnimatedNumber(roi.daysSavedPerMonth);
  const animatedMonthly = useAnimatedNumber(roi.totalMonthlySavings);

  const cards = [
    { icon: Clock, label: t("landing.pricing.daysSavedMonth"), value: animatedDays.toString(), color: "text-primary" },
    { icon: AlertTriangle, label: t("landing.pricing.escalationsAvoided"), value: `${roi.escalationsSaved}/a`, color: "text-warning" },
    { icon: DollarSign, label: t("landing.pricing.monthlySavings"), value: formatCurrency(animatedMonthly), color: "text-primary" },
    { icon: TrendingUp, label: t("landing.pricing.netRoiYear"), value: `+${formatCurrency(animatedNet)}`, color: "text-accent-teal" },
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.7, ease }}
      className="mt-20 max-w-4xl mx-auto"
    >
      <div className="text-center mb-10">
        <motion.div
          className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
          animate={isInView ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Calculator className="w-5 h-5 text-primary" />
        </motion.div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          {t("landing.pricing.roiTitle")} <span className="gradient-text">{t("landing.pricing.roiHighlight")}</span>
        </h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">{t("landing.pricing.roiSubtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          {[
            { label: t("landing.pricing.teamSize"), value: t("landing.pricing.persons", { count: teamSize }), state: teamSize, setter: setTeamSize, min: 5, max: 200, step: 5 },
            { label: t("landing.pricing.decisionsMonth"), value: decisionsPerMonth.toString(), state: decisionsPerMonth, setter: setDecisionsPerMonth, min: 5, max: 200, step: 5 },
            { label: t("landing.pricing.avgHourlyRate"), value: `€${avgHourlyRate}`, state: avgHourlyRate, setter: setAvgHourlyRate, min: 40, max: 200, step: 5 },
          ].map((s, i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{s.label}</label>
                <motion.span
                  key={s.state}
                  initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
                  animate={{ scale: 1, color: "hsl(var(--primary))" }}
                  className="text-sm font-bold"
                >
                  {s.value}
                </motion.span>
              </div>
              <Slider value={[s.state]} onValueChange={([v]) => s.setter(v)} min={s.min} max={s.max} step={s.step} />
            </div>
          ))}
          <div id="roi-methodology" className="pt-4 border-t border-border space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">{t("landing.pricing.roiMethodologyTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("landing.pricing.roiBasedOn")}</p>
            <ul className="text-[11px] text-muted-foreground/70 space-y-1 list-disc list-inside">
              <li>{t("landing.pricing.roiMethod1")}</li>
              <li>{t("landing.pricing.roiMethod2")}</li>
              <li>{t("landing.pricing.roiMethod3")}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <motion.div
            className="relative rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-6 text-center overflow-hidden"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Pulse ring behind value */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-32 h-32 rounded-full border border-primary/10"
                animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider relative z-10">{t("landing.pricing.annualSavings")}</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={animatedSavings}
                className="text-4xl font-bold gradient-text relative z-10 tabular-nums"
              >
                {formatCurrency(animatedSavings)}
              </motion.p>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground mt-1 relative z-10">
              {roi.roiMultiple}× ROI · {teamSize <= 10 ? "Starter" : teamSize <= 50 ? "Professional" : "Enterprise"} ({formatCurrency(roi.monthlyCost)}/{t("landing.pricing.perMonth")})
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("roi-methodology");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-2 text-[11px] text-primary/60 hover:text-primary underline underline-offset-2 transition-colors relative z-10"
            >
              {t("landing.pricing.roiMethodology")}
            </button>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {cards.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px -8px hsl(var(--primary)/0.12)" }}
                className="rounded-xl border border-border bg-card p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingROICalculator;
