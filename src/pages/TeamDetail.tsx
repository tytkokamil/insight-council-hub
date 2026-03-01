import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, MessageCircle, Settings, BarChart3, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import TeamOverviewTab from "@/components/teams/TeamOverviewTab";
import TeamCommandCenter from "@/components/teams/TeamCommandCenter";
import TeamHealthIndicator from "@/components/teams/TeamHealthIndicator";
import TeamChat from "@/components/teams/TeamChat";
import SlaConfigPanel from "@/components/settings/SlaConfigPanel";
import TeamDefaultsConfig from "@/components/teams/TeamDefaultsConfig";
import CodConfigPanel from "@/components/teams/CodConfigPanel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "command";
  const initialLinkedDecisionId = searchParams.get("linkDecision") || null;
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTeamAdmin, setIsTeamAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

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

        <Tabs defaultValue={initialTab} onValueChange={(v) => { searchParams.set("tab", v); setSearchParams(searchParams, { replace: true }); }}>
          <div className="sticky top-0 z-20 bg-background pb-2 -mt-2 pt-2">
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
          </div>

          <TabsContent value="command" className="mt-6">
            <TeamCommandCenter teamId={team.id} />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <TeamOverviewTab teamId={team.id} teamName={team.name} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <TeamChat teamId={team.id} teamName={team.name} initialLinkedDecisionId={initialLinkedDecisionId} />
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

                <hr className="border-border/40" />

                <div>
                  <h2 className="text-sm font-semibold mb-1">{t("cod.teamTitle", "Cost-of-Delay-Konfiguration")}</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("cod.teamDesc", "Definiere team-spezifische Parameter für die Berechnung von Verzögerungskosten.")}
                  </p>
                  <CodConfigPanel teamId={team.id} />
                </div>

                <hr className="border-border/40" />

                <div>
                  <h2 className="text-sm font-semibold mb-1">{t("teamDetail.slaConfig")}</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("teamDetail.slaConfigDesc")}
                  </p>
                  <SlaConfigPanel />
                </div>

                <div className="mt-12" />

                <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-5">
                  <h2 className="text-sm font-semibold text-destructive mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t("teamDetail.dangerZone")}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("teamDetail.deleteTeamDesc")}
                  </p>
                  <p className="text-xs text-destructive/80 mb-4 font-medium">
                    {t("teamDetail.deleteTeamWarning")}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Teamname eingeben um zu bestätigen:</label>
                      <Input
                        placeholder={team.name}
                        value={deleteConfirmName}
                        onChange={e => setDeleteConfirmName(e.target.value)}
                        className="max-w-xs h-8 text-sm"
                      />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`gap-1.5 ${deleteConfirmName === team.name ? "text-destructive border-destructive/40 hover:bg-destructive/10" : ""}`}
                          disabled={deleting || deleteConfirmName !== team.name}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("teamDetail.deleteTeam")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("teamDetail.deleteTeam")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("teamDetail.deleteTeamConfirm", { name: team.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                            onClick={async () => {
                              setDeleting(true);
                              try {
                                const { data, error } = await supabase.functions.invoke("delete-team", {
                                  body: { teamId: team.id },
                                });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                toast.success(t("teamDetail.deleteTeamSuccess"));
                                navigate("/teams");
                              } catch (err: any) {
                                toast.error(t("teamDetail.deleteTeamError"), { description: err.message });
                                setDeleting(false);
                              }
                            }}
                          >
                            {deleting ? "..." : t("teamDetail.deleteTeam")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
