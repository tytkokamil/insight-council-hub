import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, MoreHorizontal, Zap, Target, GitBranch, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions } from "@/hooks/useDecisions";
import { exportCSV, exportPDF } from "@/lib/exportDecisions";
import { toast } from "sonner";

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

  const prepareExport = () =>
    filtered.map((d) => ({
      ...d,
      description: d.description,
      context: d.context,
      outcome: d.outcome,
      outcome_notes: d.outcome_notes,
      team_name: d.team_id ? teamMap[d.team_id] : undefined,
      assignee_name: d.assignee_id ? profileMap[d.assignee_id] : undefined,
      creator_name: profileMap[d.created_by],
    }));

  const handleExportCSV = () => {
    exportCSV(prepareExport());
    toast.success("CSV-Export heruntergeladen");
  };

  const handleExportPDF = () => {
    exportPDF(prepareExport());
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Entscheidungsregister</p>
          <h1 className="font-display text-xl font-bold">Entscheidungen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{decisions.length} insgesamt</p>
        </div>
        <div className="flex items-center gap-2">
          {decisions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Als CSV exportieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Als PDF exportieren
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Entscheidung
          </Button>
        </div>
      </div>

      {decisions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-10">
              <div className="max-w-md mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Noch keine Entscheidungen</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Erstelle deine erste Entscheidung und lass KI automatisch Risiken, Optionen und Empfehlungen analysieren.
                </p>
                <Button onClick={() => setShowNewDialog(true)} className="gap-2 mb-6">
                  <Plus className="w-4 h-4" />
                  Erste Entscheidung erstellen
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Zap, label: "KI-Risikoanalyse" },
                    { icon: GitBranch, label: "Abhängigkeitsgraph" },
                    { icon: Target, label: "Impact-Tracking" },
                  ].map((f, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border">
                      <f.icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Entscheidungen durchsuchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Entscheidung</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Priorität</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Kategorie</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Team</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Risiko</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fällig</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">Keine Ergebnisse gefunden.</td></tr>
                ) : (
                  filtered.map((decision, i) => (
                    <motion.tr key={decision.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedDecision(decision)}>
                      <td className="p-3">
                        <p className="text-sm font-medium">{decision.title}</p>
                        <p className="text-xs text-muted-foreground">{decision.assignee_id ? profileMap[decision.assignee_id] || "—" : "—"}</p>
                      </td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${statusStyles[decision.status] || ""}`}>{decision.status}</span></td>
                      <td className="p-3"><span className={`text-xs font-semibold uppercase ${priorityStyles[decision.priority] || ""}`}>{decision.priority}</span></td>
                      <td className="p-3"><span className="text-xs text-muted-foreground uppercase">{decision.category}</span></td>
                      <td className="p-3">{decision.team_id && teamMap[decision.team_id] ? (<span className="px-2 py-0.5 rounded-md text-[10px] bg-primary/10 text-primary">{teamMap[decision.team_id]}</span>) : (<span className="text-xs text-muted-foreground">—</span>)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${(decision.ai_risk_score || 0) > 60 ? "bg-destructive" : (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score || 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{decision.ai_risk_score || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="text-xs text-muted-foreground">{decision.due_date || "—"}</span></td>
                      <td className="p-3"><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button></td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <NewDecisionDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreated={invalidate} />
      <DecisionDetailDialog decision={selectedDecision} open={!!selectedDecision} onOpenChange={(open) => { if (!open) setSelectedDecision(null); }} onUpdated={invalidate} />
    </AppLayout>
  );
};

export default Decisions;
