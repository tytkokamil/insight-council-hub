import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DECISIONS_KEY, TEAMS_KEY, PROFILES_KEY } from "@/hooks/useDecisions";
import { fetchDecisions, fetchTeams, fetchProfiles } from "@/lib/queryFns";
import { useTeamContext } from "@/hooks/useTeamContext";

/**
 * Returns a prefetch function that can be called on link hover
 * to warm the React Query cache before navigation.
 * Uses shared queryFns from lib/queryFns.ts – single source of truth.
 */
export const usePrefetchOnHover = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();

  return useCallback(
    (path: string) => {
      const decisionRoutes = ["/dashboard", "/decisions", "/decision-graph", "/analytics", "/calendar", "/engine", "/strategy", "/executive", "/briefing"];

      if (decisionRoutes.some((r) => path.startsWith(r))) {
        qc.prefetchQuery({
          queryKey: [...DECISIONS_KEY, selectedTeamId],
          queryFn: () => fetchDecisions(selectedTeamId),
          staleTime: 5 * 60_000,
        });
      }

      if (["/teams", "/decisions", "/dashboard"].some((r) => path.startsWith(r))) {
        qc.prefetchQuery({
          queryKey: TEAMS_KEY,
          queryFn: fetchTeams,
          staleTime: 5 * 60_000,
        });
      }

      if (["/dashboard", "/decisions"].some((r) => path.startsWith(r))) {
        qc.prefetchQuery({
          queryKey: PROFILES_KEY,
          queryFn: fetchProfiles,
          staleTime: 5 * 60_000,
        });
      }
    },
    [qc, selectedTeamId]
  );
};
