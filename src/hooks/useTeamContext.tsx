import { createContext, useContext, useState, ReactNode } from "react";

interface TeamContextType {
  selectedTeamId: string | null; // null = personal/all
  setSelectedTeamId: (id: string | null) => void;
}

const TeamContext = createContext<TeamContextType>({
  selectedTeamId: null,
  setSelectedTeamId: () => {},
});

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  return (
    <TeamContext.Provider value={{ selectedTeamId, setSelectedTeamId }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeamContext = () => useContext(TeamContext);
