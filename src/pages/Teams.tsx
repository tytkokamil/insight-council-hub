import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Plus, Users as UsersIcon, ArrowRight, Mail, Shield, MessageSquare, BarChart3, TrendingUp, Gauge, Clock, AlertTriangle, Percent, Timer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import AppLayout from "@/components/layout/AppLayout";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";
import HeroKpi from "@/components/shared/HeroKpi";
import PowerGrid from "@/components/shared/PowerGrid";
import { differenceInDays } from "date-fns";

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [canCreateTeam, setCanCreateTeam] = useState(false);
  const { data: decisions = [] } = useDecisions();
  const { data: tasks = [] } = useTasks();
  const { data: risks = [] } = useRisks();

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

  const teamKpis = useMemo(() => {
    if (teams.length === 0) return null;
    const now = new Date();
    const teamDecisions = decisions.filter(d => d.team_id);
    const active = teamDecisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1).length;
    const implemented = teamDecisions.filter(d => d.status === "implemented" && d.implemented_at);
    const completionRate = teamDecisions.length > 0 ? Math.round((implemented.length / teamDecisions.length) * 100) : 0;
    const avgDuration = implemented.length > 0
      ? Math.round(implemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / implemented.length) : 0;
    const highRisk = active.filter(d => (d.ai_risk_score || 0) >= 60).length;
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now).length;
    const withDueDate = active.filter(d => d.due_date);
    const onTrack = withDueDate.filter(d => new Date(d.due_date!) >= now).length;
    const sla = withDueDate.length > 0 ? Math.round((onTrack / withDueDate.length) * 100) : 100;
    const healthRatio = active.length > 0 ? Math.max(0, 1 - (escalated * 0.15 + overdue * 0.1)) : 1;
    const healthScore = Math.round(Math.min(100, healthRatio * 100));

    return { healthScore, decisionLoad: active.length, highRisk, completionRate, avgDuration, escalated, sla, overdue };
  }, [teams, decisions]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Verwaltung</p>
          <h1 className="font-display text-xl font-bold">Teams</h1>
        </div>
        <div className="flex items-center gap-2">
          <PageHelpButton title="Teams" description="Erstelle Teams und lade Mitglieder per E-Mail ein. Entscheidungen können Teams zugeordnet werden, um Verantwortlichkeiten klar zu definieren." />
          {canCreateTeam && (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Neues Team
            </Button>
          )}
        </div>
      </div>

      {/* ═══ LAYER 1 + 2 ═══ */}
      {teams.length > 0 && teamKpis && (
        <>
          <div className="mb-6">
            <HeroKpi items={[
              { label: "Team Health", value: `${teamKpis.healthScore}%`, icon: Gauge, sentiment: teamKpis.healthScore >= 70 ? "positive" : teamKpis.healthScore >= 45 ? "warning" : "critical" },
              { label: "Decision Load", value: `${teamKpis.decisionLoad}`, icon: Target, sentiment: "neutral" },
              { label: "Risk Exposure", value: `${teamKpis.highRisk}`, icon: Shield, sentiment: teamKpis.highRisk > 0 ? "warning" : "positive" },
              { label: "Execution Rate", value: `${teamKpis.completionRate}%`, icon: Percent, sentiment: teamKpis.completionRate >= 60 ? "positive" : "warning" },
            ]} />
          </div>
          <div className="mb-8">
            <PowerGrid title="Team-Matrix" columns={4} items={[
              { label: "Aktive Entsch.", value: teamKpis.decisionLoad },
              { label: "Ø Dauer", value: `${teamKpis.avgDuration}d`, icon: Timer },
              { label: "Eskalationen", value: teamKpis.escalated, icon: AlertTriangle, sentiment: teamKpis.escalated > 0 ? "warning" : "positive" },
              { label: "SLA Compliance", value: `${teamKpis.sla}%`, icon: Clock, sentiment: teamKpis.sla >= 80 ? "positive" : "warning" },
              { label: "Completion Rate", value: `${teamKpis.completionRate}%`, icon: Percent },
              { label: "Überfällig", value: teamKpis.overdue, sentiment: teamKpis.overdue > 0 ? "critical" : "positive" },
              { label: "High Risk", value: teamKpis.highRisk, icon: Shield },
              { label: "Teams", value: teams.length, icon: UsersIcon },
            ]} />
          </div>
        </>
      )}

      {teams.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-10">
              <div className="max-w-md mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <UsersIcon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Governance beginnt im Team</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Teams ermöglichen kollaborative Entscheidungsfindung mit klaren Rollen, SLA-Tracking und Review-Workflows.
                </p>
                <p className="text-xs text-primary/80 mb-6 flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Teams mit strukturierter Governance entscheiden 38% schneller.
                </p>
                <Button onClick={() => setShowCreate(true)} className="gap-2 mb-6">
                  <Plus className="w-4 h-4" />
                  Team erstellen
                </Button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: Mail, label: "E-Mail-Einladungen", desc: "Kollegen einladen" },
                    { icon: Shield, label: "Rollenmanagement", desc: "Lead, Member, Viewer" },
                    { icon: MessageSquare, label: "Team-Chat", desc: "Direkte Kommunikation" },
                    { icon: BarChart3, label: "Team-Analytik", desc: "Performance messen" },
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
    </AppLayout>
  );
};

export default Teams;
