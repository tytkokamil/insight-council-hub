import { useState } from "react";
import PageHint from "@/components/shared/PageHint";
import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, MoreHorizontal, Clock, CheckCircle2, TrendingUp, AlertTriangle, Zap, ArrowRight, BarChart3 } from "lucide-react";
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
import { useDecisions, useProfiles, buildProfileMap, useInvalidateDecisions } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";

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
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);
  const { user } = useAuth();
  const navigate = useNavigate();

  const decisions = allDecisions.slice(0, 10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<any>(null);

  const highRiskDecisions = decisions.filter(d => (d.ai_risk_score || 0) > 60);

  const stats = [
    { label: "Gesamt", value: allDecisions.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "In Review", value: allDecisions.filter(d => d.status === "review").length, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Genehmigt", value: allDecisions.filter(d => d.status === "approved").length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Hohes Risiko", value: allDecisions.filter(d => (d.ai_risk_score || 0) > 60).length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const filtered = decisions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";

  // Empty welcome state
  if (allDecisions.length === 0) {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <PageHint>
              Dein Echtzeit-Überblick über alle Entscheidungen. Die KPI-Widgets zeigen Velocity, Momentum, Kosten und Eskalationen. Klicke auf eine Entscheidung, um Details zu sehen.
            </PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Überblick über deine Entscheidungen</p>
        </div>
        <Button onClick={() => navigate("/decisions")} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Entscheidung
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 stagger-children">
        <MomentumScoreWidget />
        <DecisionCostWidget />
        <VelocityScoreWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 stagger-children">
        <EscalationWidget />
        <LeaderboardWidget />
      </div>

      {/* High risk alert */}
      {highRiskDecisions.length > 0 && (
        <Card className="mb-6 border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Hohes Risiko</h3>
                <p className="text-xs text-muted-foreground">Diese Entscheidungen erfordern Aufmerksamkeit</p>
              </div>
            </div>
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
      )}

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
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Priorität</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Kategorie</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Risiko</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fällig</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="stagger-children">
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
                  <td className="p-3">
                    <span className={`text-xs font-semibold ${priority?.className || ""}`}>
                      {priority?.label || decision.priority}
                    </span>
                  </td>
                  <td className="p-3"><span className="text-xs text-muted-foreground">{categoryLabels[decision.category] || decision.category}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${(decision.ai_risk_score||0) > 60 ? "bg-destructive" : (decision.ai_risk_score||0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score||0}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{decision.ai_risk_score||0}%</span>
                    </div>
                  </td>
                  <td className="p-3"><span className="text-xs text-muted-foreground">{decision.due_date || "—"}</span></td>
                  <td className="p-3"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

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
