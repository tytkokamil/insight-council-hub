import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHint from "@/components/shared/PageHint";
import { Plus, Users as UsersIcon, UserPlus, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Verwaltung</p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">Teams</h1>
            <PageHint>
              Erstelle Teams und lade Mitglieder per E-Mail ein. Entscheidungen können Teams zugeordnet werden, um Verantwortlichkeiten klar zu definieren.
            </PageHint>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-10">
              <div className="max-w-md mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <UsersIcon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Erstelle dein erstes Team</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Teams ermöglichen kollaborative Entscheidungsfindung. Lade Mitglieder per E-Mail ein und teile Entscheidungen.
                </p>
                <Button onClick={() => setShowCreate(true)} className="gap-2 mb-6">
                  <Plus className="w-4 h-4" />
                  Team erstellen
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Mail, label: "E-Mail-Einladungen" },
                    { icon: UsersIcon, label: "Team-Sichtbarkeit" },
                  ].map((f, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border">
                      <f.icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setSelectedTeam(team)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-primary" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); }}>
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <h3 className="font-display font-semibold mb-0.5">{team.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{team.description || "Keine Beschreibung"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <UsersIcon className="w-3 h-3" />
                      {team.team_members?.[0]?.count || 0} Mitglieder
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
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
