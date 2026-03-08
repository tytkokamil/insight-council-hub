import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CodCalculatorWidget = () => {
  const [searchParams] = useSearchParams();
  const color = searchParams.get("color") || "1E3A5F";
  const lang = searchParams.get("lang") || "de";
  const ref = searchParams.get("ref") || "widget";
  const compact = searchParams.get("compact") === "true";

  const [decisions, setDecisions] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(85);
  const [delayDays, setDelayDays] = useState(7);

  const weeklyCost = useMemo(() => {
    return Math.round(hourlyRate * 8 * decisions * delayDays / 7 * 1.5);
  }, [decisions, hourlyRate, delayDays]);

  const yearlyCost = weeklyCost * 52;

  const accentColor = `#${color}`;

  const labels = lang === "en" ? {
    title: "What do your open decisions cost?",
    decisions: "Open decisions / approvals:",
    hourly: "Avg. hourly rate of your decision-makers:",
    delay: "Avg. delay per decision:",
    decisionsUnit: "Decisions",
    hourlyUnit: "€/h",
    daysUnit: "Days",
    weeklyLabel: "Cost per week:",
    yearlyLabel: "Cost per year:",
    cta: "See my real numbers in Decivio — free",
    poweredBy: "Powered by Decivio",
  } : {
    title: "Was kosten Ihre offenen Entscheidungen?",
    decisions: "Offene Entscheidungen / Freigaben:",
    hourly: "Ø Stundensatz Ihrer Entscheider:",
    delay: "Durchschnittliche Verzögerung pro Entscheidung:",
    decisionsUnit: "Entscheidungen",
    hourlyUnit: "€/h",
    daysUnit: "Tage",
    weeklyLabel: "Kosten pro Woche:",
    yearlyLabel: "Kosten pro Jahr:",
    cta: "Meine echten Zahlen in Decivio sehen — kostenlos",
    poweredBy: "Powered by Decivio",
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-lg p-6" style={{ minHeight: compact ? 300 : 420 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: accentColor }}>{labels.title}</h2>
          <a href="https://decivio.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 hover:text-gray-600">
            {labels.poweredBy}
          </a>
        </div>

        {/* Slider 1 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-700">{labels.decisions}</label>
            <span className="text-sm font-semibold" style={{ color: accentColor }}>{decisions} {labels.decisionsUnit}</span>
          </div>
          <Slider value={[decisions]} onValueChange={([v]) => setDecisions(v)} min={1} max={30} step={1} className="[&_[role=slider]]:border-2" style={{ "--slider-color": accentColor } as any} />
        </div>

        {/* Slider 2 */}
        {!compact && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700">{labels.hourly}</label>
              <span className="text-sm font-semibold" style={{ color: accentColor }}>{hourlyRate} {labels.hourlyUnit}</span>
            </div>
            <Slider value={[hourlyRate]} onValueChange={([v]) => setHourlyRate(v)} min={40} max={250} step={5} />
          </div>
        )}

        {/* Slider 3 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-700">{labels.delay}</label>
            <span className="text-sm font-semibold" style={{ color: accentColor }}>{delayDays} {labels.daysUnit}</span>
          </div>
          <Slider value={[delayDays]} onValueChange={([v]) => setDelayDays(v)} min={1} max={30} step={1} />
        </div>

        {/* Result */}
        <div className="rounded-xl p-5 text-center mb-4" style={{ backgroundColor: accentColor }}>
          <p className="text-sm text-white/80 mb-1">{labels.weeklyLabel}</p>
          <p className="text-[42px] font-bold text-white tabular-nums leading-none">
            {weeklyCost.toLocaleString("de-DE")}€
          </p>
          <p className="text-sm text-white/70 mt-2">
            {labels.yearlyLabel} {yearlyCost.toLocaleString("de-DE")}€
          </p>
        </div>

        {/* CTA */}
        <a
          href={`https://decivio.com/auth?ref=${ref}&cod=${weeklyCost}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-colors"
          style={{ backgroundColor: "white", color: accentColor, border: `2px solid ${accentColor}` }}
        >
          {labels.cta} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default CodCalculatorWidget;
