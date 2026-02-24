import { useMemo } from "react";
import { Flame, Trophy, Zap, Target, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInCalendarDays, differenceInDays, startOfDay } from "date-fns";
import { useTranslation } from "react-i18next";

interface Props {
  decisions: any[];
  tasks: any[];
  teams: any[];
}

interface Achievement {
  id: string;
  icon: typeof Star;
  label: string;
  description: string;
  earned: boolean;
  color: string;
}

const GamificationWidget = ({ decisions, tasks, teams }: Props) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);

    const activeDecisions = decisions.filter(d =>
      !["implemented", "rejected", "archived", "cancelled"].includes(d.status)
    );
    const overdueDecisions = activeDecisions.filter(d =>
      d.due_date && new Date(d.due_date) < now
    );

    let streakDays = 0;
    if (overdueDecisions.length === 0 && decisions.length > 0) {
      const implementedWithDue = decisions
        .filter(d => d.status === "implemented" && d.due_date && d.implemented_at)
        .sort((a, b) => new Date(b.implemented_at!).getTime() - new Date(a.implemented_at!).getTime());

      const lastViolation = implementedWithDue.find(d =>
        new Date(d.implemented_at!) > new Date(d.due_date!)
      );

      if (lastViolation) {
        streakDays = differenceInCalendarDays(today, new Date(lastViolation.implemented_at!));
      } else {
        const earliest = decisions.reduce((min, d) =>
          new Date(d.created_at) < new Date(min.created_at) ? d : min
        , decisions[0]);
        streakDays = Math.min(differenceInCalendarDays(today, new Date(earliest.created_at)), 365);
      }
    }

    const recentImplemented = decisions.filter(d =>
      d.status === "implemented" && d.implemented_at &&
      differenceInDays(now, new Date(d.implemented_at)) <= 30
    );
    const avgVelocity = recentImplemented.length > 0
      ? Math.round(recentImplemented.reduce((sum, d) =>
          sum + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0
        ) / recentImplemented.length)
      : 0;

    const thisWeekCompleted = decisions.filter(d =>
      d.status === "implemented" && d.implemented_at &&
      differenceInDays(now, new Date(d.implemented_at)) <= 7
    ).length;

    const implemented = decisions.filter(d => d.status === "implemented").length;
    const total = decisions.length;

    const achievements: Achievement[] = [
      { id: "first-decision", icon: Zap, label: t("widgets.firstDecisionAch"), description: t("widgets.firstDecisionAchDesc"), earned: total >= 1, color: "text-yellow-500" },
      { id: "team-player", icon: Trophy, label: t("widgets.teamPlayer"), description: t("widgets.teamPlayerDesc"), earned: teams.length >= 1, color: "text-blue-500" },
      { id: "decision-maker", icon: Target, label: t("widgets.decisionMaker"), description: t("widgets.decisionMakerDesc"), earned: implemented >= 10, color: "text-emerald-500" },
      { id: "streak-master", icon: Flame, label: t("widgets.streakMaster"), description: t("widgets.streakMasterDesc"), earned: streakDays >= 30, color: "text-orange-500" },
      { id: "velocity-star", icon: Star, label: t("widgets.speedStar"), description: t("widgets.speedStarDesc"), earned: avgVelocity > 0 && avgVelocity < 5, color: "text-purple-500" },
    ];

    return { streakDays, avgVelocity, thisWeekCompleted, achievements, earnedCount: achievements.filter(a => a.earned).length };
  }, [decisions, tasks, teams, t]);

  if (decisions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          {t("widgets.performance")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{stats.streakDays}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">{t("widgets.daysNoSla")}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-2xl font-bold text-primary mb-1">{stats.thisWeekCompleted}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{t("widgets.decisionsThisWeek")}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-2xl font-bold mb-1">{stats.avgVelocity > 0 ? `${stats.avgVelocity}d` : "—"}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{t("widgets.avgImplementation")}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {t("widgets.achievements")} ({stats.earnedCount}/{stats.achievements.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {stats.achievements.map(a => (
              <Tooltip key={a.id}>
                <TooltipTrigger asChild>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                    a.earned ? "bg-card border-border shadow-sm" : "bg-muted/30 border-transparent opacity-30"
                  }`}>
                    <a.icon className={`w-4 h-4 ${a.earned ? a.color : "text-muted-foreground"}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-muted-foreground">{a.description}</p>
                  {!a.earned && <p className="text-warning mt-0.5">{t("widgets.notUnlocked")}</p>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationWidget;
