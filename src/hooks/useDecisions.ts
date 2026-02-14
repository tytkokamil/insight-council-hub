import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DECISIONS_KEY = ["decisions"] as const;
export const TEAMS_KEY = ["teams"] as const;
export const DEPENDENCIES_KEY = ["dependencies"] as const;
export const REVIEWS_KEY = ["reviews"] as const;
export const PROFILES_KEY = ["profiles"] as const;

export const useDecisions = () =>
  useQuery({
    queryKey: DECISIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

export const useTeams = () =>
  useQuery({
    queryKey: TEAMS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

export const useDependencies = () =>
  useQuery({
    queryKey: DEPENDENCIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("decision_dependencies").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

export const useReviews = () =>
  useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("decision_reviews").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

export const useProfiles = () =>
  useQuery({
    queryKey: PROFILES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

/** Utility: build a map of user_id -> full_name from profiles data */
export const buildProfileMap = (profiles: { user_id: string; full_name: string | null }[]) => {
  const map: Record<string, string> = {};
  profiles.forEach(p => { map[p.user_id] = p.full_name || "Unbekannt"; });
  return map;
};

/** Hook to invalidate all decision-related caches */
export const useInvalidateDecisions = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: DECISIONS_KEY });
    qc.invalidateQueries({ queryKey: DEPENDENCIES_KEY });
    qc.invalidateQueries({ queryKey: REVIEWS_KEY });
  };
};
