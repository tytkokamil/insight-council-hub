import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews } from "@/hooks/useDecisions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Zap, Trophy, Dna, Activity, FlaskConical,
  GitBranch, Flame, ArrowRight, Target,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: deps = [] } = useFilteredDependencies();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useFilteredReviews();

  if (loadingDec) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Lade Executive Dashboard…</div>
      </AppLayout>
    );
  }

  if (decisions.length === 0) {
    return (
      <AppLayout>
        <div className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Führungsebene</p>
          <h1 className="font-display text-xl font-bold">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Unternehmensweite Entscheidungs-Intelligence auf einen Blick.</p>
        </div>
        <EmptyAnalysisState
          icon={Target}
          title="Noch keine Executive-Daten"
          description="Erstelle Entscheidungen, um KPIs, Radar-Charts und Kostenanalysen zu sehen."
          hint="Alle Metriken werden automatisch aus deinen Entscheidungen berechnet"
        />
      </AppLayout>
    );
  }

  const total = decisions.length || 1;
  const implemented = decisions.filter(d => d.status === "implemented");
  const approved = decisions.filter(d => d.status === "approved" || d.status === "implemented");
  const overdue = decisions.filter(d => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented");
  const escalated = decisions.filter(d => (d.escalation_level ?? 0) > 0);
  const critical = decisions.filter(d => d.priority === "critical");
  const highRisk = decisions.filter(d => (d.ai_risk_score ?? 0) > 60);

  const implDurations = implemented
    .filter(d => d.implemented_at)
    .map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
  const avgVelocity = implDurations.length > 0 ? Math.round(implDurations.reduce((a, b) => a + b, 0) / implDurations.length) : 0;

  const openDecisions = decisions.filter(d => d.status !== "implemented" && d.status !== "rejected");
  const totalOpportunityCost = openDecisions.reduce((sum, d) => {
    const team = teams.find((t: any) => t.id === d.team_id);
    const rate = team?.hourly_rate || 75;
    const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
    return sum + Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
  }, 0);

  const implRate = (implemented.length / total) * 100;
  const overdueRate = (overdue.length / total) * 100;
  const escRate = (escalated.length / total) * 100;
  const healthScore = Math.round(Math.max(0, Math.min(100,
    (implRate * 0.4) + ((100 - overdueRate) * 0.3) + ((100 - escRate) * 0.2) + (approved.length / total * 100 * 0.1)
  )));

  const riskAppetite = decisions.filter(d => (d.ai_risk_score ?? 0) > 50 && (d.status === "approved" || d.status === "implemented")).length / (decisions.filter(d => (d.ai_risk_score ?? 0) > 50).length || 1) * 100;
  const archetype = healthScore >= 75 ? "High-Performance" : riskAppetite < 30 ? "Konservativ" : overdueRate > 30 ? "Bottleneck-anfällig" : "Balanced";

  const radarData = [
    { metric: "Umsetzung", value: Math.round(implRate) },
    { metric: "Geschwindigkeit", value: Math.max(0, 100 - avgVelocity * 3) },
    { metric: "Risikomgmt", value: Math.round(100 - (highRisk.length / total * 100)) },
    { metric: "Alignment", value: Math.round((reviews.length / total) * 100) },
    { metric: "Eskalation", value: Math.round(100 - escRate) },
    { metric: "Termintreue", value: Math.round(100 - overdueRate) },
  ];

  const now = Date.now();
  const activityData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = now - (7 - i) * 7 * 86400000;
    const weekEnd = weekStart + 7 * 86400000;
    const created = decisions.filter(d => { const t = new Date(d.created_at).getTime(); return t >= weekStart && t < weekEnd; }).length;
    const resolved = decisions.filter(d => { if (!d.implemented_at) return false; const t = new Date(d.implemented_at).getTime(); return t >= weekStart && t < weekEnd; }).length;
    return { week: `W${8 - (7 - i)}`, erstellt: created, umgesetzt: resolved };
  });

  const quickLinks = [
    { label: "Bottlenecks", path: "/bottlenecks", icon: Flame, color: "text-warning" },
    { label: "Health Map", path: "/health", icon: Activity, color: "text-success" },
    { label: "DNA", path: "/dna", icon: Dna, color: "text-primary" },
    { label: "Benchmarking", path: "/benchmarking", icon: Trophy, color: "text-warning" },
    { label: "Szenarien", path: "/scenarios", icon: FlaskConical, color: "text-primary" },
    { label: "Escalation", path: "/engine", icon: Zap, color: "text-destructive" },
  ];

  const scoreColor = healthScore >= 75 ? "text-success" : healthScore >= 50 ? "text-warning" : "text-destructive";
  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Führungsebene</p>
            <h1 className="font-display text-xl font-bold">Executive Dashboard</h1>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">{archetype}</Badge>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Gesamt", value: decisions.length, icon: BarChart3 },
            { label: "Umgesetzt", value: implemented.length, icon: CheckCircle2, color: "text-success" },
            { label: "Überfällig", value: overdue.length, icon: Clock, color: overdue.length > 0 ? "text-destructive" : undefined },
            { label: "Eskaliert", value: escalated.length, icon: AlertTriangle, color: escalated.length > 0 ? "text-warning" : undefined },
            { label: "Hohes Risiko", value: highRisk.length, icon: AlertTriangle, color: highRisk.length > 0 ? "text-destructive" : undefined },
            { label: "Ø Tage", value: avgVelocity, icon: TrendingUp },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.color || "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <div className="text-2xl font-bold font-display">{kpi.value}</div>
              </CardContent></Card>
            </motion.div>
          ))}
        </div>

        {/* Main Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Organisation Health Score</h3>
              <div className="flex flex-col items-center gap-3">
                <div className={`text-5xl font-bold font-display ${scoreColor}`}>{healthScore}</div>
                <Progress value={healthScore} className="w-full" />
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Umsetzung</span><span>{Math.round(implRate)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Termintreue</span><span>{Math.round(100 - overdueRate)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Eskalation</span><span>{Math.round(escRate)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reviews</span><span>{reviews.length}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Performance Radar</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><DollarSign className="w-4 h-4" />Opportunity Cost</h3>
              <div className="flex flex-col items-center gap-3">
                <div className="text-3xl font-bold font-display text-destructive">€{totalOpportunityCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground text-center">Geschätzte Kosten durch offene Entscheidungen</p>
                <div className="w-full space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Offene Entscheidungen</span><span>{openDecisions.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Kritische offen</span><span className="text-destructive font-medium">{critical.filter(d => d.status !== "implemented").length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Teams betroffen</span><span>{new Set(openDecisions.map(d => d.team_id).filter(Boolean)).size}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Trend */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Aktivitätstrend (8 Wochen)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="erstellt" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="umgesetzt" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts + Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4 text-destructive" />Sofortige Aufmerksamkeit</h3>
              <div className="space-y-2">
                {overdue.slice(0, 3).map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">Fällig: {d.due_date}</p>
                    </div>
                    <Badge variant="destructive" className="shrink-0 text-xs">{d.priority}</Badge>
                  </div>
                ))}
                {highRisk.filter(d => !overdue.includes(d)).slice(0, 2).map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-warning/5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">Risiko: {d.ai_risk_score}%</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">Risiko</Badge>
                  </div>
                ))}
                {overdue.length === 0 && highRisk.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">✅ Keine dringenden Probleme</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map(link => (
                  <Link key={link.path} to={link.path} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all group border border-transparent hover:border-border/50">
                    <link.icon className={`w-4 h-4 ${link.color}`} />
                    <span className="text-sm font-medium flex-1">{link.label}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ExecutiveDashboard;
