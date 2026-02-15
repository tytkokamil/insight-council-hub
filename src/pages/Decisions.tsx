import { useState } from "react";
import PageHint from "@/components/shared/PageHint";
import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, MoreHorizontal, Zap, Target, GitBranch, BarChart3, Download, X, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions } from "@/hooks/useDecisions";
import { exportCSV, exportPDF } from "@/lib/exportDecisions";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "draft", label: "Entwurf" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Genehmigt" },
  { value: "implemented", label: "Umgesetzt" },
  { value: "rejected", label: "Abgelehnt" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Niedrig" },
  { value: "medium", label: "Mittel" },
  { value: "high", label: "Hoch" },
  { value: "critical", label: "Kritisch" },
];

const CATEGORY_OPTIONS = [
  { value: "strategic", label: "Strategisch" },
  { value: "budget", label: "Budget" },
  { value: "hr", label: "Personal" },
  { value: "technical", label: "Technisch" },
  { value: "operational", label: "Operativ" },
  { value: "marketing", label: "Marketing" },
];

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
  const [editDecision, setEditDecision] = useState<any>(null);
  const [deleteDecision, setDeleteDecision] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterTeam, setFilterTeam] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const { user } = useAuth();

  const activeFilterCount = filterStatus.length + filterPriority.length + filterCategory.length + filterTeam.length;

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearAllFilters = () => {
    setFilterStatus([]);
    setFilterPriority([]);
    setFilterCategory([]);
    setFilterTeam([]);
  };

  const filtered = decisions.filter((d) => {
    if (!d.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(d.status)) return false;
    if (filterPriority.length > 0 && !filterPriority.includes(d.priority)) return false;
    if (filterCategory.length > 0 && !filterCategory.includes(d.category)) return false;
    if (filterTeam.length > 0 && (!d.team_id || !filterTeam.includes(d.team_id))) return false;
    return true;
  });

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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Entscheidungen</h1>
            <PageHint>
              Alle Entscheidungen auf einen Blick. Nutze Filter und Suche, um gezielt zu finden. Klicke auf eine Entscheidung für Details, KI-Analyse und Abhängigkeiten. Export als CSV oder PDF möglich.
            </PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Überblick über alle Entscheidungen</p>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Noch keine Entscheidungen</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Erstelle deine erste Entscheidung und lass KI automatisch Risiken, Optionen und Empfehlungen analysieren.
            </p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2 mb-8">
              <Plus className="w-4 h-4" />
              Erste Entscheidung erstellen
            </Button>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, label: "KI-Risikoanalyse", desc: "Automatische Risikobewertung" },
                { icon: GitBranch, label: "Abhängigkeitsgraph", desc: "Verknüpfungen erkennen" },
                { icon: Target, label: "Impact-Tracking", desc: "Auswirkungen messen" },
              ].map((f, i) => (
                <Card key={i} className="text-left">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <f.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Entscheidungen durchsuchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 relative">
                  <Filter className="w-4 h-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Filter</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <X className="w-3 h-3" /> Zurücksetzen
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => toggleFilter(filterStatus, o.value, setFilterStatus)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${filterStatus.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Priorität</p>
                    <div className="flex flex-wrap gap-1">
                      {PRIORITY_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => toggleFilter(filterPriority, o.value, setFilterPriority)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${filterPriority.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Kategorie</p>
                    <div className="flex flex-wrap gap-1">
                      {CATEGORY_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => toggleFilter(filterCategory, o.value, setFilterCategory)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${filterCategory.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {teams.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Team</p>
                      <div className="flex flex-wrap gap-1">
                        {teams.map(t => (
                          <button key={t.id} onClick={() => toggleFilter(filterTeam, t.id, setFilterTeam)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${filterTeam.includes(t.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
              <tbody className="stagger-children">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">Keine Ergebnisse gefunden.</td></tr>
                ) : (
                  filtered.map((decision) => (
                    <tr key={decision.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedDecision(decision)}>
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
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedDecision(decision)} className="gap-2">
                              <Eye className="w-3.5 h-3.5" /> Öffnen
                            </DropdownMenuItem>
                            {user?.id === decision.created_by && (
                              <>
                                <DropdownMenuItem onClick={() => setEditDecision(decision)} className="gap-2">
                                  <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteDecision(decision)} className="gap-2 text-destructive focus:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" /> Löschen
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <NewDecisionDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreated={invalidate} />
      <DecisionDetailDialog decision={selectedDecision} open={!!selectedDecision} onOpenChange={(open) => { if (!open) setSelectedDecision(null); }} onUpdated={invalidate} />
      {editDecision && <EditDecisionDialog decision={editDecision} open={!!editDecision} onOpenChange={(open) => { if (!open) setEditDecision(null); }} onUpdated={invalidate} />}
      {deleteDecision && <DeleteDecisionDialog decision={deleteDecision} open={!!deleteDecision} onOpenChange={(open) => { if (!open) setDeleteDecision(null); }} onDeleted={invalidate} />}
    </AppLayout>
  );
};

export default Decisions;
