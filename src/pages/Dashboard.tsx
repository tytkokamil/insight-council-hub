import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, ChevronDown, FileText, MoreHorizontal, Clock, CheckCircle2, TrendingUp, AlertTriangle, Zap, ArrowRight, BarChart3, Terminal } from "lucide-react";
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
    { label: "Total", value: allDecisions.length, icon: FileText, color: "text-primary" },
    { label: "In Review", value: allDecisions.filter(d => d.status === "review").length, icon: Clock, color: "text-warning" },
    { label: "Approved", value: allDecisions.filter(d => d.status === "approved").length, icon: CheckCircle2, color: "text-success" },
    { label: "High Risk", value: allDecisions.filter(d => (d.ai_risk_score || 0) > 60).length, icon: AlertTriangle, color: "text-destructive" },
  ];

  const filtered = decisions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Commander";

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
            <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-primary" />
            </div>

            <p className="font-mono text-xs text-primary/60 mb-2 uppercase tracking-widest">System Ready</p>
            <h1 className="font-display text-3xl font-bold mb-3">
              Welcome, {firstName}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Your Decision Intelligence system is initialized. Create your first decision to activate AI-powered analysis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button variant="hero" size="lg" onClick={() => navigate("/decisions")} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Decision
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => navigate("/teams")} className="gap-2">
                Setup Team
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Zap, title: "AI Analysis", desc: "Risk scoring" },
                { icon: BarChart3, title: "Real-time", desc: "Live metrics" },
                { icon: TrendingUp, title: "Predict", desc: "Forecasting" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="cmd-card p-3 text-left"
                >
                  <f.icon className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-xs font-semibold">{f.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{f.desc}</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] text-primary/50 uppercase tracking-widest mb-1">Command Center</p>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        </div>
        <Button variant="hero" asChild>
          <a href="/decisions">
            <Plus className="w-4 h-4" />
            New Decision
          </a>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="cmd-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
            <p className="data-value text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <MomentumScoreWidget />
        <DecisionCostWidget />
        <VelocityScoreWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <EscalationWidget />
        <LeaderboardWidget />
      </div>

      {/* High risk alert */}
      {highRiskDecisions.length > 0 && (
        <div className="cmd-card p-4 mb-4 border-destructive/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-mono font-semibold text-destructive uppercase tracking-wider">High Risk — Attention Required</span>
          </div>
          <div className="space-y-1">
            {highRiskDecisions.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors" onClick={() => setSelectedDecision(d)}>
                <span className="text-sm font-medium">{d.title}</span>
                <span className="data-value text-sm text-destructive font-bold">{d.ai_risk_score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search decisions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 pl-9 pr-4 rounded-md bg-muted/50 border border-border text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-mono placeholder:font-sans" />
        </div>
        <Button variant="glass" size="sm">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="cmd-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Decision</th>
              <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
              <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
              <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Due</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No decisions found.</td></tr>
            ) : filtered.map((decision, i) => (
              <motion.tr
                key={decision.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedDecision(decision)}
              >
                <td className="p-3">
                  <p className="text-sm font-medium">{decision.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{decision.assignee_id ? profileMap[decision.assignee_id] || "—" : "—"}</p>
                </td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase ${statusStyles[decision.status] || ""}`}>{decision.status}</span></td>
                <td className="p-3"><span className={`text-xs font-mono font-semibold uppercase ${priorityStyles[decision.priority] || ""}`}>{decision.priority}</span></td>
                <td className="p-3"><span className="text-xs font-mono text-muted-foreground uppercase">{decision.category}</span></td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${(decision.ai_risk_score||0) > 60 ? "bg-destructive" : (decision.ai_risk_score||0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score||0}%` }} />
                    </div>
                    <span className="data-value text-xs text-muted-foreground">{decision.ai_risk_score||0}%</span>
                  </div>
                </td>
                <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{decision.due_date || "—"}</span></td>
                <td className="p-3"><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button></td>
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
