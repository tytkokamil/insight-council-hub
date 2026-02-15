import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Zap, Target, HeartPulse, TrendingUp, ShieldAlert, GitPullRequest, Lightbulb, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions, useDependencies, useReviews } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import WidgetSkeleton from "./WidgetSkeleton";

interface MomentumBreakdown {
  velocity: number;
  bottleneckRate: number;
  reviewEfficiency: number;
  escalationRate: number;
  decisionQuality: number;
}

interface Recommendation {
  text: string;
  impact: number;
  type: "velocity" | "bottleneck" | "review" | "escalation" | "quality";
}

const MomentumScoreWidget = () => {
  const { data: decisions = [], isLoading: loadingDecisions } = useDecisions();
  const { data: deps = [], isLoading: loadingDeps } = useDependencies();
  const { data: reviews = [], isLoading: loadingReviews } = useReviews();
  const { data: escalations = [], isLoading: loadingEsc } = useQuery({
    queryKey: ["escalation-notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("id, type, created_at").eq("type", "escalation");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const [showDetails, setShowDetails] = useState(false);

  const isLoading = loadingDecisions || loadingDeps || loadingReviews || loadingEsc;

  const { score, breakdown, recommendations, predictedScore } = useMemo(() => {
    if (decisions.length === 0) return { score: null, breakdown: { velocity: 0, bottleneckRate: 0, reviewEfficiency: 0, escalationRate: 0, decisionQuality: 0 }, recommendations: [], predictedScore: null };

    const total = decisions.length;
    const implemented = decisions.filter(d => d.status === "implemented");
    const active = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const now = Date.now();
    const recs: Recommendation[] = [];

    const vels = implemented.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
    const avgVel = vels.length > 0 ? vels.reduce((s, v) => s + v, 0) / vels.length : 30;
    const velocity = Math.max(0, Math.min(20, Math.round(20 * (1 - Math.min(avgVel, 60) / 60))));

    if (avgVel > 14) {
      const potentialGain = Math.min(6, Math.round((avgVel - 7) / 5));
      recs.push({ text: `Älteste Entscheidungen beschleunigen → Velocity +${potentialGain}`, impact: potentialGain, type: "velocity" });
    }

    const blockedIds = new Set(deps.filter(d => d.dependency_type === "blocks").map(d => d.target_decision_id));
    const blockedActive = active.filter(d => blockedIds.has(d.id));
    const bottleneckRatio = active.length > 0 ? blockedActive.length / active.length : 0;
    const bottleneckRate = Math.max(0, Math.min(20, Math.round(20 * (1 - bottleneckRatio))));

    if (bottleneckRatio > 0.15) {
      const sourceCount: Record<string, number> = {};
      deps.filter(d => d.dependency_type === "blocks").forEach(d => { sourceCount[d.source_decision_id] = (sourceCount[d.source_decision_id] || 0) + 1; });
      const topBlocker = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0];
      if (topBlocker) {
        const blockerDec = decisions.find(d => d.id === topBlocker[0]);
        recs.push({ text: `"${blockerDec?.title?.slice(0, 30) || "Entscheidung"}..." lösen → ${topBlocker[1]} Blockaden aufheben`, impact: Math.min(5, topBlocker[1] * 2), type: "bottleneck" });
      }
    }

    const completedReviews = reviews.filter(r => r.reviewed_at);
    const reviewTimes = completedReviews.map(r => (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000);
    const avgReviewTime = reviewTimes.length > 0 ? reviewTimes.reduce((s, v) => s + v, 0) / reviewTimes.length : 7;
    const pendingReviews = reviews.filter(r => !r.reviewed_at);
    const reviewEfficiency = Math.max(0, Math.min(20, Math.round(20 * (1 - Math.min(avgReviewTime, 14) / 14))));

    if (pendingReviews.length > 2) {
      recs.push({ text: `${pendingReviews.length} ausstehende Reviews abschließen → Effizienz steigt`, impact: Math.min(4, pendingReviews.length), type: "review" });
    }

    const recentEscalations = escalations.filter(e => new Date(e.created_at).getTime() > now - 30 * 86400000);
    const escalationRatio = total > 0 ? recentEscalations.length / total : 0;
    const escalationRate = Math.max(0, Math.min(20, Math.round(20 * (1 - Math.min(escalationRatio, 0.5) / 0.5))));

    if (recentEscalations.length > 3) {
      recs.push({ text: `${recentEscalations.length} Eskalationen in 30 Tagen – Prozesse straffen`, impact: Math.min(4, Math.round(recentEscalations.length / 2)), type: "escalation" });
    }

    const withOutcome = implemented.filter(d => d.actual_impact_score != null && d.ai_impact_score);
    const accuracies = withOutcome.map(d => 100 - Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0)));
    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 50;
    const decisionQuality = Math.max(0, Math.min(20, Math.round(avgAccuracy / 5)));

    const overdueActive = active.filter(d => d.due_date && new Date(d.due_date).getTime() < now);
    if (overdueActive.length > 0) {
      recs.push({ text: `${overdueActive.length} überfällige Entscheidungen abschließen`, impact: Math.min(5, overdueActive.length * 2), type: "quality" });
    }

    const totalScore = velocity + bottleneckRate + reviewEfficiency + escalationRate + decisionQuality;
    recs.sort((a, b) => b.impact - a.impact);
    const topRecs = recs.slice(0, 3);
    const totalImpact = topRecs.reduce((s, r) => s + r.impact, 0);

    return {
      score: totalScore,
      breakdown: { velocity, bottleneckRate, reviewEfficiency, escalationRate, decisionQuality },
      recommendations: topRecs,
      predictedScore: Math.min(100, totalScore + totalImpact),
    };
  }, [decisions, deps, reviews, escalations]);

  if (isLoading) return <WidgetSkeleton rows={5} showScore showProgress />;

  const getColor = (s: number) => s > 70 ? "text-success" : s > 40 ? "text-warning" : "text-destructive";
  const getBgColor = (s: number) => s > 70 ? "bg-success" : s > 40 ? "bg-warning" : "bg-destructive";

  const components = [
    { label: "Velocity", value: breakdown.velocity, max: 20, icon: Zap, desc: "Entscheidungsgeschwindigkeit" },
    { label: "Bottleneck", value: breakdown.bottleneckRate, max: 20, icon: ShieldAlert, desc: "Blockaden-Freiheit" },
    { label: "Review", value: breakdown.reviewEfficiency, max: 20, icon: GitPullRequest, desc: "Review-Effizienz" },
    { label: "Eskalation", value: breakdown.escalationRate, max: 20, icon: HeartPulse, desc: "Eskalations-Freiheit" },
    { label: "Qualität", value: breakdown.decisionQuality, max: 20, icon: Target, desc: "Outcome-Genauigkeit" },
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
              <CardTitle className="text-sm">Momentum Score™</CardTitle>
              <ScoreMethodology
                title="Momentum Score"
                description="Aggregierter Gesundheitsindex (0–100) aus 5 gleichgewichteten Faktoren. Jeder Faktor wird auf 0–20 normalisiert."
                items={[
                  { label: "Velocity", weight: "20 Punkte", formula: "20 × (1 − min(Ø Tage bis Umsetzung, 60) / 60)" },
                  { label: "Bottleneck", weight: "20 Punkte", formula: "20 × (1 − Anteil blockierter aktiver Entscheidungen)" },
                  { label: "Review", weight: "20 Punkte", formula: "20 × (1 − min(Ø Review-Dauer in Tagen, 14) / 14)" },
                  { label: "Eskalation", weight: "20 Punkte", formula: "20 × (1 − min(Eskalationsquote 30d, 0.5) / 0.5)" },
                  { label: "Qualität", weight: "20 Punkte", formula: "Ø(100 − |KI-Impact − Ist-Impact|) / 5" },
                ]}
                source="Interne Berechnung auf Basis aller Entscheidungsdaten"
              />
            </div>
            <p className="text-xs text-muted-foreground">5-Faktor Organisationsgesundheit</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {score !== null ? (
          <>
            <div className="flex items-end gap-2 mb-1">
              <span className={`font-display text-4xl font-bold ${getColor(score)}`}>{score}</span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
              {predictedScore && predictedScore > score && (
                <div className="flex items-center gap-1 text-success text-xs mb-1 ml-auto">
                  <ArrowUp className="w-3 h-3" />
                  <span>→ {predictedScore} möglich</span>
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
                  <span className="text-xs font-semibold">Prädiktive Empfehlungen</span>
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
                    Score-Potenzial: <span className="text-success font-bold">{predictedScore}</span>
                  </p>
                )}
              </motion.div>
            )}

            {!showDetails && recommendations.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-3">Klicken für Empfehlungen</p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Berechne...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MomentumScoreWidget;
