import { useState, useEffect } from "react";
import TeamsPageSkeleton from "@/components/teams/TeamsPageSkeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/shared/PageHeader";
import { Plus, Users as UsersIcon, ArrowRight, Mail, Shield, MessageSquare, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";

const Teams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [canCreateTeam, setCanCreateTeam] = useState(false);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*, team_members(count)")
      .order("created_at", { ascending: false });
    setTeams(data ?? []);
  };

  useEffect(() => { fetchTeams(); }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).single().then(({ data }) => {
      setCanCreateTeam(data?.role === "org_owner" || data?.role === "org_admin");
    });
  }, [user]);

  if (teams === null) {
    return <AppLayout><TeamsPageSkeleton /></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader
        title={t("teams.title")}
        subtitle={t("teams.management")}
        role="execution"
        help={{ title: t("teams.title"), description: t("teams.helpDesc") }}
        primaryAction={
          canCreateTeam && teams.length > 0 ? (
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("teams.newTeam")}
            </Button>
          ) : undefined
        }
      />

      {teams.length === 0 ? (
        <EmptyAnalysisState
          icon={UsersIcon}
          title={t("teams.emptyTitle")}
          description={t("teams.emptyDesc")}
          ctaLabel={t("teams.createTeam")}
          onCtaClick={() => setShowCreate(true)}
          motivation={t("teams.emptyStatistic")}
          features={[
            { icon: Mail, label: t("teams.emailInvites"), desc: t("teams.emailInvitesDesc") },
            { icon: Shield, label: t("teams.roleManagement"), desc: t("teams.roleManagementDesc") },
            { icon: MessageSquare, label: t("teams.teamChat"), desc: t("teams.teamChatDesc") },
          ]}
        />
      ) : (
        <div className="widget-grid-3">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 cursor-pointer group border-border/60" onClick={() => navigate(`/teams/${team.id}`)}>
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
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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