import { useMemo } from "react";
import { Users, Zap, CheckCircle2, AlertTriangle, FileText, Clock, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import PageHint from "@/components/shared/PageHint";
import { useTeams, useProfiles, buildProfileMap, useReviews } from "@/hooks/useDecisions";
import { useRisks } from "@/hooks/useRisks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface TeamStats {
  teamId: string;
  teamName: string;
  totalDecisions: number;
  implemented: number;
  completionRate: number;
  avgVelocityDays: number;
  openRisks: number;
  criticalRisks: number;
  pendingReviews: number;
  avgReviewHours: number;
  overdueCount: number;
}

/** Fetch ALL decisions (not team-filtered) for comparison */
const useAllDecisions = () =>
  useQuery({
    queryKey: ["all-decisions-compare"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisions")
        .select("id, status, created_at, implemented_at, due_date, team_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

const TeamPerformance = () => {
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const { data: allDecisions = [], isLoading: loadingDec } = useAllDecisions();
  const { data: risks = [], isLoading: loadingRisks } = useRisks();
  const { data: reviews = [], isLoading: loadingReviews } = useReviews();

  const isLoading = loadingTeams || loadingDec || loadingRisks || loadingReviews;

  const teamStats: TeamStats[] = useMemo(() => {
    if (teams.length === 0) return [];
    const now = new Date();

    return teams.map((team) => {
      const decs = allDecisions.filter(d => d.team_id === team.id);
      const implemented = decs.filter(d => d.status === "implemented");
      const velocities: number[] = [];
      implemented.forEach(d => {
        if (d.implemented_at) {
          velocities.push(
            (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      });
      const overdue = decs.filter(d =>
        d.due_date && new Date(d.due_date) < now && !["implemented", "archived", "rejected"].includes(d.status)
      );

      const teamRisks = risks.filter(r => r.team_id === team.id && r.status !== "closed");
      const criticalRisks = teamRisks.filter(r => (r.risk_score ?? 0) >= 16);

      const teamReviews = reviews.filter(r => {
        const dec = allDecisions.find(d => d.id === r.decision_id);
        return dec?.team_id === team.id;
      });
      const completedReviews = teamReviews.filter(r => r.reviewed_at);
      const pendingReviews = teamReviews.filter(r => !r.reviewed_at);
      const reviewSpeeds: number[] = [];
      completedReviews.forEach(r => {
        if (r.reviewed_at) {
          reviewSpeeds.push(
            (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60)
          );
        }
      });

      return {
        teamId: team.id,
        teamName: team.name,
        totalDecisions: decs.length,
        implemented: implemented.length,
        completionRate: decs.length > 0 ? Math.round((implemented.length / decs.length) * 100) : 0,
        avgVelocityDays: velocities.length > 0
          ? Math.round(velocities.reduce((s, v) => s + v, 0) / velocities.length * 10) / 10
          : 0,
        openRisks: teamRisks.length,
        criticalRisks: criticalRisks.length,
        pendingReviews: pendingReviews.length,
        avgReviewHours: reviewSpeeds.length > 0
          ? Math.round(reviewSpeeds.reduce((s, v) => s + v, 0) / reviewSpeeds.length * 10) / 10
          : 0,
        overdueCount: overdue.length,
      };
    }).sort((a, b) => b.completionRate - a.completionRate || a.avgVelocityDays - b.avgVelocityDays);
  }, [teams, allDecisions, risks, reviews]);

  const maxDecisions = Math.max(...teamStats.map(t => t.totalDecisions), 1);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Team-Performance Vergleich
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              KPIs aller Teams im direkten Vergleich
            </p>
          </div>
          <PageHint>
            Vergleicht Velocity, Completion Rate, offene Risiken und Review-Geschwindigkeit aller Teams.
          </PageHint>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3"><div className="h-5 w-32 bg-muted rounded" /></CardHeader>
                <CardContent><div className="space-y-3">{[1, 2, 3, 4].map(j => <div key={j} className="h-4 bg-muted rounded" />)}</div></CardContent>
              </Card>
            ))}
          </div>
        ) : teamStats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Noch keine Teams vorhanden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teamStats.map((team, idx) => (
              <Card key={team.teamId} className={idx === 0 ? "border-primary/30 shadow-md" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {idx === 0 && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Top</Badge>}
                      {team.teamName}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Completion Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completion Rate
                      </span>
                      <span className="text-sm font-bold">{team.completionRate}%</span>
                    </div>
                    <Progress value={team.completionRate} className="h-1.5" />
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" /> Entscheidungen
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold">{team.totalDecisions}</span>
                            <span className="text-xs text-muted-foreground">({team.implemented} umgesetzt)</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Gesamt: {team.totalDecisions}, Umgesetzt: {team.implemented}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3" /> Ø Velocity
                          </div>
                          <div className="text-lg font-bold">
                            {team.avgVelocityDays > 0 ? `${team.avgVelocityDays}d` : "–"}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Durchschnittliche Tage bis zur Umsetzung</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3" /> Ø Review-Speed
                          </div>
                          <div className="text-lg font-bold">
                            {team.avgReviewHours > 0
                              ? team.avgReviewHours < 24
                                ? `${team.avgReviewHours}h`
                                : `${Math.round(team.avgReviewHours / 24 * 10) / 10}d`
                              : "–"}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Durchschnittliche Review-Reaktionszeit</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" /> Offene Reviews
                          </div>
                          <div className="text-lg font-bold">{team.pendingReviews}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Ausstehende Reviews</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Risk & Overdue Row */}
                  <div className="flex gap-2">
                    {team.criticalRisks > 0 ? (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <Shield className="w-3 h-3" /> {team.criticalRisks} kritische Risiken
                      </Badge>
                    ) : team.openRisks > 0 ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Shield className="w-3 h-3" /> {team.openRisks} offene Risiken
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Shield className="w-3 h-3" /> Keine Risiken
                      </Badge>
                    )}
                    {team.overdueCount > 0 && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="w-3 h-3" /> {team.overdueCount} überfällig
                      </Badge>
                    )}
                  </div>

                  {/* Volume bar */}
                  <div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/40 rounded-full transition-all"
                        style={{ width: `${(team.totalDecisions / maxDecisions) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      Volumen relativ zum aktivsten Team
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeamPerformance;
