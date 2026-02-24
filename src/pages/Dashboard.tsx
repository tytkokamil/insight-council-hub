import { useMemo, useState, useEffect, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight,
  Zap, FileText, Eye, TrendingUp,
  CheckCircle2, Command, Link2, Users, RefreshCw, Compass,
  LayoutDashboard, Crown, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import DecisionQualityIndex from "@/components/dashboard/DecisionQualityIndex";
import PrimaryFocusBanner from "@/components/dashboard/PrimaryFocusBanner";
import DecisionRadar from "@/components/dashboard/DecisionRadar";
import TopActionNow from "@/components/dashboard/TopActionNow";
import CoreKpiGrid from "@/components/dashboard/CoreKpiGrid";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useReviews, useFilteredDependencies, useDependencies } from "@/hooks/useDecisions";
import { useRisks } from "@/hooks/useRisks";
import { useGuidedMode } from "@/hooks/useGuidedMode";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslatedLabels } from "@/lib/labels";
import PageHeader from "@/components/shared/PageHeader";
import { format, differenceInDays, subDays, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const AiBriefingWidget = lazy(() => import("@/components/dashboard/AiBriefingWidget"));
const OnboardingTour = lazy(() => import("@/components/onboarding/OnboardingTour"));
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import StuckDecisionAnalyzer from "@/components/dashboard/StuckDecisionAnalyzer";
import PortfolioRiskOverview from "@/components/dashboard/PortfolioRiskOverview";
import DecisionCostWidget from "@/components/dashboard/DecisionCostWidget";
import EscalationWidget from "@/components/dashboard/EscalationWidget";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import GamificationWidget from "@/components/dashboard/GamificationWidget";

type DashboardMode = "operational" | "executive" | "admin";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const { statusLabels: tStatusLabels } = useTranslatedLabels(t);
  const { data: allDecisions = [], isLoading: loadingDec, isError: errorDec, refetch: refetchDec } = useDecisions();
  const { data: tasks = [], isLoading: loadingTasks, isError: errorTasks, refetch: refetchTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useReviews();
  const { data: dependencies = [] } = useFilteredDependencies();
  const { data: allDependencies = [] } = useDependencies();
  const { data: riskData = [] } = useRisks();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const navigate = useNavigate();
  const { mode, setMode, shouldShowAdvanced, decisionCount, implementedCount } = useGuidedMode();
  const { role: userRole, can, isExecutive: isExecRole, isAdmin: isAdminRole } = usePermissions();

  const [dismissedAdvancedHint, setDismissedAdvancedHint] = useState(() => localStorage.getItem("advanced-hint-dismissed") === "true");
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(() => {
    const stored = localStorage.getItem("dashboard-mode") as DashboardMode;
    if (stored) return stored;
    return isExecRole ? "executive" : "operational";
  });
  const [showDeepDive, setShowDeepDive] = useState(false);

  const toggleDashboardMode = useCallback((m: DashboardMode) => {
    setDashboardMode(m);
    localStorage.setItem("dashboard-mode", m);
  }, []);

  const isPersonal = selectedTeamId === null;
  const currentTeam = teams.find((t: any) => t.id === selectedTeamId);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";

  const isLoading = loadingDec || loadingTasks;
  const hasError = errorDec || errorTasks;

  // Onboarding tour
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [autoSeeded, setAutoSeeded] = useState(false);
  
  // Auto-seed demo data on first visit (opt-out: user can skip)
  useEffect(() => {
    if (isLoading || autoSeeded || seedingDemo) return;
    if (allDecisions.length > 0 || tasks.length > 0) return;
    const skipped = localStorage.getItem("demo-seed-skipped");
    const seeded = localStorage.getItem("demo-seed-completed");
    if (skipped || seeded) return;
    
    // Auto-seed
    setAutoSeeded(true);
    setSeedingDemo(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("seed-demo-data");
        if (error) throw error;
        if (data?.error) { setSeedingDemo(false); return; }
        localStorage.setItem("demo-seed-completed", "true");
        toast.success(t("dashboard.demoSuccess"));
        setTimeout(() => { refetchDec(); refetchTasks(); window.location.reload(); }, 1200);
      } catch {
        setSeedingDemo(false);
      }
    })();
  }, [isLoading, allDecisions.length, tasks.length, autoSeeded, seedingDemo]);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding-completed");
    if (!seen && !isLoading && allDecisions.length === 0 && tasks.length === 0) {
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, allDecisions.length, tasks.length]);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("onboarding-completed", "true");
  }, []);

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

  const decisions = isPersonal
    ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
    : allDecisions;
  const contextTasks = isPersonal
    ? tasks.filter(t => t.created_by === user?.id || t.assignee_id === user?.id)
    : tasks;

  // === ALL COMPUTED DATA ===
  const computed = useMemo(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1);
    const pendingReviews = reviews.filter(r => !r.reviewed_at && r.reviewer_id === user?.id);

    const openDecisionIds = new Set(active.map(d => d.id));
    const blockedTaskIds = new Set<string>();
    dependencies.forEach(dep => {
      if (dep.source_decision_id && openDecisionIds.has(dep.source_decision_id) && dep.target_task_id) blockedTaskIds.add(dep.target_task_id);
      if (dep.target_decision_id && openDecisionIds.has(dep.target_decision_id) && dep.source_task_id) blockedTaskIds.add(dep.source_task_id);
    });
    const blockedTasks = contextTasks.filter(t => blockedTaskIds.has(t.id) && t.status !== "done");

    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekLabel = format(weekEnd, "dd.MM", { locale: dateFnsLocale });
      const completed = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd).length;
      const created = decisions.filter(d => new Date(d.created_at) >= weekStart && new Date(d.created_at) < weekEnd).length;
      const escalations = decisions.filter(d => (d.escalation_level || 0) >= 1 && new Date(d.updated_at) >= weekStart && new Date(d.updated_at) < weekEnd).length;
      return { week: weekLabel, completed, created, escalations };
    });

    const lastThreeWeeks = weekData.slice(-3);
    const avgCreated = lastThreeWeeks.reduce((s, w) => s + w.created, 0) / 3;
    const avgCompleted = lastThreeWeeks.reduce((s, w) => s + w.completed, 0) / 3;
    let trendInsight = "";
    if (avgCreated > avgCompleted * 1.5 && avgCreated > 1) {
      trendInsight = t("dashboard.trendBacklogGrowing");
    } else if (avgCompleted > avgCreated * 1.3 && avgCompleted > 1) {
      trendInsight = t("dashboard.trendBacklogShrinking");
    }

    const recentlyOpened = [...decisions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);

    return {
      overdue, escalated, pendingReviews, active, blockedTasks,
      weekData, recentlyOpened, trendInsight,
    };
  }, [decisions, contextTasks, reviews, dependencies, user, dateFnsLocale]);

  const chartTooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "none" };

  if (hasError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mb-4" />
          <h1 className="text-lg font-semibold mb-1">{t("dashboard.loadFailed")}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t("dashboard.retryDesc")}</p>
          <Button variant="outline" size="sm" onClick={() => { refetchDec(); refetchTasks(); }} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> {t("common.retry")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Empty state
  if (!isLoading && allDecisions.length === 0 && tasks.length === 0) {
    const handleSeedDemo = async () => {
      setSeedingDemo(true);
      try {
        const { data, error } = await supabase.functions.invoke("seed-demo-data");
        if (error) throw error;
        if (data?.error) { toast.error(data.error); setSeedingDemo(false); return; }
        toast.success(t("dashboard.demoSuccess"));
        setTimeout(() => { refetchDec(); refetchTasks(); window.location.reload(); }, 1000);
      } catch (e: any) {
        toast.error(t("dashboard.demoError"));
        setSeedingDemo(false);
      }
    };

    // If auto-seeding is in progress, show loading state
    if (seedingDemo) {
      return (
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">{t("dashboard.welcome", { name: firstName })}</h1>
              <p className="text-muted-foreground mb-4">{t("dashboard.creating")}</p>
              <p className="text-xs text-muted-foreground/50">55 Entscheidungen · 3 Teams · 20 Tasks · 6 Risiken</p>
            </motion.div>
          </div>
        </AppLayout>
      );
    }

    const handleSkipDemo = () => {
      localStorage.setItem("demo-seed-skipped", "true");
      window.location.reload();
    };

    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">{t("dashboard.welcome", { name: firstName })}</h1>
            <p className="text-muted-foreground mb-2">{t("dashboard.readyDesc")}</p>
            <p className="text-sm text-muted-foreground/70 mb-8">{t("dashboard.startSteps")}</p>

            <div className="grid gap-3 mb-8 text-left">
              {[
                { num: "1", label: t("dashboard.createTeam"), desc: t("dashboard.createTeamDesc"), path: "/teams", icon: Users },
                { num: "2", label: t("dashboard.firstDecision"), desc: t("dashboard.firstDecisionDesc"), path: "/decisions", icon: FileText },
                { num: "3", label: t("dashboard.startReview"), desc: t("dashboard.startReviewDesc"), path: "/decisions", icon: Eye },
              ].map(step => (
                <button key={step.num} onClick={() => navigate(step.path)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">{step.num}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={handleSeedDemo} variant="outline" className="gap-1.5" disabled={seedingDemo}>
                {seedingDemo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {seedingDemo ? t("dashboard.creating") : t("dashboard.startWithDemo")}
              </Button>
              <Button onClick={() => setShowOnboarding(true)} variant="outline" className="gap-1.5">
                <Compass className="w-4 h-4" /> {t("dashboard.startTour")}
              </Button>
              <Button onClick={() => navigate("/decisions")} className="gap-1.5">
                <Plus className="w-4 h-4" /> {t("dashboard.newDecision")}
              </Button>
            </div>
          </motion.div>
        </div>

        <Suspense fallback={null}>
          <OnboardingTour open={showOnboarding} onComplete={completeOnboarding} />
        </Suspense>
      </AppLayout>
    );
  }

  const dashboardTitle = isPersonal ? t("dashboard.myWorkspace") : `${currentTeam?.name || "Team"}`;
  const isExecutive = dashboardMode === "executive";

  return (
    <AppLayout>
      {/* Progressive Disclosure Banner */}
      {shouldShowAdvanced && mode === "basic" && !dismissedAdvancedHint && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/[0.03] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t("dashboard.advancedAvailable")}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.advancedDesc", { decisionCount, implementedCount })}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => setMode("advanced")}>{t("common.activate")}</Button>
          <button onClick={() => { setDismissedAdvancedHint(true); localStorage.setItem("advanced-hint-dismissed", "true"); }}
            className="text-muted-foreground/40 hover:text-muted-foreground text-xs shrink-0">✕</button>
        </motion.div>
      )}

      {/* ═══ HEADER with Executive Mode Toggle ═══ */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-8">
        <PageHeader
          title={dashboardTitle}
          subtitle={t("dashboard.whatNeedsAttention")}
          role="execution"
          secondaryActions={
            <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => toggleDashboardMode("operational")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors",
                  !isExecutive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Operational
              </button>
              <button
                onClick={() => toggleDashboardMode("executive")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors",
                  isExecutive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Crown className="w-3.5 h-3.5" />
                Executive
              </button>
            </div>
          }
        />
      </div>

      <div className="space-y-8">

        {/* ═══ LOADING SKELETON ═══ */}
        {isLoading && <DashboardSkeleton />}

        {/* ═══ 1. TOP ACTION NOW — Most important thing to do ═══ */}
        {!isLoading && (
          <TopActionNow
            overdue={computed.overdue}
            escalated={computed.escalated}
            pendingReviews={computed.pendingReviews}
            blockedTasks={computed.blockedTasks}
          />
        )}

        {/* ═══ 2. FOUR CORE KPIs ═══ */}
        {!isLoading && (
          <CoreKpiGrid />
        )}

        {/* ═══ ONBOARDING CHECKLIST ═══ */}
        {!isLoading && !isExecutive && (
          <OnboardingChecklist
            hasTeam={teams.length > 0}
            hasDecision={decisions.length > 0}
            hasReview={reviews.length > 0}
            hasTemplate={decisions.some(d => !!d.template_used)}
          />
        )}

        {/* ═══ PRIMARY FOCUS BANNER (financial warning) ═══ */}
        {!isLoading && (
          <PrimaryFocusBanner
            decisions={decisions}
            escalated={computed.escalated}
            overdue={computed.overdue}
            teams={teams}
          />
        )}

        {/* ═══ EXECUTIVE MODE: Compact Layout ═══ */}
        {isExecutive && !isLoading && (
          <>
            {/* DQI Hero */}
            <WidgetErrorBoundary>
              <DecisionQualityIndex />
            </WidgetErrorBoundary>

            {/* Escalations + Cost side by side */}
            <div className="grid md:grid-cols-2 gap-5">
              <WidgetErrorBoundary>
                <EscalationWidget />
              </WidgetErrorBoundary>
              <WidgetErrorBoundary>
                <DecisionCostWidget />
              </WidgetErrorBoundary>
            </div>

            {/* Portfolio Risk */}
            <PortfolioRiskOverview decisions={decisions} risks={riskData} />

            {/* AI Brief */}
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
              <AiBriefingWidget />
            </Suspense>
          </>
        )}

        {/* ═══ OPERATIONAL MODE: Streamlined Layout ═══ */}
        {!isExecutive && !isLoading && (
          <>
            {/* Stuck Decisions + Escalations + Gamification */}
            <div className="grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <StuckDecisionAnalyzer decisions={decisions} reviews={reviews} dependencies={allDependencies} teams={teams} />
              </div>
              <div className="space-y-5">
                <WidgetErrorBoundary>
                  <EscalationWidget />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary>
                  <GamificationWidget decisions={decisions} tasks={contextTasks} teams={teams} />
                </WidgetErrorBoundary>
              </div>
            </div>

            {/* Recently Opened */}
            {computed.recentlyOpened.length > 0 && (
              <section>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.recentlyOpened")}</h2>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {computed.recentlyOpened.map(d => (
                    <button key={d.id} onClick={() => navigate(`/decisions/${d.id}`)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-2 h-2 rounded-full shrink-0",
                          d.priority === "critical" ? "bg-destructive" : d.priority === "high" ? "bg-warning" : "bg-primary")} />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-normal">{tStatusLabels[d.status] || d.status}</Badge>
                        <span className="text-sm truncate">{d.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(new Date(d.updated_at), { locale: dateFnsLocale, addSuffix: true })}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ DEEP DIVE — Expandable Details ═══ */}
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setShowDeepDive(!showDeepDive)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {showDeepDive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showDeepDive ? t("dashboard.hideDetails") : t("dashboard.showDetails")}</span>
                <span className="text-[10px] text-muted-foreground/50 ml-1">DQI · Trends · Radar · Cost of Delay · Risk Portfolio</span>
              </button>

              <AnimatePresence>
                {showDeepDive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8 mt-6"
                  >
                    {/* DQI */}
                    <WidgetErrorBoundary>
                      <DecisionQualityIndex />
                    </WidgetErrorBoundary>

                    {/* Cost + Risk side by side */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <WidgetErrorBoundary>
                        <DecisionCostWidget />
                      </WidgetErrorBoundary>
                      <PortfolioRiskOverview decisions={decisions} risks={riskData} />
                    </div>

                    {/* Trends + Radar */}
                    <div className="grid md:grid-cols-3 gap-5">
                      <div className="md:col-span-2">
                        <section>
                          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.trends")}</h2>
                          <div className="border border-border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm font-medium">{t("dashboard.decisionsPerWeek")}</p>
                                <p className="text-xs text-muted-foreground">{t("dashboard.chartSubtitle")}</p>
                              </div>
                            </div>
                            <div className="h-52">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                  <defs>
                                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.08} />
                                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                                  <Area type="monotone" dataKey="completed" name={t("dashboard.chartCompleted")} stroke="hsl(var(--primary))" fill="url(#gradCompleted)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="created" name={t("dashboard.chartCreated")} stroke="hsl(var(--muted-foreground))" fill="url(#gradCreated)" strokeWidth={1} strokeDasharray="4 4" />
                                  <Area type="monotone" dataKey="escalations" name={t("dashboard.chartEscalations")} stroke="hsl(var(--destructive))" fill="none" strokeWidth={1.5} strokeDasharray="2 2" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            {computed.trendInsight && (
                              <div className="mt-3 p-3 rounded-lg bg-primary/[0.04] border border-primary/10 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">Insight: </span>
                                  {computed.trendInsight}
                                </p>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                      <DecisionRadar />
                    </div>

                    {/* AI Brief */}
                    <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
                      <AiBriefingWidget />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
