import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Zap, Target } from "lucide-react";
import { useDecisions, useProfiles, buildProfileMap } from "@/hooks/useDecisions";

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
    <Trophy className="w-4 h-4 text-yellow-500" />,
    <Medal className="w-4 h-4 text-gray-400" />,
    <Medal className="w-4 h-4 text-amber-700" />,
  ];

  if (leaders.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-yellow-500" />
        </div>
        <h3 className="text-sm font-semibold">Decision Leaderboard</h3>
      </div>

      <div className="space-y-2">
        {leaders.map((leader, i) => (
          <div key={leader.userId} className={`flex items-center gap-3 p-2.5 rounded-lg ${i === 0 ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-muted/20"}`}>
            <div className="w-6 flex justify-center shrink-0">
              {i < 3 ? rankIcons[i] : <span className="text-xs text-muted-foreground font-bold">#{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{leader.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
    </motion.div>
  );
};

export default LeaderboardWidget;
