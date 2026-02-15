import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHint from "@/components/shared/PageHint";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Zap, Play, Loader2, RefreshCw, ArrowUpRight, SkipForward, Users,
  AlertTriangle, CheckCircle2, Clock, Lightbulb, Shield,
} from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";

interface EngineAction { type: string; decision_id: string; title: string; [key: string]: any; }
interface EngineResult { message: string; actions: EngineAction[]; processed: number; }
const actionConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  escalation: { icon: AlertTriangle, label: "Eskalation", color: "text-destructive", bgColor: "bg-destructive/15" },
  auto_reassign: { icon: Users, label: "Auto-Reassign", color: "text-warning", bgColor: "bg-warning/15" },
  auto_skip_review: { icon: SkipForward, label: "Review Skip", color: "text-success", bgColor: "bg-success/15" },
  process_suggestion: { icon: Lightbulb, label: "Prozessvorschlag", color: "text-primary", bgColor: "bg-primary/15" },
};

const EscalationEngine = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<EngineResult | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEscalated: 0, totalReassigned: 0, totalSkipped: 0, openDecisions: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const [decRes, notifRes] = await Promise.all([
      supabase.from("decisions").select("id, status, escalation_level, assignee_id").in("status", ["draft", "review", "approved"]),
      supabase.from("notifications").select("id, type, title, message, decision_id, created_at, read").in("type", ["escalation", "auto_reassign", "auto_skip_review", "process_suggestion"]).order("created_at", { ascending: false }).limit(20),
    ]);
    const decisions = decRes.data || []; const notifications = notifRes.data || [];
    setStats({ openDecisions: decisions.length, totalEscalated: decisions.filter(d => (d.escalation_level || 0) > 0).length, totalReassigned: notifications.filter(n => n.type === "auto_reassign").length, totalSkipped: notifications.filter(n => n.type === "auto_skip_review").length });
    setRecentNotifications(notifications); setLoading(false);
  };
  useEffect(() => { fetchStats(); }, []);
  const runEngine = async () => {
    setRunning(true);
    try { const { data, error } = await supabase.functions.invoke("autonomous-escalation"); if (error) throw error; setLastResult(data as EngineResult); toast({ title: "Engine ausgeführt", description: `${(data as EngineResult).actions.length} Aktionen.` }); fetchStats(); }
    catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
    setRunning(false);
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Lade Escalation Engine...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Automatisierung</p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">Escalation Engine</h1>
            <PageHint>Automatische Eskalation überfälliger Entscheidungen basierend auf SLA-Regeln.</PageHint>
          </div>
        </div>
        <Button onClick={runEngine} disabled={running} className="gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Läuft..." : "Engine starten"}
        </Button>
      </div>

      {/* Stats – always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: "Offene Entscheidungen", value: stats.openDecisions, color: "text-primary" },
          { icon: AlertTriangle, label: "Aktiv eskaliert", value: stats.totalEscalated, color: "text-destructive" },
          { icon: Users, label: "Auto-Reassigns", value: stats.totalReassigned, color: "text-warning" },
          { icon: SkipForward, label: "Reviews übersprungen", value: stats.totalSkipped, color: "text-success" },
        ].map((card) => (
          <Card key={card.label}><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><card.icon className={`w-4 h-4 ${card.color}`} /><span className="text-xs text-muted-foreground">{card.label}</span></div>
            <p className="font-display text-2xl font-bold">{card.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Rules – collapsible, default closed */}
      <CollapsibleSection title="Aktive Regeln" subtitle="4 automatische Aktionstypen" icon={<Shield className="w-4 h-4 text-primary" />} defaultOpen={false} className="mb-8">
        <Card><CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: AlertTriangle, title: "Smart Escalation", desc: "Automatische Eskalation basierend auf Priorität und Inaktivität", color: "text-destructive" },
              { icon: Users, title: "Auto-Reassign", desc: "Neuzuweisung bei >7 Tage Inaktivität", color: "text-warning" },
              { icon: SkipForward, title: "Low-Risk Review Skip", desc: "Auto-Genehmigung bei AI Risk ≤ 25%", color: "text-success" },
              { icon: Lightbulb, title: "Prozessverkürzung", desc: "Vorschlag zum Überspringen bei ≥2/n Reviews", color: "text-primary" },
            ].map((rule) => (
              <div key={rule.title} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2 mb-1"><rule.icon className={`w-4 h-4 ${rule.color}`} /><span className="text-sm font-semibold">{rule.title}</span></div>
                <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </CollapsibleSection>

      {/* Last Run – collapsible */}
      {lastResult && (
        <CollapsibleSection title="Letzter Durchlauf" subtitle={`${lastResult.processed} geprüft, ${lastResult.actions.length} Aktionen`} icon={<Zap className="w-4 h-4 text-primary" />} defaultOpen={true} className="mb-8">
          <Card className="border-primary/20"><CardContent className="p-5">
            {lastResult.actions.length === 0 ? (
              <div className="text-center py-4"><CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" /><p className="text-sm text-muted-foreground">Keine Aktionen nötig.</p></div>
            ) : (
              <div className="space-y-2">
                {lastResult.actions.map((action, i) => {
                  const config = actionConfig[action.type] || actionConfig.escalation;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}>
                      <config.icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{action.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {action.type === "escalation" && `Level ${action.from_level} → ${action.to_level}`}
                          {action.type === "auto_reassign" && "Automatisch neu zugewiesen"}
                          {action.type === "auto_skip_review" && `${action.skipped_steps} Review-Schritt(e) übersprungen`}
                          {action.type === "process_suggestion" && `${action.completed_reviews}/${action.total_reviews} Reviews`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${config.color} ${config.bgColor}`}>{config.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent></Card>
        </CollapsibleSection>
      )}

      {/* Recent Activity – collapsible, default closed */}
      <CollapsibleSection title="Letzte Engine-Aktivitäten" subtitle={`${recentNotifications.length} Einträge`} icon={<Clock className="w-4 h-4 text-muted-foreground" />} defaultOpen={recentNotifications.length > 0 && !lastResult}>
        <div className="space-y-2">
          {recentNotifications.map((notif) => {
            const config = actionConfig[notif.type] || actionConfig.escalation;
            return (
              <Card key={notif.id}><CardContent className="p-3 flex items-center gap-3">
                <config.icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notif.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(notif.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </CardContent></Card>
            );
          })}
          {recentNotifications.length === 0 && (
            <Card><CardContent className="p-8 text-center"><Zap className="w-10 h-10 text-primary mx-auto mb-2 opacity-30" /><p className="text-sm text-muted-foreground">Noch keine Engine-Aktivitäten.</p></CardContent></Card>
          )}
        </div>
      </CollapsibleSection>
    </AppLayout>
  );
};

export default EscalationEngine;
