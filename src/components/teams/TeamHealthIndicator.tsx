import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface Props {
  teamId: string;
}

const TeamHealthIndicator = ({ teamId }: Props) => {
  const { t } = useTranslation();
  const [overdueCount, setOverdueCount] = useState(0);
  const [openReviews, setOpenReviews] = useState(0);
  const [blockedTasks, setBlockedTasks] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const now = new Date().toISOString().split("T")[0];
      const [dRes, rRes, tRes] = await Promise.all([
        supabase.from("decisions").select("id", { count: "exact", head: true })
          .eq("team_id", teamId).lt("due_date", now).is("deleted_at", null)
          .not("status", "in", '("implemented","rejected","archived","cancelled")'),
        supabase.from("decision_reviews").select("id, decisions!inner(team_id)", { count: "exact", head: true })
          .eq("decisions.team_id", teamId).eq("status", "review"),
        supabase.from("tasks").select("id", { count: "exact", head: true })
          .eq("team_id", teamId).eq("status", "blocked").is("deleted_at", null),
      ]);
      setOverdueCount(dRes.count ?? 0);
      setOpenReviews(rRes.count ?? 0);
      setBlockedTasks(tRes.count ?? 0);
    };
    fetch();
  }, [teamId]);

  const { color, bg, label } = useMemo(() => {
    const score = overdueCount * 3 + openReviews * 1 + blockedTasks * 2;
    if (score === 0) return { color: "text-chart-2", bg: "bg-chart-2", label: t("teamCmd.healthy") };
    if (score <= 5) return { color: "text-warning", bg: "bg-warning", label: t("teamCmd.moderateRisk") };
    return { color: "text-destructive", bg: "bg-destructive", label: t("teamCmd.underPressure") };
  }, [overdueCount, openReviews, blockedTasks, t]);

  const details = [
    overdueCount > 0 && `${overdueCount} ${t("teamCmd.overdueLabel")}`,
    openReviews > 0 && `${openReviews} ${t("teamCmd.openReviewsLabel")}`,
    blockedTasks > 0 && `${blockedTasks} ${t("teamCmd.blockedLabel")}`,
  ].filter(Boolean);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          <div className={`w-2.5 h-2.5 rounded-full ${bg} animate-pulse`} />
          <span className={`text-xs font-semibold ${color}`}>{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {details.length > 0 ? details.join(" · ") : t("teamCmd.allGood")}
      </TooltipContent>
    </Tooltip>
  );
};

export default TeamHealthIndicator;
