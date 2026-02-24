import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Clock, DollarSign, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { differenceInDays, subDays } from "date-fns";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const RoiDashboardWidget = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [] } = useDecisions();
  const { data: allTasks = [] } = useTasks();
  const { selectedTeamId } = useTeamContext();
  const { user } = useAuth();

  const isPersonal = selectedTeamId === null;

  const roi = useMemo(() => {
    const now = new Date();
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;

    const last90 = subDays(now, 90);
    const prev90 = subDays(now, 180);

    const currentImplemented = decisions.filter(d =>
      d.implemented_at && new Date(d.implemented_at) >= last90
    );
    const prevImplemented = decisions.filter(d =>
      d.implemented_at && new Date(d.implemented_at) >= prev90 && new Date(d.implemented_at) < last90
    );

    const avgTimeCurrent = currentImplemented.length > 0
      ? Math.round(currentImplemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / currentImplemented.length)
      : null;
    const avgTimePrev = prevImplemented.length > 0
      ? Math.round(prevImplemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / prevImplemented.length)
      : null;

    const timeSaved = avgTimePrev && avgTimeCurrent ? avgTimePrev - avgTimeCurrent : 0;
    const timeSavedPercent = avgTimePrev && avgTimePrev > 0 ? Math.round((timeSaved / avgTimePrev) * 100) : 0;

    const currentEscalations = decisions.filter(d =>
      (d.escalation_level || 0) >= 1 && new Date(d.created_at) >= last90
    ).length;
    const prevEscalations = decisions.filter(d =>
      (d.escalation_level || 0) >= 1 && new Date(d.created_at) >= prev90 && new Date(d.created_at) < last90
    ).length;
    const escalationReduction = prevEscalations > 0 ? Math.round(((prevEscalations - currentEscalations) / prevEscalations) * 100) : 0;

    const mult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    const calcCost = (decs: typeof decisions) => decs.reduce((s, d) => {
      const days = Math.max(0, differenceInDays(new Date(d.implemented_at || now), new Date(d.created_at)));
      return s + Math.round(days * 2 * 75 * (mult[d.priority] || 1.5));
    }, 0);

    const currentCost = calcCost(currentImplemented);
    const prevCost = calcCost(prevImplemented);
    const costReduction = prevCost > 0 ? Math.round(((prevCost - currentCost) / prevCost) * 100) : 0;

    const currentRejected = decisions.filter(d =>
      d.status === "rejected" && new Date(d.updated_at) >= last90
    ).length;
    const currentTotal = currentImplemented.length + currentRejected;
    const successRate = currentTotal > 0 ? Math.round((currentImplemented.length / currentTotal) * 100) : 0;

    const prevRejected = decisions.filter(d =>
      d.status === "rejected" && new Date(d.updated_at) >= prev90 && new Date(d.updated_at) < last90
    ).length;
    const prevTotal = prevImplemented.length + prevRejected;
    const prevSuccessRate = prevTotal > 0 ? Math.round((prevImplemented.length / prevTotal) * 100) : 0;
    const successDelta = successRate - prevSuccessRate;

    const potentialSavings15 = avgTimeCurrent && avgTimeCurrent > 0
      ? Math.round(currentImplemented.length * (avgTimeCurrent * 0.15) * 2 * 75)
      : Math.round(decisions.length * 0.15 * 3 * 150);

    return {
      avgTimeCurrent, avgTimePrev, timeSaved, timeSavedPercent,
      currentEscalations, prevEscalations, escalationReduction,
      currentCost, prevCost, costReduction,
      successRate, prevSuccessRate, successDelta,
      currentImplemented: currentImplemented.length,
      prevImplementedCount: prevImplemented.length,
      hasData: decisions.length >= 5,
      potentialSavings15,
    };
  }, [allDecisions, isPersonal, user]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  if (!roi.hasData) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("roi.title")}</h2>
        <div className="border border-border rounded-lg p-8 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("roi.minDecisions")}</p>
        </div>
      </section>
    );
  }

  const comparisons = [
    {
      label: t("roi.avgSpeed"),
      icon: Clock,
      before: roi.avgTimePrev !== null ? `${roi.avgTimePrev}d` : "—",
      after: roi.avgTimeCurrent !== null ? `${roi.avgTimeCurrent}d` : "—",
      delta: roi.timeSavedPercent,
      deltaLabel: roi.timeSaved > 0 ? t("roi.daysFaster", { days: roi.timeSaved }) : roi.timeSaved < 0 ? t("roi.daysSlower", { days: Math.abs(roi.timeSaved) }) : t("roi.same"),
      positive: roi.timeSaved > 0,
      iconColor: "text-primary",
    },
    {
      label: t("roi.escalations"),
      icon: Zap,
      before: `${roi.prevEscalations}`,
      after: `${roi.currentEscalations}`,
      delta: roi.escalationReduction,
      deltaLabel: roi.escalationReduction > 0 ? t("roi.lessPercent", { pct: roi.escalationReduction }) : t("roi.noChange"),
      positive: roi.escalationReduction > 0,
      iconColor: "text-warning",
    },
    {
      label: t("roi.delayCosts"),
      icon: DollarSign,
      before: formatCost(roi.prevCost),
      after: formatCost(roi.currentCost),
      delta: roi.costReduction,
      deltaLabel: roi.costReduction > 0 ? t("roi.reducedPercent", { pct: roi.costReduction }) : t("roi.noChange"),
      positive: roi.costReduction > 0,
      iconColor: "text-destructive",
    },
    {
      label: t("roi.successRate"),
      icon: CheckCircle2,
      before: `${roi.prevSuccessRate}%`,
      after: `${roi.successRate}%`,
      delta: roi.successDelta,
      deltaLabel: roi.successDelta > 0 ? `+${roi.successDelta}pp` : roi.successDelta < 0 ? `${roi.successDelta}pp` : t("roi.same"),
      positive: roi.successDelta > 0,
      iconColor: "text-success",
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("roi.title")}</h2>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">{t("roi.period")}</Badge>
      </div>

      <div className="border border-border rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-[1fr_100px_32px_100px_1fr] items-center px-4 py-2.5 bg-muted/30 border-b border-border/50">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("roi.metric")}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">{t("roi.before")}</span>
          <span />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">{t("roi.after")}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">{t("roi.change")}</span>
        </div>

        {comparisons.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`grid grid-cols-[1fr_100px_32px_100px_1fr] items-center px-4 py-3.5 ${
              i < comparisons.length - 1 ? "border-b border-border/30" : ""
            } hover:bg-muted/10 transition-colors`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                <row.icon className={`w-3.5 h-3.5 ${row.iconColor}`} />
              </div>
              <span className="text-sm font-medium">{row.label}</span>
            </div>
            <div className="text-center">
              <span className="text-base font-semibold text-muted-foreground/70 tabular-nums">{row.before}</span>
            </div>
            <div className="flex justify-center">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
                className="text-base font-bold tabular-nums"
              >
                {row.after}
              </motion.span>
            </div>
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className={`text-[10px] gap-1 ${
                  row.positive
                    ? "text-success border-success/25 bg-success/[0.06]"
                    : row.delta === 0
                    ? "text-muted-foreground"
                    : "text-destructive border-destructive/25 bg-destructive/[0.06]"
                }`}
              >
                {row.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : row.delta === 0 ? (
                  <Minus className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {row.deltaLabel}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>

      {roi.potentialSavings15 > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="border border-accent-teal/20 rounded-xl p-4 bg-accent-teal/[0.03]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-teal/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-accent-teal" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {t("roi.savingsPotential")} <span className="text-accent-teal">{formatCost(roi.potentialSavings15)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("roi.savingsDesc")}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default RoiDashboardWidget;
