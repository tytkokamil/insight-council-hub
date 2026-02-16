import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText, Clock, AlertTriangle, CheckCircle2, ListChecks,
  Users, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";

const KpiOverviewWidget = () => {
  const { data: allDecisions = [] } = useDecisions();
  const { data: allTasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  const isPersonal = selectedTeamId === null;

  const kpis = useMemo(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;
    const tasks = isPersonal
      ? allTasks.filter(t => t.created_by === user?.id || t.assignee_id === user?.id)
      : allTasks;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    // Open decisions
    const openDecisions = decisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const openDecisionsPrev = decisions.filter(d =>
      new Date(d.created_at) < sevenDaysAgo &&
      !["implemented", "rejected"].includes(d.status)
    );

    // Overdue tasks
    const openTasks = tasks.filter(t => t.status !== "done");
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < now);

    // Completed this week
    const completedThisWeek = [
      ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= sevenDaysAgo),
      ...tasks.filter(t => t.completed_at && new Date(t.completed_at) >= sevenDaysAgo),
    ].length;
    const completedLastWeek = [
      ...decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= fourteenDaysAgo && new Date(d.implemented_at) < sevenDaysAgo),
      ...tasks.filter(t => t.completed_at && new Date(t.completed_at) >= fourteenDaysAgo && new Date(t.completed_at) < sevenDaysAgo),
    ].length;

    // Team activity (decisions + tasks created this week)
    const activityThisWeek = [
      ...decisions.filter(d => new Date(d.created_at) >= sevenDaysAgo),
      ...tasks.filter(t => new Date(t.created_at) >= sevenDaysAgo),
    ].length;
    const activityLastWeek = [
      ...decisions.filter(d => new Date(d.created_at) >= fourteenDaysAgo && new Date(d.created_at) < sevenDaysAgo),
      ...tasks.filter(t => new Date(t.created_at) >= fourteenDaysAgo && new Date(t.created_at) < sevenDaysAgo),
    ].length;

    const trend = (current: number, previous: number) => {
      if (current > previous) return "up";
      if (current < previous) return "down";
      return "neutral";
    };

    return [
      {
        label: "Offene Entscheidungen",
        value: openDecisions.length,
        icon: FileText,
        color: "text-primary",
        bg: "bg-primary/10",
        trend: trend(openDecisions.length, openDecisionsPrev.length),
        trendLabel: openDecisions.length > openDecisionsPrev.length ? "Zunahme" : openDecisions.length < openDecisionsPrev.length ? "Rückgang" : "Stabil",
      },
      {
        label: "Überfällige Tasks",
        value: overdueTasks.length,
        icon: AlertTriangle,
        color: overdueTasks.length > 0 ? "text-destructive" : "text-success",
        bg: overdueTasks.length > 0 ? "bg-destructive/10" : "bg-success/10",
        trend: overdueTasks.length > 0 ? "up" as const : "neutral" as const,
        trendLabel: overdueTasks.length === 0 ? "Alles im Plan" : `${overdueTasks.length} dringend`,
      },
      {
        label: "Abgeschlossen (7d)",
        value: completedThisWeek,
        icon: CheckCircle2,
        color: "text-success",
        bg: "bg-success/10",
        trend: trend(completedThisWeek, completedLastWeek),
        trendLabel: completedThisWeek > completedLastWeek ? `+${completedThisWeek - completedLastWeek} vs. Vorwoche` : completedThisWeek < completedLastWeek ? `${completedThisWeek - completedLastWeek} vs. Vorwoche` : "Wie Vorwoche",
      },
      {
        label: isPersonal ? "Aktivität (7d)" : "Team-Aktivität (7d)",
        value: activityThisWeek,
        icon: isPersonal ? ListChecks : Users,
        color: "text-accent-foreground",
        bg: "bg-accent/30",
        trend: trend(activityThisWeek, activityLastWeek),
        trendLabel: activityThisWeek > activityLastWeek ? "Mehr Aktivität" : activityThisWeek < activityLastWeek ? "Weniger Aktivität" : "Stabil",
      },
    ];
  }, [allDecisions, allTasks, teams, user, isPersonal, selectedTeamId]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const trendColor = (trend: string, label: string) => {
    // For overdue tasks, "up" is bad
    if (label.includes("Überfällig")) {
      return trend === "up" ? "text-destructive" : trend === "down" ? "text-success" : "text-muted-foreground";
    }
    // For completed/activity, "up" is good
    if (label.includes("Abgeschlossen") || label.includes("Aktivität")) {
      return trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{kpi.value}</p>
              <div className={`flex items-center gap-1 ${trendColor(kpi.trend, kpi.label)}`}>
                <TrendIcon trend={kpi.trend} />
                <span className="text-[11px]">{kpi.trendLabel}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default KpiOverviewWidget;
