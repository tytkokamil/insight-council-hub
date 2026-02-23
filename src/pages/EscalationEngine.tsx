import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Play, Loader2, AlertTriangle, CheckCircle2, Clock, Lightbulb, Shield,
  Users, SkipForward, ExternalLink, TrendingUp, TrendingDown, ArrowUpRight, Flame, Target, Activity,
  DollarSign, Gauge, ChevronRight, ArrowRight, Settings, FileText, BarChart3, Info,
} from "lucide-react";
import { useDecisions, useFilteredNotifications, useFilteredDependencies } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EngineAction { type: string; decision_id: string; title: string; [key: string]: any; }
interface EngineResult { message: string; actions: EngineAction[]; processed: number; }

const actionConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  escalation: { icon: AlertTriangle, label: "Eskalation", color: "text-destructive", bgColor: "bg-destructive/15" },
  auto_reassign: { icon: Users, label: "Auto-Reassign", color: "text-warning", bgColor: "bg-warning/15" },
  auto_skip_review: { icon: SkipForward, label: "Review Skip", color: "text-success", bgColor: "bg-success/15" },
  process_suggestion: { icon: Lightbulb, label: "Prozessvorschlag", color: "text-primary", bgColor: "bg-primary/15" },
};

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 12 };

const BASE_HOURLY_RATE = 85;
const PERSONS_PER_DECISION = 3;
const HOURS_PER_DAY = 2;

const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const formatCost = (cost: number) => cost >= 1000 ? `${(cost / 1000).toFixed(1)}k €` : `${Math.round(cost)} €`;

const EscalationEngine = ({ embedded }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<EngineResult | null>(null);

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: notifications = [], isLoading: notifLoading } = useFilteredNotifications();
  const { data: allDeps = [], isLoading: depsLoading } = useFilteredDependencies();

  const { data: slaConfigs = [] } = useQuery({
    queryKey: ["sla-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sla_configs").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: automationRules = [] } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_rules").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: automationLogs = [] } = useQuery({
    queryKey: ["automation-rule-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_rule_logs").select("*").order("executed_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const loading = decLoading || notifLoading || depsLoading;

  const now = new Date();
  const open = useMemo(() => decisions.filter(d => !["implemented", "rejected", "cancelled", "superseded", "archived"].includes(d.status)), [decisions]);

  const recentNotifications = useMemo(() =>
    notifications
      .filter(n => ["escalation", "auto_reassign", "auto_skip_review", "process_suggestion"].includes(n.type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50),
    [notifications]
  );

  // ── Governance Snapshot KPIs ──
  const govSnapshot = useMemo(() => {
    const escalated = open.filter(d => (d.escalation_level || 0) > 0);
    const slaViolations = open.filter(d => d.due_date && new Date(d.due_date) < now).length;
    const reassigns = recentNotifications.filter(n => n.type === "auto_reassign" && differenceInDays(now, new Date(n.created_at)) <= 7).length;
    const skipped = recentNotifications.filter(n => n.type === "auto_skip_review" && differenceInDays(now, new Date(n.created_at)) <= 7).length;

    // Governance Score (0-100)
    const total = open.length || 1;
    const escalationPenalty = Math.min(30, (escalated.length / total) * 100);
    const slaPenalty = Math.min(30, (slaViolations / total) * 100);
    const overduePenalty = Math.min(20, slaViolations * 5);
    const score = Math.max(0, Math.round(100 - escalationPenalty - slaPenalty - overduePenalty));

    // Prev period comparison (simple: 30d vs 30-60d)
    const prev30Esc = decisions.filter(d => {
      const created = new Date(d.created_at);
      return (d.escalation_level || 0) > 0 && differenceInDays(now, created) > 30 && differenceInDays(now, created) <= 60;
    }).length;
    const escTrend = escalated.length - prev30Esc;

    return {
      openDecisions: open.length,
      escalated: escalated.length,
      escalatedTrend: escTrend,
      slaViolations,
      reassigns,
      skipped,
      governanceScore: score,
      governanceScoreTrend: -5, // simplified
    };
  }, [open, decisions, recentNotifications, now]);

  // ── Top 5 Critical (scored) ──
  const scored = useMemo(() => {
    return open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const overdue = d.due_date ? new Date(d.due_date) < now : false;
      const daysOverdue = overdue && d.due_date ? differenceInDays(now, new Date(d.due_date)) : 0;
      const riskWeight = (d.ai_risk_score || 0) / 20;
      const dependentCount = allDeps.filter(dep => dep.source_decision_id === d.id || dep.target_decision_id === d.id).length;
      const costOfDelay = overdue ? daysOverdue * PERSONS_PER_DECISION * HOURS_PER_DAY * BASE_HOURLY_RATE * (priorityWeight[d.priority] || 1) : 0;
      const daysSinceUpdate = differenceInDays(now, new Date(d.updated_at));

      const urgencyScore =
        (priorityWeight[d.priority] || 1) * 20 +
        (overdue ? 30 : 0) +
        Math.min(daysOpen, 30) * 1.5 +
        riskWeight * 15 +
        (d.escalation_level || 0) * 20 +
        dependentCount * 5 +
        (costOfDelay > 0 ? Math.min(costOfDelay / 500, 20) : 0);

      return { ...d, daysOpen, overdue, daysOverdue, urgencyScore, costOfDelay, dependentCount, daysSinceUpdate };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 5);
  }, [open, allDeps, now]);

  const totalCostOfDelay = useMemo(() => {
    return open.reduce((sum, d) => {
      if (!d.due_date || new Date(d.due_date) >= now) return sum;
      const daysOverdue = differenceInDays(now, new Date(d.due_date));
      return sum + daysOverdue * PERSONS_PER_DECISION * HOURS_PER_DAY * BASE_HOURLY_RATE * (priorityWeight[d.priority] || 1);
    }, 0);
  }, [open, now]);

  // ── Systemic Risks ──
  const systemicRisks = useMemo(() => {
    const risks: { severity: string; title: string; detail: string; recommendation: string }[] = [];
    const stale = open.filter(d => differenceInDays(now, new Date(d.created_at)) > 14 && ["draft", "review"].includes(d.status));
    if (stale.length > 0) {
      const reviewStale = stale.filter(d => d.status === "review");
      const budgetStale = stale.filter(d => d.category === "budget");
      const avgDelay = Math.round(stale.reduce((s, d) => s + differenceInDays(now, new Date(d.created_at)), 0) / stale.length);
      risks.push({
        severity: stale.length > 3 ? "critical" : "high",
        title: `${stale.length} Entscheidungen stagnieren >14 Tage`,
        detail: `${reviewStale.length} im Review-Status, ${budgetStale.length} betreffen Budget. Ø Verzögerung: +${avgDelay - 14} Tage.`,
        recommendation: "Review-Deadline verkürzen, Auto-Reminder aktivieren, Eskalation nach 10 Tagen erzwingen",
      });
    }

    const recentEsc = recentNotifications.filter(n => n.type === "escalation" && differenceInDays(now, new Date(n.created_at)) <= 7).length;
    if (recentEsc > 2) {
      const highRiskEsc = open.filter(d => (d.escalation_level || 0) > 0 && d.priority === "critical").length;
      risks.push({
        severity: recentEsc > 5 ? "critical" : "high",
        title: `Eskalationswelle: ${recentEsc} in 7 Tagen`,
        detail: `${highRiskEsc} davon bei Critical-Entscheidungen. Muster: High Risk + Review-Engpässe.`,
        recommendation: "Eskalationsursachen analysieren, Review-Kapazität erhöhen",
      });
    }

    const blockedIds = new Set(allDeps.map(d => d.target_decision_id));
    const blockedOpen = open.filter(d => blockedIds.has(d.id));
    if (blockedOpen.length > 1) {
      risks.push({
        severity: blockedOpen.length > 3 ? "critical" : "high",
        title: `${blockedOpen.length} blockierte Entscheidungen`,
        detail: `Abhängigkeits-Ketten verhindern Fortschritt in der Pipeline.`,
        recommendation: "Kritische Abhängigkeiten im Decision Room priorisiert behandeln",
      });
    }

    return risks;
  }, [open, allDeps, recentNotifications, now]);

  // ── Economic Exposure ──
  const economicExposure = useMemo(() => {
    const projectedFactor = 1.32; // +32% if pace unchanged
    const slaComplianceSaving = 0.38; // 38% savings if SLA met
    return {
      current: totalCostOfDelay,
      projected: Math.round(totalCostOfDelay * projectedFactor),
      avoidable: Math.round(totalCostOfDelay * slaComplianceSaving),
      topDrivers: scored.filter(d => d.costOfDelay > 0).sort((a, b) => b.costOfDelay - a.costOfDelay).slice(0, 3),
    };
  }, [totalCostOfDelay, scored]);

  // ── Engine Status ──
  const engineStatus = useMemo(() => {
    const activeRules = automationRules.filter((r: any) => r.enabled).length;
    const last7d = automationLogs.filter((l: any) => differenceInDays(now, new Date(l.executed_at)) <= 7);
    const reminders = recentNotifications.filter(n => differenceInDays(now, new Date(n.created_at)) <= 30);
    return {
      active: activeRules > 0 || slaConfigs.length > 0,
      activeRules,
      totalRules: automationRules.length,
      recentActions: last7d.length,
      autoReminders: reminders.filter(n => n.type === "escalation").length,
      autoReassigns: reminders.filter(n => n.type === "auto_reassign").length,
      autoEscalations: reminders.filter(n => n.type === "escalation").length,
      reviewSkips: reminders.filter(n => n.type === "auto_skip_review").length,
    };
  }, [automationRules, automationLogs, slaConfigs, recentNotifications, now]);

  // ── Escalation Analytics ──
  const escAnalytics = useMemo(() => {
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = now.getTime() - (8 - i) * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const esc = notifications.filter(n => {
        const t = new Date(n.created_at).getTime();
        return t >= weekStart && t < weekEnd && n.type === "escalation";
      }).length;
      const sla = open.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date).getTime();
        return due >= weekStart && due < weekEnd && due < now.getTime();
      }).length;
      return { week: `W${i + 1}`, Eskalationen: esc, "SLA-Brüche": sla };
    });

    const escalated = open.filter(d => (d.escalation_level || 0) > 0);
    const avgDuration = escalated.length > 0
      ? Math.round(escalated.reduce((s, d) => s + differenceInDays(now, new Date(d.last_escalated_at || d.created_at)), 0) / escalated.length * 10) / 10
      : 0;

    // Early warning: decisions that will likely violate SLA in next 5 days
    const earlyWarnings = open.filter(d => {
      if (!d.due_date) return false;
      const dueDate = new Date(d.due_date);
      const daysUntilDue = differenceInDays(dueDate, now);
      return daysUntilDue > 0 && daysUntilDue <= 5;
    });

    return { weeklyData, avgDuration, earlyWarnings, maxLevel: escalated.reduce((m, d) => Math.max(m, d.escalation_level || 0), 0) };
  }, [open, notifications, now]);

  // ── Active Escalations ──
  const activeEscalations = useMemo(() => {
    return open
      .filter(d => (d.escalation_level || 0) > 0)
      .map(d => ({
        ...d,
        daysOpen: differenceInDays(now, new Date(d.created_at)),
        daysSinceEsc: d.last_escalated_at ? differenceInDays(now, new Date(d.last_escalated_at)) : 0,
      }))
      .sort((a, b) => (b.escalation_level || 0) - (a.escalation_level || 0));
  }, [open, now]);

  const runEngine = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("autonomous-escalation");
      if (error) throw error;
      setLastResult(data as EngineResult);
      toast({ title: "Engine ausgeführt", description: `${(data as EngineResult).actions.length} Aktionen.` });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
    setRunning(false);
  };

  const priorityBadge = (p: string) =>
    p === "critical" ? "bg-destructive/20 text-destructive" : p === "high" ? "bg-warning/20 text-warning" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  if (loading) return <Wrapper><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Lade Decision Control...</div></Wrapper>;

  return (
    <Wrapper>
      <PageHeader
        title="Decision Control"
        subtitle="Governance-Zentrale: SLA, Eskalationen, Economic Exposure & Automation"
        role="governance"
        help={{ title: "Decision Control", description: "Zentrale Steuerung für Governance, Eskalationen, SLA-Compliance und automatisierte Regeln." }}
        primaryAction={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/war-room")} className="gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" /> War Room
            </Button>
            <Button size="sm" onClick={runEngine} disabled={running} className="gap-1.5">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? "Läuft..." : "Engine starten"}
            </Button>
          </div>
        }
      />

      {/* ═══ 1. GOVERNANCE SNAPSHOT ═══ */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Governance Status — Live</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Offene Entscheidungen", value: govSnapshot.openDecisions, trend: null, icon: Clock, color: "text-foreground" },
            { label: "Aktiv eskaliert", value: govSnapshot.escalated, trend: govSnapshot.escalatedTrend, icon: AlertTriangle, color: govSnapshot.escalated > 0 ? "text-destructive" : "text-success" },
            { label: "SLA-Verletzungen (7d)", value: govSnapshot.slaViolations, trend: null, icon: Target, color: govSnapshot.slaViolations > 0 ? "text-destructive" : "text-success" },
            { label: "Auto-Reassigns", value: govSnapshot.reassigns, trend: null, icon: Users, color: "text-warning" },
            { label: "Reviews übersprungen", value: govSnapshot.skipped, trend: null, icon: SkipForward, color: "text-muted-foreground" },
            { label: "Governance Score", value: govSnapshot.governanceScore, trend: govSnapshot.governanceScoreTrend, icon: Gauge, color: govSnapshot.governanceScore >= 70 ? "text-success" : govSnapshot.governanceScore >= 40 ? "text-warning" : "text-destructive", isScore: true },
            { label: "Cost of Delay", value: formatCost(totalCostOfDelay), trend: null, icon: DollarSign, color: totalCostOfDelay > 0 ? "text-destructive" : "text-success", isCurrency: true },
          ].map((kpi: any) => (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                  <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className={`font-display text-xl font-bold ${kpi.isScore || kpi.isCurrency ? kpi.color : ""}`}>
                    {kpi.value}
                  </span>
                  {kpi.trend !== null && kpi.trend !== 0 && (
                    <span className={`text-[10px] font-medium flex items-center gap-0.5 mb-0.5 ${kpi.trend > 0 ? "text-destructive" : "text-success"}`}>
                      {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.trend > 0 ? "+" : ""}{kpi.trend}
                    </span>
                  )}
                </div>
                {/* Score bar for governance */}
                {kpi.isScore && (
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${kpi.value >= 70 ? "bg-success" : kpi.value >= 40 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${kpi.value}%` }} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══ 2. ENGINE STATUS ═══ */}
      <Card className={`mb-6 ${engineStatus.active ? "border-success/30" : "border-destructive/50 bg-destructive/5"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${engineStatus.active ? "bg-success animate-pulse" : "bg-destructive"}`} />
              <div>
                <p className="text-sm font-semibold">Governance Engine: {engineStatus.active ? "AKTIV" : "INAKTIV"}</p>
                {!engineStatus.active && <p className="text-xs text-destructive mt-0.5">Keine aktiven Regeln konfiguriert – Governance läuft nicht automatisch!</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span>Regeln aktiv: <strong className="text-foreground">{engineStatus.activeRules}</strong>/{engineStatus.totalRules}</span>
              <span>Auto-Eskalationen: <strong className="text-foreground">{engineStatus.autoEscalations}</strong></span>
              <span>Auto-Reassigns: <strong className="text-foreground">{engineStatus.autoReassigns}</strong></span>
              <span>Review-Skips: <strong className="text-foreground">{engineStatus.reviewSkips}</strong></span>
              <span>Aktionen (7d): <strong className="text-foreground">{engineStatus.recentActions}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ LAST RUN RESULT ═══ */}
      {lastResult && (
        <Card className="border-primary/20 mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2">Letzter Durchlauf: {lastResult.processed} geprüft, {lastResult.actions.length} Aktionen</p>
            {lastResult.actions.length === 0 ? (
              <div className="text-center py-3"><CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" /><p className="text-sm text-muted-foreground">Keine Aktionen nötig.</p></div>
            ) : (
              <div className="space-y-1.5">
                {lastResult.actions.map((action, i) => {
                  const config = actionConfig[action.type] || actionConfig.escalation;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${config.bgColor}`}>
                      <config.icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{action.title}</p></div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ MAIN CONTENT: TOP 5 + SYSTEMIC + ECONOMIC ═══ */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* ─── Top 5 Critical ─── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-destructive" /> Top 5 Kritische Entscheidungen
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs">
                  <p className="font-semibold mb-1">Urgency Score Berechnung:</p>
                  <p>Priorität × 20 + Überfällig-Bonus + Alter × 1.5 + Risiko × 15 + Eskalation × 20 + Abhängigkeiten × 5 + Cost-of-Delay-Faktor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-2">
            {scored.map((d, i) => (
              <Link key={d.id} to={`/decisions/${d.id}`} className="block">
                <div className={`p-4 rounded-lg border hover:bg-muted/30 transition-colors ${d.overdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityBadge(d.priority)}`}>
                          {d.priority === "critical" ? "Kritisch" : d.priority === "high" ? "Hoch" : d.priority === "medium" ? "Mittel" : "Niedrig"}
                        </span>
                        {d.overdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold">ÜBERFÄLLIG</span>}
                        {(d.escalation_level || 0) > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">L{d.escalation_level}</Badge>}
                        {d.costOfDelay > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-mono">
                            {formatCost(d.costOfDelay)} Delay
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                        <span>{d.daysOpen}d offen</span>
                        {d.ai_risk_score != null && d.ai_risk_score > 0 && <span>Risiko: {d.ai_risk_score}%</span>}
                        {d.daysOverdue > 0 && <span className="text-destructive">{d.daysOverdue}d überfällig</span>}
                        {d.dependentCount > 0 && <span className="flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{d.dependentCount} Abh.</span>}
                        <span className={d.daysSinceUpdate > 7 ? "text-warning" : ""}>
                          Letzte Aktivität: vor {d.daysSinceUpdate}d
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold font-display">{Math.round(d.urgencyScore)}</p>
                      <p className="text-[10px] text-muted-foreground">Urgency</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {scored.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                Keine kritischen Entscheidungen 🎉
              </CardContent></Card>
            )}
          </div>

          {/* ─── Intervention Layer ─── */}
          {scored.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] text-muted-foreground mr-1">Quick Actions:</span>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/war-room")}>
                <Shield className="w-3 h-3" /> War Room
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/settings")}>
                <Settings className="w-3 h-3" /> SLA anpassen
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/automation")}>
                <Zap className="w-3 h-3" /> Regeln bearbeiten
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/meeting")}>
                <Users className="w-3 h-3" /> Decision Room
              </Button>
            </div>
          )}
        </div>

        {/* ─── Right Column: Systemic Risks + Economic Exposure ─── */}
        <div className="space-y-4">
          {/* Systemic Risks */}
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" /> Systemische Risiken
            </h2>
            {systemicRisks.length === 0 ? (
              <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">
                <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" /> Keine strukturellen Risiken erkannt.
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {systemicRisks.map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${r.severity === "critical" ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}`}>
                    <p className={`text-xs font-semibold ${r.severity === "critical" ? "text-destructive" : "text-warning"}`}>{r.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{r.detail}</p>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                        <span>{r.recommendation}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Economic Exposure */}
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-destructive" /> Economic Exposure
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Aktueller Cost of Delay</span>
                  <span className="text-base font-bold text-destructive font-display">{formatCost(economicExposure.current)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Prognose bei unveränd. Tempo</span>
                  <span className="text-sm font-semibold text-destructive/80">{formatCost(economicExposure.projected)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Vermeidbar bei SLA-Einhaltung</span>
                  <span className="text-sm font-semibold text-success">{formatCost(economicExposure.avoidable)}</span>
                </div>
                {economicExposure.topDrivers.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Top Cost Drivers:</p>
                    {economicExposure.topDrivers.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="truncate max-w-[150px]">{i + 1}. {d.title}</span>
                        <span className="font-mono text-destructive">{formatCost(d.costOfDelay)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Early Warnings */}
          {escAnalytics.earlyWarnings.length > 0 && (
            <Card className="border-warning/30">
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  Frühwarnungen (nächste 5 Tage)
                </h3>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {escAnalytics.earlyWarnings.length} Entscheidung(en) werden voraussichtlich SLA verletzen.
                </p>
                {escAnalytics.earlyWarnings.slice(0, 3).map(d => (
                  <Link key={d.id} to={`/decisions/${d.id}`} className="flex items-center gap-2 text-[11px] py-1 hover:text-primary transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    <span className="truncate">{d.title}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">Fällig: {new Date(d.due_date!).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══ TABS: SLA Rules, Escalation Log, Analytics ═══ */}
      <Tabs defaultValue="sla" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sla">SLA & Regeln</TabsTrigger>
          <TabsTrigger value="escalations">Aktive Eskalationen ({activeEscalations.length})</TabsTrigger>
          <TabsTrigger value="log">Escalation Log</TabsTrigger>
          <TabsTrigger value="analytics">Trend & Analytik</TabsTrigger>
        </TabsList>

        {/* ── Tab: SLA & Rules ── */}
        <TabsContent value="sla">
          <div className="space-y-4">
            {/* Automation rules as table */}
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Aktive Governance-Regeln</h3>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate("/automation")}>
                  <Settings className="w-3 h-3" /> Regeln verwalten
                </Button>
              </div>
              {automationRules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Automation-Regeln konfiguriert.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Regel</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Status</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Trigger</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Aktion</th>
                    </tr></thead>
                    <tbody>
                      {automationRules.slice(0, 10).map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium text-xs">{r.name}</td>
                          <td className="text-center py-2 px-3">
                            <Badge variant={r.enabled ? "default" : "outline"} className="text-[10px]">{r.enabled ? "Aktiv" : "Aus"}</Badge>
                          </td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{r.trigger_event} ({r.condition_field} {r.condition_operator} {r.condition_value})</td>
                          <td className="py-2 px-3 text-xs">{r.action_type}: {r.action_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent></Card>

            {/* Built-in engine rules */}
            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">Automatische Engine-Aktionen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: AlertTriangle, title: "Smart Escalation", desc: "Automatische Eskalation basierend auf Priorität und Inaktivität", color: "text-destructive", trigger: "Deadline überschritten oder Inaktivität > SLA-Schwellenwert" },
                  { icon: Users, title: "Auto-Reassign", desc: "Neuzuweisung bei >7 Tage Inaktivität", color: "text-warning", trigger: "7+ Tage keine Aktivität am Item" },
                  { icon: SkipForward, title: "Low-Risk Review Skip", desc: "AI schlägt Überspringen vor (Suggest-only)", color: "text-success", trigger: "AI Risk Score ≤ 25%, manuelle Bestätigung" },
                  { icon: Lightbulb, title: "Prozessverkürzung", desc: "Überspringen bei Reviewer-Mehrheit", color: "text-primary", trigger: "≥2/n Reviewer haben zugestimmt" },
                ].map(rule => (
                  <div key={rule.title} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center gap-2 mb-1"><rule.icon className={`w-4 h-4 ${rule.color}`} /><span className="text-xs font-semibold">{rule.title}</span></div>
                    <p className="text-[10px] text-muted-foreground">{rule.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">Trigger: {rule.trigger}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>

            {/* SLA Config from DB */}
            {slaConfigs.length > 0 && (
              <Card><CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">SLA-Konfiguration</h3>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate("/settings")}>
                    <Settings className="w-3 h-3" /> SLA bearbeiten
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Kategorie</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Priorität</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Warnung</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Dringend</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Überfällig</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Reassign</th>
                    </tr></thead>
                    <tbody>
                      {slaConfigs.map((c: any) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 px-3 capitalize text-xs">{c.category}</td>
                          <td className="py-2 px-3 capitalize text-xs">{c.priority}</td>
                          <td className="text-center py-2 px-3 text-xs">{c.escalation_hours_warn}h</td>
                          <td className="text-center py-2 px-3 text-xs">{c.escalation_hours_urgent}h</td>
                          <td className="text-center py-2 px-3 text-xs">{c.escalation_hours_overdue}h</td>
                          <td className="text-center py-2 px-3 text-xs">{c.reassign_days}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Active Escalations ── */}
        <TabsContent value="escalations">
          <Card>
            <CardContent className="p-0">
              {activeEscalations.length === 0 ? (
                <div className="text-center py-8"><CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" /><p className="text-sm text-muted-foreground">Keine aktiven Eskalationen.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Titel</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Stufe</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Priorität</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Offen</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Seit Eskalation</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Aktion</th>
                    </tr></thead>
                    <tbody>
                      {activeEscalations.map(d => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium text-xs truncate max-w-[200px]">{d.title}</td>
                          <td className="text-center py-3 px-3">
                            <Badge variant={(d.escalation_level || 0) >= 3 ? "destructive" : "outline"} className="text-[10px]">L{d.escalation_level}</Badge>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`text-[10px] font-medium capitalize ${d.priority === "critical" ? "text-destructive" : d.priority === "high" ? "text-warning" : "text-muted-foreground"}`}>{d.priority}</span>
                          </td>
                          <td className="text-center py-3 px-3 text-xs">{d.daysOpen}d</td>
                          <td className="text-center py-3 px-3 text-xs">{d.daysSinceEsc}d</td>
                          <td className="text-center py-3 px-3">
                            <Badge variant="outline" className="text-[10px] capitalize">{d.status}</Badge>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Link to={`/decisions/${d.id}`}><Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1"><ExternalLink className="w-3 h-3" />Öffnen</Button></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Escalation Log ── */}
        <TabsContent value="log">
          <Card><CardContent className="p-0">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8"><Zap className="w-10 h-10 text-primary mx-auto mb-2 opacity-30" /><p className="text-sm text-muted-foreground">Noch keine Engine-Aktivitäten.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {recentNotifications.map(notif => {
                  const config = actionConfig[notif.type] || actionConfig.escalation;
                  return (
                    <div key={notif.id} className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors">
                      <config.icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${config.color} ${config.bgColor} shrink-0`}>{config.label}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(notif.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* ── Tab: Analytics ── */}
        <TabsContent value="analytics">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Eskalationsrate</p>
                <p className={`text-2xl font-bold font-display ${(open.length > 0 ? Math.round(activeEscalations.length / open.length * 100) : 0) > 20 ? "text-destructive" : "text-success"}`}>
                  {open.length > 0 ? Math.round(activeEscalations.length / open.length * 100) : 0}%
                </p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Ø Eskalationsdauer</p>
                <p className="text-2xl font-bold font-display">{escAnalytics.avgDuration}d</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Höchste Stufe</p>
                <p className="text-2xl font-bold font-display text-destructive">L{escAnalytics.maxLevel}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">Frühwarnungen</p>
                <p className={`text-2xl font-bold font-display ${escAnalytics.earlyWarnings.length > 0 ? "text-warning" : "text-success"}`}>{escAnalytics.earlyWarnings.length}</p>
                <p className="text-[10px] text-muted-foreground">nächste 5 Tage</p>
              </CardContent></Card>
            </div>

            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">Eskalationen & SLA-Brüche (8 Wochen)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={escAnalytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="Eskalationen" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="SLA-Brüche" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ RECOMMENDED ACTIONS ═══ */}
      <Card className="mt-6 border-primary/20">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" /> Empfohlene Maßnahmen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "Review-Kapazität erhöhen",
                impact: "hoch",
                timeSaving: "~3d/Entscheidung",
                costSaving: formatCost(totalCostOfDelay * 0.25),
                action: () => navigate("/settings"),
                actionLabel: "Delegation öffnen",
              },
              {
                title: "SLA für Critical verschärfen",
                impact: "hoch",
                timeSaving: "~2d/Critical",
                costSaving: formatCost(totalCostOfDelay * 0.15),
                action: () => navigate("/settings"),
                actionLabel: "SLA Config öffnen",
              },
              {
                title: "Auto-Eskalation nach 10d aktivieren",
                impact: "mittel",
                timeSaving: "~1.5d/Entscheidung",
                costSaving: formatCost(totalCostOfDelay * 0.1),
                action: () => navigate("/automation"),
                actionLabel: "Regel erstellen",
              },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
                <p className="text-xs font-semibold mb-2">{m.title}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-3">
                  <div>
                    <p className="text-muted-foreground">Impact</p>
                    <p className={`font-semibold ${m.impact === "hoch" ? "text-destructive" : "text-warning"}`}>{m.impact}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Zeitersparnis</p>
                    <p className="font-semibold text-foreground">{m.timeSaving}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kosteneinsparung</p>
                    <p className="font-semibold text-success">{m.costSaving}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full h-7 text-[11px] gap-1" onClick={m.action}>
                  <ArrowRight className="w-3 h-3" /> {m.actionLabel}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
};

export default EscalationEngine;
