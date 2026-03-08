import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FeatureFlag {
  feature_key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  category: string;
  min_plan: string;
}

const PLAN_ORDER: Record<string, number> = {
  starter: 0,
  professional: 1,
  business: 2,
  enterprise: 3,
};

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  isEnabled: (key: string) => boolean;
  toggleFlag: (key: string, enabled: boolean) => Promise<void>;
  refetch: () => void;
  isAvailableForPlan: (key: string, currentPlan: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const fetchFlags = useCallback(async () => {
    const { data } = await supabase
      .from("feature_flags")
      .select("feature_key, label, description, enabled, category, min_plan")
      .order("category")
      .order("label");
    if (data) setFlags(data);
    setLoading(false);
  }, []);

  // Check if user is org_owner — owners see everything
  useEffect(() => {
    if (!user) { setIsOwner(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setIsOwner(data?.some((r) => r.role === "org_owner") ?? false);
      });
  }, [user]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (key: string) => {
      // Org owners always have all features enabled
      if (isOwner) return true;
      const flag = flags.find((f) => f.feature_key === key);
      return flag?.enabled ?? true;
    },
    [flags, isOwner]
  );

  const toggleFlag = useCallback(
    async (key: string, enabled: boolean) => {
      setFlags((prev) =>
        prev.map((f) => (f.feature_key === key ? { ...f, enabled } : f))
      );
      await supabase
        .from("feature_flags")
        .update({ enabled })
        .eq("feature_key", key);
    },
    []
  );

  const isAvailableForPlan = useCallback(
    (key: string, currentPlan: string) => {
      const flag = flags.find((f) => f.feature_key === key);
      if (!flag) return true;
      return (PLAN_ORDER[currentPlan] ?? 0) >= (PLAN_ORDER[flag.min_plan] ?? 0);
    },
    [flags]
  );

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, toggleFlag, refetch: fetchFlags, isAvailableForPlan }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return context;
};
