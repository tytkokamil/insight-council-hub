import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingROICalculator = () => {
  const [teamSize, setTeamSize] = useState(20);
  const [decisionsPerMonth, setDecisionsPerMonth] = useState(30);
  const [avgHourlyRate, setAvgHourlyRate] = useState(85);

  const roi = useMemo(() => {
    // Without DecisionOS: avg 12 days per decision, 15% escalation rate, 2h/week overhead per person
    const avgDaysWithout = 12;
    const avgDaysWith = 7; // 42% faster
    const escalationRateWithout = 0.15;
    const escalationRateWith = 0.04; // 73% reduction
    const overheadHoursWithout = 2; // per person per week
    const overheadHoursWith = 0.5;

    // Time savings
    const daysSaved = (avgDaysWithout - avgDaysWith) * decisionsPerMonth;
    const timeSavingsPerMonth = daysSaved * 8 * avgHourlyRate * 0.3; // 30% of time is decision-related

    // Escalation savings
    const escalationsSavedPerMonth = decisionsPerMonth * (escalationRateWithout - escalationRateWith);
    const escalationCostSaved = escalationsSavedPerMonth * avgHourlyRate * 16; // 2 days per escalation

    // Overhead reduction
    const overheadSaved = teamSize * (overheadHoursWithout - overheadHoursWith) * 4 * avgHourlyRate;

    const totalMonthlySavings = Math.round(timeSavingsPerMonth + escalationCostSaved + overheadSaved);
    const annualSavings = totalMonthlySavings * 12;

    // Cost of DecisionOS (Pro plan)
    const monthlyCost = teamSize * 49;
    const annualCost = monthlyCost * 10; // 2 months free
    const netROI = annualSavings - annualCost;
    const roiMultiple = annualCost > 0 ? Math.round(annualSavings / annualCost) : 0;

    return {
      totalMonthlySavings,
      annualSavings,
      monthlyCost,
      annualCost,
      netROI,
      roiMultiple,
      daysSavedPerMonth: Math.round(daysSaved),
      escalationsSaved: Math.round(escalationsSavedPerMonth * 12),
    };
  }, [teamSize, decisionsPerMonth, avgHourlyRate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.7, ease }}
      className="mt-20 max-w-4xl mx-auto"
    >
      <div className="text-center mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Berechne deinen <span className="gradient-text">ROI</span>
        </h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Wie viel spart dein Unternehmen mit strukturierter Decision Governance?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Team-Größe</label>
              <span className="text-sm font-bold text-primary">{teamSize} Personen</span>
            </div>
            <Slider
              value={[teamSize]}
              onValueChange={([v]) => setTeamSize(v)}
              min={5}
              max={200}
              step={5}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Entscheidungen / Monat</label>
              <span className="text-sm font-bold text-primary">{decisionsPerMonth}</span>
            </div>
            <Slider
              value={[decisionsPerMonth]}
              onValueChange={([v]) => setDecisionsPerMonth(v)}
              min={5}
              max={200}
              step={5}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Ø Stundensatz (€)</label>
              <span className="text-sm font-bold text-primary">€{avgHourlyRate}</span>
            </div>
            <Slider
              value={[avgHourlyRate]}
              onValueChange={([v]) => setAvgHourlyRate(v)}
              min={40}
              max={200}
              step={5}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Basierend auf Durchschnittswerten: 42% schnellere Zyklen, 73% weniger Eskalationen, 
              75% weniger manueller Overhead.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <motion.div
            key={roi.annualSavings}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-6 text-center"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Jährliche Einsparung</p>
            <p className="text-4xl font-bold gradient-text">
              €{roi.annualSavings.toLocaleString("de-DE")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {roi.roiMultiple}× ROI bei €{roi.annualCost.toLocaleString("de-DE")} Jahreskosten
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Tage gespart/Monat</p>
              </div>
              <p className="text-xl font-bold">{roi.daysSavedPerMonth}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Eskalationen vermieden</p>
              </div>
              <p className="text-xl font-bold">{roi.escalationsSaved}/Jahr</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Monatliche Ersparnis</p>
              </div>
              <p className="text-xl font-bold">€{roi.totalMonthlySavings.toLocaleString("de-DE")}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Netto-ROI/Jahr</p>
              </div>
              <p className="text-xl font-bold text-accent-teal">+€{roi.netROI.toLocaleString("de-DE")}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingROICalculator;
