import { useMemo, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight, BarChart3,
  Activity, DollarSign, Zap, FileText, Eye, TrendingUp, TrendingDown,
  Minus, ShieldAlert, CheckCircle2, Info, Command, ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHint from "@/components/shared/PageHint";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { format, differenceInDays, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const LeaderboardWidget = lazy(() => import("@/components/dashboard/LeaderboardWidget"));

type TimeRange = 7 | 30 | 90;

const Dashboard = () => {
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useReviews();
  const profileMap = buildProfileMap(profiles);
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const isPersonal = selectedTeamId === null;
  const currentTeam = teams.find((t: any) => t.id === selectedTeamId);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";

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
    const rangeStart = subDays(now, timeRange);
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1);
    const pendingReviews = reviews.filter(r => !r.reviewed_at && r.reviewer_id === user?.id);
    const openTasks = contextTasks.filter(t => t.status !== "done");

    // Oldest overdue
    const oldestOverdue = overdue.length > 0
      ? overdue.reduce((oldest, d) => new Date(d.due_date!) < new Date(oldest.due_date!) ? d : oldest)
      : null;
    const oldestOverdueDays = oldestOverdue ? differenceInDays(now, new Date(oldestOverdue.due_date!)) : 0;

    // Highest escalation
    const maxEscalation = escalated.length > 0
      ? Math.max(...escalated.map(d => d.escalation_level || 0))
      : 0;

    // KPIs
    const implemented = decisions.filter(d => d.status === "implemented");
    const completedInRange = [
      ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= rangeStart),
      ...contextTasks.filter(t => t.completed_at && new Date(t.completed_at) >= rangeStart),
    ].length;

    const velocities = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const avgDecisionTime = velocities.length > 0 ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10 : null;

    const escalationRate = decisions.length > 0 ? Math.round((escalated.length / decisions.length) * 100) : 0;

    // Performance index
    const completionRate = decisions.length > 0 ? (implemented.length / decisions.length) * 100 : 0;
    const taskDoneRate = contextTasks.length > 0 ? (contextTasks.filter(t => t.status === "done").length / contextTasks.length) * 100 : 0;
    const performanceIndex = Math.round((completionRate * 0.6 + taskDoneRate * 0.4));

    // KPI trends (compare current half vs previous half of range)
    const halfRange = Math.floor(timeRange / 2);
    const halfStart = subDays(now, halfRange);
    const prevHalfStart = subDays(now, timeRange);

    const openPrev = decisions.filter(d => {
      const c = new Date(d.created_at);
      return c >= prevHalfStart && c < halfStart && !["implemented", "rejected"].includes(d.status);
    }).length;
    const openCurr = decisions.filter(d => {
      const c = new Date(d.created_at);
      return c >= halfStart && !["implemented", "rejected"].includes(d.status);
    }).length;

    const completedCurr = [
      ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= halfStart),
      ...contextTasks.filter(t => t.completed_at && new Date(t.completed_at) >= halfStart),
    ].length;
    const completedPrev = [
      ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= prevHalfStart && new Date(d.implemented_at) < halfStart),
      ...contextTasks.filter(t => t.completed_at && new Date(t.completed_at) >= prevHalfStart && new Date(t.completed_at) < halfStart),
    ].length;

    const trend = (curr: number, prev: number): "up" | "down" | "neutral" => curr > prev ? "up" : curr < prev ? "down" : "neutral";

    // Trend data (8 weeks)
    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekLabel = format(weekEnd, "dd.MM", { locale: de });

      const completed = [
        ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd),
        ...contextTasks.filter(t => t.completed_at && new Date(t.completed_at) >= weekStart && new Date(t.completed_at) < weekEnd),
      ].length;

      const overdueAtEnd = decisions.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        const c = new Date(d.created_at);
        if (c > weekEnd || due > weekEnd) return false;
        if (d.implemented_at && new Date(d.implemented_at) <= weekEnd) return false;
        if (d.status === "rejected") return false;
        return true;
      }).length;

      // Avg time for decisions completed that week
      const completedDecs = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd);
      const avgTime = completedDecs.length > 0
        ? Math.round(completedDecs.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / completedDecs.length)
        : null;

      return { week: weekLabel, completed, overdue: overdueAtEnd, avgTime: avgTime ?? 0 };
    });

    // Economic impact
    const defaultRate = 75;
    const priorityMultiplier: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    let totalDelayCost = 0;
    const costItems: { title: string; cost: number; days: number; priority: string; id: string }[] = [];

    active.forEach(d => {
      const daysOpen = Math.max(0, differenceInDays(now, new Date(d.created_at)));
      const mult = priorityMultiplier[d.priority] || 1.5;
      const cost = Math.round(daysOpen * 2 * defaultRate * mult);
      totalDelayCost += cost;
      costItems.push({ title: d.title, cost, days: daysOpen, priority: d.priority, id: d.id });
    });
    costItems.sort((a, b) => b.cost - a.cost);

    const staleDecisions = active.filter(d => differenceInDays(now, new Date(d.created_at)) > 14);

    return {
      overdue, escalated, pendingReviews, active, openTasks,
      oldestOverdueDays, maxEscalation,
      openCount: active.length, completedInRange, avgDecisionTime, escalationRate, performanceIndex,
      openTrend: trend(openCurr, openPrev),
      completedTrend: trend(completedCurr, completedPrev),
      weekData, totalDelayCost, costItems, staleDecisions, implemented,
    };
  }, [decisions, contextTasks, reviews, user, timeRange]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  const priorityColors: Record<string, string> = {
    critical: "text-destructive", high: "text-warning", medium: "text-muted-foreground", low: "text-muted-foreground",
  };

  // ============ EMPTY STATE ============
  if (!loadingDec && !loadingTasks && allDecisions.length === 0 && tasks.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center max-w-lg">
            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Willkommen, {firstName}</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Dein Decision Intelligence System ist bereit. Erstelle deine erste Entscheidung, um KI-gestützte Analysen zu aktivieren.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Button size="lg" onClick={() => navigate("/decisions")} className="gap-2">
                <Plus className="w-4 h-4" /> Erste Entscheidung erstellen
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
  const actionCount = computed.overdue.length + computed.escalated.length + computed.pendingReviews.length;
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

  return (
    <AppLayout>
      {/* ═══ A) HEADER ROW ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">{dashboardTitle}</h1>
            <PageHint>Überblick über deinen Handlungsbedarf, KPIs, Trends und wirtschaftliche Auswirkungen offener Entscheidungen.</PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dein Entscheidungs-Cockpit: Was braucht heute deine Aufmerksamkeit?
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range Filter */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            {([7, 30, 90] as TimeRange[]).map(r => (
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
          <Button onClick={() => navigate("/decisions")} className="gap-2">
            <Plus className="w-4 h-4" /> Neue Entscheidung
          </Button>
        </div>
      </div>

      <div className="space-y-6">

        {/* ═══ B) BLOCK 1: ACTION REQUIRED ═══ */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Action Required</h2>
          {hasNoActions ? (
            <Card className="border-success/20 bg-success/[0.03]">
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-sm font-medium">Alles im grünen Bereich 🎉</p>
                <p className="text-xs text-muted-foreground mt-1">Keine überfälligen Entscheidungen, Eskalationen oder offene Reviews.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overdue Decisions */}
              <Card className={`border-destructive/20 ${computed.overdue.length > 0 ? "bg-destructive/[0.03]" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{computed.overdue.length}</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Overdue</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {computed.overdue.length > 0
                      ? `Älteste überfällig seit ${computed.oldestOverdueDays} Tagen`
                      : "Keine überfälligen Entscheidungen"
                    }
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => navigate("/decisions")}
                    disabled={computed.overdue.length === 0}
                  >
                    Review now <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>

              {/* Active Escalations */}
              <Card className={`border-warning/20 ${computed.escalated.length > 0 ? "bg-warning/[0.03]" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">{computed.escalated.length}</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Escalations</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {computed.escalated.length > 0
                      ? `Höchste Stufe: Level ${computed.maxEscalation}`
                      : "Keine aktiven Eskalationen"
                    }
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => navigate("/engine")}
                    disabled={computed.escalated.length === 0}
                  >
                    Open Escalation Center <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>

              {/* Pending Reviews */}
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
                  <p className="text-xs text-muted-foreground mb-4">
                    {computed.pendingReviews.length > 0
                      ? "Waiting on you"
                      : "Keine ausstehenden Reviews"
                    }
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => {
                      if (computed.pendingReviews.length > 0) navigate(`/decisions/${computed.pendingReviews[0].decision_id}`);
                    }}
                    disabled={computed.pendingReviews.length === 0}
                  >
                    Go to Reviews <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ═══ C) BLOCK 2: KPI SNAPSHOT ═══ */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">KPI Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: "Open Decisions", value: computed.openCount, icon: FileText,
                color: "text-primary", bg: "bg-primary/10",
                trend: computed.openTrend,
                tooltip: "Anzahl aktiver Entscheidungen (nicht implemented/rejected)",
              },
              {
                label: `Completed (${timeRange}d)`, value: computed.completedInRange, icon: CheckCircle2,
                color: "text-success", bg: "bg-success/10",
                trend: computed.completedTrend,
                tooltip: `Abgeschlossene Entscheidungen & Tasks der letzten ${timeRange} Tage`,
              },
              {
                label: "Avg. Decision Time", value: computed.avgDecisionTime != null ? `${computed.avgDecisionTime}d` : "—", icon: Zap,
                color: "text-primary", bg: "bg-primary/10",
                trend: "neutral" as const,
                tooltip: "Durchschnittliche Dauer von Erstellung bis Umsetzung (in Tagen)",
              },
              {
                label: "Escalation Rate", value: `${computed.escalationRate}%`, icon: AlertTriangle,
                color: computed.escalationRate > 15 ? "text-warning" : "text-muted-foreground",
                bg: computed.escalationRate > 15 ? "bg-warning/10" : "bg-muted/50",
                trend: "neutral" as const,
                tooltip: "Anteil eskalierter Entscheidungen an der Gesamtzahl",
              },
              {
                label: "Performance Index", value: `${computed.performanceIndex}%`, icon: Activity,
                color: computed.performanceIndex > 60 ? "text-success" : computed.performanceIndex > 30 ? "text-warning" : "text-destructive",
                bg: computed.performanceIndex > 60 ? "bg-success/10" : computed.performanceIndex > 30 ? "bg-warning/10" : "bg-destructive/10",
                trend: "neutral" as const,
                tooltip: "Gewichteter Index aus Decision Completion Rate (60%) und Task Done Rate (40%)",
              },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                        <KpiTooltip text={kpi.tooltip} />
                      </div>
                      <div className={`w-7 h-7 rounded-md ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      <TrendArrow direction={kpi.trend} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══ D) BLOCK 3: TRENDS ═══ */}
        <CollapsibleSection
          title="Trends"
          subtitle="Velocity · Delay"
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Velocity Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Velocity Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Completed decisions & tasks / week</p>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Area type="monotone" dataKey="completed" name="Abgeschlossen" stroke="hsl(var(--success, 142 71% 45%))" fill="url(#gradCompleted)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Delay Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Delay Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Überfällige Entscheidungen / Woche</p>
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
                      <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Area type="monotone" dataKey="overdue" name="Überfällig" stroke="hsl(var(--destructive))" fill="url(#gradOverdue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>

        {/* ═══ E) BLOCK 4: ECONOMIC IMPACT ═══ */}
        <CollapsibleSection
          title="Economic Impact"
          subtitle="Delay Costs · Missed Opportunities"
          icon={<DollarSign className="w-4 h-4 text-destructive" />}
        >
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Delay Cost */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Delay Costs</p>
                  <p className="text-3xl font-bold text-destructive">{formatCost(computed.totalDelayCost)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{computed.active.length} offene Entscheidungen</p>
                </div>

                {/* Missed Opportunities */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Missed Opportunities</p>
                  <p className="text-3xl font-bold text-warning">{computed.staleDecisions.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{">"} 14 Tage ohne Fortschritt</p>
                </div>

                {/* Top 3 Costly Delays */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Top 3 Costly Delays</p>
                  {computed.costItems.length > 0 ? (
                    <div className="space-y-2">
                      {computed.costItems.slice(0, 3).map((c, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(`/decisions/${c.id}`)}
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
            </CardContent>
          </Card>
        </CollapsibleSection>

        {/* ═══ F) BLOCK 5: LEADERBOARD (toggle) ═══ */}
        <CollapsibleSection
          title="Leaderboard"
          subtitle="Top Entscheider nach Impact"
          icon={<Activity className="w-4 h-4 text-primary" />}
          defaultOpen={false}
        >
          <WidgetErrorBoundary label="Leaderboard">
            <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
              <LeaderboardWidget />
            </Suspense>
          </WidgetErrorBoundary>
        </CollapsibleSection>

      </div>

      {/* ═══ STICKY QUICK ACTIONS FAB ═══ */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={() => navigate("/decisions")}
            >
              <FileText className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Neue Entscheidung</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={() => navigate("/tasks")}
            >
              <ListTodo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Neue Aufgabe</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
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
