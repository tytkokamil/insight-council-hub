import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { useDecisions } from "@/hooks/useDecisions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, Clock, Target, AlertTriangle, CheckCircle2,
  ArrowRight, BarChart3, Zap,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AiInsightPanel from "@/components/shared/AiInsightPanel";

type Decision = ReturnType<typeof useDecisions>["data"] extends (infer T)[] | undefined ? T : never;

interface PatternInsight {
  label: string;
  description: string;
  confidence: number;
  type: "success" | "warning" | "info";
  icon: typeof TrendingUp;
}

const PatternEngine = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const { data: decisions = [], isLoading } = useDecisions();

  const categoryLabels: Record<string, string> = {
    strategic: t("patternEngine.catStrategic"), budget: t("patternEngine.catBudget"), hr: t("patternEngine.catHr"),
    technical: t("patternEngine.catTechnical"), operational: t("patternEngine.catOperational"), marketing: t("patternEngine.catMarketing"),
  };
  const priorityLabels: Record<string, string> = {
    low: t("patternEngine.priLow"), medium: t("patternEngine.priMedium"), high: t("patternEngine.priHigh"), critical: t("patternEngine.priCritical"),
  };
  const avg = (arr: number[]) => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  const patterns = useMemo(() => {
    if (decisions.length < 2) return null;

    const categoryStats: Record<string, { total: number; approved: number; rejected: number; avgDays: number[]; avgImpact: number[] }> = {};
    const priorityStats: Record<string, { total: number; approved: number; rejected: number; avgDays: number[] }> = {};

    decisions.forEach((d) => {
      if (!categoryStats[d.category]) categoryStats[d.category] = { total: 0, approved: 0, rejected: 0, avgDays: [], avgImpact: [] };
      const cs = categoryStats[d.category];
      cs.total++;
      if (d.status === "approved" || d.status === "implemented") cs.approved++;
      if (d.status === "rejected") cs.rejected++;
      if (d.ai_impact_score) cs.avgImpact.push(d.ai_impact_score);
      if (d.status !== "draft" && d.created_at && d.updated_at) {
        const days = differenceInDays(parseISO(d.updated_at), parseISO(d.created_at));
        if (days >= 0) cs.avgDays.push(days);
      }
      if (!priorityStats[d.priority]) priorityStats[d.priority] = { total: 0, approved: 0, rejected: 0, avgDays: [] };
      const ps = priorityStats[d.priority];
      ps.total++;
      if (d.status === "approved" || d.status === "implemented") ps.approved++;
      if (d.status === "rejected") ps.rejected++;
      if (d.status !== "draft" && d.created_at && d.updated_at) {
        const days = differenceInDays(parseISO(d.updated_at), parseISO(d.created_at));
        if (days >= 0) ps.avgDays.push(days);
      }
    });

    const statusCounts: Record<string, number> = {};
    decisions.forEach((d) => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });

    const escalated = decisions.filter((d) => (d.escalation_level || 0) > 0);
    const escalationRate = decisions.length > 0 ? (escalated.length / decisions.length) * 100 : 0;

    const withBothScores = decisions.filter((d) => d.ai_impact_score && d.actual_impact_score);
    const impactAccuracy = withBothScores.length > 0
      ? withBothScores.reduce((sum, d) => { const diff = Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0)); return sum + (100 - diff); }, 0) / withBothScores.length
      : null;

    const insights: PatternInsight[] = [];

    const catEntries = Object.entries(categoryStats).filter(([, s]) => s.total >= 2);
    if (catEntries.length > 0) {
      const best = catEntries.reduce((a, b) => { const rateA = a[1].approved / a[1].total; const rateB = b[1].approved / b[1].total; return rateA >= rateB ? a : b; });
      const rate = Math.round((best[1].approved / best[1].total) * 100);
      const catLabel = categoryLabels[best[0]] || best[0];
      if (rate > 50) {
        insights.push({ label: t("patternEngine.highestSuccess", { cat: catLabel }), description: t("patternEngine.highestSuccessDesc", { rate, cat: catLabel }), confidence: Math.min(rate, 95), type: "success", icon: CheckCircle2 });
      }
    }

    if (catEntries.length > 1) {
      const worst = catEntries.reduce((a, b) => { const rateA = a[1].rejected / a[1].total; const rateB = b[1].rejected / b[1].total; return rateA >= rateB ? a : b; });
      const rejRate = Math.round((worst[1].rejected / worst[1].total) * 100);
      const catLabel = categoryLabels[worst[0]] || worst[0];
      if (rejRate > 20) {
        insights.push({ label: t("patternEngine.highRejection", { cat: catLabel }), description: t("patternEngine.highRejectionDesc", { rate: rejRate, cat: catLabel }), confidence: Math.min(rejRate + 40, 90), type: "warning", icon: AlertTriangle });
      }
    }

    const allDays = decisions.filter((d) => d.status !== "draft" && d.created_at && d.updated_at).map((d) => differenceInDays(parseISO(d.updated_at), parseISO(d.created_at))).filter((d) => d >= 0);
    const avgSpeed = allDays.length > 0 ? allDays.reduce((a, b) => a + b, 0) / allDays.length : 0;

    if (avgSpeed > 0) {
      insights.push({ label: t("patternEngine.avgProcessTime", { days: Math.round(avgSpeed) }), description: avgSpeed > 7 ? t("patternEngine.avgProcessTimeSlow") : t("patternEngine.avgProcessTimeFast"), confidence: Math.min(70 + allDays.length, 95), type: avgSpeed > 7 ? "warning" : "success", icon: Clock });
    }
    if (escalationRate > 15) {
      insights.push({ label: t("patternEngine.escalationRateHigh", { rate: Math.round(escalationRate) }), description: t("patternEngine.escalationRateHighDesc"), confidence: 80, type: "warning", icon: AlertTriangle });
    }
    const draftRate = ((statusCounts["draft"] || 0) / decisions.length) * 100;
    if (draftRate > 30) {
      insights.push({ label: t("patternEngine.draftRateHigh", { rate: Math.round(draftRate) }), description: t("patternEngine.draftRateHighDesc"), confidence: 85, type: "info", icon: Target });
    }
    if (impactAccuracy !== null) {
      insights.push({ label: t("patternEngine.aiPredictionAccuracy", { acc: Math.round(impactAccuracy) }), description: impactAccuracy > 70 ? t("patternEngine.aiPredictionGood") : t("patternEngine.aiPredictionBad"), confidence: Math.round(impactAccuracy), type: impactAccuracy > 70 ? "success" : "info", icon: Brain });
    }

    const recommendations: string[] = [];
    if (avgSpeed > 7) recommendations.push(t("patternEngine.recWeeklyReviews"));
    if (escalationRate > 15) recommendations.push(t("patternEngine.recClearOwnership"));
    if (draftRate > 30) recommendations.push(t("patternEngine.recDraftDeadlines"));
    if (withBothScores.length < 3) recommendations.push(t("patternEngine.recMoreImpact"));

    const bestPriority = Object.entries(priorityStats).reduce((a, b) => { const rateA = a[1].total > 0 ? a[1].approved / a[1].total : 0; const rateB = b[1].total > 0 ? b[1].approved / b[1].total : 0; return rateA >= rateB ? a : b; });
    if (bestPriority[1].total >= 2) recommendations.push(t("patternEngine.recBestPriority", { priority: priorityLabels[bestPriority[0]] || bestPriority[0] }));

    return { categoryStats, priorityStats, statusCounts, escalationRate, impactAccuracy, avgSpeed: Math.round(avgSpeed), insights, recommendations, totalDecisions: decisions.length, dataPoints: decisions.length + allDays.length + withBothScores.length };
  }, [decisions]);

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  if (isLoading) return <Wrap><AnalysisPageSkeleton /></Wrap>;
  if (!patterns) {
    return (
      <Wrap>
        <EmptyAnalysisState icon={Brain} title={t("patternEngine.noData")} description={t("patternEngine.noDataDesc")} hint={t("patternEngine.noDataHint")} />
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("patternEngine.label")}</p>
            <h1 className="text-xl font-semibold tracking-tight">{t("patternEngine.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("patternEngine.learnsFrom", { total: patterns.totalDecisions, points: patterns.dataPoints })}
            </p>
          </div>
          <PageHelpButton title={t("patternEngine.title")} description={t("patternEngine.help")} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><BarChart3 className="w-3.5 h-3.5" /><span className="text-[11px] font-medium uppercase tracking-wider">{t("patternEngine.decisions")}</span></div><p className="text-2xl font-bold">{patterns.totalDecisions}</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" /><span className="text-[11px] font-medium uppercase tracking-wider">{t("patternEngine.avgSpeed")}</span></div><p className="text-2xl font-bold">{patterns.avgSpeed} <span className="text-sm font-normal text-muted-foreground">{t("patternEngine.days")}</span></p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><AlertTriangle className="w-3.5 h-3.5" /><span className="text-[11px] font-medium uppercase tracking-wider">{t("patternEngine.escalationRate")}</span></div><p className="text-2xl font-bold">{Math.round(patterns.escalationRate)}%</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><Brain className="w-3.5 h-3.5" /><span className="text-[11px] font-medium uppercase tracking-wider">{t("patternEngine.aiAccuracy")}</span></div><p className="text-2xl font-bold">{patterns.impactAccuracy !== null ? `${Math.round(patterns.impactAccuracy)}%` : "–"}</p></CardContent></Card>
        </div>

        {patterns.insights.length > 0 && (
          <CollapsibleSection title={t("patternEngine.detectedPatterns")} subtitle={t("patternEngine.detectedPatternsSub", { count: patterns.insights.length })} icon={<Brain className="w-4 h-4 text-muted-foreground" />} defaultOpen={true}>
            <Card>
              <CardContent className="p-4 space-y-3">
                {patterns.insights.map((insight, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${insight.type === "success" ? "border-success/20 bg-success/5" : insight.type === "warning" ? "border-warning/20 bg-warning/5" : "border-border bg-muted/5"}`}>
                    <insight.icon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.type === "success" ? "text-success" : insight.type === "warning" ? "text-warning" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{insight.label}</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{insight.confidence}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}

        <CollapsibleSection title={t("patternEngine.categoryPriority")} subtitle={t("patternEngine.categoryPrioritySub")} icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">{t("patternEngine.successByCategory")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(patterns.categoryStats).map(([cat, stats]) => {
                  const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{categoryLabels[cat] || cat}</span>
                        <span className="text-muted-foreground">{rate}% · {stats.total} {t("patternEngine.decSuffix")} · ⌀ {avg(stats.avgDays)}d</span>
                      </div>
                      <Progress value={rate} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">{t("patternEngine.throughputByPriority")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(patterns.priorityStats).map(([pri, stats]) => {
                  const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
                  return (
                    <div key={pri} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{priorityLabels[pri] || pri}</span>
                        <span className="text-muted-foreground">{rate}% · {stats.total} {t("patternEngine.decSuffix")} · ⌀ {avg(stats.avgDays)}d</span>
                      </div>
                      <Progress value={rate} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>

        <AiInsightPanel
          type="pattern"
          context={{
            totalDecisions: patterns.totalDecisions,
            avgSpeed: patterns.avgSpeed,
            escalationRate: Math.round(patterns.escalationRate),
            impactAccuracy: patterns.impactAccuracy,
            categoryStats: patterns.categoryStats,
            priorityStats: patterns.priorityStats,
            statusCounts: patterns.statusCounts,
            insightCount: patterns.insights.length,
          }}
        />

        {patterns.recommendations.length > 0 && (
          <CollapsibleSection title={t("patternEngine.recommendations")} subtitle={t("patternEngine.recommendationsSub", { count: patterns.recommendations.length })} icon={<Zap className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {patterns.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}
      </div>
    </Wrap>
  );
};

export default PatternEngine;
