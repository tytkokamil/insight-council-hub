import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Plus, Users as UsersIcon, ArrowRight, Mail, Shield, MessageSquare, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";

const Teams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [canCreateTeam, setCanCreateTeam] = useState(false);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*, team_members(count)")
      .order("created_at", { ascending: false });
    if (data) setTeams(data);
  };

  useEffect(() => { fetchTeams(); }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).single().then(({ data }) => {
      setCanCreateTeam(data?.role === "org_owner" || data?.role === "org_admin");
    });
  }, [user]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("teams.management")}</p>
          <h1 className="font-display text-xl font-bold">{t("teams.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <PageHelpButton title={t("teams.title")} description={t("teams.helpDesc")} />
          {canCreateTeam && (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("teams.newTeam")}
            </Button>
          )}
        </div>
      </div>

      {teams.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-10">
              <div className="max-w-md mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <UsersIcon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{t("teams.emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t("teams.emptyDesc")}</p>
                <p className="text-xs text-primary/80 mb-6 flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t("teams.emptyStatistic")}
                </p>
                <Button onClick={() => setShowCreate(true)} className="gap-2 mb-6">
                  <Plus className="w-4 h-4" />
                  {t("teams.createTeam")}
                </Button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: Mail, label: t("teams.emailInvites"), desc: t("teams.emailInvitesDesc") },
                    { icon: Shield, label: t("teams.roleManagement"), desc: t("teams.roleManagementDesc") },
                    { icon: MessageSquare, label: t("teams.teamChat"), desc: t("teams.teamChatDesc") },
                    { icon: BarChart3, label: t("teams.teamAnalytics"), desc: t("teams.teamAnalyticsDesc") },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                      <f.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <p className="text-xs font-medium">{f.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
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
              <Card className="hover:border-primary/30 transition-all cursor-pointer group" onClick={() => navigate(`/teams/${team.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-display font-semibold mb-0.5">{team.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{team.description || t("teams.noDescription")}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <UsersIcon className="w-3 h-3" />
                      {team.team_members?.[0]?.count || 0} {t("teams.members")}
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
    </AppLayout>
  );
};

export default Teams;