import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, MoreHorizontal, Zap, Target, GitBranch, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions } from "@/hooks/useDecisions";

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

const Decisions = () => {
  const { data: decisions = [] } = useDecisions();
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useProfiles();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);
  const teamMap: Record<string, string> = {};
  teams.forEach(t => { teamMap[t.id] = t.name; });

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const { user } = useAuth();

  const filtered = decisions.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] text-primary/50 uppercase tracking-widest mb-1">Decision Registry</p>
          <h1 className="font-display text-2xl font-bold">Decisions</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{decisions.length} total</p>
        </div>
        <Button variant="hero" onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4" />
          New Decision
        </Button>
      </div>

      {decisions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cmd-card p-10">
          <div className="max-w-md mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Terminal className="w-7 h-7 text-primary" />
            </div>
            <p className="font-mono text-[10px] text-primary/50 uppercase tracking-widest mb-2">No entries</p>
            <h3 className="font-display text-xl font-bold mb-2">No Decisions Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first decision and let AI analyze risks, options, and recommendations automatically.
            </p>
            <Button variant="hero" onClick={() => setShowNewDialog(true)} className="gap-2 mb-6">
              <Plus className="w-4 h-4" />
              Create First Decision
            </Button>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Zap, label: "AI Risk Analysis" },
                { icon: GitBranch, label: "Dependency Graph" },
                { icon: Target, label: "Impact Tracking" },
              ].map((f, i) => (
                <div key={i} className="p-2.5 rounded-md bg-muted/30 border border-border">
                  <f.icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <p className="text-[10px] font-mono text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <>
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

          <div className="cmd-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Decision</th>
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                  <th className="text-left p-3 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">Due</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">No results found.</td></tr>
                ) : (
                  filtered.map((decision, i) => (
                    <motion.tr key={decision.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedDecision(decision)}>
                      <td className="p-3">
                        <p className="text-sm font-medium">{decision.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{decision.assignee_id ? profileMap[decision.assignee_id] || "—" : "—"}</p>
                      </td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase ${statusStyles[decision.status] || ""}`}>{decision.status}</span></td>
                      <td className="p-3"><span className={`text-xs font-mono font-semibold uppercase ${priorityStyles[decision.priority] || ""}`}>{decision.priority}</span></td>
                      <td className="p-3"><span className="text-xs font-mono text-muted-foreground uppercase">{decision.category}</span></td>
                      <td className="p-3">{decision.team_id && teamMap[decision.team_id] ? (<span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-primary/10 text-primary">{teamMap[decision.team_id]}</span>) : (<span className="text-xs text-muted-foreground">—</span>)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${(decision.ai_risk_score || 0) > 60 ? "bg-destructive" : (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score || 0}%` }} />
                          </div>
                          <span className="data-value text-xs text-muted-foreground">{decision.ai_risk_score || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{decision.due_date || "—"}</span></td>
                      <td className="p-3"><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button></td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <NewDecisionDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreated={invalidate} />
      <DecisionDetailDialog decision={selectedDecision} open={!!selectedDecision} onOpenChange={(open) => { if (!open) setSelectedDecision(null); }} onUpdated={invalidate} />
    </AppLayout>
  );
};

export default Decisions;
