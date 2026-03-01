import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions } from "@/hooks/useDecisions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FreemiumLimits {
  plan: string;
  isFree: boolean;
  /** Current decision count for this user */
  decisionCount: number;
  /** Max decisions allowed (null = unlimited) */
  maxDecisions: number | null;
  /** Whether creating a new decision would exceed the limit */
  isDecisionLimitReached: boolean;
  /** Whether teams feature is available */
  teamsAvailable: boolean;
  /** Whether AI Daily Brief is available */
  aiBriefAvailable: boolean;
  /** Whether SLA system is available */
  slaAvailable: boolean;
  /** Whether Automation Rules are available */
  automationAvailable: boolean;
  /** Whether exports have branding */
  exportHasBranding: boolean;
  /** Audit trail retention days (null = unlimited) */
  auditRetentionDays: number | null;
}

const PLAN_LIMITS: Record<string, {
  maxDecisions: number | null;
  teams: boolean;
  aiBrief: boolean;
  sla: boolean;
  automations: boolean;
  branding: boolean;
  auditDays: number | null;
}> = {
  free: { maxDecisions: 10, teams: false, aiBrief: false, sla: false, automations: false, branding: true, auditDays: 30 },
  starter: { maxDecisions: null, teams: true, aiBrief: true, sla: true, automations: false, branding: false, auditDays: 90 },
  pro: { maxDecisions: null, teams: true, aiBrief: true, sla: true, automations: true, branding: false, auditDays: null },
  business: { maxDecisions: null, teams: true, aiBrief: true, sla: true, automations: true, branding: false, auditDays: null },
  enterprise: { maxDecisions: null, teams: true, aiBrief: true, sla: true, automations: true, branding: false, auditDays: null },
};

export const useFreemiumLimits = (): FreemiumLimits => {
  const { user } = useAuth();
  const { data: decisions = [] } = useDecisions();

  // Get the org's current plan
  const { data: orgPlan } = useQuery({
    queryKey: ["org-plan", user?.id],
    queryFn: async () => {
      if (!user) return "free";
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      if (!profile?.org_id) return "free";
      const { data: org } = await supabase
        .from("organizations")
        .select("plan")
        .eq("id", profile.org_id)
        .single();
      return org?.plan || "free";
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const plan = orgPlan || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Count decisions created by this user (for free plan limit)
  const userDecisionCount = useMemo(() => {
    if (!user) return 0;
    return decisions.filter(d => d.created_by === user.id && !d.deleted_at).length;
  }, [decisions, user]);

  return {
    plan,
    isFree: plan === "free",
    decisionCount: userDecisionCount,
    maxDecisions: limits.maxDecisions,
    isDecisionLimitReached: limits.maxDecisions !== null && userDecisionCount >= limits.maxDecisions,
    teamsAvailable: limits.teams,
    aiBriefAvailable: limits.aiBrief,
    slaAvailable: limits.sla,
    automationAvailable: limits.automations,
    exportHasBranding: limits.branding,
    auditRetentionDays: limits.auditDays,
  };
};
