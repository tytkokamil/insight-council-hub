import { useMemo, useState } from "react";
import { Users, Zap, Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions, useProfiles, buildProfileMap, useReviews } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslation } from "react-i18next";

type Tab = "makers" | "reviewers";

const LeaderboardWidget = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("makers");
  const { isEnabled } = useFeatureFlags();
  const { selectedTeamId } = useTeamContext();
  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: allReviews = [], isLoading: loadingReviews } = useReviews();
  const profileMap = buildProfileMap(profiles);

  const isLoading = loadingDec || loadingProfiles || loadingReviews;

  // Filter to active team only (team-level, not org-wide)
  const teamDecisions = useMemo(() => {
    if (!selectedTeamId) return allDecisions;
    return allDecisions.filter(d => d.team_id === selectedTeamId);
  }, [allDecisions, selectedTeamId]);

  const teamReviews = useMemo(() => {
    if (!selectedTeamId) return allReviews;
    const teamDecIds = new Set(teamDecisions.map(d => d.id));
    return allReviews.filter(r => teamDecIds.has(r.decision_id));
  }, [allReviews, selectedTeamId, teamDecisions]);

  // Decision makers
  const makers = useMemo(() => {
    if (teamDecisions.length === 0) return [];
    const userMap: Record<string, { decisions: number; implemented: number; velocities: number[] }> = {};
    teamDecisions.forEach(d => {
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
        name: profileMap[userId] || t("leaderboard.unknown"),
        decisions: stats.decisions,
        implemented: stats.implemented,
        avgVelocity: stats.velocities.length > 0
          ? Math.round(stats.velocities.reduce((s, v) => s + v, 0) / stats.velocities.length * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.implemented - a.implemented || a.avgVelocity - b.avgVelocity)
      .slice(0, 5);
  }, [teamDecisions, profileMap, t]);

  // Reviewers
  const reviewers = useMemo(() => {
    const completed = teamReviews.filter(r => r.reviewed_at && (r.status === "approved" || r.status === "rejected"));
    if (completed.length === 0) return [];
    const userMap: Record<string, { count: number; approved: number; speeds: number[] }> = {};
    completed.forEach(r => {
      if (!userMap[r.reviewer_id]) userMap[r.reviewer_id] = { count: 0, approved: 0, speeds: [] };
      userMap[r.reviewer_id].count++;
      if (r.status === "approved") userMap[r.reviewer_id].approved++;
      if (r.reviewed_at) {
        const hours = (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
        userMap[r.reviewer_id].speeds.push(hours);
      }
    });
    return Object.entries(userMap)
      .map(([userId, stats]) => ({
        userId,
        name: profileMap[userId] || t("leaderboard.unknown"),
        count: stats.count,
        approved: stats.approved,
        avgSpeed: stats.speeds.length > 0
          ? Math.round(stats.speeds.reduce((s, v) => s + v, 0) / stats.speeds.length * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.count - a.count || a.avgSpeed - b.avgSpeed)
      .slice(0, 5);
  }, [teamReviews, profileMap, t]);

  // Feature flag: default OFF (isEnabled defaults true for unknown keys, so "leaderboard" must exist and be enabled)
  if (!isEnabled("leaderboard")) return null;
  if (isLoading) return <WidgetSkeleton rows={5} showScore={false} />;
  if (makers.length === 0 && reviewers.length === 0) return null;

  const activeList = tab === "makers" ? makers : reviewers;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">{t("leaderboard.title")}</CardTitle>
            <ScoreMethodology
              title={t("leaderboard.title")}
              description={t("leaderboard.methodologyDesc")}
              items={[
                { label: t("leaderboard.makersLabel"), formula: t("leaderboard.makersFormula") },
                { label: t("leaderboard.reviewersLabel"), formula: t("leaderboard.reviewersFormula") },
              ]}
            />
          </div>
        </div>
        {selectedTeamId && (
          <p className="text-[10px] text-muted-foreground mt-1">{t("leaderboard.teamOnly")}</p>
        )}
        <div className="flex gap-1 mt-2 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setTab("makers")}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-colors ${tab === "makers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("leaderboard.makersTab")}
          </button>
          <button
            onClick={() => setTab("reviewers")}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-colors ${tab === "reviewers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("leaderboard.reviewersTab")}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{t("leaderboard.noData")}</p>
          ) : tab === "makers" ? (
            makers.map((leader) => (
              <div key={leader.userId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{leader.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {leader.implemented} {t("leaderboard.implemented")}</span>
                    {leader.avgVelocity > 0 && (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {leader.avgVelocity}d Ø</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{leader.decisions}</p>
                  <p className="text-xs text-muted-foreground">{t("leaderboard.total")}</p>
                </div>
              </div>
            ))
          ) : (
            reviewers.map((rev) => (
              <div key={rev.userId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rev.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {rev.approved} {t("leaderboard.approved")}</span>
                    {rev.avgSpeed > 0 && (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {rev.avgSpeed < 24 ? `${rev.avgSpeed}h` : `${Math.round(rev.avgSpeed / 24 * 10) / 10}d`} Ø</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{rev.count}</p>
                  <p className="text-xs text-muted-foreground">{t("leaderboard.reviews")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardWidget;
