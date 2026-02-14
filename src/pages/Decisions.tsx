import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, ChevronDown, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";

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
  const [decisions, setDecisions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const { user } = useAuth();

  const fetchDecisions = async () => {
    const { data } = await supabase
      .from("decisions")
      .select("*, teams(name)")
      .order("created_at", { ascending: false });
    if (!data) return;

    const assigneeIds = [...new Set(data.map(d => d.assignee_id).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", assigneeIds);
      if (profiles) {
        profiles.forEach(p => { profileMap[p.user_id] = p.full_name || "—"; });
      }
    }

    setDecisions(data.map(d => ({
      ...d,
      profiles: { full_name: d.assignee_id ? profileMap[d.assignee_id] || "Nicht zugewiesen" : "Nicht zugewiesen" }
    })));
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const filtered = decisions.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Decisions</h1>
          <p className="text-muted-foreground">{decisions.length} Entscheidungen gesamt</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setShowNewDialog(true)}>
          <Plus className="w-5 h-5" />
          Neue Entscheidung
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Entscheidungen suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
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
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Team</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">AI Risiko</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fällig</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {decisions.length === 0
                    ? "Noch keine Entscheidungen. Erstelle deine erste!"
                    : "Keine Ergebnisse gefunden."}
                </td>
              </tr>
            ) : (
              filtered.map((decision, i) => (
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
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{decision.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {decision.profiles?.full_name || "Nicht zugewiesen"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[decision.status] || ""}`}>
                      {decision.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium capitalize ${priorityStyles[decision.priority] || ""}`}>
                      ● {decision.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize">{decision.category}</span>
                  </td>
                  <td className="p-4">
                    {decision.teams?.name ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/50 text-accent-foreground">
                        {decision.teams.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (decision.ai_risk_score || 0) > 60 ? "bg-destructive" :
                            (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"
                          }`}
                          style={{ width: `${decision.ai_risk_score || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{decision.ai_risk_score || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {decision.due_date || "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NewDecisionDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={fetchDecisions}
      />

      <DecisionDetailDialog
        decision={selectedDecision}
        open={!!selectedDecision}
        onOpenChange={(open) => { if (!open) setSelectedDecision(null); }}
        onUpdated={fetchDecisions}
      />
    </AppLayout>
  );
};

export default Decisions;
