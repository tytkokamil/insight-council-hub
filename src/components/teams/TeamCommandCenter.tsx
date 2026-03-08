import { useState, useEffect, useMemo } from "react";
import { formatCost } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Flame, Clock, AlertTriangle, TrendingUp, Target, BookOpen,
  CheckCircle, ArrowRight, BarChart3, ShieldAlert, DollarSign,
  Zap, CheckSquare, Brain, Shield, CircleAlert, Lightbulb, Plus,
} from "lucide-react";
import { differenceInDays, differenceInCalendarDays, format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  teamId: string;
}

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

const TeamCommandCenter = ({ teamId }: Props) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const [decisions, setDecisions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [dRes, tRes, rRes, riRes, gRes, lRes] = await Promise.all([
        supabase.from("decisions").select("*").eq("team_id", teamId).is("deleted_at", null),
        supabase.from("tasks").select("*").eq("team_id", teamId).is("deleted_at", null),
        supabase.from("decision_reviews").select("*, decisions!inner(team_id, title)").eq("decisions.team_id", teamId).eq("status", "review"),
        supabase.from("risks").select("*").eq("team_id", teamId).eq("status", "open"),
        supabase.from("strategic_goals").select("*").eq("team_id", teamId).eq("status", "active"),
        supabase.from("lessons_learned").select("*, decisions!inner(team_id)").eq("decisions.team_id", teamId).order("created_at", { ascending: false }).limit(5),
      ]);
      setDecisions(dRes.data ?? []);
      setTasks(tRes.data ?? []);
      setReviews(rRes.data ?? []);
      setRisks(riRes.data ?? []);
      setGoals(gRes.data ?? []);
      setLessons(lRes.data ?? []);
    };
    fetch();
  }, [teamId]);

  // Derived stats
  const openDecisions = useMemo(() =>
    decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status)),
    [decisions]
  );
  const overdueDecisions = useMemo(() =>
    openDecisions.filter(d => d.due_date && new Date(d.due_date) < new Date()),
    [openDecisions]
  );
  const escalatedDecisions = useMemo(() =>
    openDecisions.filter(d => (d.escalation_level ?? 0) >= 1),
    [openDecisions]
  );
  const completedDecisions = useMemo(() => decisions.filter(d => d.status === "implemented"), [decisions]);
  const blockedTasks = useMemo(() => tasks.filter(t => t.status === "blocked"), [tasks]);
  const overdueTasks = useMemo(() =>
    tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"),
    [tasks]
  );
  const openTasks = useMemo(() => tasks.filter(t => t.status !== "done"), [tasks]);

  // Total delay cost
  const totalDelayCost = useMemo(() => {
    let cost = 0;
    for (const d of overdueDecisions) {
      if (!d.due_date) continue;
      const days = differenceInCalendarDays(new Date(), new Date(d.due_date));
      cost += days * 120 * (PRIORITY_MULTIPLIER[d.priority] ?? 1);
    }
    return cost;
  }, [overdueDecisions]);

  // SLA compliance
  const slaCompliance = useMemo(() => {
    if (openDecisions.length === 0) return 100;
    const compliant = openDecisions.filter(d => !d.due_date || new Date(d.due_date) >= new Date()).length;
    return Math.round((compliant / openDecisions.length) * 100);
  }, [openDecisions]);

  // Team health
  const { healthLevel, healthLabel, healthColor, healthBg } = useMemo(() => {
    const score = overdueDecisions.length * 3 + escalatedDecisions.length * 4 + blockedTasks.length * 2;
    if (score === 0) return { healthLevel: "stable", healthLabel: t("teamCmd.stable"), healthColor: "text-success", healthBg: "bg-success" };
    if (score <= 6) return { healthLevel: "warning", healthLabel: t("teamCmd.warning"), healthColor: "text-warning", healthBg: "bg-warning" };
    return { healthLevel: "critical", healthLabel: t("teamCmd.critical"), healthColor: "text-destructive", healthBg: "bg-destructive" };
  }, [overdueDecisions, escalatedDecisions, blockedTasks, t]);

  // Velocity (last 30 days)
  const velocity = useMemo(() => {
    return decisions.filter(d => {
      const diff = differenceInDays(new Date(), new Date(d.created_at));
      return diff <= 30 && d.status === "implemented";
    }).length;
  }, [decisions]);

  return (
    <div className="space-y-8">

      {/* SECTION 1: Team Health Overview */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className={cn(
          "px-5 py-4 flex items-center justify-between",
          healthLevel === "critical" && "bg-destructive/5",
          healthLevel === "warning" && "bg-warning/5",
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", healthBg, healthLevel !== "stable" && "animate-pulse")} />
            <div>
              <p className="text-sm font-semibold">{t("teamCmd.teamHealth")}: <span className={healthColor}>{healthLabel}</span></p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {healthLevel === "stable" && t("teamCmd.stableDesc")}
                {healthLevel === "warning" && t("teamCmd.warningDesc", { overdue: overdueDecisions.length, blocked: blockedTasks.length })}
                {healthLevel === "critical" && t("teamCmd.criticalDesc", { escalated: escalatedDecisions.length, overdue: overdueDecisions.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {escalatedDecisions.length > 0 && (
              <Button size="sm" variant="outline" className="text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => navigate("/war-room")}>
                <Zap className="w-3 h-3" /> War Room
              </Button>
            )}
            {totalDelayCost > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-4 h-4 text-destructive" />
                <span className="font-bold text-destructive">{formatCost(totalDelayCost)}</span>
                <span className="text-xs text-muted-foreground">{t("teamCmd.delayRisk")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-border/60 divide-x divide-border/60">
          {[
            { label: t("teamCmd.slaCompliance"), value: `${slaCompliance}%`, color: slaCompliance === 100 ? "text-success" : slaCompliance >= 80 ? "text-warning" : "text-destructive", icon: Shield },
            { label: t("teamCmd.escalations"), value: escalatedDecisions.length, color: escalatedDecisions.length > 0 ? "text-destructive" : "text-muted-foreground", icon: Zap },
            { label: t("teamCmd.openDecisions"), value: openDecisions.length, color: "text-primary", icon: Clock },
            { label: t("teamCmd.velocity30d"), value: velocity, color: "text-success", icon: TrendingUp },
            { label: t("teamCmd.openRisks"), value: risks.length, color: risks.length > 0 ? "text-warning" : "text-muted-foreground", icon: ShieldAlert },
          ].map((kpi) => (
            <div key={kpi.label} className="px-4 py-3 text-center min-h-[90px] flex flex-col justify-center">
              <kpi.icon className={cn("w-4 h-4 mx-auto mb-1", kpi.color)} />
              <p className={cn("text-xl font-bold", kpi.color)}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Active Decisions */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            {t("teamCmd.activeDecisions")}
            <Badge variant="secondary" className="text-[10px]">{openDecisions.length}</Badge>
          </h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/decisions")}>
            {t("teamCmd.showAll")} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="divide-y divide-border/60">
          {openDecisions.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">{t("teamCmd.noActiveDecisions")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("teamCmd.noActiveDecisionsDesc")}</p>
            </div>
          ) : (
            openDecisions.slice(0, 6).map((d) => {
              const isOverdue = d.due_date && new Date(d.due_date) < new Date();
              const isEscalated = (d.escalation_level ?? 0) >= 1;
              let delayCost = 0;
              if (isOverdue && d.due_date) {
                delayCost = differenceInCalendarDays(new Date(), new Date(d.due_date)) * 120 * (PRIORITY_MULTIPLIER[d.priority] ?? 1);
              }

              return (
                <div
                  key={d.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 hover:bg-muted/30 cursor-pointer transition-colors",
                    isEscalated && "bg-destructive/5",
                  )}
                  onClick={() => navigate(`/decisions/${d.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{d.title}</span>
                      {isEscalated && (
                        <Badge variant="destructive" className="text-[9px] shrink-0">
                          <Zap className="w-2.5 h-2.5 mr-0.5" />{t("teamCmd.escalated")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] capitalize">{t(`status.${d.status}`)}</Badge>
                      <Badge variant="outline" className={cn(
                        "text-[9px]",
                        d.priority === "critical" && "border-destructive/40 text-destructive",
                        d.priority === "high" && "border-warning/40 text-warning",
                      )}>{t(`priority.${d.priority}`)}</Badge>
                      <span>{t(`category.${d.category}`)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {d.ai_risk_score > 0 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className={cn(
                            "text-xs font-semibold",
                            d.ai_risk_score >= 60 ? "text-destructive" : d.ai_risk_score >= 31 ? "text-warning" : "text-success"
                          )}>{d.ai_risk_score}%</span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{t("teamCmd.riskScore")}</TooltipContent>
                      </Tooltip>
                    )}
                    {delayCost > 0 && (
                      <span className="text-[10px] font-semibold text-destructive flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3" />{delayCost >= 1000 ? `${(delayCost / 1000).toFixed(1)}k` : delayCost}€
                      </span>
                    )}
                    {d.due_date && (
                      <span className={cn(
                        "text-[10px]",
                        isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
                      )}>
                        {isOverdue && "⚠ "}
                        {format(new Date(d.due_date), "dd.MM.", { locale: dateFnsLocale })}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: Execution Status (Tasks) */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            {t("teamCmd.executionStatus")}
          </h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/tasks")}>
            {t("teamCmd.allTasks")} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/60 border-b border-border/60">
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-primary">{openTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">{t("teamCmd.openTasks")}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground")}>
              {overdueTasks.length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("teamCmd.overdue")}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", blockedTasks.length > 0 ? "text-destructive" : "text-muted-foreground")}>
              {blockedTasks.length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("teamCmd.blocked")}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-success">
              {tasks.filter(t => t.status === "done").length}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("teamCmd.done")}</p>
          </div>
        </div>

        {blockedTasks.length > 0 ? (
          <div className="px-5 py-3">
            <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t("teamCmd.blockedTasks")}
            </p>
            <div className="space-y-1.5">
              {blockedTasks.slice(0, 4).map((tk) => (
                <div
                  key={tk.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors"
                  onClick={() => navigate(`/tasks/${tk.id}`)}
                >
                  <CircleAlert className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{tk.title}</span>
                  {tk.due_date && (
                    <span className="text-[10px] text-destructive">
                      {format(new Date(tk.due_date), "dd.MM.", { locale: dateFnsLocale })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : overdueTasks.length > 0 ? (
          <div className="px-5 py-3">
            <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t("teamCmd.overdueTasks")}
            </p>
            <div className="space-y-1.5">
              {overdueTasks.slice(0, 4).map((tk) => (
                <div
                  key={tk.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10 cursor-pointer hover:bg-warning/10 transition-colors"
                  onClick={() => navigate(`/tasks/${tk.id}`)}
                >
                  <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{tk.title}</span>
                  <span className="text-[10px] text-warning">
                    {format(new Date(tk.due_date!), "dd.MM.", { locale: dateFnsLocale })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <CheckCircle className="w-6 h-6 text-success mx-auto mb-1.5 opacity-50" />
            <p className="text-xs text-muted-foreground">{t("teamCmd.executionOnTrack")}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* SECTION 4: Strategic Goals */}
        {(() => {
          const hasGoals = goals.length > 0;
          return (
            <div className={cn("rounded-xl border overflow-hidden", hasGoals ? "border-success/30 bg-success/[0.02]" : "border-border/60 bg-card")}>
              <div className={cn("px-5 py-3 border-b flex items-center justify-between", hasGoals ? "border-success/20" : "border-border/60")}>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className={cn("w-4 h-4", hasGoals ? "text-success" : "text-primary")} />
                  {t("teamCmd.strategicGoals")}
                  {hasGoals && <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
                  <Badge variant="secondary" className="text-[10px]">{goals.length}</Badge>
                </h3>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/strategy")}>
                  <Plus className="w-3 h-3" /> {hasGoals ? t("teamCmd.addGoal") : t("strategy.adopt")}
                </Button>
              </div>

              {!hasGoals ? (
                <div className="px-5 py-6 text-center">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium text-muted-foreground">{t("strategy.sugSectionTitle")}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{t("strategy.sugSectionDesc")}</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate("/strategy")}>
                    <CheckCircle className="w-3 h-3" />
                    {t("strategy.adopt")}
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {goals.slice(0, 4).map((g) => {
                    const isInverse = /incident|error|minim|zero|null/i.test(g.title);
                    let progress: number;
                    if (isInverse) {
                      progress = (g.target_value === 0 && (g.current_value ?? 0) === 0) ? 100
                        : g.target_value ? Math.max(0, Math.round(((g.target_value - (g.current_value ?? 0)) / g.target_value) * 100))
                        : 0;
                    } else {
                      progress = g.target_value ? Math.round(((g.current_value ?? 0) / g.target_value) * 100) : 0;
                    }
                    return (
                      <div key={g.id} className="px-5 py-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-medium truncate">{g.title}</span>
                            {isInverse && (
                              <Badge variant="outline" className="text-[9px] text-muted-foreground border-border/60 shrink-0">Ziel: minimieren</Badge>
                            )}
                          </div>
                          <span className={cn(
                            "text-xs font-bold shrink-0",
                            progress >= 80 ? "text-success" : progress >= 40 ? "text-warning" : "text-muted-foreground"
                          )}>{progress}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-1.5" />
                        {g.due_date && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {t("teamCmd.dueDateLabel")}: {format(new Date(g.due_date), "dd.MM.yyyy", { locale: dateFnsLocale })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION 5: Learnings & Trends */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {t("teamCmd.learnings")}
              <Badge variant="secondary" className="text-[10px]">{lessons.length}</Badge>
            </h3>
          </div>

          {lessons.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">{t("teamCmd.noLearnings")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("teamCmd.noLearningsHint")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {lessons.length >= 2 && (
                <div className="px-5 py-3 bg-primary/5 flex items-start gap-2">
                  <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">{t("teamCmd.trendInsight")}</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {lessons.some(l => l.what_went_wrong) 
                        ? t("teamCmd.trendNegative", { count: lessons.length })
                        : t("teamCmd.trendPositive", { count: lessons.length })
                      }
                    </p>
                  </div>
                </div>
              )}

              {lessons.slice(0, 3).map((l) => (
                <div key={l.id} className="px-5 py-3">
                  <p className="text-xs font-medium line-clamp-2">{l.key_takeaway}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{format(new Date(l.created_at), "dd.MM.yyyy", { locale: dateFnsLocale })}</span>
                    {l.what_went_well && (
                      <span className="flex items-center gap-0.5 text-success">
                        <CheckCircle className="w-2.5 h-2.5" /> {t("teamCmd.success")}
                      </span>
                    )}
                    {l.what_went_wrong && (
                      <span className="flex items-center gap-0.5 text-destructive">
                        <AlertTriangle className="w-2.5 h-2.5" /> {t("teamCmd.risk")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Open Risks */}
      {risks.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              {t("teamCmd.openRisksSection")}
              <Badge variant="destructive" className="text-[10px]">{risks.length}</Badge>
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/risk-register")}>
              {t("teamCmd.riskRegister")} <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {risks.slice(0, 4).map((r) => {
              const score = r.risk_score || r.likelihood * r.impact;
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    score >= 15 ? "bg-destructive" : score >= 9 ? "bg-warning" : "bg-success"
                  )} />
                  <span className="text-xs font-medium flex-1 truncate">{r.title}</span>
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    score >= 15 ? "text-destructive" : score >= 9 ? "text-warning" : "text-muted-foreground"
                  )}>{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Open Reviews */}
      {reviews.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              {t("teamCmd.openReviews")}
              <Badge variant="secondary" className="text-[10px]">{reviews.length}</Badge>
            </h3>
          </div>
          <div className="divide-y divide-border/60">
            {reviews.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => navigate(`/decisions/${r.decision_id}`)}
              >
                <Badge variant="outline" className="text-[10px]">Review</Badge>
                <span className="text-xs flex-1 truncate">{(r as any).decisions?.title || r.decision_id.slice(0, 8)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCommandCenter;
