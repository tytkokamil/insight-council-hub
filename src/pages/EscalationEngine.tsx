import { useState, useMemo } from "react";
import PredictiveSlaPanel, { usePredictiveSla } from "@/components/decisions/PredictiveSlaWarning";
import { formatCost } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
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
  DollarSign, Gauge, ChevronRight, ArrowRight, Settings, FileText, BarChart3, Info, Rocket,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const EscalationEngine = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<EngineResult | null>(null);
  const [showEngineConfirm, setShowEngineConfirm] = useState(false);
  const { predictions: slaPredictions } = usePredictiveSla();
  const actionConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = useMemo(() => ({
    escalation: { icon: AlertTriangle, label: t("escalationEngine.smartEscalation"), color: "text-destructive", bgColor: "bg-destructive/15" },
    auto_reassign: { icon: Users, label: "Auto-Reassign", color: "text-warning", bgColor: "bg-warning/15" },
    auto_skip_review: { icon: SkipForward, label: "Review Skip", color: "text-success", bgColor: "bg-success/15" },
    process_suggestion: { icon: Lightbulb, label: t("escalationEngine.processShortcut"), color: "text-primary", bgColor: "bg-primary/15" },
  }), [t]);

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 12 };

  const BASE_HOURLY_RATE = 85;
  const PERSONS_PER_DECISION = 3;
  const HOURS_PER_DAY = 2;

  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

  

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: notifications = [], isLoading: notifLoading } = useFilteredNotifications();
  const { data: allDeps = [], isLoading: depsLoading } = useFilteredDependencies();

  const { data: slaConfigs = [] } = useQuery({
    queryKey: ["sla-configs"],
    queryFn: async () => { const { data, error } = await supabase.from("sla_configs").select("*"); if (error) throw error; return data ?? []; },
    staleTime: 60_000,
  });

  const { data: automationRules = [] } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => { const { data, error } = await supabase.from("automation_rules").select("*"); if (error) throw error; return data ?? []; },
    staleTime: 60_000,
  });

  const { data: automationLogs = [] } = useQuery({
    queryKey: ["automation-rule-logs"],
    queryFn: async () => { const { data, error } = await supabase.from("automation_rule_logs").select("*").order("executed_at", { ascending: false }).limit(50); if (error) throw error; return data ?? []; },
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
    const total = open.length || 1;
    const escalationPenalty = Math.min(30, (escalated.length / total) * 100);
    const slaPenalty = Math.min(30, (slaViolations / total) * 100);
    const overduePenalty = Math.min(20, slaViolations * 5);
    const score = Math.max(0, Math.round(100 - escalationPenalty - slaPenalty - overduePenalty));
    const prev30Esc = decisions.filter(d => { const created = new Date(d.created_at); return (d.escalation_level || 0) > 0 && differenceInDays(now, created) > 30 && differenceInDays(now, created) <= 60; }).length;
    const escTrend = escalated.length - prev30Esc;
    return { openDecisions: open.length, escalated: escalated.length, escalatedTrend: escTrend, slaViolations, reassigns, skipped, governanceScore: score, governanceScoreTrend: -5 };
  }, [open, decisions, recentNotifications, now]);

  // ── Top 5 Critical ──
  const scored = useMemo(() => {
    return open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const overdue = d.due_date ? new Date(d.due_date) < now : false;
      const daysOverdue = overdue && d.due_date ? differenceInDays(now, new Date(d.due_date)) : 0;
      const riskWeight = (d.ai_risk_score || 0) / 20;
      const dependentCount = allDeps.filter(dep => dep.source_decision_id === d.id || dep.target_decision_id === d.id).length;
      const costOfDelay = overdue ? daysOverdue * PERSONS_PER_DECISION * HOURS_PER_DAY * BASE_HOURLY_RATE * (priorityWeight[d.priority] || 1) : 0;
      const daysSinceUpdate = differenceInDays(now, new Date(d.updated_at));
      const urgencyScore = (priorityWeight[d.priority] || 1) * 20 + (overdue ? 30 : 0) + Math.min(daysOpen, 30) * 1.5 + riskWeight * 15 + (d.escalation_level || 0) * 20 + dependentCount * 5 + (costOfDelay > 0 ? Math.min(costOfDelay / 500, 20) : 0);
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
        title: t("escalationEngine.staleDecisions", { count: stale.length }),
        detail: t("escalationEngine.staleDetail", { reviewCount: reviewStale.length, budgetCount: budgetStale.length, avgDelay: avgDelay - 14 }),
        recommendation: t("escalationEngine.staleRec"),
      });
    }
    const recentEsc = recentNotifications.filter(n => n.type === "escalation" && differenceInDays(now, new Date(n.created_at)) <= 7).length;
    if (recentEsc > 2) {
      const highRiskEsc = open.filter(d => (d.escalation_level || 0) > 0 && d.priority === "critical").length;
      risks.push({
        severity: recentEsc > 5 ? "critical" : "high",
        title: t("escalationEngine.escalationWave", { count: recentEsc }),
        detail: t("escalationEngine.escalationWaveDetail", { critCount: highRiskEsc }),
        recommendation: t("escalationEngine.escalationWaveRec"),
      });
    }
    const blockedIds = new Set(allDeps.map(d => d.target_decision_id));
    const blockedOpen = open.filter(d => blockedIds.has(d.id));
    if (blockedOpen.length > 1) {
      risks.push({
        severity: blockedOpen.length > 3 ? "critical" : "high",
        title: t("escalationEngine.blockedDecisions", { count: blockedOpen.length }),
        detail: t("escalationEngine.blockedDetail"),
        recommendation: t("escalationEngine.blockedRec"),
      });
    }
    return risks;
  }, [open, allDeps, recentNotifications, now, t]);

  // ── Economic Exposure ──
  const economicExposure = useMemo(() => {
    const projectedFactor = 1.32;
    const slaComplianceSaving = 0.38;
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
      const esc = notifications.filter(n => { const ti = new Date(n.created_at).getTime(); return ti >= weekStart && ti < weekEnd && n.type === "escalation"; }).length;
      const sla = open.filter(d => { if (!d.due_date) return false; const due = new Date(d.due_date).getTime(); return due >= weekStart && due < weekEnd && due < now.getTime(); }).length;
      return { week: `W${i + 1}`, [t("escalationEngine.chartEscalations")]: esc, [t("escalationEngine.chartSlaBreaches")]: sla };
    });
    const escalatedList = open.filter(d => (d.escalation_level || 0) > 0);
    const avgDuration = escalatedList.length > 0 ? Math.round(escalatedList.reduce((s, d) => s + differenceInDays(now, new Date(d.last_escalated_at || d.created_at)), 0) / escalatedList.length * 10) / 10 : 0;
    const earlyWarnings = open.filter(d => { if (!d.due_date) return false; const dueDate = new Date(d.due_date); const daysUntilDue = differenceInDays(dueDate, now); return daysUntilDue > 0 && daysUntilDue <= 5; });
    return { weeklyData, avgDuration, earlyWarnings, maxLevel: escalatedList.reduce((m, d) => Math.max(m, d.escalation_level || 0), 0) };
  }, [open, notifications, now, t]);

  // ── Active Escalations ──
  const activeEscalations = useMemo(() => {
    return open.filter(d => (d.escalation_level || 0) > 0).map(d => ({
      ...d, daysOpen: differenceInDays(now, new Date(d.created_at)),
      daysSinceEsc: d.last_escalated_at ? differenceInDays(now, new Date(d.last_escalated_at)) : 0,
    })).sort((a, b) => (b.escalation_level || 0) - (a.escalation_level || 0));
  }, [open, now]);

  const runEngine = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("autonomous-escalation");
      if (error) throw error;
      setLastResult(data as EngineResult);
      toast({ title: t("escalationEngine.engineRan"), description: t("escalationEngine.engineRanDesc", { count: (data as EngineResult).actions.length }) });
    } catch (e: any) {
      toast({ title: t("escalationEngine.engineError"), description: e.message, variant: "destructive" });
    }
    setRunning(false);
  };

  const priorityBadge = (p: string) =>
    p === "critical" ? "bg-destructive/20 text-destructive" : p === "high" ? "bg-warning/20 text-warning" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  const priorityLabel = (p: string) => t(`escalationEngine.${p}`);

  const dateFmt = (dateStr: string) => {
    const locale = i18n.language === "de" ? "de-DE" : "en-US";
    return new Date(dateStr).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const dateShort = (dateStr: string) => {
    const locale = i18n.language === "de" ? "de-DE" : "en-US";
    return new Date(dateStr).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">{t("escalationEngine.loading")}</div></AppLayout>;

  if (decisions.length === 0) {
    return (
      <AppLayout>
        <PageHeader title={t("escalationEngine.title")} subtitle={t("escalationEngine.subtitle")} role="governance" help={{ title: t("escalationEngine.title"), description: t("escalationEngine.help") }} />
        <EmptyAnalysisState
          icon={Zap}
          title={t("escalationEngine.noDataTitle", { defaultValue: "Keine Entscheidungen vorhanden" })}
          description={t("escalationEngine.noDataDesc", { defaultValue: "Erstelle Entscheidungen, um Eskalationen, Fristen und systemische Risiken automatisch zu überwachen." })}
          hint={t("escalationEngine.noDataHint", { defaultValue: "Die Eskalations-Engine erkennt kritische Muster und schlägt automatisch Maßnahmen vor." })}
          features={[
            { icon: Flame, label: t("escalationEngine.featureCritical", { defaultValue: "Kritische Erkennung" }), desc: t("escalationEngine.featureCriticalDesc", { defaultValue: "Top-5 dringendste Entscheidungen automatisch priorisiert" }) },
            { icon: Activity, label: t("escalationEngine.featureSystemic", { defaultValue: "Systemische Risiken" }), desc: t("escalationEngine.featureSystemicDesc", { defaultValue: "Muster-Erkennung über Teams und Kategorien" }) },
            { icon: Settings, label: t("escalationEngine.featureAuto", { defaultValue: "Automatisierung" }), desc: t("escalationEngine.featureAutoDesc", { defaultValue: "Regelbasierte Eskalationen konfigurieren" }) },
          ]}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={t("escalationEngine.title")}
        subtitle={t("escalationEngine.subtitle")}
        role="governance"
        help={{ title: t("escalationEngine.title"), description: t("escalationEngine.help") }}
        primaryAction={
          <div className="flex items-center gap-2">
            {activeEscalations.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => navigate("/war-room")} className="gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
                      <Shield className="w-3.5 h-3.5" /> {t("escalationEngine.warRoom")}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                    {t("escalationEngine.warRoomTooltip")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <AlertDialog open={showEngineConfirm} onOpenChange={setShowEngineConfirm}>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={running} className="gap-1.5">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {running ? t("escalationEngine.engineRunning") : t("escalationEngine.engineStart")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("escalationEngine.engineConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("escalationEngine.engineConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("escalationEngine.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setShowEngineConfirm(false); runEngine(); }}>{t("escalationEngine.engineConfirmAction")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {/* ═══ ENGINE STATUS (moved before KPIs when not active) ═══ */}
      {!engineStatus.active && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-primary">{t("escalationEngine.engineOnboardingTitle")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("escalationEngine.engineOnboardingDesc")}</p>
                </div>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/automation")}>
                <Zap className="w-3.5 h-3.5" /> {t("escalationEngine.createFirstRule")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 1. GOVERNANCE SNAPSHOT ═══ */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("escalationEngine.govStatusLive")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: t("escalationEngine.openDecisions"), value: govSnapshot.openDecisions, trend: null, icon: Clock, color: "text-foreground" },
            { label: t("escalationEngine.activeEscalated"), value: govSnapshot.escalated, trend: govSnapshot.escalatedTrend, icon: AlertTriangle, color: govSnapshot.escalated > 0 ? "text-destructive" : "text-success" },
            { label: t("escalationEngine.slaViolations7d"), value: govSnapshot.slaViolations, trend: null, icon: Target, color: govSnapshot.slaViolations > 0 ? "text-destructive" : "text-success" },
            { label: t("escalationEngine.autoReassigns"), value: govSnapshot.reassigns, trend: null, icon: Users, color: "text-warning" },
            { label: t("escalationEngine.reviewsSkipped"), value: govSnapshot.skipped, trend: null, icon: SkipForward, color: "text-muted-foreground" },
            { label: t("escalationEngine.governanceScore"), value: govSnapshot.governanceScore, trend: govSnapshot.governanceScoreTrend, icon: Gauge, color: govSnapshot.governanceScore >= 70 ? "text-success" : govSnapshot.governanceScore >= 40 ? "text-warning" : "text-destructive", isScore: true, highlight: "governance" as const },
            { label: t("escalationEngine.costOfDelay"), value: formatCost(totalCostOfDelay), trend: null, icon: DollarSign, color: totalCostOfDelay > 0 ? "text-destructive" : "text-success", isCurrency: true, highlight: "cost" as const },
          ].map((kpi: any) => (
            <Card key={kpi.label} className={`relative overflow-hidden ${kpi.highlight === "cost" ? "lg:col-span-1 bg-destructive/[0.04] border-destructive/20" : kpi.highlight === "governance" ? "bg-primary/[0.04] border-primary/20" : ""}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                  <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className={`font-display text-xl font-bold tabular-nums ${kpi.highlight === "cost" ? "text-destructive" : kpi.highlight === "governance" ? "text-primary" : ""}`}>{kpi.value}</span>
                  {kpi.trend !== null && kpi.trend !== 0 && (
                    <span className={`text-[10px] font-medium flex items-center gap-0.5 mb-0.5 ${kpi.trend > 0 ? "text-destructive" : "text-success"}`}>
                      {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.trend > 0 ? "+" : ""}{kpi.trend}
                    </span>
                  )}
                </div>
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

      {/* ═══ 2. ENGINE STATUS (active state) ═══ */}
      {engineStatus.active && (
        <Card className="mb-6 border-success/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <p className="text-sm font-semibold">{t("escalationEngine.engineActive")}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span>{t("escalationEngine.rulesActive")}: <strong className="text-foreground">{engineStatus.activeRules}</strong>/{engineStatus.totalRules}</span>
                <span>{t("escalationEngine.autoEscalations")}: <strong className="text-foreground">{engineStatus.autoEscalations}</strong></span>
                <span>{t("escalationEngine.autoReassignsLabel")}: <strong className="text-foreground">{engineStatus.autoReassigns}</strong></span>
                <span>{t("escalationEngine.reviewSkips")}: <strong className="text-foreground">{engineStatus.reviewSkips}</strong></span>
                <span>{t("escalationEngine.actions7d")}: <strong className="text-foreground">{engineStatus.recentActions}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ LAST RUN RESULT ═══ */}
      {lastResult && (
        <Card className="border-primary/20 mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2">{t("escalationEngine.lastRunTitle", { processed: lastResult.processed, actions: lastResult.actions.length })}</p>
            {lastResult.actions.length === 0 ? (
              <div className="text-center py-3"><CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" /><p className="text-sm text-muted-foreground">{t("escalationEngine.noActionsNeeded")}</p></div>
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
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-destructive" /> {t("escalationEngine.top5Critical")}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs">
                  <p className="font-semibold mb-1">{t("escalationEngine.urgencyScoreDesc")}</p>
                  <p>{t("escalationEngine.urgencyFormula")}</p>
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
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityBadge(d.priority)}`}>{priorityLabel(d.priority)}</span>
                        {d.overdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold">{t("escalationEngine.overdue")}</span>}
                        {(d.escalation_level || 0) > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">L{d.escalation_level}</Badge>}
                        {d.costOfDelay > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-mono">{formatCost(d.costOfDelay)} {t("escalationEngine.delay")}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                        <span>{t("escalationEngine.daysOpen", { count: d.daysOpen })}</span>
                        {d.ai_risk_score != null && d.ai_risk_score > 0 && <span>{t("escalationEngine.risk", { value: d.ai_risk_score })}</span>}
                        {d.daysOverdue > 0 && <span className="text-destructive">{t("escalationEngine.daysOverdue", { count: d.daysOverdue })}</span>}
                        {d.dependentCount > 0 && <span className="flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{d.dependentCount} {t("escalationEngine.dependencies")}</span>}
                        <span className={d.daysSinceUpdate > 7 ? "text-warning" : ""}>{t("escalationEngine.lastActivity", { count: d.daysSinceUpdate })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-lg font-bold font-display tabular-nums cursor-help">{Math.round(d.urgencyScore)}</p>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs text-xs">
                            {t("escalationEngine.urgencyScoreTooltip", { defaultValue: "Urgency Score: Kombination aus Verzögerungskosten, Risiko, Überfälligkeit und Abhängigkeiten. Max: 300." })}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-[10px] text-muted-foreground">{t("escalationEngine.urgency")}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {scored.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />{t("escalationEngine.noCritical")}
              </CardContent></Card>
            )}
          </div>

          {scored.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] text-muted-foreground mr-1">{t("escalationEngine.quickActions")}</span>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/war-room")}><Shield className="w-3 h-3" /> {t("escalationEngine.warRoom")}</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/settings")}><Settings className="w-3 h-3" /> {t("escalationEngine.slaAdjust")}</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/automation")}><Zap className="w-3 h-3" /> {t("escalationEngine.editRules")}</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => navigate("/meeting")}><Users className="w-3 h-3" /> {t("escalationEngine.decisionRoom")}</Button>
            </div>
          )}
        </div>

        {/* ─── Right Column ─── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-warning" /> {t("escalationEngine.systemicRisks")}</h2>
            {systemicRisks.length === 0 ? (
              <Card><CardContent className="p-4 text-center text-sm text-muted-foreground"><Activity className="w-6 h-6 mx-auto mb-2 opacity-30" /> {t("escalationEngine.noSystemicRisks")}</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {systemicRisks.map((r, i) => {
                  const isEscWave = r.title.includes("Eskalation") || r.title.includes("escalation");
                  return (
                  <div key={i} className={`p-3 rounded-lg border ${r.severity === "critical" ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"} ${isEscWave ? "ring-2 ring-warning/40" : ""}`}>
                    <p className={`font-semibold ${isEscWave ? "text-sm" : "text-xs"} ${r.severity === "critical" ? "text-destructive" : "text-warning"}`}>{r.title}</p>
                    <p className={`text-muted-foreground mt-1 ${isEscWave ? "text-xs" : "text-[11px]"}`}>{r.detail}</p>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground flex items-start gap-1"><Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-primary" /><span>{r.recommendation}</span></p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-destructive" /> {t("escalationEngine.economicExposure")}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline"><span className="text-xs text-muted-foreground">{t("escalationEngine.currentCod")}</span><span className="text-base font-bold text-destructive font-display">{formatCost(economicExposure.current)}</span></div>
                <div className="flex justify-between items-baseline"><span className="text-xs text-muted-foreground">{t("escalationEngine.projectedPace")}</span><span className="text-sm font-semibold text-destructive/80">{formatCost(economicExposure.projected)}</span></div>
                <div className="flex justify-between items-baseline"><span className="text-xs text-muted-foreground">{t("escalationEngine.avoidableSla")}</span><span className="text-sm font-semibold text-success">{formatCost(economicExposure.avoidable)}</span></div>
                {economicExposure.topDrivers.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1.5">{t("escalationEngine.topCostDrivers")}</p>
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

          {escAnalytics.earlyWarnings.length > 0 && (
            <Card className="border-warning/30">
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Clock className="w-3.5 h-3.5 text-warning" />{t("escalationEngine.earlyWarnings5d")}</h3>
                <p className="text-[11px] text-muted-foreground mb-2">{t("escalationEngine.earlyWarningsDesc", { count: escAnalytics.earlyWarnings.length })}</p>
                {escAnalytics.earlyWarnings.slice(0, 3).map(d => (
                  <Link key={d.id} to={`/decisions/${d.id}`} className="flex items-center gap-2 text-[11px] py-1 hover:text-primary transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    <span className="truncate">{d.title}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{t("escalationEngine.due", { date: dateShort(d.due_date!) })}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="predictive" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="predictive" className="gap-1.5">
            {t("predictiveSla.title")}
            {slaPredictions.length > 0 ? (
              <Badge variant="destructive" className="text-[9px] h-4 px-1.5 min-w-[18px]">{slaPredictions.length}</Badge>
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sla">{t("escalationEngine.tabSla")}</TabsTrigger>
          <TabsTrigger value="escalations">{t("escalationEngine.tabEscalations", { count: activeEscalations.length })}</TabsTrigger>
          <TabsTrigger value="log">{t("escalationEngine.tabEscLog")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("escalationEngine.tabAnalytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="predictive">
          <PredictiveSlaPanel />
        </TabsContent>

        <TabsContent value="sla">
          <div className="space-y-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{t("escalationEngine.activeGovRules")}</h3>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate("/automation")}><Settings className="w-3 h-3" /> {t("escalationEngine.manageRules")}</Button>
              </div>
              {automationRules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("escalationEngine.noAutomationRules")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thRule")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thStatus")}</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thTrigger")}</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thAction")}</th>
                    </tr></thead>
                    <tbody>
                      {automationRules.slice(0, 10).map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium text-xs">{r.name}</td>
                          <td className="text-center py-2 px-3"><Badge variant={r.enabled ? "default" : "outline"} className="text-[10px]">{r.enabled ? t("escalationEngine.active") : t("escalationEngine.off")}</Badge></td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{r.trigger_event} ({r.condition_field} {r.condition_operator} {r.condition_value})</td>
                          <td className="py-2 px-3 text-xs">{r.action_type}: {r.action_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">{t("escalationEngine.autoEngineActions")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: AlertTriangle, title: t("escalationEngine.smartEscalation"), desc: t("escalationEngine.smartEscalationDesc"), color: "text-destructive", trigger: t("escalationEngine.smartEscalationTrigger") },
                  { icon: Users, title: t("escalationEngine.autoReassignTitle"), desc: t("escalationEngine.autoReassignDesc"), color: "text-warning", trigger: t("escalationEngine.autoReassignTrigger") },
                  { icon: SkipForward, title: t("escalationEngine.lowRiskSkip"), desc: t("escalationEngine.lowRiskSkipDesc"), color: "text-success", trigger: t("escalationEngine.lowRiskSkipTrigger") },
                  { icon: Lightbulb, title: t("escalationEngine.processShortcut"), desc: t("escalationEngine.processShortcutDesc"), color: "text-primary", trigger: t("escalationEngine.processShortcutTrigger") },
                ].map(rule => (
                  <div key={rule.title} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center gap-2 mb-1"><rule.icon className={`w-4 h-4 ${rule.color}`} /><span className="text-xs font-semibold">{rule.title}</span></div>
                    <p className="text-[10px] text-muted-foreground">{rule.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">Trigger: {rule.trigger}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>

            {slaConfigs.length > 0 && (
              <Card><CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{t("escalationEngine.slaConfig")}</h3>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate("/settings")}><Settings className="w-3 h-3" /> {t("escalationEngine.slaEdit")}</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thCategory")}</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thPriority")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thWarning")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thUrgent")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thOverdue")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">{t("escalationEngine.thReassign")}</th>
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

        <TabsContent value="escalations">
          <Card>
            <CardContent className="p-0">
              {activeEscalations.length === 0 ? (
                <div className="text-center py-8"><CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" /><p className="text-sm text-muted-foreground">{t("escalationEngine.noActiveEsc")}</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">{t("escalationEngine.thTitle")}</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">{t("escalationEngine.thLevel")}</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">{t("escalationEngine.thPriority")}</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">{t("escalationEngine.thOpen")}</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">{t("escalationEngine.thSinceEsc")}</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">{t("escalationEngine.thStatus")}</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">{t("escalationEngine.thActionCol")}</th>
                    </tr></thead>
                    <tbody>
                      {activeEscalations.map(d => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium text-xs truncate max-w-[200px]">{d.title}</td>
                          <td className="text-center py-3 px-3"><Badge variant={(d.escalation_level || 0) >= 3 ? "destructive" : "outline"} className="text-[10px]">L{d.escalation_level}</Badge></td>
                          <td className="text-center py-3 px-3"><span className={`text-[10px] font-medium capitalize ${d.priority === "critical" ? "text-destructive" : d.priority === "high" ? "text-warning" : "text-muted-foreground"}`}>{d.priority}</span></td>
                          <td className="text-center py-3 px-3 text-xs">{d.daysOpen}d</td>
                          <td className="text-center py-3 px-3 text-xs">{d.daysSinceEsc}d</td>
                          <td className="text-center py-3 px-3"><Badge variant="outline" className="text-[10px] capitalize">{d.status}</Badge></td>
                          <td className="text-right py-3 px-4"><Link to={`/decisions/${d.id}`}><Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1"><ExternalLink className="w-3 h-3" />{t("escalationEngine.open")}</Button></Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card><CardContent className="p-0">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8"><Zap className="w-10 h-10 text-primary mx-auto mb-2 opacity-30" /><p className="text-sm text-muted-foreground">{t("escalationEngine.noEngineActivity")}</p></div>
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
                      <span className="text-[10px] text-muted-foreground shrink-0">{dateFmt(notif.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{t("escalationEngine.escalationRate")}</p>
                <p className={`text-2xl font-bold font-display tabular-nums ${(open.length > 0 ? Math.round(activeEscalations.length / open.length * 100) : 0) > 20 ? "text-destructive" : "text-success"}`}>
                  {open.length > 0 ? Math.round(activeEscalations.length / open.length * 100) : 0}%
                </p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{t("escalationEngine.avgEscDuration")}</p>
                <p className="text-2xl font-bold font-display tabular-nums">{escAnalytics.avgDuration}d</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{t("escalationEngine.highestLevel")}</p>
                <p className="text-2xl font-bold font-display tabular-nums text-destructive">L{escAnalytics.maxLevel}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{t("escalationEngine.earlyWarnings")}</p>
                <p className={`text-2xl font-bold font-display tabular-nums ${escAnalytics.earlyWarnings.length > 0 ? "text-warning" : "text-success"}`}>{escAnalytics.earlyWarnings.length}</p>
                <p className="text-[10px] text-muted-foreground">{t("escalationEngine.next5Days")}</p>
              </CardContent></Card>
            </div>

            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">{t("escalationEngine.escSlaChart")}</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={escAnalytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey={t("escalationEngine.chartEscalations")} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={t("escalationEngine.chartSlaBreaches")} fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
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
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> {t("escalationEngine.recommendedActions")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: t("escalationEngine.recReviewCapacity"), impact: t("escalationEngine.high").toLowerCase(), timeSaving: `~3d${t("escalationEngine.perDecision")}`, costSaving: formatCost(totalCostOfDelay * 0.25), action: () => navigate("/settings"), actionLabel: t("escalationEngine.openDelegation") },
              { title: t("escalationEngine.recSlaStricter"), impact: t("escalationEngine.high").toLowerCase(), timeSaving: `~2d${t("escalationEngine.perCritical")}`, costSaving: formatCost(totalCostOfDelay * 0.15), action: () => navigate("/settings"), actionLabel: t("escalationEngine.openSlaConfig") },
              { title: t("escalationEngine.recAutoEsc10d"), impact: t("escalationEngine.medium").toLowerCase(), timeSaving: `~1.5d${t("escalationEngine.perDecision")}`, costSaving: formatCost(totalCostOfDelay * 0.1), action: () => navigate("/automation"), actionLabel: t("escalationEngine.createRule") },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
                <p className="text-xs font-semibold mb-2">{m.title}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-3">
                  <div><p className="text-muted-foreground">{t("escalationEngine.impact")}</p><p className={`font-semibold ${m.impact === t("escalationEngine.high").toLowerCase() ? "text-destructive" : "text-warning"}`}>{m.impact}</p></div>
                  <div><p className="text-muted-foreground">{t("escalationEngine.timeSaving")}</p><p className="font-semibold text-foreground">{m.timeSaving}</p></div>
                  <div><p className="text-muted-foreground">{t("escalationEngine.costSaving")}</p><p className="font-semibold text-success">{m.costSaving}</p></div>
                </div>
                <Button size="sm" variant="outline" className="w-full h-7 text-[11px] gap-1" onClick={m.action}><ArrowRight className="w-3 h-3" /> {m.actionLabel}</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default EscalationEngine;
