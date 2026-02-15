import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHint from "@/components/shared/PageHint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Minus, Trophy, Target, Zap, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useFilteredReviews, useFilteredDependencies } from "@/hooks/useDecisions";

const INDUSTRY_BENCHMARKS = {
  average: { label: "Branchen-Durchschnitt", approvalRate: 62, avgDaysToDecision: 14, implementationRate: 48, overdueRate: 35, escalationRate: 22, reviewCoverage: 55, riskMitigationRate: 40, crossTeamCollaboration: 30 },
  highPerformance: { label: "High-Performance (Top 10%)", approvalRate: 85, avgDaysToDecision: 5, implementationRate: 78, overdueRate: 8, escalationRate: 5, reviewCoverage: 92, riskMitigationRate: 75, crossTeamCollaboration: 70 },
};
type MetricKey = keyof typeof INDUSTRY_BENCHMARKS.average;
const METRIC_LABELS: Record<string, { label: string; unit: string; lowerIsBetter?: boolean }> = {
  approvalRate: { label: "Genehmigungsrate", unit: "%" }, avgDaysToDecision: { label: "Ø Entscheidungsdauer", unit: "Tage", lowerIsBetter: true }, implementationRate: { label: "Umsetzungsrate", unit: "%" }, overdueRate: { label: "Überfälligkeitsrate", unit: "%", lowerIsBetter: true }, escalationRate: { label: "Eskalationsrate", unit: "%", lowerIsBetter: true }, reviewCoverage: { label: "Review-Abdeckung", unit: "%" }, riskMitigationRate: { label: "Risiko-Mitigation", unit: "%" }, crossTeamCollaboration: { label: "Cross-Team-Zusammenarbeit", unit: "%" },
};

const DecisionBenchmarking = () => {
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: reviews = [], isLoading: loadingRev } = useFilteredReviews();
  const { data: deps = [], isLoading: loadingDeps } = useFilteredDependencies();
  const loading = loadingDec || loadingRev || loadingDeps;

  const metrics = useMemo(() => {
    if (allDecisions.length === 0) return null;
    const all = allDecisions; const total = all.length || 1;
    const approved = all.filter(d => d.status === "approved" || d.status === "implemented").length;
    const implemented = all.filter(d => d.status === "implemented").length;
    const overdue = all.filter(d => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented").length;
    const escalated = all.filter(d => (d.escalation_level ?? 0) > 0).length;
    const withReview = new Set(reviews.map(r => r.decision_id)).size;
    const lowRiskHandled = all.filter(d => (d.ai_risk_score ?? 50) < 30 && (d.status === "approved" || d.status === "implemented")).length;
    const lowRiskTotal = all.filter(d => (d.ai_risk_score ?? 50) < 30).length || 1;
    const crossTeam = deps.length;
    const implDurations = all.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
    const avgDays = implDurations.length > 0 ? Math.round(implDurations.reduce((a, b) => a + b, 0) / implDurations.length) : 18;
    return { approvalRate: Math.round((approved / total) * 100), avgDaysToDecision: avgDays, implementationRate: Math.round((implemented / total) * 100), overdueRate: Math.round((overdue / total) * 100), escalationRate: Math.round((escalated / total) * 100), reviewCoverage: Math.round((withReview / total) * 100), riskMitigationRate: Math.round((lowRiskHandled / lowRiskTotal) * 100), crossTeamCollaboration: Math.min(100, Math.round((crossTeam / total) * 100)) };
  }, [allDecisions, reviews, deps]);

  const getTrend = (key: string, value: number) => {
    const meta = METRIC_LABELS[key]; const avg = INDUSTRY_BENCHMARKS.average[key as MetricKey] as number;
    const better = meta.lowerIsBetter ? value < avg : value > avg; const worse = meta.lowerIsBetter ? value > avg : value < avg;
    if (better) return { icon: TrendingUp, color: "text-success", label: "Über Durchschnitt" };
    if (worse) return { icon: TrendingDown, color: "text-destructive", label: "Unter Durchschnitt" };
    return { icon: Minus, color: "text-warning", label: "Im Durchschnitt" };
  };

  const getOverallScore = () => {
    if (!metrics) return 0;
    let score = 0; const keys = Object.keys(METRIC_LABELS);
    keys.forEach(key => { const val = metrics[key]; const avg = INDUSTRY_BENCHMARKS.average[key as MetricKey] as number; const hp = INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number; const meta = METRIC_LABELS[key]; const range = meta.lowerIsBetter ? avg - hp : hp - avg; const diff = meta.lowerIsBetter ? avg - val : val - avg; score += Math.min(1, Math.max(0, (diff / (range || 1)) * 0.5 + 0.5)); });
    return Math.round((score / keys.length) * 100);
  };

  const radarData = metrics ? Object.keys(METRIC_LABELS).map(key => { const meta = METRIC_LABELS[key]; const normalize = (v: number) => meta.lowerIsBetter ? Math.max(0, 100 - v) : v; return { metric: meta.label, "Ihr Unternehmen": normalize(metrics[key]), "Branchen-Ø": normalize(INDUSTRY_BENCHMARKS.average[key as MetricKey] as number), "Top 10%": normalize(INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number) }; }) : [];
  const barData = metrics ? Object.keys(METRIC_LABELS).map(key => ({ name: METRIC_LABELS[key].label, Unternehmen: metrics[key], "Branchen-Ø": INDUSTRY_BENCHMARKS.average[key as MetricKey], "Top 10%": INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] })) : [];

  const overallScore = getOverallScore();
  const scoreLabel = overallScore >= 75 ? "High-Performer" : overallScore >= 50 ? "Durchschnitt" : "Verbesserungspotenzial";
  const scoreColor = overallScore >= 75 ? "text-success" : overallScore >= 50 ? "text-warning" : "text-destructive";

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Vergleich</p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">Decision Benchmarking</h1>
            <PageHint>Vergleiche deine Entscheidungskultur mit Branchen-Durchschnitt und High-Performance-Unternehmen.</PageHint>
          </div>
        </div>

        {loading ? <AnalysisPageSkeleton cards={3} sections={1} showChart /> : !metrics ? (
          <EmptyAnalysisState icon={Trophy} title="Noch keine Benchmarks" description="Erstelle Entscheidungen für Branchen-Vergleiche." hint="Benchmarking wird automatisch berechnet" />
        ) : (
          <>
            {/* Overall Score – always visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Gesamtbewertung</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <div className={`text-5xl font-bold ${scoreColor}`}>{overallScore}</div>
                  <Badge variant={overallScore >= 75 ? "default" : overallScore >= 50 ? "secondary" : "destructive"}>{scoreLabel}</Badge>
                  <Progress value={overallScore} className="w-full" />
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Quick Insights</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(METRIC_LABELS).slice(0, 4).map(([key, meta]) => {
                      const trend = getTrend(key, metrics[key]); const TrendIcon = trend.icon;
                      return (<div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"><TrendIcon className={`w-4 h-4 ${trend.color}`} /><div className="min-w-0"><p className="text-xs text-muted-foreground truncate">{meta.label}</p><p className="text-sm font-semibold">{metrics[key]}{meta.unit === "%" ? "%" : ` ${meta.unit}`}</p></div></div>);
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts – collapsible */}
            <CollapsibleSection title="Vergleichs-Charts" subtitle="Radar und Balkendiagramm" icon={<BarChart3 className="w-4 h-4 text-primary" />} defaultOpen={true}>
              <Tabs defaultValue="radar">
                <TabsList>
                  <TabsTrigger value="radar">Radar-Vergleich</TabsTrigger>
                  <TabsTrigger value="bar">Balkendiagramm</TabsTrigger>
                  <TabsTrigger value="detail">Detail-Tabelle</TabsTrigger>
                </TabsList>
                <TabsContent value="radar">
                  <Card><CardContent className="pt-6"><div className="h-[400px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="hsl(var(--border))" /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} /><Radar name="Ihr Unternehmen" dataKey="Ihr Unternehmen" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} /><Radar name="Branchen-Ø" dataKey="Branchen-Ø" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} /><Radar name="Top 10%" dataKey="Top 10%" stroke="#10b981" fill="#10b981" fillOpacity={0.1} /><Legend /></RadarChart></ResponsiveContainer></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="bar">
                  <Card><CardContent className="pt-6"><div className="h-[400px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} layout="vertical" margin={{ left: 120 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" domain={[0, 100]} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} /><Tooltip /><Bar dataKey="Unternehmen" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /><Bar dataKey="Branchen-Ø" fill="#f59e0b" radius={[0, 4, 4, 0]} /><Bar dataKey="Top 10%" fill="#10b981" radius={[0, 4, 4, 0]} /><Legend /></BarChart></ResponsiveContainer></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="detail">
                  <Card><CardContent className="pt-6"><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 px-3 font-medium text-muted-foreground">Metrik</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">Ihr Wert</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">Branchen-Ø</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">Top 10%</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">Bewertung</th></tr></thead><tbody>
                    {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                      const val = metrics[key]; const avg = INDUSTRY_BENCHMARKS.average[key as MetricKey] as number; const hp = INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number; const trend = getTrend(key, val); const TrendIcon = trend.icon; const suffix = meta.unit === "%" ? "%" : ` ${meta.unit}`;
                      return (<tr key={key} className="border-b last:border-0"><td className="py-2 px-3 font-medium">{meta.label}</td><td className="py-2 px-3 text-center font-semibold">{val}{suffix}</td><td className="py-2 px-3 text-center text-muted-foreground">{avg}{suffix}</td><td className="py-2 px-3 text-center text-muted-foreground">{hp}{suffix}</td><td className="py-2 px-3 text-center"><div className="flex items-center justify-center gap-1"><TrendIcon className={`w-4 h-4 ${trend.color}`} /><span className={`text-xs ${trend.color}`}>{trend.label}</span></div></td></tr>);
                    })}
                  </tbody></table></div></CardContent></Card>
                </TabsContent>
              </Tabs>
            </CollapsibleSection>

            {/* Recommendations – collapsible, default closed */}
            <CollapsibleSection title="Empfehlungen" subtitle="Verbesserungspotenziale" icon={<Zap className="w-4 h-4 text-primary" />} defaultOpen={false}>
              <Card><CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                    const trend = getTrend(key, metrics[key]); if (trend.color !== "text-destructive") return null;
                    const hp = INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number; const gap = meta.lowerIsBetter ? metrics[key] - hp : hp - metrics[key];
                    return (<div key={key} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-destructive" /><span className="font-medium text-sm">{meta.label}</span></div><p className="text-xs text-muted-foreground">{gap > 0 ? `${gap}${meta.unit === "%" ? "pp" : ` ${meta.unit}`} Abstand zu Top-Performern.` : "Nahe am Benchmark."}</p></div>);
                  }).filter(Boolean)}
                  {Object.entries(METRIC_LABELS).every(([key]) => getTrend(key, metrics[key]).color !== "text-destructive") && (
                    <div className="p-3 rounded-lg border border-success/30 bg-success/5 col-span-full"><p className="text-sm text-success font-medium">🎉 Alle Metriken über Durchschnitt!</p></div>
                  )}
                </div>
              </CardContent></Card>
            </CollapsibleSection>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default DecisionBenchmarking;
