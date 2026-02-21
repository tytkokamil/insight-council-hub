import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  teamId: string;
}

const TeamHealthIndicator = ({ teamId }: Props) => {
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

  const { level, color, bg, label } = useMemo(() => {
    const score = overdueCount * 3 + openReviews * 1 + blockedTasks * 2;
    if (score === 0) return { level: "healthy", color: "text-emerald-500", bg: "bg-emerald-500", label: "Healthy" };
    if (score <= 5) return { level: "moderate", color: "text-amber-500", bg: "bg-amber-500", label: "Moderate Risk" };
    return { level: "pressure", color: "text-destructive", bg: "bg-destructive", label: "Under Pressure" };
  }, [overdueCount, openReviews, blockedTasks]);

  const details = [
    overdueCount > 0 && `${overdueCount} überfällig`,
    openReviews > 0 && `${openReviews} offene Reviews`,
    blockedTasks > 0 && `${blockedTasks} blockiert`,
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
        {details.length > 0 ? details.join(" · ") : "Alles im grünen Bereich"}
      </TooltipContent>
    </Tooltip>
  );
};

export default TeamHealthIndicator;
