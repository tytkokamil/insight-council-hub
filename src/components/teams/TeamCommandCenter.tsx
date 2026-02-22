import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  teamId: string;
}

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

const TeamCommandCenter = ({ teamId }: Props) => {
  const navigate = useNavigate();
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
        supabase.from("decision_reviews").select("*, decisions!inner(team_id)").eq("decisions.team_id", teamId).eq("status", "review"),
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
    if (score === 0) return { healthLevel: "stable", healthLabel: "Stable", healthColor: "text-success", healthBg: "bg-success" };
    if (score <= 6) return { healthLevel: "warning", healthLabel: "Warning", healthColor: "text-warning", healthBg: "bg-warning" };
    return { healthLevel: "critical", healthLabel: "Critical", healthColor: "text-destructive", healthBg: "bg-destructive" };
  }, [overdueDecisions, escalatedDecisions, blockedTasks]);

  // Velocity (last 30 days)
  const velocity = useMemo(() => {
    return decisions.filter(d => {
      const diff = differenceInDays(new Date(), new Date(d.created_at));
      return diff <= 30 && d.status === "implemented";
    }).length;
  }, [decisions]);

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: Team Health Overview
         ═══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn(
          "px-5 py-4 flex items-center justify-between",
          healthLevel === "critical" && "bg-destructive/5",
          healthLevel === "warning" && "bg-warning/5",
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", healthBg, healthLevel !== "stable" && "animate-pulse")} />
            <div>
              <p className="text-sm font-semibold">Team Health: <span className={healthColor}>{healthLabel}</span></p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {healthLevel === "stable" && "Keine Eskalationen · Alle SLAs eingehalten · Kein blockiertes Element"}
                {healthLevel === "warning" && `${overdueDecisions.length} überfällig · ${blockedTasks.length} blockiert`}
                {healthLevel === "critical" && `${escalatedDecisions.length} eskaliert · ${overdueDecisions.length} überfällig · Sofortige Aufmerksamkeit erforderlich`}
              </p>
            </div>
          </div>
          {totalDelayCost > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="w-4 h-4 text-destructive" />
              <span className="font-bold text-destructive">{totalDelayCost.toLocaleString("de-DE")}€</span>
              <span className="text-xs text-muted-foreground">Verzögerungsrisiko</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-border divide-x divide-border">
          {[
            {
              label: "SLA Compliance",
              value: `${slaCompliance}%`,
              color: slaCompliance === 100 ? "text-success" : slaCompliance >= 80 ? "text-warning" : "text-destructive",
              icon: Shield,
            },
            {
              label: "Eskalationen",
              value: escalatedDecisions.length,
              color: escalatedDecisions.length > 0 ? "text-destructive" : "text-muted-foreground",
              icon: Zap,
            },
            {
              label: "Offene Entsch.",
              value: openDecisions.length,
              color: "text-primary",
              icon: Clock,
            },
            {
              label: "Velocity (30d)",
              value: velocity,
              color: "text-success",
              icon: TrendingUp,
            },
            {
              label: "Offene Risiken",
              value: risks.length,
              color: risks.length > 0 ? "text-warning" : "text-muted-foreground",
              icon: ShieldAlert,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="px-4 py-3 text-center">
              <kpi.icon className={cn("w-4 h-4 mx-auto mb-1", kpi.color)} />
              <p className={cn("text-xl font-bold", kpi.color)}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: Aktive Entscheidungen
         ═══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Aktive Entscheidungen
            <Badge variant="secondary" className="text-[10px]">{openDecisions.length}</Badge>
          </h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/decisions")}>
            Alle anzeigen <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {openDecisions.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">Keine aktiven Entscheidungen</p>
              <p className="text-xs text-muted-foreground mt-0.5">Das Team hat derzeit keine offenen Entscheidungsprozesse.</p>
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
                          <Zap className="w-2.5 h-2.5 mr-0.5" />Eskaliert
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] capitalize">{d.status}</Badge>
                      <Badge variant="outline" className={cn(
                        "text-[9px]",
                        d.priority === "critical" && "border-destructive/40 text-destructive",
                        d.priority === "high" && "border-warning/40 text-warning",
                      )}>{d.priority}</Badge>
                      <span className="capitalize">{d.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {d.ai_risk_score > 0 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className={cn(
                            "text-xs font-semibold",
                            d.ai_risk_score >= 70 ? "text-destructive" : d.ai_risk_score >= 40 ? "text-warning" : "text-success"
                          )}>{d.ai_risk_score}%</span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Risiko-Score</TooltipContent>
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
                        {format(new Date(d.due_date), "dd.MM.", { locale: de })}
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

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: Execution Status (Tasks)
         ═══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            Execution Status
          </h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/tasks")}>
            Alle Aufgaben <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Task KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border border-b border-border">
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-primary">{openTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Offene Aufgaben</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground")}>
              {overdueTasks.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Überfällig</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", blockedTasks.length > 0 ? "text-destructive" : "text-muted-foreground")}>
              {blockedTasks.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Blockiert</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-success">
              {tasks.filter(t => t.status === "done").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Erledigt</p>
          </div>
        </div>

        {/* Blocked tasks that impact decisions */}
        {blockedTasks.length > 0 ? (
          <div className="px-5 py-3">
            <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Blockierte Aufgaben
            </p>
            <div className="space-y-1.5">
              {blockedTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <CircleAlert className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{t.title}</span>
                  {t.due_date && (
                    <span className="text-[10px] text-destructive">
                      {format(new Date(t.due_date), "dd.MM.", { locale: de })}
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
              Überfällige Aufgaben
            </p>
            <div className="space-y-1.5">
              {overdueTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10 cursor-pointer hover:bg-warning/10 transition-colors"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{t.title}</span>
                  <span className="text-[10px] text-warning">
                    {format(new Date(t.due_date!), "dd.MM.", { locale: de })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <CheckCircle className="w-6 h-6 text-success mx-auto mb-1.5 opacity-50" />
            <p className="text-xs text-muted-foreground">Keine blockierten oder überfälligen Aufgaben. Execution läuft planmäßig.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ═══════════════════════════════════════════════════════
            SECTION 4: Strategische Ziele
           ═══════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Strategische Ziele
              <Badge variant="secondary" className="text-[10px]">{goals.length}</Badge>
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/strategy")}>
              <Plus className="w-3 h-3" /> Ziel hinzufügen
            </Button>
          </div>

          {goals.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">Kein strategisches Ziel zugeordnet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Teams mit klaren Zielen treffen 40% schnellere Entscheidungen.
              </p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate("/strategy")}>
                <Plus className="w-3 h-3" />
                Erstes Ziel definieren
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {goals.slice(0, 4).map((g) => {
                const progress = g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0;
                return (
                  <div key={g.id} className="px-5 py-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium truncate">{g.title}</span>
                      <span className={cn(
                        "text-xs font-bold",
                        progress >= 80 ? "text-success" : progress >= 40 ? "text-warning" : "text-muted-foreground"
                      )}>{progress}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-1.5" />
                    {g.due_date && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Fällig: {format(new Date(g.due_date), "dd.MM.yyyy", { locale: de })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 5: Learnings & Trends
           ═══════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Learnings & Erkenntnisse
              <Badge variant="secondary" className="text-[10px]">{lessons.length}</Badge>
            </h3>
          </div>

          {lessons.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">Noch keine Learnings erfasst</p>
              <p className="text-xs text-muted-foreground mt-1">
                Learnings entstehen automatisch, wenn Entscheidungen abgeschlossen werden.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Trend insight */}
              {lessons.length >= 2 && (
                <div className="px-5 py-3 bg-primary/5 flex items-start gap-2">
                  <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Trend-Erkenntnis</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {lessons.length} Learnings in den letzten Entscheidungen erfasst. 
                      {lessons.some(l => l.what_went_wrong) 
                        ? " Wiederkehrende Risiko-Muster erkannt – Prozessanpassung empfohlen."
                        : " Überwiegend positive Ergebnisse – aktuelle Strategie beibehalten."
                      }
                    </p>
                  </div>
                </div>
              )}

              {lessons.slice(0, 3).map((l) => (
                <div key={l.id} className="px-5 py-3">
                  <p className="text-xs font-medium line-clamp-2">{l.key_takeaway}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{format(new Date(l.created_at), "dd.MM.yyyy", { locale: de })}</span>
                    {l.what_went_well && (
                      <span className="flex items-center gap-0.5 text-success">
                        <CheckCircle className="w-2.5 h-2.5" /> Erfolg
                      </span>
                    )}
                    {l.what_went_wrong && (
                      <span className="flex items-center gap-0.5 text-destructive">
                        <AlertTriangle className="w-2.5 h-2.5" /> Risiko
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Open Risks (visible if any)
         ═══════════════════════════════════════════════════════ */}
      {risks.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Offene Risiken
              <Badge variant="destructive" className="text-[10px]">{risks.length}</Badge>
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/risk-register")}>
              Risk Register <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="divide-y divide-border">
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
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Offene Reviews
              <Badge variant="secondary" className="text-[10px]">{reviews.length}</Badge>
            </h3>
          </div>
          <div className="divide-y divide-border">
            {reviews.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20">
                <Badge variant="outline" className="text-[10px]">Review</Badge>
                <span className="text-xs flex-1 truncate">Decision #{r.decision_id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCommandCenter;
