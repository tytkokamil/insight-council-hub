import { useState } from "react";
import PageHint from "@/components/shared/PageHint";
import { motion } from "framer-motion";
import {
  Plus, Search, Filter, FileText, MoreHorizontal, Clock, CheckCircle2,
  TrendingUp, AlertTriangle, Zap, ArrowRight, BarChart3, Activity, DollarSign,
  ListChecks, Circle,
} from "lucide-react";
import { categoryLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import VelocityScoreWidget from "@/components/dashboard/VelocityScoreWidget";
import EscalationWidget from "@/components/dashboard/EscalationWidget";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import DecisionCostWidget from "@/components/dashboard/DecisionCostWidget";
import MomentumScoreWidget from "@/components/dashboard/MomentumScoreWidget";
import KpiOverviewWidget from "@/components/dashboard/KpiOverviewWidget";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Entwurf", variant: "secondary" },
  review: { label: "Review", variant: "outline" },
  approved: { label: "Genehmigt", variant: "default" },
  implemented: { label: "Umgesetzt", variant: "default" },
  rejected: { label: "Abgelehnt", variant: "destructive" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Niedrig", className: "text-muted-foreground" },
  medium: { label: "Mittel", className: "text-primary" },
  high: { label: "Hoch", className: "text-warning" },
  critical: { label: "Kritisch", className: "text-destructive" },
};

const Dashboard = () => {
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<any>(null);

  const isPersonal = selectedTeamId === null;
  const currentTeam = teams.find((t: any) => t.id === selectedTeamId);

  // Context-dependent filtering: personal = only mine, team = all team data
  const contextDecisions = isPersonal
    ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
    : allDecisions;
  const contextTasks = isPersonal
    ? tasks.filter(t => t.created_by === user?.id || t.assignee_id === user?.id)
    : tasks;

  const openDecisions = contextDecisions.filter(d => d.status !== "implemented" && d.status !== "rejected");
  const openTasks = contextTasks.filter(t => t.status !== "done");
  const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const doneTasks = contextTasks.filter(t => t.status === "done");

  const stats = [
    { label: isPersonal ? "Meine Entscheidungen" : "Entscheidungen", value: contextDecisions.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Offen", value: openDecisions.length, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: isPersonal ? "Meine Aufgaben" : "Aufgaben", value: contextTasks.length, icon: ListChecks, color: "text-accent-foreground", bg: "bg-accent/30" },
    { label: "Aufgaben offen", value: openTasks.length, icon: Circle, color: overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground", bg: overdueTasks.length > 0 ? "bg-destructive/10" : "bg-muted/50" },
  ];

  const decisions = contextDecisions.slice(0, 10);
  const highRiskDecisions = decisions.filter(d => (d.ai_risk_score || 0) > 60);
  const filtered = decisions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";
  const dashboardTitle = isPersonal ? "Mein Arbeitsbereich" : `Team: ${currentTeam?.name || "—"}`;
  const dashboardHint = isPersonal
    ? "Dein persönlicher Überblick: Offene Aufgaben, laufende Entscheidungen und operative Metriken."
    : "Team-Überblick: Alle Aufgaben und Entscheidungen dieses Teams.";
  const dashboardSubtitle = isPersonal
    ? `Hallo ${firstName} – das liegt heute an`
    : `${contextDecisions.length} Entscheidungen · ${openTasks.length} offene Aufgaben`;

  // Empty welcome state
  if (allDecisions.length === 0 && tasks.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-lg"
          >
            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>

            <h1 className="font-display text-3xl font-bold mb-2">
              Willkommen, {firstName}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Dein Decision Intelligence System ist bereit. Erstelle deine erste Entscheidung, um KI-gestützte Analysen zu aktivieren.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Button size="lg" onClick={() => navigate("/decisions")} className="gap-2">
                <Plus className="w-4 h-4" />
                Erste Entscheidung erstellen
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/teams")} className="gap-2">
                Team einrichten
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, title: "KI-Analyse", desc: "Automatische Risikobewertung" },
                { icon: BarChart3, title: "Echtzeit", desc: "Live-Metriken & Trends" },
                { icon: TrendingUp, title: "Prognosen", desc: "Prädiktive Szenarien" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <Card className="text-left">
                    <CardContent className="p-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <f.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{dashboardTitle}</h1>
            <PageHint>
              {dashboardHint} Für die strategische Gesamtübersicht nutze das Executive Dashboard.
            </PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{dashboardSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/tasks")} className="gap-2">
            <ListChecks className="w-4 h-4" />
            Aufgaben
          </Button>
          <Button onClick={() => navigate("/decisions")} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Entscheidung
          </Button>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="mb-8">
        <KpiOverviewWidget />
      </div>

      {/* Open Tasks – quick view */}
      {openTasks.length > 0 && (
        <CollapsibleSection
          title={`${isPersonal ? "Meine offenen" : "Offene"} Aufgaben (${openTasks.length})`}
          subtitle={overdueTasks.length > 0 ? `${overdueTasks.length} überfällig` : "Alles im Zeitplan"}
          icon={<ListChecks className="w-4 h-4 text-primary" />}
          defaultOpen={true}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {openTasks.slice(0, 5).map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => navigate("/tasks")}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === "in_progress" ? "bg-warning" : "bg-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.status === "in_progress" ? "In Arbeit" : "Offen"}
                          {task.due_date && ` · Fällig: ${format(new Date(task.due_date), "dd.MM.", { locale: de })}`}
                        </p>
                      </div>
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${
                        task.priority === "critical" ? "text-destructive" :
                        task.priority === "high" ? "text-warning" : ""
                      }`}>
                        {priorityConfig[task.priority]?.label || task.priority}
                      </Badge>
                    </div>
                  );
                })}
                {openTasks.length > 5 && (
                  <div className="px-4 py-2 text-center">
                    <Button variant="link" size="sm" onClick={() => navigate("/tasks")} className="text-xs">
                      Alle {openTasks.length} Aufgaben anzeigen <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Performance Widgets – collapsible */}
      <CollapsibleSection
        title={isPersonal ? "Meine Performance" : "Team Performance"}
        subtitle="Momentum, Kosten & Velocity"
        icon={<Activity className="w-4 h-4 text-primary" />}
        defaultOpen={false}
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <MomentumScoreWidget />
          <DecisionCostWidget />
          <VelocityScoreWidget />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EscalationWidget />
          <LeaderboardWidget />
        </div>
      </CollapsibleSection>

      {/* High risk alert – collapsible */}
      {highRiskDecisions.length > 0 && (
        <CollapsibleSection
          title={`Hohes Risiko (${highRiskDecisions.length})`}
          subtitle="Entscheidungen die Aufmerksamkeit erfordern"
          icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
          defaultOpen={true}
          className="mb-8"
        >
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="space-y-2">
                {highRiskDecisions.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors" onClick={() => setSelectedDecision(d)}>
                    <span className="text-sm font-medium">{d.title}</span>
                    <Badge variant="destructive" className="font-mono">{d.ai_risk_score}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* Recent Decisions */}
      <CollapsibleSection
        title={isPersonal ? "Meine Entscheidungen" : "Team-Entscheidungen"}
        subtitle={`${contextDecisions.length} insgesamt`}
        icon={<FileText className="w-4 h-4 text-muted-foreground" />}
        defaultOpen={true}
        className="mb-4"
      >
        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Entscheidungen durchsuchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Entscheidung</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Priorität</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Kategorie</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Risiko</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Fällig</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">Keine Entscheidungen gefunden.</td></tr>
              ) : filtered.map((decision) => {
                const status = statusConfig[decision.status];
                const priority = priorityConfig[decision.priority];
                return (
                  <tr
                    key={decision.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedDecision(decision)}
                  >
                    <td className="p-3">
                      <p className="text-sm font-medium">{decision.title}</p>
                      <p className="text-xs text-muted-foreground">{decision.assignee_id ? profileMap[decision.assignee_id] || "—" : "—"}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant={status?.variant || "secondary"} className="text-[10px]">
                        {status?.label || decision.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`text-xs font-semibold ${priority?.className || ""}`}>
                        {priority?.label || decision.priority}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground">{categoryLabels[decision.category] || decision.category}</span></td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${(decision.ai_risk_score||0) > 60 ? "bg-destructive" : (decision.ai_risk_score||0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score||0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{decision.ai_risk_score||0}%</span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{decision.due_date || "—"}</span></td>
                    <td className="p-3"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </CollapsibleSection>

      <DecisionDetailDialog
        decision={selectedDecision}
        open={!!selectedDecision}
        onOpenChange={(open) => { if (!open) setSelectedDecision(null); }}
        onUpdated={invalidate}
      />
    </AppLayout>
  );
};

export default Dashboard;
