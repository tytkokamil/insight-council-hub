import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, TrendingUp, TrendingDown, Minus, Trophy, Target, Zap, Clock, Info, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useFilteredReviews, useFilteredDependencies } from "@/hooks/useDecisions";

const INDUSTRY_BENCHMARKS = {
  average: { approvalRate: 62, avgDaysToDecision: 14, implementationRate: 48, overdueRate: 35, escalationRate: 22, reviewCoverage: 55, riskMitigationRate: 40, crossTeamCollaboration: 30 },
  highPerformance: { approvalRate: 85, avgDaysToDecision: 5, implementationRate: 78, overdueRate: 8, escalationRate: 5, reviewCoverage: 92, riskMitigationRate: 75, crossTeamCollaboration: 70 },
};
type MetricKey = keyof typeof INDUSTRY_BENCHMARKS.average;

const METRIC_IMPROVE_ROUTES: Record<string, string> = {
  approvalRate: "/decisions",
  avgDaysToDecision: "/analytics-hub",
  implementationRate: "/decisions",
  overdueRate: "/escalation-engine",
  escalationRate: "/escalation-engine",
  reviewCoverage: "/process-hub",
  riskMitigationRate: "/risk-register",
  crossTeamCollaboration: "/decision-graph",
};

const DecisionBenchmarking = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: reviews = [], isLoading: loadingRev } = useFilteredReviews();
  const { data: deps = [], isLoading: loadingDeps } = useFilteredDependencies();
  const loading = loadingDec || loadingRev || loadingDeps;

  const METRIC_LABELS: Record<string, { label: string; unit: string; lowerIsBetter?: boolean }> = {
    approvalRate: { label: t("benchmarking.approvalRate"), unit: "%" },
    avgDaysToDecision: { label: t("benchmarking.avgDecisionDays"), unit: t("patternEngine.days"), lowerIsBetter: true },
    implementationRate: { label: t("benchmarking.implementationRate"), unit: "%" },
    overdueRate: { label: t("benchmarking.overdueRate"), unit: "%", lowerIsBetter: true },
    escalationRate: { label: t("benchmarking.escalationRate"), unit: "%", lowerIsBetter: true },
    reviewCoverage: { label: t("benchmarking.reviewCoverage"), unit: "%" },
    riskMitigationRate: { label: t("benchmarking.riskMitigation"), unit: "%" },
    crossTeamCollaboration: { label: t("benchmarking.crossTeamCollab"), unit: "%" },
  };

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
    if (better) return { icon: TrendingUp, color: "text-success", label: t("benchmarking.aboveAvg") };
    if (worse) return { icon: TrendingDown, color: "text-destructive", label: t("benchmarking.belowAvg") };
    return { icon: Minus, color: "text-warning", label: t("benchmarking.atAvg") };
  };

  const getOverallScore = () => {
    if (!metrics) return 0;
    let score = 0; const keys = Object.keys(METRIC_LABELS);
    keys.forEach(key => { const val = metrics[key]; const avg = INDUSTRY_BENCHMARKS.average[key as MetricKey] as number; const hp = INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number; const meta = METRIC_LABELS[key]; const range = meta.lowerIsBetter ? avg - hp : hp - avg; const diff = meta.lowerIsBetter ? avg - val : val - avg; score += Math.min(1, Math.max(0, (diff / (range || 1)) * 0.5 + 0.5)); });
    return Math.round((score / keys.length) * 100);
  };

  const radarData = metrics ? Object.keys(METRIC_LABELS).map(key => { const meta = METRIC_LABELS[key]; const normalize = (v: number) => meta.lowerIsBetter ? Math.max(0, 100 - v) : v; return { metric: meta.label, [t("benchmarking.yourCompany")]: normalize(metrics[key]), [t("benchmarking.industryAvg")]: normalize(INDUSTRY_BENCHMARKS.average[key as MetricKey] as number), [t("benchmarking.top10")]: normalize(INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number) }; }) : [];
  const barData = metrics ? Object.keys(METRIC_LABELS).map(key => ({ name: METRIC_LABELS[key].label, [t("benchmarking.yourCompany")]: metrics[key], [t("benchmarking.industryAvg")]: INDUSTRY_BENCHMARKS.average[key as MetricKey], [t("benchmarking.top10")]: INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] })) : [];

  const overallScore = getOverallScore();
  const scoreLabel = overallScore >= 75 ? t("benchmarking.highPerformer") : overallScore >= 50 ? t("benchmarking.average") : t("benchmarking.developmentPhase");
  const scoreColor = overallScore >= 75 ? "text-success" : overallScore >= 50 ? "text-warning" : "text-accent-foreground";

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("benchmarking.label")}</p>
            <h1 className="text-xl font-semibold tracking-tight">{t("benchmarking.title")}</h1>
          </div>
          <PageHelpButton title={t("benchmarking.title")} description={t("benchmarking.help")} />
        </div>

        {loading ? <AnalysisPageSkeleton cards={3} sections={1} showChart /> : !metrics ? (
          <EmptyAnalysisState icon={Trophy} title={t("benchmarking.noData")} description={t("benchmarking.noDataDesc")} hint={t("benchmarking.noDataHint")} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t("benchmarking.overallScore")}</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{overallScore}</div>
                  <Badge variant={overallScore >= 75 ? "default" : "secondary"}>{scoreLabel}</Badge>
                  <Progress value={overallScore} className="w-full" />
                   <p className="text-[10px] text-muted-foreground text-center">
                     {t("benchmarking.startingPointHint", "Ihr Ausgangspunkt. Jede abgeschlossene Entscheidung verbessert diesen Score.")}
                   </p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> {t("benchmarking.quickInsights")}</CardTitle></CardHeader>
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

            {/* Disclaimer moved to page footer */}

            <CollapsibleSection title={t("benchmarking.comparisonCharts")} subtitle={t("benchmarking.comparisonChartsSub")} icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />} defaultOpen={true}>
              <Tabs defaultValue="radar">
                <TabsList>
                  <TabsTrigger value="radar">{t("benchmarking.radarTab")}</TabsTrigger>
                  <TabsTrigger value="bar">{t("benchmarking.barTab")}</TabsTrigger>
                  <TabsTrigger value="detail">{t("benchmarking.detailTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="radar">
                  <Card><CardContent className="pt-6"><div className="h-[400px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="hsl(var(--border))" /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} /><Radar name={t("benchmarking.yourCompany")} dataKey={t("benchmarking.yourCompany")} stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.3} /><Radar name={t("benchmarking.industryAvg")} dataKey={t("benchmarking.industryAvg")} stroke="#94A3B8" fill="none" fillOpacity={0} strokeDasharray="5 5" /><Radar name={t("benchmarking.top10")} dataKey={t("benchmarking.top10")} stroke="#10B981" fill="none" fillOpacity={0} strokeWidth={2} /><Legend /></RadarChart></ResponsiveContainer></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="bar">
                  <Card><CardContent className="pt-6"><div className="h-[400px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} layout="vertical" margin={{ left: 120 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" domain={[0, 100]} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} /><Tooltip /><Bar dataKey={t("benchmarking.yourCompany")} fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} /><Bar dataKey={t("benchmarking.industryAvg")} fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} /><Bar dataKey={t("benchmarking.top10")} fill="hsl(var(--success))" radius={[0, 4, 4, 0]} /><Legend /></BarChart></ResponsiveContainer></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="detail">
                  <Card><CardContent className="pt-6"><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("benchmarking.colMetric")}</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">{t("benchmarking.colYourValue")}</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">{t("benchmarking.colIndustryAvg")}</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">{t("benchmarking.colTop10")}</th><th className="text-center py-2 px-3 font-medium text-muted-foreground">{t("benchmarking.colRating")}</th></tr></thead><tbody>
                    {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                      const val = metrics[key]; const avg = INDUSTRY_BENCHMARKS.average[key as MetricKey] as number; const hp = INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number; const trend = getTrend(key, val); const TrendIcon = trend.icon; const suffix = meta.unit === "%" ? "%" : ` ${meta.unit}`;
                      return (<tr key={key} className="border-b last:border-0"><td className="py-2 px-3 font-medium">{meta.label}</td><td className="py-2 px-3 text-center font-semibold">{val}{suffix}</td><td className="py-2 px-3 text-center text-muted-foreground">{avg}{suffix}</td><td className="py-2 px-3 text-center text-muted-foreground">{hp}{suffix}</td><td className="py-2 px-3 text-center"><div className="flex items-center justify-center gap-1"><TrendIcon className={`w-4 h-4 ${trend.color}`} /><span className={`text-xs ${trend.color}`}>{trend.label}</span></div></td></tr>);
                    })}
                  </tbody></table></div></CardContent></Card>
                </TabsContent>
              </Tabs>
            </CollapsibleSection>

            <CollapsibleSection title={t("benchmarking.recommendations")} subtitle={t("benchmarking.recommendationsSub")} icon={<Zap className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <Card><CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                    const trend = getTrend(key, metrics[key]); if (trend.color !== "text-destructive") return null;
                    const hp = INDUSTRY_BENCHMARKS.highPerformance[key as MetricKey] as number; const gap = meta.lowerIsBetter ? metrics[key] - hp : hp - metrics[key];
                    const route = METRIC_IMPROVE_ROUTES[key];
                     return (<div key={key} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                       <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-destructive" /><span className="font-medium text-sm">{meta.label}</span></div>
                       <p className="text-xs text-muted-foreground mb-2">{gap > 0 ? t("benchmarking.gapToTop", { gap, suffix: meta.unit === "%" ? "pp" : ` ${meta.unit}` }) : t("benchmarking.nearBenchmark")}</p>
                       {route ? (
                         <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-primary" onClick={() => navigate(route)}>{t("benchmarking.howToImprove")} <ArrowRight className="w-3 h-3" /></Button>
                       ) : (
                         <TooltipProvider><UITooltip><TooltipTrigger asChild><span className="text-xs cursor-default" style={{ color: "#94A3B8" }}>{t("benchmarking.howToImprove")} →</span></TooltipTrigger><TooltipContent><p className="text-xs">{t("benchmarking.comingSoonTooltip", "Kommt bald — mehr Entscheidungen anlegen verbessert diesen Wert automatisch.")}</p></TooltipContent></UITooltip></TooltipProvider>
                       )}
                     </div>);
                  }).filter(Boolean)}
                  {Object.entries(METRIC_LABELS).every(([key]) => getTrend(key, metrics[key]).color !== "text-destructive") && (
                    <div className="p-3 rounded-lg border border-success/30 bg-success/5 col-span-full"><p className="text-sm text-success font-medium">{t("benchmarking.allAboveAvg")}</p></div>
                  )}
                </div>
              </CardContent></Card>
             </CollapsibleSection>

            {/* Disclaimer footer */}
            <p className="text-center" style={{ fontSize: "11px", color: "#94A3B8" }}>
              {t("benchmarking.benchmarkDisclaimer")}
            </p>
          </>
        )}
      </div>
    </Wrap>
  );
};

export default DecisionBenchmarking;
