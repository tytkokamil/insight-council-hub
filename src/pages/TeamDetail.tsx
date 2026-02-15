import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import TeamOverviewTab from "@/components/teams/TeamOverviewTab";
import TeamChat from "@/components/teams/TeamChat";

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          <p className="text-sm text-muted-foreground">Team nicht gefunden</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/teams")}>
            Zurück zu Teams
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/teams")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Team</p>
            <h1 className="font-display text-xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <TeamOverviewTab teamId={team.id} teamName={team.name} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="rounded-lg border border-border overflow-hidden">
              <TeamChat teamId={team.id} teamName={team.name} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TeamDetail;
