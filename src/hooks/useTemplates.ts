import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { decisionTemplates, type DecisionTemplate } from "@/lib/decisionTemplates";
import { toast } from "sonner";
import i18n from "@/i18n";

export interface DbTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  priority: string;
  description: string;
  default_duration_days: number;
  required_fields: any[];
  approval_steps: any[];
  conditional_rules: any[];
  governance_notes: string | null;
  when_to_use: string | null;
  icon_color: string | null;
  version: number;
  is_system: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toDbRow(t: DecisionTemplate, userId: string): Record<string, unknown> {
  return {
    name: t.name,
    slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    category: t.category,
    priority: t.priority,
    description: t.description,
    default_duration_days: t.defaultDurationDays,
    required_fields: t.requiredFields,
    approval_steps: t.approvalSteps,
    conditional_rules: t.conditionalRules || [],
    governance_notes: t.governanceNotes || null,
    when_to_use: t.whenToUse || null,
    icon_color: t.iconColor || null,
    version: t.version,
    is_system: true,
    created_by: userId,
  };
}

export function toDecisionTemplate(row: DbTemplate): DecisionTemplate {
  return {
    name: row.name,
    category: row.category,
    priority: row.priority,
    description: row.description,
    defaultDurationDays: row.default_duration_days,
    requiredFields: row.required_fields as any,
    approvalSteps: row.approval_steps as any,
    conditionalRules: row.conditional_rules as any,
    governanceNotes: row.governance_notes || undefined,
    whenToUse: row.when_to_use || undefined,
    iconColor: row.icon_color || undefined,
    version: row.version,
  };
}

const t = (key: string, opts?: any): string => i18n.t(key, opts) as string;

export function useTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ["decision_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decision_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DbTemplate[];
    },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const rows = decisionTemplates.map(tpl => toDbRow(tpl, user.id));
      const { error } = await supabase.from("decision_templates").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision_templates"] });
      toast.success(t("useTemplates.seedSuccess"));
    },
    onError: (err: Error) => {
      toast.error(t("useTemplates.seedError", { error: err.message }));
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DbTemplate> }) => {
      const { error } = await supabase.from("decision_templates").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision_templates"] });
      toast.success(t("useTemplates.saved"));
    },
    onError: (err: Error) => {
      toast.error(t("useTemplates.saveError", { error: err.message }));
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { error } = await supabase.from("decision_templates").insert(row as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision_templates"] });
      toast.success(t("useTemplates.created"));
    },
    onError: (err: Error) => {
      toast.error(t("useTemplates.createError", { error: err.message }));
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("decision_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision_templates"] });
      toast.success(t("useTemplates.deleted"));
    },
    onError: (err: Error) => {
      toast.error(t("useTemplates.deleteError", { error: err.message }));
    },
  });

  return {
    templates,
    isLoading,
    refetch,
    seedDefaults,
    updateTemplate,
    createTemplate,
    deleteTemplate,
  };
}
