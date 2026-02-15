import { useMemo } from "react";
import { Trophy, Medal, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";

interface LeaderEntry {
  userId: string;
  name: string;
  decisions: number;
  avgVelocity: number;
  implemented: number;
}

const LeaderboardWidget = () => {
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const profileMap = buildProfileMap(profiles);

  const leaders = useMemo(() => {
    if (allDecisions.length === 0) return [];

    const userMap: Record<string, { decisions: number; implemented: number; velocities: number[] }> = {};

    allDecisions.forEach(d => {
      if (!userMap[d.created_by]) userMap[d.created_by] = { decisions: 0, implemented: 0, velocities: [] };
      userMap[d.created_by].decisions++;
      if (d.status === "implemented") {
        userMap[d.created_by].implemented++;
        if (d.implemented_at) {
          const days = (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
          userMap[d.created_by].velocities.push(days);
        }
      }
    });

    return Object.entries(userMap)
      .map(([userId, stats]) => ({
        userId,
        name: profileMap[userId] || "Unbekannt",
        decisions: stats.decisions,
        implemented: stats.implemented,
        avgVelocity: stats.velocities.length > 0
          ? Math.round(stats.velocities.reduce((s, v) => s + v, 0) / stats.velocities.length * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.implemented - a.implemented || a.avgVelocity - b.avgVelocity)
      .slice(0, 5);
  }, [allDecisions, profileMap]);

  const rankIcons = [
    <Trophy className="w-4 h-4 text-warning" />,
    <Medal className="w-4 h-4 text-muted-foreground" />,
    <Medal className="w-4 h-4 text-warning/60" />,
  ];

  if (leaders.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">Decision Leaderboard</CardTitle>
            <ScoreMethodology
              title="Leaderboard"
              description="Ranking der Entscheidungsträger nach Umsetzungsleistung."
              items={[
                { label: "Sortierung", formula: "Primär: Anzahl implementierter Entscheidungen (absteigend)" },
                { label: "Tiebreak", formula: "Sekundär: Ø Velocity in Tagen (aufsteigend = schneller = besser)" },
                { label: "Velocity pro Person", formula: "Σ(implemented_at − created_at) / Anzahl implementiert" },
              ]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaders.map((leader, i) => (
            <div key={leader.userId} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? "bg-warning/5 border border-warning/20" : "bg-muted/30"}`}>
              <div className="w-6 flex justify-center shrink-0">
                {i < 3 ? rankIcons[i] : <span className="text-xs text-muted-foreground font-bold">#{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{leader.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {leader.implemented} umgesetzt</span>
                  {leader.avgVelocity > 0 && (
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {leader.avgVelocity}d Ø</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{leader.decisions}</p>
                <p className="text-xs text-muted-foreground">gesamt</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardWidget;
