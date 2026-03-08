import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamContext } from "@/hooks/useTeamContext";
import { toast } from "sonner";
import i18n from "@/i18n";
import { fetchDecisions, fetchTeams, fetchProfiles } from "@/lib/queryFns";

export const DECISIONS_KEY = ["decisions"] as const;
export const TEAMS_KEY = ["teams"] as const;
export const DEPENDENCIES_KEY = ["dependencies"] as const;
export const REVIEWS_KEY = ["reviews"] as const;
export const PROFILES_KEY = ["profiles"] as const;
export const NOTIFICATIONS_KEY = ["notifications"] as const;

export const useDecisions = () => {
  const { selectedTeamId } = useTeamContext();
  return useQuery({
    queryKey: [...DECISIONS_KEY, selectedTeamId],
    queryFn: () => fetchDecisions(selectedTeamId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
};

export const useTeams = () =>
  useQuery({
    queryKey: TEAMS_KEY,
    queryFn: fetchTeams,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useProfiles = () =>
  useQuery({
    queryKey: PROFILES_KEY,
    queryFn: fetchProfiles,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useDependencies = () =>
  useQuery({
    queryKey: DEPENDENCIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("decision_dependencies").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useReviews = () =>
  useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("decision_reviews").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

/** Dependencies filtered to only include those where both source and target are in the current decision set */
export const useFilteredDependencies = () => {
  const { data: decisions = [] } = useDecisions();
  const { data: allDeps = [], isLoading } = useDependencies();
  const filtered = useMemo(() => {
    if (decisions.length === 0) return allDeps;
    const decIds = new Set(decisions.map(d => d.id));
    return allDeps.filter(dep => decIds.has(dep.source_decision_id) || decIds.has(dep.target_decision_id));
  }, [decisions, allDeps]);
  return { data: filtered, isLoading };
};

/** Reviews filtered to only include those for decisions in the current team context */
export const useFilteredReviews = () => {
  const { data: decisions = [] } = useDecisions();
  const { data: allReviews = [], isLoading } = useReviews();
  const filtered = useMemo(() => {
    if (decisions.length === 0) return allReviews;
    const decIds = new Set(decisions.map(d => d.id));
    return allReviews.filter(r => decIds.has(r.decision_id));
  }, [decisions, allReviews]);
  return { data: filtered, isLoading };
};

/** Notifications filtered to only include those for decisions in the current team context */
export const useFilteredNotifications = () => {
  const { data: decisions = [] } = useDecisions();
  const { data: allNotifs = [], isLoading } = useNotifications();
  const filtered = useMemo(() => {
    if (decisions.length === 0) return allNotifs;
    const decIds = new Set(decisions.map(d => d.id));
    return allNotifs.filter(n => !n.decision_id || decIds.has(n.decision_id));
  }, [decisions, allNotifs]);
  return { data: filtered, isLoading };
};

/** Utility: build a map of user_id -> full_name from profiles data */
export const buildProfileMap = (profiles: { user_id: string; full_name: string | null }[]) => {
  const map: Record<string, string> = {};
  profiles.forEach(p => { map[p.user_id] = p.full_name || i18n.t("strategy.unknown"); });
  return map;
};

export const useNotifications = () =>
  useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

/** Hook to invalidate all decision-related caches */
export const useInvalidateDecisions = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: DECISIONS_KEY });
    qc.invalidateQueries({ queryKey: DEPENDENCIES_KEY });
    qc.invalidateQueries({ queryKey: REVIEWS_KEY });
  };
};

/** Optimistic mutation for updating decision status */
export const useUpdateDecisionStatus = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();
  const queryKey = [...DECISIONS_KEY, selectedTeamId];

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
      if (status === "implemented") updates.implemented_at = new Date().toISOString();
      const { error } = await supabase.from("decisions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: any[] | undefined) =>
        old?.map((d) =>
          d.id === id
            ? { ...d, status, updated_at: new Date().toISOString(), ...(status === "implemented" ? { implemented_at: new Date().toISOString() } : {}) }
            : d
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(i18n.t("hooks.statusChangeFailed"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
};

/** Optimistic mutation for soft-deleting a decision */
export const useDeleteDecision = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();
  const queryKey = [...DECISIONS_KEY, selectedTeamId];

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("decisions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: any[] | undefined) =>
        old?.filter((d) => d.id !== id)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(i18n.t("hooks.deleteFailed"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
};

/** Optimistic mutation for updating decision priority */
export const useUpdateDecisionPriority = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();
  const queryKey = [...DECISIONS_KEY, selectedTeamId];

  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: "low" | "medium" | "high" | "critical" }) => {
      const { error } = await supabase
        .from("decisions")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, priority }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: any[] | undefined) =>
        old?.map((d) => d.id === id ? { ...d, priority, updated_at: new Date().toISOString() } : d)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(i18n.t("hooks.priorityChangeFailed"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
};
