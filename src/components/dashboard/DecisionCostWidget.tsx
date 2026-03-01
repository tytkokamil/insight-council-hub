import { useState, useEffect, useMemo } from "react";
import { DollarSign, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";
import CostItemPopover from "./cost/CostItemPopover";
import LiveCodCounter from "@/components/shared/LiveCodCounter";
import { DEFAULT_COD_CONFIG, buildTeamConfigMap, calculateAllCosts, getConfidenceLevel, calculateCod } from "./cost/CostCalculationEngine";
import type { CodConfig } from "./cost/CostCalculationEngine";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { formatCost } from "@/lib/formatters";

interface DecisionCostWidgetProps {
  heroMode?: boolean;
}

const DecisionCostWidget = ({ heroMode = false }: DecisionCostWidgetProps) => {
  const { t } = useTranslation();
  const { data: allDecisions = [], isLoading: decLoading } = useDecisions();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const isPersonal = selectedTeamId === null;
  const [showCalc, setShowCalc] = useState(false);
  const [orgDefaults, setOrgDefaults] = useState<CodConfig>(DEFAULT_COD_CONFIG);

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
          hourlyRate: map.cod_hourly_rate ?? DEFAULT_COD_CONFIG.hourlyRate,
          persons: map.cod_persons ?? DEFAULT_COD_CONFIG.persons,
          overhead: map.cod_overhead_factor ?? DEFAULT_COD_CONFIG.overhead,
        });
      }
    };
    fetchOrgDefaults();
  }, []);

  if (decLoading || teamLoading) return <WidgetSkeleton rows={3} showScore />;

  // Don't show cost widget in personal mode
  if (isPersonal) return null;

  const teamConfigMap = buildTeamConfigMap(teams as any[], orgDefaults);
  const scopedDecisions = isPersonal
    ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id || d.owner_id === user?.id)
    : allDecisions;
  const openDecisions = scopedDecisions.filter(d => d.status === "draft" || d.status === "review");
  const { totalCost, costs } = calculateAllCosts(openDecisions, teamConfigMap, orgDefaults);
  const topCosts = costs.slice(0, 3);
  const confidence = getConfidenceLevel(totalCost, {
    high: t("widgets.confidenceHigh"),
    medium: t("widgets.confidenceMedium"),
    low: t("widgets.confidenceLow"),
  });

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
            <span className="font-display text-3xl font-bold tabular-nums text-success">0 €</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("widgets.noDelayCost", { defaultValue: "Keine Verzögerungskosten — alle Entscheidungen im Plan 🎉" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={heroMode ? "border-destructive/20 bg-destructive/[0.02]" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">
              {heroMode
                ? t("widgets.delayCostHeroLabel", { defaultValue: "Kosten durch offene Entscheidungen — heute" })
                : t("widgets.delayCost")}
            </CardTitle>
            <ScoreMethodology
              title={t("widgets.delayCost")}
              description={t("widgets.delayCostDesc")}
              items={[
                { label: t("widgets.formulaLabel"), formula: `${t("widgets.daysOpenLabel")} × ${orgDefaults.hourlyRate}€/h × 8h × ${orgDefaults.persons} ${t("widgets.persons")} × ${orgDefaults.overhead}x` },
                { label: t("widgets.daysOpenLabel"), formula: t("widgets.daysOpenFormula") },
                { label: t("cod.teamRateNote", "Team-Werte"), formula: t("cod.teamRateNoteDesc", "Teams können eigene Werte in den Team-Einstellungen setzen") },
                { label: t("widgets.confidenceLabel"), formula: confidence.label },
              ]}
              source={t("cod.configSource", "Konfigurierbar in Team- und Org-Einstellungen")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-1">
          <LiveCodCounter
            baseCost={totalCost}
            costPerSecond={openDecisions.reduce((sum, d) => {
              const cfg = d.team_id && teamConfigMap[(d as any).team_id] ? teamConfigMap[(d as any).team_id] : orgDefaults;
              return sum + (cfg.hourlyRate * 8 * cfg.persons * cfg.overhead) / 86400;
            }, 0)}
            createdAt={openDecisions[0]?.created_at || new Date().toISOString()}
            size={heroMode ? "hero" : "lg"}
            dailyCost={openDecisions.reduce((sum, d) => {
              const cfg = d.team_id && teamConfigMap[(d as any).team_id] ? teamConfigMap[(d as any).team_id] : orgDefaults;
              return sum + cfg.hourlyRate * 8 * cfg.persons * cfg.overhead;
            }, 0)}
          />
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
              <CostItemPopover key={i} item={c} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionCostWidget;
