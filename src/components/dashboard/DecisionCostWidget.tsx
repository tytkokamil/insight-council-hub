import { useState, useEffect } from "react";
import { DollarSign, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { formatCost } from "@/lib/formatters";

interface OrgCodDefaults {
  hourlyRate: number;
  persons: number;
  overhead: number;
}

const DecisionCostWidget = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [], isLoading: decLoading } = useDecisions();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const [showCalc, setShowCalc] = useState(false);
  const [orgDefaults, setOrgDefaults] = useState<OrgCodDefaults>({ hourlyRate: 85, persons: 3, overhead: 1.5 });

  // Fetch org-level CoD defaults from economic_config
  useEffect(() => {
    const fetchOrgDefaults = async () => {
      const { data } = await supabase
        .from("economic_config")
        .select("config_key, config_value")
        .in("config_key", ["cod_hourly_rate", "cod_persons", "cod_overhead_factor"]);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach(d => { map[d.config_key] = Number(d.config_value); });
        setOrgDefaults({
          hourlyRate: map.cod_hourly_rate ?? 85,
          persons: map.cod_persons ?? 3,
          overhead: map.cod_overhead_factor ?? 1.5,
        });
      }
    };
    fetchOrgDefaults();
  }, []);

  if (decLoading || teamLoading) return <WidgetSkeleton rows={3} showScore />;

  // Build team config map: team_id -> { hourlyRate, persons, overhead }
  const teamConfigMap: Record<string, { hourlyRate: number; persons: number; overhead: number }> = {};
  teams.forEach(ti => {
    teamConfigMap[ti.id] = {
      hourlyRate: ti.hourly_rate ?? orgDefaults.hourlyRate,
      persons: (ti as any).cod_persons ?? orgDefaults.persons,
      overhead: Number((ti as any).cod_overhead_factor) ?? orgDefaults.overhead,
    };
  });

  const openDecisions = allDecisions.filter(d => d.status === "draft" || d.status === "review");
  const now = Date.now();
  let totalCost = 0;
  const costs: { title: string; days: number; cost: number; priority: string; rate: number; persons: number; overhead: number }[] = [];

  openDecisions.forEach(d => {
    const daysOpen = (now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const config = d.team_id && teamConfigMap[d.team_id] ? teamConfigMap[d.team_id] : orgDefaults;
    // Formula: days × hourlyRate × 8h × persons × overhead
    const cost = Math.round(daysOpen * config.hourlyRate * 8 * config.persons * config.overhead);
    totalCost += cost;
    costs.push({ title: d.title, days: Math.round(daysOpen), cost, priority: d.priority, rate: config.hourlyRate, persons: config.persons, overhead: config.overhead });
  });

  const topCosts = costs.sort((a, b) => b.cost - a.cost).slice(0, 3);

  const CONFIDENCE_LEVELS = [
    { min: 0, max: 5000, label: t("widgets.confidenceHigh"), color: "text-success" },
    { min: 5000, max: 20000, label: t("widgets.confidenceMedium"), color: "text-warning" },
    { min: 20000, max: Infinity, label: t("widgets.confidenceLow"), color: "text-destructive" },
  ] as const;
  const confidence = CONFIDENCE_LEVELS.find(c => totalCost >= c.min && totalCost < c.max) ?? CONFIDENCE_LEVELS[2];

  // Friendly state when no delay costs
  if (openDecisions.length === 0 || totalCost === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <CardTitle className="text-sm">{t("widgets.delayCost")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 mb-1">
            <span className="font-display text-3xl font-bold text-success">0 €</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("widgets.noDelayCost", { defaultValue: "Keine Verzögerungskosten — alle Entscheidungen im Plan 🎉" })}
          </p>
        </CardContent>
      </Card>
    );
  }

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
                { label: t("widgets.formulaLabel"), formula: `${t("widgets.daysOpenLabel")} × ${orgDefaults.hourlyRate}€/h × 8h × ${orgDefaults.persons} ${t("widgets.persons")} × ${orgDefaults.overhead}x` },
                { label: t("widgets.daysOpenLabel"), formula: t("widgets.daysOpenFormula") },
                { label: t("cod.teamRateNote", "Team-Werte"), formula: t("cod.teamRateNoteDesc", "Teams können eigene Werte in den Team-Einstellungen setzen") },
                { label: t("widgets.confidenceLabel"), formula: `${confidence.label}` },
              ]}
              source={t("cod.configSource", "Konfigurierbar in Team- und Org-Einstellungen")}
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
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("cod.currentParams", "Aktuelle Parameter (Org-Default)")}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-background border border-border text-center">
                <p className="text-[10px] text-muted-foreground">{t("cod.hourlyRate", "Stundensatz")}</p>
                <p className="font-semibold">{orgDefaults.hourlyRate} €/h</p>
              </div>
              <div className="p-2 rounded bg-background border border-border text-center">
                <p className="text-[10px] text-muted-foreground">{t("cod.persons", "Personen")}</p>
                <p className="font-semibold">{orgDefaults.persons}</p>
              </div>
              <div className="p-2 rounded bg-background border border-border text-center">
                <p className="text-[10px] text-muted-foreground">{t("cod.overhead", "Overhead")}</p>
                <p className="font-semibold">{orgDefaults.overhead}x</p>
              </div>
            </div>
            <div className="flex items-center gap-1 pt-1">
              <Info className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                {t("cod.formulaDetail", "Verzögerungstage × Stundensatz × 8h × Personen × Overhead")}
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
                    <div className="flex justify-between"><span>{t("cod.hourlyRate", "Stundensatz")}</span><span className="font-medium text-foreground">{c.rate} €/h</span></div>
                    <div className="flex justify-between"><span>{t("cod.persons", "Personen")}</span><span className="font-medium text-foreground">{c.persons}</span></div>
                    <div className="flex justify-between"><span>{t("cod.overhead", "Overhead")}</span><span className="font-medium text-foreground">{c.overhead}x</span></div>
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
