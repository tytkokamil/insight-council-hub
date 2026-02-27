import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText, AlertTriangle, CheckCircle2, ListChecks,
  Users, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslation } from "react-i18next";

/** Tiny SVG sparkline – no external dependency */
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const gradientId = `spark-${color.replace(/[^a-z]/gi, "")}`;
  const firstX = pad;
  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2);
  const areaPath = `M${points[0]} ${points.slice(1).map(p => `L${p}`).join(" ")} L${lastX},${h} L${firstX},${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(points[points.length - 1].split(",")[0])} cy={parseFloat(points[points.length - 1].split(",")[1])} r="2" fill={color} />
    </svg>
  );
};

const resolveColor = (colorClass: string) => {
  if (colorClass.includes("destructive")) return "hsl(var(--destructive))";
  if (colorClass.includes("success")) return "hsl(var(--success, 142 71% 45%))";
  if (colorClass.includes("primary")) return "hsl(var(--primary))";
  return "hsl(var(--muted-foreground))";
};

const KpiOverviewWidget = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [] } = useDecisions();
  const { data: allTasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;

  const kpis = useMemo(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;
    const tasks = isPersonal
      ? allTasks.filter(t => t.created_by === user?.id || t.assignee_id === user?.id)
      : allTasks;

    const now = new Date();
    const weekMs = 7 * 86400000;

    const weeks = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now.getTime() - (4 - i) * weekMs);
      const end = new Date(now.getTime() - (3 - i) * weekMs);
      return { start, end };
    });

    const openDecisionsPerWeek = weeks.map(w => {
      return decisions.filter(d => {
        const created = new Date(d.created_at);
        if (created > w.end) return false;
        const implemented = d.implemented_at ? new Date(d.implemented_at) : null;
        if (implemented && implemented <= w.end) return false;
        if (d.status === "rejected") {
          const updated = new Date(d.updated_at);
          if (updated <= w.end) return false;
        }
        return true;
      }).length;
    });

    const overdueTasksPerWeek = weeks.map(w => {
      return tasks.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        if (due >= w.end) return false;
        const created = new Date(t.created_at);
        if (created > w.end) return false;
        const completed = t.completed_at ? new Date(t.completed_at) : null;
        if (completed && completed <= w.end) return false;
        return true;
      }).length;
    });

    const completedPerWeek = weeks.map(w => {
      return [
        ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= w.start && new Date(d.implemented_at) < w.end),
        ...tasks.filter(t => t.completed_at && new Date(t.completed_at) >= w.start && new Date(t.completed_at) < w.end),
      ].length;
    });

    const activityPerWeek = weeks.map(w => {
      return [
        ...decisions.filter(d => new Date(d.created_at) >= w.start && new Date(d.created_at) < w.end),
        ...tasks.filter(t => new Date(t.created_at) >= w.start && new Date(t.created_at) < w.end),
      ].length;
    });

    const currentWeek = 3;
    const prevWeek = 2;

    const trend = (current: number, previous: number) => {
      if (current > previous) return "up";
      if (current < previous) return "down";
      return "neutral";
    };

    const openNow = openDecisionsPerWeek[currentWeek];
    const openPrev = openDecisionsPerWeek[prevWeek];
    const overdueNow = overdueTasksPerWeek[currentWeek];
    const completedNow = completedPerWeek[currentWeek];
    const completedPrev = completedPerWeek[prevWeek];
    const activityNow = activityPerWeek[currentWeek];
    const activityPrev = activityPerWeek[prevWeek];

    return [
      {
        label: t("kpiOverview.openDecisions"),
        value: openNow,
        icon: FileText,
        color: "text-primary",
        bg: "bg-primary/10",
        trend: trend(openNow, openPrev),
        trendLabel: openNow > openPrev ? t("kpiOverview.increase") : openNow < openPrev ? t("kpiOverview.decrease") : t("kpiOverview.stable"),
        sparkData: openDecisionsPerWeek,
      },
      {
        label: t("kpiOverview.overdueTasks"),
        value: overdueNow,
        icon: AlertTriangle,
        color: overdueNow > 0 ? "text-destructive" : "text-success",
        bg: overdueNow > 0 ? "bg-destructive/10" : "bg-success/10",
        trend: overdueNow > 0 ? "up" as const : "neutral" as const,
        trendLabel: overdueNow === 0 ? t("kpiOverview.allOnTrack") : t("kpiOverview.urgent", { count: overdueNow }),
        sparkData: overdueTasksPerWeek,
      },
      {
        label: t("kpiOverview.completedWeek"),
        value: completedNow,
        icon: CheckCircle2,
        color: "text-success",
        bg: "bg-success/10",
        trend: trend(completedNow, completedPrev),
        trendLabel: completedNow > completedPrev ? `+${completedNow - completedPrev} ${t("kpiOverview.vsLastWeek")}` : completedNow < completedPrev ? `${completedNow - completedPrev} ${t("kpiOverview.vsLastWeek")}` : t("kpiOverview.sameAsLastWeek"),
        sparkData: completedPerWeek,
      },
      {
        label: isPersonal ? t("kpiOverview.activityWeek") : t("kpiOverview.teamActivityWeek"),
        value: activityNow,
        icon: isPersonal ? ListChecks : Users,
        color: "text-accent-foreground",
        bg: "bg-accent/30",
        trend: trend(activityNow, activityPrev),
        trendLabel: activityNow > activityPrev ? t("kpiOverview.moreActivity") : activityNow < activityPrev ? t("kpiOverview.lessActivity") : t("kpiOverview.stable"),
        sparkData: activityPerWeek,
      },
    ];
  }, [allDecisions, allTasks, teams, user, isPersonal, selectedTeamId, t]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const trendColor = (trend: string, index: number) => {
    if (index === 1) {
      return trend === "up" ? "text-destructive" : trend === "down" ? "text-success" : "text-muted-foreground";
    }
    if (index === 2 || index === 3) {
      return trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="widget-grid-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="h-full hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 border-border/80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-end justify-between mb-1">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <Sparkline data={kpi.sparkData} color={resolveColor(kpi.color)} />
              </div>
              <div className={`flex items-center gap-1 ${trendColor(kpi.trend, i)}`}>
                <TrendIcon trend={kpi.trend} />
                <span className="text-[11px]">{kpi.trendLabel}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default KpiOverviewWidget;
