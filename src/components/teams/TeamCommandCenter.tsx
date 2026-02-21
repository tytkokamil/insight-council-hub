import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flame, Clock, AlertTriangle, TrendingUp, Target, BookOpen,
  Users, CheckCircle, ArrowRight, BarChart3, ShieldAlert,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { de } from "date-fns/locale";

interface Props {
  teamId: string;
}

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
        supabase.from("lessons_learned").select("*, decisions!inner(team_id)").eq("decisions.team_id", teamId).order("created_at", { ascending: false }).limit(3),
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

  const highPriority = useMemo(() =>
    decisions.filter(d => (d.priority === "high" || d.priority === "critical") && !["implemented", "rejected", "archived", "cancelled"].includes(d.status)),
    [decisions]
  );

  const overdueDecisions = useMemo(() =>
    decisions.filter(d => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived", "cancelled"].includes(d.status)),
    [decisions]
  );

  const blockedTasks = useMemo(() => tasks.filter(t => t.status === "blocked"), [tasks]);
  const completedDecisions = useMemo(() => decisions.filter(d => d.status === "implemented"), [decisions]);
  const openDecisions = useMemo(() => decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status)), [decisions]);

  const velocityScore = useMemo(() => {
    if (decisions.length === 0) return 0;
    const last30 = decisions.filter(d => {
      const diff = differenceInDays(new Date(), new Date(d.created_at));
      return diff <= 30 && d.status === "implemented";
    });
    return last30.length;
  }, [decisions]);

  const riskIndex = useMemo(() => {
    if (risks.length === 0) return 0;
    const avg = risks.reduce((s, r) => s + (r.risk_score || r.likelihood * r.impact), 0) / risks.length;
    return Math.round(avg);
  }, [risks]);

  const performanceScore = useMemo(() => {
    if (decisions.length === 0) return 0;
    const total = decisions.length;
    const impl = completedDecisions.length;
    const overdueRate = overdueDecisions.length / Math.max(openDecisions.length, 1);
    return Math.round(((impl / total) * 60 + (1 - overdueRate) * 40));
  }, [decisions, completedDecisions, overdueDecisions, openDecisions]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Offen", value: openDecisions.length, icon: Clock, color: "text-primary" },
          { label: "Velocity (30d)", value: velocityScore, icon: TrendingUp, color: "text-emerald-500" },
          { label: "Risk Index", value: riskIndex, icon: ShieldAlert, color: riskIndex > 15 ? "text-destructive" : "text-amber-500" },
          { label: "Performance", value: `${performanceScore}%`, icon: BarChart3, color: "text-primary" },
          { label: "Blockiert", value: blockedTasks.length, icon: AlertTriangle, color: blockedTasks.length > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-lg bg-muted/30 border border-border text-center">
            <kpi.icon className={`w-4 h-4 mx-auto mb-1 ${kpi.color}`} />
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* High Priority Decisions */}
      {highPriority.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-destructive" />
              Aktive High-Priority ({highPriority.length})
            </h3>
            <div className="space-y-2">
              {highPriority.slice(0, 5).map(d => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/decisions/${d.id}`)}
                >
                  <Badge variant="outline" className={d.priority === "critical" ? "border-destructive text-destructive text-[10px]" : "border-amber-500 text-amber-500 text-[10px]"}>
                    {d.priority === "critical" ? "Kritisch" : "Hoch"}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{d.title}</span>
                  {d.due_date && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(d.due_date), "dd.MM.", { locale: de })}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              Offene Reviews ({reviews.length})
            </h3>
            <div className="space-y-2">
              {reviews.slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <Badge variant="outline" className="text-[10px]">Review</Badge>
                  <span className="text-sm flex-1 truncate">Decision #{r.decision_id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategic Goals */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              Strategische Ziele ({goals.length})
            </h3>
            {goals.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine aktiven Ziele</p>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 4).map(g => {
                  const progress = g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0;
                  return (
                    <div key={g.id} className="p-2.5 rounded-lg bg-muted/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium truncate">{g.title}</span>
                        <span className="text-[10px] text-muted-foreground">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Learnings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              Letzte Learnings ({lessons.length})
            </h3>
            {lessons.length === 0 ? (
              <p className="text-xs text-muted-foreground">Noch keine Learnings</p>
            ) : (
              <div className="space-y-2">
                {lessons.map(l => (
                  <div key={l.id} className="p-2.5 rounded-lg bg-muted/20">
                    <p className="text-xs font-medium line-clamp-2">{l.key_takeaway}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(l.created_at), "dd.MM.yyyy", { locale: de })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open Risks */}
      {risks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Offene Risiken ({risks.length})
            </h3>
            <div className="space-y-2">
              {risks.slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <div className={`w-2 h-2 rounded-full ${(r.risk_score || r.likelihood * r.impact) >= 15 ? "bg-destructive" : (r.risk_score || r.likelihood * r.impact) >= 9 ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <span className="text-xs flex-1 truncate">{r.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{r.risk_score || r.likelihood * r.impact}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamCommandCenter;
