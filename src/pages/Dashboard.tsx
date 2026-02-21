import { useMemo, useState, useEffect, lazy, Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight, BarChart3,
  Activity, DollarSign, Zap, FileText, Eye, TrendingUp, TrendingDown,
  Minus, ShieldAlert, CheckCircle2, Info, Command, ListTodo,
  Link2, ChevronDown, ChevronRight, Users, ExternalLink, Bell,
  Download, CalendarIcon, RefreshCw, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useReviews, useFilteredDependencies } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { statusLabels, priorityLabels, categoryLabels } from "@/lib/labels";
import { format, differenceInDays, subDays, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";

const LeaderboardWidget = lazy(() => import("@/components/dashboard/LeaderboardWidget"));

type TimeRange = 7 | 30 | 90 | "custom";

// ─── KPI Skeleton ───
const KpiSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="border border-border rounded-lg p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const { data: allDecisions = [], isLoading: loadingDec, isError: errorDec, refetch: refetchDec } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: risks = [] } = useRisks();
  const { data: tasks = [], isLoading: loadingTasks, isError: errorTasks, refetch: refetchTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useReviews();
  const { data: dependencies = [] } = useFilteredDependencies();
  const profileMap = buildProfileMap(profiles);
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [velocityToggle, setVelocityToggle] = useState<"completed" | "created">("completed");

  const isPersonal = selectedTeamId === null;
  const currentTeam = teams.find((t: any) => t.id === selectedTeamId);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";

  const isLoading = loadingDec || loadingTasks;
  const hasError = errorDec || errorTasks;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        navigate("/decisions");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);

  const effectiveDays = useMemo(() => {
    if (timeRange === "custom" && customRange.from && customRange.to) {
      return differenceInDays(customRange.to, customRange.from) || 1;
    }
    return timeRange === "custom" ? 30 : timeRange;
  }, [timeRange, customRange]);

  const decisions = isPersonal
    ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
    : allDecisions;
  const contextTasks = isPersonal
    ? tasks.filter(t => t.created_by === user?.id || t.assignee_id === user?.id)
    : tasks;

  // === ALL COMPUTED DATA ===
  const computed = useMemo(() => {
    const now = new Date();
    const rangeStart = timeRange === "custom" && customRange.from ? customRange.from : subDays(now, effectiveDays);
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1);
    const pendingReviews = reviews.filter(r => !r.reviewed_at && r.reviewer_id === user?.id);

    const openDecisionIds = new Set(active.map(d => d.id));
    const blockedTaskIds = new Set<string>();
    dependencies.forEach(dep => {
      if (dep.source_decision_id && openDecisionIds.has(dep.source_decision_id) && dep.target_task_id) blockedTaskIds.add(dep.target_task_id);
      if (dep.target_decision_id && openDecisionIds.has(dep.target_decision_id) && dep.source_task_id) blockedTaskIds.add(dep.source_task_id);
    });
    const blockedTasks = contextTasks.filter(t => blockedTaskIds.has(t.id) && t.status !== "done");

    const oldestOverdue = overdue.length > 0
      ? overdue.reduce((oldest, d) => new Date(d.due_date!) < new Date(oldest.due_date!) ? d : oldest)
      : null;
    const oldestOverdueDays = oldestOverdue ? differenceInDays(now, new Date(oldestOverdue.due_date!)) : 0;

    const lastWeek = subDays(now, 7);
    const overdueLastWeek = decisions.filter(d => {
      if (["implemented", "rejected"].includes(d.status)) return false;
      if (!d.due_date) return false;
      const due = new Date(d.due_date);
      return due < lastWeek && new Date(d.created_at) <= lastWeek;
    }).length;
    const overdueDelta = overdue.length - overdueLastWeek;
    const maxEscalation = escalated.length > 0 ? Math.max(...escalated.map(d => d.escalation_level || 0)) : 0;

    const implemented = decisions.filter(d => d.status === "implemented");
    const completedInRange = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= rangeStart).length;
    const velocities = implemented.filter(d => d.implemented_at).map(d => differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)));
    const avgDecisionTime = velocities.length > 0 ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10 : null;
    const overdueRate = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;

    const completionRate = decisions.length > 0 ? (implemented.length / decisions.length) * 100 : 0;
    const slaRate = active.length > 0 ? Math.max(0, 100 - (overdue.length / active.length) * 100) : 100;
    const speedScore = avgDecisionTime != null ? Math.max(0, Math.min(100, 100 - avgDecisionTime * 1.5)) : 50;
    const performanceIndex = Math.round(speedScore * 0.4 + slaRate * 0.3 + completionRate * 0.3);

    const halfRange = Math.floor(effectiveDays / 2);
    const halfStart = subDays(now, halfRange);
    const prevHalfStart = subDays(now, effectiveDays);
    const openPrev = decisions.filter(d => { const c = new Date(d.created_at); return c >= prevHalfStart && c < halfStart && !["implemented", "rejected"].includes(d.status); }).length;
    const openCurr = decisions.filter(d => { const c = new Date(d.created_at); return c >= halfStart && !["implemented", "rejected"].includes(d.status); }).length;
    const completedCurr = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= halfStart).length;
    const completedPrev = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= prevHalfStart && new Date(d.implemented_at) < halfStart).length;
    const trend = (curr: number, prev: number): "up" | "down" | "neutral" => curr > prev ? "up" : curr < prev ? "down" : "neutral";
    const delta = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? "+100%" : "—") : `${curr > prev ? "+" : ""}${Math.round(((curr - prev) / prev) * 100)}%`;

    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekLabel = format(weekEnd, "dd.MM", { locale: de });
      const completed = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd).length;
      const created = decisions.filter(d => new Date(d.created_at) >= weekStart && new Date(d.created_at) < weekEnd).length;
      const overdueAtEnd = decisions.filter(d => { if (!d.due_date) return false; const due = new Date(d.due_date); const c = new Date(d.created_at); if (c > weekEnd || due > weekEnd) return false; if (d.implemented_at && new Date(d.implemented_at) <= weekEnd) return false; if (d.status === "rejected") return false; return true; }).length;
      const completedDecs = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd);
      const avgTime = completedDecs.length > 0 ? Math.round(completedDecs.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / completedDecs.length) : null;
      const escalatedCount = decisions.filter(d => { if ((d.escalation_level || 0) < 1) return false; const c = new Date(d.created_at); return c <= weekEnd && (!d.implemented_at || new Date(d.implemented_at) > weekEnd); }).length;
      return { week: weekLabel, completed, created, overdue: overdueAtEnd, avgTime: avgTime ?? 0, escalated: escalatedCount };
    });

    const defaultRate = currentTeam?.hourly_rate || 75;
    const priorityMultiplier: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    let totalDelayCost = 0;
    const costItems: { title: string; cost: number; days: number; priority: string; category: string; team_id: string | null; id: string }[] = [];
    active.forEach(d => {
      const daysOpen = Math.max(0, differenceInDays(now, new Date(d.created_at)));
      const mult = priorityMultiplier[d.priority] || 1.5;
      const cost = Math.round(daysOpen * 2 * defaultRate * mult);
      totalDelayCost += cost;
      costItems.push({ title: d.title, cost, days: daysOpen, priority: d.priority, category: d.category, team_id: d.team_id, id: d.id });
    });
    costItems.sort((a, b) => b.cost - a.cost);
    const staleDecisions = active.filter(d => differenceInDays(now, new Date(d.created_at)) > 14);

    const costByCategory: Record<string, number> = {};
    const costByPriority: Record<string, number> = {};
    costItems.forEach(c => { costByCategory[c.category] = (costByCategory[c.category] || 0) + c.cost; costByPriority[c.priority] = (costByPriority[c.priority] || 0) + c.cost; });

    const recentlyOpened = [...decisions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 3);
    const recentlyEscalated = [...escalated].sort((a, b) => new Date(b.last_escalated_at || b.updated_at).getTime() - new Date(a.last_escalated_at || a.updated_at).getTime()).slice(0, 3);

    return {
      overdue, escalated, pendingReviews, active, blockedTasks,
      oldestOverdueDays, overdueDelta, maxEscalation,
      openCount: active.length, completedInRange, avgDecisionTime, overdueRate, performanceIndex, totalDelayCost,
      openTrend: trend(openCurr, openPrev), completedTrend: trend(completedCurr, completedPrev),
      openDelta: delta(openCurr, openPrev), completedDelta: delta(completedCurr, completedPrev),
      weekData, costItems, staleDecisions, implemented,
      costByCategory, costByPriority,
      recentlyOpened, recentlyEscalated,
    };
  }, [decisions, contextTasks, reviews, dependencies, user, effectiveDays, timeRange, customRange, currentTeam]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;
  const priorityColors: Record<string, string> = { critical: "text-destructive", high: "text-warning", medium: "text-muted-foreground", low: "text-muted-foreground" };

  if (hasError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mb-4" />
          <h1 className="text-lg font-semibold mb-1">Laden fehlgeschlagen</h1>
          <p className="text-sm text-muted-foreground mb-4">Bitte versuche es erneut.</p>
          <Button variant="outline" size="sm" onClick={() => { refetchDec(); refetchTasks(); }} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Erneut versuchen
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!isLoading && allDecisions.length === 0 && tasks.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Willkommen, {firstName}</h1>
            <p className="text-muted-foreground mb-6">Starte mit deiner ersten Entscheidung.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => navigate("/decisions")} className="gap-1.5">
                <Plus className="w-4 h-4" /> Neue Entscheidung
              </Button>
              <Button variant="outline" onClick={() => navigate("/teams")} className="gap-1.5">
                Team einrichten <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const dashboardTitle = isPersonal ? "Mein Arbeitsbereich" : `${currentTeam?.name || "Team"}`;
  const actionCount = computed.overdue.length + computed.escalated.length + computed.pendingReviews.length + computed.blockedTasks.length;
  const hasNoActions = actionCount === 0;

  const toggleExpand = (key: string) => setExpandedAction(prev => prev === key ? null : key);

  const chartTooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "none" };

  return (
    <AppLayout>
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{dashboardTitle}</h1>
          <p className="text-sm text-muted-foreground">Was braucht heute deine Aufmerksamkeit?</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border p-0.5">
            {([7, 30, 90] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${timeRange === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {r}d
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/decisions")} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Neu
          </Button>
        </div>
      </div>

      <div className="space-y-8">

        {/* ═══ ACTION REQUIRED ═══ */}
        {!isLoading && !hasNoActions && (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Action Required</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Overdue */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-4 h-4 text-destructive" />
                  {computed.overdueDelta !== 0 && (
                    <span className={`text-[10px] font-medium ${computed.overdueDelta > 0 ? "text-destructive" : "text-success"}`}>
                      {computed.overdueDelta > 0 ? "+" : ""}{computed.overdueDelta}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-semibold tracking-tight">{computed.overdue.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Überfällig</p>
                {computed.overdue.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-7" onClick={() => navigate("/decisions")}>
                    Anzeigen <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Escalations */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  {computed.maxEscalation > 0 && <span className="text-[10px] font-medium text-warning">L{computed.maxEscalation}</span>}
                </div>
                <p className="text-2xl font-semibold tracking-tight">{computed.escalated.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Eskalationen</p>
                {computed.escalated.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-7" onClick={() => navigate("/engine")}>
                    Anzeigen <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Reviews */}
              <div className="border border-border rounded-lg p-4">
                <Eye className="w-4 h-4 text-muted-foreground mb-3" />
                <p className="text-2xl font-semibold tracking-tight">{computed.pendingReviews.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Offene Reviews</p>
                {computed.pendingReviews.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-7" onClick={() => navigate(`/decisions/${computed.pendingReviews[0].decision_id}`)}>
                    Review starten <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Blocked */}
              <div className="border border-border rounded-lg p-4">
                <Link2 className="w-4 h-4 text-muted-foreground mb-3" />
                <p className="text-2xl font-semibold tracking-tight">{computed.blockedTasks.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Blockierte Tasks</p>
                {computed.blockedTasks.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-7" onClick={() => navigate("/tasks")}>
                    Anzeigen <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        {!isLoading && hasNoActions && (
          <div className="border border-success/20 rounded-lg p-6 text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">Alles im grünen Bereich</p>
            <p className="text-xs text-muted-foreground mt-0.5">Keine offenen Aktionspunkte.</p>
          </div>
        )}

        {/* ═══ KPIs ═══ */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Metriken</h2>
          {isLoading ? <KpiSkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Offen", value: computed.openCount, trend: computed.openTrend, delta: computed.openDelta },
                { label: "Ø Dauer", value: computed.avgDecisionTime != null ? `${computed.avgDecisionTime}d` : "—" },
                { label: "Überfällig", value: `${computed.overdueRate}%`, color: computed.overdueRate > 20 ? "text-destructive" : undefined },
                { label: "Performance", value: `${computed.performanceIndex}%`, color: computed.performanceIndex > 60 ? "text-success" : computed.performanceIndex > 30 ? "text-warning" : "text-destructive" },
                { label: "Delay Cost", value: formatCost(computed.totalDelayCost), color: "text-destructive" },
              ].map((kpi, i) => (
                <div key={kpi.label} className="border border-border rounded-lg p-4 cursor-pointer hover:border-foreground/20 transition-colors" onClick={() => navigate("/analytics")}>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <p className={`text-xl font-semibold tracking-tight ${(kpi as any).color || ""}`}>{kpi.value}</p>
                    {(kpi as any).trend && (kpi as any).delta !== "—" && (
                      <span className={`text-[10px] ${(kpi as any).trend === "up" ? "text-success" : (kpi as any).trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                        {(kpi as any).delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ CHARTS ═══ */}
        {!isLoading && (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Velocity */}
              <div className="border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">Decisions / Woche</p>
                    <p className="text-xs text-muted-foreground">8-Wochen Trend</p>
                  </div>
                  <div className="flex items-center rounded-md border border-border p-0.5">
                    {(["completed", "created"] as const).map(t => (
                      <button key={t} onClick={() => setVelocityToggle(t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${velocityToggle === t ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                        {t === "completed" ? "Completed" : "Created"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gradVelocity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey={velocityToggle} name={velocityToggle === "completed" ? "Abgeschlossen" : "Erstellt"} stroke="hsl(var(--foreground))" fill="url(#gradVelocity)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Overdue + Duration */}
              <div className="border border-border rounded-lg p-5">
                <div className="mb-4">
                  <p className="text-sm font-medium">Überfällig & Dauer</p>
                  <p className="text-xs text-muted-foreground">Bearbeitungszeit & Overdue pro Woche</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="overdue" name="Überfällig" stroke="hsl(var(--destructive))" fill="url(#gradOverdue)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="avgTime" name="Ø Tage" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1} strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Escalation */}
              <div className="border border-border rounded-lg p-5 lg:col-span-2">
                <div className="mb-4">
                  <p className="text-sm font-medium">Eskalationen / Woche</p>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="escalated" name="Eskalationen" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ ECONOMIC IMPACT ═══ */}
        {!isLoading && computed.totalDelayCost > 0 && (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Economic Impact</h2>
            <div className="border border-border rounded-lg p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Delay Cost</p>
                  <p className="text-2xl font-semibold tracking-tight text-destructive">{formatCost(computed.totalDelayCost)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{computed.active.length} offene Entscheidungen</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stale Decisions</p>
                  <p className="text-2xl font-semibold tracking-tight">{computed.staleDecisions.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">&gt;14 Tage ohne Fortschritt</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top 3 teuerste</p>
                  <div className="space-y-1.5">
                    {computed.costItems.slice(0, 3).map((c, i) => (
                      <button key={i} onClick={() => navigate(`/decisions/${c.id}`)} className="w-full flex items-center justify-between hover:bg-muted/50 rounded p-1 -mx-1 transition-colors text-left">
                        <span className="text-xs truncate mr-2">{c.title}</span>
                        <span className="text-xs font-medium text-destructive shrink-0">{formatCost(c.cost)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ RISK OVERVIEW ═══ */}
        {!isLoading && risks.length > 0 && (() => {
          const openRisks = risks.filter((r: any) => r.status === "open" || r.status === "mitigating");
          const criticalRisks = openRisks.filter((r: any) => (r.risk_score ?? r.likelihood * r.impact) >= 16);
          const highRisks = openRisks.filter((r: any) => { const s = r.risk_score ?? r.likelihood * r.impact; return s >= 9 && s < 16; });
          const withMitigation = openRisks.filter((r: any) => r.mitigation_plan && r.mitigation_plan.trim().length > 0);
          const withoutMitigation = openRisks.filter((r: any) => !r.mitigation_plan || r.mitigation_plan.trim().length === 0);
          const avgScore = openRisks.length > 0 ? Math.round(openRisks.reduce((s: number, r: any) => s + (r.risk_score ?? r.likelihood * r.impact), 0) / openRisks.length * 10) / 10 : 0;

          return (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Risk Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total open */}
                <div className="border border-border rounded-lg p-4 cursor-pointer hover:border-foreground/20 transition-colors" onClick={() => navigate("/risks")}>
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Ø {avgScore}</span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">{openRisks.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Offene Risiken</p>
                </div>

                {/* Critical */}
                <div className="border border-border rounded-lg p-4 cursor-pointer hover:border-foreground/20 transition-colors" onClick={() => navigate("/risks")}>
                  <ShieldAlert className="w-4 h-4 text-destructive mb-2" />
                  <p className={`text-2xl font-semibold tracking-tight ${criticalRisks.length > 0 ? "text-destructive" : ""}`}>{criticalRisks.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kritische Risiken</p>
                </div>

                {/* High */}
                <div className="border border-border rounded-lg p-4 cursor-pointer hover:border-foreground/20 transition-colors" onClick={() => navigate("/risks")}>
                  <AlertTriangle className="w-4 h-4 text-warning mb-2" />
                  <p className={`text-2xl font-semibold tracking-tight ${highRisks.length > 0 ? "text-warning" : ""}`}>{highRisks.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Hohe Risiken</p>
                </div>

                {/* Without mitigation */}
                <div className="border border-border rounded-lg p-4 cursor-pointer hover:border-foreground/20 transition-colors" onClick={() => navigate("/risks")}>
                  <FileText className="w-4 h-4 text-muted-foreground mb-2" />
                  <p className="text-2xl font-semibold tracking-tight">{withoutMitigation.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ohne Mitigation</p>
                </div>
              </div>

              {/* Critical risks list */}
              {criticalRisks.length > 0 && (
                <div className="border border-destructive/20 rounded-lg p-4 mt-3">
                  <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Kritische Risiken – sofortige Aufmerksamkeit
                  </p>
                  <div className="space-y-1.5">
                    {criticalRisks.slice(0, 5).map((r: any) => (
                      <button key={r.id} onClick={() => navigate("/risks")} className="w-full flex items-center justify-between hover:bg-muted/50 rounded p-1.5 -mx-1.5 transition-colors text-left">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-destructive shrink-0 tabular-nums">{r.risk_score ?? r.likelihood * r.impact}</span>
                          <span className="text-xs truncate">{r.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!r.mitigation_plan && <Badge variant="outline" className="text-[10px] text-warning">Keine Mitigation</Badge>}
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* ═══ RECENT ═══ */}
        {!isLoading && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-5">
                <p className="text-sm font-medium mb-3">Zuletzt geöffnet</p>
                {computed.recentlyOpened.length > 0 ? (
                  <div className="space-y-1">
                    {computed.recentlyOpened.map(d => (
                      <button key={d.id} onClick={() => navigate(`/decisions/${d.id}`)} className="w-full flex items-center justify-between hover:bg-muted/50 rounded p-2 -mx-2 transition-colors text-left">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-normal">{statusLabels[d.status] || d.status}</Badge>
                          <span className="text-xs truncate">{d.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(d.updated_at), { locale: de, addSuffix: true })}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Keine kürzlich geöffneten Entscheidungen</p>
                )}
              </div>

              <div className="border border-border rounded-lg p-5">
                <p className="text-sm font-medium mb-3">Zuletzt eskaliert</p>
                {computed.recentlyEscalated.length > 0 ? (
                  <div className="space-y-1">
                    {computed.recentlyEscalated.map(d => (
                      <button key={d.id} onClick={() => navigate(`/decisions/${d.id}`)} className="w-full flex items-center justify-between hover:bg-muted/50 rounded p-2 -mx-2 transition-colors text-left">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0 font-normal">L{d.escalation_level}</Badge>
                          <span className="text-xs truncate">{d.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(d.last_escalated_at || d.updated_at), { locale: de, addSuffix: true })}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Keine kürzlichen Eskalationen</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
