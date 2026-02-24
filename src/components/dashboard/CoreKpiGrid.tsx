import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge, Shield, DollarSign, Timer, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDecisions, useTeams, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { differenceInDays } from "date-fns";

interface CoreKpi {
  label: string;
  value: string;
  subLabel: string;
  icon: typeof Gauge;
  color: string;
  bgColor: string;
  tooltip: string;
  formula: string;
}

const CoreKpiGrid = () => {
  const { data: allDecisions = [] } = useDecisions();
  const { data: reviews = [] } = useReviews();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: risks = [] } = useRisks();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;

  const kpis = useMemo<CoreKpi[]>(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;

    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented");

    // 1. Decision Health (simplified DQI)
    const total = decisions.length;
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1).length;
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now).length;
    const healthRatio = total > 0 ? Math.max(0, 1 - (escalated * 0.15 + overdue * 0.1)) : 1;
    const successful = implemented.filter(d => d.outcome_type === "successful" || d.outcome_type === "partial").length;
    const successRatio = implemented.length > 0 ? successful / implemented.length : 0.5;
    const healthScore = Math.round(Math.min(100, (healthRatio * 50 + successRatio * 50)));

    // 2. Risk Exposure
    const openRisks = risks.filter((r: any) => r.status === "open");
    const criticalRiskDecisions = active.filter(d => (d.ai_risk_score || 0) >= 60).length;
    const riskExposure = openRisks.length + criticalRiskDecisions;

    // 3. Cost of Delay
    const teamRateMap: Record<string, number> = {};
    teams.forEach((t: any) => { if (t.hourly_rate) teamRateMap[t.id] = t.hourly_rate; });
    let totalCost = 0;
    const openDecisions = active.filter(d => d.status === "draft" || d.status === "review");
    openDecisions.forEach(d => {
      const daysOpen = (now.getTime() - new Date(d.created_at).getTime()) / 86400000;
      const rate = d.team_id && teamRateMap[d.team_id] ? teamRateMap[d.team_id] : 75;
      const multiplier = d.priority === "critical" ? 4 : d.priority === "high" ? 2 : 1;
      totalCost += daysOpen * 2 * 2 * rate * multiplier;
    });
    const formattedCost = totalCost >= 1000 ? `${Math.round(totalCost / 1000)}k€` : `${Math.round(totalCost)}€`;

    // 4. SLA Compliance
    const withDueDate = active.filter(d => d.due_date);
    const onTrack = withDueDate.filter(d => new Date(d.due_date!) >= now).length;
    const slaCompliance = withDueDate.length > 0 ? Math.round((onTrack / withDueDate.length) * 100) : 100;

    return [
      {
        label: "Decision Health",
        value: `${healthScore}`,
        subLabel: healthScore >= 70 ? "Stark" : healthScore >= 45 ? "Moderat" : "Kritisch",
        icon: Gauge,
        color: healthScore >= 70 ? "text-success" : healthScore >= 45 ? "text-warning" : "text-destructive",
        bgColor: healthScore >= 70 ? "bg-success/10" : healthScore >= 45 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: "Gesamtgesundheit eurer Entscheidungen basierend auf Eskalationen, Überfälligkeit und Outcome-Erfolg.",
        formula: "50% × (1 − Eskalationsquote) + 50% × Erfolgsquote",
      },
      {
        label: "Risk Exposure",
        value: `${riskExposure}`,
        subLabel: `${openRisks.length} Risiken · ${criticalRiskDecisions} High-Risk`,
        icon: Shield,
        color: riskExposure === 0 ? "text-success" : riskExposure <= 3 ? "text-warning" : "text-destructive",
        bgColor: riskExposure === 0 ? "bg-success/10" : riskExposure <= 3 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: "Offene Risiken aus dem Risk Register + Entscheidungen mit AI-Risk-Score ≥ 60.",
        formula: "Offene Risiken + Entscheidungen mit AI-Risk ≥ 60",
      },
      {
        label: "Cost of Delay",
        value: formattedCost,
        subLabel: `${openDecisions.length} offene Entscheidungen`,
        icon: DollarSign,
        color: totalCost < 5000 ? "text-muted-foreground" : totalCost < 20000 ? "text-warning" : "text-destructive",
        bgColor: totalCost < 5000 ? "bg-muted/50" : totalCost < 20000 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: "Geschätzte Opportunitätskosten durch offene Entscheidungen (Draft/Review).",
        formula: "Tage offen × 2 Pers. × 2h × Stundensatz × Prioritäts-Multiplikator",
      },
      {
        label: "SLA Compliance",
        value: `${slaCompliance}%`,
        subLabel: `${onTrack}/${withDueDate.length} im Plan`,
        icon: Timer,
        color: slaCompliance >= 80 ? "text-success" : slaCompliance >= 60 ? "text-warning" : "text-destructive",
        bgColor: slaCompliance >= 80 ? "bg-success/10" : slaCompliance >= 60 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: "Anteil aktiver Entscheidungen mit Deadline, die noch im Zeitplan sind.",
        formula: "Entscheidungen mit due_date ≥ heute / Alle mit due_date × 100",
      },
    ];
  }, [allDecisions, reviews, tasks, teams, risks, user, isPersonal, selectedTeamId]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground/40 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-56">
                      <p className="text-xs font-medium mb-1">{kpi.label}</p>
                      <p className="text-[11px] text-muted-foreground mb-1.5">{kpi.tooltip}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/70">{kpi.formula}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className={`w-8 h-8 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{kpi.subLabel}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CoreKpiGrid;
