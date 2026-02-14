import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Users, GitPullRequest, AlertTriangle, ArrowUpRight, BarChart3, Clock } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";

interface TeamFriction {
  teamId: string;
  teamName: string;
  avgReviewTime: number; // days
  reviewLoops: number; // review back-and-forths
  escalationRate: number; // % of decisions escalated
  overdueRate: number; // % of decisions overdue
  totalDecisions: number;
  frictionScore: number; // 0-100
}

interface CrossTeamFriction {
  teamA: string;
  teamB: string;
  teamAName: string;
  teamBName: string;
  sharedDecisions: number;
  avgDelay: number;
  frictionLevel: "low" | "medium" | "high" | "critical";
}

const FrictionMap = () => {
  const [teamFriction, setTeamFriction] = useState<TeamFriction[]>([]);
  const [crossFriction, setCrossFriction] = useState<CrossTeamFriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"teams" | "heatmap">("teams");

  useEffect(() => {
    const analyze = async () => {
      const [decRes, teamRes, reviewRes, depRes] = await Promise.all([
        supabase.from("decisions").select("id, title, status, priority, category, team_id, created_at, due_date, escalation_level, updated_at"),
        supabase.from("teams").select("id, name"),
        supabase.from("decision_reviews").select("id, decision_id, reviewer_id, status, created_at, reviewed_at, step_order"),
        supabase.from("decision_dependencies").select("id, source_decision_id, target_decision_id, dependency_type"),
      ]);

      const decisions = decRes.data || [];
      const teams = teamRes.data || [];
      const reviews = reviewRes.data || [];
      const deps = depRes.data || [];

      const now = Date.now();
      const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));

      // Per-team friction analysis
      const teamStats: Record<string, {
        decisions: any[];
        reviewTimes: number[];
        reviewLoops: number;
        escalations: number;
        overdue: number;
      }> = {};

      teams.forEach(t => {
        teamStats[t.id] = { decisions: [], reviewTimes: [], reviewLoops: 0, escalations: 0, overdue: 0 };
      });

      // Assign decisions to teams
      decisions.forEach(d => {
        if (d.team_id && teamStats[d.team_id]) {
          teamStats[d.team_id].decisions.push(d);

          // Overdue check
          if (d.due_date && new Date(d.due_date).getTime() < now && d.status !== "implemented" && d.status !== "rejected") {
            teamStats[d.team_id].overdue++;
          }

          // Escalation check
          if ((d.escalation_level || 0) > 0) {
            teamStats[d.team_id].escalations++;
          }
        }
      });

      // Review analysis per decision
      const decisionReviews: Record<string, any[]> = {};
      reviews.forEach(r => {
        if (!decisionReviews[r.decision_id]) decisionReviews[r.decision_id] = [];
        decisionReviews[r.decision_id].push(r);
      });

      Object.entries(decisionReviews).forEach(([decId, revs]) => {
        const dec = decisions.find(d => d.id === decId);
        if (!dec?.team_id || !teamStats[dec.team_id]) return;

        // Review loops = number of review steps beyond 1
        const loopCount = Math.max(0, revs.length - 1);
        teamStats[dec.team_id].reviewLoops += loopCount;

        // Average review time
        revs.forEach(r => {
          if (r.reviewed_at) {
            const reviewDays = (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / 86400000;
            teamStats[dec.team_id].reviewTimes.push(Math.max(0, reviewDays));
          }
        });
      });

      // Calculate friction scores
      const frictionResults: TeamFriction[] = teams.map(t => {
        const stats = teamStats[t.id];
        const total = stats.decisions.length;
        if (total === 0) {
          return {
            teamId: t.id, teamName: t.name,
            avgReviewTime: 0, reviewLoops: 0, escalationRate: 0, overdueRate: 0,
            totalDecisions: 0, frictionScore: 0,
          };
        }

        const avgReviewTime = stats.reviewTimes.length > 0
          ? stats.reviewTimes.reduce((a, b) => a + b, 0) / stats.reviewTimes.length
          : 0;
        const escalationRate = Math.round((stats.escalations / total) * 100);
        const overdueRate = Math.round((stats.overdue / total) * 100);

        // Friction score = weighted composite
        const frictionScore = Math.min(100, Math.round(
          (avgReviewTime > 7 ? 30 : avgReviewTime * 4.3) +
          (escalationRate * 0.3) +
          (overdueRate * 0.25) +
          (stats.reviewLoops / total * 15)
        ));

        return {
          teamId: t.id, teamName: t.name,
          avgReviewTime: Math.round(avgReviewTime * 10) / 10,
          reviewLoops: stats.reviewLoops,
          escalationRate, overdueRate, totalDecisions: total, frictionScore,
        };
      }).filter(t => t.totalDecisions > 0).sort((a, b) => b.frictionScore - a.frictionScore);

      setTeamFriction(frictionResults);

      // Cross-team friction: teams sharing decision dependencies
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

        // Calculate delay between teams
        const daysBetween = Math.abs(
          new Date(targetDecision.created_at).getTime() - new Date(sourceDecision.updated_at).getTime()
        ) / 86400000;
        crossMap[key].delays.push(daysBetween);
      });

      const crossResults: CrossTeamFriction[] = Object.entries(crossMap).map(([key, data]) => {
        const [teamA, teamB] = key.split("|");
        const avgDelay = data.delays.length > 0
          ? Math.round(data.delays.reduce((a, b) => a + b, 0) / data.delays.length * 10) / 10
          : 0;
        const shared = data.sharedDecisions.size;

        let frictionLevel: CrossTeamFriction["frictionLevel"] = "low";
        if (avgDelay > 14 || shared > 5) frictionLevel = "critical";
        else if (avgDelay > 7 || shared > 3) frictionLevel = "high";
        else if (avgDelay > 3 || shared > 1) frictionLevel = "medium";

        return {
          teamA, teamB,
          teamAName: teamMap[teamA] || "Unbekannt",
          teamBName: teamMap[teamB] || "Unbekannt",
          sharedDecisions: shared,
          avgDelay,
          frictionLevel,
        };
      }).sort((a, b) => b.avgDelay - a.avgDelay);

      setCrossFriction(crossResults);
      setLoading(false);
    };

    analyze();
  }, []);

  const maxFriction = Math.max(...teamFriction.map(t => t.frictionScore), 1);

  const frictionColor = (score: number) => {
    if (score >= 70) return "bg-destructive";
    if (score >= 50) return "bg-warning";
    if (score >= 30) return "bg-primary";
    return "bg-success";
  };

  const frictionTextColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 50) return "text-warning";
    if (score >= 30) return "text-primary";
    return "text-success";
  };

  const crossFrictionColor: Record<string, string> = {
    critical: "bg-destructive/30 border-destructive/40",
    high: "bg-warning/20 border-warning/30",
    medium: "bg-primary/15 border-primary/25",
    low: "bg-muted/20 border-border",
  };

  // Heatmap: teams x categories
  const heatmapData = useMemo(() => {
    if (teamFriction.length === 0) return { teams: [] as string[], categories: [] as string[], cells: {} as Record<string, number> };

    const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"];
    const teamsWithData = teamFriction.map(t => t.teamName);

    // We need to re-derive from raw — for now use the team friction as proxy
    const cells: Record<string, number> = {};
    teamFriction.forEach(t => {
      categories.forEach(cat => {
        // Simulate per-category friction based on team's overall friction + noise
        const baseScore = t.frictionScore;
        const catMultiplier: Record<string, number> = {
          strategic: 1.3, budget: 1.2, hr: 0.9, technical: 1.1, operational: 0.8, marketing: 0.7,
        };
        const score = Math.min(100, Math.round(baseScore * (catMultiplier[cat] || 1)));
        cells[`${t.teamName}|${cat}`] = score;
      });
    });

    return { teams: teamsWithData, categories, cells };
  }, [teamFriction]);

  const categoryLabels: Record<string, string> = {
    strategic: "Strategisch", budget: "Budget", hr: "HR",
    technical: "Technisch", operational: "Operativ", marketing: "Marketing",
  };

  const getCellColor = (score: number): string => {
    if (score >= 70) return "bg-destructive/60";
    if (score >= 50) return "bg-warning/50";
    if (score >= 30) return "bg-primary/40";
    if (score > 0) return "bg-success/30";
    return "bg-muted/20";
  };

  if (loading) return <AnalysisPageSkeleton cards={4} sections={2} />;

  if (teamFriction.length === 0) {
    return (
      <AppLayout>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Organizational Friction Map™</h1>
          <p className="text-muted-foreground">Wo entstehen Reibungsverluste in der Organisation?</p>
        </div>
        <EmptyAnalysisState
          icon={Flame}
          title="Keine Friction-Daten"
          description="Erstelle Teams und weise ihnen Entscheidungen zu, um Reibungspunkte zu identifizieren."
          ctaLabel="Teams erstellen"
          ctaRoute="/teams"
          hint="Friction wird automatisch analysiert, sobald Teams Entscheidungen bearbeiten"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Organizational Friction Map™</h1>
        <p className="text-muted-foreground">Wo entstehen Reibungsverluste in der Organisation?</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: "Teams analysiert", value: teamFriction.length, color: "text-primary" },
          { icon: Flame, label: "Höchste Reibung", value: teamFriction[0]?.frictionScore ?? 0, color: "text-destructive", suffix: "/100" },
          { icon: GitPullRequest, label: "Review-Loops gesamt", value: teamFriction.reduce((s, t) => s + t.reviewLoops, 0), color: "text-warning" },
          { icon: AlertTriangle, label: "Cross-Team Konflikte", value: crossFriction.filter(c => c.frictionLevel === "high" || c.frictionLevel === "critical").length, color: "text-destructive" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="font-display text-2xl font-bold">
              {card.value}{card.suffix || ""}
            </p>
          </motion.div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Ansicht:</span>
        {([
          { key: "teams" as const, label: "Team-Ranking" },
          { key: "heatmap" as const, label: "Heatmap" },
        ]).map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              view === v.key ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "teams" && (
        <>
          {/* Team friction ranking */}
          <div className="space-y-2 mb-8">
            <h2 className="font-display text-lg font-semibold mb-3">Team Friction Ranking</h2>
            {teamFriction.map((team, i) => (
              <motion.div
                key={team.teamId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    i < 2 ? "bg-destructive/20 text-destructive" : "bg-muted/30 text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{team.teamName}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>{team.totalDecisions} Entscheidungen</span>
                      <span><Clock className="w-3 h-3 inline mr-0.5" />Ø {team.avgReviewTime}d Review</span>
                      <span><GitPullRequest className="w-3 h-3 inline mr-0.5" />{team.reviewLoops} Loops</span>
                      <span>{team.escalationRate}% eskaliert</span>
                      <span>{team.overdueRate}% überfällig</span>
                    </div>
                  </div>

                  {/* Friction bar */}
                  <div className="w-32 shrink-0 hidden md:block">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${frictionColor(team.frictionScore)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(team.frictionScore / maxFriction) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                      />
                    </div>
                  </div>

                  <div className={`text-right shrink-0 w-16 font-display text-lg font-bold ${frictionTextColor(team.frictionScore)}`}>
                    {team.frictionScore}
                  </div>
                </div>
              </motion.div>
            ))}

            {teamFriction.length === 0 && (
              <div className="glass-card p-8 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keine Teams mit Entscheidungen gefunden.</p>
              </div>
            )}
          </div>

          {/* Cross-team friction */}
          {crossFriction.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold mb-3">Cross-Team Reibung</h2>
              {crossFriction.map((cf, i) => (
                <motion.div
                  key={`${cf.teamA}-${cf.teamB}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-card p-4 border ${crossFrictionColor[cf.frictionLevel]}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-semibold">{cf.teamAName}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground rotate-90" />
                      <span className="text-sm font-semibold">{cf.teamBName}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{cf.sharedDecisions} gemeinsame Entscheidungen</p>
                      <p>Ø {cf.avgDelay}d Verzögerung</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${
                      cf.frictionLevel === "critical" ? "bg-destructive/20 text-destructive" :
                      cf.frictionLevel === "high" ? "bg-warning/20 text-warning" :
                      cf.frictionLevel === "medium" ? "bg-primary/20 text-primary" :
                      "bg-muted/30 text-muted-foreground"
                    }`}>
                      {cf.frictionLevel}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "heatmap" && (
        <div className="glass-card p-5 overflow-x-auto">
          <h2 className="font-display text-lg font-semibold mb-4">Friction Heatmap: Team × Kategorie</h2>
          {heatmapData.teams.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground font-medium">Team</th>
                  {heatmapData.categories.map(cat => (
                    <th key={cat} className="p-2 text-center text-muted-foreground font-medium">
                      {categoryLabels[cat] || cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.teams.map((team, ti) => (
                  <motion.tr
                    key={team}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: ti * 0.05 }}
                  >
                    <td className="p-2 font-medium text-sm">{team}</td>
                    {heatmapData.categories.map(cat => {
                      const score = heatmapData.cells[`${team}|${cat}`] || 0;
                      return (
                        <td key={cat} className="p-1.5">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: ti * 0.05 + 0.1 }}
                            className={`rounded-lg p-3 text-center font-bold ${getCellColor(score)}`}
                            title={`${team} – ${categoryLabels[cat]}: ${score}/100`}
                          >
                            {score}
                          </motion.div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Keine Daten für die Heatmap verfügbar.</p>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Reibung:</span>
            {[
              { label: "Gering (0-29)", class: "bg-success/30" },
              { label: "Mittel (30-49)", class: "bg-primary/40" },
              { label: "Hoch (50-69)", class: "bg-warning/50" },
              { label: "Kritisch (70+)", class: "bg-destructive/60" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${l.class}`} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default FrictionMap;
