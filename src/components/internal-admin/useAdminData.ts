import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAction() {
  const [loading, setLoading] = useState(false);

  const invoke = useCallback(async (action: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action, ...payload },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { invoke, loading };
}

export function useAdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: result, error: fnErr } = await supabase.functions.invoke("admin-analytics", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (fnErr) throw fnErr;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  }, []);

  return { data, loading, error, fetch };
}
