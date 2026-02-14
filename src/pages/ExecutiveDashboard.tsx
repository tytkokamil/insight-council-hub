import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions, useTeams, useDependencies, useReviews } from "@/hooks/useDecisions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Users, Zap, Trophy, Dna, Activity, FlaskConical,
  GitBranch, Flame, ArrowRight, Target,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: deps = [] } = useDependencies();
  const { data: teams = [] } = useTeams();
  const { data: reviews = [] } = useReviews();

  if (loadingDec) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Lade Executive Dashboard…</div>
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

  // Velocity
  const implDurations = implemented
    .filter(d => d.implemented_at)
    .map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
  const avgVelocity = implDurations.length > 0 ? Math.round(implDurations.reduce((a, b) => a + b, 0) / implDurations.length) : 0;

  // Costs
  const openDecisions = decisions.filter(d => d.status !== "implemented" && d.status !== "rejected");
  const totalOpportunityCost = openDecisions.reduce((sum, d) => {
    const team = teams.find((t: any) => t.id === d.team_id);
    const rate = team?.hourly_rate || 75;
    const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
    return sum + Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
  }, 0);

  // Health Score
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
    { label: "Bottlenecks", path: "/bottlenecks", icon: Flame, color: "text-orange-500" },
    { label: "Health Map", path: "/health", icon: Activity, color: "text-green-500" },
    { label: "DNA", path: "/dna", icon: Dna, color: "text-purple-500" },
    { label: "Benchmarking", path: "/benchmarking", icon: Trophy, color: "text-yellow-500" },
    { label: "Szenarien", path: "/scenarios", icon: FlaskConical, color: "text-blue-500" },
    { label: "Escalation", path: "/engine", icon: Zap, color: "text-red-500" },
  ];

  const scoreColor = healthScore >= 75 ? "text-green-500" : healthScore >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-primary" /> Executive Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Unternehmensweite Entscheidungs-Intelligence auf einen Blick.</p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">{archetype}</Badge>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Gesamt", value: decisions.length, icon: BarChart3 },
            { label: "Umgesetzt", value: implemented.length, icon: CheckCircle2, color: "text-green-500" },
            { label: "Überfällig", value: overdue.length, icon: Clock, color: overdue.length > 0 ? "text-red-500" : undefined },
            { label: "Eskaliert", value: escalated.length, icon: AlertTriangle, color: escalated.length > 0 ? "text-orange-500" : undefined },
            { label: "Hohes Risiko", value: highRisk.length, icon: AlertTriangle, color: highRisk.length > 0 ? "text-red-500" : undefined },
            { label: "Ø Tage", value: avgVelocity, icon: TrendingUp },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className={`w-4 h-4 ${kpi.color || "text-muted-foreground"}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Organisation Health Score</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div className={`text-5xl font-bold ${scoreColor}`}>{healthScore}</div>
              <Progress value={healthScore} className="w-full" />
              <div className="grid grid-cols-2 gap-2 w-full text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Umsetzung</span><span>{Math.round(implRate)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Termintreue</span><span>{Math.round(100 - overdueRate)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Eskalation</span><span>{Math.round(escRate)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reviews</span><span>{reviews.length}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Radar</CardTitle></CardHeader>
            <CardContent>
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
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" />Opportunity Cost</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div className="text-3xl font-bold text-destructive">€{totalOpportunityCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground text-center">Geschätzte Kosten durch offene Entscheidungen</p>
              <div className="w-full space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Offene Entscheidungen</span><span>{openDecisions.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kritische offen</span><span className="text-destructive font-medium">{critical.filter(d => d.status !== "implemented").length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Teams betroffen</span><span>{new Set(openDecisions.map(d => d.team_id).filter(Boolean)).size}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aktivitätstrend (8 Wochen)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="erstellt" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="umgesetzt" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts + Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Sofortige Aufmerksamkeit</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdue.slice(0, 3).map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">Fällig: {d.due_date}</p>
                    </div>
                    <Badge variant="destructive" className="shrink-0 text-xs">{d.priority}</Badge>
                  </div>
                ))}
                {highRisk.filter(d => !overdue.includes(d)).slice(0, 2).map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5">
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
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Access</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map(link => (
                  <Link key={link.path} to={link.path} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group">
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
