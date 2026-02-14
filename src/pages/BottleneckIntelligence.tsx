import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { AlertTriangle, User, Users, FolderOpen, Clock, TrendingDown, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews, useProfiles, useFilteredNotifications, buildProfileMap } from "@/hooks/useDecisions";

interface PersonBottleneck {
  userId: string;
  name: string;
  avgDays: number;
  openCount: number;
  blockingCount: number;
  percentile: string;
}

interface CategoryBottleneck {
  category: string;
  avgDays: number;
  globalAvg: number;
  ratio: number;
  count: number;
}

interface TeamFriction {
  teamId: string;
  teamName: string;
  avgDays: number;
  escalationCount: number;
  blockedCount: number;
  score: number;
}

const BottleneckIntelligence = () => {
  const [personBottlenecks, setPersonBottlenecks] = useState<PersonBottleneck[]>([]);
  const [categoryBottlenecks, setCategoryBottlenecks] = useState<CategoryBottleneck[]>([]);
  const [teamFrictions, setTeamFrictions] = useState<TeamFriction[]>([]);

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: profiles = [], isLoading: profLoading } = useProfiles();
  const { data: notifications = [] } = useFilteredNotifications();

  const loading = decLoading || teamLoading || depLoading || revLoading || profLoading;

  useEffect(() => {
    if (loading) return;

    const nameMap = buildProfileMap(profiles);
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));
    const now = Date.now();
    const escalations = notifications.filter(n => n.type === "escalation");

      // ── PERSON BOTTLENECKS ──
      const personStats: Record<string, { totalDays: number; count: number; openCount: number; blockingCount: number }> = {};

      decisions.forEach(d => {
        const pid = d.assignee_id || d.created_by;
        if (!pid) return;
        if (!personStats[pid]) personStats[pid] = { totalDays: 0, count: 0, openCount: 0, blockingCount: 0 };
        const days = d.implemented_at
          ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000
          : (now - new Date(d.created_at).getTime()) / 86400000;
        personStats[pid].totalDays += days;
        personStats[pid].count++;
        if (!["implemented", "rejected"].includes(d.status)) personStats[pid].openCount++;
      });

      const blockedSourceIds = deps.filter(d => d.dependency_type === "blocks").map(d => d.source_decision_id);
      blockedSourceIds.forEach(sourceId => {
        const dec = decisions.find(d => d.id === sourceId);
        const pid = dec?.assignee_id || dec?.created_by;
        if (pid && personStats[pid]) personStats[pid].blockingCount++;
      });

      reviews.forEach(r => {
        if (!r.reviewed_at) {
          const waitDays = (now - new Date(r.created_at).getTime()) / 86400000;
          if (waitDays > 3) {
            if (!personStats[r.reviewer_id]) personStats[r.reviewer_id] = { totalDays: 0, count: 0, openCount: 0, blockingCount: 0 };
            personStats[r.reviewer_id].totalDays += waitDays;
            personStats[r.reviewer_id].count++;
            personStats[r.reviewer_id].blockingCount++;
          }
        }
      });

      const allAvgDays = Object.values(personStats).map(s => s.totalDays / s.count);
      const globalPersonAvg = allAvgDays.length > 0 ? allAvgDays.reduce((a, b) => a + b, 0) / allAvgDays.length : 7;

      const persons: PersonBottleneck[] = Object.entries(personStats)
        .map(([userId, s]) => ({
          userId,
          name: nameMap[userId] || userId.slice(0, 8),
          avgDays: Math.round(s.totalDays / s.count),
          openCount: s.openCount,
          blockingCount: s.blockingCount,
          percentile: s.totalDays / s.count > globalPersonAvg * 1.5 ? "Langsam" : s.totalDays / s.count > globalPersonAvg ? "Durchschnitt" : "Schnell",
        }))
        .filter(p => p.avgDays > globalPersonAvg * 0.8)
        .sort((a, b) => b.avgDays - a.avgDays)
        .slice(0, 10);

      setPersonBottlenecks(persons);

      const catStats: Record<string, { totalDays: number; count: number }> = {};
      decisions.forEach(d => {
        if (!catStats[d.category]) catStats[d.category] = { totalDays: 0, count: 0 };
        const days = d.implemented_at
          ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000
          : (now - new Date(d.created_at).getTime()) / 86400000;
        catStats[d.category].totalDays += days;
        catStats[d.category].count++;
      });

      const globalCatAvg = decisions.length > 0
        ? Object.values(catStats).reduce((s, c) => s + c.totalDays, 0) / decisions.length
        : 7;

      const cats: CategoryBottleneck[] = Object.entries(catStats)
        .map(([category, s]) => ({
          category,
          avgDays: Math.round(s.totalDays / s.count),
          globalAvg: Math.round(globalCatAvg),
          ratio: Math.round((s.totalDays / s.count / globalCatAvg) * 100) / 100,
          count: s.count,
        }))
        .sort((a, b) => b.ratio - a.ratio);

      setCategoryBottlenecks(cats);

      const teamStats: Record<string, { totalDays: number; count: number; escalations: number; blocked: number }> = {};
      const blockedTargets = new Set(deps.filter(d => d.dependency_type === "blocks").map(d => d.target_decision_id));

      decisions.forEach(d => {
        if (!d.team_id) return;
        if (!teamStats[d.team_id]) teamStats[d.team_id] = { totalDays: 0, count: 0, escalations: 0, blocked: 0 };
        const days = d.implemented_at
          ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000
          : (now - new Date(d.created_at).getTime()) / 86400000;
        teamStats[d.team_id].totalDays += days;
        teamStats[d.team_id].count++;
        if (d.escalation_level && d.escalation_level > 0) teamStats[d.team_id].escalations++;
        if (blockedTargets.has(d.id)) teamStats[d.team_id].blocked++;
      });

      const teamResults: TeamFriction[] = Object.entries(teamStats)
        .map(([teamId, s]) => {
          const avgDays = s.totalDays / s.count;
          const score = Math.round(
            (s.escalations * 15) + (s.blocked * 20) + (avgDays > globalCatAvg ? (avgDays - globalCatAvg) * 3 : 0)
          );
          return {
            teamId,
            teamName: teamMap[teamId] || "Unbekannt",
            avgDays: Math.round(avgDays),
            escalationCount: s.escalations,
            blockedCount: s.blocked,
            score,
          };
        })
        .sort((a, b) => b.score - a.score);

    setTeamFrictions(teamResults);
  }, [loading, decisions, teams, deps, reviews, profiles, notifications]);

  const percentileColor = (p: string) =>
    p === "Langsam" ? "text-destructive bg-destructive/10" : p === "Durchschnitt" ? "text-warning bg-warning/10" : "text-success bg-success/10";

  const ratioBar = (ratio: number) => {
    const w = Math.min(ratio * 50, 100);
    const color = ratio > 2 ? "bg-destructive" : ratio > 1.3 ? "bg-warning" : "bg-success";
    return (
      <div className="flex items-center gap-2 flex-1">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
        </div>
        <span className={`text-xs font-bold ${ratio > 2 ? "text-destructive" : ratio > 1.3 ? "text-warning" : "text-success"}`}>
          {ratio}x
        </span>
      </div>
    );
  };

  if (loading) return <AnalysisPageSkeleton cards={3} sections={3} />;

  if (personBottlenecks.length === 0 && categoryBottlenecks.length === 0 && teamFrictions.length === 0) {
    return (
      <AppLayout>
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Engpass-Erkennung</p>
          <h1 className="font-display text-xl font-bold">Bottleneck Intelligence</h1>
        </div>
        <EmptyAnalysisState
          icon={Zap}
          title="Keine Engpässe erkannt"
          description="Erstelle Entscheidungen und weise sie Teams zu, um strukturelle Bottlenecks zu identifizieren."
          hint="Engpässe werden automatisch erkannt, sobald genug Daten vorhanden sind"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Engpass-Erkennung</p>
        <h1 className="font-display text-xl font-bold">Bottleneck Intelligence</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <User className="w-4 h-4" />
                <span className="text-2xl font-bold font-display">{personBottlenecks.filter(p => p.percentile === "Langsam").length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Personen strukturell langsam</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-warning mb-1">
                <FolderOpen className="w-4 h-4" />
                <span className="text-2xl font-bold font-display">{categoryBottlenecks.filter(c => c.ratio > 1.5).length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Kategorien überdurchschnittlich langsam</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Users className="w-4 h-4" />
                <span className="text-2xl font-bold font-display">{teamFrictions.filter(t => t.score > 30).length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Teams mit hoher Reibung</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Person Bottlenecks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-destructive" />
              <h2 className="font-display font-semibold">Personen-Engpässe</h2>
              <span className="text-xs text-muted-foreground ml-auto">Wer verlangsamt Entscheidungen strukturell?</span>
            </div>
            {personBottlenecks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine signifikanten Engpässe erkannt ✓</p>
            ) : (
              <div className="space-y-2">
                {personBottlenecks.map((p, i) => (
                  <motion.div
                    key={p.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-xs font-medium shrink-0">
                      {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ⌀ {p.avgDays} Tage • {p.openCount} offen • {p.blockingCount} Blockaden
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${percentileColor(p.percentile)}`}>
                      {p.percentile}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Bottlenecks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-warning" />
              <h2 className="font-display font-semibold">Kategorien-Analyse</h2>
              <span className="text-xs text-muted-foreground ml-auto">Welche Entscheidungstypen dauern unverhältnismäßig lang?</span>
            </div>
            <div className="space-y-3">
              {categoryBottlenecks.map((c, i) => (
                <motion.div
                  key={c.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/10"
                >
                  <span className="text-sm font-medium capitalize w-24 shrink-0">{c.category}</span>
                  {ratioBar(c.ratio)}
                  <div className="text-right shrink-0 w-28">
                    <p className="text-xs font-medium">⌀ {c.avgDays} Tage</p>
                    <p className="text-[10px] text-muted-foreground">Ø Global: {c.globalAvg}d • {c.count} Entsch.</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Friction */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Team-Reibung</h2>
              <span className="text-xs text-muted-foreground ml-auto">Wo entstehen organisatorische Blockaden?</span>
            </div>
            {teamFrictions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine Teams mit Entscheidungen vorhanden</p>
            ) : (
              <div className="space-y-2">
                {teamFrictions.map((t, i) => (
                  <motion.div
                    key={t.teamId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.teamName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ⌀ {t.avgDays} Tage • {t.escalationCount} Eskalationen • {t.blockedCount} Blockaden
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${t.score > 50 ? "text-destructive" : t.score > 20 ? "text-warning" : "text-success"}`}>
                        {t.score}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Friction Score</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default BottleneckIntelligence;
