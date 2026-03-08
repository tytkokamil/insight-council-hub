import { useState, useCallback } from "react";
import type { RecentAction } from "./types";

const STORAGE_KEY = "cmd-recent-actions";
const MAX_RECENT = 5;

export const useRecentActions = () => {
  const [recentActions, setRecentActions] = useState<RecentAction[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const trackAction = useCallback((label: string, path?: string) => {
    setRecentActions((prev) => {
      const updated: RecentAction[] = [
        { label, timestamp: Date.now(), path },
        ...prev.filter((a) => a.label !== label),
      ].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentActions, trackAction };
};
