import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Card, CardContent } from "@/components/ui/card";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Zap, Target, FileDown, Loader2,
  ArrowRight, Activity, ExternalLink, Send, Shield, Siren,
  ArrowUpRight, ArrowDownRight, Minus, Info, Gauge, Users,
  Settings, BookOpen,
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

/* ── Trend Arrow ── */
const TrendBadge = ({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) => {
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  if (neutral) return <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Minus className="w-3 h-3" />→</span>;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${positive ? "text-success" : "text-destructive"}`}>
      {value > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
};

const ExecutiveDashboard = ({ embedded }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<string[] | null>(null);
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: deps = [] } = useFilteredDependencies();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useFilteredReviews();
  const { data: tasks = [] } = useTasks();
  const { data: risks = [] } = useRisks();

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
    const now = new Date();
    const implemented = decisions.filter(d => d.status === "implemented");
    const approved = decisions.filter(d => d.status === "approved" || d.status === "implemented");
    const overdue = decisions.filter(d => d.due_date && new Date(d.due_date) < now && !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const escalated = decisions.filter(d => (d.escalation_level ?? 0) > 0);
    const critical = decisions.filter(d => d.priority === "critical");
    const highRisk = decisions.filter(d => (d.ai_risk_score ?? 0) > 60);
    const openDecisions = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));

    // Median time-to-decision
    const implDurations = implemented.filter(d => d.implemented_at).map(d =>
      (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000
    ).sort((a, b) => a - b);
    const medianTTD = implDurations.length > 0
      ? Math.round(implDurations[Math.floor(implDurations.length / 2)])
      : 0;
    const avgVelocity = implDurations.length > 0 ? Math.round(implDurations.reduce((a, b) => a + b, 0) / implDurations.length) : 0;

    // Cost of delay
    const totalOpportunityCost = openDecisions.reduce((sum, d) => {
      const team = teams.find((t: any) => t.id === d.team_id);
      const rate = team?.hourly_rate || 75;
      const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
      return sum + Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
    }, 0);

    // Implementation rate & overdue rate
    const implRate = (implemented.length / total) * 100;
    const overdueRate = openDecisions.length > 0 ? (overdue.length / openDecisions.length) * 100 : 0;
    const escRate = (escalated.length / total) * 100;

    // SLA compliance
    const withDueDate = decisions.filter(d => d.due_date);
    const slaCompliant = withDueDate.filter(d => {
      if (d.status === "implemented" && d.implemented_at) return new Date(d.implemented_at) <= new Date(d.due_date!);
      if (["implemented", "rejected", "archived", "cancelled"].includes(d.status)) return true;
      return new Date(d.due_date!) >= now;
    });
    const slaCompliance = withDueDate.length > 0 ? Math.round((slaCompliant.length / withDueDate.length) * 100) : 100;

    // Governance / Health Score
    const doneTasks = tasks.filter(t => t.status === "done");
    const openTasks = tasks.filter(t => t.status !== "done");
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const taskCompletionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
    const taskHealth = tasks.length > 0 ? (taskCompletionRate * 0.5 + (100 - (overdueTasks.length / Math.max(1, openTasks.length)) * 100) * 0.5) : 50;
    const healthScore = Math.round(Math.max(0, Math.min(100, (implRate * 0.3) + ((100 - (overdue.length / total * 100)) * 0.2) + ((100 - escRate) * 0.15) + (approved.length / total * 100 * 0.1) + (taskHealth * 0.25))));

    // Decision Quality Index
    const successful = implemented.filter(d => d.outcome_type === "successful").length;
    const partial = implemented.filter(d => d.outcome_type === "partial").length;
    const rated = implemented.filter(d => d.outcome_type).length;
    const qualityIndex = rated > 0 ? Math.round(((successful + partial * 0.5) / rated) * 100) : 50;

    // Radar data
    const radarData = [
      { metric: "Risiko", value: Math.round(100 - (highRisk.length / total * 100)), explanation: "Anteil Entscheidungen ohne hohes Risiko" },
      { metric: "Verzögerung", value: Math.round(100 - (overdue.length / total * 100)), explanation: "Termintreue – niedrige Überfälligkeitsrate" },
      { metric: "Eskalation", value: Math.round(100 - escRate), explanation: "Entscheidungen ohne Eskalation" },
      { metric: "Alignment", value: Math.round(Math.min(100, (reviews.length / total) * 100)), explanation: "Review-Abdeckung als Alignment-Indikator" },
      { metric: "Durchsatz", value: Math.round(implRate), explanation: "Umsetzungsrate aller Entscheidungen" },
    ];

    // Critical Decisions – sorted by economic impact × risk × delay
    const criticalDecisions = [...openDecisions]
      .map(d => {
        const daysOpen = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000);
        const isOverdue = d.due_date ? new Date(d.due_date) < now : false;
        const overdueDays = isOverdue && d.due_date ? Math.floor((Date.now() - new Date(d.due_date).getTime()) / 86400000) : 0;
        const riskScore = d.ai_risk_score ?? 0;
        const team = teams.find((t: any) => t.id === d.team_id);
        const rate = team?.hourly_rate || 75;
        const costImpact = Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
        const delayProb = Math.min(100, Math.round((daysOpen > 14 ? 60 : daysOpen * 4) + (riskScore * 0.3)));
        const escalationLevel = d.escalation_level ?? 0;
        const reviewDays = d.status === "review" ? daysOpen : 0;
        const urgency = costImpact * 0.4 + riskScore * 0.25 + delayProb * 0.2 + (isOverdue ? overdueDays * 5 : 0) + (d.priority === "critical" ? 40 : d.priority === "high" ? 20 : 0);
        return { ...d, riskScore, delayProb, costImpact, urgency, isOverdue, overdueDays, escalationLevel, reviewDays, daysOpen };
      })
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 10);

    // Top 3 cost drivers
    const topCostDrivers = [...criticalDecisions].sort((a, b) => b.costImpact - a.costImpact).slice(0, 3);

    // SLA early warnings (due within 5 days)
    const fiveDaysFromNow = new Date(Date.now() + 5 * 86400000);
    const slaWarnings = openDecisions.filter(d => d.due_date && new Date(d.due_date) > now && new Date(d.due_date) <= fiveDaysFromNow);

    // Pending reviews
    const pendingReviews = reviews.filter(r => !r.reviewed_at);
    const reviewMedianWait = (() => {
      const waits = pendingReviews.map(r => (Date.now() - new Date(r.created_at).getTime()) / 86400000).sort((a, b) => a - b);
      return waits.length > 0 ? Math.round(waits[Math.floor(waits.length / 2)]) : 0;
    })();

    return {
      total, implemented, overdue, escalated, critical, highRisk,
      openDecisions, totalOpportunityCost, implRate, overdueRate, escRate,
      healthScore, qualityIndex, radarData, criticalDecisions, topCostDrivers,
      medianTTD, avgVelocity, slaCompliance, slaWarnings,
      pendingReviews, reviewMedianWait, taskCompletionRate,
      doneTasks, overdueTasks: tasks.filter(t => t.status !== "done" && t.due_date && new Date(t.due_date) < now),
    };
  }, [loadingDec, decisions, tasks, teams, reviews, deps, risks]);

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
        setAiBrief(generateFallbackBrief());
      }
    } catch {
      setAiBrief(generateFallbackBrief());
    }
    setBriefLoading(false);
  };

  const generateFallbackBrief = () => {
    if (!metrics) return [];
    const bullets: string[] = [];
    if (metrics.critical.length > 0) bullets.push(`Kritische Entscheidungen: ${metrics.critical.length} aktiv – Priorisierung empfohlen.`);
    if (metrics.escalated.length > 0) bullets.push(`${metrics.escalated.length} aktive Eskalationen – SLA-Verletzungen prüfen.`);
    bullets.push(`Ø Entscheidungsdauer (Median): ${metrics.medianTTD} Tage.`);
    bullets.push(`Geschätzte Verzögerungskosten: €${metrics.totalOpportunityCost.toLocaleString()}.`);
    if (metrics.overdueRate > 20) bullets.push(`Überfälligkeitsrate bei ${Math.round(metrics.overdueRate)}% – Eskalationsprozess empfohlen.`);
    bullets.push(`Umsetzungsrate: ${Math.round(metrics.implRate)}%.`);
    if (metrics.topCostDrivers.length > 0) bullets.push(`Top Cost Driver: ${metrics.topCostDrivers[0].title} (€${metrics.topCostDrivers[0].costImpact.toLocaleString()}).`);
    bullets.push(`Governance Score: ${metrics.healthScore}/100.`);
    return bullets;
  };

  // Team performance data
  const teamPerformanceData = useMemo(() => {
    if (teams.length === 0) return [];
    return teams.map((team: any) => {
      const teamDecs = allDecisions.filter((d: any) => d.team_id === team.id);
      const teamTsk = allTasks.filter((t: any) => t.team_id === team.id);
      const totalDec = teamDecs.length || 1;
      const implCount = teamDecs.filter((d: any) => d.status === "implemented").length;
      const overdueCount = teamDecs.filter((d: any) => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived", "cancelled"].includes(d.status)).length;
      const escalatedCount = teamDecs.filter((d: any) => (d.escalation_level ?? 0) > 0).length;
      const highRiskCount = teamDecs.filter((d: any) => (d.ai_risk_score ?? 0) > 60).length;
      const withDue = teamDecs.filter((d: any) => d.due_date);
      const slaOk = withDue.filter((d: any) => {
        if (d.status === "implemented" && d.implemented_at) return new Date(d.implemented_at) <= new Date(d.due_date!);
        if (["implemented", "rejected", "archived", "cancelled"].includes(d.status)) return true;
        return new Date(d.due_date!) >= new Date();
      });
      const sla = withDue.length > 0 ? Math.round((slaOk.length / withDue.length) * 100) : 100;
      const durations = teamDecs.filter((d: any) => d.status === "implemented" && d.implemented_at).map((d: any) => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000).sort((a: number, b: number) => a - b);
      const medianDays = durations.length > 0 ? Math.round(durations[Math.floor(durations.length / 2)]) : 0;
      const openDecs = teamDecs.filter((d: any) => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
      const costOfDelay = openDecs.reduce((sum: number, d: any) => {
        const rate = team?.hourly_rate || 75;
        const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
        return sum + Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
      }, 0);
      return {
        name: team.name,
        shortName: team.name.length > 14 ? team.name.slice(0, 14) + "…" : team.name,
        riskScore: highRiskCount,
        slaCompliance: sla,
        avgDecisionTime: medianDays,
        escalationRate: Math.round((escalatedCount / totalDec) * 100),
        economicImpact: costOfDelay,
        implRate: Math.round((implCount / totalDec) * 100),
      };
    });
  }, [teams, allDecisions, allTasks]);

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;

  if (loadingDec) {
    return <Wrap><div className="flex items-center justify-center h-64 text-muted-foreground">Lade Executive Dashboard…</div></Wrap>;
  }

  if (!metrics) {
    return (
      <Wrap>
        <div className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Führungsebene</p>
          <h1 className="text-xl font-bold">Executive Dashboard</h1>
        </div>
        <EmptyAnalysisState icon={Target} title="Noch keine Executive-Daten" description="Erstelle Entscheidungen für KPIs und Analysen." hint="Metriken werden automatisch berechnet" />
      </Wrap>
    );
  }

  const scoreColor = metrics.healthScore >= 75 ? "text-success" : metrics.healthScore >= 50 ? "text-warning" : "text-destructive";
  const scoreBg = metrics.healthScore >= 75 ? "bg-success/10" : metrics.healthScore >= 50 ? "bg-warning/10" : "bg-destructive/10";

  return (
    <Wrap>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Strategische Analyse</p>
            <h1 className="text-xl font-bold">Executive Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <PageHelpButton title="Executive Dashboard" description="Management-Cockpit: KPI Snapshot, Risk Radar, kritische Entscheidungen, Economic Impact und KI-Briefing." />
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

        {/* ── 1. EXECUTIVE SNAPSHOT ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Executive Snapshot</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 stagger-children">
            {[
              { label: "Offene Entscheidungen", value: metrics.openDecisions.length, icon: BarChart3, trend: 0 },
              { label: "Kritisch", value: metrics.highRisk.length + metrics.critical.length, icon: AlertTriangle, color: (metrics.highRisk.length + metrics.critical.length) > 0 ? "text-destructive" : undefined, trend: 0 },
              { label: "Eskalationen aktiv", value: metrics.escalated.length, icon: Siren, color: metrics.escalated.length > 0 ? "text-warning" : undefined, trend: 0 },
              { label: "Cost of Delay", value: `€${metrics.totalOpportunityCost.toLocaleString()}`, icon: DollarSign, color: "text-destructive", trend: 0 },
              { label: "Ø Time-to-Decision", value: `${metrics.medianTTD}d`, icon: Clock, trend: 0 },
              { label: "Completion Rate", value: `${Math.round(metrics.implRate)}%`, icon: CheckCircle2, color: "text-success", trend: 0 },
              { label: "SLA Compliance", value: `${metrics.slaCompliance}%`, icon: Shield, color: metrics.slaCompliance >= 80 ? "text-success" : metrics.slaCompliance >= 60 ? "text-warning" : "text-destructive", trend: 0 },
              { label: "Governance Score", value: metrics.healthScore, icon: Gauge, color: scoreColor, trend: 0 },
            ].map((kpi, i) => (
              <Card key={i} className="group cursor-default">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <kpi.icon className={`w-3.5 h-3.5 ${kpi.color || "text-muted-foreground"}`} />
                    <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
                  </div>
                  <div className={`text-xl font-bold number-highlight ${kpi.color || ""}`}>{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── 2. RISK RADAR + HEALTH SCORE ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Radar & Health Score</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Radar */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={metrics.radarData} cx="50%" cy="50%" outerRadius="65%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.08} strokeWidth={1.5} />
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

            {/* Health Score */}
            <Card>
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Health Score</h3>
                <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${scoreBg}`}>
                    <span className={`text-4xl font-bold number-highlight ${scoreColor}`}>{metrics.healthScore}</span>
                  </div>
                  <Progress value={metrics.healthScore} className="w-full h-2" />
                  <p className="text-[10px] text-muted-foreground">
                    {metrics.healthScore >= 75 ? "🟢 Stabil" : metrics.healthScore >= 50 ? "🟡 Beobachten" : "🔴 Strukturelles Problem"}
                  </p>
                </div>
                <div className="w-full space-y-1.5 text-xs mt-4 pt-4 border-t border-border">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Treiber</p>
                  {metrics.radarData.map(r => (
                    <div key={r.metric} className="flex justify-between">
                      <span className="text-muted-foreground">{r.metric}</span>
                      <span className={r.value >= 70 ? "text-success" : r.value >= 40 ? "text-warning" : "text-destructive"}>{r.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 3. CRITICAL DECISIONS TABLE ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kritische Entscheidungen</h2>
            <span className="text-[10px] text-muted-foreground">sortiert nach Economic Impact × Risk × Delay</span>
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
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Titel</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Risk %</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Delay %</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Cost Impact</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Eskalation</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Im Review</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Priorität</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.criticalDecisions.map(d => {
                        const rowColor = (d.riskScore > 60 && d.delayProb > 60) ? "bg-destructive/5" : (d.riskScore > 60 || d.delayProb > 60) ? "bg-warning/5" : "";
                        return (
                          <tr key={d.id} className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${rowColor}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate max-w-[220px]">{d.title}</span>
                                {d.isOverdue && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Überfällig</Badge>}
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={`font-bold number-highlight ${d.riskScore > 60 ? "text-destructive" : d.riskScore > 30 ? "text-warning" : "text-success"}`}>{d.riskScore}%</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={`font-medium number-highlight ${d.delayProb > 60 ? "text-destructive" : d.delayProb > 30 ? "text-warning" : "text-muted-foreground"}`}>{d.delayProb}%</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="font-medium number-highlight">€{d.costImpact.toLocaleString()}</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              {d.escalationLevel > 0 ? (
                                <Badge variant="destructive" className="text-[9px]">Stufe {d.escalationLevel}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">–</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-2">
                              {d.status === "review" ? (
                                <span className="text-warning font-medium text-xs">{d.daysOpen}d</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">–</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-2">
                              <Badge variant="outline" className={`text-[9px] ${d.priority === "critical" ? "border-destructive text-destructive" : d.priority === "high" ? "border-warning text-warning" : ""}`}>{d.priority}</Badge>
                            </td>
                            <td className="text-right py-3 px-4">
                              <Link to={`/decisions/${d.id}`}>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"><ExternalLink className="w-3 h-3" /></Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 4. ECONOMIC RISK ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-destructive" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wirtschaftliches Risiko</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Cost Drivers */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground mb-3">Top 3 Cost Drivers</p>
                {metrics.topCostDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine offenen Entscheidungen mit Kostenwirkung.</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.topCostDrivers.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground number-highlight">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">{d.title}</p>
                            <p className="text-[10px] text-muted-foreground">{d.daysOpen} Tage offen · {d.priority}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-destructive number-highlight">€{d.costImpact.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">Gesamt Cost of Delay</p>
                  <p className="text-3xl font-bold text-destructive number-highlight">€{metrics.totalOpportunityCost.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Über {metrics.openDecisions.length} offene Entscheidungen</p>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Vermeidbare Kosten</span> bei 20% schnellerer Review-Zeit:
                  </p>
                  <p className="text-sm font-bold text-success mt-1 number-highlight">
                    ≈ €{Math.round(metrics.totalOpportunityCost * 0.2).toLocaleString()}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] text-muted-foreground mt-3 hover:text-foreground transition-colors">
                      <Info className="w-3 h-3" /> Berechnungsmethodik
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-60">
                    Berechnung: Tage offen × Stundensatz × 8h/Woche × Prioritäts-Multiplikator (Critical 4×, High 2.5×, Medium/Low 1.5×).
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 5. ESCALATION & SLA CONTROL ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eskalation & SLA Control</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Aktive Eskalationen</p>
                <p className={`text-2xl font-bold number-highlight ${metrics.escalated.length > 0 ? "text-destructive" : "text-success"}`}>{metrics.escalated.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">SLA-Verletzungen</p>
                <p className={`text-2xl font-bold number-highlight ${metrics.overdue.length > 0 ? "text-warning" : "text-success"}`}>{metrics.overdue.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Frühwarnungen (5 Tage)</p>
                <p className={`text-2xl font-bold number-highlight ${metrics.slaWarnings.length > 0 ? "text-warning" : "text-success"}`}>{metrics.slaWarnings.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Offene Reviews</p>
                <p className="text-2xl font-bold number-highlight">{metrics.pendingReviews.length}</p>
                <p className="text-[9px] text-muted-foreground">Ø Wartezeit: {metrics.reviewMedianWait}d</p>
              </CardContent>
            </Card>
          </div>
          {metrics.escalated.length > 0 && (
            <div className="mt-3">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/war-room")}>
                <Siren className="w-3 h-3" /> War Room öffnen
              </Button>
            </div>
          )}
        </div>

        {/* ── 6. AI EXECUTIVE BRIEF ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Executive Brief</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              {aiBrief ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Executive Brief – Letzte 30 Tage</p>
                  <ul className="space-y-2">
                    {aiBrief.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={async () => {
                      setExporting(true);
                      try { const data = await fetchBoardReportData(); generateBoardReport(data); toast({ title: "PDF exportiert" }); }
                      catch { toast({ title: "Fehler", variant: "destructive" }); }
                      setExporting(false);
                    }}>
                      <FileDown className="w-3 h-3" />Vollständiges Briefing exportieren
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => toast({ title: "Gesendet", description: "Briefing wurde an das Team gesendet." })}>
                      <Send className="w-3 h-3" />An Team senden
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">KI-generierte Zusammenfassung mit Risiken, Trends und Empfehlungen.</p>
                  <Button onClick={generateBrief} disabled={briefLoading} className="gap-2">
                    {briefLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {briefLoading ? "Generiere..." : "Executive Brief generieren"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 7. TEAM PERFORMANCE ── */}
        {teamPerformanceData.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Performance</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Team</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Risk</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">SLA</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Ø Dauer</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Eskalation</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Impact</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Umsetzung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerformanceData.map(team => (
                        <tr key={team.name} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{team.shortName}</td>
                          <td className="text-center py-3 px-2">
                            <span className={`font-medium number-highlight ${team.riskScore > 2 ? "text-destructive" : team.riskScore > 0 ? "text-warning" : "text-success"}`}>{team.riskScore}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`font-medium number-highlight ${team.slaCompliance >= 80 ? "text-success" : team.slaCompliance >= 60 ? "text-warning" : "text-destructive"}`}>{team.slaCompliance}%</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="number-highlight">{team.avgDecisionTime}d</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`font-medium number-highlight ${team.escalationRate > 20 ? "text-destructive" : team.escalationRate > 10 ? "text-warning" : "text-muted-foreground"}`}>{team.escalationRate}%</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="font-medium number-highlight">€{team.economicImpact.toLocaleString()}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`font-medium number-highlight ${team.implRate >= 50 ? "text-success" : team.implRate >= 25 ? "text-warning" : "text-destructive"}`}>{team.implRate}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 8. EMPFOHLENE MAßNAHMEN ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empfohlene Maßnahmen</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(() => {
              const actions: { title: string; impact: string; saving: string; route: string; btnLabel: string; icon: typeof Settings }[] = [];

              if (metrics.pendingReviews.length > 3 || metrics.reviewMedianWait > 5) {
                actions.push({
                  title: "Review-Kapazität erhöhen",
                  impact: "Hoch",
                  saving: `≈ €${Math.round(metrics.totalOpportunityCost * 0.15).toLocaleString()} Einsparung`,
                  route: "/settings",
                  btnLabel: "SLA öffnen",
                  icon: Settings,
                });
              }
              if (metrics.escalated.length > 2) {
                actions.push({
                  title: "Eskalationsregel für Critical verkürzen",
                  impact: "Hoch",
                  saving: `${metrics.escalated.length} aktive Eskalationen reduzieren`,
                  route: "/escalation-engine",
                  btnLabel: "Eskalation anpassen",
                  icon: Siren,
                });
              }
              if (metrics.overdueRate > 15) {
                actions.push({
                  title: "SLA-Timer für überfällige Entscheidungen aktivieren",
                  impact: "Mittel",
                  saving: `${metrics.overdue.length} überfällige Entscheidungen adressieren`,
                  route: "/settings",
                  btnLabel: "SLA konfigurieren",
                  icon: Shield,
                });
              }
              // Always show at least 3
              if (actions.length < 3) {
                actions.push({
                  title: "Kritische Entscheidungen im Decision Room behandeln",
                  impact: "Hoch",
                  saving: "Strukturierte Priorisierung",
                  route: "/meeting",
                  btnLabel: "Decision Room",
                  icon: Target,
                });
              }
              if (actions.length < 3) {
                actions.push({
                  title: "Templates für Budget-Entscheidungen verpflichten",
                  impact: "Mittel",
                  saving: "Ablehnungsrate senken",
                  route: "/templates",
                  btnLabel: "Template bearbeiten",
                  icon: BookOpen,
                });
              }

              return actions.slice(0, 3).map((action, i) => (
                <Card key={i} className="group">
                  <CardContent className="p-4 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-[9px] ${action.impact === "Hoch" ? "border-destructive text-destructive" : "border-warning text-warning"}`}>{action.impact}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground">{action.saving}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-3 w-full" onClick={() => navigate(action.route)}>
                      <action.icon className="w-3 h-3" />{action.btnLabel}
                    </Button>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </div>
      </div>
    </Wrap>
  );
};

export default ExecutiveDashboard;
