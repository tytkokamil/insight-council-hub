import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge, Shield, DollarSign, Timer, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDecisions, useTeams, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";

interface CoreKpi {
  label: string;
  value: string;
  subLabel: string;
  icon: typeof Gauge;
  color: string;
  sentiment: "positive" | "neutral" | "warning" | "critical";
  tooltip: string;
  formula: string;
}

const sentimentStyles = {
  positive: {
    ring: "ring-success/20",
    iconBg: "bg-success/8",
    iconColor: "text-success",
    valueColor: "text-success",
  },
  neutral: {
    ring: "ring-muted-foreground/10",
    iconBg: "bg-muted/60",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
  },
  warning: {
    ring: "ring-warning/20",
    iconBg: "bg-warning/8",
    iconColor: "text-warning",
    valueColor: "text-warning",
  },
  critical: {
    ring: "ring-destructive/20",
    iconBg: "bg-destructive/8",
    iconColor: "text-destructive",
    valueColor: "text-destructive",
  },
};

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

    // 1. Decision Health
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
    const formattedCost = totalCost >= 1000 ? `${Math.round(totalCost / 1000)}k` : `${Math.round(totalCost)}`;

    // 4. SLA Compliance
    const withDueDate = active.filter(d => d.due_date);
    const onTrack = withDueDate.filter(d => new Date(d.due_date!) >= now).length;
    const slaCompliance = withDueDate.length > 0 ? Math.round((onTrack / withDueDate.length) * 100) : 100;

    return [
      {
        label: "Decision Health",
        value: `${healthScore}%`,
        subLabel: healthScore >= 70 ? "Stabil" : healthScore >= 45 ? "Beobachten" : "Kritisch",
        icon: Gauge,
        sentiment: healthScore >= 70 ? "positive" : healthScore >= 45 ? "warning" : "critical",
        tooltip: "Gesamtgesundheit basierend auf Eskalationen, Überfälligkeit und Outcome-Erfolg.",
        formula: "50% × (1 − Eskalationsquote) + 50% × Erfolgsquote",
      },
      {
        label: "Risk Exposure",
        value: `${riskExposure}`,
        subLabel: riskExposure === 0 ? "Keine offenen Risiken" : `${openRisks.length} Risiken · ${criticalRiskDecisions} High-Risk`,
        icon: Shield,
        sentiment: riskExposure === 0 ? "positive" : riskExposure <= 3 ? "warning" : "critical",
        tooltip: "Offene Risiken + Entscheidungen mit AI-Risk-Score ≥ 60.",
        formula: "Offene Risiken + Entscheidungen mit AI-Risk ≥ 60",
      },
      {
        label: "Cost of Delay",
        value: `€${formattedCost}`,
        subLabel: `${openDecisions.length} offene Entscheidungen`,
        icon: DollarSign,
        sentiment: totalCost < 5000 ? "neutral" : totalCost < 20000 ? "warning" : "critical",
        tooltip: "Geschätzte Opportunitätskosten durch offene Entscheidungen.",
        formula: "Tage × 2 Pers. × 2h × Stundensatz × Priorität",
      },
      {
        label: "SLA Compliance",
        value: `${slaCompliance}%`,
        subLabel: `${onTrack}/${withDueDate.length} im Plan`,
        icon: Timer,
        sentiment: slaCompliance >= 80 ? "positive" : slaCompliance >= 60 ? "warning" : "critical",
        tooltip: "Anteil aktiver Entscheidungen die noch im Zeitplan sind.",
        formula: "Due Date ≥ heute / Alle mit Due Date × 100",
      },
    ] as CoreKpi[];
  }, [allDecisions, reviews, tasks, teams, risks, user, isPersonal, selectedTeamId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, i) => {
        const styles = sentimentStyles[kpi.sentiment];
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cmd-card p-6 cursor-default group">
                  {/* Icon + Label */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {kpi.label}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${styles.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <Icon className={`w-4.5 h-4.5 ${styles.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Hero Number */}
                  <p className={`hero-number text-4xl ${styles.valueColor} mb-2`}>
                    {kpi.value}
                  </p>
                  
                  {/* Sub-label */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {kpi.subLabel}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64 p-3">
                <p className="text-xs font-semibold mb-1">{kpi.label}</p>
                <p className="text-[11px] text-muted-foreground mb-2">{kpi.tooltip}</p>
                <p className="text-[10px] font-mono text-muted-foreground/60">{kpi.formula}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CoreKpiGrid;
