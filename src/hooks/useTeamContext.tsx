import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface TeamContextType {
  selectedTeamId: string | null; // null = personal/all
  setSelectedTeamId: (id: string | null) => void;
}

const STORAGE_KEY = "decivio_team_id";

const TeamContext = createContext<TeamContextType>({
  selectedTeamId: null,
  setSelectedTeamId: () => {},
});

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeamId, setSelectedTeamIdRaw] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const setSelectedTeamId = useCallback((id: string | null) => {
    setSelectedTeamIdRaw(id);
    try {
      if (id) {
        sessionStorage.setItem(STORAGE_KEY, id);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  return (
    <TeamContext.Provider value={{ selectedTeamId, setSelectedTeamId }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeamContext = () => useContext(TeamContext);
