import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users as UsersIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";
import ManageTeamDialog from "@/components/teams/ManageTeamDialog";

const Teams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*, team_members(count)")
      .order("created_at", { ascending: false });
    if (data) setTeams(data);
  };

  useEffect(() => { fetchTeams(); }, []);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Verwalte deine Teams und Mitglieder</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setShowCreate(true)}>
          <Plus className="w-5 h-5" />
          Neues Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">Noch keine Teams</h3>
          <p className="text-muted-foreground mb-6">Erstelle dein erstes Team, um Entscheidungen gemeinsam zu treffen.</p>
          <Button variant="hero" onClick={() => setShowCreate(true)}>
            <Plus className="w-5 h-5" />
            Team erstellen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedTeam(team)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-primary" />
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); }}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{team.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{team.description || "Keine Beschreibung"}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="w-4 h-4" />
                {team.team_members?.[0]?.count || 0} Mitglieder
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CreateTeamDialog open={showCreate} onOpenChange={setShowCreate} onCreated={fetchTeams} />
      <ManageTeamDialog team={selectedTeam} open={!!selectedTeam} onOpenChange={(o) => { if (!o) setSelectedTeam(null); }} onUpdated={fetchTeams} />
    </AppLayout>
  );
};

export default Teams;
