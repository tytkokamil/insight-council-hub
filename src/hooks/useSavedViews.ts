import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavedViewFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  team?: string[];
  quickChip?: string | null;
}

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  entity_type: string;
  filters: SavedViewFilters;
  is_pinned: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ["saved-views"];

export const useSavedViews = (entityType: string = "decisions") => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: views = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, entityType],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("saved_views")
        .select("*")
        .eq("user_id", user.id)
        .eq("entity_type", entityType)
        .order("is_pinned", { ascending: false })
        .order("sort_order")
        .order("created_at");
      return (data ?? []) as unknown as SavedView[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const createView = useMutation({
    mutationFn: async (input: { name: string; filters: SavedViewFilters; is_pinned?: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("saved_views").insert({
        user_id: user.id,
        name: input.name,
        entity_type: entityType,
        filters: input.filters as any,
        is_pinned: input.is_pinned ?? false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateView = useMutation({
    mutationFn: async (input: { id: string; name?: string; filters?: SavedViewFilters; is_pinned?: boolean }) => {
      const update: any = {};
      if (input.name !== undefined) update.name = input.name;
      if (input.filters !== undefined) update.filters = input.filters;
      if (input.is_pinned !== undefined) update.is_pinned = input.is_pinned;
      const { error } = await supabase.from("saved_views").update(update).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteView = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_views").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return { views, isLoading, createView, updateView, deleteView };
};
