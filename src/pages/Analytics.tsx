import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import {
  TrendingUp, Clock, CheckCircle2, AlertTriangle, FileText,
  BarChart3, Users, Zap, Activity, DollarSign, Shield, Target,
  ArrowUpRight, ArrowDownRight, ExternalLink, Lightbulb, GaugeCircle, Minus,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart,
} from "recharts";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useFilteredReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subDays, format, isAfter, isBefore, subWeeks } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { AnalyticsTimeRange } from "./AnalyticsHub";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
  violet: "hsl(280 65% 60%)",
  slate: "hsl(215 20% 65%)",
};

const tooltipCls = "rounded-lg border border-border/50 bg-popover px-3 py-2 shadow-lg";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={tooltipCls}>
      {label && <p className="text-xs font-medium text-foreground mb-1">{label}</p>}
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-semibold text-foreground">{e.value}</span>
        </div>
      ))}
    </div>
  );
};

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const Analytics = ({ embedded, timeRange = "30" }: { embedded?: boolean; timeRange?: AnalyticsTimeRange }) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useProfiles();
  const { data: reviews = [] } = useFilteredReviews();
  const profileMap = buildProfileMap(profiles);

  const { data: goals = [] } = useQuery({
    queryKey: ["strategic-goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("strategic_goals").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: goalLinks = [] } = useQuery({
    queryKey: ["decision-goal-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("decision_goal_links").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons-learned"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons_learned").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const loading = loadingDec || loadingTasks;

  const d = useMemo(() => {
    const now = new Date();
    const rangeDays = timeRange === "all" ? 9999 : parseInt(timeRange);
    const rangeStart = subDays(now, rangeDays);

    // Exclude personal decisions (team_id === null) from analytics
    const orgDecisions = allDecisions.filter(d => d.team_id !== null);
    const orgTasks = allTasks.filter(t => t.team_id !== null);

    // Filter by time range
    const decisions = timeRange === "all" ? orgDecisions : orgDecisions.filter(d => isAfter(new Date(d.created_at), rangeStart));
    const tasks = timeRange === "all" ? orgTasks : orgTasks.filter(t => isAfter(new Date(t.created_at), rangeStart));
    const prevRangeStart = subDays(rangeStart, rangeDays);
    const prevDecisions = timeRange === "all" ? [] : orgDecisions.filter(d => {
      const date = new Date(d.created_at);
      return isAfter(date, prevRangeStart) && isBefore(date, rangeStart);
    });
    const prevTasks = timeRange === "all" ? [] : orgTasks.filter(t => {
      const date = new Date(t.created_at);
      return isAfter(date, prevRangeStart) && isBefore(date, rangeStart);
    });

    const total = decisions.length;
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented");
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level ?? 0) > 0);
    const critical = decisions.filter(d => d.priority === "critical" || (d.ai_risk_score ?? 0) > 60 || (d.escalation_level ?? 0) > 0);
    const highRisk = decisions.filter(d => (d.ai_risk_score ?? 0) > 60);

    // Durations
    const implDurations = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const medianDuration = median(implDurations);
    const avgDuration = implDurations.length > 0 ? Math.round(implDurations.reduce((a, b) => a + b, 0) / implDurations.length) : 0;

    // SLA Compliance
    const withDueDate = decisions.filter(d => d.due_date);
    const slaCompliant = withDueDate.filter(d => {
      if (d.status === "implemented" && d.implemented_at) {
        return new Date(d.implemented_at) <= new Date(d.due_date!);
      }
      return d.status !== "implemented" ? new Date(d.due_date!) >= now : true;
    });
    const slaRate = withDueDate.length > 0 ? Math.round((slaCompliant.length / withDueDate.length) * 100) : 100;

    // Overdue Rate
    const overdueRate = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;

    // Implementation Rate
    const approved = decisions.filter(d => d.status === "approved" || d.status === "implemented");
    const implRate = approved.length > 0 ? Math.round((implemented.length / approved.length) * 100) : 0;

    // Previous period comparison values
    const prevActive = prevDecisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const prevOverdue = prevActive.filter(d => d.due_date && new Date(d.due_date!) < rangeStart);
    const prevOverdueRate = prevActive.length > 0 ? Math.round((prevOverdue.length / prevActive.length) * 100) : null;
    const prevImpl = prevDecisions.filter(d => d.status === "implemented");
    const prevApproved = prevDecisions.filter(d => d.status === "approved" || d.status === "implemented");
    const prevImplRate = prevApproved.length > 0 ? Math.round((prevImpl.length / prevApproved.length) * 100) : null;
    const prevWithDue = prevDecisions.filter(d => d.due_date);
    const prevSlaCompliant = prevWithDue.filter(d => {
      if (d.status === "implemented" && d.implemented_at) return new Date(d.implemented_at) <= new Date(d.due_date!);
      return new Date(d.due_date!) >= rangeStart;
    });
    const prevSlaRate = prevWithDue.length > 0 ? Math.round((prevSlaCompliant.length / prevWithDue.length) * 100) : null;

    // Cost of Delay
    const costOfDelay = active.reduce((sum, dec) => {
      const team = teams.find((t: any) => t.id === dec.team_id);
      const rate = team?.hourly_rate || 75;
      const daysOpen = differenceInDays(now, new Date(dec.created_at));
      const mult = dec.priority === "critical" ? 4 : dec.priority === "high" ? 2.5 : 1.5;
      return sum + Math.round(rate * (daysOpen / 7) * 8 * mult);
    }, 0);

    // Previous period cost
    const prevCostOfDelay = prevDecisions.filter(pd => !["implemented", "rejected", "archived", "cancelled"].includes(pd.status)).reduce((sum, dec) => {
      const team = teams.find((t: any) => t.id === dec.team_id);
      const rate = team?.hourly_rate || 75;
      const daysOpen = differenceInDays(rangeStart, new Date(dec.created_at));
      const mult = dec.priority === "critical" ? 4 : dec.priority === "high" ? 2.5 : 1.5;
      return sum + Math.round(rate * (daysOpen / 7) * 8 * mult);
    }, 0);

    // Decision Quality Index (composite 0-100)
    const rejRate = total > 0 ? decisions.filter(d => d.status === "rejected").length / total : 0;
    const qualityIndex = Math.round(Math.max(0, Math.min(100,
      (implRate * 0.3) +
      ((100 - overdueRate) * 0.25) +
      (slaRate * 0.25) +
      ((100 - (escalated.length / Math.max(1, active.length) * 100)) * 0.2)
    )));

    // Insights
    const insights: { text: string; type: "warning" | "info" | "success"; action?: string }[] = [];
    const prevOverdueRateInsight = prevDecisions.length > 0 ? Math.round((prevDecisions.filter(d => d.due_date && new Date(d.due_date) < rangeStart).length / prevDecisions.length) * 100) : 0;
    const costDelta = costOfDelay - prevCostOfDelay;

    // Top cost driver
    const topCostDrivers = [...active]
      .map(dec => {
        const team = teams.find((t: any) => t.id === dec.team_id);
        const rate = team?.hourly_rate || 75;
        const daysOpen = differenceInDays(now, new Date(dec.created_at));
        const mult = dec.priority === "critical" ? 4 : dec.priority === "high" ? 2.5 : 1.5;
        return { ...dec, cost: Math.round(rate * (daysOpen / 7) * 8 * mult), teamName: team?.name || "—" };
      })
      .sort((a, b) => b.cost - a.cost);

    if (costDelta > 0 && topCostDrivers.length > 0) {
      insights.push({ text: t("analyticsPage.costDelayVsPrev", { delta: costDelta.toLocaleString(), driver: topCostDrivers[0].title }), type: "warning", action: t("analyticsPage.showAffected") });
    }
    if (escalated.length > 0) {
      const escTeams = escalated.reduce((acc: Record<string, number>, d) => {
        const t2 = teams.find((t3: any) => t3.id === d.team_id);
        const n = t2?.name || t("analyticsPage.noTeam");
        acc[n] = (acc[n] || 0) + 1;
        return acc;
      }, {});
      const topEscTeam = Object.entries(escTeams).sort((a, b) => b[1] - a[1])[0];
      insights.push({ text: t("analyticsPage.activeEscalationsInsight", { count: escalated.length, top: topEscTeam ? t("analyticsPage.topTeam", { team: topEscTeam[0] }) : "" }), type: "warning" });
    }
    if (slaRate < 80) {
      insights.push({ text: t("analyticsPage.slaBelow", { rate: slaRate }), type: "warning" });
    }
    if (qualityIndex >= 75) {
      insights.push({ text: t("analyticsPage.qualityGood", { qi: qualityIndex }), type: "success" });
    }
    if (medianDuration > 30) {
      insights.push({ text: t("analyticsPage.medianTTDLong", { days: medianDuration }), type: "warning" });
    }

    // Flow chart data (8 weeks)
    const weekCount = Math.min(12, Math.max(8, Math.ceil(rangeDays / 7)));
    const weekData = Array.from({ length: weekCount }, (_, i) => {
      const weekEnd = subDays(now, (weekCount - 1 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const label = format(weekEnd, "dd.MM", { locale: dateFnsLocale });
      const created = allDecisions.filter(dd => {
        const date = new Date(dd.created_at);
        return date >= weekStart && date < weekEnd;
      }).length;
      const completed = allDecisions.filter(dd => dd.implemented_at && new Date(dd.implemented_at) >= weekStart && new Date(dd.implemented_at) < weekEnd).length;
      const rejected = allDecisions.filter(dd => dd.status === "rejected" && new Date(dd.updated_at) >= weekStart && new Date(dd.updated_at) < weekEnd).length;
      const backlog = allDecisions.filter(dd => {
        const date = new Date(dd.created_at);
        return date < weekEnd && !["implemented", "rejected", "archived", "cancelled"].includes(dd.status);
      }).length;
      return { week: label, [t("analyticsPage.created")]: created, [t("analyticsPage.implemented")]: completed, [t("analyticsPage.rejected")]: rejected, [t("analyticsPage.backlog")]: backlog };
    });

    // Bottleneck: Duration by status phase
    const statusDurations: Record<string, number[]> = {};
    decisions.forEach(dec => {
      const created = new Date(dec.created_at);
      const phases: { status: string; start: Date; end: Date }[] = [];
      // Simplified: estimate time in current status
      const daysInCurrent = differenceInDays(now, new Date(dec.updated_at));
      const totalDays = differenceInDays(now, created);
      const statusKey = statusLabels[dec.status] || dec.status;
      if (!statusDurations[statusKey]) statusDurations[statusKey] = [];
      statusDurations[statusKey].push(Math.max(1, daysInCurrent));
    });
    const statusPhaseData = Object.entries(statusDurations)
      .map(([name, days]) => ({
        name,
        median: median(days),
        count: days.length,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.median - a.median);

    // Bottleneck Heatmap: Status × Team
    const heatmapData: { team: string; status: string; count: number; medianDays: number }[] = [];
    const statusKeys = ["draft", "review", "approved", "implemented"];
    teams.forEach((team: any) => {
      statusKeys.forEach(s => {
        const teamStatusDecs = decisions.filter(dd => dd.team_id === team.id && dd.status === s);
        const days = teamStatusDecs.map(dd => differenceInDays(now, new Date(dd.updated_at)));
        heatmapData.push({
          team: team.name,
          status: statusLabels[s] || s,
          count: teamStatusDecs.length,
          medianDays: median(days),
        });
      });
    });

    // Risk Distribution
    const riskDistribution = [
      { name: t("analyticsPage.riskLow"), value: decisions.filter(dd => (dd.ai_risk_score || 0) <= 30).length, fill: COLORS.success },
      { name: t("analyticsPage.riskMedium"), value: decisions.filter(dd => (dd.ai_risk_score || 0) > 30 && (dd.ai_risk_score || 0) <= 60).length, fill: COLORS.warning },
      { name: t("analyticsPage.riskHigh"), value: decisions.filter(dd => (dd.ai_risk_score || 0) > 60 && (dd.ai_risk_score || 0) <= 80).length, fill: COLORS.destructive },
      { name: t("analyticsPage.riskCritical"), value: decisions.filter(dd => (dd.ai_risk_score || 0) > 80).length, fill: "hsl(0 90% 40%)" },
    ].filter(dd => dd.value > 0);

    // Cost by category
    const costByCategory = Object.entries(
      active.reduce((acc: Record<string, number>, dec) => {
        const cat = categoryLabels[dec.category] || dec.category;
        const team = teams.find((t: any) => t.id === dec.team_id);
        const rate = team?.hourly_rate || 75;
        const daysOpen = differenceInDays(now, new Date(dec.created_at));
        const mult = dec.priority === "critical" ? 4 : dec.priority === "high" ? 2.5 : 1.5;
        acc[cat] = (acc[cat] || 0) + Math.round(rate * (daysOpen / 7) * 8 * mult);
        return acc;
      }, {})
    ).map(([name, cost]) => ({ name, cost })).sort((a, b) => b.cost - a.cost);

    // Governance: Escalations per week
    const escPerWeek = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const label = format(weekEnd, "dd.MM", { locale: dateFnsLocale });
      const escCount = allDecisions.filter(dd =>
        dd.last_escalated_at && new Date(dd.last_escalated_at) >= weekStart && new Date(dd.last_escalated_at) < weekEnd
      ).length;
      // SLA compliance for that week
      const weekDecs = allDecisions.filter(dd => {
        const date = new Date(dd.created_at);
        return date < weekEnd && dd.due_date;
      });
      const weekCompliant = weekDecs.filter(dd => {
        if (dd.status === "implemented" && dd.implemented_at) return new Date(dd.implemented_at) <= new Date(dd.due_date!);
        return new Date(dd.due_date!) >= weekEnd;
      });
      const compliance = weekDecs.length > 0 ? Math.round((weekCompliant.length / weekDecs.length) * 100) : 100;
      return { week: label, [t("analyticsPage.escalations")]: escCount, "SLA %": compliance };
    });

    // Review queue
    const openReviews = reviews.filter(r => !r.reviewed_at);
    const reviewWaitDays = openReviews.map(r => differenceInDays(now, new Date(r.created_at)));
    const medianReviewWait = median(reviewWaitDays);

    // Strategic alignment
    const goalAlignment = goals.map((g: any) => {
      const linkedDecIds = goalLinks.filter((gl: any) => gl.goal_id === g.id).map((gl: any) => gl.decision_id);
      const linkedDecs = decisions.filter(dd => linkedDecIds.includes(dd.id));
      const activeLinked = linkedDecs.filter(dd => !["implemented", "rejected", "archived", "cancelled"].includes(dd.status));
      const hasOverdue = activeLinked.some(dd => dd.due_date && new Date(dd.due_date) < now);
      const hasEscalated = activeLinked.some(dd => (dd.escalation_level ?? 0) > 0);
      const health: "stable" | "at_risk" | "critical" = hasEscalated ? "critical" : hasOverdue ? "at_risk" : "stable";
      return { ...g, linkedCount: linkedDecs.length, health };
    });

    // Quality trend (monthly, last 6 months)
    const qualityTrend = Array.from({ length: 6 }, (_, i) => {
      const monthEnd = subDays(now, i * 30);
      const monthStart = subDays(monthEnd, 30);
      const label = format(monthEnd, "MMM", { locale: dateFnsLocale });
      const monthDecs = allDecisions.filter(dd => {
        const date = new Date(dd.created_at);
        return date >= monthStart && date < monthEnd;
      });
      const monthTotal = monthDecs.length || 1;
      const monthImpl = monthDecs.filter(dd => dd.status === "implemented").length;
      const monthRej = monthDecs.filter(dd => dd.status === "rejected").length;
      const monthOverdue = monthDecs.filter(dd => dd.due_date && new Date(dd.due_date) < monthEnd && !["implemented", "rejected"].includes(dd.status)).length;
      const qi = Math.round(Math.max(0, Math.min(100,
        (monthImpl / monthTotal * 100 * 0.4) + ((100 - monthOverdue / monthTotal * 100) * 0.3) + ((100 - monthRej / monthTotal * 100) * 0.3)
      )));
      return { month: label, [t("analyticsPage.qualityIndex")]: qi, [t("analyticsPage.rejectionRate")]: Math.round(monthRej / monthTotal * 100) };
    }).reverse();

    // Lessons stats
    const lessonsRate = implemented.length > 0 ? Math.min(100, Math.round((lessons.length / implemented.length) * 100)) : 0;

    return {
      total, active, implemented, overdue, escalated, critical, highRisk,
      medianDuration, avgDuration, slaRate, overdueRate, implRate, costOfDelay,
      qualityIndex, insights, weekData, statusPhaseData, heatmapData,
      riskDistribution, topCostDrivers: topCostDrivers.slice(0, 5), costByCategory,
      escPerWeek, openReviews: openReviews.length, medianReviewWait,
      goalAlignment, qualityTrend, lessonsRate, costDelta,
      prevOverdueRate, prevImplRate, prevSlaRate,
    };
  }, [allDecisions, allTasks, teams, reviews, goals, goalLinks, lessons, timeRange, t, dateFnsLocale]);

  if (loading) return <AnalysisPageSkeleton cards={8} sections={0} showChart />;

  if (allDecisions.length === 0) {
    const empty = (
      <EmptyAnalysisState
        icon={BarChart3}
        title={t("analytics.noAnalysisData")}
        description={t("analytics.noAnalysisDataDesc")}
        hint={t("analytics.noAnalysisDataHint")}
      />
    );
    return embedded ? empty : <AppLayout>{empty}</AppLayout>;
  }

  const trendArrow = (current: number, previous: number | null, lowerIsBetter = false) => {
    if (previous === null) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 2) return { icon: Minus, color: "text-muted-foreground", delta: 0 };
    const better = lowerIsBetter ? diff < 0 : diff > 0;
    return { icon: better ? ArrowUpRight : ArrowDownRight, color: better ? "text-success" : "text-destructive", delta: diff };
  };

  const kpis = [
    { label: t("analytics.activeDecisions"), value: d.active.length, icon: FileText },
    { label: t("analytics.critical"), value: d.critical.length, icon: AlertTriangle, color: d.critical.length > 0 ? "text-destructive" : undefined },
    { label: t("analytics.medianTTD"), value: d.medianDuration > 0 ? `${d.medianDuration}d` : "—", icon: Clock },
    { label: t("analytics.slaCompliance"), value: `${d.slaRate}%`, icon: Shield, color: d.slaRate < 80 ? "text-destructive" : d.slaRate < 90 ? "text-warning" : "text-success", trend: trendArrow(d.slaRate, d.prevSlaRate) },
    { label: t("analytics.overdueRate"), value: `${d.overdueRate}%`, icon: AlertTriangle, color: d.overdueRate > 20 ? "text-destructive" : d.overdueRate > 10 ? "text-warning" : undefined, trend: trendArrow(d.overdueRate, d.prevOverdueRate, true) },
    { label: t("analytics.costOfDelay"), value: `€${d.costOfDelay.toLocaleString()}`, icon: DollarSign, color: "text-destructive", isCod: true },
    { label: t("analytics.qualityIndex"), value: d.qualityIndex, icon: GaugeCircle, color: d.qualityIndex >= 75 ? "text-success" : d.qualityIndex >= 50 ? "text-warning" : "text-destructive" },
    { label: t("analytics.implementationRate"), value: `${d.implRate}%`, icon: CheckCircle2, color: d.implRate >= 70 ? "text-success" : d.implRate >= 40 ? "text-warning" : "text-destructive", trend: trendArrow(d.implRate, d.prevImplRate) },
  ];

  const content = (
    <div className="section-gap-lg">
      {/* SECTION 1: Executive Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 stagger-children">
        {kpis.map((kpi, i) => {
          const isCod = (kpi as any).isCod;
          return (
            <Card
              key={i}
              className={`card-interactive border-border/60 ${isCod ? "sm:col-span-2 lg:col-span-2 bg-destructive/[0.04]" : ""}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded bg-muted/40 flex items-center justify-center">
                    <kpi.icon className={`w-3 h-3 ${kpi.color || "text-muted-foreground"}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`font-bold tabular-nums ${kpi.color || ""}`}
                    style={isCod ? { fontSize: "28px" } : { fontSize: "20px" }}
                  >
                    {kpi.value}
                  </span>
                  {(kpi as any).trend && (
                    <span className={`${(kpi as any).trend.color}`}>
                      {(() => { const TIcon = (kpi as any).trend.icon; return <TIcon className="w-3 h-3" />; })()}
                    </span>
                  )}
                </div>
                {isCod && (
                  <p className="text-[11px] font-medium mt-0.5 text-destructive">
                    {t("analytics.costsToday", "Kosten heute")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SECTION 2: Insight Bar */}
      {d.insights.length > 0 && (
        <Card className="border-l-4 border-l-warning border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
               <Lightbulb className="w-3.5 h-3.5 text-warning" />
               <span className="text-sm font-semibold">{t("analytics.whatChanged")}</span>
            </div>
            <div className="space-y-1.5">
              {d.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${insight.type === "warning" ? "bg-warning" : insight.type === "success" ? "bg-success" : "bg-primary"}`} />
                  <span className="text-foreground">{insight.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: Flow & Trends */}
       <CollapsibleSection
         title={t("analytics.throughput")}
         subtitle={t("analytics.throughputSub")}
         icon={<TrendingUp className="w-4 h-4 text-primary" />}
      >
        <Card className="border-border/60">
          <CardContent className="pt-6 pb-4 px-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.weekData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={8} interval={1} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={t("analyticsPage.created")} stroke={COLORS.primary} fill="url(#gCreated)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey={t("analyticsPage.implemented")} stroke={COLORS.success} fill="url(#gResolved)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  {/* Break-even reference line: average of created values */}
                  {(() => {
                    const createdKey = t("analyticsPage.created");
                    const implKey = t("analyticsPage.implemented");
                    const avgCreated = d.weekData.length > 0
                      ? Math.round(d.weekData.reduce((sum: number, w: any) => sum + (w[createdKey] || 0), 0) / d.weekData.length)
                      : 0;
                    return avgCreated > 0 ? (
                      <Line type="monotone" dataKey={() => avgCreated} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="6 4" dot={false} name={t("analytics.breakeven", "Break-even")} />
                    ) : null;
                  })()}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-5 mt-3">
               {[
                 { label: t("analytics.created"), color: COLORS.primary },
                 { label: t("analytics.implemented"), color: COLORS.success },
                 { label: t("analytics.breakeven", "Break-even"), color: "hsl(var(--muted-foreground))" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* SECTION 4: Bottleneck Intelligence */}
       <CollapsibleSection
         title={t("analytics.bottleneck")}
         subtitle={t("analytics.bottleneckSub")}
         icon={<Activity className="w-4 h-4 text-warning" />}
      >
        <div className={`grid grid-cols-1 ${teams.length > 2 ? "lg:grid-cols-2" : ""} gap-4`}>
          {/* Where Time is Lost */}
          <Card className="border-border/60">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">{t("analytics.medianDaysByPhase")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {d.statusPhaseData.length > 0 ? (
                <div className="space-y-3">
                  {d.statusPhaseData.map((item, i) => {
                    const maxMedian = Math.max(...d.statusPhaseData.map(x => x.median));
                    const isBottleneck = item.median === maxMedian && item.median > 7;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{item.name}</span>
                            {isBottleneck && <Badge variant="destructive" className="text-[9px] px-1 py-0">Bottleneck</Badge>}
                          </div>
                          <span className="text-muted-foreground tabular-nums">{item.median} {t("analytics.days")} <span className="text-[10px]">({item.count})</span></span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isBottleneck ? "bg-destructive/80" : "bg-primary/70"}`}
                            style={{ width: `${Math.min(100, (item.median / maxMedian) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">{t("analyticsPage.noPhaseData")}</p>
              )}
            </CardContent>
          </Card>

          {/* Status × Team Heatmap — only show if more than 2 teams */}
          {teams.length > 2 && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("analyticsPage.statusTeamHeatmap")}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {d.heatmapData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                         <tr className="border-b border-border/60">
                           <th className="text-left py-2 px-2 font-medium text-muted-foreground">Team</th>
                          {[t("analyticsPage.draftStatus"), t("analyticsPage.reviewStatus"), t("analyticsPage.approvedStatus"), t("analyticsPage.implementedStatus")].map(s => (
                            <th key={s} className="text-center py-2 px-2 font-medium text-muted-foreground">{s}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((team: any) => (
                          <tr key={team.id} className="border-b border-border/20">
                            <td className="py-2 px-2 font-medium truncate max-w-[120px]">{team.name}</td>
                            {[t("analyticsPage.draftStatus"), t("analyticsPage.reviewStatus"), t("analyticsPage.approvedStatus"), t("analyticsPage.implementedStatus")].map(s => {
                              const cell = d.heatmapData.find(h => h.team === team.name && h.status === s);
                              const count = cell?.count ?? 0;
                              const days = cell?.medianDays ?? 0;
                              const bg = count === 0 ? "bg-muted/20" : days > 14 ? "bg-destructive/20 text-destructive" : days > 7 ? "bg-warning/20 text-warning" : "bg-success/20 text-success";
                              return (
                                <td key={s} className="text-center py-2 px-2">
                                  <span className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium ${bg}`}>
                                    {count > 0 ? `${count} (${days}d)` : "—"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">{t("analyticsPage.createTeamsForHeatmap")}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CollapsibleSection>

      {/* SECTION 5: Risk & Economic Impact */}
      <CollapsibleSection
        title={t("analyticsPage.riskEconomicImpact")}
        subtitle={t("analyticsPage.riskEconomicImpactSub", { cost: d.costOfDelay.toLocaleString() })}
        icon={<DollarSign className="w-4 h-4 text-destructive" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk Distribution Donut */}
          <Card className="border-border/60">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.riskDistribution")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {d.riskDistribution.length > 0 ? (
                <>
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={d.riskDistribution} cx="50%" cy="50%" outerRadius={70} innerRadius={38} dataKey="value" paddingAngle={3} stroke="none" label={({ name, value, percent }) => `${value} (${Math.round(percent * 100)}%)`}>
                          {d.riskDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1">
                    {d.riskDistribution.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
                        {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-xs text-muted-foreground text-center py-8">{t("analyticsPage.noRiskData")}</p>}
            </CardContent>
          </Card>

          {/* Top 5 Cost Drivers */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.top5CostDrivers")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {d.topCostDrivers.length > 0 ? (
                <div className="space-y-3">
                  {d.topCostDrivers.map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                        <Link to={`/decisions/${item.id}`} className="text-xs font-medium truncate hover:underline">{item.title}</Link>
                      </div>
                      <span className="text-xs font-bold text-destructive tabular-nums shrink-0">€{item.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-8">{t("analyticsPage.noOpenDecisions")}</p>}
            </CardContent>
          </Card>

          {/* Cost by Category */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.costByCategory")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {d.costByCategory.length > 0 ? (
                <div className="space-y-3">
                  {d.costByCategory.map((item, i) => {
                    const maxCost = Math.max(...d.costByCategory.map(c => c.cost));
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground tabular-nums">€{item.cost.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full bg-destructive/60" style={{ width: `${(item.cost / maxCost) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-8">{t("analyticsPage.noCostData")}</p>}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* SECTION 6: Governance & SLA Control */}
      <CollapsibleSection
        title={t("analyticsPage.governanceSlaControl")}
        subtitle={t("analyticsPage.governanceSlaControlSub", { sla: d.slaRate, reviews: d.openReviews })}
        icon={<Shield className="w-4 h-4 text-primary" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SLA + Escalation Trend */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.slaComplianceEscalations")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={d.escPerWeek} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey={t("analyticsPage.escalations")} fill={COLORS.destructive} radius={[3, 3, 0, 0]} barSize={16} />
                    <Line yAxisId="right" type="monotone" dataKey="SLA %" stroke={COLORS.success} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Review Queue & Governance KPIs */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.reviewQueueGovernance")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("analyticsPage.openReviews")}</p>
                  <p className="text-2xl font-bold">{d.openReviews}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("analyticsPage.medianWaitTime")}</p>
                  <p className={`text-2xl font-bold ${d.medianReviewWait > 7 ? "text-destructive" : ""}`}>{d.medianReviewWait}d</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("analyticsPage.activeEscalations")}</p>
                  <p className={`text-2xl font-bold ${d.escalated.length > 0 ? "text-destructive" : "text-success"}`}>{d.escalated.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("analyticsPage.slaCompliance")}</p>
                  <p className={`text-2xl font-bold ${d.slaRate >= 80 ? "text-success" : "text-destructive"}`}>{d.slaRate}%</p>
                </div>
              </div>
              {d.escalated.length > 0 && (
                <div className="border-t border-border/40 pt-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("analyticsPage.escalatedDecisions")}</p>
                  <div className="space-y-1.5">
                    {d.escalated.slice(0, 3).map(dec => (
                      <Link key={dec.id} to={`/decisions/${dec.id}`} className="flex items-center justify-between gap-2 text-xs hover:bg-muted/30 rounded px-2 py-1 transition-colors">
                        <span className="truncate font-medium">{dec.title}</span>
                        <Badge variant="destructive" className="text-[9px] px-1 py-0 shrink-0">Lvl {dec.escalation_level}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* SECTION 7: Decision Quality & Strategic Alignment */}
      <CollapsibleSection
        title={t("analyticsPage.qualityAlignment")}
        subtitle={t("analyticsPage.qualityAlignmentSub", { qi: d.qualityIndex, lessons: d.lessonsRate })}
        icon={<Target className="w-4 h-4 text-success" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Quality Index Trend */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.qualityTrend6m")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.qualityTrend} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} unit="" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey={t("analyticsPage.qualityIndex")} stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.primary }} />
                    <Line type="monotone" dataKey={t("analyticsPage.rejectionRate")} stroke={COLORS.destructive} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS.primary }} />{t("analyticsPage.qualityIndex")}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS.destructive }} />{t("analyticsPage.rejectionRate")}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Goal Alignment */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("analyticsPage.strategicGoalCoverage")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {d.goalAlignment.length > 0 ? (
                <div className="space-y-3">
                  {d.goalAlignment.map((goal: any) => {
                    const hasNoData = goal.linkedCount === 0;
                    const healthBg = hasNoData
                      ? ""
                      : goal.health === "critical" ? "bg-destructive/15 text-destructive" : goal.health === "at_risk" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
                    const healthLabel = hasNoData
                      ? t("analyticsPage.healthNoData", "Keine Daten")
                      : goal.health === "critical" ? t("analyticsPage.healthCritical") : goal.health === "at_risk" ? t("analyticsPage.healthAtRisk") : t("analyticsPage.healthStable");
                    return (
                      <div key={goal.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{goal.title}</p>
                          <p className="text-[10px] text-muted-foreground">{goal.linkedCount} {t("analyticsPage.decisions")}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 shrink-0 ${healthBg}`}
                          style={hasNoData ? { color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--muted-foreground))" } : undefined}
                        >
                          {healthLabel}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-2">{t("analyticsPage.noGoalsCreated")}</p>
                  <Link to="/strategy">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5">
                      <Target className="w-3 h-3" /> {t("analyticsPage.createGoals")}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Learning signal */}
              <div className="border-t border-border/40 mt-4 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("analyticsPage.lessonsLearnedCoverage")}</span>
                  <span className={`font-bold ${d.lessonsRate >= 50 ? "text-success" : d.lessonsRate >= 20 ? "text-warning" : "text-destructive"}`}>{d.lessonsRate}%</span>
                </div>
                <Progress value={d.lessonsRate} className="mt-1.5 h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {d.lessonsRate < 30
                    ? t("analyticsPage.lessonsLow")
                    : d.lessonsRate < 60
                      ? t("analyticsPage.lessonsMedium")
                      : t("analyticsPage.lessonsHigh")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
};

export default Analytics;
