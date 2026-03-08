import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamContext } from "@/hooks/useTeamContext";
import { toast } from "sonner";
import i18n from "@/i18n";

export const TASKS_KEY = ["tasks"] as const;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "open" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "critical";
  category: "general" | "strategic" | "operational" | "technical" | "hr" | "marketing" | "budget";
  due_date: string | null;
  created_by: string;
  assignee_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const useTasks = () => {
  const { selectedTeamId } = useTeamContext();
  return useQuery({
    queryKey: [...TASKS_KEY, selectedTeamId],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (selectedTeamId) {
        query = query.eq("team_id", selectedTeamId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Task[];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
};

export const useTeamTasks = (teamId: string) => {
  return useQuery({
    queryKey: [...TASKS_KEY, "team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("team_id", teamId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
};

export const useInvalidateTasks = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: TASKS_KEY });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();
  const queryKey = [...TASKS_KEY, selectedTeamId];

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
      if (status === "done") updates.completed_at = new Date().toISOString();
      else updates.completed_at = null;
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: Task[] | undefined) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, status, updated_at: new Date().toISOString(), completed_at: status === "done" ? new Date().toISOString() : null }
            : t
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(i18n.t("hooks.statusChangeFailed"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
};

/** Optimistic mutation for soft-deleting a task */
export const useDeleteTask = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();
  const queryKey = [...TASKS_KEY, selectedTeamId];

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: Task[] | undefined) =>
        old?.filter((t) => t.id !== id)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(i18n.t("hooks.deleteFailed"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
};

/** Optimistic mutation for updating task priority */
export const useUpdateTaskPriority = () => {
  const qc = useQueryClient();
  const { selectedTeamId } = useTeamContext();
  const queryKey = [...TASKS_KEY, selectedTeamId];

  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: "low" | "medium" | "high" | "critical" }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, priority }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: Task[] | undefined) =>
        old?.map((t) => t.id === id ? { ...t, priority, updated_at: new Date().toISOString() } : t)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(i18n.t("hooks.priorityChangeFailed"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
};
