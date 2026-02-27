import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Users, Zap, CheckCircle2, AlertTriangle, FileText, Clock, TrendingUp, Shield, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppLayout from "@/components/layout/AppLayout";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import PageHint from "@/components/shared/PageHint";
import { useTeams, useProfiles, buildProfileMap, useReviews } from "@/hooks/useDecisions";
import { useRisks } from "@/hooks/useRisks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
// jsPDF loaded dynamically on export

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

const TeamPerformance = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
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

  const formatSpeed = (h: number) => h > 0 ? (h < 24 ? `${h}h` : `${Math.round(h / 24 * 10) / 10}d`) : "–";

  const exportCSV = useCallback(() => {
    if (teamStats.length === 0) return;
    const headers = [t("teamPerf.csvRank"), t("teamPerf.csvTeam"), t("teamPerf.csvDecisions"), t("teamPerf.csvImplemented"), t("teamPerf.csvCompletionRate"), t("teamPerf.csvVelocity"), t("teamPerf.csvReviewSpeed"), t("teamPerf.csvOpenReviews"), t("teamPerf.csvOpenRisks"), t("teamPerf.csvCriticalRisks"), t("teamPerf.csvOverdue")];
    const rows = teamStats.map((ts, i) => [
      i + 1, ts.teamName, ts.totalDecisions, ts.implemented, ts.completionRate,
      ts.avgVelocityDays, ts.avgReviewHours, ts.pendingReviews,
      ts.openRisks, ts.criticalRisks, ts.overdueCount,
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Decivio-Team-Performance-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [teamStats, t]);

  const exportPDF = useCallback(async () => {
    if (teamStats.length === 0) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const { addPdfHeader, addPdfFooter } = await import("@/lib/pdfBranding");
    const doc = new jsPDF({ orientation: "landscape" });
    const y = addPdfHeader(doc, t("teamPerf.pdfSubtitle", "Vergleich aller Teams"), `${teamStats.length} Teams`, t("teamPerf.pdfTitle"));

    autoTable(doc, {
      startY: y,
      head: [["#", t("teamPerf.csvTeam"), t("teamPerf.csvDecisions"), t("teamPerf.csvImplemented"), "Compl. %", t("teamPerf.csvVelocity"), t("teamPerf.csvReviewSpeed"), t("teamPerf.csvOpenReviews"), t("teamPerf.csvOpenRisks"), t("teamPerf.csvCriticalRisks"), t("teamPerf.csvOverdue")]],
      body: teamStats.map((ts, i) => [
        i + 1, ts.teamName, ts.totalDecisions, ts.implemented, `${ts.completionRate}%`,
        ts.avgVelocityDays > 0 ? `${ts.avgVelocityDays}d` : "–",
        formatSpeed(ts.avgReviewHours),
        ts.pendingReviews, ts.openRisks, ts.criticalRisks, ts.overdueCount,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    });

    addPdfFooter(doc);
    doc.save(`Decivio-Team-Performance-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }, [teamStats, t]);

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              {t("teamPerf.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("teamPerf.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {teamStats.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportCSV}>{t("teamPerf.csvDownload")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF}>{t("teamPerf.pdfDownload")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <PageHint>{t("teamPerf.hint")}</PageHint>
          </div>
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
          <EmptyAnalysisState
            icon={Users}
            title={t("teamPerf.noTeams")}
            description={t("teamPerf.noTeamsDesc", { defaultValue: "Erstelle Teams, um Leistungsvergleiche und Benchmarks zu sehen." })}
            ctaLabel={t("teamPerf.createTeam", { defaultValue: "Team erstellen" })}
            ctaRoute="/teams"
          />
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
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completion Rate
                      </span>
                      <span className="text-sm font-bold">{team.completionRate}%</span>
                    </div>
                    <Progress value={team.completionRate} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" /> {t("teamPerf.decisions")}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold">{team.totalDecisions}</span>
                            <span className="text-xs text-muted-foreground">({team.implemented} {t("teamPerf.implCount")})</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t("teamPerf.totalTooltip", { total: team.totalDecisions, impl: team.implemented })}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3" /> {t("teamPerf.avgVelocity")}
                          </div>
                          <div className="text-lg font-bold">
                            {team.avgVelocityDays > 0 ? `${team.avgVelocityDays}d` : "–"}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t("teamPerf.velocityTooltip")}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3" /> {t("teamPerf.avgReviewSpeed")}
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
                      <TooltipContent>{t("teamPerf.reviewTooltip")}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/30 rounded-lg p-2.5 space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" /> {t("teamPerf.openReviews")}
                          </div>
                          <div className="text-lg font-bold">{team.pendingReviews}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t("teamPerf.pendingReviews")}</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex gap-2">
                    {team.criticalRisks > 0 ? (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <Shield className="w-3 h-3" /> {t("teamPerf.criticalRisks", { count: team.criticalRisks })}
                      </Badge>
                    ) : team.openRisks > 0 ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Shield className="w-3 h-3" /> {t("teamPerf.openRisks", { count: team.openRisks })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Shield className="w-3 h-3" /> {t("teamPerf.noRisks")}
                      </Badge>
                    )}
                    {team.overdueCount > 0 && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="w-3 h-3" /> {t("teamPerf.overdue", { count: team.overdueCount })}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/40 rounded-full transition-all"
                        style={{ width: `${(team.totalDecisions / maxDecisions) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{t("teamPerf.volumeRelative")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Wrap>
  );
};

export default TeamPerformance;
