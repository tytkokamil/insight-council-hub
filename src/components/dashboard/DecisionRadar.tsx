import { useMemo } from "react";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useDecisions, useReviews } from "@/hooks/useDecisions";
import { useRisks } from "@/hooks/useRisks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { differenceInDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

const DecisionRadar = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [] } = useDecisions();
  const { data: reviews = [] } = useReviews();
  const { data: risks = [] } = useRisks();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;

  const radarData = useMemo(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;

    if (decisions.length < 2) return null;

    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented");

    const velocities = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const avgDays = velocities.length > 0 ? velocities.reduce((s, v) => s + v, 0) / velocities.length : 30;
    const speed = Math.round(Math.max(0, Math.min(100, 100 * (1 - Math.min(avgDays, 60) / 60))));

    const withRisk = active.filter(d => d.ai_risk_score != null);
    const avgRisk = withRisk.length > 0 ? withRisk.reduce((s, d) => s + (d.ai_risk_score || 0), 0) / withRisk.length : 30;
    const riskScore = Math.round(Math.max(0, Math.min(100, 100 - avgRisk)));

    const completedReviews = reviews.filter(r => r.reviewed_at);
    const approved = completedReviews.filter(r => r.status === "approved").length;
    const alignment = completedReviews.length > 0 ? Math.round((approved / completedReviews.length) * 100) : 50;

    const successful = implemented.filter(d => d.outcome_type === "successful").length;
    const partial = implemented.filter(d => d.outcome_type === "partial").length;
    const rated = implemented.filter(d => d.outcome_type).length;
    const outcomeQuality = rated > 0 ? Math.round(((successful + partial * 0.5) / rated) * 100) : 50;

    return [
      { axis: t("radar.speed"), value: speed },
      { axis: t("radar.riskControl"), value: riskScore },
      { axis: t("radar.alignment"), value: alignment },
      { axis: t("radar.outcome"), value: outcomeQuality },
    ];
  }, [allDecisions, reviews, risks, user, isPersonal, t]);

  if (!radarData) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("radar.title")}</h3>
        <Info className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">{t("common.noData", { defaultValue: "Noch keine Daten vorhanden." })}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("radar.title")}</h3>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-3 h-3 text-muted-foreground/50" />
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-52">
            {t("radar.tooltip")}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-1">
        {radarData.map(d => (
          <div key={d.axis} className="text-center">
            <p className={`text-sm font-bold ${d.value >= 70 ? "text-success" : d.value >= 40 ? "text-warning" : "text-destructive"}`}>{d.value}</p>
            <p className="text-[9px] text-muted-foreground">{d.axis}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DecisionRadar;
