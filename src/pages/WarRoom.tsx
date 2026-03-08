import { useState, useMemo, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useDecisions, useFilteredDependencies, useFilteredNotifications } from "@/hooks/useDecisions";
import { useNavigate } from "react-router-dom";
import { formatCost } from "@/lib/formatters";
import { differenceInDays, differenceInCalendarDays, format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap, Clock, AlertTriangle, Users, Send, Bell,
  ArrowUpRight, Flame, Activity, MessageSquare, Shield,
  UserMinus, CalendarPlus, ChevronUp, ExternalLink,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";

const PRIORITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const HOURLY_RATE = 85;
const PERSONS = 3;
const HOURS_PER_DAY = 2;

const WarRoom = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: allDeps = [], isLoading: loadingDeps } = useFilteredDependencies();
  const { data: allNotifications = [], isLoading: loadingNotif } = useFilteredNotifications();

  // Latest comments for escalated decisions
  const { data: latestComments = [] } = useQuery({
    queryKey: ["war-room-comments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("decision_id, content, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    staleTime: 15_000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-map"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
    staleTime: 120_000,
  });

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach(p => { m[p.user_id] = p.full_name || "Unbekannt"; });
    return m;
  }, [profiles]);

  const loading = loadingDec || loadingDeps || loadingNotif;
  const now = new Date();

  // Escalated decisions
  const escalated = useMemo(() => {
    const open = allDecisions.filter(d =>
      !["implemented", "rejected", "cancelled", "archived"].includes(d.status) &&
      (d.escalation_level || 0) >= 1
    );
    return open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const overdue = d.due_date ? new Date(d.due_date) < now : false;
      const daysOverdue = overdue && d.due_date ? differenceInCalendarDays(now, new Date(d.due_date)) : 0;
      const cod = overdue ? daysOverdue * PERSONS * HOURS_PER_DAY * HOURLY_RATE * (PRIORITY_WEIGHT[d.priority] || 1) : (d.cost_per_day || 0) * daysOpen;
      const urgencyScore =
        (PRIORITY_WEIGHT[d.priority] || 1) * 20 +
        (overdue ? 30 : 0) +
        Math.min(daysOpen, 30) * 1.5 +
        ((d.ai_risk_score || 0) / 20) * 15 +
        (d.escalation_level || 0) * 20;
      const lastComment = latestComments.find(c => c.decision_id === d.id);
      return { ...d, daysOpen, overdue, daysOverdue, cod, urgencyScore, lastComment };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [allDecisions, latestComments, now]);

  // Live activity feed from notifications
  const activityFeed = useMemo(() => {
    return allNotifications
      .filter(n => {
        const escIds = new Set(escalated.map(e => e.id));
        return n.decision_id && escIds.has(n.decision_id);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30);
  }, [allNotifications, escalated]);

  // Live CoD ticker
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const totalCod = useMemo(() => {
    return escalated.reduce((s, d) => s + d.cod, 0) + tick * 0.01; // subtle tick
  }, [escalated, tick]);

  // Quick actions
  const handleNotifyAll = async () => {
    if (!user) return;
    const reviewerIds = new Set<string>();
    for (const d of escalated) {
      const { data } = await supabase.from("decision_reviews").select("reviewer_id").eq("decision_id", d.id);
      data?.forEach(r => reviewerIds.add(r.reviewer_id));
    }
    for (const uid of reviewerIds) {
      await supabase.from("notifications").insert({
        user_id: uid,
        title: "⚡ War Room – Sofortige Aufmerksamkeit erforderlich",
        message: `${escalated.length} eskalierte Entscheidungen erfordern deine Review.`,
        type: "escalation",
      });
    }
    toast.success(t("warRoom.notifiedAll", { defaultValue: `${reviewerIds.size} Reviewer benachrichtigt` }));
  };

  const handleEscalate = async (decisionId: string) => {
    const dec = escalated.find(d => d.id === decisionId);
    if (!dec) return;
    await supabase.from("decisions").update({
      escalation_level: (dec.escalation_level || 0) + 1,
      last_escalated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", decisionId);
    qc.invalidateQueries({ queryKey: ["decisions"] });
    toast.success("Eskalationsstufe erhöht");
  };

  const handleExtendSla = async (decisionId: string) => {
    const dec = escalated.find(d => d.id === decisionId);
    if (!dec) return;
    const newDue = new Date();
    newDue.setDate(newDue.getDate() + 3);
    await supabase.from("decisions").update({
      due_date: newDue.toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    }).eq("id", decisionId);
    qc.invalidateQueries({ queryKey: ["decisions"] });
    toast.success("SLA um 3 Tage verlängert");
  };

  const handleResolve = async (decisionId: string) => {
    await supabase.from("decisions").update({
      escalation_level: 0,
      updated_at: new Date().toISOString(),
    }).eq("id", decisionId);
    qc.invalidateQueries({ queryKey: ["decisions"] });
    toast.success("Eskalation aufgelöst");
  };

  const priorityLabel: Record<string, string> = { critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" };
  const priorityColor = (p: string) =>
    p === "critical" ? "bg-red-500/20 text-red-400" : p === "high" ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400";

  if (loading) {
    return (
      <AppLayout>
        <AnalysisPageSkeleton cards={4} sections={2} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8 bg-background dark:bg-[hsl(222_47%_11%)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-destructive" />
              <h1 className="text-xl font-bold text-foreground tracking-tight">WAR ROOM</h1>
            </div>
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
              {escalated.length} {escalated.length === 1 ? "Aktive Eskalation" : "Aktive Eskalationen"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Verzögerungskosten</p>
              <p className="text-lg font-bold text-destructive tabular-nums font-mono">
                {formatCost(Math.round(totalCod))}
              </p>
            </div>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(-1)}>
              Zurück
            </Button>
          </div>
        </div>

        {escalated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="w-12 h-12 text-success/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Keine aktiven Eskalationen</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Alle Entscheidungen laufen innerhalb der SLA-Grenzen. Der War Room wird automatisch aktiv, sobald Eskalationen auftreten.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* LEFT: Critical Decisions */}
            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-destructive" />
                Eskalierte Entscheidungen ({escalated.length})
              </h2>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-3 pr-3">
                  {escalated.map((d) => (
                    <div key={d.id} className="rounded-lg border border-border bg-card/50 p-4 hover:border-destructive/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityColor(d.priority)}`}>
                              {priorityLabel[d.priority] || d.priority}
                            </span>
                            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[9px]">
                              <Zap className="w-2.5 h-2.5 mr-0.5" /> Stufe {d.escalation_level}
                            </Badge>
                            {d.overdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">
                                {d.daysOverdue}d überfällig
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/decisions/${d.id}`)}>
                            {d.title}
                          </p>
                          <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                            <span>{d.daysOpen}d offen</span>
                            <span className="text-muted-foreground/60">•</span>
                            <span>{t(`status.${d.status}`, { defaultValue: d.status })}</span>
                            {d.ai_risk_score != null && (
                              <>
                                <span className="text-muted-foreground/60">•</span>
                                <span className={d.ai_risk_score >= 60 ? "text-destructive" : "text-warning"}>
                                  Risiko {d.ai_risk_score}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold tabular-nums text-destructive font-mono">
                            {formatCost(Math.round(d.cod))}
                          </p>
                          <p className="text-[9px] text-muted-foreground">CoD</p>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">{Math.round(d.urgencyScore)}</p>
                          <p className="text-[9px] text-muted-foreground">Urgency</p>
                        </div>
                      </div>

                      {/* Last comment */}
                      {d.lastComment && (
                        <div className="mb-3 px-3 py-2 rounded bg-muted/30 border border-border/40">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MessageSquare className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {profileMap[d.lastComment.user_id] || "Unbekannt"} •{" "}
                              {format(new Date(d.lastComment.created_at), "dd.MM. HH:mm", { locale: dateFnsLocale })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{d.lastComment.content}</p>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                          onClick={() => navigate(`/decisions/${d.id}`)}>
                          <UserMinus className="w-3 h-3" /> Reviewer ersetzen
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                          onClick={() => handleExtendSla(d.id)}>
                          <CalendarPlus className="w-3 h-3" /> SLA verlängern
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => handleEscalate(d.id)}>
                          <ChevronUp className="w-3 h-3" /> Eskalieren
                        </Button>
                        <Button size="sm" className="h-7 text-[10px] bg-success/80 hover:bg-success text-success-foreground gap-1"
                          onClick={() => handleResolve(d.id)}>
                          <Shield className="w-3 h-3" /> Lösen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* RIGHT: Action Center */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Actions */}
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-warning" /> Schnellaktionen
                </h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-2 bg-muted/50 hover:bg-muted text-foreground text-xs h-9"
                    onClick={handleNotifyAll}>
                    <Bell className="w-3.5 h-3.5 text-warning" /> Alle Reviewer benachrichtigen
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-muted/50 hover:bg-muted text-foreground text-xs h-9"
                    onClick={() => navigate("/meeting")}>
                    <Users className="w-3.5 h-3.5 text-primary" /> Notfall-Review-Runde starten
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 text-xs h-9"
                    onClick={async () => {
                      for (const d of escalated) {
                        await supabase.from("decisions").update({
                          escalation_level: Math.max((d.escalation_level || 0) + 1, 3),
                          last_escalated_at: new Date().toISOString(),
                        }).eq("id", d.id);
                      }
                      qc.invalidateQueries({ queryKey: ["decisions"] });
                      toast.success("Externe Eskalation ausgelöst");
                    }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Externe Eskalation auslösen
                  </Button>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-success animate-pulse" /> Live Activity Feed
                </h3>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-2">
                    {activityFeed.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Keine Aktivität</p>
                    ) : (
                      activityFeed.map((n) => (
                        <div key={n.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums font-mono mt-0.5">
                            {format(new Date(n.created_at), "HH:mm", { locale: dateFnsLocale })}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground/80 leading-relaxed">{n.message || n.title}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Escalation Summary */}
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Eskalations-Übersicht
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Stufe 1", value: escalated.filter(d => d.escalation_level === 1).length, color: "text-warning" },
                    { label: "Stufe 2", value: escalated.filter(d => d.escalation_level === 2).length, color: "text-warning" },
                    { label: "Stufe 3+", value: escalated.filter(d => (d.escalation_level || 0) >= 3).length, color: "text-destructive" },
                    { label: "Überfällig", value: escalated.filter(d => d.overdue).length, color: "text-destructive" },
                  ].map(s => (
                    <div key={s.label} className="text-center py-2 rounded bg-muted/30">
                      <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WarRoom;
