import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users, Building2, TrendingUp, Clock, RefreshCw, ShieldCheck,
  Target, Zap, Brain, DollarSign, BarChart3, UserMinus, Loader2,
  ArrowRight, AlertTriangle
} from "lucide-react";

interface AdminMetrics {
  registrations: { today: number; week: number; month: number; total: number };
  activeOrgs: number;
  totalOrgs: number;
  churn: { count: number; total: number; rate: number };
  timeToFirstDecision: number | null;
  week1Retention: number | null;
  teamExpansionRate: number | null;
  decisionCompletionRate: number | null;
  briefingOpenRate: number | null;
  planDistribution: Record<string, number>;
  mrr: number;
  arr: number;
  totalDecisions: number;
  timestamp: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-primary/10 text-primary",
  professional: "bg-accent/20 text-accent-foreground",
  enterprise: "bg-chart-4/20 text-foreground",
};

const InternalAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check platform admin status
  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase
      .from("platform_admins" as any)
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnErr } = await supabase.functions.invoke("admin-analytics", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setMetrics(data);
    } catch (e: any) {
      setError(e.message || "Failed to load metrics");
    }
    setLoadingMetrics(false);
  };

  useEffect(() => {
    if (isAdmin) fetchMetrics();
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
            <h1 className="text-lg font-bold">Internal Admin</h1>
            <p className="text-sm text-muted-foreground">Please log in to access the internal dashboard.</p>
            <Button onClick={() => window.location.href = "/auth"} className="w-full gap-2">
              <ArrowRight className="w-4 h-4" /> Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 mx-auto text-destructive" />
            <h1 className="text-lg font-bold">Access Denied</h1>
            <p className="text-sm text-muted-foreground">You are not authorized to view this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goalIndicator = (value: number | null, target: number, unit = "%") => {
    if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
    const met = unit === "min" ? value <= target : value >= target;
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <Progress value={unit === "min" ? Math.max(0, 100 - (value / target) * 100) : Math.min(100, (value / target) * 100)} className="h-1.5 flex-1" />
        <Badge variant="outline" className={`text-[9px] ${met ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-amber-300"}`}>
          Ziel: {target}{unit}
        </Badge>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Decivio Internal Analytics</h1>
              <Badge variant="outline" className="text-[9px]">SUPER ADMIN</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Platform-wide metrics — {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString("de-DE") : "—"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchMetrics} disabled={loadingMetrics} className="gap-1.5">
            <RefreshCw className={`w-3 h-3 ${loadingMetrics ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 mb-6">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {!metrics && loadingMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-16" /><Skeleton className="h-2 w-32" /></CardContent></Card>
            ))}
          </div>
        )}

        {metrics && (
          <>
            {/* Revenue Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium uppercase">MRR</span>
                  </div>
                  <p className="text-2xl font-bold">€{metrics.mrr.toLocaleString("de-DE")}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Monthly Recurring Revenue</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium uppercase">ARR</span>
                  </div>
                  <p className="text-2xl font-bold">€{metrics.arr.toLocaleString("de-DE")}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Annual Recurring Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium uppercase">Plan-Verteilung</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(metrics.planDistribution).map(([plan, count]) => (
                      <Badge key={plan} variant="outline" className={`text-xs ${PLAN_COLORS[plan] || ""}`}>
                        {plan}: {count}
                      </Badge>
                    ))}
                    {Object.keys(metrics.planDistribution).length === 0 && (
                      <span className="text-xs text-muted-foreground">Keine Organisationen</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Registrations Row */}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Registrierungen</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Heute", value: metrics.registrations.today, icon: Users },
                { label: "Diese Woche", value: metrics.registrations.week, icon: Users },
                { label: "Dieser Monat", value: metrics.registrations.month, icon: Users },
                { label: "Gesamt", value: metrics.registrations.total, icon: Users },
              ].map(m => (
                <Card key={m.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <m.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase">{m.label}</span>
                    </div>
                    <p className="text-xl font-bold">{m.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Engagement Metrics */}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Engagement & Retention</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Aktive Organisationen (7d)</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.activeOrgs} <span className="text-xs font-normal text-muted-foreground">/ {metrics.totalOrgs}</span></p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <UserMinus className="w-3.5 h-3.5 text-destructive/70" />
                    <span className="text-[10px] text-muted-foreground uppercase">Churn (30d kein Login)</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.churn.count} <span className="text-xs font-normal text-muted-foreground">({metrics.churn.rate}%)</span></p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Time to First Decision</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.timeToFirstDecision ?? "—"} <span className="text-xs font-normal text-muted-foreground">min</span></p>
                  {goalIndicator(metrics.timeToFirstDecision, 5, "min")}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Week 1 Retention</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.week1Retention ?? "—"}%</p>
                  {goalIndicator(metrics.week1Retention, 60)}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Team Expansion Rate</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.teamExpansionRate ?? "—"}%</p>
                  {goalIndicator(metrics.teamExpansionRate, 50)}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Decision Completion Rate</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.decisionCompletionRate ?? "—"}%</p>
                  {goalIndicator(metrics.decisionCompletionRate, 70)}
                </CardContent>
              </Card>
            </div>

            {/* Product Metrics */}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Produkt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">KI Daily Brief Open Rate</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.briefingOpenRate ?? "—"}%</p>
                  {goalIndicator(metrics.briefingOpenRate, 45)}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Entscheidungen gesamt</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.totalDecisions.toLocaleString("de-DE")}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InternalAdmin;
