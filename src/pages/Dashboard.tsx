import { useMemo, useState, useEffect, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight,
  Zap, FileText, Eye, TrendingUp,
  CheckCircle2, Users, RefreshCw, Compass,
  LayoutDashboard, Crown, ChevronDown, ChevronUp,
  Gauge, Shield, DollarSign, Timer,
  Activity, GitBranch, BarChart3, Target,
  Repeat, Ban, Layers, Percent,
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
import HeroKpi from "@/components/shared/HeroKpi";
import PowerGrid from "@/components/shared/PowerGrid";
import DeepDiveSection from "@/components/shared/DeepDiveSection";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useReviews, useFilteredDependencies, useDependencies } from "@/hooks/useDecisions";
import { useRisks } from "@/hooks/useRisks";
import { useGuidedMode } from "@/hooks/useGuidedMode";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

type DashboardMode = "operational" | "executive";

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

  const [dismissedAdvancedHint, setDismissedAdvancedHint] = useState(() => localStorage.getItem("advanced-hint-dismissed") === "true");
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(() =>
    (localStorage.getItem("dashboard-mode") as DashboardMode) || "operational"
  );

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

    // Status distribution
    const statusCounts: Record<string, number> = {};
    decisions.forEach(d => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });

    // Avg duration for implemented
    const implemented = decisions.filter(d => d.status === "implemented" && d.implemented_at);
    const avgDuration = implemented.length > 0
      ? Math.round(implemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / implemented.length)
      : 0;

    // Completion rate
    const completionRate = decisions.length > 0 ? Math.round((implemented.length / decisions.length) * 100) : 0;

    // High risk
    const highRisk = active.filter(d => (d.ai_risk_score || 0) >= 60).length;

    // With dependencies
    const withDeps = new Set<string>();
    allDependencies.forEach(dep => {
      if (dep.source_decision_id) withDeps.add(dep.source_decision_id);
      if (dep.target_decision_id) withDeps.add(dep.target_decision_id);
    });

    // Reviews completed this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const reviewsCompleted = reviews.filter(r => r.reviewed_at && new Date(r.reviewed_at) >= monthStart).length;

    // Decision health
    const total = decisions.length;
    const healthRatio = total > 0 ? Math.max(0, 1 - (escalated.length * 0.15 + overdue.length * 0.1)) : 1;
    const successful = implemented.filter(d => (d as any).outcome_type === "successful" || (d as any).outcome_type === "partial").length;
    const successRatio = implemented.length > 0 ? successful / implemented.length : 0.5;
    const healthScore = Math.round(Math.min(100, (healthRatio * 50 + successRatio * 50)));

    // Risk exposure
    const openRisks = riskData.filter((r: any) => r.status === "open");
    const riskExposure = openRisks.length + highRisk;

    // Cost of delay
    const priorityMult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    let totalCost = 0;
    const openDecisions = active.filter(d => d.status === "draft" || d.status === "review");
    openDecisions.forEach(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const rate = 75;
      totalCost += daysOpen * 2 * 2 * rate * (priorityMult[d.priority] || 1.5);
    });
    const formattedCost = totalCost >= 1000 ? `€${Math.round(totalCost / 1000)}k` : `€${Math.round(totalCost)}`;

    // SLA compliance
    const withDueDate = active.filter(d => d.due_date);
    const onTrack = withDueDate.filter(d => new Date(d.due_date!) >= now).length;
    const slaCompliance = withDueDate.length > 0 ? Math.round((onTrack / withDueDate.length) * 100) : 100;

    // Rework rate (rejected / total)
    const reworkRate = decisions.length > 0 ? Math.round((statusCounts["rejected"] || 0) / decisions.length * 100) : 0;

    // Team velocity (implemented per week over last 4 weeks)
    const fourWeeksAgo = subDays(now, 28);
    const recentImpl = implemented.filter(d => new Date(d.implemented_at!) >= fourWeeksAgo).length;
    const teamVelocity = Math.round((recentImpl / 4) * 10) / 10;

    // Automation triggers (placeholder)
    const automationTriggers = escalated.length;

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
      trendInsight = "Mehr neue als abgeschlossene Entscheidungen – Rückstau wächst.";
    } else if (avgCompleted > avgCreated * 1.3 && avgCompleted > 1) {
      trendInsight = "Abschlussrate übersteigt Erstellung – Rückstau wird abgebaut.";
    }

    const recentlyOpened = [...decisions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);

    return {
      overdue, escalated, pendingReviews, active, blockedTasks,
      weekData, recentlyOpened, trendInsight,
      statusCounts, avgDuration, completionRate, highRisk,
      withDeps: withDeps.size, reviewsCompleted, reworkRate, teamVelocity,
      automationTriggers, implemented,
      // Hero KPIs
      healthScore, riskExposure, formattedCost, slaCompliance, totalCost,
      openRisks: openRisks.length,
    };
  }, [decisions, contextTasks, reviews, dependencies, allDependencies, user, dateFnsLocale, riskData]);

  const chartTooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "var(--shadow-md)" };

  if (hasError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mb-4" />
          <h1 className="text-lg font-semibold mb-1">{t("dashboard.loadFailed")}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t("dashboard.retryDesc")}</p>
          <Button variant="outline" size="sm" onClick={() => { refetchDec(); refetchTasks(); }} className="gap-1.5 rounded-xl">
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

    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="text-center max-w-lg">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-8">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">{t("dashboard.welcome", { name: firstName })}</h1>
            <p className="text-muted-foreground mb-1">{t("dashboard.readyDesc")}</p>
            <p className="text-sm text-muted-foreground/60 mb-10">{t("dashboard.startSteps")}</p>
            <div className="grid gap-3 mb-10 text-left">
              {[
                { num: "1", label: t("dashboard.createTeam"), desc: t("dashboard.createTeamDesc"), path: "/teams", icon: Users },
                { num: "2", label: t("dashboard.firstDecision"), desc: t("dashboard.firstDecisionDesc"), path: "/decisions", icon: FileText },
                { num: "3", label: t("dashboard.startReview"), desc: t("dashboard.startReviewDesc"), path: "/decisions", icon: Eye },
              ].map((step, i) => (
                <motion.button
                  key={step.num}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => navigate(step.path)}
                  className="flex items-center gap-4 p-5 rounded-xl cmd-card card-interactive group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary text-sm font-bold flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">{step.num}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={handleSeedDemo} variant="outline" className="gap-1.5 rounded-xl press-scale" disabled={seedingDemo}>
                {seedingDemo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {seedingDemo ? t("dashboard.creating") : t("dashboard.startWithDemo")}
              </Button>
              <Button onClick={() => setShowOnboarding(true)} variant="outline" className="gap-1.5 rounded-xl press-scale">
                <Compass className="w-4 h-4" /> {t("dashboard.startTour")}
              </Button>
              <Button onClick={() => navigate("/decisions")} className="gap-1.5 rounded-xl press-scale">
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
          className="mb-8 cmd-card p-5 border-primary/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("dashboard.advancedAvailable")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.advancedDesc", { decisionCount, implementedCount })}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 text-xs rounded-lg press-scale" onClick={() => setMode("advanced")}>{t("common.activate")}</Button>
          <button onClick={() => { setDismissedAdvancedHint(true); localStorage.setItem("advanced-hint-dismissed", "true"); }}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors text-xs shrink-0">✕</button>
        </motion.div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dashboardTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.whatNeedsAttention")}</p>
        </div>
        <div className="flex gap-0.5 bg-muted/40 rounded-xl p-1">
          <button
            onClick={() => toggleDashboardMode("operational")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium py-2 px-4 rounded-lg transition-all",
              !isExecutive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Operational
          </button>
          <button
            onClick={() => toggleDashboardMode("executive")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium py-2 px-4 rounded-lg transition-all",
              isExecutive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Crown className="w-3.5 h-3.5" />
            Executive
          </button>
        </div>
      </div>

      <div className="space-y-10">

        {/* ═══ LOADING ═══ */}
        {isLoading && <DashboardSkeleton />}

        {/* ═══ LAYER 1 – DOMINANCE ═══ */}
        {!isLoading && (
          <>
            <TopActionNow
              overdue={computed.overdue}
              escalated={computed.escalated}
              pendingReviews={computed.pendingReviews}
              blockedTasks={computed.blockedTasks}
            />

            <HeroKpi items={[
              {
                label: "Decision Health",
                value: `${computed.healthScore}%`,
                subLabel: computed.healthScore >= 70 ? "Stabil" : computed.healthScore >= 45 ? "Beobachten" : "Kritisch",
                icon: Gauge,
                sentiment: computed.healthScore >= 70 ? "positive" : computed.healthScore >= 45 ? "warning" : "critical",
                tooltip: "Gesamtgesundheit: 50% Eskalationsfreiheit + 50% Erfolgsquote",
              },
              {
                label: "Risk Exposure",
                value: `${computed.riskExposure}`,
                subLabel: `${computed.openRisks} Risiken · ${computed.highRisk} High-Risk`,
                icon: Shield,
                sentiment: computed.riskExposure === 0 ? "positive" : computed.riskExposure <= 3 ? "warning" : "critical",
                tooltip: "Offene Risiken + Entscheidungen mit AI-Risk ≥ 60",
              },
              {
                label: "Cost of Delay",
                value: computed.formattedCost,
                subLabel: `${computed.active.filter(d => d.status === "draft" || d.status === "review").length} offene Entscheidungen`,
                icon: DollarSign,
                sentiment: computed.totalCost < 5000 ? "neutral" : computed.totalCost < 20000 ? "warning" : "critical",
                tooltip: "Opportunitätskosten durch offene Entscheidungen",
              },
              {
                label: "SLA Compliance",
                value: `${computed.slaCompliance}%`,
                subLabel: `${computed.active.filter(d => d.due_date && new Date(d.due_date) >= new Date()).length} im Plan`,
                icon: Timer,
                sentiment: computed.slaCompliance >= 80 ? "positive" : computed.slaCompliance >= 60 ? "warning" : "critical",
                tooltip: "Anteil aktiver Entscheidungen im Zeitplan",
              },
            ]} />
          </>
        )}

        {/* ═══ ONBOARDING ═══ */}
        {!isLoading && !isExecutive && (
          <OnboardingChecklist
            hasTeam={teams.length > 0}
            hasDecision={decisions.length > 0}
            hasReview={reviews.length > 0}
            hasTemplate={decisions.some(d => !!d.template_used)}
          />
        )}

        {/* ═══ LAYER 2 – POWER GRID ═══ */}
        {!isLoading && (
          <PowerGrid
            title="KPI Matrix"
            columns={4}
            items={[
              { label: "Aktive Entsch.", value: computed.active.length, icon: Layers },
              { label: "Überfällig", value: computed.overdue.length, icon: Clock, sentiment: computed.overdue.length > 0 ? "critical" : "positive" },
              { label: "Eskaliert", value: computed.escalated.length, icon: AlertTriangle, sentiment: computed.escalated.length > 0 ? "warning" : "positive" },
              { label: "Ø Dauer (Tage)", value: computed.avgDuration, icon: Timer },
              { label: "Review Throughput", value: computed.reviewsCompleted, icon: CheckCircle2 },
              { label: "Completion Rate", value: `${computed.completionRate}%`, icon: Percent, sentiment: computed.completionRate >= 60 ? "positive" : computed.completionRate >= 30 ? "warning" : "critical" },
              { label: "Blockiert", value: computed.blockedTasks.length, icon: Ban, sentiment: computed.blockedTasks.length > 0 ? "warning" : "positive" },
              { label: "High Risk", value: computed.highRisk, icon: Shield, sentiment: computed.highRisk > 0 ? "critical" : "positive" },
              { label: "Velocity (Woche)", value: computed.teamVelocity, icon: TrendingUp },
              { label: "Rework Rate", value: `${computed.reworkRate}%`, icon: Repeat, sentiment: computed.reworkRate > 15 ? "warning" : "neutral" },
              { label: "Mit Dependencies", value: computed.withDeps, icon: GitBranch },
              { label: "Decision Load", value: decisions.length, icon: BarChart3 },
            ]}
          />
        )}

        {/* ═══ FINANCIAL WARNING ═══ */}
        {!isLoading && (
          <PrimaryFocusBanner
            decisions={decisions}
            escalated={computed.escalated}
            overdue={computed.overdue}
            teams={teams}
          />
        )}

        {/* ═══ EXECUTIVE MODE ═══ */}
        {isExecutive && !isLoading && (
          <div className="space-y-8">
            <WidgetErrorBoundary>
              <DecisionQualityIndex />
            </WidgetErrorBoundary>
            <div className="grid md:grid-cols-2 gap-6">
              <WidgetErrorBoundary>
                <EscalationWidget />
              </WidgetErrorBoundary>
              <WidgetErrorBoundary>
                <DecisionCostWidget />
              </WidgetErrorBoundary>
            </div>
            <PortfolioRiskOverview decisions={decisions} risks={riskData} />
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
              <AiBriefingWidget />
            </Suspense>
          </div>
        )}

        {/* ═══ OPERATIONAL MODE ═══ */}
        {!isExecutive && !isLoading && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <StuckDecisionAnalyzer decisions={decisions} reviews={reviews} dependencies={allDependencies} teams={teams} />
              </div>
              <div className="space-y-6">
                <WidgetErrorBoundary>
                  <EscalationWidget />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary>
                  <GamificationWidget decisions={decisions} tasks={contextTasks} teams={teams} />
                </WidgetErrorBoundary>
              </div>
            </div>

            {computed.recentlyOpened.length > 0 && (
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{t("dashboard.recentlyOpened")}</h2>
                <div className="cmd-card divide-y divide-border/50">
                  {computed.recentlyOpened.map(d => (
                    <button key={d.id} onClick={() => navigate(`/decisions/${d.id}`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left first:rounded-t-xl last:rounded-b-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-2 h-2 rounded-full shrink-0",
                          d.priority === "critical" ? "bg-destructive" : d.priority === "high" ? "bg-warning" : "bg-primary/40")} />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-normal rounded-md">{tStatusLabels[d.status] || d.status}</Badge>
                        <span className="text-sm truncate">{d.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0 ml-3">
                        {formatDistanceToNow(new Date(d.updated_at), { locale: dateFnsLocale, addSuffix: true })}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ LAYER 3 – DEEP INTELLIGENCE ═══ */}
            <DeepDiveSection label="Detaillierte Analysen">
              <WidgetErrorBoundary>
                <DecisionQualityIndex />
              </WidgetErrorBoundary>

              <div className="grid md:grid-cols-2 gap-6">
                <WidgetErrorBoundary>
                  <DecisionCostWidget />
                </WidgetErrorBoundary>
                <PortfolioRiskOverview decisions={decisions} risks={riskData} />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <section>
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{t("dashboard.trends")}</h2>
                    <div className="cmd-card p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="text-sm font-semibold">{t("dashboard.decisionsPerWeek")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Abgeschlossen vs. Erstellt vs. Eskalationen</p>
                        </div>
                      </div>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={computed.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                            <defs>
                              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.06} />
                                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                            <RechartsTooltip contentStyle={chartTooltipStyle} />
                            <Area type="monotone" dataKey="completed" name="Abgeschlossen" stroke="hsl(var(--primary))" fill="url(#gradCompleted)" strokeWidth={2} />
                            <Area type="monotone" dataKey="created" name="Erstellt" stroke="hsl(var(--muted-foreground))" fill="url(#gradCreated)" strokeWidth={1} strokeDasharray="4 4" />
                            <Area type="monotone" dataKey="escalations" name="Eskalationen" stroke="hsl(var(--destructive))" fill="none" strokeWidth={1.5} strokeDasharray="2 2" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      {computed.trendInsight && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/[0.03] flex items-center gap-2">
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

              <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
                <AiBriefingWidget />
              </Suspense>
            </DeepDiveSection>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
