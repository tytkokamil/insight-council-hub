import { useState, useMemo } from "react";
import PageHint from "@/components/shared/PageHint";
import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, MoreHorizontal, Zap, Target, GitBranch, BarChart3, Download, X, Pencil, Trash2, Eye, AlertCircle, FileUp, DollarSign, Link2 } from "lucide-react";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";
import ImportDialog from "@/components/shared/ImportDialog";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions, useDependencies } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { exportCSV, exportPDF } from "@/lib/exportDecisions";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: allDeps = [] } = useDependencies();
  const { data: allTasks = [] } = useTasks();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);
  const navigate = useNavigate();
  const teamMap: Record<string, string> = {};
  teams.forEach(t => { teamMap[t.id] = t.name; });

  // Goal links for alignment %
  const { data: goalLinks = [] } = useQuery({
    queryKey: ["decision-goal-links"],
    queryFn: async () => {
      const { data } = await supabase.from("decision_goal_links").select("decision_id, impact_weight");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // Compute per-decision data
  const decisionMeta = useMemo(() => {
    const meta: Record<string, { openTasks: number; depCount: number; cost: number; alignment: number }> = {};
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    const now = new Date();
    const priorityMult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

    decisions.forEach(d => {
      let openTasks = 0;
      let depCount = 0;

      allDeps.forEach(dep => {
        if (dep.source_decision_id === d.id || dep.target_decision_id === d.id) depCount++;
        if (dep.source_decision_id === d.id && dep.target_task_id) {
          const task = taskMap.get(dep.target_task_id);
          if (task && task.status !== "done") openTasks++;
        }
        if (dep.target_decision_id === d.id && dep.source_task_id) {
          const task = taskMap.get(dep.source_task_id);
          if (task && task.status !== "done") openTasks++;
        }
      });

      const isActive = !["implemented", "rejected"].includes(d.status);
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const cost = isActive ? Math.round(daysOpen * 2 * 75 * (priorityMult[d.priority] || 1.5)) : 0;

      const links = goalLinks.filter(l => l.decision_id === d.id);
      const alignment = links.length > 0 ? Math.round(links.reduce((s, l) => s + (l.impact_weight || 50), 0) / links.length) : 0;

      meta[d.id] = { openTasks, depCount, cost, alignment };
    });

    return meta;
  }, [decisions, allDeps, allTasks, goalLinks]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editDecision, setEditDecision] = useState<any>(null);
  const [deleteDecision, setDeleteDecision] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
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
    setFilterStatus([]); setFilterPriority([]); setFilterCategory([]); setFilterTeam([]);
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
      ...d, team_name: d.team_id ? teamMap[d.team_id] : undefined,
      assignee_name: d.assignee_id ? profileMap[d.assignee_id] : undefined,
      creator_name: profileMap[d.created_by],
    }));

  const handleExportCSV = () => { exportCSV(prepareExport()); toast.success("CSV-Export heruntergeladen"); };
  const handleExportPDF = () => { exportPDF(prepareExport()); };

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Entscheidungen</h1>
            <PageHint>Zentrales Register & Arbeitsbasis. Klicke auf eine Entscheidung für die Detail-Seite.</PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{decisions.length} Entscheidungen</p>
        </div>
        <div className="flex items-center gap-2">
          {decisions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2"><FileText className="w-4 h-4" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2"><FileText className="w-4 h-4" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2"><FileUp className="w-4 h-4" /> Import</Button>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Neue Entscheidung</Button>
        </div>
      </div>

      {decisions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Noch keine Entscheidungen</h3>
            <p className="text-sm text-muted-foreground mb-6">Erstelle deine erste Entscheidung.</p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Erste Entscheidung erstellen</Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Entscheidungen durchsuchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 relative">
                  <Filter className="w-4 h-4" /> Filter
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Filter</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="text-xs text-primary hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Zurücksetzen</button>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Status", options: STATUS_OPTIONS, state: filterStatus, setter: setFilterStatus },
                    { label: "Priorität", options: PRIORITY_OPTIONS, state: filterPriority, setter: setFilterPriority },
                    { label: "Kategorie", options: CATEGORY_OPTIONS, state: filterCategory, setter: setFilterCategory },
                  ].map(group => (
                    <div key={group.label}>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.options.map(o => (
                          <button key={o.value} onClick={() => toggleFilter(group.state, o.value, group.setter)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${group.state.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
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

          {/* ═══ TABLE with extended columns ═══ */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Entscheidung</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Priorität</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Risiko</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Alignment</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Deps</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Cost Impact</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Fällig</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">Keine Ergebnisse.</td></tr>
                  ) : (
                    filtered.map((decision) => {
                      const meta = decisionMeta[decision.id] || { openTasks: 0, depCount: 0, cost: 0, alignment: 0 };
                      const isOverdue = decision.due_date && new Date(decision.due_date) < new Date() && !["implemented", "rejected"].includes(decision.status);
                      return (
                        <tr
                          key={decision.id}
                          className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/decisions/${decision.id}`)}
                        >
                          {/* Title + Owner */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium">{decision.title}</p>
                              {meta.openTasks > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-warning/15 text-warning border border-warning/20">
                                      <AlertCircle className="w-3 h-3" />{meta.openTasks}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent><p className="text-xs">{meta.openTasks} offene Aufgaben</p></TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{decision.assignee_id ? profileMap[decision.assignee_id] || "—" : profileMap[decision.created_by] || "—"}</p>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${statusStyles[decision.status]}`}>
                              {statusLabels[decision.status]}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="p-3 hidden md:table-cell">
                            <span className={`text-xs font-semibold ${priorityStyles[decision.priority]}`}>
                              {priorityLabels[decision.priority]}
                            </span>
                          </td>

                          {/* Risk Score */}
                          <td className="p-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${(decision.ai_risk_score || 0) > 60 ? "bg-destructive" : (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${decision.ai_risk_score || 0}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">{decision.ai_risk_score || 0}%</span>
                            </div>
                          </td>

                          {/* Alignment % */}
                          <td className="p-3 hidden lg:table-cell">
                            {meta.alignment > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${meta.alignment}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{meta.alignment}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Dependencies */}
                          <td className="p-3 hidden xl:table-cell">
                            {meta.depCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Link2 className="w-3 h-3" /> {meta.depCount}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Cost Impact */}
                          <td className="p-3 hidden xl:table-cell">
                            {meta.cost > 0 ? (
                              <span className="text-xs font-semibold text-destructive">{formatCost(meta.cost)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Due Date */}
                          <td className="p-3 hidden md:table-cell">
                            <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {decision.due_date || "—"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/decisions/${decision.id}`)} className="gap-2">
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <NewDecisionDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreated={invalidate} />
      {editDecision && <EditDecisionDialog decision={editDecision} open={!!editDecision} onOpenChange={(open) => { if (!open) setEditDecision(null); }} onUpdated={invalidate} />}
      {deleteDecision && <DeleteDecisionDialog decision={deleteDecision} open={!!deleteDecision} onOpenChange={(open) => { if (!open) setDeleteDecision(null); }} onDeleted={invalidate} />}
      <ImportDialog open={showImport} onOpenChange={setShowImport} mode="decisions" onImported={invalidate} />
    </AppLayout>
  );
};

export default Decisions;
