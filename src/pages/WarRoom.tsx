import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, AlertTriangle, Clock, TrendingUp, Users, Zap,
  ChevronRight, Activity, Target, Flame, ArrowUpRight,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

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
  const { user } = useAuth();
  const [criticals, setCriticals] = useState<CriticalDecision[]>([]);
  const [risks, setRisks] = useState<SystemicRisk[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, avgDays: 0, implementedThisMonth: 0, rejectedThisMonth: 0, escalations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    const [{ data: decisions }, { data: notifications }, { data: deps }] = await Promise.all([
      supabase.from("decisions").select("*"),
      supabase.from("notifications").select("*").eq("type", "escalation"),
      supabase.from("decision_dependencies").select("*"),
    ]);

    if (!decisions) { setLoading(false); return; }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stats
    const open = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented" && new Date(d.created_at) >= thisMonth);
    const rejected = decisions.filter(d => d.status === "rejected" && new Date(d.created_at) >= thisMonth);
    const durations = open.map(d => differenceInDays(now, new Date(d.created_at)));
    const avgDays = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    setStats({
      total: decisions.length,
      open: open.length,
      avgDays,
      implementedThisMonth: implemented.length,
      rejectedThisMonth: rejected.length,
      escalations: (notifications || []).filter(n => new Date(n.created_at) >= thisMonth).length,
    });

    // Critical decisions - scored by urgency
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
      return { ...d, daysOpen, overdue, urgencyScore } as CriticalDecision;
    });
    scored.sort((a, b) => b.urgencyScore - a.urgencyScore);
    setCriticals(scored.slice(0, 5));

    // Systemic risks
    const detectedRisks: SystemicRisk[] = [];

    // Stale decisions (>14 days in draft/review)
    const stale = open.filter(d => differenceInDays(now, new Date(d.created_at)) > 14 && ["draft", "review"].includes(d.status));
    if (stale.length > 0) {
      detectedRisks.push({
        type: "stale",
        severity: stale.length > 3 ? "critical" : stale.length > 1 ? "high" : "medium",
        title: "Stagnierende Entscheidungen",
        detail: `${stale.length} Entscheidungen seit >14 Tagen ohne Fortschritt`,
        metric: `${stale.length} blockiert`,
      });
    }

    // Escalation surge
    const recentEscalations = (notifications || []).filter(n => differenceInDays(now, new Date(n.created_at)) <= 7).length;
    if (recentEscalations > 2) {
      detectedRisks.push({
        type: "escalation",
        severity: recentEscalations > 5 ? "critical" : "high",
        title: "Eskalationswelle",
        detail: `${recentEscalations} Eskalationen in den letzten 7 Tagen`,
        metric: `${recentEscalations} diese Woche`,
      });
    }

    // Dependency bottleneck
    const blockedIds = new Set((deps || []).map(d => d.target_decision_id));
    const blockedOpen = open.filter(d => blockedIds.has(d.id));
    if (blockedOpen.length > 1) {
      detectedRisks.push({
        type: "bottleneck",
        severity: blockedOpen.length > 3 ? "critical" : "high",
        title: "Abhängigkeits-Engpass",
        detail: `${blockedOpen.length} offene Entscheidungen werden durch Abhängigkeiten blockiert`,
        metric: `${blockedOpen.length} blockiert`,
      });
    }

    // High rejection rate
    const recentTotal = decisions.filter(d => new Date(d.created_at) >= thisMonth).length;
    const rejRate = recentTotal > 0 ? (rejected.length / recentTotal) * 100 : 0;
    if (rejRate > 30 && recentTotal >= 3) {
      detectedRisks.push({
        type: "quality",
        severity: rejRate > 50 ? "critical" : "high",
        title: "Hohe Ablehnungsrate",
        detail: `${Math.round(rejRate)}% der Entscheidungen diesen Monat wurden abgelehnt`,
        metric: `${Math.round(rejRate)}%`,
      });
    }

    if (detectedRisks.length === 0) {
      detectedRisks.push({
        type: "quality",
        severity: "medium",
        title: "Keine kritischen Risiken",
        detail: "Das System läuft stabil. Weiter beobachten.",
        metric: "✓ OK",
      });
    }

    setRisks(detectedRisks);
    setLoading(false);
  };

  const severityColor = (s: string) =>
    s === "critical" ? "border-destructive bg-destructive/10" : s === "high" ? "border-warning bg-warning/10" : "border-border bg-muted/30";
  const severityTextColor = (s: string) =>
    s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : "text-muted-foreground";
  const priorityBadge = (p: string) =>
    p === "critical" ? "bg-destructive/20 text-destructive" : p === "high" ? "bg-warning/20 text-warning" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Executive War Room™</h1>
            <p className="text-sm text-muted-foreground">30-Sekunden Komplettübersicht · {format(new Date(), "dd. MMMM yyyy, HH:mm", { locale: de })} Uhr</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Activity className="w-8 h-8 animate-pulse text-primary" />
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Gesamt", value: stats.total, icon: Target, color: "text-primary" },
                { label: "Offen", value: stats.open, icon: Clock, color: "text-warning" },
                { label: "Ø Tage offen", value: stats.avgDays, icon: TrendingUp, color: "text-muted-foreground" },
                { label: "Umgesetzt (Monat)", value: stats.implementedThisMonth, icon: Zap, color: "text-success" },
                { label: "Abgelehnt (Monat)", value: stats.rejectedThisMonth, icon: AlertTriangle, color: "text-destructive" },
                { label: "Eskalationen (Monat)", value: stats.escalations, icon: Flame, color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold font-display">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Top 5 Critical Decisions */}
              <div className="lg:col-span-3 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-destructive" /> Top 5 Kritische Entscheidungen
                </h2>
                <div className="space-y-2">
                  {criticals.map((d, i) => (
                    <div key={d.id} className={`p-4 rounded-lg border ${d.overdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/20"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityBadge(d.priority)}`}>
                              {d.priority}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                              {d.category}
                            </span>
                            {d.overdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">
                                ÜBERFÄLLIG
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                            <span>{d.daysOpen} Tage offen</span>
                            {d.ai_risk_score != null && <span>Risiko: {d.ai_risk_score}%</span>}
                            {d.escalation_level != null && d.escalation_level > 0 && (
                              <span className="text-destructive">Eskalation Lv.{d.escalation_level}</span>
                            )}
                            <span className="capitalize">{d.status}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold font-display text-foreground">{Math.round(d.urgencyScore)}</p>
                          <p className="text-[10px] text-muted-foreground">Urgency</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {criticals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Keine offenen Entscheidungen – alles erledigt! 🎉
                    </div>
                  )}
                </div>
              </div>

              {/* Systemic Risks */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Systemische Risiken
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

                {/* Quick Pulse */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-3">
                    <Activity className="w-3.5 h-3.5 text-primary" /> System-Puls
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Entscheidungslast", value: stats.open, max: Math.max(stats.total, 1), color: stats.open > 10 ? "bg-destructive" : stats.open > 5 ? "bg-warning" : "bg-success" },
                      { label: "Umsetzungsrate", value: stats.implementedThisMonth, max: Math.max(stats.implementedThisMonth + stats.rejectedThisMonth + stats.open, 1), color: "bg-primary" },
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
