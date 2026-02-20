import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight, BarChart3,
  Activity, DollarSign, Zap, FileText, Bell, Eye, TrendingUp, TrendingDown,
  Minus, ShieldAlert, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// Removed: MomentumScoreWidget and LeaderboardWidget (not in dashboard spec)

const priorityColors: Record<string, string> = {
  critical: "text-destructive",
  high: "text-warning",
  medium: "text-muted-foreground",
  low: "text-muted-foreground",
};

const priorityBadge: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "bg-muted text-muted-foreground",
  low: "bg-muted text-muted-foreground",
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

  // === ALL COMPUTED DATA ===
  const computed = useMemo(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1);
    const pendingReviews = reviews.filter(r => !r.reviewed_at && r.reviewer_id === user?.id);
    const highRisk = active.filter(d => (d.ai_risk_score || 0) > 60);
    const overdueTasks = contextTasks.filter(t => t.status !== "done" && t.due_date && new Date(t.due_date) < now);

    // KPIs
    const implemented = decisions.filter(d => d.status === "implemented");
    const openCount = active.length;
    const overduePercent = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;

    const velocities = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const avgDecisionTime = velocities.length > 0 ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10 : null;

    const escalationRate = decisions.length > 0 ? Math.round((escalated.length / decisions.length) * 100) : 0;

    // Performance index
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

      const overdueAtEnd = decisions.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        const c = new Date(d.created_at);
        if (c > weekEnd || due > weekEnd) return false;
        if (d.implemented_at && new Date(d.implemented_at) <= weekEnd) return false;
        if (d.status === "rejected") return false;
        return true;
      }).length;

      return { week: weekLabel, erstellt: created, abgeschlossen: completed, überfällig: overdueAtEnd };
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

    // Missed opportunity: decisions in review/draft > 14 days
    const staleDecisions = active.filter(d => differenceInDays(now, new Date(d.created_at)) > 14);

    return {
      overdue, escalated, pendingReviews, highRisk, active, overdueTasks,
      openCount, overduePercent, avgDecisionTime, escalationRate, performanceIndex,
      weekData, totalDelayCost, costItems, staleDecisions, implemented,
    };
  }, [decisions, contextTasks, reviews, user]);

  const actionCount = computed.overdue.length + computed.escalated.length + computed.pendingReviews.length + computed.overdueTasks.length;

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

      <div className="space-y-6">

        {/* ═══ BLOCK 1: ACTION REQUIRED ═══ */}
        {actionCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-destructive/20 bg-destructive/[0.02]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm">Handlungsbedarf</CardTitle>
                    <p className="text-xs text-muted-foreground">{actionCount} {actionCount === 1 ? "Punkt erfordert" : "Punkte erfordern"} deine Aufmerksamkeit</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">{actionCount}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Overdue Decisions */}
                {computed.overdue.map(d => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/decisions/${d.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">Überfällig seit {differenceInDays(new Date(), new Date(d.due_date!))}d</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityBadge[d.priority]}`}>
                      {d.priority}
                    </Badge>
                  </button>
                ))}

                {/* Escalations */}
                {computed.escalated.filter(d => !computed.overdue.some(o => o.id === d.id)).map(d => (
                  <button
                    key={`esc-${d.id}`}
                    onClick={() => navigate(`/decisions/${d.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors text-left"
                  >
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">Eskalationsstufe {d.escalation_level}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 bg-warning/10 text-warning border-warning/20">
                      Stufe {d.escalation_level}
                    </Badge>
                  </button>
                ))}

                {/* Pending Reviews */}
                {computed.pendingReviews.map(r => (
                  <button
                    key={`rev-${r.id}`}
                    onClick={() => navigate(`/decisions/${r.decision_id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left"
                  >
                    <Eye className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Review ausstehend</p>
                      <p className="text-xs text-muted-foreground">Wartet auf deine Bewertung</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}

                {/* Overdue Tasks */}
                {computed.overdueTasks.slice(0, 3).map(t => (
                  <button
                    key={`task-${t.id}`}
                    onClick={() => navigate("/tasks")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors text-left"
                  >
                    <CheckCircle2 className="w-4 h-4 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">Aufgabe überfällig seit {differenceInDays(new Date(), new Date(t.due_date!))}d</p>
                    </div>
                  </button>
                ))}

                {computed.overdueTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{computed.overdueTasks.length - 3} weitere überfällige Aufgaben
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ BLOCK 2: KPI SNAPSHOT ═══ */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">KPI Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
        </div>

        {/* ═══ BLOCK 3: TRENDS ═══ */}
        <CollapsibleSection
          title="Trend-Analyse"
          subtitle="Velocity · Durchsatz · Verzögerungen"
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Velocity / Throughput Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Durchsatz & Velocity</CardTitle>
                <p className="text-xs text-muted-foreground">Erstellt vs. Abgeschlossen (8 Wochen)</p>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      />
                      <Area type="monotone" dataKey="erstellt" stroke="hsl(var(--primary))" fill="url(#gradCreated)" strokeWidth={2} />
                      <Area type="monotone" dataKey="abgeschlossen" stroke="hsl(var(--success, 142 71% 45%))" fill="url(#gradCompleted)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Delay Trend Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Verzögerungs-Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Überfällige Entscheidungen pro Woche</p>
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
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      />
                      <Area type="monotone" dataKey="überfällig" stroke="hsl(var(--destructive))" fill="url(#gradOverdue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>

        {/* ═══ BLOCK 4: ECONOMIC IMPACT ═══ */}
        <CollapsibleSection
          title="Economic Impact"
          subtitle="Verzögerungskosten · Verpasste Chancen"
          icon={<DollarSign className="w-4 h-4 text-destructive" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Delay Cost */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Geschätzte Verzögerungskosten</CardTitle>
                    <p className="text-xs text-muted-foreground">{computed.active.length} offene Entscheidungen</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive mb-4">{formatCost(computed.totalDelayCost)}</p>
                {computed.costItems.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    {computed.costItems.slice(0, 4).map((c, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/decisions/${c.id}`)}
                        className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${priorityColors[c.priority]}`} />
                          <span className="text-xs truncate">{c.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-muted-foreground">{c.days}d</span>
                          <span className="text-xs font-bold text-destructive">{formatCost(c.cost)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missed Opportunity */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Verpasste Chancen</CardTitle>
                    <p className="text-xs text-muted-foreground">Entscheidungen {">"} 14 Tage ohne Fortschritt</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-warning mb-1">{computed.staleDecisions.length}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {computed.staleDecisions.length === 0
                    ? "Keine stagnierenden Entscheidungen – alles im Fluss."
                    : "Entscheidungen, die seit über 2 Wochen nicht vorankommen"
                  }
                </p>
                {computed.staleDecisions.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    {computed.staleDecisions.slice(0, 4).map(d => (
                      <button
                        key={d.id}
                        onClick={() => navigate(`/decisions/${d.id}`)}
                        className="w-full flex items-center justify-between hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                      >
                        <span className="text-xs truncate">{d.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {differenceInDays(new Date(), new Date(d.created_at))}d offen
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>


      </div>
    </AppLayout>
  );
};

export default Dashboard;
