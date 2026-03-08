import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions } from "@/hooks/useDecisions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FreemiumLimits {
  plan: string;
  isFree: boolean;
  isStarter: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  /** Current decision count for this user */
  decisionCount: number;
  /** Max decisions allowed (null = unlimited) */
  maxDecisions: number | null;
  /** Whether creating a new decision would exceed the limit */
  isDecisionLimitReached: boolean;
  /** Max users allowed (null = unlimited) */
  maxUsers: number | null;
  /** Max teams allowed (null = unlimited) */
  maxTeams: number | null;
  /** Max automation rules (null = unlimited) */
  maxAutomationRules: number | null;
  /** Max templates (null = unlimited) */
  maxTemplates: number | null;
  /** Max compliance frameworks (null = unlimited) */
  maxComplianceFrameworks: number | null;
  /** Whether teams feature is available */
  teamsAvailable: boolean;
  /** Whether AI Daily Brief is available */
  aiBriefAvailable: boolean;
  /** Whether SLA system is available */
  slaAvailable: boolean;
  /** Whether Automation Rules are available */
  automationAvailable: boolean;
  /** Whether analytics modules are available */
  analyticsAvailable: boolean;
  /** Whether executive hub is available */
  executiveAvailable: boolean;
  /** Whether live CoD counter is available */
  liveCodAvailable: boolean;
  /** Whether AI analysis/copilot is available */
  aiAnalysisAvailable: boolean;
  /** Whether strategy layer is available */
  strategyAvailable: boolean;
  /** Whether webhooks are available */
  webhooksAvailable: boolean;
  /** Whether exports have branding */
  exportHasBranding: boolean;
  /** Audit trail retention days (null = unlimited) */
  auditRetentionDays: number | null;
  /** Whether crypto audit trail is available */
  cryptoAuditAvailable: boolean;
  /** Whether SSO is available */
  ssoAvailable: boolean;
  /** Whether custom branding is available */
  customBrandingAvailable: boolean;
}

const PLAN_LIMITS: Record<string, {
  maxDecisions: number | null;
  maxUsers: number | null;
  maxTeams: number | null;
  maxAutomationRules: number | null;
  maxTemplates: number | null;
  maxComplianceFrameworks: number | null;
  teams: boolean;
  aiBrief: boolean;
  sla: boolean;
  automations: boolean;
  analytics: boolean;
  executive: boolean;
  liveCod: boolean;
  aiAnalysis: boolean;
  strategy: boolean;
  webhooks: boolean;
  branding: boolean;
  auditDays: number | null;
  cryptoAudit: boolean;
  sso: boolean;
  customBranding: boolean;
}> = {
  free: {
    maxDecisions: 10, maxUsers: 1, maxTeams: 1, maxAutomationRules: 0, maxTemplates: 3, maxComplianceFrameworks: 0,
    teams: false, aiBrief: false, sla: false, automations: false, analytics: false,
    executive: false, liveCod: false, aiAnalysis: false, strategy: false, webhooks: false,
    branding: true, auditDays: 30, cryptoAudit: false, sso: false, customBranding: false,
  },
  starter: {
    maxDecisions: null, maxUsers: 8, maxTeams: 3, maxAutomationRules: 5, maxTemplates: null, maxComplianceFrameworks: 1,
    teams: true, aiBrief: false, sla: true, automations: true, analytics: false,
    executive: false, liveCod: false, aiAnalysis: false, strategy: false, webhooks: false,
    branding: true, auditDays: 365, cryptoAudit: false, sso: false, customBranding: false,
  },
  professional: {
    maxDecisions: null, maxUsers: 25, maxTeams: null, maxAutomationRules: null, maxTemplates: null, maxComplianceFrameworks: null,
    teams: true, aiBrief: true, sla: true, automations: true, analytics: true,
    executive: true, liveCod: true, aiAnalysis: true, strategy: true, webhooks: true,
    branding: false, auditDays: null, cryptoAudit: true, sso: false, customBranding: false,
  },
  enterprise: {
    maxDecisions: null, maxUsers: null, maxTeams: null, maxAutomationRules: null, maxTemplates: null, maxComplianceFrameworks: null,
    teams: true, aiBrief: true, sla: true, automations: true, analytics: true,
    executive: true, liveCod: true, aiAnalysis: true, strategy: true, webhooks: true,
    branding: false, auditDays: null, cryptoAudit: true, sso: true, customBranding: true,
  },
};

export const useFreemiumLimits = (): FreemiumLimits => {
  const { user } = useAuth();
  const { data: decisions = [] } = useDecisions();

  const { data: orgData } = useQuery({
    queryKey: ["org-plan", user?.id],
    queryFn: async () => {
      if (!user) return { plan: "free", subscription_status: "active" };
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      if (!profile?.org_id) return { plan: "free", subscription_status: "active" };
      const { data: org } = await supabase
        .from("organizations")
        .select("plan, subscription_status")
        .eq("id", profile.org_id)
        .single();
      return {
        plan: org?.plan || "free",
        subscription_status: (org as any)?.subscription_status || "active",
      };
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // During trial, grant Professional-level access; suspended forces free
  const rawPlan = orgData?.plan || "free";
  const subscriptionStatus = orgData?.subscription_status || "active";
  const plan = subscriptionStatus === "trialing" ? "professional"
    : subscriptionStatus === "past_due" ? rawPlan
    : subscriptionStatus === "suspended" ? "free"
    : rawPlan;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const userDecisionCount = useMemo(() => {
    if (!user) return 0;
    return decisions.filter(d => d.created_by === user.id && !d.deleted_at).length;
  }, [decisions, user]);

  return {
    plan,
    isFree: plan === "free",
    isStarter: plan === "starter",
    isPro: plan === "professional",
    isEnterprise: plan === "enterprise",
    decisionCount: userDecisionCount,
    maxDecisions: limits.maxDecisions,
    isDecisionLimitReached: limits.maxDecisions !== null && userDecisionCount >= limits.maxDecisions,
    maxUsers: limits.maxUsers,
    maxTeams: limits.maxTeams,
    maxAutomationRules: limits.maxAutomationRules,
    maxTemplates: limits.maxTemplates,
    maxComplianceFrameworks: limits.maxComplianceFrameworks,
    teamsAvailable: limits.teams,
    aiBriefAvailable: limits.aiBrief,
    slaAvailable: limits.sla,
    automationAvailable: limits.automations,
    analyticsAvailable: limits.analytics,
    executiveAvailable: limits.executive,
    liveCodAvailable: limits.liveCod,
    aiAnalysisAvailable: limits.aiAnalysis,
    strategyAvailable: limits.strategy,
    webhooksAvailable: limits.webhooks,
    exportHasBranding: limits.branding,
    auditRetentionDays: limits.auditDays,
    cryptoAuditAvailable: limits.cryptoAudit,
    ssoAvailable: limits.sso,
    customBrandingAvailable: limits.customBranding,
  };
};
