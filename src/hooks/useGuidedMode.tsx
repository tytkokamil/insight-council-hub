import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { useDecisions, useTeams } from "@/hooks/useDecisions";

type Mode = "basic" | "advanced";

export type ProgressiveLevel = 1 | 2 | 3;

interface GuidedModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  shouldShowAdvanced: boolean;
  decisionCount: number;
  implementedCount: number;
  teamCount: number;
  progressiveLevel: ProgressiveLevel;
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

  // Progressive level based on decision count
  const progressiveLevel: ProgressiveLevel = useMemo(() => {
    // Check for override in profile (progressive_override)
    const override = localStorage.getItem("progressive-override");
    if (override === "true") return 3;
    if (decisionCount >= 10) return 3;
    if (decisionCount >= 3) return 2;
    return 1;
  }, [decisionCount]);

  // Show level-up toast
  useEffect(() => {
    const lastLevel = Number(localStorage.getItem("progressive-last-level") || "0");
    if (progressiveLevel > lastLevel && lastLevel > 0) {
      localStorage.setItem("progressive-last-level", String(progressiveLevel));
      // Toast will be triggered by the component that reads the level
    }
    if (lastLevel === 0) {
      localStorage.setItem("progressive-last-level", String(progressiveLevel));
    }
  }, [progressiveLevel]);

  const shouldShowAdvanced = decisionCount >= 20 && implementedCount >= 5 && teamCount >= 1;

  useEffect(() => {
    if (shouldShowAdvanced && mode === "basic") {
      const suggested = localStorage.getItem("guided-mode-suggested");
      if (!suggested) {
        localStorage.setItem("guided-mode-suggested", "true");
      }
    }
  }, [shouldShowAdvanced, mode]);

  const value = useMemo(() => ({
    mode, setMode, shouldShowAdvanced, decisionCount, implementedCount, teamCount, progressiveLevel,
  }), [mode, setMode, shouldShowAdvanced, decisionCount, implementedCount, teamCount, progressiveLevel]);

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

/** Level 1 paths: minimal nav */
export const LEVEL_1_PATHS = new Set([
  "/dashboard",
  "/decisions",
]);

/** Level 2 paths: expanded */
export const LEVEL_2_PATHS = new Set([
  "/dashboard",
  "/decisions",
  "/tasks",
  "/calendar",
  "/analytics",
  "/teams",
  "/settings",
]);

/** Which sidebar items are visible in basic mode */
export const BASIC_MODE_PATHS = new Set([
  "/dashboard",
  "/decisions",
  "/tasks",
  "/calendar",
  "/teams",
  "/meeting",
  "/analytics",
  "/knowledge-base",
  "/archive",
  "/settings",
]);
