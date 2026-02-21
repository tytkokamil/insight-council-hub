import { useMemo } from "react";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { categoryLabels } from "@/lib/labels";
import {
  TrendingUp, Clock, CheckCircle2, AlertTriangle, FileText,
  BarChart3, Users, Zap, Activity, ListTodo,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import TemplateAnalyticsSection from "@/components/analytics/TemplateAnalyticsSection";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { useDecisions, useTeams, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useTeamContext } from "@/hooks/useTeamContext";
import { differenceInDays, subDays, format } from "date-fns";
import { de } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--success, 142 71% 45%))", "hsl(var(--warning, 38 92% 50%))",
  "hsl(var(--destructive))", "hsl(215, 28%, 55%)", "hsl(280, 65%, 60%)",
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const Analytics = ({ embedded }: { embedded?: boolean }) => {
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useProfiles();
  const profileMap = buildProfileMap(profiles);
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;

  const loading = loadingDec || loadingTasks;

  const data = useMemo(() => {
    const decisions = allDecisions;
    const tasks = allTasks;
    const now = new Date();

    // === Basic stats ===
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
    ).map(([name, value]) => ({ name: categoryLabels[name] || name, value }));

    // === Duration Analysis ===
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

    // === Throughput (8 weeks) ===
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

      return { week: label, erstellt: created, abgeschlossen: completed, abgelehnt: rejectedW };
    });

    // === Rejection rate ===
    const rejectionRate = total > 0 ? Math.round((rejected.length / total) * 100) : 0;

    // === Risk distribution ===
    const avgRisk = total > 0 ? Math.round(decisions.reduce((s, d) => s + (d.ai_risk_score || 0), 0) / total) : 0;

    const riskDistribution = [
      { name: "Niedrig (0-40)", value: decisions.filter(d => (d.ai_risk_score || 0) <= 40).length, fill: "hsl(var(--success, 142 71% 45%))" },
      { name: "Mittel (41-60)", value: decisions.filter(d => (d.ai_risk_score || 0) > 40 && (d.ai_risk_score || 0) <= 60).length, fill: "hsl(var(--warning, 38 92% 50%))" },
      { name: "Hoch (61-100)", value: decisions.filter(d => (d.ai_risk_score || 0) > 60).length, fill: "hsl(var(--destructive))" },
    ].filter(d => d.value > 0);

    // === Team Comparison ===
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

      return {
        name: team.name,
        entscheidungen: teamDec.length,
        umgesetzt: teamImpl.length,
        avgTage: avgVel,
        taskRate: taskDoneRate,
        überfällig: overdue,
      };
    }).filter(t => t.entscheidungen > 0);

    // === Bottleneck: slowest categories ===
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const overduePercent = active.length > 0 ? Math.round((overdue.length / active.length) * 100) : 0;

    // Task stats
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

  const content = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
            <h1 className="font-display text-xl font-bold">Analytics</h1>
          </div>
          <PageHelpButton title="Analytics" description="Muster & Trends erkennen: Durchlaufzeiten, Durchsatz, Ablehnungsquoten, Teamvergleiche und Engpässe." />
        </div>
      )}

      {/* ═══ Summary KPIs ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Gesamt", value: data.total, icon: FileText, color: "text-primary" },
          { label: "Umgesetzt", value: data.implemented, icon: CheckCircle2, color: "text-success" },
          { label: "Ø Tage", value: data.avgDuration ?? "—", icon: Zap, color: "text-primary" },
          { label: "Überfällig", value: `${data.overduePercent}%`, icon: AlertTriangle, color: data.overduePercent > 20 ? "text-destructive" : "text-muted-foreground" },
          { label: "Ablehnungsrate", value: `${data.rejectionRate}%`, icon: Clock, color: data.rejectionRate > 20 ? "text-warning" : "text-muted-foreground" },
          { label: "Task-Rate", value: `${data.taskDoneRate}%`, icon: ListTodo, color: data.taskDoneRate > 60 ? "text-success" : "text-warning" },
        ].map((card, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Throughput Trends ═══ */}
      <CollapsibleSection
        title="Durchsatz & Trends"
        subtitle="Erstellt vs. Abgeschlossen vs. Abgelehnt (8 Wochen)"
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="erstellt" stroke="hsl(var(--primary))" fill="url(#gCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="abgeschlossen" stroke="hsl(var(--success, 142 71% 45%))" fill="url(#gCompleted)" strokeWidth={2} />
                  <Area type="monotone" dataKey="abgelehnt" stroke="hsl(var(--destructive))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* ═══ Duration Analysis ═══ */}
      <CollapsibleSection
        title="Durchlaufzeiten"
        subtitle="Ø Tage bis Umsetzung nach Kategorie und Priorität"
        icon={<Zap className="w-4 h-4 text-primary" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              {data.durationByCategory.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.durationByCategory} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" width={80} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} Tage`, "Ø Dauer"]} />
                      <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Noch keine umgesetzten Entscheidungen</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Nach Priorität</CardTitle>
            </CardHeader>
            <CardContent>
              {data.durationByPriority.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.durationByPriority} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} Tage`, "Ø Dauer"]} />
                      <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                        {data.durationByPriority.map((_, i) => (
                          <Cell key={i} fill={["hsl(var(--destructive))", "hsl(var(--warning, 38 92% 50%))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"][i] || COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Noch keine umgesetzten Entscheidungen</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* ═══ Status & Categories ═══ */}
      <CollapsibleSection
        title="Verteilung"
        subtitle="Status & Kategorien"
        icon={<BarChart3 className="w-4 h-4 text-primary" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {data.statusData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.statusData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" paddingAngle={2}
                        label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {data.statusData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" width={80} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risikoverteilung</CardTitle>
            </CardHeader>
            <CardContent>
              {data.riskDistribution.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.riskDistribution} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" paddingAngle={2}
                        label={({ name, value }) => `${value}`}>
                        {data.riskDistribution.map((d, i) => (<Cell key={i} fill={d.fill} />))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Keine KI-Analysen</p>
              )}
              <p className="text-xs text-center text-muted-foreground mt-2">Ø Risiko: <span className="font-bold">{data.avgRisk}%</span></p>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* ═══ Team Comparison ═══ */}
      {data.teamComparison.length > 0 && (
        <CollapsibleSection
          title="Teamvergleich"
          subtitle="Performance-Vergleich nach Teams"
          icon={<Users className="w-4 h-4 text-primary" />}
          defaultOpen={false}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Team</th>
                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Entscheidungen</th>
                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Umgesetzt</th>
                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Ø Tage</th>
                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Task-Rate</th>
                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Überfällig</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teamComparison.map((team, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-2 text-sm font-medium">{team.name}</td>
                        <td className="p-2 text-sm text-right">{team.entscheidungen}</td>
                        <td className="p-2 text-sm text-right text-success">{team.umgesetzt}</td>
                        <td className="p-2 text-sm text-right">{team.avgTage || "—"}d</td>
                        <td className="p-2 text-sm text-right">
                          <span className={team.taskRate > 60 ? "text-success" : team.taskRate > 30 ? "text-warning" : "text-destructive"}>
                            {team.taskRate}%
                          </span>
                        </td>
                        <td className="p-2 text-sm text-right">
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
    </>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
};

export default Analytics;
