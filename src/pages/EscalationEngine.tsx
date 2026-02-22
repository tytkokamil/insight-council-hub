import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Zap, Play, Loader2, AlertTriangle, CheckCircle2, Clock, Lightbulb, Shield,
  Users, SkipForward, ExternalLink, TrendingUp, ArrowUpRight, Flame, Target, Activity,
} from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useFilteredNotifications, useFilteredDependencies } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

interface EngineAction { type: string; decision_id: string; title: string; [key: string]: any; }
interface EngineResult { message: string; actions: EngineAction[]; processed: number; }

const actionConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  escalation: { icon: AlertTriangle, label: "Eskalation", color: "text-destructive", bgColor: "bg-destructive/15" },
  auto_reassign: { icon: Users, label: "Auto-Reassign", color: "text-warning", bgColor: "bg-warning/15" },
  auto_skip_review: { icon: SkipForward, label: "Review Skip", color: "text-success", bgColor: "bg-success/15" },
  process_suggestion: { icon: Lightbulb, label: "Prozessvorschlag", color: "text-primary", bgColor: "bg-primary/15" },
};

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 12 };

const EscalationEngine = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<EngineResult | null>(null);

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: notifications = [], isLoading: notifLoading } = useFilteredNotifications();
  const { data: allDeps = [], isLoading: depsLoading } = useFilteredDependencies();

  const { data: slaConfigs = [] } = useQuery({
    queryKey: ["sla-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sla_configs").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const loading = decLoading || notifLoading || depsLoading;

  const recentNotifications = useMemo(() =>
    notifications
      .filter(n => ["escalation", "auto_reassign", "auto_skip_review", "process_suggestion"].includes(n.type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30),
    [notifications]
  );

  const stats = useMemo(() => {
    if (loading) return { openDecisions: 0, totalEscalated: 0, totalReassigned: 0, totalSkipped: 0, maxLevel: 0 };
    const openDecs = decisions.filter(d => ["draft", "review", "approved"].includes(d.status));
    const escalated = openDecs.filter(d => (d.escalation_level || 0) > 0);
    const maxLevel = escalated.reduce((m, d) => Math.max(m, d.escalation_level || 0), 0);
    return {
      openDecisions: openDecs.length,
      totalEscalated: escalated.length,
      totalReassigned: recentNotifications.filter(n => n.type === "auto_reassign").length,
      totalSkipped: recentNotifications.filter(n => n.type === "auto_skip_review").length,
      maxLevel,
    };
  }, [loading, decisions, recentNotifications]);

  // Active escalations as table
  const activeEscalations = useMemo(() => {
    return decisions
      .filter(d => (d.escalation_level || 0) > 0 && !["implemented", "rejected"].includes(d.status))
      .map(d => {
        const daysOpen = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000);
        return { ...d, daysOpen };
      })
      .sort((a, b) => (b.escalation_level || 0) - (a.escalation_level || 0));
  }, [decisions]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const now = Date.now();
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = now - (8 - i) * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const weekNotifs = recentNotifications.filter(n => {
        const t = new Date(n.created_at).getTime();
        return t >= weekStart && t < weekEnd;
      });
      const escalations = weekNotifs.filter(n => n.type === "escalation").length;
      const totalEsc = notifications.filter(n => {
        const t = new Date(n.created_at).getTime();
        return t >= weekStart && t < weekEnd && n.type === "escalation";
      }).length;
      return { week: `W${i + 1}`, Eskalationen: totalEsc || escalations };
    });

    const totalOpen = decisions.filter(d => !["implemented", "rejected"].includes(d.status)).length;
    const escalatedCount = activeEscalations.length;
    const escalationRate = totalOpen > 0 ? Math.round((escalatedCount / totalOpen) * 100) : 0;
    const responseTimes = recentNotifications.filter(n => n.type === "escalation").map(n => {
      const dec = decisions.find(d => d.id === n.decision_id);
      if (!dec?.last_escalated_at) return null;
      return (new Date(n.created_at).getTime() - new Date(dec.created_at).getTime()) / 86400000;
    }).filter(Boolean) as number[];
    const avgResponseTime = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 10) / 10 : 0;

    return { weeklyData, escalationRate, avgResponseTime };
  }, [decisions, notifications, recentNotifications, activeEscalations]);

  const runEngine = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("autonomous-escalation");
      if (error) throw error;
      setLastResult(data as EngineResult);
      toast({ title: "Engine ausgeführt", description: `${(data as EngineResult).actions.length} Aktionen.` });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
    setRunning(false);
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Lade Decision Control...</div></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Decision Control"
        subtitle="SLA-Management, Eskalationen und automatische Governance"
        role="governance"
        help={{ title: "Decision Control", description: "Zentrale Governance-Steuerung: SLA-Management, Eskalationen, aktive Fälle, Regeln und Analytik." }}
        primaryAction={
          <Button onClick={runEngine} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Läuft..." : "Engine starten"}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Clock, label: "Offene Entscheidungen", value: stats.openDecisions, color: "text-primary" },
          { icon: AlertTriangle, label: "Aktiv eskaliert", value: stats.totalEscalated, color: "text-destructive" },
          { icon: Users, label: "Auto-Reassigns", value: stats.totalReassigned, color: "text-warning" },
          { icon: SkipForward, label: "Reviews übersprungen", value: stats.totalSkipped, color: "text-success" },
        ].map(c => (
          <Card key={c.label}><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><c.icon className={`w-4 h-4 ${c.color}`} /><span className="text-xs text-muted-foreground">{c.label}</span></div>
            <p className="font-display text-2xl font-bold">{c.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Last Run Result */}
      {lastResult && (
        <Card className="border-primary/20 mb-6">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-2">Letzter Durchlauf: {lastResult.processed} geprüft, {lastResult.actions.length} Aktionen</p>
            {lastResult.actions.length === 0 ? (
              <div className="text-center py-3"><CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" /><p className="text-sm text-muted-foreground">Keine Aktionen nötig.</p></div>
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

      <Tabs defaultValue="critical" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="critical">🔥 Top 5 Kritisch</TabsTrigger>
          <TabsTrigger value="active">Aktive Eskalationen</TabsTrigger>
          <TabsTrigger value="rules">Regeln (SLA)</TabsTrigger>
          <TabsTrigger value="log">Escalation Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tab: Top 5 Critical (from War Room) */}
        <TabsContent value="critical">
          <CriticalDecisionsTab decisions={decisions} allDeps={allDeps} escalationNotifications={recentNotifications.filter(n => n.type === "escalation")} />
        </TabsContent>

        {/* Tab: Active Escalations */}
        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              {activeEscalations.length === 0 ? (
                <div className="text-center py-8"><CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" /><p className="text-sm text-muted-foreground">Keine aktiven Eskalationen.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Titel</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Dauer</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Stufe</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Priorität</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aktionen</th>
                    </tr></thead>
                    <tbody>
                      {activeEscalations.map(d => (
                        <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium truncate max-w-[200px]">{d.title}</td>
                          <td className="text-center py-3 px-3">{d.daysOpen}d</td>
                          <td className="text-center py-3 px-3">
                            <Badge variant={d.escalation_level! >= 3 ? "destructive" : "outline"}>Stufe {d.escalation_level}</Badge>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`text-xs font-medium capitalize ${d.priority === "critical" ? "text-destructive" : d.priority === "high" ? "text-warning" : "text-muted-foreground"}`}>{d.priority}</span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Link to={`/decisions/${d.id}`}><Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"><ExternalLink className="w-3 h-3" />Öffnen</Button></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Rules (SLA Config) */}
        <TabsContent value="rules">
          <div className="space-y-4">
            {/* Built-in rules */}
            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">Automatische Aktionstypen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: AlertTriangle, title: "Smart Escalation", desc: "Automatische Eskalation basierend auf Priorität und Inaktivität", color: "text-destructive", trigger: "Deadline überschritten oder Inaktivität > SLA-Schwellenwert" },
                  { icon: Users, title: "Auto-Reassign", desc: "Neuzuweisung bei >7 Tage Inaktivität", color: "text-warning", trigger: "7+ Tage keine Aktivität am Item" },
                  { icon: SkipForward, title: "Low-Risk Review Skip", desc: "AI schlägt Überspringen vor (Suggest-only). Nicht für Critical/Confidential.", color: "text-success", trigger: "AI Risk Score ≤ 25%, manuelle Bestätigung erforderlich" },
                  { icon: Lightbulb, title: "Prozessverkürzung", desc: "Vorschlag zum Überspringen bei ≥2/n Reviews", color: "text-primary", trigger: "Mehrheit der Reviewer hat zugestimmt" },
                ].map(rule => (
                  <div key={rule.title} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center gap-2 mb-1"><rule.icon className={`w-4 h-4 ${rule.color}`} /><span className="text-sm font-semibold">{rule.title}</span></div>
                    <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 italic">Trigger: {rule.trigger}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>

            {/* SLA Config from DB */}
            {slaConfigs.length > 0 && (
              <Card><CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">SLA-Konfiguration</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Kategorie</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Priorität</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Warnung (h)</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Dringend (h)</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Überfällig (h)</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Reassign (d)</th>
                    </tr></thead>
                    <tbody>
                      {slaConfigs.map((c: any) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 px-3 capitalize">{c.category}</td>
                          <td className="py-2 px-3 capitalize">{c.priority}</td>
                          <td className="text-center py-2 px-3">{c.escalation_hours_warn}h</td>
                          <td className="text-center py-2 px-3">{c.escalation_hours_urgent}h</td>
                          <td className="text-center py-2 px-3">{c.escalation_hours_overdue}h</td>
                          <td className="text-center py-2 px-3">{c.reassign_days}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">SLA-Konfiguration kann in den Einstellungen angepasst werden.</p>
              </CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Escalation Log */}
        <TabsContent value="log">
          <Card><CardContent className="p-0">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8"><Zap className="w-10 h-10 text-primary mx-auto mb-2 opacity-30" /><p className="text-sm text-muted-foreground">Noch keine Engine-Aktivitäten.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {recentNotifications.map(notif => {
                  const config = actionConfig[notif.type] || actionConfig.escalation;
                  return (
                    <div key={notif.id} className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors">
                      <config.icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${config.color} ${config.bgColor} shrink-0`}>{config.label}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(notif.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">Eskalationsrate</p>
                <p className={`text-3xl font-bold font-display ${analyticsData.escalationRate > 20 ? "text-destructive" : analyticsData.escalationRate > 10 ? "text-warning" : "text-success"}`}>{analyticsData.escalationRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Anteil eskalierter Entscheidungen</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">Ø Reaktionszeit</p>
                <p className="text-3xl font-bold font-display">{analyticsData.avgResponseTime}d</p>
                <p className="text-[10px] text-muted-foreground mt-1">Tage bis zur Eskalation</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">Höchste Stufe</p>
                <p className="text-3xl font-bold font-display text-destructive">{stats.maxLevel}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Maximale Eskalationsstufe</p>
              </CardContent></Card>
            </div>

            <Card><CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">Eskalationstrend (8 Wochen)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="Eskalationen" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

/* ── War Room: Top 5 Critical Decisions + Systemic Risks ── */
function CriticalDecisionsTab({ decisions, allDeps, escalationNotifications }: { decisions: any[]; allDeps: any[]; escalationNotifications: any[] }) {
  const now = new Date();
  const open = decisions.filter(d => !["implemented", "rejected", "cancelled", "superseded", "archived"].includes(d.status));
  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

  const scored = open.map(d => {
    const daysOpen = differenceInDays(now, new Date(d.created_at));
    const overdue = d.due_date ? new Date(d.due_date) < now : false;
    const riskWeight = (d.ai_risk_score || 0) / 20;
    const urgencyScore =
      (priorityWeight[d.priority] || 1) * 25 +
      (overdue ? 30 : 0) +
      Math.min(daysOpen, 30) * 1.5 +
      riskWeight * 10 +
      (d.escalation_level || 0) * 15;
    return { ...d, daysOpen, overdue, urgencyScore };
  }).sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 5);

  // Systemic risks
  const risks: { severity: string; title: string; detail: string; metric: string }[] = [];
  const stale = open.filter(d => differenceInDays(now, new Date(d.created_at)) > 14 && ["draft", "review"].includes(d.status));
  if (stale.length > 0) risks.push({ severity: stale.length > 3 ? "critical" : "high", title: "Stagnierende Entscheidungen", detail: `${stale.length} seit >14 Tagen ohne Fortschritt`, metric: `${stale.length}` });

  const recentEsc = escalationNotifications.filter(n => differenceInDays(now, new Date(n.created_at)) <= 7).length;
  if (recentEsc > 2) risks.push({ severity: recentEsc > 5 ? "critical" : "high", title: "Eskalationswelle", detail: `${recentEsc} Eskalationen in 7 Tagen`, metric: `${recentEsc}` });

  const blockedIds = new Set(allDeps.map(d => d.target_decision_id));
  const blockedOpen = open.filter(d => blockedIds.has(d.id));
  if (blockedOpen.length > 1) risks.push({ severity: blockedOpen.length > 3 ? "critical" : "high", title: "Abhängigkeits-Engpass", detail: `${blockedOpen.length} blockierte Entscheidungen`, metric: `${blockedOpen.length}` });

  const priorityBadge = (p: string) =>
    p === "critical" ? "bg-destructive/20 text-destructive" : p === "high" ? "bg-warning/20 text-warning" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-destructive" /> Top 5 Kritische Entscheidungen
        </h2>
        <div className="space-y-2">
          {scored.map((d, i) => (
            <Link key={d.id} to={`/decisions/${d.id}`} className="block">
              <div className={`p-4 rounded-lg border hover:bg-muted/30 transition-colors ${d.overdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/20"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityBadge(d.priority)}`}>
                        {d.priority === "critical" ? "Kritisch" : d.priority === "high" ? "Hoch" : d.priority === "medium" ? "Mittel" : "Niedrig"}
                      </span>
                      {d.overdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">ÜBERFÄLLIG</span>}
                    </div>
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                      <span>{d.daysOpen}d offen</span>
                      {d.ai_risk_score != null && <span>Risiko: {d.ai_risk_score}%</span>}
                      {(d.escalation_level || 0) > 0 && <span className="text-destructive">Lv.{d.escalation_level}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold font-display">{Math.round(d.urgencyScore)}</p>
                    <p className="text-[10px] text-muted-foreground">Urgency</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {scored.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Keine offenen Entscheidungen 🎉</p>}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Systemische Risiken
        </h2>
        {risks.length === 0 ? (
          <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">
            <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" /> Keine kritischen Risiken erkannt.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {risks.map((r, i) => (
              <div key={i} className={`p-4 rounded-lg border ${r.severity === "critical" ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"}`}>
                <p className={`text-xs font-semibold ${r.severity === "critical" ? "text-destructive" : "text-warning"}`}>{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EscalationEngine;
