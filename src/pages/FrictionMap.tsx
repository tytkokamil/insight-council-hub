import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Flame, Users, GitPullRequest, AlertTriangle, ArrowUpRight, BarChart3, Clock, CheckSquare } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";

interface TeamFriction { teamId: string; teamName: string; avgReviewTime: number; reviewLoops: number; escalationRate: number; overdueRate: number; totalDecisions: number; totalTasks: number; frictionScore: number; }
interface CrossTeamFriction { teamA: string; teamB: string; teamAName: string; teamBName: string; sharedDecisions: number; avgDelay: number; frictionLevel: "low" | "medium" | "high" | "critical"; }

const FrictionMap = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const [teamFriction, setTeamFriction] = useState<TeamFriction[]>([]);
  const [crossFriction, setCrossFriction] = useState<CrossTeamFriction[]>([]);
  const [view, setView] = useState<"teams" | "heatmap">("teams");

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();

  const loading = decLoading || taskLoading || teamLoading || revLoading || depLoading;

  const categoryLabels: Record<string, string> = {
    strategic: t("bottleneck.catStrategic"), budget: t("bottleneck.catBudget"), hr: t("bottleneck.catHr"),
    technical: t("bottleneck.catTechnical"), operational: t("bottleneck.catOperational"),
    marketing: t("bottleneck.catMarketing"), general: t("bottleneck.catGeneral"),
  };

  useEffect(() => {
    if (loading || (decisions.length === 0 && tasks.length === 0)) return;
    const now = Date.now();
    const teamMap = Object.fromEntries(teams.map(tm => [tm.id, tm.name]));
    const teamStats: Record<string, { decisions: any[]; tasks: any[]; reviewTimes: number[]; reviewLoops: number; escalations: number; overdue: number; }> = {};
    teams.forEach(tm => { teamStats[tm.id] = { decisions: [], tasks: [], reviewTimes: [], reviewLoops: 0, escalations: 0, overdue: 0 }; });

    decisions.forEach(d => {
      if (d.team_id && teamStats[d.team_id]) {
        teamStats[d.team_id].decisions.push(d);
        if (d.due_date && new Date(d.due_date).getTime() < now && d.status !== "implemented" && d.status !== "rejected") teamStats[d.team_id].overdue++;
        if ((d.escalation_level || 0) > 0) teamStats[d.team_id].escalations++;
      }
    });
    tasks.forEach(tk => {
      if (tk.team_id && teamStats[tk.team_id]) {
        teamStats[tk.team_id].tasks.push(tk);
        if (tk.due_date && new Date(tk.due_date).getTime() < now && tk.status !== "done") teamStats[tk.team_id].overdue++;
      }
    });

    const decisionReviews: Record<string, any[]> = {};
    reviews.forEach(r => { if (!decisionReviews[r.decision_id]) decisionReviews[r.decision_id] = []; decisionReviews[r.decision_id].push(r); });
    Object.entries(decisionReviews).forEach(([decId, revs]) => {
      const dec = decisions.find(d => d.id === decId);
      if (!dec?.team_id || !teamStats[dec.team_id]) return;
      const loopCount = Math.max(0, revs.length - 1);
      teamStats[dec.team_id].reviewLoops += loopCount;
      revs.forEach(r => { if (r.reviewed_at) { const reviewDays = (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / 86400000; teamStats[dec.team_id].reviewTimes.push(Math.max(0, reviewDays)); } });
    });

    const frictionResults: TeamFriction[] = teams.map(tm => {
      const stats = teamStats[tm.id];
      const totalDec = stats.decisions.length;
      const totalTasks = stats.tasks.length;
      const total = totalDec + totalTasks;
      if (total === 0) return { teamId: tm.id, teamName: tm.name, avgReviewTime: 0, reviewLoops: 0, escalationRate: 0, overdueRate: 0, totalDecisions: 0, totalTasks: 0, frictionScore: 0 };
      const avgReviewTime = stats.reviewTimes.length > 0 ? stats.reviewTimes.reduce((a, b) => a + b, 0) / stats.reviewTimes.length : 0;
      const escalationRate = totalDec > 0 ? Math.round((stats.escalations / totalDec) * 100) : 0;
      const overdueRate = Math.round((stats.overdue / total) * 100);
      const frictionScore = Math.min(100, Math.round((avgReviewTime > 7 ? 30 : avgReviewTime * 4.3) + (escalationRate * 0.3) + (overdueRate * 0.25) + (stats.reviewLoops / Math.max(totalDec, 1) * 15)));
      return { teamId: tm.id, teamName: tm.name, avgReviewTime: Math.round(avgReviewTime * 10) / 10, reviewLoops: stats.reviewLoops, escalationRate, overdueRate, totalDecisions: totalDec, totalTasks, frictionScore };
    }).filter(tm => (tm.totalDecisions + tm.totalTasks) > 0).sort((a, b) => b.frictionScore - a.frictionScore);
    setTeamFriction(frictionResults);

    // Cross-team friction
    const crossMap: Record<string, { sharedDecisions: Set<string>; delays: number[] }> = {};
    deps.forEach(dep => {
      const sourceDecision = decisions.find(d => d.id === dep.source_decision_id);
      const targetDecision = decisions.find(d => d.id === dep.target_decision_id);
      if (!sourceDecision?.team_id || !targetDecision?.team_id) return;
      if (sourceDecision.team_id === targetDecision.team_id) return;
      const key = [sourceDecision.team_id, targetDecision.team_id].sort().join("|");
      if (!crossMap[key]) crossMap[key] = { sharedDecisions: new Set(), delays: [] };
      crossMap[key].sharedDecisions.add(dep.source_decision_id);
      crossMap[key].sharedDecisions.add(dep.target_decision_id);
      const daysBetween = Math.abs(new Date(targetDecision.created_at).getTime() - new Date(sourceDecision.updated_at).getTime()) / 86400000;
      crossMap[key].delays.push(daysBetween);
    });
    const crossResults: CrossTeamFriction[] = Object.entries(crossMap).map(([key, data]) => {
      const [teamA, teamB] = key.split("|");
      const avgDelay = data.delays.length > 0 ? Math.round(data.delays.reduce((a, b) => a + b, 0) / data.delays.length * 10) / 10 : 0;
      const shared = data.sharedDecisions.size;
      let frictionLevel: CrossTeamFriction["frictionLevel"] = "low";
      if (avgDelay > 14 || shared > 5) frictionLevel = "critical"; else if (avgDelay > 7 || shared > 3) frictionLevel = "high"; else if (avgDelay > 3 || shared > 1) frictionLevel = "medium";
      return { teamA, teamB, teamAName: teamMap[teamA] || t("bottleneck.unknown"), teamBName: teamMap[teamB] || t("bottleneck.unknown"), sharedDecisions: shared, avgDelay, frictionLevel };
    }).sort((a, b) => b.avgDelay - a.avgDelay);
    setCrossFriction(crossResults);
  }, [loading, decisions, tasks, teams, reviews, deps]);

  const maxFriction = Math.max(...teamFriction.map(tf => tf.frictionScore), 1);
  const frictionColor = (score: number) => score >= 70 ? "bg-destructive" : score >= 50 ? "bg-warning" : score >= 30 ? "bg-primary" : "bg-success";
  const frictionTextColor = (score: number) => score >= 70 ? "text-destructive" : score >= 50 ? "text-warning" : score >= 30 ? "text-primary" : "text-success";
  const crossFrictionColor: Record<string, string> = { critical: "bg-destructive/30 border-destructive/40", high: "bg-warning/20 border-warning/30", medium: "bg-primary/15 border-primary/25", low: "bg-muted/20 border-border" };

  const heatmapData = useMemo(() => {
    if (teamFriction.length === 0) return { teams: [] as string[], categories: [] as string[], cells: {} as Record<string, number> };
    const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing", "general"];
    const teamsWithData = teamFriction.map(tf => tf.teamName);
    const cells: Record<string, number> = {};
    teamFriction.forEach(tf => { categories.forEach(cat => { const catMultiplier: Record<string, number> = { strategic: 1.3, budget: 1.2, hr: 0.9, technical: 1.1, operational: 0.8, marketing: 0.7, general: 1.0 }; const score = Math.min(100, Math.round(tf.frictionScore * (catMultiplier[cat] || 1))); cells[`${tf.teamName}|${cat}`] = score; }); });
    return { teams: teamsWithData, categories, cells };
  }, [teamFriction]);

  const getCellColor = (score: number): string => { if (score >= 70) return "bg-destructive/60"; if (score >= 50) return "bg-warning/50"; if (score >= 30) return "bg-primary/40"; if (score > 0) return "bg-success/30"; return "bg-muted/20"; };

  if (loading) return <AnalysisPageSkeleton cards={4} sections={2} />;

  if (teamFriction.length === 0) {
    const empty = (
      <>
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("frictionMap.label")}</p>
          <h1 className="text-xl font-semibold tracking-tight">{t("frictionMap.title")}</h1>
        </div>
        <EmptyAnalysisState icon={Flame} title={t("frictionMap.noData")} description={t("frictionMap.noDataDesc")} ctaLabel={t("frictionMap.noDataCta")} ctaRoute="/teams" hint={t("frictionMap.noDataHint")} />
      </>
    );
    return embedded ? empty : <AppLayout>{empty}</AppLayout>;
  }

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("frictionMap.label")}</p>
          <h1 className="text-xl font-semibold tracking-tight">{t("frictionMap.title")}</h1>
        </div>
        <PageHelpButton title={t("frictionMap.title")} description={t("frictionMap.help")} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: t("frictionMap.teamsAnalyzed"), value: teamFriction.length, color: "text-foreground" },
          { icon: Flame, label: t("frictionMap.highestFriction"), value: teamFriction[0]?.frictionScore ?? 0, color: "text-destructive", suffix: "/100" },
          { icon: GitPullRequest, label: t("frictionMap.reviewLoopsTotal"), value: teamFriction.reduce((s, tf) => s + tf.reviewLoops, 0), color: "text-warning" },
          { icon: AlertTriangle, label: t("frictionMap.crossTeamConflicts"), value: crossFriction.filter(c => c.frictionLevel === "high" || c.frictionLevel === "critical").length, color: "text-destructive" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold font-display tabular-nums">{card.value}{card.suffix || ""}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-muted-foreground">{t("frictionMap.viewLabel")}</span>
        {([{ key: "teams" as const, label: t("frictionMap.teamRanking") }, { key: "heatmap" as const, label: t("frictionMap.heatmap") }]).map(v => (
          <button key={v.key} onClick={() => setView(v.key)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${view === v.key ? "bg-foreground/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/30"}`}>{v.label}</button>
        ))}
      </div>

      {view === "teams" && (
        <>
          <CollapsibleSection title={t("frictionMap.teamFrictionRanking")} subtitle={t("frictionMap.teamFrictionRankingSub")} icon={<Flame className="w-4 h-4 text-destructive" />} defaultOpen={true} className="mb-8">
            <div className="space-y-2">
              {teamFriction.map((team, i) => (
                <div key={team.teamId} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${i < 2 ? "bg-destructive/20 text-destructive" : "bg-muted/30 text-muted-foreground"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{team.teamName}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{team.totalDecisions} {t("frictionMap.decCount")}</span>
                        <span><CheckSquare className="w-3 h-3 inline mr-0.5" />{team.totalTasks} {t("frictionMap.taskCount")}</span>
                        <span><Clock className="w-3 h-3 inline mr-0.5" />{t("frictionMap.reviewAvg", { days: team.avgReviewTime })}</span>
                        <span>{t("frictionMap.escalatedPct", { pct: team.escalationRate })}</span>
                      </div>
                    </div>
                    <div className="w-32 shrink-0 hidden md:block">
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${frictionColor(team.frictionScore)}`} style={{ width: `${(team.frictionScore / maxFriction) * 100}%` }} />
                      </div>
                    </div>
                    <div className={`text-right shrink-0 w-16 text-lg font-bold font-display tabular-nums ${frictionTextColor(team.frictionScore)}`}>{team.frictionScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {crossFriction.length > 0 && (
            <CollapsibleSection title={t("frictionMap.crossTeamFriction")} subtitle={t("frictionMap.crossTeamFrictionSub", { count: crossFriction.length })} icon={<ArrowUpRight className="w-4 h-4 text-warning" />} defaultOpen={false}>
              <div className="space-y-2">
                {crossFriction.map((cf) => (
                  <div key={`${cf.teamA}-${cf.teamB}`} className={`rounded-lg bg-card p-4 border ${crossFrictionColor[cf.frictionLevel]}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-semibold">{cf.teamAName}</span>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground rotate-90" />
                        <span className="text-sm font-semibold">{cf.teamBName}</span>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{t("frictionMap.sharedDecisions", { count: cf.sharedDecisions })}</p>
                        <p>{t("frictionMap.avgDelay", { days: cf.avgDelay })}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${cf.frictionLevel === "critical" ? "bg-destructive/20 text-destructive" : cf.frictionLevel === "high" ? "bg-warning/20 text-warning" : cf.frictionLevel === "medium" ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}>{cf.frictionLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}

      {view === "heatmap" && (
        <CollapsibleSection title={t("frictionMap.heatmapTitle")} icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />} defaultOpen={true}>
          <div className="rounded-lg border border-border bg-card p-5 overflow-x-auto">
            {heatmapData.teams.length > 0 ? (
              <table className="w-full text-xs">
                <thead><tr><th className="text-left p-2 text-muted-foreground font-medium">Team</th>{heatmapData.categories.map(cat => (<th key={cat} className="p-2 text-center text-muted-foreground font-medium">{categoryLabels[cat] || cat}</th>))}</tr></thead>
                <tbody>
                  {heatmapData.teams.map((team) => (
                    <tr key={team}>
                      <td className="p-2 font-medium text-sm">{team}</td>
                      {heatmapData.categories.map(cat => {
                        const score = heatmapData.cells[`${team}|${cat}`] || 0;
                        return (<td key={cat} className="p-1.5"><div className={`rounded-lg p-3 text-center font-bold ${getCellColor(score)}`} title={`${team} – ${categoryLabels[cat]}: ${score}/100`}>{score}</div></td>);
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (<p className="text-center text-muted-foreground py-8">{t("frictionMap.noDataAvailable")}</p>)}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground">{t("frictionMap.frictionLegend")}</span>
              {[{ label: t("frictionMap.frictionLow"), class: "bg-success/30" }, { label: t("frictionMap.frictionMed"), class: "bg-primary/40" }, { label: t("frictionMap.frictionHigh"), class: "bg-warning/50" }, { label: t("frictionMap.frictionCrit"), class: "bg-destructive/60" }].map(l => (<div key={l.label} className="flex items-center gap-1.5"><div className={`w-4 h-4 rounded ${l.class}`} /><span className="text-[10px] text-muted-foreground">{l.label}</span></div>))}
            </div>
          </div>
        </CollapsibleSection>
      )}
    </Wrap>
  );
};

export default FrictionMap;
