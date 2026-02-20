import { useState, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, CheckCircle2, ArrowRight, BarChart3,
  Activity, DollarSign, Zap, FileText, Bell, Eye, TrendingUp, TrendingDown,
  Minus, ListChecks, Circle, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { categoryLabels } from "@/lib/labels";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

// Lazy-loaded heavy widgets
const MomentumScoreWidget = lazy(() => import("@/components/dashboard/MomentumScoreWidget"));
const LeaderboardWidget = lazy(() => import("@/components/dashboard/LeaderboardWidget"));

const statusLabels: Record<string, string> = {
  draft: "Entwurf", review: "Review", approved: "Genehmigt",
  implemented: "Umgesetzt", rejected: "Abgelehnt",
};

const priorityLabels: Record<string, string> = {
  low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch",
};

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

  // === COMPUTED DATA ===
  const computed = useMemo(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1);
    const pendingReviews = reviews.filter(r => !r.reviewed_at && r.reviewer_id === user?.id);
    const highRisk = active.filter(d => (d.ai_risk_score || 0) > 60);

    // KPIs
    const implemented = decisions.filter(d => d.status === "implemented");
    const openCount = active.length;
    const overduePercent = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;

    const velocities = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const avgDecisionTime = velocities.length > 0 ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10 : null;

    const escalationRate = decisions.length > 0 ? Math.round((escalated.length / decisions.length) * 100) : 0;

    // Performance index (simplified momentum)
    const completionRate = decisions.length > 0 ? (implemented.length / decisions.length) * 100 : 0;
    const taskDoneRate = contextTasks.length > 0 ? (contextTasks.filter(t => t.status === "done").length / contextTasks.length) * 100 : 0;
    const performanceIndex = Math.round((completionRate * 0.6 + taskDoneRate * 0.4));

    // Trend data (last 8 weeks)
    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekLabel = format(weekEnd, "dd.MM", { locale: de });

      const created = decisions.filter(d => {
        const date = new Date(d.created_at);
        return date >= weekStart && date < weekEnd;
      }).length;

      const completed = [
        ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd),
        ...contextTasks.filter(t => t.completed_at && new Date(t.completed_at) >= weekStart && new Date(t.completed_at) < weekEnd),
      ].length;

      const openAtEnd = decisions.filter(d => {
        const c = new Date(d.created_at);
        if (c > weekEnd) return false;
        if (d.implemented_at && new Date(d.implemented_at) <= weekEnd) return false;
        if (d.status === "rejected") return false;
        return true;
      }).length;

      return { week: weekLabel, erstellt: created, abgeschlossen: completed, offen: openAtEnd };
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

    return {
      overdue, escalated, pendingReviews, highRisk, active,
      openCount, overduePercent, avgDecisionTime, escalationRate, performanceIndex,
      weekData, totalDelayCost, costItems,
    };
  }, [decisions, contextTasks, reviews, user]);

  const actionItems = computed.overdue.length + computed.escalated.length + computed.pendingReviews.length + computed.highRisk.length;

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

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

  return (
    <AppLayout>
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{dashboardTitle}</h1>
            <PageHint>Operatives Steuerpanel – Handlungsbedarf zuerst, dann KPIs und Trends.</PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isPersonal ? `Hallo ${firstName} – das liegt heute an` : `${decisions.length} Entscheidungen · ${contextTasks.filter(t => t.status !== "done").length} offene Aufgaben`}
          </p>
        </div>
        <Button onClick={() => navigate("/decisions")} className="gap-2">
          <Plus className="w-4 h-4" /> Neue Entscheidung
        </Button>
      </div>

      {/* ═══ BLOCK 1: ACTION REQUIRED ═══ */}
      {actionItems > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <h2 className="text-sm font-semibold">Handlungsbedarf ({actionItems})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Overdue Decisions */}
            {computed.overdue.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/[0.02] cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => navigate("/decisions")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">Überfällig</span>
                    <Badge variant="destructive" className="ml-auto text-[10px]">{computed.overdue.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {computed.overdue.slice(0, 2).map(d => (
                      <p key={d.id} className="text-xs truncate text-muted-foreground">{d.title}</p>
                    ))}
                    {computed.overdue.length > 2 && <p className="text-[10px] text-destructive">+{computed.overdue.length - 2} weitere</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Escalations */}
            {computed.escalated.length > 0 && (
              <Card className="border-warning/20 bg-warning/[0.02] cursor-pointer hover:border-warning/40 transition-colors" onClick={() => navigate("/escalation")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-warning" />
                    <span className="text-xs font-semibold text-warning">Eskalationen</span>
                    <Badge className="ml-auto text-[10px] bg-warning/10 text-warning border-warning/20">{computed.escalated.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {computed.escalated.slice(0, 2).map(d => (
                      <p key={d.id} className="text-xs truncate text-muted-foreground">{d.title}</p>
                    ))}
                    {computed.escalated.length > 2 && <p className="text-[10px] text-warning">+{computed.escalated.length - 2} weitere</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Reviews */}
            {computed.pendingReviews.length > 0 && (
              <Card className="border-primary/20 bg-primary/[0.02] cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/decisions")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">Reviews warten</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">{computed.pendingReviews.length}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{computed.pendingReviews.length} Review{computed.pendingReviews.length !== 1 ? "s" : ""} benötigen dein Feedback</p>
                </CardContent>
              </Card>
            )}

            {/* High Risk */}
            {computed.highRisk.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/[0.02] cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => navigate(`/decisions/${computed.highRisk[0].id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">Hohes Risiko</span>
                    <Badge variant="destructive" className="ml-auto text-[10px]">{computed.highRisk.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {computed.highRisk.slice(0, 2).map(d => (
                      <div key={d.id} className="flex items-center justify-between">
                        <p className="text-xs truncate text-muted-foreground flex-1 mr-2">{d.title}</p>
                        <span className="text-[10px] font-mono text-destructive">{d.ai_risk_score}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ BLOCK 2: KPI SNAPSHOT ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Offen", value: computed.openCount, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          { label: "Überfällig", value: `${computed.overduePercent}%`, icon: AlertTriangle, color: computed.overduePercent > 20 ? "text-destructive" : "text-muted-foreground", bg: computed.overduePercent > 20 ? "bg-destructive/10" : "bg-muted/50" },
          { label: "Ø Tage", value: computed.avgDecisionTime ?? "—", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
          { label: "Eskalationsrate", value: `${computed.escalationRate}%`, icon: Bell, color: computed.escalationRate > 15 ? "text-warning" : "text-muted-foreground", bg: computed.escalationRate > 15 ? "bg-warning/10" : "bg-muted/50" },
          { label: "Performance", value: `${computed.performanceIndex}%`, icon: Activity, color: computed.performanceIndex > 60 ? "text-success" : computed.performanceIndex > 30 ? "text-warning" : "text-destructive", bg: computed.performanceIndex > 60 ? "bg-success/10" : computed.performanceIndex > 30 ? "bg-warning/10" : "bg-destructive/10" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  <div className={`w-7 h-7 rounded-md ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══ BLOCK 3: TREND ═══ */}
      <CollapsibleSection
        title="Trend"
        subtitle="Throughput & Velocity (8 Wochen)"
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        defaultOpen={true}
        className="mb-8"
      >
        <Card>
          <CardContent className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={computed.weekData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="abgeschlossen" name="Abgeschlossen" stroke="hsl(var(--success))" fill="url(#gradCompleted)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="erstellt" name="Erstellt" stroke="hsl(var(--primary))" fill="url(#gradCreated)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="offen" name="Offen" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded bg-success" />
                <span className="text-[11px] text-muted-foreground">Abgeschlossen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded bg-primary" />
                <span className="text-[11px] text-muted-foreground">Erstellt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded bg-muted-foreground" style={{ borderTop: "1px dashed" }} />
                <span className="text-[11px] text-muted-foreground">Offen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* ═══ BLOCK 4: ECONOMIC IMPACT ═══ */}
      <CollapsibleSection
        title="Economic Impact"
        subtitle="Geschätzte Verzögerungskosten"
        icon={<DollarSign className="w-4 h-4 text-destructive" />}
        defaultOpen={true}
        className="mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Total cost */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gesamte Verzögerungskosten</p>
              <p className="text-3xl font-bold text-destructive">{formatCost(computed.totalDelayCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">{computed.active.length} offene Entscheidungen</p>
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Kritisch / Hoch</span>
                  <span className="font-semibold text-destructive">{computed.costItems.filter(c => c.priority === "critical" || c.priority === "high").length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ø Tage offen</span>
                  <span className="font-semibold">
                    {computed.costItems.length > 0 ? Math.round(computed.costItems.reduce((s, c) => s + c.days, 0) / computed.costItems.length) : 0}d
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top cost drivers */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Größte Kostentreiber</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {computed.costItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Keine offenen Entscheidungen.</p>
              ) : (
                <div className="space-y-2.5">
                  {computed.costItems.slice(0, 5).map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/decisions/${item.id}`)}
                    >
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">{item.days}d offen · {priorityLabels[item.priority] || item.priority}</p>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0">{formatCost(item.cost)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* ═══ OPTIONAL: DEEP METRICS (lazy) ═══ */}
      <CollapsibleSection
        title={isPersonal ? "Meine Performance" : "Team Performance"}
        subtitle="Momentum Score & Leaderboard"
        icon={<Activity className="w-4 h-4 text-primary" />}
        defaultOpen={false}
        className="mb-8"
      >
        <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WidgetErrorBoundary label="Momentum" compact><MomentumScoreWidget /></WidgetErrorBoundary>
            <WidgetErrorBoundary label="Leaderboard" compact><LeaderboardWidget /></WidgetErrorBoundary>
          </div>
        </Suspense>
      </CollapsibleSection>

    </AppLayout>
  );
};

export default Dashboard;
