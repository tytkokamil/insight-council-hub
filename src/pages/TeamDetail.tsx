import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MessageCircle, Settings, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import TeamOverviewTab from "@/components/teams/TeamOverviewTab";
import TeamCommandCenter from "@/components/teams/TeamCommandCenter";
import TeamHealthIndicator from "@/components/teams/TeamHealthIndicator";
import TeamChat from "@/components/teams/TeamChat";
import SlaConfigPanel from "@/components/settings/SlaConfigPanel";
import TeamDefaultsConfig from "@/components/teams/TeamDefaultsConfig";

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTeamAdmin, setIsTeamAdmin] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();
      setTeam(data);
      setLoading(false);
    };
    fetchTeam();
  }, [teamId]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!teamId || !user) return;
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
      if (roleData?.role === "org_owner" || roleData?.role === "org_admin") {
        setIsTeamAdmin(true);
        return;
      }
      const { data: memberData } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();
      setIsTeamAdmin(memberData?.role === "admin" || memberData?.role === "lead");
    };
    checkAdmin();
  }, [teamId, user]);

  if (loading) {
    return (
      <AppLayout>
        <AnalysisPageSkeleton cards={3} sections={1} />
      </AppLayout>
    );
  }

  if (!team) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-sm text-muted-foreground">{t("teamDetail.notFound")}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/teams")}>
            {t("teamDetail.backToTeams")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/teams")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]">{t("teamDetail.team")}</p>
              <TeamHealthIndicator teamId={team.id} />
            </div>
            <h1 className="font-display text-xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>
            )}
          </div>
        </div>

        <Tabs defaultValue="command">
          <TabsList>
            <TabsTrigger value="command" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              {t("teamDetail.commandCenter")}
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {t("teamDetail.members")}
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              {t("teamDetail.chat")}
            </TabsTrigger>
            {isTeamAdmin && (
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                {t("teamDetail.settings")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="command" className="mt-6">
            <TeamCommandCenter teamId={team.id} />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <TeamOverviewTab teamId={team.id} teamName={team.name} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="rounded-lg border border-border overflow-hidden">
              <TeamChat teamId={team.id} teamName={team.name} />
            </div>
          </TabsContent>

          {isTeamAdmin && (
            <TabsContent value="settings" className="mt-6">
              <div className="space-y-8">
                <div>
                  <h2 className="text-sm font-semibold mb-1">{t("teamDetail.smartDefaults")}</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("teamDetail.smartDefaultsDesc")}
                  </p>
                  <TeamDefaultsConfig teamId={team.id} />
                </div>

                <hr className="border-border" />

                <div>
                  <h2 className="text-sm font-semibold mb-1">{t("teamDetail.slaConfig")}</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("teamDetail.slaConfigDesc")}
                  </p>
                  <SlaConfigPanel />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TeamDetail;
