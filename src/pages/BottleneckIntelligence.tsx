import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { AlertTriangle, User, Users, FolderOpen, Clock, TrendingDown, Zap, ArrowRight, CheckSquare, Shield, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews, useProfiles, useFilteredNotifications, buildProfileMap } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import AiInsightPanel from "@/components/shared/AiInsightPanel";

interface PersonBottleneck { userId: string; name: string; avgDays: number; openCount: number; blockingCount: number; openTasks: number; percentile: string; }
interface CategoryBottleneck { category: string; avgDays: number; globalAvg: number; ratio: number; count: number; taskCount: number; }
interface TeamFriction { teamId: string; teamName: string; avgDays: number; escalationCount: number; blockedCount: number; openTasks: number; score: number; }

const BottleneckIntelligence = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [personBottlenecks, setPersonBottlenecks] = useState<PersonBottleneck[]>([]);
  const [categoryBottlenecks, setCategoryBottlenecks] = useState<CategoryBottleneck[]>([]);
  const [teamFrictions, setTeamFrictions] = useState<TeamFriction[]>([]);
  const [slaViolations, setSLAViolations] = useState<{ total: number; thisWeek: number; topTeams: { name: string; count: number }[]; avgResponse: number }>({ total: 0, thisWeek: 0, topTeams: [], avgResponse: 0 });
  const [recommendations, setRecommendations] = useState<{ title: string; description: string; severity: string; route?: string }[]>([]);

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: profiles = [], isLoading: profLoading } = useProfiles();
  const { data: notifications = [] } = useFilteredNotifications();

  const loading = decLoading || taskLoading || teamLoading || depLoading || revLoading || profLoading;

  const categoryLabels: Record<string, string> = {
    strategic: t("bottleneck.catStrategic"), budget: t("bottleneck.catBudget"), hr: t("bottleneck.catHr"),
    technical: t("bottleneck.catTechnical"), operational: t("bottleneck.catOperational"),
    marketing: t("bottleneck.catMarketing"), general: t("bottleneck.catGeneral"),
  };

  useEffect(() => {
    if (loading) return;
    const nameMap = buildProfileMap(profiles);
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));
    const now = Date.now();
    const oneWeekAgo = now - 7 * 86400000;

    // ── Person stats ──
    const personStats: Record<string, { totalDays: number; count: number; openCount: number; blockingCount: number; openTasks: number }> = {};
    decisions.forEach(d => {
      const pid = d.assignee_id || d.created_by;
      if (!pid) return;
      if (!personStats[pid]) personStats[pid] = { totalDays: 0, count: 0, openCount: 0, blockingCount: 0, openTasks: 0 };
      const days = d.implemented_at ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000 : (now - new Date(d.created_at).getTime()) / 86400000;
      personStats[pid].totalDays += days;
      personStats[pid].count++;
      if (!["implemented", "rejected"].includes(d.status)) personStats[pid].openCount++;
    });
    tasks.forEach(tk => {
      const pid = tk.assignee_id || tk.created_by;
      if (!pid) return;
      if (!personStats[pid]) personStats[pid] = { totalDays: 0, count: 0, openCount: 0, blockingCount: 0, openTasks: 0 };
      const days = tk.completed_at ? (new Date(tk.completed_at).getTime() - new Date(tk.created_at).getTime()) / 86400000 : (now - new Date(tk.created_at).getTime()) / 86400000;
      personStats[pid].totalDays += days;
      personStats[pid].count++;
      if (tk.status !== "done") personStats[pid].openTasks++;
    });
    const blockedSourceIds = deps.filter(d => d.dependency_type === "blocks").map(d => d.source_decision_id).filter(Boolean);
    blockedSourceIds.forEach(sourceId => {
      const dec = decisions.find(d => d.id === sourceId);
      const pid = dec?.assignee_id || dec?.created_by;
      if (pid && personStats[pid]) personStats[pid].blockingCount++;
    });
    reviews.forEach(r => {
      if (!r.reviewed_at) {
        const waitDays = (now - new Date(r.created_at).getTime()) / 86400000;
        if (waitDays > 3) {
          if (!personStats[r.reviewer_id]) personStats[r.reviewer_id] = { totalDays: 0, count: 0, openCount: 0, blockingCount: 0, openTasks: 0 };
          personStats[r.reviewer_id].totalDays += waitDays;
          personStats[r.reviewer_id].count++;
          personStats[r.reviewer_id].blockingCount++;
        }
      }
    });
    const allAvgDays = Object.values(personStats).map(s => s.totalDays / s.count);
    const globalPersonAvg = allAvgDays.length > 0 ? allAvgDays.reduce((a, b) => a + b, 0) / allAvgDays.length : 7;
    const persons: PersonBottleneck[] = Object.entries(personStats)
      .map(([userId, s]) => ({ userId, name: nameMap[userId] || userId.slice(0, 8), avgDays: Math.round(s.totalDays / s.count), openCount: s.openCount, blockingCount: s.blockingCount, openTasks: s.openTasks, percentile: s.totalDays / s.count > globalPersonAvg * 1.5 ? "slow" : s.totalDays / s.count > globalPersonAvg ? "average" : "fast" }))
      .filter(p => p.avgDays > globalPersonAvg * 0.8)
      .sort((a, b) => b.avgDays - a.avgDays)
      .slice(0, 10);
    setPersonBottlenecks(persons);

    // ── Category stats ──
    const catStats: Record<string, { totalDays: number; decCount: number; taskCount: number }> = {};
    decisions.forEach(d => {
      if (!catStats[d.category]) catStats[d.category] = { totalDays: 0, decCount: 0, taskCount: 0 };
      const days = d.implemented_at ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000 : (now - new Date(d.created_at).getTime()) / 86400000;
      catStats[d.category].totalDays += days;
      catStats[d.category].decCount++;
    });
    tasks.forEach(tk => {
      const cat = tk.category || "general";
      if (!catStats[cat]) catStats[cat] = { totalDays: 0, decCount: 0, taskCount: 0 };
      const days = tk.completed_at ? (new Date(tk.completed_at).getTime() - new Date(tk.created_at).getTime()) / 86400000 : (now - new Date(tk.created_at).getTime()) / 86400000;
      catStats[cat].totalDays += days;
      catStats[cat].taskCount++;
    });
    const totalItems = Object.values(catStats).reduce((s, c) => s + c.decCount + c.taskCount, 0);
    const globalCatAvg = totalItems > 0 ? Object.values(catStats).reduce((s, c) => s + c.totalDays, 0) / totalItems : 7;
    const cats: CategoryBottleneck[] = Object.entries(catStats)
      .map(([category, s]) => { const count = s.decCount + s.taskCount; return { category, avgDays: Math.round(s.totalDays / count), globalAvg: Math.round(globalCatAvg), ratio: Math.round((s.totalDays / count / globalCatAvg) * 100) / 100, count: s.decCount, taskCount: s.taskCount }; })
      .sort((a, b) => b.ratio - a.ratio);
    setCategoryBottlenecks(cats);

    // ── Team friction ──
    const teamStats: Record<string, { totalDays: number; count: number; escalations: number; blocked: number; openTasks: number }> = {};
    const blockedTargets = new Set(deps.filter(d => d.dependency_type === "blocks").map(d => d.target_decision_id).filter(Boolean));
    decisions.forEach(d => {
      if (!d.team_id) return;
      if (!teamStats[d.team_id]) teamStats[d.team_id] = { totalDays: 0, count: 0, escalations: 0, blocked: 0, openTasks: 0 };
      const days = d.implemented_at ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000 : (now - new Date(d.created_at).getTime()) / 86400000;
      teamStats[d.team_id].totalDays += days;
      teamStats[d.team_id].count++;
      if (d.escalation_level && d.escalation_level > 0) teamStats[d.team_id].escalations++;
      if (blockedTargets.has(d.id)) teamStats[d.team_id].blocked++;
    });
    tasks.forEach(tk => {
      if (!tk.team_id) return;
      if (!teamStats[tk.team_id]) teamStats[tk.team_id] = { totalDays: 0, count: 0, escalations: 0, blocked: 0, openTasks: 0 };
      const days = tk.completed_at ? (new Date(tk.completed_at).getTime() - new Date(tk.created_at).getTime()) / 86400000 : (now - new Date(tk.created_at).getTime()) / 86400000;
      teamStats[tk.team_id].totalDays += days;
      teamStats[tk.team_id].count++;
      if (tk.status !== "done") teamStats[tk.team_id].openTasks++;
    });
    const teamResults: TeamFriction[] = Object.entries(teamStats)
      .map(([teamId, s]) => { const avgDays = s.totalDays / s.count; const score = Math.round((s.escalations * 15) + (s.blocked * 20) + (s.openTasks * 5) + (avgDays > globalCatAvg ? (avgDays - globalCatAvg) * 3 : 0)); return { teamId, teamName: teamMap[teamId] || t("bottleneck.unknown"), avgDays: Math.round(avgDays), escalationCount: s.escalations, blockedCount: s.blocked, openTasks: s.openTasks, score }; })
      .sort((a, b) => b.score - a.score);
    setTeamFrictions(teamResults);

    // ── SLA Violations ──
    const escalationNotifs = notifications.filter(n => n.type === "escalation");
    const thisWeekEsc = escalationNotifs.filter(n => new Date(n.created_at).getTime() > oneWeekAgo);
    const teamViolationCounts: Record<string, number> = {};
    decisions.filter(d => (d.escalation_level ?? 0) > 0).forEach(d => {
      if (d.team_id) teamViolationCounts[teamMap[d.team_id] || t("bottleneck.unknown")] = (teamViolationCounts[teamMap[d.team_id] || t("bottleneck.unknown")] || 0) + 1;
    });
    const topTeams = Object.entries(teamViolationCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    const reviewTimes = reviews.filter(r => r.reviewed_at).map(r => (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000);
    const avgResponse = reviewTimes.length > 0 ? Math.round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length * 10) / 10 : 0;
    setSLAViolations({ total: decisions.filter(d => (d.escalation_level ?? 0) > 0).length, thisWeek: thisWeekEsc.length, topTeams, avgResponse });

    // ── Recommendations ──
    const recs: { title: string; description: string; severity: string; route?: string }[] = [];
    const slowPersons = persons.filter(p => p.percentile === "slow");
    if (slowPersons.length > 0) recs.push({ title: t("bottleneck.recCoachSlow"), description: t("bottleneck.recCoachSlowDesc", { count: slowPersons.length }), severity: "high", route: "/settings" });
    const slowCats = cats.filter(c => c.ratio > 1.5);
    if (slowCats.length > 0) recs.push({ title: t("bottleneck.recOptimizeCat"), description: t("bottleneck.recOptimizeCatDesc", { cats: slowCats.map(c => categoryLabels[c.category] || c.category).join(", ") }), severity: "medium", route: "/templates" });
    const highFrictionTeams = teamResults.filter(tr => tr.score > 50);
    if (highFrictionTeams.length > 0) recs.push({ title: t("bottleneck.recReduceFriction"), description: t("bottleneck.recReduceFrictionDesc", { teams: highFrictionTeams.map(tr => tr.teamName).join(", ") }), severity: "high", route: "/friction-map" });
    if (recs.length === 0) recs.push({ title: t("bottleneck.recNoCritical"), description: t("bottleneck.recNoCriticalDesc"), severity: "low" });
    setRecommendations(recs.slice(0, 3));
  }, [loading, decisions, tasks, teams, deps, reviews, profiles, notifications]);

  const percentileLabel = (p: string) => p === "slow" ? t("bottleneck.percentileSlow") : p === "average" ? t("bottleneck.percentileAvg") : t("bottleneck.percentileFast");
  const percentileColor = (p: string) => p === "slow" ? "text-destructive bg-destructive/10" : p === "average" ? "text-warning bg-warning/10" : "text-success bg-success/10";
  const ratioBar = (ratio: number) => {
    const w = Math.min(ratio * 50, 100);
    const color = ratio > 2 ? "bg-destructive" : ratio > 1.3 ? "bg-warning" : "bg-success";
    return (<div className="flex items-center gap-2 flex-1"><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} /></div><span className={`text-xs font-bold ${ratio > 2 ? "text-destructive" : ratio > 1.3 ? "text-warning" : "text-success"}`}>{ratio}x</span></div>);
  };

  if (loading) return <AnalysisPageSkeleton cards={3} sections={3} />;

  if (personBottlenecks.length === 0 && categoryBottlenecks.length === 0 && teamFrictions.length === 0) {
    const empty = (
      <>
        <div className="mb-6"><p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("bottleneck.label")}</p><h1 className="text-xl font-semibold tracking-tight">{t("bottleneck.title")}</h1></div>
        <EmptyAnalysisState icon={Zap} title={t("bottleneck.noBottlenecks")} description={t("bottleneck.noBottlenecksDesc")} hint={t("bottleneck.noBottlenecksHint")} />
      </>
    );
    return embedded ? empty : <AppLayout>{empty}</AppLayout>;
  }

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("bottleneck.label")}</p>
          <h1 className="text-xl font-semibold tracking-tight">{t("bottleneck.title")}</h1>
        </div>
        <PageHelpButton title={t("bottleneck.title")} description={t("bottleneck.help")} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-destructive mb-1"><User className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{personBottlenecks.filter(p => p.percentile === "slow").length}</span></div><p className="text-xs text-muted-foreground">{t("bottleneck.personsSlowCount")}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-warning mb-1"><FolderOpen className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{categoryBottlenecks.filter(c => c.ratio > 1.5).length}</span></div><p className="text-xs text-muted-foreground">{t("bottleneck.categoriesAbove")}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-foreground mb-1"><Users className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{teamFrictions.filter(tf => tf.score > 30).length}</span></div><p className="text-xs text-muted-foreground">{t("bottleneck.teamsHighFriction")}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-destructive mb-1"><Shield className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{slaViolations.thisWeek}</span></div><p className="text-xs text-muted-foreground">{t("bottleneck.slaViolationsWeek")}</p></CardContent></Card>
      </div>

      {/* Bottleneck Detection – Person */}
      <CollapsibleSection title={t("bottleneck.bottleneckDetection")} subtitle={t("bottleneck.bottleneckDetectionSub")} icon={<User className="w-4 h-4 text-destructive" />} defaultOpen={true} className="mb-6">
        <Card><CardContent className="p-5">
          {personBottlenecks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("bottleneck.noSignificant")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("bottleneck.colPerson")}</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("bottleneck.colOpenReviews")}</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("bottleneck.colAvgDelay")}</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("bottleneck.colBlocking")}</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("bottleneck.colStatus")}</th></tr></thead>
                <tbody>
                  {personBottlenecks.map(p => (
                    <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-2.5 px-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-medium">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div><span className="font-medium">{p.name}</span></div></td>
                      <td className="text-center py-2.5 px-3">{p.openCount}</td>
                      <td className="text-center py-2.5 px-3">{p.avgDays}d</td>
                      <td className="text-center py-2.5 px-3">{p.blockingCount}</td>
                      <td className="text-center py-2.5 px-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${percentileColor(p.percentile)}`}>{percentileLabel(p.percentile)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent></Card>
      </CollapsibleSection>

      {/* Friction Map – Cluster */}
      <CollapsibleSection title={t("bottleneck.frictionMap")} subtitle={t("bottleneck.frictionMapSub")} icon={<FolderOpen className="w-4 h-4 text-warning" />} defaultOpen={false} className="mb-6">
        <Card><CardContent className="p-5">
          <div className="space-y-3">
            {categoryBottlenecks.map(c => (
              <div key={c.category} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                <span className="text-sm font-medium w-24 shrink-0">{categoryLabels[c.category] || c.category}</span>
                {ratioBar(c.ratio)}
                <div className="text-right shrink-0 w-36">
                  <p className="text-xs font-medium">{t("bottleneck.avgDays", { days: c.avgDays })}</p>
                  <p className="text-[10px] text-muted-foreground">{t("bottleneck.decCount", { count: c.count })} • {t("bottleneck.taskCount", { count: c.taskCount })}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </CollapsibleSection>

      {/* SLA Violations */}
      <CollapsibleSection title={t("bottleneck.slaViolations")} subtitle={t("bottleneck.slaViolationsSub", { total: slaViolations.total, week: slaViolations.thisWeek })} icon={<Shield className="w-4 h-4 text-destructive" />} defaultOpen={slaViolations.thisWeek > 0} className="mb-6">
        <Card><CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground mb-1">{t("bottleneck.violationsThisWeek")}</p>
              <p className="text-2xl font-bold text-destructive">{slaViolations.thisWeek}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t("bottleneck.topTeams")}</p>
              {slaViolations.topTeams.length > 0 ? (
                <div className="space-y-1">{slaViolations.topTeams.map(tt => <p key={tt.name} className="text-sm"><span className="font-medium">{tt.name}</span> <span className="text-muted-foreground">({tt.count})</span></p>)}</div>
              ) : <p className="text-sm text-muted-foreground">{t("bottleneck.noSlaViolations")}</p>}
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t("bottleneck.avgResponseTime")}</p>
              <p className="text-2xl font-bold">{slaViolations.avgResponse}d</p>
            </div>
          </div>
        </CardContent></Card>
      </CollapsibleSection>

      {/* Team Friction */}
      <CollapsibleSection title={t("bottleneck.teamFriction")} subtitle={t("bottleneck.teamFrictionSub")} icon={<Users className="w-4 h-4 text-muted-foreground" />} defaultOpen={false} className="mb-6">
        <Card><CardContent className="p-5">
          {teamFrictions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("bottleneck.noTeamsData")}</p>
          ) : (
            <div className="space-y-2">
              {teamFrictions.map(tf => (
                <div key={tf.teamId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tf.teamName}</p>
                    <p className="text-[10px] text-muted-foreground">⌀ {tf.avgDays}d • {tf.escalationCount} {t("bottleneck.escalAbbr")} • {tf.blockedCount} {t("bottleneck.blockades")} • {tf.openTasks} {t("bottleneck.tasks")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tf.score > 50 ? "text-destructive" : tf.score > 20 ? "text-warning" : "text-success"}`}>{tf.score}</p>
                    <p className="text-[10px] text-muted-foreground">{t("bottleneck.friction")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </CollapsibleSection>

      {/* AI Deep Analysis */}
      <AiInsightPanel
        type="bottleneck"
        context={{
          personBottlenecks: personBottlenecks.slice(0, 5).map(p => ({ name: p.name, avgDays: p.avgDays, openCount: p.openCount, blockingCount: p.blockingCount, percentile: p.percentile })),
          categoryBottlenecks: categoryBottlenecks.map(c => ({ category: c.category, avgDays: c.avgDays, ratio: c.ratio, count: c.count })),
          teamFrictions: teamFrictions.slice(0, 5).map(tf => ({ teamName: tf.teamName, score: tf.score, escalationCount: tf.escalationCount, blockedCount: tf.blockedCount })),
          slaViolations: { total: slaViolations.total, thisWeek: slaViolations.thisWeek, avgResponse: slaViolations.avgResponse },
        }}
        className="mb-6"
      />

      {/* Recommendations Panel */}
      <CollapsibleSection title={t("bottleneck.top3Actions")} subtitle={t("bottleneck.top3ActionsSub")} icon={<Lightbulb className="w-4 h-4 text-muted-foreground" />} defaultOpen={true}>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <Card
              key={i}
              className={`${rec.route ? "cursor-pointer hover:border-foreground/20" : ""} transition-colors ${rec.severity === "high" ? "border-destructive/30" : rec.severity === "medium" ? "border-warning/30" : ""}`}
              onClick={() => rec.route && navigate(rec.route)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rec.severity === "high" ? "bg-destructive/15 text-destructive" : rec.severity === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                  <span className="text-sm font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{rec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                </div>
                {rec.route && (
                  <span className="text-[10px] text-primary flex items-center gap-1 shrink-0 mt-1">
                    <ArrowRight className="w-3 h-3" /> {t("bottleneck.openAction")}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>
    </Wrap>
  );
};

export default BottleneckIntelligence;
