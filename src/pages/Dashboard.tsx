import { useMemo, useState, useEffect, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, AlertTriangle, Clock, ArrowRight, Activity,
  Zap, FileText, Eye, TrendingUp, TrendingDown,
  Minus, ShieldAlert, CheckCircle2, Command, ListTodo,
  Link2, Users, RefreshCw, Shield, History, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import DecisionQualityIndex from "@/components/dashboard/DecisionQualityIndex";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useReviews, useFilteredDependencies } from "@/hooks/useDecisions";
import { useGuidedMode } from "@/hooks/useGuidedMode";
import { useTasks } from "@/hooks/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRisks } from "@/hooks/useRisks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslatedLabels } from "@/lib/labels";
import { format, differenceInDays, subDays, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";

const LeaderboardWidget = lazy(() => import("@/components/dashboard/LeaderboardWidget"));
const AiBriefingWidget = lazy(() => import("@/components/dashboard/AiBriefingWidget"));
const RoiDashboardWidget = lazy(() => import("@/components/dashboard/RoiDashboardWidget"));
const OnboardingTour = lazy(() => import("@/components/onboarding/OnboardingTour"));

type TimeRange = 7 | 30 | 90;

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const { statusLabels: tStatusLabels } = useTranslatedLabels(t);
  const { data: allDecisions = [], isLoading: loadingDec, isError: errorDec, refetch: refetchDec } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: risks = [] } = useRisks();
  const { data: tasks = [], isLoading: loadingTasks, isError: errorTasks, refetch: refetchTasks } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useReviews();
  const { data: dependencies = [] } = useFilteredDependencies();
  const profileMap = buildProfileMap(profiles);
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const navigate = useNavigate();
  const { mode, setMode, shouldShowAdvanced, decisionCount, implementedCount } = useGuidedMode();

  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [dismissedAdvancedHint, setDismissedAdvancedHint] = useState(() => localStorage.getItem("advanced-hint-dismissed") === "true");
  const [seedingDemo, setSeedingDemo] = useState(false);

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

  const effectiveDays = timeRange;

  const decisions = isPersonal
    ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
    : allDecisions;
  const contextTasks = isPersonal
    ? tasks.filter(t => t.created_by === user?.id || t.assignee_id === user?.id)
    : tasks;

  // === ALL COMPUTED DATA ===
  const computed = useMemo(() => {
    const now = new Date();
    const rangeStart = subDays(now, effectiveDays);
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

    const maxEscalation = escalated.length > 0 ? Math.max(...escalated.map(d => d.escalation_level || 0)) : 0;

    const implemented = decisions.filter(d => d.status === "implemented");
    const velocities = implemented.filter(d => d.implemented_at).map(d => differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)));
    const avgDecisionTime = velocities.length > 0 ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10 : null;

    const completionRate = decisions.length > 0 ? Math.round((implemented.length / decisions.length) * 100) : 0;

    // Before/After comparison
    const last90 = subDays(now, 90);
    const prev90 = subDays(now, 180);
    const currentImpl = implemented.filter(d => d.implemented_at && new Date(d.implemented_at) >= last90);
    const prevImpl = implemented.filter(d => d.implemented_at && new Date(d.implemented_at) >= prev90 && new Date(d.implemented_at) < last90);

    const currentAvgDays = currentImpl.length > 0
      ? Math.round(currentImpl.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / currentImpl.length)
      : null;
    const prevAvgDays = prevImpl.length > 0
      ? Math.round(prevImpl.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / prevImpl.length)
      : null;

    const currentEsc = decisions.filter(d => (d.escalation_level || 0) >= 1 && new Date(d.created_at) >= last90).length;
    const prevEsc = decisions.filter(d => (d.escalation_level || 0) >= 1 && new Date(d.created_at) >= prev90 && new Date(d.created_at) < last90).length;

    const defaultRate = currentTeam?.hourly_rate || 75;
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

    // Speed improvement potential
    const avgDaysAll = avgDecisionTime ?? 0;
    const speedImprovementPotential = avgDaysAll > 0 ? Math.round(totalDelayCost * 0.15) : 0;

    // Weekly chart data
    const weekData = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(now, (7 - i) * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekLabel = format(weekEnd, "dd.MM", { locale: dateFnsLocale });
      const completed = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= weekStart && new Date(d.implemented_at) < weekEnd).length;
      const created = decisions.filter(d => new Date(d.created_at) >= weekStart && new Date(d.created_at) < weekEnd).length;
      return { week: weekLabel, completed, created };
    });

    const recentlyOpened = [...decisions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);

    return {
      overdue, escalated, pendingReviews, active, blockedTasks,
      maxEscalation, implemented,
      openCount: active.length, avgDecisionTime, completionRate, totalDelayCost,
      currentAvgDays, prevAvgDays, currentEsc, prevEsc,
      speedImprovementPotential,
      weekData, costItems, recentlyOpened,
    };
  }, [decisions, contextTasks, reviews, dependencies, user, effectiveDays, currentTeam, dateFnsLocale]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

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
  const actionCount = computed.overdue.length + computed.escalated.length + computed.pendingReviews.length + computed.blockedTasks.length;

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

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{dashboardTitle}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.whatNeedsAttention")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border p-0.5">
            {([7, 30, 90] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${timeRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {r}d
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/decisions")} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> {t("dashboard.newLabel")}
          </Button>
        </div>
      </div>

      <div className="space-y-8">

        {/* ═══ 1. DQI — HERO SECTION (Primary) ═══ */}
        {!isLoading && (
          <WidgetErrorBoundary>
            <DecisionQualityIndex />
          </WidgetErrorBoundary>
        )}

        {/* ═══ 2. AI BRIEFING ═══ */}
        {!isLoading && (
          <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
            <AiBriefingWidget />
          </Suspense>
        )}

        {/* ═══ 3. THREE PRIMARY KPIs (Secondary) ═══ */}
        {!isLoading && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Speed */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="border border-border rounded-xl p-6 cursor-pointer hover:border-foreground/20 transition-all group"
                onClick={() => navigate("/analytics")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  {computed.currentAvgDays != null && computed.prevAvgDays != null && (
                    <Badge variant="outline" className={cn("text-[10px]",
                      computed.currentAvgDays < computed.prevAvgDays ? "text-success border-success/30" : "text-destructive border-destructive/30"
                    )}>
                      {computed.currentAvgDays < computed.prevAvgDays ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {computed.prevAvgDays}d → {computed.currentAvgDays}d
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold tracking-tight mb-1">
                  {computed.avgDecisionTime != null ? `${computed.avgDecisionTime}d` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Ø Time-to-Decision</p>
              </motion.div>

              {/* Escalations */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="border border-border rounded-xl p-6 cursor-pointer hover:border-foreground/20 transition-all"
                onClick={() => navigate("/engine")}>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                    computed.escalated.length > 0 ? "bg-warning/10" : "bg-muted")}>
                    <AlertTriangle className={cn("w-5 h-5", computed.escalated.length > 0 ? "text-warning" : "text-muted-foreground")} />
                  </div>
                  {computed.prevEsc > 0 && (
                    <Badge variant="outline" className={cn("text-[10px]",
                      computed.currentEsc < computed.prevEsc ? "text-success border-success/30" : "text-muted-foreground"
                    )}>
                      {computed.prevEsc} → {computed.currentEsc}
                    </Badge>
                  )}
                </div>
                <p className={cn("text-3xl font-bold tracking-tight mb-1", computed.escalated.length > 0 && "text-warning")}>
                  {computed.escalated.length}
                </p>
                <p className="text-sm text-muted-foreground">Aktive Eskalationen</p>
              </motion.div>

              {/* Delay Cost */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="border border-border rounded-xl p-6 cursor-pointer hover:border-foreground/20 transition-all"
                onClick={() => navigate("/analytics")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-destructive" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-destructive mb-1">{formatCost(computed.totalDelayCost)}</p>
                <p className="text-sm text-muted-foreground">Verzögerungskosten</p>
                {computed.speedImprovementPotential > 0 && (
                  <p className="text-xs text-success mt-2">
                    Potenzial: −{formatCost(computed.speedImprovementPotential)} bei 15% Speed↑
                  </p>
                )}
              </motion.div>
            </div>
          </section>
        )}

        {/* ═══ 4. ACTION REQUIRED (Secondary) ═══ */}
        {!isLoading && actionCount > 0 && (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.actionRequired")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  count: computed.overdue.length,
                  label: t("dashboard.overdue"),
                  icon: Clock,
                  borderColor: "border-destructive/20",
                  bgColor: "bg-destructive/[0.03]",
                  iconColor: "text-destructive",
                  path: "/decisions",
                },
                {
                  count: computed.escalated.length,
                  label: t("dashboard.escalations"),
                  icon: AlertTriangle,
                  borderColor: "border-warning/20",
                  bgColor: "bg-warning/[0.03]",
                  iconColor: "text-warning",
                  path: "/engine",
                  extra: computed.maxEscalation > 0 ? `L${computed.maxEscalation}` : undefined,
                },
                {
                  count: computed.pendingReviews.length,
                  label: t("dashboard.openReviews"),
                  icon: Eye,
                  borderColor: "border-primary/20",
                  bgColor: "bg-primary/[0.03]",
                  iconColor: "text-primary",
                  path: computed.pendingReviews.length > 0 ? `/decisions/${computed.pendingReviews[0].decision_id}` : "/decisions",
                  actionLabel: t("dashboard.startReviewBtn"),
                },
                {
                  count: computed.blockedTasks.length,
                  label: t("dashboard.blockedTasks"),
                  icon: Link2,
                  borderColor: "border-accent-violet/20",
                  bgColor: "bg-accent-violet/[0.03]",
                  iconColor: "text-accent-violet",
                  path: "/tasks",
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${item.borderColor} ${item.bgColor} border rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    {item.extra && <span className={`text-[10px] font-medium ${item.iconColor}`}>{item.extra}</span>}
                  </div>
                  <motion.p
                    key={item.count}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-2xl font-semibold tracking-tight"
                  >
                    {item.count}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                  {item.count > 0 && (
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-7" onClick={() => navigate(item.path)}>
                      {item.actionLabel || t("common.show")} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && actionCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-success/20 bg-success/[0.04] rounded-lg p-6 text-center"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
            </motion.div>
            <p className="text-sm font-medium text-success">{t("dashboard.allGood")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.noActions")}</p>
          </motion.div>
        )}

        {/* ═══ 5. MAIN CHART (Secondary) ═══ */}
        {!isLoading && (
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.trends")}</h2>
            <div className="border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">{t("dashboard.decisionsPerWeek")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.weekTrend")}</p>
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
                    <Area type="monotone" dataKey="completed" name="Abgeschlossen" stroke="hsl(var(--primary))" fill="url(#gradCompleted)" strokeWidth={2} />
                    <Area type="monotone" dataKey="created" name="Erstellt" stroke="hsl(var(--muted-foreground))" fill="url(#gradCreated)" strokeWidth={1} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* ═══ 6. BEFORE/AFTER ROI (Tertiary) ═══ */}
        {!isLoading && (
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
            <WidgetErrorBoundary>
              <RoiDashboardWidget />
            </WidgetErrorBoundary>
          </Suspense>
        )}

        {/* ═══ 7. RECENTLY OPENED (Tertiary/Compact) ═══ */}
        {!isLoading && computed.recentlyOpened.length > 0 && (
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

        {/* ═══ 8. LEADERBOARD (Tertiary) ═══ */}
        {!isLoading && (
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
            <WidgetErrorBoundary>
              <LeaderboardWidget />
            </WidgetErrorBoundary>
          </Suspense>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;