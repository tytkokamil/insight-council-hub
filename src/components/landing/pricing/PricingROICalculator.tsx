import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingROICalculator = () => {
  const { t } = useTranslation();
  const [teamSize, setTeamSize] = useState(20);
  const [decisionsPerMonth, setDecisionsPerMonth] = useState(30);
  const [avgHourlyRate, setAvgHourlyRate] = useState(85);

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.7, ease }} className="mt-20 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          {t("landing.pricing.roiTitle")} <span className="gradient-text">{t("landing.pricing.roiHighlight")}</span>
        </h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">{t("landing.pricing.roiSubtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">{t("landing.pricing.teamSize")}</label>
              <span className="text-sm font-bold text-primary">{t("landing.pricing.persons", { count: teamSize })}</span>
            </div>
            <Slider value={[teamSize]} onValueChange={([v]) => setTeamSize(v)} min={5} max={200} step={5} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">{t("landing.pricing.decisionsMonth")}</label>
              <span className="text-sm font-bold text-primary">{decisionsPerMonth}</span>
            </div>
            <Slider value={[decisionsPerMonth]} onValueChange={([v]) => setDecisionsPerMonth(v)} min={5} max={200} step={5} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">{t("landing.pricing.avgHourlyRate")}</label>
              <span className="text-sm font-bold text-primary">€{avgHourlyRate}</span>
            </div>
            <Slider value={[avgHourlyRate]} onValueChange={([v]) => setAvgHourlyRate(v)} min={40} max={200} step={5} />
          </div>
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
          <motion.div key={roi.annualSavings} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{t("landing.pricing.annualSavings")}</p>
            <p className="text-4xl font-bold gradient-text">€{roi.annualSavings.toLocaleString("de-DE")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {roi.roiMultiple}× ROI · {teamSize <= 10 ? "Starter" : teamSize <= 50 ? "Professional" : "Enterprise"} (€{roi.monthlyCost}/Mo)
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("roi-methodology");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-2 text-[11px] text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
            >
              {t("landing.pricing.roiMethodology")}
            </button>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, label: t("landing.pricing.daysSavedMonth"), value: roi.daysSavedPerMonth },
              { icon: AlertTriangle, label: t("landing.pricing.escalationsAvoided"), value: `${roi.escalationsSaved}/a` },
              { icon: DollarSign, label: t("landing.pricing.monthlySavings"), value: `€${roi.totalMonthlySavings.toLocaleString("de-DE")}` },
              { icon: TrendingUp, label: t("landing.pricing.netRoiYear"), value: `+€${roi.netROI.toLocaleString("de-DE")}`, color: "text-accent-teal" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
                <p className={`text-xl font-bold ${item.color || ""}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingROICalculator;
