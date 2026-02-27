import { useMemo, useRef, useEffect, useState } from "react";
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
import { useTranslation } from "react-i18next";

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

/* Animated KPI value */
const KpiValue = ({ value, className }: { value: string; className: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [display, setDisplay] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;
    // Extract numeric part
    const numericMatch = value.match(/^([\d.]+)/);
    if (!numericMatch) { setDisplay(value); return; }
    const end = parseFloat(numericMatch[1]);
    const suffix = value.replace(numericMatch[1], "");
    const isInt = !numericMatch[1].includes(".");

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const start = performance.now();
        const dur = 1000;
        const step = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const cur = eased * end;
          setDisplay(`${isInt ? Math.round(cur) : cur.toFixed(1)}${suffix}`);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <p ref={ref} className={`text-2xl font-bold font-display tabular-nums ${className}`}>{display}</p>;
};

const CoreKpiGrid = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [] } = useDecisions();
  const { data: reviews = [] } = useReviews();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: risks = [] } = useRisks();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;
  const decisions = isPersonal
    ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id || d.owner_id === user?.id)
    : allDecisions;

  const kpis = useMemo<CoreKpi[]>(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented");

    // 1. Decision Health (simplified DQI)
    const total = decisions.length;
    const noDecisionData = total === 0;
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1).length;
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now).length;
    const healthRatio = total > 0 ? Math.max(0, 1 - (escalated * 0.15 + overdue * 0.1)) : 0;
    const successful = implemented.filter(d => d.outcome_type === "successful" || d.outcome_type === "partial").length;
    const successRatio = implemented.length > 0 ? successful / implemented.length : 0;
    const healthScore = Math.round(Math.min(100, (healthRatio * 50 + successRatio * 50)));

    // 2. Risk Exposure
    const openRisks = noDecisionData ? [] : risks.filter((r: any) => r.status === "open");
    const criticalRiskDecisions = noDecisionData ? 0 : active.filter(d => (d.ai_risk_score || 0) >= 60).length;
    const riskExposure = openRisks.length + criticalRiskDecisions;

    // 3. Cost of Delay
    const teamRateMap: Record<string, number> = {};
    teams.forEach((tm: any) => { if (tm.hourly_rate) teamRateMap[tm.id] = tm.hourly_rate; });
    let totalCost = 0;
    const openDecisions = active.filter(d => d.status === "draft" || d.status === "review");
    openDecisions.forEach(d => {
      const daysOpen = (now.getTime() - new Date(d.created_at).getTime()) / 86400000;
      const rate = d.team_id && teamRateMap[d.team_id] ? teamRateMap[d.team_id] : 75;
      const multiplier = d.priority === "critical" ? 4 : d.priority === "high" ? 2 : 1;
      totalCost += daysOpen * 2 * 2 * rate * multiplier;
    });
    const formattedCost = noDecisionData ? "0€" : totalCost >= 1000 ? `${Math.round(totalCost / 1000)}k€` : `${Math.round(totalCost)}€`;

    // 4. SLA Compliance
    const withDueDate = active.filter(d => d.due_date);
    const onTrack = withDueDate.filter(d => new Date(d.due_date!) >= now).length;
    const slaCompliance = withDueDate.length > 0 ? Math.round((onTrack / withDueDate.length) * 100) : 0;

    return [
      {
        label: t("coreKpi.decisionHealth"),
        value: `${healthScore}`,
        subLabel: noDecisionData ? t("common.noData") : healthScore >= 70 ? t("coreKpi.strong") : healthScore >= 45 ? t("coreKpi.moderate") : t("coreKpi.critical"),
        icon: Gauge,
        color: noDecisionData ? "text-muted-foreground" : healthScore >= 70 ? "text-success" : healthScore >= 45 ? "text-warning" : "text-destructive",
        bgColor: noDecisionData ? "bg-muted/50" : healthScore >= 70 ? "bg-success/10" : healthScore >= 45 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: t("coreKpi.healthTooltip"),
        formula: t("coreKpi.healthFormula"),
      },
      {
        label: t("coreKpi.riskExposure"),
        value: `${riskExposure}`,
        subLabel: noDecisionData ? t("common.noData") : t("coreKpi.risksCount", { risks: openRisks.length, highRisk: criticalRiskDecisions }),
        icon: Shield,
        color: noDecisionData ? "text-muted-foreground" : riskExposure === 0 ? "text-success" : riskExposure <= 3 ? "text-warning" : "text-destructive",
        bgColor: noDecisionData ? "bg-muted/50" : riskExposure === 0 ? "bg-success/10" : riskExposure <= 3 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: t("coreKpi.riskTooltip"),
        formula: t("coreKpi.riskFormula"),
      },
      {
        label: t("coreKpi.costOfDelay"),
        value: formattedCost,
        subLabel: noDecisionData ? t("common.noData") : t("coreKpi.openDecisions", { count: openDecisions.length }),
        icon: DollarSign,
        color: noDecisionData ? "text-muted-foreground" : totalCost < 5000 ? "text-muted-foreground" : totalCost < 20000 ? "text-warning" : "text-destructive",
        bgColor: noDecisionData ? "bg-muted/50" : totalCost < 5000 ? "bg-muted/50" : totalCost < 20000 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: t("coreKpi.costTooltip"),
        formula: t("coreKpi.costFormula"),
      },
      {
        label: t("coreKpi.slaCompliance"),
        value: `${slaCompliance}%`,
        subLabel: noDecisionData ? t("common.noData") : t("coreKpi.onTrack", { onTrack, total: withDueDate.length }),
        icon: Timer,
        color: noDecisionData ? "text-muted-foreground" : slaCompliance >= 80 ? "text-success" : slaCompliance >= 60 ? "text-warning" : "text-destructive",
        bgColor: noDecisionData ? "bg-muted/50" : slaCompliance >= 80 ? "bg-success/10" : slaCompliance >= 60 ? "bg-warning/10" : "bg-destructive/10",
        tooltip: t("coreKpi.slaTooltip"),
        formula: t("coreKpi.slaFormula"),
      },
    ];
  }, [allDecisions, reviews, tasks, teams, risks, user, isPersonal, t]);

  return (
    <div className="widget-grid-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="h-full group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 border-border/80">
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
                <div className={`w-8 h-8 rounded-lg ${kpi.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <KpiValue value={kpi.value} className={kpi.color} />
              <p className="text-[11px] text-muted-foreground mt-1">{kpi.subLabel}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CoreKpiGrid;
