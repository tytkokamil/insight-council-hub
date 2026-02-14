import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, ChevronDown, FileText, MoreHorizontal, Clock, CheckCircle2, TrendingUp, AlertTriangle, Sparkles, ArrowRight, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  implemented: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-destructive",
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
    { label: "Gesamt", value: allDecisions.length, icon: FileText, gradient: "from-primary/20 to-primary/5" },
    { label: "In Review", value: allDecisions.filter(d => d.status === "review").length, icon: Clock, gradient: "from-warning/20 to-warning/5" },
    { label: "Genehmigt", value: allDecisions.filter(d => d.status === "approved").length, icon: CheckCircle2, gradient: "from-success/20 to-success/5" },
    { label: "Hohes Risiko", value: allDecisions.filter(d => (d.ai_risk_score || 0) > 60).length, icon: AlertTriangle, gradient: "from-destructive/20 to-destructive/5" },
  ];

  const filtered = decisions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "dort";

  // Empty welcome state
  if (allDecisions.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-lg"
          >
            {/* Animated orb */}
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl animate-glow-pulse" />
              <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h1 className="font-display text-4xl font-bold mb-3">
              Willkommen, {firstName}!
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Dein Decision-Intelligence-System ist bereit. Erstelle deine erste Entscheidung und lass KI deine strategischen Prozesse optimieren.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Button variant="hero" size="lg" onClick={() => navigate("/decisions")} className="gap-2 px-8">
                <Plus className="w-5 h-5" />
                Erste Entscheidung erstellen
              </Button>
              <Button variant="glass" size="lg" onClick={() => navigate("/teams")} className="gap-2">
                Team einladen
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[
                { icon: Zap, title: "KI-Analyse", desc: "Automatische Risikobewertung" },
                { icon: BarChart3, title: "Analytics", desc: "Echtzeit-Entscheidungsdaten" },
                { icon: TrendingUp, title: "Predictions", desc: "Vorhersagen & Szenarien" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass-card p-4 text-left"
                >
                  <f.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Überblick aller Entscheidungen</p>
        </div>
        <Button variant="hero" size="lg" asChild>
          <a href="/decisions">
            <Plus className="w-5 h-5" />
            Neue Entscheidung
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="font-display text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-foreground/70" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <MomentumScoreWidget />
        <DecisionCostWidget />
        <VelocityScoreWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <EscalationWidget />
        <LeaderboardWidget />
      </div>

      {highRiskDecisions.length > 0 && (
        <div className="glass-card p-5 mb-6 border-destructive/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-medium text-destructive">Hohes Risiko – Aufmerksamkeit erforderlich</h3>
          </div>
          <div className="space-y-2">
            {highRiskDecisions.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors"
                onClick={() => setSelectedDecision(d)}
              >
                <span className="text-sm font-medium">{d.title}</span>
                <span className="text-sm text-destructive font-bold">{d.ai_risk_score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Suchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
        </div>
        <Button variant="glass">
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Entscheidung</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priorität</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Kategorie</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">AI Risiko</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fällig</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Noch keine Entscheidungen vorhanden.</td></tr>
            ) : filtered.map((decision, i) => (
              <motion.tr
                key={decision.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedDecision(decision)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><FileText className="w-5 h-5 text-muted-foreground" /></div>
                    <div>
                      <p className="font-medium">{decision.title}</p>
                      <p className="text-sm text-muted-foreground">{decision.assignee_id ? profileMap[decision.assignee_id] || "—" : "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[decision.status] || ""}`}>{decision.status}</span></td>
                <td className="p-4"><span className={`text-sm font-medium capitalize ${priorityStyles[decision.priority] || ""}`}>● {decision.priority}</span></td>
                <td className="p-4"><span className="text-sm capitalize">{decision.category}</span></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${(decision.ai_risk_score||0) > 60 ? "bg-destructive" : (decision.ai_risk_score||0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score||0}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground">{decision.ai_risk_score||0}%</span>
                  </div>
                </td>
                <td className="p-4"><span className="text-sm text-muted-foreground">{decision.due_date || "—"}</span></td>
                <td className="p-4"><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

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
