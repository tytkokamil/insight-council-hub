import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users as UsersIcon, UserPlus, ArrowRight, Mail } from "lucide-react";
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12"
        >
          <div className="max-w-md mx-auto text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 blur-xl animate-glow-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 flex items-center justify-center">
                <UsersIcon className="w-9 h-9 text-primary" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">Erstelle dein erstes Team</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Teams ermöglichen kollaborative Entscheidungsprozesse. Lade Mitglieder per E-Mail ein und teile Entscheidungen teamübergreifend.
            </p>
            <Button variant="hero" size="lg" onClick={() => setShowCreate(true)} className="gap-2 mb-8">
              <Plus className="w-5 h-5" />
              Team erstellen
            </Button>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail, label: "E-Mail Einladungen" },
                { icon: UsersIcon, label: "Team-basierte Sichtbarkeit" },
              ].map((f, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <f.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setSelectedTeam(team)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-primary" />
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); }}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{team.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{team.description || "Keine Beschreibung"}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersIcon className="w-4 h-4" />
                  {team.team_members?.[0]?.count || 0} Mitglieder
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
