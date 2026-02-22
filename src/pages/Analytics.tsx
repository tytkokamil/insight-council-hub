import { useMemo } from "react";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { categoryLabels } from "@/lib/labels";
import {
  TrendingUp, Clock, CheckCircle2, AlertTriangle, FileText,
  BarChart3, Users, Zap, Activity, ListTodo, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import TemplateAnalyticsSection from "@/components/analytics/TemplateAnalyticsSection";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { useDecisions, useTeams, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useTeamContext } from "@/hooks/useTeamContext";
import { differenceInDays, subDays, format } from "date-fns";
import { de } from "date-fns/locale";

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(142 71% 45%)",
  warning: "hsl(38 92% 50%)",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
  violet: "hsl(280 65% 60%)",
  slate: "hsl(215 20% 65%)",
};

const STATUS_COLORS: Record<string, string> = {
  "Entwurf": CHART_COLORS.slate,
  "Review": CHART_COLORS.warning,
  "Genehmigt": CHART_COLORS.primary,
  "Umgesetzt": CHART_COLORS.success,
  "Abgelehnt": CHART_COLORS.destructive,
};

const PRIORITY_COLORS: Record<string, string> = {
  "Kritisch": CHART_COLORS.destructive,
  "Hoch": CHART_COLORS.warning,
  "Mittel": CHART_COLORS.primary,
  "Niedrig": CHART_COLORS.slate,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-medium text-foreground mb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-[11px]">
      {name} ({value})
    </text>
  );
};

const Analytics = ({ embedded }: { embedded?: boolean }) => {
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useProfiles();
  const profileMap = buildProfileMap(profiles);
  const { selectedTeamId } = useTeamContext();
  const loading = loadingDec || loadingTasks;

  const data = useMemo(() => {
    const decisions = allDecisions;
    const tasks = allTasks;
    const now = new Date();

    const total = decisions.length;
    const implemented = decisions.filter(d => d.status === "implemented");
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const rejected = decisions.filter(d => d.status === "rejected");

    const statusData = [
      { name: "Entwurf", value: decisions.filter(d => d.status === "draft").length },
      { name: "Review", value: decisions.filter(d => d.status === "review").length },
      { name: "Genehmigt", value: decisions.filter(d => d.status === "approved").length },
      { name: "Umgesetzt", value: implemented.length },
      { name: "Abgelehnt", value: rejected.length },
    ].filter(d => d.value > 0);

    const categoryData = Object.entries(
      decisions.reduce((acc: Record<string, number>, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name: categoryLabels[name] || name, value })).sort((a, b) => b.value - a.value);

    const durations = implemented
      .filter(d => d.implemented_at)
      .map(d => ({
        days: differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)),
        category: d.category,
        priority: d.priority,
      }));

    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d.days, 0) / durations.length * 10) / 10
      : null;

    const durationByCategory = Object.entries(
      durations.reduce((acc: Record<string, number[]>, d) => {
        if (!acc[d.category]) acc[d.category] = [];
        acc[d.category].push(d.days);
        return acc;
      }, {})
    ).map(([cat, days]) => ({
      name: categoryLabels[cat] || cat,
      avg: Math.round(days.reduce((s, d) => s + d, 0) / days.length * 10) / 10,
      count: days.length,
    })).sort((a, b) => b.avg - a.avg);

    const durationByPriority = ["critical", "high", "medium", "low"]
      .map(p => {
        const d = durations.filter(x => x.priority === p);
        return {
          name: p === "critical" ? "Kritisch" : p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig",
          avg: d.length > 0 ? Math.round(d.reduce((s, x) => s + x.days, 0) / d.length * 10) / 10 : 0,
          count: d.length,
        };
      })
      .filter(d => d.count > 0);

    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const label = format(weekEnd, "dd.MM", { locale: de });
      const created = decisions.filter(d => {
        const date = new Date(d.created_at);
        return date >= weekStart && date < weekEnd;
      }).length;
      const completed = [
        ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd),
        ...tasks.filter(t => t.completed_at && new Date(t.completed_at) >= weekStart && new Date(t.completed_at) < weekEnd),
      ].length;
      const rejectedW = decisions.filter(d =>
        d.status === "rejected" && new Date(d.updated_at) >= weekStart && new Date(d.updated_at) < weekEnd
      ).length;
      return { week: label, Erstellt: created, Abgeschlossen: completed, Abgelehnt: rejectedW };
    });

    const rejectionRate = total > 0 ? Math.round((rejected.length / total) * 100) : 0;
    const avgRisk = total > 0 ? Math.round(decisions.reduce((s, d) => s + (d.ai_risk_score || 0), 0) / total) : 0;

    const riskDistribution = [
      { name: "Niedrig", value: decisions.filter(d => (d.ai_risk_score || 0) <= 40).length, fill: CHART_COLORS.success },
      { name: "Mittel", value: decisions.filter(d => (d.ai_risk_score || 0) > 40 && (d.ai_risk_score || 0) <= 60).length, fill: CHART_COLORS.warning },
      { name: "Hoch", value: decisions.filter(d => (d.ai_risk_score || 0) > 60).length, fill: CHART_COLORS.destructive },
    ].filter(d => d.value > 0);

    const teamComparison = teams.map(team => {
      const teamDec = decisions.filter(d => d.team_id === team.id);
      const teamTasks = tasks.filter(t => t.team_id === team.id);
      const teamImpl = teamDec.filter(d => d.status === "implemented");
      const teamVels = teamImpl.filter(d => d.implemented_at).map(d =>
        differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
      );
      const avgVel = teamVels.length > 0 ? Math.round(teamVels.reduce((s, v) => s + v, 0) / teamVels.length) : 0;
      const taskDoneRate = teamTasks.length > 0 ? Math.round((teamTasks.filter(t => t.status === "done").length / teamTasks.length) * 100) : 0;
      const overdue = teamDec.filter(d => d.due_date && new Date(d.due_date) < now && !["implemented", "rejected"].includes(d.status)).length;
      return { name: team.name, entscheidungen: teamDec.length, umgesetzt: teamImpl.length, avgTage: avgVel, taskRate: taskDoneRate, überfällig: overdue };
    }).filter(t => t.entscheidungen > 0);

    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const overduePercent = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;
    const taskTotal = tasks.length;
    const taskDone = tasks.filter(t => t.status === "done").length;
    const taskDoneRate = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

    return {
      total, implemented: implemented.length, rejectionRate, avgRisk, avgDuration,
      overduePercent, taskTotal, taskDone, taskDoneRate,
      statusData, categoryData, riskDistribution,
      durationByCategory, durationByPriority,
      weekData, teamComparison,
    };
  }, [allDecisions, allTasks, teams]);

  if (loading) return <AnalysisPageSkeleton cards={4} sections={0} showChart />;

  if (allDecisions.length === 0) {
    const empty = (
      <>
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
          <h1 className="font-display text-xl font-bold">Analytics</h1>
        </div>
        <EmptyAnalysisState
          icon={BarChart3}
          title="Noch keine Analyse-Daten"
          description="Erstelle Entscheidungen, um Statistiken und Diagramme zu sehen."
          hint="Daten werden automatisch analysiert, sobald Entscheidungen vorhanden sind"
        />
      </>
    );
    return embedded ? empty : <AppLayout>{empty}</AppLayout>;
  }

  const kpis = [
    { label: "Gesamt", value: data.total, icon: FileText, color: "text-primary" },
    { label: "Umgesetzt", value: data.implemented, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Ø Tage", value: data.avgDuration ?? "—", icon: Zap, color: "text-primary" },
    { label: "Überfällig", value: `${data.overduePercent}%`, icon: AlertTriangle, color: data.overduePercent > 20 ? "text-destructive" : "text-muted-foreground" },
    { label: "Ablehnungsrate", value: `${data.rejectionRate}%`, icon: Clock, color: data.rejectionRate > 20 ? "text-amber-500" : "text-muted-foreground" },
    { label: "Task-Rate", value: `${data.taskDoneRate}%`, icon: ListTodo, color: data.taskDoneRate > 60 ? "text-emerald-500" : "text-amber-500" },
  ];

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
            <h1 className="font-display text-xl font-bold">Analytics</h1>
          </div>
          <PageHelpButton title="Analytics" description="Muster & Trends erkennen: Durchlaufzeiten, Durchsatz, Ablehnungsquoten, Teamvergleiche und Engpässe." />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-muted/60">
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tracking-wide">{kpi.label}</span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Throughput Trends */}
      <CollapsibleSection
        title="Durchsatz & Trends"
        subtitle="Erstellt vs. Abgeschlossen (8 Wochen)"
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
      >
        <Card>
          <CardContent className="pt-6 pb-4 px-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weekData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Erstellt" stroke={CHART_COLORS.primary} fill="url(#gCreated)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Abgeschlossen" stroke={CHART_COLORS.success} fill="url(#gCompleted)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Abgelehnt" stroke={CHART_COLORS.destructive} fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              {[
                { label: "Erstellt", color: CHART_COLORS.primary },
                { label: "Abgeschlossen", color: CHART_COLORS.success },
                { label: "Abgelehnt", color: CHART_COLORS.destructive },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* Duration Analysis */}
      <CollapsibleSection
        title="Durchlaufzeiten"
        subtitle="Ø Tage bis Umsetzung"
        icon={<Zap className="w-4 h-4 text-primary" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {data.durationByCategory.length > 0 ? (
                <div className="space-y-3">
                  {data.durationByCategory.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.avg} Tage</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/80 transition-all"
                          style={{ width: `${Math.min(100, (item.avg / Math.max(...data.durationByCategory.map(d => d.avg))) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Noch keine umgesetzten Entscheidungen</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nach Priorität</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {data.durationByPriority.length > 0 ? (
                <div className="space-y-3">
                  {data.durationByPriority.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[item.name] || CHART_COLORS.primary }} />
                          <span className="text-foreground font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.avg} Tage</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (item.avg / Math.max(...data.durationByPriority.map(d => d.avg))) * 100)}%`,
                            background: PRIORITY_COLORS[item.name] || CHART_COLORS.primary,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Noch keine umgesetzten Entscheidungen</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Distribution */}
      <CollapsibleSection
        title="Verteilung"
        subtitle="Status, Kategorien & Risiko"
        icon={<BarChart3 className="w-4 h-4 text-primary" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Status Donut */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {data.statusData.length > 0 ? (
                <>
                  <div className="h-52 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.statusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={40}
                          dataKey="value"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {data.statusData.map((entry, i) => (
                            <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS.primary} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-1">
                    {data.statusData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[entry.name] || CHART_COLORS.primary }} />
                        {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {data.categoryData.length > 0 ? (
                <div className="pt-4 space-y-2.5">
                  {data.categoryData.map((item, i) => {
                    const maxVal = Math.max(...data.categoryData.map(d => d.value));
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 text-right shrink-0 truncate">{item.name}</span>
                        <div className="flex-1 h-5 rounded bg-muted/40 overflow-hidden relative">
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${(item.value / maxVal) * 100}%`,
                              background: CHART_COLORS.primary,
                              opacity: 0.75,
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-foreground">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium">Risikoverteilung</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {data.riskDistribution.length > 0 ? (
                <>
                  <div className="h-52 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.riskDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={40}
                          dataKey="value"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {data.riskDistribution.map((d, i) => (
                            <Cell key={i} fill={d.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-1">
                    {data.riskDistribution.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.fill }} />
                        {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Ø Risiko: <span className="font-bold text-foreground">{data.avgRisk}%</span>
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Keine KI-Analysen</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Team Comparison */}
      {data.teamComparison.length > 0 && (
        <CollapsibleSection
          title="Teamvergleich"
          subtitle="Performance pro Team"
          icon={<Users className="w-4 h-4 text-primary" />}
          defaultOpen={false}
        >
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Team", "Entscheidungen", "Umgesetzt", "Ø Tage", "Task-Rate", "Überfällig"].map(h => (
                        <th key={h} className={`p-3 text-xs font-medium text-muted-foreground ${h === "Team" ? "text-left" : "text-right"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.teamComparison.map((team, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-sm font-medium">{team.name}</td>
                        <td className="p-3 text-sm text-right tabular-nums">{team.entscheidungen}</td>
                        <td className="p-3 text-sm text-right tabular-nums text-emerald-600 dark:text-emerald-400">{team.umgesetzt}</td>
                        <td className="p-3 text-sm text-right tabular-nums">{team.avgTage || "—"}</td>
                        <td className="p-3 text-sm text-right tabular-nums">
                          <span className={team.taskRate > 60 ? "text-emerald-600 dark:text-emerald-400" : team.taskRate > 30 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}>
                            {team.taskRate}%
                          </span>
                        </td>
                        <td className="p-3 text-sm text-right tabular-nums">
                          <span className={team.überfällig > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {team.überfällig}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Template Analytics */}
      <TemplateAnalyticsSection decisions={allDecisions as any} />
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
};

export default Analytics;
