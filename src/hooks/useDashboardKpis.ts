import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";

export interface DashboardKpis {
  total_decisions: number;
  active_decisions: number;
  overdue_decisions: number;
  escalated_decisions: number;
  implemented_decisions: number;
  avg_decision_days: number;
  total_tasks: number;
  open_tasks: number;
  open_risks: number;
  pending_reviews: number;
}

export const DASHBOARD_KPIS_KEY = ["dashboard-kpis"] as const;

export const useDashboardKpis = () => {
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();

  return useQuery({
    queryKey: [...DASHBOARD_KPIS_KEY, user?.id, selectedTeamId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc("get_dashboard_kpis", {
        _user_id: user.id,
        _team_id: selectedTeamId ?? undefined,
      });
      if (error) throw error;
      return data as unknown as DashboardKpis;
    },
    enabled: !!user?.id,
    staleTime: 60_000, // 1 minute – server aggregates are cheaper to cache longer
    gcTime: 5 * 60_000,
  });
};
