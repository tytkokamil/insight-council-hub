import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Default terms that can be customized per organization */
export const DEFAULT_TERMS = [
  { key: "decision", de: "Entscheidung", en: "Decision" },
  { key: "reviewer", de: "Reviewer", en: "Reviewer" },
  { key: "approved", de: "Genehmigt", en: "Approved" },
  { key: "rejected", de: "Abgelehnt", en: "Rejected" },
  { key: "open", de: "Offen", en: "Open" },
  { key: "team", de: "Team", en: "Team" },
] as const;

export type TermKey = (typeof DEFAULT_TERMS)[number]["key"];

interface TerminologyContextType {
  /** Replace a default term with the org's custom term. Falls back to default. */
  term: (key: TermKey) => string;
  /** All loaded custom mappings: default_term -> custom_term */
  customTerms: Record<string, string>;
  /** Whether data is still loading */
  loading: boolean;
  /** Reload from DB */
  refresh: () => Promise<void>;
}

const TerminologyContext = createContext<TerminologyContextType>({
  term: (key) => key,
  customTerms: {},
  loading: true,
  refresh: async () => {},
});

export const TerminologyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [customTerms, setCustomTerms] = useState<Record<string, string>>({});
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTerminology = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Get org_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    const oid = profile?.org_id;
    setOrgId(oid || null);

    if (!oid) { setLoading(false); return; }

    const { data } = await supabase
      .from("terminology")
      .select("default_term, custom_term")
      .eq("org_id", oid);

    const map: Record<string, string> = {};
    (data || []).forEach(row => {
      if (row.custom_term && row.custom_term.trim()) {
        map[row.default_term] = row.custom_term;
      }
    });
    setCustomTerms(map);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTerminology(); }, [fetchTerminology]);

  const term = useCallback((key: TermKey): string => {
    // Check if there's a custom term for this key
    if (customTerms[key]) return customTerms[key];

    // Fall back to the default label based on current locale
    const lang = document.documentElement.lang || "de";
    const def = DEFAULT_TERMS.find(d => d.key === key);
    if (!def) return key;
    return lang.startsWith("en") ? def.en : def.de;
  }, [customTerms]);

  return (
    <TerminologyContext.Provider value={{ term, customTerms, loading, refresh: fetchTerminology }}>
      {children}
    </TerminologyContext.Provider>
  );
};

export const useTerminology = () => useContext(TerminologyContext);
