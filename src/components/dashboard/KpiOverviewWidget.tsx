import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText, AlertTriangle, Clock, Gauge,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDecisions } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslation } from "react-i18next";
import { differenceInDays } from "date-fns";

/** Tiny SVG sparkline */
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
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;

  const kpis = useMemo(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id || d.owner_id === user?.id)
      : allDecisions;

    const now = new Date();
    const weekMs = 7 * 86400000;
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));

    // Weekly snapshots for sparklines
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now.getTime() - (4 - i) * weekMs);
      const end = new Date(now.getTime() - (3 - i) * weekMs);
      return { start, end };
    });

    // 1. Offene Entscheidungen
    const openCount = active.length;
    const openPerWeek = weeks.map(w =>
      decisions.filter(d => {
        const created = new Date(d.created_at);
        if (created > w.end) return false;
        if (d.implemented_at && new Date(d.implemented_at) <= w.end) return false;
        if (["rejected", "archived", "cancelled"].includes(d.status) && new Date(d.updated_at) <= w.end) return false;
        return true;
      }).length
    );
    const openPrevWeek = openPerWeek[2];
    const openTrend = openCount > openPrevWeek ? "up" : openCount < openPrevWeek ? "down" : "neutral";

    // 2. Überfällige Entscheidungen
    const overdueDecisions = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const overdueCount = overdueDecisions.length;
    const overduePerWeek = weeks.map(w =>
      decisions.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        if (due >= w.end) return false;
        const created = new Date(d.created_at);
        if (created > w.end) return false;
        if (d.implemented_at && new Date(d.implemented_at) <= w.end) return false;
        return true;
      }).length
    );

    // 3. Ø Entscheidungszeit (in Tagen)
    const implemented = decisions.filter(d => d.status === "implemented" && d.implemented_at);
    const avgDays = implemented.length > 0
      ? Math.round(implemented.reduce((sum, d) => sum + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / implemented.length)
      : 0;
    const recentImpl = implemented.filter(d => new Date(d.implemented_at!) >= new Date(now.getTime() - 30 * 86400000));
    const olderImpl = implemented.filter(d => {
      const implDate = new Date(d.implemented_at!);
      return implDate < new Date(now.getTime() - 30 * 86400000) && implDate >= new Date(now.getTime() - 60 * 86400000);
    });
    const recentAvg = recentImpl.length > 0
      ? recentImpl.reduce((sum, d) => sum + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / recentImpl.length
      : avgDays;
    const olderAvg = olderImpl.length > 0
      ? olderImpl.reduce((sum, d) => sum + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / olderImpl.length
      : recentAvg;
    // For decision time, lower is better → inverted trend
    const timeTrend = recentAvg < olderAvg ? "down" : recentAvg > olderAvg ? "up" : "neutral";
    const avgPerWeek = weeks.map(w => {
      const wImpl = implemented.filter(d => new Date(d.implemented_at!) >= w.start && new Date(d.implemented_at!) < w.end);
      return wImpl.length > 0
        ? Math.round(wImpl.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / wImpl.length)
        : avgDays;
    });

    // 4. Decision Quality Index (0-100)
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1).length;
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now).length;
    const total = decisions.length;
    const healthRatio = total > 0 ? Math.max(0, 1 - (escalated * 0.15 + overdue * 0.1)) : 0;
    const successful = implemented.filter(d => d.outcome_type === "successful" || d.outcome_type === "partial").length;
    const successRatio = implemented.length > 0 ? successful / implemented.length : 0;
    const dqi = Math.round(Math.min(100, (healthRatio * 50 + successRatio * 50)));
    const dqiPerWeek = weeks.map(() => dqi); // simplified

    return [
      {
        label: t("kpiOverview.openDecisions"),
        value: openCount,
        displayValue: `${openCount}`,
        icon: FileText,
        color: "text-primary",
        bg: "bg-primary/10",
        trend: openTrend,
        trendLabel: openTrend === "up"
          ? `↑ +${openCount - openPrevWeek} ${t("kpiOverview.vsLastWeek", { defaultValue: "vs. Vorwoche" })}`
          : openTrend === "down"
            ? `↓ ${openCount - openPrevWeek} ${t("kpiOverview.vsLastWeek", { defaultValue: "vs. Vorwoche" })}`
            : t("kpiOverview.stable", { defaultValue: "Stabil" }),
        trendIsNegative: openTrend === "up", // more open = bad
        sparkData: openPerWeek,
      },
      {
        label: t("kpiOverview.overdueDecisions", { defaultValue: "Überfällige Entscheidungen" }),
        value: overdueCount,
        displayValue: `${overdueCount}`,
        icon: AlertTriangle,
        color: overdueCount > 0 ? "text-destructive" : "text-success",
        bg: overdueCount > 0 ? "bg-destructive/10" : "bg-success/10",
        trend: overdueCount > 0 ? "up" as const : "neutral" as const,
        trendLabel: overdueCount === 0
          ? t("kpiOverview.allOnTrack", { defaultValue: "Alle im Zeitplan" })
          : t("kpiOverview.urgentDecisions", { defaultValue: "Sofort handeln", count: overdueCount }),
        trendIsNegative: overdueCount > 0,
        sparkData: overduePerWeek,
      },
      {
        label: t("kpiOverview.avgDecisionTime", { defaultValue: "Ø Entscheidungszeit" }),
        value: avgDays,
        displayValue: `${avgDays} ${t("common.days", { defaultValue: "Tage" })}`,
        icon: Clock,
        color: avgDays > 14 ? "text-destructive" : avgDays > 7 ? "text-warning" : "text-success",
        bg: avgDays > 14 ? "bg-destructive/10" : avgDays > 7 ? "bg-warning/10" : "bg-success/10",
        trend: timeTrend,
        trendLabel: timeTrend === "down"
          ? t("kpiOverview.gettingFaster", { defaultValue: "Wird schneller" })
          : timeTrend === "up"
            ? t("kpiOverview.gettingSlower", { defaultValue: "Wird langsamer" })
            : t("kpiOverview.stable", { defaultValue: "Stabil" }),
        trendIsNegative: timeTrend === "up", // slower = bad
        sparkData: avgPerWeek,
      },
      {
        label: "Decision Quality Index",
        value: dqi,
        displayValue: `${dqi}/100`,
        icon: Gauge,
        color: dqi >= 70 ? "text-success" : dqi >= 45 ? "text-warning" : "text-destructive",
        bg: dqi >= 70 ? "bg-success/10" : dqi >= 45 ? "bg-warning/10" : "bg-destructive/10",
        trend: "neutral" as const,
        trendLabel: dqi >= 70 ? t("coreKpi.strong", { defaultValue: "Stark" }) : dqi >= 45 ? t("coreKpi.moderate", { defaultValue: "Moderat" }) : t("coreKpi.critical", { defaultValue: "Kritisch" }),
        trendIsNegative: dqi < 45,
        sparkData: dqiPerWeek,
      },
    ];
  }, [allDecisions, user, isPersonal, selectedTeamId, t]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
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
          <Card className="h-full min-h-[90px] hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 border-border/80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-end justify-between mb-1">
                <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.displayValue}</p>
                <Sparkline data={kpi.sparkData} color={resolveColor(kpi.color)} />
              </div>
              <div className={`flex items-center gap-1 ${kpi.trendIsNegative ? "text-destructive" : kpi.trend === "down" && !kpi.trendIsNegative ? "text-success" : "text-muted-foreground"}`}>
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
