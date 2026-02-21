import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const RISKS_KEY = ["risks"] as const;
export const RISK_DECISION_LINKS_KEY = ["risk_decision_links"] as const;
export const RISK_TASK_LINKS_KEY = ["risk_task_links"] as const;

export interface Risk {
  id: string;
  title: string;
  description: string | null;
  likelihood: number;
  impact: number;
  risk_score: number;
  status: string;
  owner_id: string | null;
  team_id: string | null;
  mitigation_plan: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useRisks = () =>
  useQuery({
    queryKey: RISKS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks" as any)
        .select("*")
        .order("risk_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Risk[];
    },
    staleTime: 30_000,
  });

export const useRiskDecisionLinks = () =>
  useQuery({
    queryKey: RISK_DECISION_LINKS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_decision_links" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; risk_id: string; decision_id: string; linked_by: string; created_at: string }[];
    },
    staleTime: 30_000,
  });

export const useRiskTaskLinks = () =>
  useQuery({
    queryKey: RISK_TASK_LINKS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_task_links" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; risk_id: string; task_id: string; linked_by: string; created_at: string }[];
    },
    staleTime: 30_000,
  });

export const useCreateRisk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (risk: Omit<Risk, "id" | "risk_score" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("risks" as any).insert(risk as any);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISKS_KEY }),
  });
};

export const useUpdateRisk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Risk>) => {
      const { error } = await supabase.from("risks" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISKS_KEY }),
  });
};

export const useDeleteRisk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("risks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISKS_KEY }),
  });
};

export const useLinkRiskDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ risk_id, decision_id, linked_by }: { risk_id: string; decision_id: string; linked_by: string }) => {
      const { error } = await supabase.from("risk_decision_links" as any).insert({ risk_id, decision_id, linked_by } as any);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISK_DECISION_LINKS_KEY }),
  });
};

export const useUnlinkRiskDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("risk_decision_links" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISK_DECISION_LINKS_KEY }),
  });
};

export const useLinkRiskTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ risk_id, task_id, linked_by }: { risk_id: string; task_id: string; linked_by: string }) => {
      const { error } = await supabase.from("risk_task_links" as any).insert({ risk_id, task_id, linked_by } as any);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISK_TASK_LINKS_KEY }),
  });
};

export const useUnlinkRiskTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("risk_task_links" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RISK_TASK_LINKS_KEY }),
  });
};
