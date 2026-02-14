import { useEffect, useState } from "react";
import { Building2, ChevronDown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { AnimatePresence, motion } from "framer-motion";

interface Team {
  id: string;
  name: string;
}

const TeamSwitcher = ({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuth();
  const { selectedTeamId, setSelectedTeamId } = useTeamContext();
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchTeams = async () => {
      // Get teams where user is member or admin
      const { data: memberTeams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      const memberTeamIds = memberTeams?.map((t) => t.team_id) || [];

      // Check if admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      const isAdmin = (roleData?.length ?? 0) > 0;

      let query = supabase.from("teams").select("id, name").order("name");
      if (!isAdmin && memberTeamIds.length > 0) {
        query = query.in("id", memberTeamIds);
      } else if (!isAdmin) {
        setTeams([]);
        return;
      }

      const { data } = await query;
      setTeams(data || []);
    };
    fetchTeams();
  }, [user]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const label = selectedTeam ? selectedTeam.name : "Persönlich";

  if (teams.length === 0 && !collapsed) {
    return null; // No teams, no switcher needed
  }
  if (teams.length === 0 && collapsed) {
    return null;
  }

  return (
    <div className="relative px-3 py-2 border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium hover:bg-muted/50 transition-colors"
        title={collapsed ? label : undefined}
      >
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          {selectedTeamId ? (
            <Building2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <User className="w-3.5 h-3.5 text-primary" />
          )}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-between min-w-0"
            >
              <span className="truncate text-foreground">{label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[100] w-56 mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden"
            style={{ left: collapsed ? 64 : 12, marginTop: 4 }}
          >
            <div className="py-1">
              <button
                onClick={() => { setSelectedTeamId(null); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-muted/50 ${
                  !selectedTeamId ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Persönlich
              </button>
              {teams.length > 0 && (
                <div className="border-t border-border/50 my-1" />
              )}
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => { setSelectedTeamId(team.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-muted/50 ${
                    selectedTeamId === team.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate">{team.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamSwitcher;
