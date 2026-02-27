import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Shield, AlertTriangle, Clock, TrendingUp, Users, Zap,
  ChevronRight, Activity, Target, Flame, ArrowUpRight, Lock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useDecisions, useFilteredDependencies, useFilteredNotifications } from "@/hooks/useDecisions";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";

interface CriticalDecision {
  id: string;
  title: string;
  priority: string;
  category: string;
  status: string;
  created_at: string;
  due_date: string | null;
  ai_risk_score: number | null;
  ai_impact_score: number | null;
  escalation_level: number | null;
  daysOpen: number;
  overdue: boolean;
  urgencyScore: number;
}

interface SystemicRisk {
  type: "bottleneck" | "escalation" | "stale" | "quality";
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
  metric: string;
}

const WarRoom = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: allDeps = [], isLoading: loadingDeps } = useFilteredDependencies();
  const { data: allNotifications = [], isLoading: loadingNotif } = useFilteredNotifications();
  const loading = loadingDec || loadingDeps || loadingNotif || checkingAdmin;

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).single().then(({ data }) => {
      setIsAdmin(data?.role === "org_owner" || data?.role === "org_admin");
      setCheckingAdmin(false);
    });
  }, [user]);

  const escalationNotifications = useMemo(() =>
    allNotifications.filter(n => n.type === "escalation"), [allNotifications]);

  const priorityMap: Record<string, string> = {
    critical: t("warRoom.priorityCritical"), high: t("warRoom.priorityHigh"),
    medium: t("warRoom.priorityMedium"), low: t("warRoom.priorityLow"),
  };
  const categoryMap: Record<string, string> = {
    strategic: t("warRoom.catStrategic"), budget: t("warRoom.catBudget"),
    hr: t("warRoom.catHr"), technical: t("warRoom.catTechnical"),
    operational: t("warRoom.catOperational"), marketing: t("warRoom.catMarketing"),
  };
  const statusMap: Record<string, string> = {
    draft: t("warRoom.statusDraft"), review: t("warRoom.statusReview"), approved: t("warRoom.statusApproved"),
  };

  const { criticals, risks, stats } = useMemo(() => {
    if (!isAdmin || allDecisions.length === 0) {
      return {
        criticals: [] as CriticalDecision[],
        risks: [] as SystemicRisk[],
        stats: { total: 0, open: 0, avgDays: 0, implementedThisMonth: 0, rejectedThisMonth: 0, escalations: 0 },
      };
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const open = allDecisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const implemented = allDecisions.filter(d => d.status === "implemented" && new Date(d.created_at) >= thisMonth);
    const rejected = allDecisions.filter(d => d.status === "rejected" && new Date(d.created_at) >= thisMonth);
    const durations = open.map(d => differenceInDays(now, new Date(d.created_at)));
    const avgDays = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const computedStats = {
      total: allDecisions.length, open: open.length, avgDays,
      implementedThisMonth: implemented.length, rejectedThisMonth: rejected.length,
      escalations: escalationNotifications.filter(n => new Date(n.created_at) >= thisMonth).length,
    };

    const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const scored = open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const overdue = d.due_date ? new Date(d.due_date) < now : false;
      const riskWeight = (d.ai_risk_score || 0) / 20;
      const urgencyScore =
        (priorityWeight[d.priority] || 1) * 25 + (overdue ? 30 : 0) +
        Math.min(daysOpen, 30) * 1.5 + riskWeight * 10 + (d.escalation_level || 0) * 15;
      return { ...d, daysOpen, overdue, urgencyScore } as CriticalDecision;
    });
    scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const detectedRisks: SystemicRisk[] = [];
    const stale = open.filter(d => differenceInDays(now, new Date(d.created_at)) > 14 && ["draft", "review"].includes(d.status));
    if (stale.length > 0) {
      detectedRisks.push({
        type: "stale", severity: stale.length > 3 ? "critical" : stale.length > 1 ? "high" : "medium",
        title: t("warRoom.riskStale"), detail: t("warRoom.riskStaleDetail", { count: stale.length }), metric: t("warRoom.riskStaleMetric", { count: stale.length }),
      });
    }

    const recentEscalations = escalationNotifications.filter(n => differenceInDays(now, new Date(n.created_at)) <= 7).length;
    if (recentEscalations > 2) {
      detectedRisks.push({
        type: "escalation", severity: recentEscalations > 5 ? "critical" : "high",
        title: t("warRoom.riskEscalation"), detail: t("warRoom.riskEscalationDetail", { count: recentEscalations }), metric: t("warRoom.riskEscalationMetric", { count: recentEscalations }),
      });
    }

    const blockedIds = new Set(allDeps.map(d => d.target_decision_id));
    const blockedOpen = open.filter(d => blockedIds.has(d.id));
    if (blockedOpen.length > 1) {
      detectedRisks.push({
        type: "bottleneck", severity: blockedOpen.length > 3 ? "critical" : "high",
        title: t("warRoom.riskBottleneck"), detail: t("warRoom.riskBottleneckDetail", { count: blockedOpen.length }), metric: t("warRoom.riskBottleneckMetric", { count: blockedOpen.length }),
      });
    }

    const recentTotal = allDecisions.filter(d => new Date(d.created_at) >= thisMonth).length;
    const rejRate = recentTotal > 0 ? (rejected.length / recentTotal) * 100 : 0;
    if (rejRate > 30 && recentTotal >= 3) {
      detectedRisks.push({
        type: "quality", severity: rejRate > 50 ? "critical" : "high",
        title: t("warRoom.riskQuality"), detail: t("warRoom.riskQualityDetail", { rate: Math.round(rejRate) }), metric: `${Math.round(rejRate)}%`,
      });
    }

    if (detectedRisks.length === 0) {
      detectedRisks.push({
        type: "quality", severity: "medium",
        title: t("warRoom.noRisks"), detail: t("warRoom.noRisksDetail"), metric: t("warRoom.noRisksMetric"),
      });
    }

    return { criticals: scored.slice(0, 5), risks: detectedRisks, stats: computedStats };
  }, [allDecisions, allDeps, escalationNotifications, isAdmin, t]);

  const severityColor = (s: string) =>
    s === "critical" ? "border-destructive bg-destructive/10" : s === "high" ? "border-warning bg-warning/10" : "border-border bg-muted/30";
  const severityTextColor = (s: string) =>
    s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : "text-muted-foreground";
  const priorityBadge = (p: string) =>
    p === "critical" ? "bg-destructive/20 text-destructive" : p === "high" ? "bg-warning/20 text-warning" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("warRoom.commandCenter")}</p>
            <h1 className="font-display text-xl font-bold">{t("warRoom.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "dd. MMMM yyyy, HH:mm", { locale: dateFnsLocale })} {t("warRoom.timeLabel")}</p>
          </div>
          <PageHelpButton title={t("warRoom.helpTitle")} description={t("warRoom.helpDesc")} />
        </div>

        {loading ? (
          <AnalysisPageSkeleton cards={6} sections={2} />
        ) : isAdmin === false ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
            <h2 className="text-lg font-semibold mb-2">{t("warRoom.accessRestricted")}</h2>
            <p className="text-sm text-muted-foreground max-w-md">{t("warRoom.accessRestrictedDesc")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: t("warRoom.total"), value: stats.total, icon: Target, color: "text-primary" },
                { label: t("warRoom.open"), value: stats.open, icon: Clock, color: "text-warning" },
                { label: t("warRoom.avgDaysOpen"), value: stats.avgDays, icon: TrendingUp, color: "text-muted-foreground" },
                { label: t("warRoom.implementedMonth"), value: stats.implementedThisMonth, icon: Zap, color: "text-success" },
                { label: t("warRoom.rejectedMonth"), value: stats.rejectedThisMonth, icon: AlertTriangle, color: "text-destructive" },
                { label: t("warRoom.escalationsMonth"), value: stats.escalations, icon: Flame, color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold font-display tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-destructive" /> {t("warRoom.topCritical")}
                </h2>
                <div className="space-y-2">
                  {criticals.map((d, i) => (
                    <div key={d.id} className={`p-4 rounded-lg border ${d.overdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/20"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityBadge(d.priority)}`}>
                              {priorityMap[d.priority] || d.priority}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {categoryMap[d.category] || d.category}
                            </span>
                            {d.overdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">{t("warRoom.overdue")}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                            <span>{t("warRoom.daysOpen", { count: d.daysOpen })}</span>
                            {d.ai_risk_score != null && <span>{t("warRoom.risk", { score: d.ai_risk_score })}</span>}
                            {d.escalation_level != null && d.escalation_level > 0 && (
                              <span className="text-destructive">{t("warRoom.escalationLevel", { level: d.escalation_level })}</span>
                            )}
                            <span>{statusMap[d.status] || d.status}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold font-display tabular-nums text-foreground">{Math.round(d.urgencyScore)}</p>
                          <p className="text-[10px] text-muted-foreground">{t("warRoom.urgency")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {criticals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">{t("warRoom.noCritical")}</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" /> {t("warRoom.systemicRisks")}
                </h2>
                <div className="space-y-2">
                  {risks.map((r, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${severityColor(r.severity)}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-xs font-semibold ${severityTextColor(r.severity)}`}>{r.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                          r.severity === "critical" ? "bg-destructive/20 text-destructive" : r.severity === "high" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
                        }`}>
                          {r.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <ArrowUpRight className={`w-3 h-3 ${severityTextColor(r.severity)}`} />
                        <span className={`text-xs font-medium ${severityTextColor(r.severity)}`}>{r.metric}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-3">
                    <Activity className="w-3.5 h-3.5 text-primary" /> {t("warRoom.systemPulse")}
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: t("warRoom.decisionLoad"), value: stats.open, max: Math.max(stats.total, 1), color: stats.open > 10 ? "bg-destructive" : stats.open > 5 ? "bg-warning" : "bg-success" },
                      { label: t("warRoom.implementationRate"), value: stats.implementedThisMonth, max: Math.max(stats.implementedThisMonth + stats.rejectedThisMonth + stats.open, 1), color: "bg-primary" },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{bar.label}</span>
                          <span>{bar.value}/{bar.max}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${bar.color} transition-all`} style={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default WarRoom;
