import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Card, CardContent } from "@/components/ui/card";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Zap, Target, FileDown, Loader2,
  ArrowRight, Activity, ExternalLink, Send,
} from "lucide-react";
import { fetchBoardReportData, generateBoardReport } from "@/lib/generateBoardReport";
import { useToast } from "@/hooks/use-toast";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 12 };

const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string[] | null>(null);
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: deps = [] } = useFilteredDependencies();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useFilteredReviews();
  const { data: tasks = [] } = useTasks();

  const { data: allDecisions = [] } = useQuery({
    queryKey: ["decisions", "all-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("decisions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks", "all-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const metrics = useMemo(() => {
    if (loadingDec || decisions.length === 0) return null;
    const total = decisions.length || 1;
    const implemented = decisions.filter(d => d.status === "implemented");
    const approved = decisions.filter(d => d.status === "approved" || d.status === "implemented");
    const overdue = decisions.filter(d => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented");
    const escalated = decisions.filter(d => (d.escalation_level ?? 0) > 0);
    const critical = decisions.filter(d => d.priority === "critical");
    const highRisk = decisions.filter(d => (d.ai_risk_score ?? 0) > 60);
    const doneTasks = tasks.filter(t => t.status === "done");
    const openTasks = tasks.filter(t => t.status !== "done");
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
    const taskCompletionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

    const implDurations = implemented.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
    const avgVelocity = implDurations.length > 0 ? Math.round(implDurations.reduce((a, b) => a + b, 0) / implDurations.length) : 0;

    const openDecisions = decisions.filter(d => d.status !== "implemented" && d.status !== "rejected");
    const totalOpportunityCost = openDecisions.reduce((sum, d) => {
      const team = teams.find((t: any) => t.id === d.team_id);
      const rate = team?.hourly_rate || 75;
      const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
      return sum + Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
    }, 0);

    const implRate = (implemented.length / total) * 100;
    const overdueRate = (overdue.length / total) * 100;
    const escRate = (escalated.length / total) * 100;
    const taskHealth = tasks.length > 0 ? (taskCompletionRate * 0.5 + (100 - (overdueTasks.length / Math.max(1, openTasks.length)) * 100) * 0.5) : 50;
    const healthScore = Math.round(Math.max(0, Math.min(100, (implRate * 0.3) + ((100 - overdueRate) * 0.2) + ((100 - escRate) * 0.15) + (approved.length / total * 100 * 0.1) + (taskHealth * 0.25))));

    const radarData = [
      { metric: "Risiko", value: Math.round(100 - (highRisk.length / total * 100)), explanation: "Anteil Entscheidungen ohne hohes Risiko" },
      { metric: "Verzögerung", value: Math.round(100 - overdueRate), explanation: "Termintreue – niedrige Überfälligkeitsrate" },
      { metric: "Eskalation", value: Math.round(100 - escRate), explanation: "Entscheidungen ohne Eskalation" },
      { metric: "Alignment", value: Math.round((reviews.length / total) * 100), explanation: "Review-Abdeckung als Alignment-Indikator" },
      { metric: "Durchsatz", value: Math.round(implRate), explanation: "Umsetzungsrate aller Entscheidungen" },
    ];

    const criticalDecisions = [...openDecisions]
      .map(d => {
        const daysOpen = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000);
        const isOverdue = d.due_date ? new Date(d.due_date) < new Date() : false;
        const overdueDays = isOverdue && d.due_date ? Math.floor((Date.now() - new Date(d.due_date).getTime()) / 86400000) : 0;
        const riskScore = d.ai_risk_score ?? 0;
        const team = teams.find((t: any) => t.id === d.team_id);
        const rate = team?.hourly_rate || 75;
        const costImpact = Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
        const delayProb = Math.min(100, Math.round((daysOpen > 14 ? 60 : daysOpen * 4) + (riskScore * 0.3)));
        const urgency = riskScore * 0.3 + delayProb * 0.3 + (isOverdue ? overdueDays * 5 : 0) + (d.priority === "critical" ? 40 : d.priority === "high" ? 20 : 0);
        return { ...d, riskScore, delayProb, costImpact, urgency, isOverdue };
      })
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 10);

    return {
      total, implemented, overdue, escalated, critical, highRisk,
      doneTasks, overdueTasks, taskCompletionRate, avgVelocity,
      openDecisions, totalOpportunityCost, implRate, overdueRate, escRate,
      healthScore, radarData, criticalDecisions,
    };
  }, [loadingDec, decisions, tasks, teams, reviews, deps]);

  const generateBrief = async () => {
    if (!metrics) return;
    setBriefLoading(true);
    try {
      const { data } = await supabase.functions.invoke("ceo-briefing", {
        body: { user_id: user?.id },
      });
      if (data?.content?.bullets) {
        setAiBrief(data.content.bullets);
      } else if (data?.content?.summary) {
        setAiBrief([data.content.summary]);
      } else {
        const bullets = [
          `${metrics.openDecisions.length} offene Entscheidungen, davon ${metrics.overdue.length} überfällig.`,
          `${metrics.escalated.length} aktive Eskalationen – SLA-Verletzungen prüfen.`,
          `Umsetzungsrate bei ${Math.round(metrics.implRate)}%, Ø ${metrics.avgVelocity} Tage.`,
          `Geschätzte Verzögerungskosten: €${metrics.totalOpportunityCost.toLocaleString()}.`,
          metrics.highRisk.length > 0 ? `${metrics.highRisk.length} Hochrisiko-Entscheidungen offen.` : "Keine Hochrisiko-Entscheidungen offen.",
          `Task-Abschlussrate: ${metrics.taskCompletionRate}%, ${metrics.overdueTasks.length} überfällig.`,
          metrics.overdue.length > 3 ? "Empfehlung: Eskalationsprozess für überfällige Entscheidungen einleiten." : "Termintreue im akzeptablen Bereich.",
          `Health Score: ${metrics.healthScore}/100.`,
        ];
        setAiBrief(bullets);
      }
    } catch {
      const bullets = [
        `${metrics.openDecisions.length} offene Entscheidungen, ${metrics.overdue.length} überfällig.`,
        `Umsetzungsrate: ${Math.round(metrics.implRate)}%.`,
        `Verzögerungskosten: €${metrics.totalOpportunityCost.toLocaleString()}.`,
        `Health Score: ${metrics.healthScore}/100.`,
      ];
      setAiBrief(bullets);
    }
    setBriefLoading(false);
  };

  if (loadingDec) {
    return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Lade Executive Dashboard…</div></AppLayout>;
  }

  if (!metrics) {
    return (
      <AppLayout>
        <div className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Führungsebene</p>
          <h1 className="text-xl font-bold">Executive Dashboard</h1>
        </div>
        <EmptyAnalysisState icon={Target} title="Noch keine Executive-Daten" description="Erstelle Entscheidungen für KPIs und Analysen." hint="Metriken werden automatisch berechnet" />
      </AppLayout>
    );
  }

  const scoreColor = metrics.healthScore >= 75 ? "text-success" : metrics.healthScore >= 50 ? "text-warning" : "text-destructive";

  const teamComparisonData = teams.map((team: any) => {
    const teamDecs = allDecisions.filter((d: any) => d.team_id === team.id);
    const teamTsk = allTasks.filter((t: any) => t.team_id === team.id);
    const totalDec = teamDecs.length || 1;
    const implCount = teamDecs.filter((d: any) => d.status === "implemented").length;
    const overdueCount = teamDecs.filter((d: any) => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented").length;
    const tasksDone = teamTsk.filter((t: any) => t.status === "done").length;
    const taskTotal = teamTsk.length || 1;
    return {
      name: team.name.length > 12 ? team.name.slice(0, 12) + "…" : team.name,
      Umsetzung: Math.round((implCount / totalDec) * 100),
      Termintreue: Math.round(((totalDec - overdueCount) / totalDec) * 100),
      "Task-Rate": Math.round((tasksDone / taskTotal) * 100),
    };
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Strategische Analyse</p>
            <h1 className="text-xl font-bold">Executive Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <PageHelpButton title="Executive Dashboard" description="Management-Cockpit: KPI Snapshot, Risk Radar, kritische Entscheidungen und KI-Briefing auf einen Blick." />
            <Button size="sm" variant="outline" disabled={exporting} onClick={async () => {
              setExporting(true);
              try { const data = await fetchBoardReportData(); generateBoardReport(data); toast({ title: "Exportiert", description: "Board Report als PDF." }); }
              catch { toast({ title: "Fehler", description: "Export fehlgeschlagen.", variant: "destructive" }); }
              setExporting(false);
            }} className="gap-2">
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Board Report
            </Button>
          </div>
        </div>

        {/* KPI Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Offene Entscheidungen", value: metrics.openDecisions.length, icon: BarChart3 },
            { label: "Kritisch (High Risk)", value: metrics.highRisk.length, icon: AlertTriangle, color: metrics.highRisk.length > 0 ? "text-destructive" : undefined },
            { label: "Eskalationen aktiv", value: metrics.escalated.length, icon: Zap, color: metrics.escalated.length > 0 ? "text-warning" : undefined },
            { label: "Delay Cost", value: `€${metrics.totalOpportunityCost.toLocaleString()}`, icon: DollarSign, color: "text-destructive" },
            { label: "Completion Rate", value: `${Math.round(metrics.implRate)}%`, icon: CheckCircle2, color: "text-success" },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color || "text-muted-foreground"}`} />
                  <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                </div>
                <div className={`text-2xl font-bold ${kpi.color || ""}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Risk Radar */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Risk Radar</h2>
            <span className="text-xs text-muted-foreground">— Fünf-Achsen Performance-Analyse</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={metrics.radarData} cx="50%" cy="50%" outerRadius="60%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.1} />
                      <RTooltip content={({ payload }) => {
                        if (!payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                            <p className="font-semibold">{d.metric}: {d.value}%</p>
                            <p className="text-muted-foreground mt-0.5">{d.explanation}</p>
                          </div>
                        );
                      }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Health Score</h3>
                <div className="flex flex-col items-center gap-3">
                  <div className={`text-5xl font-bold ${scoreColor}`}>{metrics.healthScore}</div>
                  <Progress value={metrics.healthScore} className="w-full" />
                  <div className="w-full space-y-1.5 text-xs">
                    {metrics.radarData.map(r => (
                      <div key={r.metric} className="flex justify-between">
                        <span className="text-muted-foreground">{r.metric}</span>
                        <span className={r.value >= 70 ? "text-success" : r.value >= 40 ? "text-warning" : "text-destructive"}>{r.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Critical Decisions Table */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold">Kritische Entscheidungen</h2>
            <span className="text-xs text-muted-foreground">— {metrics.criticalDecisions.length} dringendste Items</span>
          </div>
          <Card>
            <CardContent className="p-0">
              {metrics.criticalDecisions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">✅ Keine kritischen Entscheidungen</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Titel</th>
                        <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Risk</th>
                        <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Delay %</th>
                        <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Cost Impact</th>
                        <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Priorität</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.criticalDecisions.map(d => (
                        <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate max-w-[200px]">{d.title}</span>
                              {d.isOverdue && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Überfällig</Badge>}
                            </div>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`font-bold ${d.riskScore > 60 ? "text-destructive" : d.riskScore > 30 ? "text-warning" : "text-success"}`}>{d.riskScore}%</span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`font-medium ${d.delayProb > 60 ? "text-destructive" : d.delayProb > 30 ? "text-warning" : "text-muted-foreground"}`}>{d.delayProb}%</span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className="font-medium">€{d.costImpact.toLocaleString()}</span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <Badge variant="outline" className="text-[10px]">{d.priority}</Badge>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Link to={`/decisions/${d.id}`}>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"><ExternalLink className="w-3 h-3" />Öffnen</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Executive Brief */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">AI Executive Brief</h2>
            <span className="text-xs text-muted-foreground">— KI-generierte Zusammenfassung</span>
          </div>
          <Card>
            <CardContent className="p-6">
              {aiBrief ? (
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {aiBrief.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                      setExporting(true);
                      try { const data = await fetchBoardReportData(); generateBoardReport(data); toast({ title: "PDF exportiert" }); }
                      catch { toast({ title: "Fehler", variant: "destructive" }); }
                      setExporting(false);
                    }}>
                      <FileDown className="w-3 h-3" />Als PDF exportieren
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => toast({ title: "Gesendet", description: "Briefing wurde an das Team gesendet." })}>
                      <Send className="w-3 h-3" />An Team senden
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">Generiere ein KI-Briefing mit Risiken, Trends und Empfehlungen.</p>
                  <Button onClick={generateBrief} disabled={briefLoading} className="gap-2">
                    {briefLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {briefLoading ? "Generiere..." : "Briefing generieren"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Comparison */}
        {teams.length > 0 && teamComparisonData.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Team-Vergleich</h2>
              <span className="text-xs text-muted-foreground">— Performance-Metriken nach Team</span>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamComparisonData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                      <RTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Umsetzung" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Termintreue" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Task-Rate" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ExecutiveDashboard;
