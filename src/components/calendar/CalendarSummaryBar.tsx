import { memo, useMemo } from "react";
import { formatCost } from "@/lib/formatters";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { AlertTriangle, TrendingUp, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CalendarSummaryBarProps {
  decisions: any[];
  tasks: any[];
  currentDate: Date;
  viewMode: "month" | "week" | "day";
}

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

const CalendarSummaryBar = memo(({ decisions, tasks, currentDate, viewMode }: CalendarSummaryBarProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const stats = useMemo(() => {
    const activeDecisions = (decisions ?? []).filter(
      (d) => !["implemented", "rejected", "archived", "cancelled"].includes(d.status) && d.deleted_at === null
    );
    const total = activeDecisions.length;
    const critical = activeDecisions.filter((d) => d.priority === "critical" || d.priority === "high").length;
    const escalated = activeDecisions.filter((d) => (d.escalation_level ?? 0) >= 1).length;
    const overdue = activeDecisions.filter((d) => d.due_date && new Date(d.due_date) < new Date()).length;

    let totalDelayCost = 0;
    for (const d of activeDecisions) {
      if (!d.due_date) continue;
      const daysOverdue = differenceInCalendarDays(new Date(), new Date(d.due_date));
      if (daysOverdue > 0) totalDelayCost += daysOverdue * 120 * (PRIORITY_MULTIPLIER[d.priority] ?? 1);
    }

    const next14 = addDays(new Date(), 14);
    const upcomingCritical = activeDecisions.filter(
      (d) => d.due_date && new Date(d.due_date) >= new Date() && new Date(d.due_date) <= next14 && (d.priority === "critical" || d.priority === "high")
    );

    let aiInsight = "";
    if (upcomingCritical.length >= 3) {
      const earliest = upcomingCritical.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      const from = format(new Date(earliest[0].due_date), "d. MMM", { locale: dateFnsLocale });
      const to = format(new Date(earliest[earliest.length - 1].due_date), "d. MMM", { locale: dateFnsLocale });
      aiInsight = t("cal.aiConcentration", { count: upcomingCritical.length, from, to });
    } else if (escalated > 0) {
      aiInsight = t("cal.aiEscalated", { count: escalated });
    } else if (overdue > 0) {
      aiInsight = t("cal.aiOverdue", { count: overdue });
    } else if (total > 0) {
      aiInsight = t("cal.aiOnTrack");
    }

    const openTasks = (tasks ?? []).filter((tsk) => tsk.status !== "done").length;
    return { total, critical, escalated, overdue, totalDelayCost, aiInsight, openTasks };
  }, [decisions, tasks, currentDate, t, dateFnsLocale]);

  const label = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: dateFnsLocale });
    if (viewMode === "week") return t("cal.thisWeek");
    return format(currentDate, "d. MMMM yyyy", { locale: dateFnsLocale });
  }, [currentDate, viewMode, dateFnsLocale, t]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card">
        <div className="text-xs font-semibold text-muted-foreground mr-2">{label}</div>
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">{stats.total}</span>
          <span className="text-muted-foreground">{t("cal.decisionsLabel")}</span>
        </div>
        {stats.critical > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5 text-destructive" />
            <span className="font-semibold text-destructive">{stats.critical}</span>
            <span className="text-muted-foreground">{t("cal.criticalLabel")}</span>
          </div>
        )}
        {stats.escalated > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            <span className="font-semibold text-warning">{stats.escalated}</span>
            <span className="text-muted-foreground">{t("cal.escalatedLabel")}</span>
          </div>
        )}
        {stats.overdue > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <span className="font-semibold">{stats.overdue}</span>
            <span>{t("table.overdue")}</span>
          </div>
        )}
        {stats.totalDelayCost > 0 && (
          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <span className="font-semibold text-destructive">{formatCost(stats.totalDelayCost)}</span>
            <span className="text-muted-foreground">{t("cal.delayRisk")}</span>
          </div>
        )}
        {stats.openTasks > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("cal.openTasks", { count: stats.openTasks })}</span>
          </div>
        )}
      </div>

      {stats.aiInsight && (
        <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5">
          <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            <span className="font-semibold text-primary">{t("cal.aiInsight")}: </span>
            {stats.aiInsight}
          </p>
        </div>
      )}
    </div>
  );
});

CalendarSummaryBar.displayName = "CalendarSummaryBar";

export default CalendarSummaryBar;
