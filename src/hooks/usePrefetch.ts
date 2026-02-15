import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DECISIONS_KEY, TEAMS_KEY, PROFILES_KEY } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";

/**
 * Returns a prefetch function that can be called on link hover
 * to warm the React Query cache before navigation.
 */
export const usePrefetchOnHover = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();

  return useCallback(
    (path: string) => {
      // Routes that use decisions data
      const decisionRoutes = ["/dashboard", "/decisions", "/graph", "/analytics", "/calendar", "/health", "/dna", "/engine", "/benchmarking", "/scenarios", "/timeline", "/strategy", "/patterns", "/bottlenecks", "/costs", "/friction", "/executive", "/briefing"];

      if (decisionRoutes.some((r) => path.startsWith(r))) {
        qc.prefetchQuery({
          queryKey: [...DECISIONS_KEY, selectedTeamId],
          queryFn: async () => {
            let query = supabase
              .from("decisions")
              .select("*")
              .order("created_at", { ascending: false });
            if (selectedTeamId) {
              query = query.eq("team_id", selectedTeamId);
            } else {
              query = query.is("team_id", null);
            }
            const { data } = await query;
            return data ?? [];
          },
          staleTime: 30_000,
        });
      }

      // Routes that use teams data
      if (["/teams", "/decisions", "/dashboard"].some((r) => path.startsWith(r))) {
        qc.prefetchQuery({
          queryKey: TEAMS_KEY,
          queryFn: async () => {
            const { data } = await supabase.from("teams").select("*");
            return data ?? [];
          },
          staleTime: 60_000,
        });
      }

      // Routes that use profiles
      if (["/dashboard", "/decisions"].some((r) => path.startsWith(r))) {
        qc.prefetchQuery({
          queryKey: PROFILES_KEY,
          queryFn: async () => {
            const { data } = await supabase.from("profiles").select("user_id, full_name");
            return data ?? [];
          },
          staleTime: 60_000,
        });
      }
    },
    [qc, selectedTeamId]
  );
};
