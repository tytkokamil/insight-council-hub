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
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import DemoBanner from "@/components/shared/DemoBanner";
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
const AhaMomentOverlay = lazy(() => import("@/components/onboarding/AhaMomentOverlay"));
const GuidedChecklist = lazy(() => import("@/components/onboarding/GuidedChecklist"));
const PostDecisionInvitePrompt = lazy(() => import("@/components/invites/PostDecisionInvitePrompt"));
const NpsModal = lazy(() => import("@/components/shared/NpsModal"));
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import StuckDecisionAnalyzer from "@/components/dashboard/StuckDecisionAnalyzer";
import ActiveDecisionsTable from "@/components/dashboard/ActiveDecisionsTable";
import PortfolioRiskOverview from "@/components/dashboard/PortfolioRiskOverview";
import DecisionCostWidget from "@/components/dashboard/DecisionCostWidget";
import EscalationWidget from "@/components/dashboard/EscalationWidget";
import GamificationWidget from "@/components/dashboard/GamificationWidget";
import KpiOverviewWidget from "@/components/dashboard/KpiOverviewWidget";
import IndustryReminderBanner from "@/components/dashboard/IndustryReminderBanner";
import AnomalyCards from "@/components/shared/AnomalyCards";
import CodPreviewWidget from "@/components/dashboard/CodPreviewWidget";
import DeadDecisionDetector from "@/components/dashboard/DeadDecisionDetector";
import RoiProofWidget from "@/components/dashboard/RoiProofWidget";
import WelcomeBackBanner from "@/components/dashboard/WelcomeBackBanner";
import GoLiveProgressWidget from "@/components/dashboard/GoLiveProgressWidget";
import { usePredictiveSla } from "@/components/decisions/PredictiveSlaWarning";

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [prevDecisionCount, setPrevDecisionCount] = useState<number | null>(null);
  const [showNps, setShowNps] = useState(false);

  // NPS trigger: 7+ days active, 3+ decisions, no previous NPS
  useEffect(() => {
    if (!user) return;
    const checkNps = async () => {
      const { data: profile } = await supabase.from("profiles").select("created_at, decision_count, nps_last_shown").eq("user_id", user.id).single();
      if (!profile) return;
      const daysSinceCreation = differenceInDays(new Date(), new Date(profile.created_at));
      const hasEnoughDecisions = (profile.decision_count || 0) >= 3;
      const neverShown = !profile.nps_last_shown;
      if (daysSinceCreation >= 7 && hasEnoughDecisions && neverShown) {
        setTimeout(() => setShowNps(true), 5000); // slight delay for UX
      }
    };
    checkNps();
  }, [user]);

  // Guided mode: simplified dashboard for new users
  const isGuidedMode = decisionCount < 3;
  const toggleDashboardMode = useCallback((m: DashboardMode) => {
    setDashboardMode(m);
    localStorage.setItem("dashboard-mode", m);
  }, []);

  const isPersonal = selectedTeamId === null;
  const currentTeam = teams.find((t: any) => t.id === selectedTeamId);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";

  const isLoading = loadingDec || loadingTasks;
  const hasError = errorDec || errorTasks;

  // Aha-moment overlay
  const [showAha, setShowAha] = useState(() => {
    const data = localStorage.getItem("aha-moment-data");
    const seen = localStorage.getItem("aha-moment-seen");
    return !!data && !seen;
  });
  const ahaData = (() => {
    try { return JSON.parse(localStorage.getItem("aha-moment-data") || "null"); } catch { return null; }
  })();

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

  // Handle ?newDecision=true from onboarding
  useEffect(() => {
    if (searchParams.get("newDecision") === "true") {
      searchParams.delete("newDecision");
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => navigate("/decisions?create=true", { replace: true }), 500);
    }
  }, [searchParams, setSearchParams, navigate]);

  // Detect transition from guided → full dashboard at 3 decisions
  useEffect(() => {
    if (prevDecisionCount !== null && prevDecisionCount < 3 && decisionCount >= 3) {
      toast.success("Das vollständige Dashboard ist jetzt freigeschaltet 🎉", { duration: 4000 });
    }
    setPrevDecisionCount(decisionCount);
  }, [decisionCount, prevDecisionCount]);

  const personalDecisions = allDecisions.filter(
    (d) => d.created_by === user?.id || d.assignee_id === user?.id || d.owner_id === user?.id
  );
  const decisions = isPersonal ? personalDecisions : allDecisions;

  const personalTasks = tasks.filter(
    (task) => task.created_by === user?.id || task.assignee_id === user?.id
  );
  const contextTasks = isPersonal ? personalTasks : tasks;

  const contextDecisionIds = new Set(decisions.map((d) => d.id));
  const contextReviews = reviews.filter((r) => contextDecisionIds.has(r.decision_id));

  // === ALL COMPUTED DATA ===
  const computed = useMemo(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now);
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1);
    const pendingReviews = contextReviews.filter(r => !r.reviewed_at && r.reviewer_id === user?.id);

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
  }, [decisions, contextTasks, contextReviews, dependencies, user, dateFnsLocale, t]);

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

  // No more full-page empty state — widgets render with zero data

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "dashboard.goodMorning" : hour < 18 ? "dashboard.goodAfternoon" : "dashboard.goodEvening";
  const dashboardTitle = isPersonal ? t(greetingKey, { name: firstName }) : `${currentTeam?.name || "Team"}`;
  const isExecutive = dashboardMode === "executive";

  return (
    <AppLayout>
      <DemoBanner />
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
      <PageHeader
        title={dashboardTitle}
        subtitle={t("dashboard.whatNeedsAttention")}
        role="execution"
        help={{ title: isExecutive ? t("dashboard.helpTitleExecutive", { defaultValue: "Executive Dashboard" }) : t("dashboard.helpTitleOperational", { defaultValue: "Operational Dashboard" }), description: isExecutive ? t("dashboard.helpDescExecutive", { defaultValue: "Board-Ready Control Center: DQI, Economic Risk, Portfolio-Übersicht und KI-gestütztes Executive Briefing auf einen Blick." }) : t("dashboard.helpDescOperational", { defaultValue: "Dein tägliches Cockpit: Offene Aufgaben, Eskalationen, Deadlines und Team-KPIs für schnelle operative Steuerung." }) }}
        primaryAction={
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => navigate("/decisions?create=true")}>
            <Plus className="w-3.5 h-3.5" />
            {t("decisions.newDecision", { defaultValue: "+Neue Entscheidung" })}
          </Button>
        }
        secondaryActions={
          <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => toggleDashboardMode("operational")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-all",
                !isExecutive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Operational
            </button>
            <button
              onClick={() => toggleDashboardMode("executive")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-all",
                isExecutive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Crown className="w-3.5 h-3.5" />
              Executive
            </button>
          </div>
        }
      />

      <WelcomeBackBanner />
      <GoLiveProgressWidget />
      <div className="section-gap-lg">

        {/* ═══ LOADING SKELETON ═══ */}
        {isLoading && <DashboardSkeleton />}

        {/* ═══ MAIN DASHBOARD ═══ */}
        {!isLoading && (
          <>
            {/* ═══ AHA MOMENT OVERLAY ═══ */}
            {showAha && ahaData && (
              <Suspense fallback={null}>
                <AhaMomentOverlay
                  costPerDay={ahaData.costPerDay}
                  decisionTitle={ahaData.decisionTitle}
                  onDismiss={() => setShowAha(false)}
                />
              </Suspense>
            )}

            {/* ═══ POST-DECISION INVITE PROMPT ═══ */}
            {decisions.length > 0 && decisions.length <= 2 && teams.length === 0 && (
              <Suspense fallback={null}>
                <PostDecisionInvitePrompt
                  decisionId={decisions[0]?.id}
                  decisionTitle={decisions[0]?.title}
                  costPerDay={decisions[0]?.cost_per_day}
                  isFirstDecision={decisions.length === 1}
                />
              </Suspense>
            )}

            {/* ═══ GUIDED MODE for new users (< 3 decisions) ═══ */}
            {isGuidedMode && (
              <div className="space-y-6">
                <CodPreviewWidget />
              </div>
            )}

            {/* ═══ FULL DASHBOARD (>= 3 decisions) ═══ */}
            {!isGuidedMode && (
              <>
            {/* ═══ 1. TOP ACTION NOW ═══ */}
            <DashboardTopActionWithSla
              overdue={computed.overdue}
              escalated={computed.escalated}
              pendingReviews={computed.pendingReviews}
              blockedTasks={computed.blockedTasks}
              hasData={decisions.length > 0}
              decisions={decisions}
              reviews={contextReviews}
            />

            {/* ═══ 2. KPI ROW – mode-dependent ═══ */}
            {isExecutive ? <CoreKpiGrid /> : <KpiOverviewWidget />}

            {/* Guided Checklist removed — replaced by floating GuidedChecklist */}

            {/* ═══ KEYBOARD SHORTCUT HINT ═══ */}
            {decisions.length < 5 && !localStorage.getItem("shortcut-hint-dismissed") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <Command className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[11px] text-muted-foreground/40">{t("dashboard.shortcutHint")}</span>
                <button
                  onClick={() => localStorage.setItem("shortcut-hint-dismissed", "true")}
                  className="text-muted-foreground/30 hover:text-muted-foreground text-[10px] ml-1"
                >✕</button>
              </motion.div>
            )}

            <PrimaryFocusBanner
              decisions={decisions}
              escalated={computed.escalated}
              overdue={computed.overdue}
              teams={teams}
            />

            <IndustryReminderBanner />
            {!isExecutive && decisions.length > 0 && <AnomalyCards bannersOnly={false} className="mb-2" />}

            {/* ═══ EXECUTIVE MODE ═══ */}
            {isExecutive && (
              <>
                {decisions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-primary/20 bg-primary/[0.02] rounded-lg p-8 text-center"
                  >
                    <Crown className="w-8 h-8 text-primary/30 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold mb-1">{t("dashboard.executiveEmptyTitle", { defaultValue: "Dein Executive Dashboard" })}</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      {t("dashboard.executiveEmptyDesc", { defaultValue: "Decision Quality Index, Portfolio Risk und KI-Briefing füllen sich automatisch mit deinen ersten Entscheidungen." })}
                    </p>
                    <Button size="sm" className="mt-4 gap-1.5" onClick={() => navigate("/decisions")}>
                      <Plus className="w-3.5 h-3.5" />
                      {t("widgets.firstDecision")}
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {/* 2. Verzögerungskosten — Hero */}
                    <WidgetErrorBoundary>
                      <DecisionCostWidget heroMode />
                    </WidgetErrorBoundary>

                    {/* 3. KI Daily Brief */}
                    <WidgetErrorBoundary label="KI-Briefing">
                      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                        <AiBriefingWidget />
                      </Suspense>
                    </WidgetErrorBoundary>

                    {/* 4. Decision Quality Index */}
                    <WidgetErrorBoundary>
                      <DecisionQualityIndex />
                    </WidgetErrorBoundary>

                    {/* 5. Portfolio Risk Overview */}
                    <WidgetErrorBoundary label="Portfolio Risk">
                      <PortfolioRiskOverview decisions={decisions} risks={riskData} />
                    </WidgetErrorBoundary>
                  </>
                )}
              </>
            )}

            {/* ═══ OPERATIONAL MODE ═══ */}
            {!isExecutive && (
              <>
                {/* 🧟 Dead Decision Detector */}
                <WidgetErrorBoundary label="Dead Decision Detector">
                  <DeadDecisionDetector decisions={decisions} />
                </WidgetErrorBoundary>

                {/* KI-Anomalie-Erkennungs-Box */}
                <AnomalyCards bannersOnly className="mb-2" />

                {/* Active Decisions Table (spec: Titel | Kategorie | Priorität | Status | SLA | CoD/Woche | Reviewer) */}
                <ActiveDecisionsTable />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  <div className="lg:col-span-2">
                    <WidgetErrorBoundary label="Stuck Decision Analyzer">
                      <StuckDecisionAnalyzer decisions={decisions} reviews={contextReviews} dependencies={allDependencies} teams={teams} />
                    </WidgetErrorBoundary>
                  </div>
                  <div className="space-y-4">
                    <WidgetErrorBoundary>
                      <EscalationWidget />
                    </WidgetErrorBoundary>
                  </div>
                </div>

                {/* ═══ ROI PROOF ═══ */}
                <WidgetErrorBoundary label="ROI">
                  <RoiProofWidget />
                </WidgetErrorBoundary>

                {/* ═══ DEEP DIVE ═══ */}
                <div className="border-t border-border pt-4">
                  <button
                    onClick={() => setShowDeepDive(!showDeepDive)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2"
                  >
                    {showDeepDive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{showDeepDive ? t("dashboard.hideDetails") : t("dashboard.showDetails")}</span>
                    <div className="flex flex-wrap gap-1.5 ml-2">
                      {["DQI", "Trends", "Radar", "Cost of Delay", "Risk Portfolio"].map(label => (
                        <span key={label} className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 border border-border/50 text-muted-foreground/70">{label}</span>
                      ))}
                    </div>
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
                        <WidgetErrorBoundary>
                          <DecisionQualityIndex />
                        </WidgetErrorBoundary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <WidgetErrorBoundary>
                            <DecisionCostWidget />
                          </WidgetErrorBoundary>
                          <WidgetErrorBoundary label="Portfolio Risk">
                            <PortfolioRiskOverview decisions={decisions} risks={riskData} />
                          </WidgetErrorBoundary>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                          <div className="lg:col-span-2">
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
                                        <linearGradient id="gradCompleted2" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradCreated2" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.08} />
                                          <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                                      <RechartsTooltip contentStyle={chartTooltipStyle} />
                                      <Area type="monotone" dataKey="completed" name={t("dashboard.chartCompleted")} stroke="hsl(var(--primary))" fill="url(#gradCompleted2)" strokeWidth={2} />
                                      <Area type="monotone" dataKey="created" name={t("dashboard.chartCreated")} stroke="hsl(var(--muted-foreground))" fill="url(#gradCreated2)" strokeWidth={1} strokeDasharray="4 4" />
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
                        <WidgetErrorBoundary label="KI-Briefing">
                          <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
                            <AiBriefingWidget />
                          </Suspense>
                        </WidgetErrorBoundary>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
            </>
            )}
          </>
        )}
      </div>

      {/* Floating Guided Checklist */}
      <Suspense fallback={null}>
        <GuidedChecklist
          hasDecision={decisions.length > 0}
          hasTeamMember={teams.length > 0}
          hasSla={decisions.some(d => !!d.due_date)}
          hasCompliance={false}
          hasBrief={false}
        />
      </Suspense>

      {/* NPS Survey */}
      <Suspense fallback={null}>
        {showNps && <NpsModal open={showNps} onClose={() => setShowNps(false)} />}
      </Suspense>
    </AppLayout>
  );
};
/* Wrapper to compute predictions for TopActionNow */
const DashboardTopActionWithSla = ({ decisions, reviews, ...props }: any) => {
  const { predictions } = usePredictiveSla(decisions, reviews);
  return <TopActionNow {...props} slaPredictions={predictions} />;
};

export default Dashboard;
