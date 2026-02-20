import { useMemo, useState, useEffect, lazy, Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight, BarChart3,
  Activity, DollarSign, Zap, FileText, Eye, TrendingUp, TrendingDown,
  Minus, ShieldAlert, CheckCircle2, Info, Command, ListTodo,
  Link2, ChevronDown, ChevronRight, Users, ExternalLink, Bell,
  Download, CalendarIcon, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHint from "@/components/shared/PageHint";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useReviews, useFilteredDependencies } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { statusLabels, priorityLabels, categoryLabels } from "@/lib/labels";
import { format, differenceInDays, subDays, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, LineChart, Line,
} from "recharts";

const LeaderboardWidget = lazy(() => import("@/components/dashboard/LeaderboardWidget"));

type TimeRange = 7 | 30 | 90 | "custom";

// ─── Mini Sparkline SVG ───
const MiniSparkline = ({ data, color = "hsl(var(--primary))" }: { data: number[]; color?: string }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Skeleton Loader for KPIs ───
const KpiSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i}><CardContent className="p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-14" />
      </CardContent></Card>
    ))}
  </div>
);

// ─── Chart Shimmer ───
const ChartShimmer = ({ height = "h-48" }: { height?: string }) => (
  <Card><CardContent className={`${height} p-5`}>
    <Skeleton className="h-4 w-32 mb-2" />
    <Skeleton className="h-3 w-48 mb-4" />
    <div className="relative h-full animate-pulse bg-muted/20 rounded-lg" />
  </CardContent></Card>
);

const Dashboard = () => {
  const { data: allDecisions = [], isLoading: loadingDec, isError: errorDec, refetch: refetchDec } = useDecisions();
  const { data: profiles = [] } = useProfiles();
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

  // Keyboard shortcut: N → new decision
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

  // Effective days for range
  const effectiveDays = useMemo(() => {
    if (timeRange === "custom" && customRange.from && customRange.to) {
      return differenceInDays(customRange.to, customRange.from) || 1;
    }
    return timeRange === "custom" ? 30 : timeRange;
  }, [timeRange, customRange]);

  // Context filtering
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

    // Blocked tasks
    const openDecisionIds = new Set(active.map(d => d.id));
    const blockedTaskIds = new Set<string>();
    dependencies.forEach(dep => {
      if (dep.source_decision_id && openDecisionIds.has(dep.source_decision_id) && dep.target_task_id) {
        blockedTaskIds.add(dep.target_task_id);
      }
      if (dep.target_decision_id && openDecisionIds.has(dep.target_decision_id) && dep.source_task_id) {
        blockedTaskIds.add(dep.source_task_id);
      }
    });
    const blockedTasks = contextTasks.filter(t => blockedTaskIds.has(t.id) && t.status !== "done");

    // Oldest overdue
    const oldestOverdue = overdue.length > 0
      ? overdue.reduce((oldest, d) => new Date(d.due_date!) < new Date(oldest.due_date!) ? d : oldest)
      : null;
    const oldestOverdueDays = oldestOverdue ? differenceInDays(now, new Date(oldestOverdue.due_date!)) : 0;

    // Overdue delta vs last week
    const lastWeek = subDays(now, 7);
    const overdueLastWeek = decisions.filter(d => {
      if (["implemented", "rejected"].includes(d.status)) return false;
      if (!d.due_date) return false;
      const due = new Date(d.due_date);
      return due < lastWeek && new Date(d.created_at) <= lastWeek;
    }).length;
    const overdueDelta = overdue.length - overdueLastWeek;

    // Highest escalation
    const maxEscalation = escalated.length > 0
      ? Math.max(...escalated.map(d => d.escalation_level || 0))
      : 0;

    // KPIs
    const implemented = decisions.filter(d => d.status === "implemented");
    const completedInRange = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= rangeStart).length;

    const velocities = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const avgDecisionTime = velocities.length > 0 ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10 : null;

    const overdueRate = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;

    // Performance Index: 40% Speed + 30% SLA + 30% Completion
    const completionRate = decisions.length > 0 ? (implemented.length / decisions.length) * 100 : 0;
    const slaRate = active.length > 0 ? Math.max(0, 100 - (overdue.length / active.length) * 100) : 100;
    const speedScore = avgDecisionTime != null ? Math.max(0, Math.min(100, 100 - avgDecisionTime * 1.5)) : 50;
    const performanceIndex = Math.round(speedScore * 0.4 + slaRate * 0.3 + completionRate * 0.3);

    // KPI trends (half-period comparison)
    const halfRange = Math.floor(effectiveDays / 2);
    const halfStart = subDays(now, halfRange);
    const prevHalfStart = subDays(now, effectiveDays);

    const openPrev = decisions.filter(d => {
      const c = new Date(d.created_at);
      return c >= prevHalfStart && c < halfStart && !["implemented", "rejected"].includes(d.status);
    }).length;
    const openCurr = decisions.filter(d => {
      const c = new Date(d.created_at);
      return c >= halfStart && !["implemented", "rejected"].includes(d.status);
    }).length;

    const completedCurr = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= halfStart).length;
    const completedPrev = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= prevHalfStart && new Date(d.implemented_at) < halfStart).length;

    const trend = (curr: number, prev: number): "up" | "down" | "neutral" => curr > prev ? "up" : curr < prev ? "down" : "neutral";
    const delta = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? "+100%" : "—") : `${curr > prev ? "+" : ""}${Math.round(((curr - prev) / prev) * 100)}%`;

    // Trend data (8 weeks)
    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekLabel = format(weekEnd, "dd.MM", { locale: de });

      const completed = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd).length;
      const created = decisions.filter(d => new Date(d.created_at) >= weekStart && new Date(d.created_at) < weekEnd).length;

      const overdueAtEnd = decisions.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        const c = new Date(d.created_at);
        if (c > weekEnd || due > weekEnd) return false;
        if (d.implemented_at && new Date(d.implemented_at) <= weekEnd) return false;
        if (d.status === "rejected") return false;
        return true;
      }).length;

      const completedDecs = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd);
      const avgTime = completedDecs.length > 0
        ? Math.round(completedDecs.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / completedDecs.length)
        : null;

      const escalatedCount = decisions.filter(d => {
        if ((d.escalation_level || 0) < 1) return false;
        const c = new Date(d.created_at);
        return c <= weekEnd && (!d.implemented_at || new Date(d.implemented_at) > weekEnd);
      }).length;

      return { week: weekLabel, completed, created, overdue: overdueAtEnd, avgTime: avgTime ?? 0, escalated: escalatedCount };
    });

    // Sparkline data from weekData
    const sparkOpen = weekData.map((_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      return decisions.filter(d => {
        const c = new Date(d.created_at);
        return c <= weekEnd && !["implemented", "rejected"].includes(d.status);
      }).length;
    });
    const sparkCompleted = weekData.map(w => w.completed);
    const sparkOverdue = weekData.map(w => w.overdue);
    const sparkAvgTime = weekData.map(w => w.avgTime);

    // Economic impact
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

    // Cost breakdowns
    const costByCategory: Record<string, number> = {};
    const costByPriority: Record<string, number> = {};
    costItems.forEach(c => {
      costByCategory[c.category] = (costByCategory[c.category] || 0) + c.cost;
      costByPriority[c.priority] = (costByPriority[c.priority] || 0) + c.cost;
    });

    // Recently opened/escalated
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
      sparkOpen, sparkCompleted, sparkOverdue, sparkAvgTime,
    };
  }, [decisions, contextTasks, reviews, dependencies, user, effectiveDays, timeRange, customRange, currentTeam]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  const priorityColors: Record<string, string> = {
    critical: "text-destructive", high: "text-warning", medium: "text-muted-foreground", low: "text-muted-foreground",
  };

  // ============ ERROR STATE ============
  if (hasError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Daten konnten nicht geladen werden</h1>
          <p className="text-muted-foreground mb-6">Bitte versuche es erneut oder prüfe deine Verbindung.</p>
          <Button onClick={() => { refetchDec(); refetchTasks(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Erneut versuchen
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ============ EMPTY STATE ============
  if (!isLoading && allDecisions.length === 0 && tasks.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center max-w-lg">
            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Willkommen, {firstName}</h1>
            <p className="text-muted-foreground mb-4">
              Noch keine Entscheidungen. Starte mit deiner ersten Entscheidung.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Button size="lg" onClick={() => navigate("/decisions")} className="gap-2">
                <Plus className="w-4 h-4" /> Neue Entscheidung
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/teams")} className="gap-2">
                Team einrichten <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, title: "KI-Analyse", desc: "Automatische Risikobewertung" },
                { icon: BarChart3, title: "Echtzeit", desc: "Live-Metriken & Trends" },
                { icon: TrendingUp, title: "Prognosen", desc: "Prädiktive Szenarien" },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                  <Card className="text-left">
                    <CardContent className="p-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <f.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const dashboardTitle = isPersonal ? "Mein Arbeitsbereich" : `Team: ${currentTeam?.name || "—"}`;
  const actionCount = computed.overdue.length + computed.escalated.length + computed.pendingReviews.length + computed.blockedTasks.length;
  const hasNoActions = actionCount === 0;

  const KpiTooltip = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3 h-3 text-muted-foreground/40 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );

  const TrendArrow = ({ direction }: { direction: "up" | "down" | "neutral" }) => {
    if (direction === "up") return <TrendingUp className="w-3.5 h-3.5 text-success" />;
    if (direction === "down") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const toggleExpand = (key: string) => setExpandedAction(prev => prev === key ? null : key);

  const ActionItem = ({ title, badge, badgeVariant, dueText, onOpen, onPing, onEscalate }: {
    title: string; badge: string; badgeVariant?: "destructive" | "default" | "secondary" | "outline";
    dueText: string; onOpen: () => void; onPing?: () => void; onEscalate?: () => void;
  }) => (
    <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/40 transition-colors group">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs truncate font-medium">{title}</span>
        <Badge variant={badgeVariant || "outline"} className="text-[10px] px-1.5 py-0 shrink-0">{badge}</Badge>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{dueText}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onOpen}>
          <ExternalLink className="w-3 h-3" />
        </Button>
        {onPing && (
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onPing}>
            <Bell className="w-3 h-3" />
          </Button>
        )}
        {onEscalate && (
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onEscalate}>
            <ShieldAlert className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );

  const chartTooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" };

  return (
    <AppLayout>
      {/* ═══ A) TOP BAR (Sticky) ═══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-6 px-6 py-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">{dashboardTitle}</h1>
              <PageHint>
                <p className="font-semibold mb-2">❓ Dashboard-Hilfe</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-medium">Was ist eine Eskalation?</p>
                    <p>Eine Eskalation tritt ein, wenn eine Entscheidung die SLA-Zeitgrenzen überschreitet. Stufe 1–3 signalisieren zunehmende Dringlichkeit.</p>
                  </div>
                  <div>
                    <p className="font-medium">Wie werden Kosten berechnet?</p>
                    <p>Delay Cost = Tage offen × 2 Personen × Stundensatz × Prioritäts-Multiplikator (Critical: 4×, High: 2.5×, Medium: 1.5×, Low: 1×)</p>
                  </div>
                  <div>
                    <p className="font-medium">Performance Index</p>
                    <p>Gewichtete Metrik: 40% Geschwindigkeit + 30% SLA-Einhaltung + 30% Abschlussquote</p>
                  </div>
                  <div>
                    <p className="font-medium">Wie kann ich Performance verbessern?</p>
                    <p>Überfällige Entscheidungen priorisieren, Avg. Decision Time reduzieren, offene Reviews zeitnah abschließen.</p>
                  </div>
                </div>
              </PageHint>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Dein Entscheidungs-Cockpit: Was braucht heute deine Aufmerksamkeit?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Filter */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                  {([7, 30, 90] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        timeRange === r
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </TooltipTrigger>
              <TooltipContent>Zeitraum beeinflusst KPI-Berechnungen</TooltipContent>
            </Tooltip>

            {/* Custom Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={timeRange === "custom" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  <CalendarIcon className="w-3 h-3" />
                  {timeRange === "custom" && customRange.from && customRange.to
                    ? `${format(customRange.from, "dd.MM")} – ${format(customRange.to, "dd.MM")}`
                    : "Custom"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange.from && customRange.to ? { from: customRange.from, to: customRange.to } : undefined}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setCustomRange({ from: range.from, to: range.to });
                      setTimeRange("custom");
                    }
                  }}
                  numberOfMonths={1}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Snapshot Export */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.print()}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Snapshot exportieren (PDF/PNG)</TooltipContent>
            </Tooltip>

            <Button onClick={() => navigate("/decisions")} className="gap-2">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Neue Entscheidung</span><span className="sm:hidden">Neu</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ═══ B) ACTION REQUIRED ═══ */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Action Required</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5 space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent></Card>
              ))}
            </div>
          ) : hasNoActions ? (
            <Card className="border-success/20 bg-success/[0.03]">
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-sm font-medium">Alles im grünen Bereich 🎉</p>
                <p className="text-xs text-muted-foreground mt-1">Keine überfälligen Entscheidungen, Eskalationen, Reviews oder blockierten Tasks.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Overdue Decisions */}
              <Card className={`border-destructive/20 ${computed.overdue.length > 0 ? "bg-destructive/[0.03]" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-destructive">{computed.overdue.length}</p>
                        {computed.overdueDelta !== 0 && (
                          <Badge variant={computed.overdueDelta > 0 ? "destructive" : "default"} className="text-[9px] px-1 py-0">
                            {computed.overdueDelta > 0 ? "+" : ""}{computed.overdueDelta} vs 7d
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Overdue</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {computed.overdue.length > 0
                      ? `Älteste überfällig seit ${computed.oldestOverdueDays} Tagen`
                      : "Keine überfälligen Entscheidungen"
                    }
                  </p>
                  {computed.overdue.length > 0 && (
                    <>
                      <button onClick={() => toggleExpand("overdue")} className="text-[11px] text-primary flex items-center gap-1 mb-2 hover:underline">
                        {expandedAction === "overdue" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Details ({computed.overdue.length})
                      </button>
                      {expandedAction === "overdue" && (
                        <div className="space-y-0.5 mb-3 max-h-40 overflow-y-auto">
                          {computed.overdue.slice(0, 5).map(d => (
                            <ActionItem
                              key={d.id} title={d.title} badge="Overdue" badgeVariant="destructive"
                              dueText={`${differenceInDays(new Date(), new Date(d.due_date!))}d over`}
                              onOpen={() => navigate(`/decisions/${d.id}`)} onEscalate={() => navigate("/engine")}
                            />
                          ))}
                          {computed.overdue.length > 5 && (
                            <button onClick={() => navigate("/decisions")} className="text-[10px] text-primary hover:underline mt-1">
                              Alle anzeigen →
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => navigate("/decisions")} disabled={computed.overdue.length === 0}>
                    Review now <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>

              {/* 2. Active Escalations */}
              <Card className={`border-warning/20 ${computed.escalated.length > 0 ? "bg-warning/[0.03]" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-warning">{computed.escalated.length}</p>
                        {computed.maxEscalation > 0 && (
                          <Badge className="text-[9px] px-1 py-0 bg-warning/20 text-warning border-warning/30">Stufe {computed.maxEscalation}</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Escalations</p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground mb-3 cursor-help">
                        {computed.escalated.length > 0 ? `Höchste Stufe: Level ${computed.maxEscalation}` : "Keine aktiven Eskalationen"}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-xs">Eskalation bedeutet: SLA wurde verletzt. Stufe 1–3 zeigen zunehmende Dringlichkeit.</TooltipContent>
                  </Tooltip>
                  {computed.escalated.length > 0 && (
                    <>
                      <button onClick={() => toggleExpand("escalated")} className="text-[11px] text-primary flex items-center gap-1 mb-2 hover:underline">
                        {expandedAction === "escalated" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Details ({computed.escalated.length})
                      </button>
                      {expandedAction === "escalated" && (
                        <div className="space-y-0.5 mb-3 max-h-40 overflow-y-auto">
                          {computed.escalated.slice(0, 5).map(d => (
                            <ActionItem
                              key={d.id} title={d.title} badge={`L${d.escalation_level}`} badgeVariant="default"
                              dueText={d.due_date ? `Due ${format(new Date(d.due_date), "dd.MM", { locale: de })}` : "—"}
                              onOpen={() => navigate(`/decisions/${d.id}`)} onEscalate={() => navigate("/engine")}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => navigate("/engine")} disabled={computed.escalated.length === 0}>
                    Open Escalation Center <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>

              {/* 3. Pending Reviews */}
              <Card className={`border-primary/20 ${computed.pendingReviews.length > 0 ? "bg-primary/[0.03]" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{computed.pendingReviews.length}</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Reviews</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {computed.pendingReviews.length > 0 ? "Waiting on you" : "Keine ausstehenden Reviews"}
                  </p>
                  {computed.pendingReviews.length > 0 && (
                    <>
                      <button onClick={() => toggleExpand("reviews")} className="text-[11px] text-primary flex items-center gap-1 mb-2 hover:underline">
                        {expandedAction === "reviews" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Details ({computed.pendingReviews.length})
                      </button>
                      {expandedAction === "reviews" && (
                        <div className="space-y-0.5 mb-3 max-h-40 overflow-y-auto">
                          {computed.pendingReviews.slice(0, 5).map(r => (
                            <ActionItem
                              key={r.id} title={`Review Step ${r.step_order}`} badge="Review" badgeVariant="secondary"
                              dueText={formatDistanceToNow(new Date(r.created_at), { locale: de, addSuffix: true })}
                              onOpen={() => navigate(`/decisions/${r.decision_id}`)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => {
                    if (computed.pendingReviews.length > 0) navigate(`/decisions/${computed.pendingReviews[0].decision_id}`);
                  }} disabled={computed.pendingReviews.length === 0}>
                    Review starten <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>

              {/* 4. Blocked Tasks */}
              <Card className={`border-muted-foreground/20 ${computed.blockedTasks.length > 0 ? "bg-muted/[0.03]" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{computed.blockedTasks.length}</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Blocked Tasks</p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground mb-3 cursor-help">
                        {computed.blockedTasks.length > 0 ? "Tasks warten auf Entscheidungen" : "Keine blockierten Tasks"}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-xs">Task ist blockiert durch eine offene Entscheidung (via Abhängigkeit verknüpft).</TooltipContent>
                  </Tooltip>
                  {computed.blockedTasks.length > 0 && (
                    <>
                      <button onClick={() => toggleExpand("blocked")} className="text-[11px] text-primary flex items-center gap-1 mb-2 hover:underline">
                        {expandedAction === "blocked" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Details ({computed.blockedTasks.length})
                      </button>
                      {expandedAction === "blocked" && (
                        <div className="space-y-0.5 mb-3 max-h-40 overflow-y-auto">
                          {computed.blockedTasks.slice(0, 5).map(t => (
                            <ActionItem
                              key={t.id} title={t.title} badge="Blocked" badgeVariant="outline"
                              dueText={t.due_date ? format(new Date(t.due_date), "dd.MM", { locale: de }) : "—"}
                              onOpen={() => navigate("/tasks")}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => navigate("/tasks")} disabled={computed.blockedTasks.length === 0}>
                    Tasks anzeigen <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ═══ C) KPI SNAPSHOT (5 cards) ═══ */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">KPI Snapshot</h2>
          {isLoading ? <KpiSkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  label: "Open Decisions", value: computed.openCount, icon: FileText,
                  color: "text-primary", bg: "bg-primary/10", trend: computed.openTrend, delta: computed.openDelta,
                  tooltip: "Status ≠ Implemented / Rejected",
                  sparkline: computed.sparkOpen, sparkColor: "hsl(var(--primary))",
                  link: "/analytics",
                },
                {
                  label: "Avg. Decision Time", value: computed.avgDecisionTime != null ? `${computed.avgDecisionTime}d` : "—", icon: Zap,
                  color: "text-primary", bg: "bg-primary/10", trend: "neutral" as const, delta: "—",
                  tooltip: "Berechnet für abgeschlossene Entscheidungen im gewählten Zeitraum: (Approved Date – Created Date) Durchschnitt",
                  sparkline: computed.sparkAvgTime, sparkColor: "hsl(var(--primary))",
                  link: "/analytics",
                },
                {
                  label: "Overdue Rate", value: `${computed.overdueRate}%`, icon: Clock,
                  color: computed.overdueRate > 20 ? "text-destructive" : "text-muted-foreground",
                  bg: computed.overdueRate > 20 ? "bg-destructive/10" : "bg-muted/50",
                  trend: "neutral" as const, delta: "—",
                  tooltip: "Overdue / Open Decisions",
                  sparkline: computed.sparkOverdue, sparkColor: "hsl(var(--destructive))",
                  link: "/analytics",
                },
                {
                  label: "Performance Index", value: `${computed.performanceIndex}%`, icon: Activity,
                  color: computed.performanceIndex > 60 ? "text-success" : computed.performanceIndex > 30 ? "text-warning" : "text-destructive",
                  bg: computed.performanceIndex > 60 ? "bg-success/10" : computed.performanceIndex > 30 ? "bg-warning/10" : "bg-destructive/10",
                  trend: "neutral" as const, delta: "—",
                  tooltip: "Gewichtete Metrik: 40% Geschwindigkeit + 30% SLA-Einhaltung + 30% Abschlussquote",
                  sparkline: computed.sparkCompleted, sparkColor: "hsl(var(--success, 142 71% 45%))",
                  link: "/analytics",
                },
                {
                  label: "Decision Cost", value: formatCost(computed.totalDelayCost), icon: DollarSign,
                  color: "text-destructive", bg: "bg-destructive/10",
                  trend: "neutral" as const, delta: "—",
                  tooltip: "Summe geschätzter Delay-Kosten basierend auf hinterlegten Impact-Werten",
                  sparkline: [], sparkColor: "hsl(var(--destructive))",
                  link: "/analytics",
                },
              ].map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="h-full cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(kpi.link)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">{kpi.label}</span>
                          <KpiTooltip text={kpi.tooltip} />
                        </div>
                        <div className={`w-7 h-7 rounded-md ${kpi.bg} flex items-center justify-center`}>
                          <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                        </div>
                      </div>
                      <div className="flex items-end justify-between mb-1">
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        <div className="flex items-center gap-1">
                          {kpi.delta !== "—" && <span className="text-[10px] text-muted-foreground">{kpi.delta}</span>}
                          <TrendArrow direction={kpi.trend} />
                        </div>
                      </div>
                      {kpi.sparkline.length > 1 && (
                        <MiniSparkline data={kpi.sparkline} color={kpi.sparkColor} />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ D) TREND SECTION ═══ */}
        <CollapsibleSection
          title="Performance & Trends"
          subtitle="Velocity · Duration · Escalation"
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartShimmer />
              <ChartShimmer />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart 1: Decisions per Week */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Decisions per Week</CardTitle>
                      <p className="text-xs text-muted-foreground">Hover zeigt Anzahl</p>
                    </div>
                    <div className="flex items-center rounded-md border border-border p-0.5">
                      {(["completed", "created"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setVelocityToggle(t)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            velocityToggle === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                          }`}
                        >
                          {t === "completed" ? "Completed" : "Created"}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="gradVelocity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={velocityToggle === "completed" ? "hsl(var(--success, 142 71% 45%))" : "hsl(var(--primary))"} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={velocityToggle === "completed" ? "hsl(var(--success, 142 71% 45%))" : "hsl(var(--primary))"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey={velocityToggle}
                          name={velocityToggle === "completed" ? "Abgeschlossen" : "Erstellt"}
                          stroke={velocityToggle === "completed" ? "hsl(var(--success, 142 71% 45%))" : "hsl(var(--primary))"}
                          fill="url(#gradVelocity)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: Avg Duration Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Duration Trend</CardTitle>
                  <p className="text-xs text-muted-foreground">Avg. Bearbeitungszeit & Overdue / Woche</p>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Area type="monotone" dataKey="overdue" name="Überfällig" stroke="hsl(var(--destructive))" fill="url(#gradOverdue)" strokeWidth={2} />
                        <Area type="monotone" dataKey="avgTime" name="Avg. Tage" stroke="hsl(var(--primary))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 3: Escalation Trend */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Escalation Trend</CardTitle>
                  <p className="text-xs text-muted-foreground">Aktive Eskalationen / Woche</p>
                </CardHeader>
                <CardContent>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="escalated" name="Eskalationen" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CollapsibleSection>

        {/* ═══ E) ECONOMIC IMPACT PANEL ═══ */}
        <CollapsibleSection
          title="Economic Impact"
          subtitle="Delay Costs · Missed Opportunities · Breakdown"
          icon={<DollarSign className="w-4 h-4 text-destructive" />}
        >
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Delay Cost</p>
                  <p className="text-3xl font-bold text-destructive">{formatCost(computed.totalDelayCost)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{computed.active.length} offene Entscheidungen</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Missed Opportunities</p>
                  <p className="text-3xl font-bold text-warning">{computed.staleDecisions.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{">"} 14 Tage ohne Fortschritt</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Top 3 teuerste Entscheidungen</p>
                  {computed.costItems.length > 0 ? (
                    <div className="space-y-2">
                      {computed.costItems.slice(0, 3).map((c, i) => (
                        <button
                          key={i} onClick={() => navigate(`/decisions/${c.id}`)}
                          className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className={`w-3 h-3 shrink-0 ${priorityColors[c.priority]}`} />
                            <span className="text-xs truncate">{c.title}</span>
                          </div>
                          <span className="text-xs font-bold text-destructive shrink-0 ml-2">{formatCost(c.cost)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Keine offenen Entscheidungen</p>
                  )}
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t border-border pt-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">Breakdown</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">Nach Kategorie</p>
                    <div className="space-y-1.5">
                      {Object.entries(computed.costByCategory).sort(([,a],[,b]) => b - a).slice(0, 4).map(([cat, cost]) => (
                        <div key={cat} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{categoryLabels[cat] || cat}</span>
                          <span className="font-medium">{formatCost(cost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">Nach Priorität</p>
                    <div className="space-y-1.5">
                      {Object.entries(computed.costByPriority).sort(([,a],[,b]) => b - a).map(([prio, cost]) => (
                        <div key={prio} className="flex items-center justify-between text-xs">
                          <span className={priorityColors[prio]}>{priorityLabels[prio] || prio}</span>
                          <span className="font-medium">{formatCost(cost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!isPersonal && teams.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-2">Nach Team</p>
                      <div className="space-y-1.5">
                        {(() => {
                          const costByTeam: Record<string, number> = {};
                          computed.costItems.forEach(c => {
                            const teamName = teams.find((t: any) => t.id === c.team_id)?.name || "Persönlich";
                            costByTeam[teamName] = (costByTeam[teamName] || 0) + c.cost;
                          });
                          return Object.entries(costByTeam).sort(([,a],[,b]) => b - a).slice(0, 4).map(([name, cost]) => (
                            <div key={name} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{name}</span>
                              <span className="font-medium">{formatCost(cost)}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="border-t border-border pt-4 mt-4">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/analytics")}>
                  Top Cost Drivers anzeigen <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>

        {/* ═══ F) LEADERBOARD (optional) ═══ */}
        <CollapsibleSection
          title="Leaderboard"
          subtitle="Top Decision Closers · Best On-Time Rate"
          icon={<Users className="w-4 h-4 text-primary" />}
          defaultOpen={false}
        >
          <WidgetErrorBoundary label="Leaderboard">
            <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
              <LeaderboardWidget />
            </Suspense>
          </WidgetErrorBoundary>
        </CollapsibleSection>

        {/* ═══ G) FOOTER: UTILITIES ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Zuletzt geöffnet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {computed.recentlyOpened.length > 0 ? (
                <div className="space-y-2">
                  {computed.recentlyOpened.map(d => (
                    <button
                      key={d.id} onClick={() => navigate(`/decisions/${d.id}`)}
                      className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{statusLabels[d.status] || d.status}</Badge>
                        <span className="text-xs truncate">{d.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(new Date(d.updated_at), { locale: de, addSuffix: true })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Keine kürzlich geöffneten Entscheidungen</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-warning" />
                Zuletzt eskaliert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {computed.recentlyEscalated.length > 0 ? (
                <div className="space-y-2">
                  {computed.recentlyEscalated.map(d => (
                    <button
                      key={d.id} onClick={() => navigate(`/decisions/${d.id}`)}
                      className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">L{d.escalation_level}</Badge>
                        <span className="text-xs truncate">{d.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(new Date(d.last_escalated_at || d.updated_at), { locale: de, addSuffix: true })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Keine kürzlichen Eskalationen</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ STICKY QUICK ACTIONS FAB ═══ */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 print:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" className="h-10 w-10 rounded-full shadow-lg" onClick={() => navigate("/decisions")}>
              <FileText className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Neue Entscheidung (N)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shadow-lg" onClick={() => navigate("/tasks")}>
              <ListTodo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Neue Aufgabe</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon" variant="outline"
              className="h-10 w-10 rounded-full shadow-lg bg-background"
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                document.dispatchEvent(event);
              }}
            >
              <Command className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Command Palette (⌘K)</TooltipContent>
        </Tooltip>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
