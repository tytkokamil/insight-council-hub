import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { useDecisions, useTeams } from "@/hooks/useDecisions";

type Mode = "basic" | "advanced";

interface GuidedModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  shouldShowAdvanced: boolean; // progressive disclosure threshold met
  decisionCount: number;
  implementedCount: number;
  teamCount: number;
}

const GuidedModeContext = createContext<GuidedModeContextType | undefined>(undefined);

export const GuidedModeProvider = ({ children }: { children: ReactNode }) => {
  const { data: decisions = [] } = useDecisions();
  const { data: teams = [] } = useTeams();

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem("guided-mode");
    return (stored === "basic" || stored === "advanced") ? stored : "basic";
  });

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    localStorage.setItem("guided-mode", m);
  }, []);

  const decisionCount = decisions.length;
  const implementedCount = decisions.filter(d => d.status === "implemented").length;
  const teamCount = teams.length;

  // Progressive disclosure: suggest advanced when thresholds met
  const shouldShowAdvanced = decisionCount >= 20 && implementedCount >= 5 && teamCount >= 1;

  // Auto-suggest switch when threshold crossed (one-time)
  useEffect(() => {
    if (shouldShowAdvanced && mode === "basic") {
      const suggested = localStorage.getItem("guided-mode-suggested");
      if (!suggested) {
        localStorage.setItem("guided-mode-suggested", "true");
        // Don't auto-switch, just mark as suggested
      }
    }
  }, [shouldShowAdvanced, mode]);

  const value = useMemo(() => ({
    mode, setMode, shouldShowAdvanced, decisionCount, implementedCount, teamCount,
  }), [mode, setMode, shouldShowAdvanced, decisionCount, implementedCount, teamCount]);

  return (
    <GuidedModeContext.Provider value={value}>
      {children}
    </GuidedModeContext.Provider>
  );
};

export const useGuidedMode = () => {
  const context = useContext(GuidedModeContext);
  if (!context) throw new Error("useGuidedMode must be used within GuidedModeProvider");
  return context;
};

/** Which sidebar items are visible in basic mode */
export const BASIC_MODE_PATHS = new Set([
  "/dashboard",
  "/decisions",
  "/tasks",
  "/teams",
  "/calendar",
  "/meeting",
  "/knowledge",
  "/settings",
]);
