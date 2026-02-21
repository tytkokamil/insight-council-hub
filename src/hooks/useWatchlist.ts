import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const WATCHLIST_KEY = ["watchlist"] as const;

export const useWatchlist = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: WATCHLIST_KEY,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("decision_watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};

export const useIsWatched = (decisionId: string) => {
  const { data: watchlist = [] } = useWatchlist();
  return watchlist.some((w: any) => w.decision_id === decisionId);
};

export const useToggleWatchlist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ decisionId, isWatched }: { decisionId: string; isWatched: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isWatched) {
        const { error } = await supabase
          .from("decision_watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("decision_id", decisionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("decision_watchlist")
          .insert({ user_id: user.id, decision_id: decisionId });
        if (error) throw error;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });
};
