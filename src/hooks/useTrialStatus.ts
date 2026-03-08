import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TrialStatus {
  isTrialing: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
  subscriptionStatus: string;
  plan: string;
  isPastDue: boolean;
  isSuspended: boolean;
  pastDueDaysLeft: number;
}

export const useTrialStatus = (): TrialStatus => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["trial-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      if (!profile?.org_id) return null;
      const { data: org } = await supabase
        .from("organizations")
        .select("plan, trial_ends_at, subscription_status, payment_failed_at")
        .eq("id", profile.org_id)
        .single();
      return org;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const trialEndsAt = data?.trial_ends_at || null;
  const subscriptionStatus = (data as any)?.subscription_status || "active";
  const plan = data?.plan || "free";

  const isTrialing = subscriptionStatus === "trialing";
  const isTrialExpired = subscriptionStatus === "trial_expired";
  const isPastDue = subscriptionStatus === "past_due";
  const isSuspended = subscriptionStatus === "suspended";

  let trialDaysLeft = 999;
  if (trialEndsAt) {
    trialDaysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000));
  }

  // Calculate days left before suspension (10 day grace period from payment_failed_at)
  let pastDueDaysLeft = 10;
  const paymentFailedAt = (data as any)?.payment_failed_at;
  if (isPastDue && paymentFailedAt) {
    const daysSinceFailure = Math.floor((Date.now() - new Date(paymentFailedAt).getTime()) / 86400000);
    pastDueDaysLeft = Math.max(0, 10 - daysSinceFailure);
  }

  return {
    isTrialing,
    isTrialExpired,
    trialDaysLeft,
    trialEndsAt,
    subscriptionStatus,
    plan,
    isPastDue,
    isSuspended,
    pastDueDaysLeft,
  };
};
