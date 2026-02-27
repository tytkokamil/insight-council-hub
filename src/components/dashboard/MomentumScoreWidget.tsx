import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Zap, Target, HeartPulse, TrendingUp, ShieldAlert, GitPullRequest, Lightbulb, ArrowUp, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions, useDependencies, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import WidgetSkeleton from "./WidgetSkeleton";
import { useTranslation } from "react-i18next";

interface MomentumBreakdown {
  velocity: number;
  bottleneckRate: number;
  reviewEfficiency: number;
  escalationRate: number;
  decisionQuality: number;
  taskExecution: number;
}

interface Recommendation {
  text: string;
  impact: number;
  type: "velocity" | "bottleneck" | "review" | "escalation" | "quality" | "tasks";
}

const MomentumScoreWidget = () => {
  const { t } = useTranslation();
  const { data: decisions = [], isLoading: loadingDecisions } = useDecisions();
  const { data: deps = [], isLoading: loadingDeps } = useDependencies();
  const { data: reviews = [], isLoading: loadingReviews } = useReviews();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: escalations = [], isLoading: loadingEsc } = useQuery({
    queryKey: ["escalation-notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("id, type, created_at").eq("type", "escalation");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const [showDetails, setShowDetails] = useState(false);

  const isLoading = loadingDecisions || loadingDeps || loadingReviews || loadingEsc || loadingTasks;

  const { score, breakdown, recommendations, predictedScore } = useMemo(() => {
    if (decisions.length === 0 && tasks.length === 0) return { score: null, breakdown: { velocity: 0, bottleneckRate: 0, reviewEfficiency: 0, escalationRate: 0, decisionQuality: 0, taskExecution: 0 }, recommendations: [], predictedScore: null };

    const total = decisions.length;
    const implemented = decisions.filter(d => d.status === "implemented");
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const now = Date.now();
    const recs: Recommendation[] = [];
    const MAX = 17;

    const vels = implemented.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
    const avgVel = vels.length > 0 ? vels.reduce((s, v) => s + v, 0) / vels.length : 30;
    const velocity = Math.max(0, Math.min(MAX, Math.round(MAX * (1 - Math.min(avgVel, 60) / 60))));

    if (avgVel > 14) {
      const potentialGain = Math.min(5, Math.round((avgVel - 7) / 5));
      recs.push({ text: t("momentum.recAccelerate", { gain: potentialGain }), impact: potentialGain, type: "velocity" });
    }

    const blockedIds = new Set(deps.filter(d => d.dependency_type === "blocks").map(d => d.target_decision_id));
    const blockedActive = active.filter(d => blockedIds.has(d.id));
    const bottleneckRatio = active.length > 0 ? blockedActive.length / active.length : 0;
    const bottleneckRate = Math.max(0, Math.min(MAX, Math.round(MAX * (1 - bottleneckRatio))));

    if (bottleneckRatio > 0.15) {
      const sourceCount: Record<string, number> = {};
      deps.filter(d => d.dependency_type === "blocks").forEach(d => { sourceCount[d.source_decision_id ?? ""] = (sourceCount[d.source_decision_id ?? ""] || 0) + 1; });
      const topBlocker = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0];
      if (topBlocker) {
        const blockerDec = decisions.find(d => d.id === topBlocker[0]);
        recs.push({ text: t("momentum.recResolveBlocker", { title: blockerDec?.title?.slice(0, 30) || t("momentum.recDecision"), count: topBlocker[1] }), impact: Math.min(4, topBlocker[1] * 2), type: "bottleneck" });
      }
    }

    const completedReviews = reviews.filter(r => r.reviewed_at);
    const reviewTimes = completedReviews.map(r => (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000);
    const avgReviewTime = reviewTimes.length > 0 ? reviewTimes.reduce((s, v) => s + v, 0) / reviewTimes.length : 7;
    const pendingReviews = reviews.filter(r => !r.reviewed_at);
    const reviewEfficiency = Math.max(0, Math.min(MAX, Math.round(MAX * (1 - Math.min(avgReviewTime, 14) / 14))));

    if (pendingReviews.length > 2) {
      recs.push({ text: t("momentum.recPendingReviews", { count: pendingReviews.length }), impact: Math.min(4, pendingReviews.length), type: "review" });
    }

    const recentEscalations = escalations.filter(e => new Date(e.created_at).getTime() > now - 30 * 86400000);
    const escalationRatio = total > 0 ? recentEscalations.length / total : 0;
    const escalationRate = Math.max(0, Math.min(MAX, Math.round(MAX * (1 - Math.min(escalationRatio, 0.5) / 0.5))));

    if (recentEscalations.length > 3) {
      recs.push({ text: t("momentum.recEscalations", { count: recentEscalations.length }), impact: Math.min(4, Math.round(recentEscalations.length / 2)), type: "escalation" });
    }

    const withOutcome = implemented.filter(d => d.actual_impact_score != null && d.ai_impact_score);
    const accuracies = withOutcome.map(d => 100 - Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0)));
    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 50;
    const decisionQuality = Math.max(0, Math.min(MAX, Math.round(avgAccuracy / 5 * (MAX / 20))));

    const overdueActive = active.filter(d => d.due_date && new Date(d.due_date).getTime() < now);
    if (overdueActive.length > 0) {
      recs.push({ text: t("momentum.recOverdueDecisions", { count: overdueActive.length }), impact: Math.min(5, overdueActive.length * 2), type: "quality" });
    }

    const doneTasks = tasks.filter(t => t.status === "done");
    const openTasks = tasks.filter(t => t.status !== "done");
    const taskCompletionRate = tasks.length > 0 ? doneTasks.length / tasks.length : 0.5;
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date).getTime() < now);
    const overdueTaskRate = openTasks.length > 0 ? overdueTasks.length / openTasks.length : 0;
    const taskExecution = Math.max(0, Math.min(MAX, Math.round(MAX * (taskCompletionRate * 0.6 + (1 - overdueTaskRate) * 0.4))));

    if (overdueTasks.length > 0) {
      recs.push({ text: t("momentum.recOverdueTasks", { count: overdueTasks.length }), impact: Math.min(4, overdueTasks.length), type: "tasks" });
    }
    if (openTasks.length > 5 && taskCompletionRate < 0.4) {
      recs.push({ text: t("momentum.recOpenTasks", { count: openTasks.length }), impact: Math.min(5, Math.round(openTasks.length / 3)), type: "tasks" });
    }

    const totalScore = velocity + bottleneckRate + reviewEfficiency + escalationRate + decisionQuality + taskExecution;
    recs.sort((a, b) => b.impact - a.impact);
    const topRecs = recs.slice(0, 3);
    const totalImpact = topRecs.reduce((s, r) => s + r.impact, 0);

    return {
      score: Math.min(100, totalScore),
      breakdown: { velocity, bottleneckRate, reviewEfficiency, escalationRate, decisionQuality, taskExecution },
      recommendations: topRecs,
      predictedScore: Math.min(100, totalScore + totalImpact),
    };
  }, [decisions, deps, reviews, escalations, tasks, t]);

  if (isLoading) return <WidgetSkeleton rows={6} showScore showProgress />;

  const getColor = (s: number) => s > 70 ? "text-success" : s > 40 ? "text-warning" : "text-destructive";
  const getBgColor = (s: number) => s > 70 ? "bg-success" : s > 40 ? "bg-warning" : "bg-destructive";

  const MAX = 17;
  const components = [
    { label: t("momentum.velocityLabel"), value: breakdown.velocity, max: MAX, icon: Zap, desc: t("momentum.velocityDesc") },
    { label: t("momentum.bottleneckLabel"), value: breakdown.bottleneckRate, max: MAX, icon: ShieldAlert, desc: t("momentum.bottleneckDesc") },
    { label: t("momentum.reviewLabel"), value: breakdown.reviewEfficiency, max: MAX, icon: GitPullRequest, desc: t("momentum.reviewDesc") },
    { label: t("momentum.escalationLabel"), value: breakdown.escalationRate, max: MAX, icon: HeartPulse, desc: t("momentum.escalationDesc") },
    { label: t("momentum.qualityLabel"), value: breakdown.decisionQuality, max: MAX, icon: Target, desc: t("momentum.qualityDesc") },
    { label: t("momentum.tasksLabel"), value: breakdown.taskExecution, max: MAX, icon: ListChecks, desc: t("momentum.tasksDesc") },
  ];

  return (
    <Card className="cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setShowDetails(!showDetails)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm">{t("momentum.title")}</CardTitle>
              <ScoreMethodology
                title={t("momentum.title")}
                description={t("momentum.methodology")}
                items={[
                  { label: t("momentum.velocityLabel"), weight: "17", formula: t("momentum.velocityFormula") },
                  { label: t("momentum.bottleneckLabel"), weight: "17", formula: t("momentum.bottleneckFormula") },
                  { label: t("momentum.reviewLabel"), weight: "17", formula: t("momentum.reviewFormula") },
                  { label: t("momentum.escalationLabel"), weight: "17", formula: t("momentum.escalationFormula") },
                  { label: t("momentum.qualityLabel"), weight: "17", formula: t("momentum.qualityFormula") },
                  { label: t("momentum.tasksLabel"), weight: "17", formula: t("momentum.tasksFormula") },
                ]}
                source={t("momentum.source")}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("momentum.subtitle")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {score !== null ? (
          <>
            <div className="flex items-end gap-2 mb-1">
              <span className={`font-display text-4xl font-bold tabular-nums ${getColor(score)}`}>{score}</span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
              {predictedScore && predictedScore > score && (
                <div className="flex items-center gap-1 text-success text-xs mb-1 ml-auto">
                  <ArrowUp className="w-3 h-3" />
                  <span>{t("momentum.possible", { score: predictedScore })}</span>
                </div>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-4">
              <motion.div className={`h-full rounded-full ${getBgColor(score)}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: "easeOut" }} />
            </div>

            <div className="space-y-2.5">
              {components.map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <c.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground w-20 truncate" title={c.desc}>{c.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className={`h-full rounded-full ${c.value / c.max > 0.7 ? "bg-success" : c.value / c.max > 0.4 ? "bg-warning" : "bg-destructive"}`} initial={{ width: 0 }} animate={{ width: `${(c.value / c.max) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right text-muted-foreground">{c.value}/{c.max}</span>
                </div>
              ))}
            </div>

            {showDetails && recommendations.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-semibold">{t("momentum.predictiveRecs")}</span>
                </div>
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-xs">
                    <ArrowUp className="w-3 h-3 text-success mt-0.5 shrink-0" />
                    <span className="flex-1 text-muted-foreground">{rec.text}</span>
                    <span className="text-success font-bold shrink-0">+{rec.impact}</span>
                  </div>
                ))}
                {predictedScore && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {t("momentum.scorePotential")} <span className="text-success font-bold">{predictedScore}</span>
                  </p>
                )}
              </motion.div>
            )}

            {!showDetails && recommendations.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-3">{t("momentum.clickForRecs")}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("momentum.calculating")}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MomentumScoreWidget;
