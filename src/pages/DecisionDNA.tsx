import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dna, ShieldAlert, Zap, Clock, Users, GitBranch, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, ArrowRight, BarChart3, ListChecks, Download, Info,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { motion } from "framer-motion";
// AiInsightPanel removed — already on Process Intelligence
import { useToast } from "@/hooks/use-toast";

interface Trait { id: string; label: string; description: string; score: number; sentiment: "positive" | "negative" | "neutral"; icon: any; insight: string; }
interface CategoryProfile { category: string; label: string; avgDays: number; total: number; implementRate: number; escalationRate: number; }

const DecisionDNA = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const [traits, setTraits] = useState<Trait[]>([]);
  const [categoryProfiles, setCategoryProfiles] = useState<CategoryProfile[]>([]);
  const [overallArchetype, setOverallArchetype] = useState("");
  const [archetypeDescription, setArchetypeDescription] = useState("");

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const loading = decLoading || revLoading || depLoading || teamLoading || taskLoading;

  useEffect(() => {
    if (loading || decisions.length === 0) return;
    const now = Date.now();
    const total = decisions.length;
    const implemented = decisions.filter(d => d.status === "implemented");
    const open = decisions.filter(d => !["implemented", "rejected"].includes(d.status));

    const avgRisk = decisions.filter(d => d.ai_risk_score).reduce((s, d) => s + (d.ai_risk_score || 0), 0) / Math.max(1, decisions.filter(d => d.ai_risk_score).length);
    const highRiskApproved = decisions.filter(d => (d.ai_risk_score || 0) > 60 && (d.status === "approved" || d.status === "implemented")).length;
    const highRiskTotal = decisions.filter(d => (d.ai_risk_score || 0) > 60).length;
    const riskAppetite = highRiskTotal > 0 ? Math.round((highRiskApproved / highRiskTotal) * 100) : 50;
    const isRiskAverse = riskAppetite < 40;

    const durations = implemented.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const velocityScore = Math.max(0, Math.min(100, Math.round(100 - avgDuration * 2)));

    const escalated = decisions.filter(d => (d.escalation_level || 0) > 0).length;
    const escalationRate = Math.round((escalated / total) * 100);
    const implRate = total > 0 ? Math.round((implemented.length / total) * 100) : 0;

    const withDueDate = decisions.filter(d => d.due_date);
    const overdue = withDueDate.filter(d => new Date(d.due_date!).getTime() < now && !["implemented", "rejected"].includes(d.status)).length;
    const overdueRate = withDueDate.length > 0 ? Math.round((overdue / withDueDate.length) * 100) : 0;

    const crossTeamDeps = deps.filter(dep => { const src = decisions.find(d => d.id === dep.source_decision_id); const tgt = decisions.find(d => d.id === dep.target_decision_id); return src?.team_id && tgt?.team_id && src.team_id !== tgt.team_id; });
    const crossTeamScore = Math.min(100, Math.round((crossTeamDeps.length / Math.max(1, deps.length)) * 100));

    const reviewedDecisions = new Set(reviews.map(r => r.decision_id));
    const reviewCoverage = total > 0 ? Math.round((reviewedDecisions.size / total) * 100) : 0;

    const withOutcome = decisions.filter(d => d.ai_impact_score && d.actual_impact_score);
    const predAccuracy = withOutcome.length > 0 ? Math.round(withOutcome.reduce((s, d) => s + (100 - Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0))), 0) / withOutcome.length) : null;

    const computedTraits: Trait[] = [
      { id: "risk_appetite", label: isRiskAverse ? t("decisionDna.riskAverse") : riskAppetite > 70 ? t("decisionDna.riskSeeking") : t("decisionDna.riskBalanced"), description: t("decisionDna.riskDesc"), score: riskAppetite, sentiment: riskAppetite > 30 && riskAppetite < 80 ? "positive" : "neutral", icon: ShieldAlert, insight: isRiskAverse ? t("decisionDna.riskInsightLow", { pct: riskAppetite }) : t("decisionDna.riskInsightHigh", { pct: riskAppetite }) },
      { id: "velocity", label: velocityScore > 70 ? t("decisionDna.fastDecider") : velocityScore > 40 ? t("decisionDna.moderateSpeed") : t("decisionDna.slowDecider"), description: t("decisionDna.velocityDesc"), score: velocityScore, sentiment: velocityScore > 50 ? "positive" : "negative", icon: Zap, insight: t("decisionDna.velocityInsight", { days: Math.round(avgDuration) }) },
      { id: "escalation", label: escalationRate > 30 ? t("decisionDna.escalationHeavy") : escalationRate > 15 ? t("decisionDna.escalationModerate") : t("decisionDna.selfResolving"), description: t("decisionDna.escalationDesc"), score: 100 - escalationRate, sentiment: escalationRate < 20 ? "positive" : escalationRate < 40 ? "neutral" : "negative", icon: AlertTriangle, insight: t("decisionDna.escalationInsight", { pct: escalationRate }) },
      { id: "followthrough", label: implRate > 60 ? t("decisionDna.highFollowThrough") : implRate > 35 ? t("decisionDna.medFollowThrough") : t("decisionDna.lowFollowThrough"), description: t("decisionDna.followThroughDesc"), score: implRate, sentiment: implRate > 50 ? "positive" : implRate > 30 ? "neutral" : "negative", icon: CheckCircle2, insight: t("decisionDna.followThroughInsight", { pct: implRate }) },
      { id: "deadline_discipline", label: overdueRate < 15 ? t("decisionDna.deadlineDiscipline") : overdueRate < 35 ? t("decisionDna.deadlineChallenges") : t("decisionDna.chronicallyOverdue"), description: t("decisionDna.deadlineDesc"), score: 100 - overdueRate, sentiment: overdueRate < 20 ? "positive" : "negative", icon: Clock, insight: t("decisionDna.deadlineInsight", { pct: overdueRate }) },
      { id: "cross_team", label: crossTeamScore > 40 ? t("decisionDna.strongNetworking") : crossTeamScore > 15 ? t("decisionDna.moderateNetworking") : t("decisionDna.siloOrg"), description: t("decisionDna.networkDesc"), score: crossTeamScore, sentiment: crossTeamScore > 20 ? "positive" : "negative", icon: GitBranch, insight: t("decisionDna.networkInsight", { pct: crossTeamScore }) },
      { id: "review_culture", label: reviewCoverage > 60 ? t("decisionDna.strongReview") : reviewCoverage > 30 ? t("decisionDna.partialReview") : t("decisionDna.weakReview"), description: t("decisionDna.reviewDesc"), score: reviewCoverage, sentiment: reviewCoverage > 50 ? "positive" : reviewCoverage > 25 ? "neutral" : "negative", icon: Users, insight: t("decisionDna.reviewInsight", { pct: reviewCoverage }) },
    ];
    if (predAccuracy !== null) computedTraits.push({ id: "prediction_accuracy", label: predAccuracy > 75 ? t("decisionDna.preciseForecasts") : t("decisionDna.moderateForecasts"), description: t("decisionDna.forecastDesc"), score: predAccuracy, sentiment: predAccuracy > 60 ? "positive" : "neutral", icon: BarChart3, insight: t("decisionDna.forecastInsight", { pct: predAccuracy }) });

    // Task Execution Trait
    const doneTasks = tasks.filter(tk => tk.status === "done");
    const openTasks = tasks.filter(tk => tk.status !== "done");
    const taskRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 50;
    const overdueTasks = openTasks.filter(tk => tk.due_date && new Date(tk.due_date!).getTime() < now && tk.status !== "done");
    const taskOverdueRate = openTasks.length > 0 ? Math.round((overdueTasks.length / openTasks.length) * 100) : 0;
    const taskScore = Math.round(taskRate * 0.6 + (100 - taskOverdueRate) * 0.4);
    computedTraits.push({ id: "task_execution", label: taskScore > 70 ? t("decisionDna.strongTaskExec") : taskScore > 45 ? t("decisionDna.modTaskExec") : t("decisionDna.weakTaskExec"), description: t("decisionDna.taskExecDesc"), score: taskScore, sentiment: taskScore > 60 ? "positive" : taskScore > 40 ? "neutral" : "negative", icon: ListChecks, insight: t("decisionDna.taskExecInsight", { completionRate: taskRate, overdue: overdueTasks.length }) });

    setTraits(computedTraits);

    const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"];
    const catLabelKeys: Record<string, string> = { strategic: "decisionDna.catStrategic", budget: "decisionDna.catBudget", hr: "decisionDna.catHr", technical: "decisionDna.catTechnical", operational: "decisionDna.catOperational", marketing: "decisionDna.catMarketing" };
    const profiles: CategoryProfile[] = categories.map(cat => {
      const catDecs = decisions.filter(d => d.category === cat); const catImpl = catDecs.filter(d => d.status === "implemented");
      const catDurations = catImpl.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
      const catEsc = catDecs.filter(d => (d.escalation_level || 0) > 0).length;
      return { category: cat, label: t(catLabelKeys[cat] || cat), avgDays: catDurations.length > 0 ? Math.round(catDurations.reduce((a, b) => a + b, 0) / catDurations.length) : 0, total: catDecs.length, implementRate: catDecs.length > 0 ? Math.round((catImpl.length / catDecs.length) * 100) : 0, escalationRate: catDecs.length > 0 ? Math.round((catEsc / catDecs.length) * 100) : 0 };
    }).filter(p => p.total >= 2).sort((a, b) => b.total - a.total);
    setCategoryProfiles(profiles);

    const negTraits = computedTraits.filter(tr => tr.sentiment === "negative");
    const posTraits = computedTraits.filter(tr => tr.sentiment === "positive");
    if (posTraits.length >= 6) { setOverallArchetype(t("decisionDna.highPerformance")); setArchetypeDescription(t("decisionDna.highPerformanceDesc")); }
    else if (isRiskAverse && velocityScore < 50) { setOverallArchetype(t("decisionDna.conservative")); setArchetypeDescription(t("decisionDna.conservativeDesc")); }
    else if (escalationRate > 30 && overdueRate > 30) { setOverallArchetype(t("decisionDna.underPressure")); setArchetypeDescription(t("decisionDna.underPressureDesc")); }
    else if (crossTeamScore < 15 && reviewCoverage < 30) { setOverallArchetype(t("decisionDna.siloDriven")); setArchetypeDescription(t("decisionDna.siloDrivenDesc")); }
    else if (velocityScore > 70 && implRate > 60 && taskScore > 60) { setOverallArchetype(t("decisionDna.agile")); setArchetypeDescription(t("decisionDna.agileDesc")); }
    else if (taskScore < 40 && implRate > 50) { setOverallArchetype(t("decisionDna.decisionStrongExecWeak")); setArchetypeDescription(t("decisionDna.decisionStrongExecWeakDesc")); }
    else { setOverallArchetype(t("decisionDna.developing")); setArchetypeDescription(t("decisionDna.developingDesc")); }
  }, [loading, decisions, reviews, deps, teams, tasks, t]);

  const { toast } = useToast();

  const sentimentColor = (s: string) => s === "positive" ? "text-success" : s === "negative" ? "text-destructive" : "text-warning";
  const sentimentBg = (s: string) => s === "positive" ? "bg-success/15 border-success/25" : s === "negative" ? "bg-destructive/15 border-destructive/25" : "bg-warning/15 border-warning/25";
  const scoreBarColor = (score: number) => score >= 70 ? "bg-success" : score >= 45 ? "bg-warning" : "bg-destructive";

  const isInsufficientData = (trait: Trait) => trait.score === 0;

  const handleExportDna = () => {
    const lines = [
      t("decisionDna.title"),
      `${t("decisionDna.archetype")}: ${overallArchetype}`,
      archetypeDescription,
      "",
      t("decisionDna.traitsTitle"),
      ...traits.map(tr => `  ${tr.label}: ${tr.score}/100 (${tr.sentiment}) — ${tr.insight}`),
      "",
      t("decisionDna.speedProfile"),
      ...categoryProfiles.map(cp => `  ${cp.label}: Ø ${cp.avgDays}d, ${cp.implementRate}% ${t("decisionDna.implemented")}, ${cp.total} ${t("decisionDna.total")}`),
      "",
      `${t("decisionDna.strengths")}: ${traits.filter(tr => tr.sentiment === "positive").length}`,
      `${t("decisionDna.weaknesses")}: ${traits.filter(tr => tr.sentiment === "negative").length}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `decision-dna-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: t("decisionDna.exported") });
  };

  if (loading) return <AnalysisPageSkeleton cards={3} sections={2} />;

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  if (traits.length === 0) {
    return (
      <Wrap>
        <div className="mb-6"><p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("decisionDna.label")}</p><h1 className="text-xl font-semibold tracking-tight">{t("decisionDna.title")}</h1></div>
        <EmptyAnalysisState icon={Dna} title={t("decisionDna.noData")} description={t("decisionDna.noDataDesc")} hint={t("decisionDna.noDataHint")} />
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("decisionDna.label")}</p>
          <h1 className="text-xl font-semibold tracking-tight">{t("decisionDna.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportDna}>
            <Download className="w-3.5 h-3.5" />
            {t("decisionDna.exportDna")}
          </Button>
          <PageHelpButton title={t("decisionDna.title")} description={t("decisionDna.help")} />
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><Dna className="w-6 h-6 text-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{t("decisionDna.archetype")}</p>
              <h2 className="text-2xl font-semibold tracking-tight">{overallArchetype}</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{archetypeDescription}</p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1 text-success"><TrendingUp className="w-3 h-3" />{traits.filter(tr => tr.sentiment === "positive").length} {t("decisionDna.strengths")}</span>
            <span className="flex items-center gap-1 text-destructive"><TrendingDown className="w-3 h-3" />{traits.filter(tr => tr.sentiment === "negative").length} {t("decisionDna.weaknesses")}</span>
          </div>
        </CardContent>
      </Card>

      <CollapsibleSection title={t("decisionDna.traitsTitle")} subtitle={t("decisionDna.traitsSub", { count: traits.length })} icon={<Dna className="w-4 h-4 text-muted-foreground" />} defaultOpen={true} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {traits.map((trait) => {
            const noData = isInsufficientData(trait);
            return (
              <Card key={trait.id} className={`border ${noData ? "border-border bg-muted/30" : sentimentBg(trait.sentiment)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30 ${noData ? "text-muted-foreground" : sentimentColor(trait.sentiment)}`}><trait.icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{trait.label}</p>
                      <p className="text-[10px] text-muted-foreground">{trait.description}</p>
                    </div>
                    {!noData && <span className={`text-xl font-bold tabular-nums ${sentimentColor(trait.sentiment)}`}>{trait.score}</span>}
                  </div>
                  {noData ? (
                    <div className="space-y-1.5">
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium text-muted-foreground bg-muted/50">
                        {t("decisionDna.moreDataNeeded", "Mehr Daten nötig")}
                      </span>
                      <a href="/decisions" className="flex items-center gap-1 text-[11px] text-primary hover:underline" onClick={(e) => { e.preventDefault(); window.location.href = "/decisions"; }}>
                        <ArrowRight className="w-3 h-3" /> {t("decisionDna.createDecisionCta", "Entscheidung anlegen")}
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                        <div className={`h-full rounded-full ${scoreBarColor(trait.score)}`} style={{ width: `${trait.score}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{trait.insight}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("decisionDna.speedProfile")} subtitle={categoryProfiles.length > 0 ? t("decisionDna.traitsSub", { count: categoryProfiles.length }) : undefined} icon={<Clock className="w-4 h-4 text-muted-foreground" />} defaultOpen={categoryProfiles.length > 0} className="mb-8">
        {categoryProfiles.length > 0 ? (
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                {categoryProfiles.map((cat) => {
                  const maxDays = Math.max(...categoryProfiles.map(c => c.avgDays), 1);
                  return (
                    <div key={cat.category} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-24 shrink-0">{cat.label}</span>
                      <div className="flex-1 h-6 rounded-lg bg-muted/30 overflow-hidden relative">
                        <div className={`h-full rounded-lg ${cat.avgDays > 20 ? "bg-destructive/60" : cat.avgDays > 10 ? "bg-warning/50" : "bg-success/40"}`} style={{ width: `${(cat.avgDays / maxDays) * 100}%` }} />
                        <span className="absolute inset-0 flex items-center px-3 text-[10px] font-medium">Ø {cat.avgDays}d • {cat.implementRate}% {t("decisionDna.implemented")} • {cat.total} {t("decisionDna.total")}</span>
                      </div>
                      {cat.escalationRate > 25 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium shrink-0">{cat.escalationRate}% {t("decisionDna.escalated")}</span>}
                    </div>
                  );
                })}
              </div>
              {categoryProfiles.length < 3 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">{t("decisionDna.moreCategoriesHint", "Mehr Kategorien erscheinen ab 2+ Entscheidungen je Kategorie.")}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t("decisionDna.speedProfileEmpty")}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t("decisionDna.speedProfileEmptyHint")}</p>
            </CardContent>
          </Card>
        )}
      </CollapsibleSection>

      {/* KI-Tiefenanalyse removed — already on Process Intelligence */}

      <CollapsibleSection title={t("decisionDna.recommendations")} subtitle={t("decisionDna.recommendationsSub")} icon={<ArrowRight className="w-4 h-4 text-muted-foreground" />} defaultOpen={true}>
        <div className="space-y-2">
          {traits.filter(tr => tr.sentiment === "negative").map((trait) => (
            <Card key={trait.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{trait.label} {t("decisionDna.improve")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{trait.insight}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {traits.filter(tr => tr.sentiment === "negative").length === 0 && (
            <Card><CardContent className="p-4 text-center text-sm text-success"><CheckCircle2 className="w-5 h-5 mx-auto mb-1" />{t("decisionDna.noWeaknesses")}</CardContent></Card>
          )}
        </div>
      </CollapsibleSection>
    </Wrap>
  );
};

export default DecisionDNA;
