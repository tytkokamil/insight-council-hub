import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { AlertTriangle, User, Users, FolderOpen, Clock, TrendingDown, Zap, ArrowRight, CheckSquare, Shield, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews, useProfiles, useFilteredNotifications, buildProfileMap } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";

interface PersonBottleneck { userId: string; name: string; avgDays: number; openCount: number; blockingCount: number; openTasks: number; percentile: string; }
interface CategoryBottleneck { category: string; avgDays: number; globalAvg: number; ratio: number; count: number; taskCount: number; }
interface TeamFriction { teamId: string; teamName: string; avgDays: number; escalationCount: number; blockedCount: number; openTasks: number; score: number; }
interface SLAViolation { teamId: string; teamName: string; violationsThisWeek: number; topTeams: string[]; avgResponseDays: number; }

const categoryLabels: Record<string, string> = { strategic: "Strategisch", budget: "Budget", hr: "HR", technical: "Technisch", operational: "Operativ", marketing: "Marketing", general: "Allgemein" };

const BottleneckIntelligence = () => {
  const [personBottlenecks, setPersonBottlenecks] = useState<PersonBottleneck[]>([]);
  const [categoryBottlenecks, setCategoryBottlenecks] = useState<CategoryBottleneck[]>([]);
  const [teamFrictions, setTeamFrictions] = useState<TeamFriction[]>([]);
  const [slaViolations, setSLAViolations] = useState<{ total: number; thisWeek: number; topTeams: { name: string; count: number }[]; avgResponse: number }>({ total: 0, thisWeek: 0, topTeams: [], avgResponse: 0 });
  const [recommendations, setRecommendations] = useState<{ title: string; description: string; severity: string }[]>([]);

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: profiles = [], isLoading: profLoading } = useProfiles();
  const { data: notifications = [] } = useFilteredNotifications();

  const loading = decLoading || taskLoading || teamLoading || depLoading || revLoading || profLoading;

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
    tasks.forEach(t => {
      const pid = t.assignee_id || t.created_by;
      if (!pid) return;
      if (!personStats[pid]) personStats[pid] = { totalDays: 0, count: 0, openCount: 0, blockingCount: 0, openTasks: 0 };
      const days = t.completed_at ? (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 86400000 : (now - new Date(t.created_at).getTime()) / 86400000;
      personStats[pid].totalDays += days;
      personStats[pid].count++;
      if (t.status !== "done") personStats[pid].openTasks++;
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
      .map(([userId, s]) => ({ userId, name: nameMap[userId] || userId.slice(0, 8), avgDays: Math.round(s.totalDays / s.count), openCount: s.openCount, blockingCount: s.blockingCount, openTasks: s.openTasks, percentile: s.totalDays / s.count > globalPersonAvg * 1.5 ? "Langsam" : s.totalDays / s.count > globalPersonAvg ? "Durchschnitt" : "Schnell" }))
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
    tasks.forEach(t => {
      const cat = t.category || "general";
      if (!catStats[cat]) catStats[cat] = { totalDays: 0, decCount: 0, taskCount: 0 };
      const days = t.completed_at ? (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 86400000 : (now - new Date(t.created_at).getTime()) / 86400000;
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
    tasks.forEach(t => {
      if (!t.team_id) return;
      if (!teamStats[t.team_id]) teamStats[t.team_id] = { totalDays: 0, count: 0, escalations: 0, blocked: 0, openTasks: 0 };
      const days = t.completed_at ? (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 86400000 : (now - new Date(t.created_at).getTime()) / 86400000;
      teamStats[t.team_id].totalDays += days;
      teamStats[t.team_id].count++;
      if (t.status !== "done") teamStats[t.team_id].openTasks++;
    });
    const teamResults: TeamFriction[] = Object.entries(teamStats)
      .map(([teamId, s]) => { const avgDays = s.totalDays / s.count; const score = Math.round((s.escalations * 15) + (s.blocked * 20) + (s.openTasks * 5) + (avgDays > globalCatAvg ? (avgDays - globalCatAvg) * 3 : 0)); return { teamId, teamName: teamMap[teamId] || "Unbekannt", avgDays: Math.round(avgDays), escalationCount: s.escalations, blockedCount: s.blocked, openTasks: s.openTasks, score }; })
      .sort((a, b) => b.score - a.score);
    setTeamFrictions(teamResults);

    // ── SLA Violations ──
    const escalationNotifs = notifications.filter(n => n.type === "escalation");
    const thisWeekEsc = escalationNotifs.filter(n => new Date(n.created_at).getTime() > oneWeekAgo);
    const teamViolationCounts: Record<string, number> = {};
    decisions.filter(d => (d.escalation_level ?? 0) > 0).forEach(d => {
      if (d.team_id) teamViolationCounts[teamMap[d.team_id] || "Unbekannt"] = (teamViolationCounts[teamMap[d.team_id] || "Unbekannt"] || 0) + 1;
    });
    const topTeams = Object.entries(teamViolationCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    const reviewTimes = reviews.filter(r => r.reviewed_at).map(r => (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000);
    const avgResponse = reviewTimes.length > 0 ? Math.round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length * 10) / 10 : 0;
    setSLAViolations({ total: decisions.filter(d => (d.escalation_level ?? 0) > 0).length, thisWeek: thisWeekEsc.length, topTeams, avgResponse });

    // ── Recommendations ──
    const recs: { title: string; description: string; severity: string }[] = [];
    const slowPersons = persons.filter(p => p.percentile === "Langsam");
    if (slowPersons.length > 0) recs.push({ title: "Langsame Entscheider coachen", description: `${slowPersons.length} Personen liegen >50% über dem Durchschnitt. Prozessoptimierung oder Delegation empfohlen.`, severity: "high" });
    const slowCats = cats.filter(c => c.ratio > 1.5);
    if (slowCats.length > 0) recs.push({ title: "Kategorie-spezifische Prozesse optimieren", description: `${slowCats.map(c => categoryLabels[c.category] || c.category).join(", ")} sind überdurchschnittlich langsam.`, severity: "medium" });
    const highFrictionTeams = teamResults.filter(t => t.score > 50);
    if (highFrictionTeams.length > 0) recs.push({ title: "Team-Reibung reduzieren", description: `${highFrictionTeams.map(t => t.teamName).join(", ")} haben hohe Friction Scores. Eskalations- und Blockadenprozesse prüfen.`, severity: "high" });
    if (recs.length === 0) recs.push({ title: "Keine kritischen Engpässe", description: "Die Organisation zeigt gesunde Entscheidungsgeschwindigkeiten.", severity: "low" });
    setRecommendations(recs.slice(0, 3));
  }, [loading, decisions, tasks, teams, deps, reviews, profiles, notifications]);

  const percentileColor = (p: string) => p === "Langsam" ? "text-destructive bg-destructive/10" : p === "Durchschnitt" ? "text-warning bg-warning/10" : "text-success bg-success/10";
  const ratioBar = (ratio: number) => {
    const w = Math.min(ratio * 50, 100);
    const color = ratio > 2 ? "bg-destructive" : ratio > 1.3 ? "bg-warning" : "bg-success";
    return (<div className="flex items-center gap-2 flex-1"><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} /></div><span className={`text-xs font-bold ${ratio > 2 ? "text-destructive" : ratio > 1.3 ? "text-warning" : "text-success"}`}>{ratio}x</span></div>);
  };

  if (loading) return <AnalysisPageSkeleton cards={3} sections={3} />;

  if (personBottlenecks.length === 0 && categoryBottlenecks.length === 0 && teamFrictions.length === 0) {
    return (
      <AppLayout>
        <div className="mb-6"><p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Process Intelligence</p><h1 className="text-xl font-semibold tracking-tight">Process Intelligence</h1></div>
        <EmptyAnalysisState icon={Zap} title="Keine Engpässe erkannt" description="Erstelle Entscheidungen und Aufgaben, um strukturelle Bottlenecks zu identifizieren." hint="Engpässe werden automatisch erkannt" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Process Intelligence</p>
          <h1 className="text-xl font-semibold tracking-tight">Process Intelligence</h1>
        </div>
        <PageHelpButton title="Process Intelligence" description="Identifiziert strukturelle Probleme: Engpässe bei Personen und Kategorien, Team-Reibung, SLA-Verletzungen und liefert Top-3-Maßnahmen." />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-destructive mb-1"><User className="w-4 h-4" /><span className="text-2xl font-bold tabular-nums">{personBottlenecks.filter(p => p.percentile === "Langsam").length}</span></div><p className="text-xs text-muted-foreground">Personen strukturell langsam</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-warning mb-1"><FolderOpen className="w-4 h-4" /><span className="text-2xl font-bold tabular-nums">{categoryBottlenecks.filter(c => c.ratio > 1.5).length}</span></div><p className="text-xs text-muted-foreground">Kategorien überdurchschnittlich</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-foreground mb-1"><Users className="w-4 h-4" /><span className="text-2xl font-bold tabular-nums">{teamFrictions.filter(t => t.score > 30).length}</span></div><p className="text-xs text-muted-foreground">Teams mit hoher Reibung</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-destructive mb-1"><Shield className="w-4 h-4" /><span className="text-2xl font-bold tabular-nums">{slaViolations.thisWeek}</span></div><p className="text-xs text-muted-foreground">SLA-Verletzungen diese Woche</p></CardContent></Card>
      </div>

      {/* Bottleneck Detection – Person */}
      <CollapsibleSection title="Bottleneck Detection" subtitle="Wer verlangsamt Entscheidungen strukturell?" icon={<User className="w-4 h-4 text-destructive" />} defaultOpen={true} className="mb-6">
        <Card><CardContent className="p-5">
          {personBottlenecks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keine signifikanten Engpässe ✓</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-3 text-muted-foreground font-medium">Person</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">Offene Reviews</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">Avg Delay</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">Blockiert</th><th className="text-center py-2 px-3 text-muted-foreground font-medium">Status</th></tr></thead>
                <tbody>
                  {personBottlenecks.map(p => (
                    <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-2.5 px-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-medium">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div><span className="font-medium">{p.name}</span></div></td>
                      <td className="text-center py-2.5 px-3">{p.openCount}</td>
                      <td className="text-center py-2.5 px-3">{p.avgDays}d</td>
                      <td className="text-center py-2.5 px-3">{p.blockingCount}</td>
                      <td className="text-center py-2.5 px-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${percentileColor(p.percentile)}`}>{p.percentile}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent></Card>
      </CollapsibleSection>

      {/* Friction Map – Cluster */}
      <CollapsibleSection title="Friction Map" subtitle="Stakeholder-Konflikte, Rework, Ablehnungen" icon={<FolderOpen className="w-4 h-4 text-warning" />} defaultOpen={false} className="mb-6">
        <Card><CardContent className="p-5">
          <div className="space-y-3">
            {categoryBottlenecks.map(c => (
              <div key={c.category} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                <span className="text-sm font-medium w-24 shrink-0">{categoryLabels[c.category] || c.category}</span>
                {ratioBar(c.ratio)}
                <div className="text-right shrink-0 w-36">
                  <p className="text-xs font-medium">⌀ {c.avgDays} Tage</p>
                  <p className="text-[10px] text-muted-foreground">{c.count} Entsch. • {c.taskCount} Aufg.</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </CollapsibleSection>

      {/* SLA Violations */}
      <CollapsibleSection title="SLA Violations" subtitle={`${slaViolations.total} gesamt, ${slaViolations.thisWeek} diese Woche`} icon={<Shield className="w-4 h-4 text-destructive" />} defaultOpen={slaViolations.thisWeek > 0} className="mb-6">
        <Card><CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground mb-1">Verletzungen diese Woche</p>
              <p className="text-2xl font-bold text-destructive">{slaViolations.thisWeek}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Top Teams</p>
              {slaViolations.topTeams.length > 0 ? (
                <div className="space-y-1">{slaViolations.topTeams.map(t => <p key={t.name} className="text-sm"><span className="font-medium">{t.name}</span> <span className="text-muted-foreground">({t.count})</span></p>)}</div>
              ) : <p className="text-sm text-muted-foreground">Keine SLA-Verletzungen</p>}
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Ø Reaktionszeit</p>
              <p className="text-2xl font-bold">{slaViolations.avgResponse}d</p>
            </div>
          </div>
        </CardContent></Card>
      </CollapsibleSection>

      {/* Team Friction */}
      <CollapsibleSection title="Team-Reibung" subtitle="Organisatorische Blockaden (inkl. Aufgaben)" icon={<Users className="w-4 h-4 text-muted-foreground" />} defaultOpen={false} className="mb-6">
        <Card><CardContent className="p-5">
          {teamFrictions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keine Teams mit Daten</p>
          ) : (
            <div className="space-y-2">
              {teamFrictions.map(t => (
                <div key={t.teamId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.teamName}</p>
                    <p className="text-[10px] text-muted-foreground">⌀ {t.avgDays}d • {t.escalationCount} Eskal. • {t.blockedCount} Blockaden • {t.openTasks} Aufg.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${t.score > 50 ? "text-destructive" : t.score > 20 ? "text-warning" : "text-success"}`}>{t.score}</p>
                    <p className="text-[10px] text-muted-foreground">Friction</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </CollapsibleSection>

      {/* Recommendations Panel */}
      <CollapsibleSection title="Top 3 Maßnahmen" subtitle="Priorisierte Empfehlungen" icon={<Lightbulb className="w-4 h-4 text-muted-foreground" />} defaultOpen={true}>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <Card key={i} className={rec.severity === "high" ? "border-destructive/30" : rec.severity === "medium" ? "border-warning/30" : ""}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rec.severity === "high" ? "bg-destructive/15 text-destructive" : rec.severity === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                  <span className="text-sm font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{rec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>
    </AppLayout>
  );
};

export default BottleneckIntelligence;
