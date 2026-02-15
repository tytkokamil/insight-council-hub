import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  feature_key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  category: string;
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  isEnabled: (key: string) => boolean;
  toggleFlag: (key: string, enabled: boolean) => Promise<void>;
  refetch: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    const { data } = await supabase
      .from("feature_flags")
      .select("feature_key, label, description, enabled, category")
      .order("category")
      .order("label");
    if (data) setFlags(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (key: string) => {
      const flag = flags.find((f) => f.feature_key === key);
      return flag?.enabled ?? true; // default to enabled if not found
    },
    [flags]
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

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, toggleFlag, refetch: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return context;
};
