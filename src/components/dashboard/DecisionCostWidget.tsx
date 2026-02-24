import { useState } from "react";
import { DollarSign, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";
import { useTranslation } from "react-i18next";

const DecisionCostWidget = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [], isLoading: decLoading } = useDecisions();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const [showCalc, setShowCalc] = useState(false);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [customPersons, setCustomPersons] = useState<number | null>(null);
  const [customHours, setCustomHours] = useState<number | null>(null);

  if (decLoading || teamLoading) return <WidgetSkeleton rows={3} showScore />;

  const teamRateMap: Record<string, number> = {};
  teams.forEach(ti => { if (ti.hourly_rate) teamRateMap[ti.id] = ti.hourly_rate; });

  const rate = customRate ?? 75;
  const persons = customPersons ?? 2;
  const hours = customHours ?? 2;

  const openDecisions = allDecisions.filter(d => d.status === "draft" || d.status === "review");
  const now = Date.now();
  let totalCost = 0;
  const costs: { title: string; days: number; cost: number; priority: string; baseRate: number }[] = [];

  openDecisions.forEach(d => {
    const daysOpen = (now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const baseRate = d.team_id && teamRateMap[d.team_id] ? teamRateMap[d.team_id] : rate;
    const cost = Math.round(daysOpen * persons * hours * baseRate);
    totalCost += cost;
    costs.push({ title: d.title, days: Math.round(daysOpen), cost, priority: d.priority, baseRate });
  });

  const topCosts = costs.sort((a, b) => b.cost - a.cost).slice(0, 3);

  const CONFIDENCE_LEVELS = [
    { min: 0, max: 5000, label: t("widgets.confidenceHigh"), color: "text-success" },
    { min: 5000, max: 20000, label: t("widgets.confidenceMedium"), color: "text-warning" },
    { min: 20000, max: Infinity, label: t("widgets.confidenceLow"), color: "text-destructive" },
  ] as const;
  const confidence = CONFIDENCE_LEVELS.find(c => totalCost >= c.min && totalCost < c.max) ?? CONFIDENCE_LEVELS[2];

  const formatCost = (cost: number) => {
    if (cost >= 1000) return `${(cost / 1000).toFixed(1)}k€`;
    return `${cost}€`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">{t("widgets.delayCost")}</CardTitle>
            <ScoreMethodology
              title={t("widgets.delayCost")}
              description={t("widgets.delayCostDesc")}
              items={[
                { label: t("widgets.formulaLabel"), formula: `${t("widgets.daysOpenLabel")} × ${persons} ${t("widgets.persons")} × ${hours}${t("widgets.hoursPerDay")} × ${rate}${t("widgets.perHour")}` },
                { label: t("widgets.daysOpenLabel"), formula: t("widgets.daysOpenFormula") },
                { label: t("widgets.teamRateLabel"), formula: t("widgets.teamRateFormula") },
                { label: t("widgets.confidenceLabel"), formula: `${confidence.label}` },
              ]}
              source={t("widgets.editableInputs")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-1">
          <span className="font-display text-3xl font-bold text-destructive">{formatCost(totalCost)}</span>
          <span className={`text-[10px] font-medium mb-1 ${confidence.color}`}>
            {t("widgets.confidenceLabel")}: {confidence.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t("widgets.openDecisionsCost", { count: openDecisions.length })}
        </p>

        <button
          onClick={() => setShowCalc(!showCalc)}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline mb-3"
        >
          {showCalc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showCalc ? t("widgets.hideCalc") : t("widgets.showCalc")}
        </button>

        {showCalc && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-3 space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("widgets.adjustParams")}</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">{t("widgets.perHour")}</label>
                <input type="number" value={customRate ?? 75} onChange={e => setCustomRate(Number(e.target.value) || null)} className="w-full h-7 px-2 text-xs rounded border border-input bg-background focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">{t("widgets.persons")}</label>
                <input type="number" value={customPersons ?? 2} onChange={e => setCustomPersons(Number(e.target.value) || null)} className="w-full h-7 px-2 text-xs rounded border border-input bg-background focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">{t("widgets.hoursPerDay")}</label>
                <input type="number" value={customHours ?? 2} onChange={e => setCustomHours(Number(e.target.value) || null)} className="w-full h-7 px-2 text-xs rounded border border-input bg-background focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-1 pt-1">
              <Info className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                {t("widgets.formulaDesc", { persons, hours, rate })}
              </p>
            </div>
          </div>
        )}

        {topCosts.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            {topCosts.map((c, i) => (
              <Popover key={i}>
                <PopoverTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 rounded px-1 py-0.5 -mx-1 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${c.priority === "critical" ? "text-destructive" : c.priority === "high" ? "text-warning" : "text-muted-foreground"}`} />
                      <span className="text-xs truncate">{c.title}</span>
                    </div>
                    <span className="text-xs font-bold text-destructive shrink-0 ml-2">{formatCost(c.cost)}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" side="left">
                  <p className="text-xs font-semibold mb-2">{c.title}</p>
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between"><span>{t("widgets.daysOpenLabel")}</span><span className="font-medium text-foreground">{c.days}d</span></div>
                    <div className="flex justify-between"><span>{t("widgets.perHour")}</span><span className="font-medium text-foreground">{c.baseRate}€</span></div>
                    <div className="flex justify-between"><span>{t("widgets.persons")} × {t("widgets.hoursPerDay")}</span><span className="font-medium text-foreground">{persons} × {hours}h</span></div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-medium">Total</span><span className="font-bold text-destructive">{formatCost(c.cost)}</span></div>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionCostWidget;
