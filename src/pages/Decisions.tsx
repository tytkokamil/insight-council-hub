import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, FileText, MoreHorizontal, BarChart3, Download, X,
  Pencil, Trash2, Eye, AlertCircle, FileUp, Link2, ChevronRight,
  HelpCircle, CheckSquare, UserPlus, Tag, Clock, ShieldAlert, Zap, Brain,
} from "lucide-react";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import SavedViewsBar from "@/components/decisions/SavedViewsBar";
import type { SavedViewFilters } from "@/hooks/useSavedViews";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";
import ImportDialog from "@/components/shared/ImportDialog";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions, useDependencies, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { exportCSV, exportPDF } from "@/lib/exportDecisions";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUS_OPTIONS = [
  { value: "draft", label: "Entwurf" },
  { value: "proposed", label: "Vorschlag" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Genehmigt" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "implemented", label: "Umgesetzt" },
  { value: "cancelled", label: "Abgebrochen" },
  { value: "superseded", label: "Ersetzt" },
  { value: "archived", label: "Archiviert" },
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
  proposed: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
  review: "bg-warning/15 text-warning border border-warning/20",
  approved: "bg-success/15 text-success border border-success/20",
  rejected: "bg-destructive/15 text-destructive border border-destructive/20",
  implemented: "bg-primary/15 text-primary border border-primary/20",
  cancelled: "bg-muted/60 text-muted-foreground line-through",
  superseded: "bg-accent-violet/10 text-accent-violet border border-accent-violet/20",
  archived: "bg-muted/50 text-muted-foreground/60",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-accent-blue",
  high: "text-warning",
  critical: "text-destructive font-semibold",
};

const Decisions = () => {
  const { data: decisions = [] } = useDecisions();
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useProfiles();
  const { data: allDeps = [] } = useDependencies();
  const { data: allTasks = [] } = useTasks();
  const { data: allReviews = [] } = useReviews();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Compute per-decision metadata
  const decisionMeta = useMemo(() => {
    const meta: Record<string, { openTasks: number; depCount: number; cost: number; alignment: number; isOverdue: boolean; isEscalated: boolean; needsReview: boolean; isBlocked: boolean; isHighRisk: boolean }> = {};
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    const now = new Date();
    const priorityMult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

    decisions.forEach(d => {
      let openTasks = 0;
      let depCount = 0;
      let isBlocked = false;

      allDeps.forEach(dep => {
        if (dep.source_decision_id === d.id || dep.target_decision_id === d.id) depCount++;
        if (dep.source_decision_id === d.id && dep.target_task_id) {
          const task = taskMap.get(dep.target_task_id);
          if (task && task.status !== "done") { openTasks++; isBlocked = true; }
        }
        if (dep.target_decision_id === d.id && dep.source_task_id) {
          const task = taskMap.get(dep.source_task_id);
          if (task && task.status !== "done") { openTasks++; isBlocked = true; }
        }
      });

      const isActive = !["implemented", "rejected", "cancelled", "superseded", "archived"].includes(d.status);
      const isOverdue = !!(d.due_date && new Date(d.due_date) < now && isActive);
      const isEscalated = (d.escalation_level || 0) > 0;
      const needsReview = allReviews.some(r => r.decision_id === d.id && !r.reviewed_at && r.reviewer_id === user?.id);
      const isHighRisk = (d.ai_risk_score || 0) > 60;

      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const cost = isActive ? Math.round(daysOpen * 2 * 75 * (priorityMult[d.priority] || 1.5)) : 0;

      const links = goalLinks.filter(l => l.decision_id === d.id);
      const alignment = links.length > 0 ? Math.round(links.reduce((s, l) => s + (l.impact_weight || 50), 0) / links.length) : 0;

      meta[d.id] = { openTasks, depCount, cost, alignment, isOverdue, isEscalated, needsReview, isBlocked, isHighRisk };
    });

    return meta;
  }, [decisions, allDeps, allTasks, goalLinks, allReviews, user?.id]);

  // State
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
  const [quickChip, setQuickChip] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewDecision, setPreviewDecision] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const activeFilterCount = filterStatus.length + filterPriority.length + filterCategory.length + filterTeam.length + (quickChip ? 1 : 0);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearAllFilters = () => {
    setFilterStatus([]); setFilterPriority([]); setFilterCategory([]); setFilterTeam([]); setQuickChip(null);
  };

  // Quick chip counts
  const chipCounts = useMemo(() => {
    let overdue = 0, escalated = 0, review = 0, highRisk = 0, blocked = 0;
    decisions.forEach(d => {
      const m = decisionMeta[d.id];
      if (!m) return;
      if (m.isOverdue) overdue++;
      if (m.isEscalated) escalated++;
      if (m.needsReview) review++;
      if (m.isHighRisk) highRisk++;
      if (m.isBlocked) blocked++;
    });
    return { overdue, escalated, review, highRisk, blocked };
  }, [decisions, decisionMeta]);

  const filtered = useMemo(() => decisions.filter((d) => {
    if (debouncedSearch && !d.title.toLowerCase().includes(debouncedSearch.toLowerCase()) && !d.description?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(d.status)) return false;
    if (filterPriority.length > 0 && !filterPriority.includes(d.priority)) return false;
    if (filterCategory.length > 0 && !filterCategory.includes(d.category)) return false;
    if (filterTeam.length > 0 && (!d.team_id || !filterTeam.includes(d.team_id))) return false;
    // Quick chip filter
    if (quickChip) {
      const m = decisionMeta[d.id];
      if (!m) return false;
      if (quickChip === "overdue" && !m.isOverdue) return false;
      if (quickChip === "escalated" && !m.isEscalated) return false;
      if (quickChip === "review" && !m.needsReview) return false;
      if (quickChip === "highRisk" && !m.isHighRisk) return false;
      if (quickChip === "blocked" && !m.isBlocked) return false;
    }
    return true;
  }), [decisions, debouncedSearch, filterStatus, filterPriority, filterCategory, filterTeam, quickChip, decisionMeta]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(d => d.id)));
    }
  };

  const handleBulkStatus = async (newStatus: string) => {
    const ids = Array.from(selectedIds);
    const updates: Record<string, any> = { status: newStatus as any, updated_at: new Date().toISOString() };
    if (newStatus === "implemented") updates.implemented_at = new Date().toISOString();
    if (newStatus === "archived") updates.archived_at = new Date().toISOString();
    const { error } = await supabase.from("decisions").update(updates).in("id", ids);
    if (!error) {
      toast.success(`${ids.length} Entscheidungen → ${statusLabels[newStatus]}`);
      setSelectedIds(new Set());
      invalidate();
    }
  };

  const handleBulkTeam = async (teamId: string | null) => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("decisions").update({ team_id: teamId, updated_at: new Date().toISOString() } as any).in("id", ids);
    if (!error) {
      toast.success(`${ids.length} Entscheidungen → ${teamId ? teamMap[teamId] : "Persönlich"}`);
      setSelectedIds(new Set());
      invalidate();
    }
  };

  const prepareExport = () =>
    filtered.map((d) => ({
      ...d, team_name: d.team_id ? teamMap[d.team_id] : undefined,
      assignee_name: d.assignee_id ? profileMap[d.assignee_id] : undefined,
      creator_name: profileMap[d.created_by],
    }));

  const handleExportCSV = () => { exportCSV(prepareExport()); toast.success("CSV-Export heruntergeladen"); };
  const handleExportPDF = () => { exportPDF(prepareExport()); };

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  const quickChips = [
    { key: "overdue", label: "Überfällig", count: chipCounts.overdue, icon: Clock, color: "text-destructive" },
    { key: "escalated", label: "Eskaliert", count: chipCounts.escalated, icon: ShieldAlert, color: "text-warning" },
    { key: "review", label: "Needs Review", count: chipCounts.review, icon: CheckSquare, color: "text-primary" },
    { key: "highRisk", label: "High Risk", count: chipCounts.highRisk, icon: AlertCircle, color: "text-destructive" },
    { key: "blocked", label: "Blockiert", count: chipCounts.blocked, icon: Zap, color: "text-warning" },
  ];

  return (
    <AppLayout>
      {/* ═══ A) HEADER ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Entscheidungen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{decisions.length} Entscheidungen · {filtered.length} angezeigt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-4 h-4" />
          </Button>
          {decisions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2"><FileText className="w-4 h-4" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2"><FileText className="w-4 h-4" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-2"><FileUp className="w-4 h-4" /> Import</Button>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Neue Entscheidung</Button>
        </div>
      </div>

      {decisions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/15 to-accent-violet/15 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Noch keine Entscheidungen vorhanden</h3>
            <p className="text-sm text-muted-foreground mb-6">Erstelle deine erste Entscheidung oder starte mit Beispieldaten, um die Plattform zu erkunden.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={async () => {
                toast.info("Demo-Daten werden erstellt…");
                const { data, error } = await supabase.functions.invoke("seed-demo-data");
                if (error || data?.error) { toast.error(data?.error || "Fehler"); return; }
                toast.success("Demo-Daten erstellt!"); window.location.reload();
              }} className="gap-2"><Zap className="w-4 h-4" /> Beispieldaten laden</Button>
              <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Erste Entscheidung erstellen</Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ═══ B) FILTER BAR (Sticky) ═══ */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-3 space-y-3">
            {/* Search + Filter button */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Entscheidungen durchsuchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
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
                <PopoverContent className="w-80 p-3" align="end">
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

            {/* Quick Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {quickChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setQuickChip(quickChip === chip.key ? null : chip.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    quickChip === chip.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  <chip.icon className={`w-3 h-3 ${quickChip === chip.key ? "" : chip.color}`} />
                  {chip.label}
                  {chip.count > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      quickChip === chip.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{chip.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Saved Views */}
            <SavedViewsBar
              entityType="decisions"
              currentFilters={{
                status: filterStatus,
                priority: filterPriority,
                category: filterCategory,
                team: filterTeam,
                quickChip,
              }}
              onApplyView={(filters: SavedViewFilters) => {
                setFilterStatus(filters.status ?? []);
                setFilterPriority(filters.priority ?? []);
                setFilterCategory(filters.category ?? []);
                setFilterTeam(filters.team ?? []);
                setQuickChip(filters.quickChip ?? null);
              }}
              hasActiveFilters={activeFilterCount > 0}
            />
          </div>

          {/* ═══ BULK ACTIONS ═══ */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-xs font-semibold text-primary">{selectedIds.size} ausgewählt</span>
                <Separator orientation="vertical" className="h-4" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs h-7">Status setzen</Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {STATUS_OPTIONS.map(s => (
                      <DropdownMenuItem key={s.value} onClick={() => handleBulkStatus(s.value)}>{s.label}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {teams.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="text-xs h-7 gap-1.5"><UserPlus className="w-3 h-3" /> Team zuweisen</Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkTeam(null)}>Persönlich (kein Team)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {teams.map(t => (
                        <DropdownMenuItem key={t.id} onClick={() => handleBulkTeam(t.id)}>{t.name}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 text-warning hover:text-warning" onClick={() => handleBulkStatus("archived")}>
                  Archivieren
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={() => { exportCSV(prepareExport().filter(d => selectedIds.has(d.id))); toast.success("Exportiert"); }}>
                  <Download className="w-3 h-3" /> Exportieren
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 ml-auto" onClick={() => setSelectedIds(new Set())}>
                  <X className="w-3 h-3 mr-1" /> Auswahl aufheben
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ C) TABLE ═══ */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-3 w-10">
                      <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} />
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Entscheidung</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Owner</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Priorität</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Risiko</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Alignment</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Deps</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Fällig</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Updated</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center">
                        <p className="text-sm text-muted-foreground">Keine Ergebnisse für diese Filter.</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={clearAllFilters}>Filter zurücksetzen</Button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((decision) => {
                      const meta = decisionMeta[decision.id] || { openTasks: 0, depCount: 0, cost: 0, alignment: 0, isOverdue: false, isEscalated: false, needsReview: false, isBlocked: false, isHighRisk: false };
                      const isSelected = selectedIds.has(decision.id);
                      return (
                        <tr
                          key={decision.id}
                          className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors row-highlight ${isSelected ? "bg-primary/5" : ""}`}
                          onClick={() => setPreviewDecision(decision)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(decision.id)} />
                          </td>

                          {/* Title + badges */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium">{decision.title}</p>
                              {meta.isOverdue && <Badge variant="destructive" className="text-[9px] h-4 px-1">Overdue</Badge>}
                              {meta.isEscalated && <Badge className="text-[9px] h-4 px-1 bg-warning/20 text-warning border-warning/30">Eskaliert</Badge>}
                              {meta.needsReview && <Badge className="text-[9px] h-4 px-1 bg-primary/20 text-primary border-primary/30">Review</Badge>}
                              {meta.isBlocked && <Badge className="text-[9px] h-4 px-1 bg-warning/20 text-warning border-warning/30">Blockiert</Badge>}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{categoryLabels[decision.category]}</p>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${statusStyles[decision.status]}`}>
                              {statusLabels[decision.status]}
                            </span>
                          </td>

                          {/* Owner */}
                          <td className="p-3 hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {(profileMap[decision.assignee_id || decision.created_by] || "?").charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {profileMap[decision.assignee_id || decision.created_by] || "—"}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 hidden md:table-cell">
                            <span className={`text-xs font-semibold ${priorityStyles[decision.priority]}`}>
                              {priorityLabels[decision.priority]}
                            </span>
                          </td>

                          {/* Risk Score (Traffic light) */}
                          <td className="p-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${(decision.ai_risk_score || 0) > 60 ? "bg-destructive" : (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"}`} />
                              <span className="text-xs text-muted-foreground font-mono">{decision.ai_risk_score || 0}%</span>
                            </div>
                          </td>

                          <td className="p-3 hidden lg:table-cell">
                            {meta.alignment > 0 ? (
                              <span className="text-xs text-muted-foreground">{meta.alignment}%</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="p-3 hidden xl:table-cell">
                            {meta.depCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Link2 className="w-3 h-3" /> {meta.depCount}</span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>

                          <td className="p-3 hidden md:table-cell">
                            <span className={`text-xs ${meta.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {decision.due_date ? format(new Date(decision.due_date), "dd.MM.yy", { locale: de }) : "—"}
                            </span>
                          </td>

                          <td className="p-3 hidden xl:table-cell">
                            <span className="text-xs text-muted-foreground">{format(new Date(decision.updated_at), "dd.MM.yy", { locale: de })}</span>
                          </td>

                          {/* Row Actions */}
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/decisions/${decision.id}`)} className="gap-2">
                                  <Eye className="w-3.5 h-3.5" /> Öffnen
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {STATUS_OPTIONS.filter(s => s.value !== decision.status).slice(0, 3).map(s => (
                                  <DropdownMenuItem key={s.value} onClick={async () => {
                                    await supabase.from("decisions").update({ status: s.value as any }).eq("id", decision.id);
                                    invalidate(); toast.success(`→ ${s.label}`);
                                  }} className="gap-2 text-xs">
                                    Status → {s.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
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

      {/* ═══ D) SIDE DRAWER (Quick Preview) ═══ */}
      <Sheet open={!!previewDecision} onOpenChange={(o) => { if (!o) setPreviewDecision(null); }}>
        <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
          {previewDecision && (() => {
            const meta = decisionMeta[previewDecision.id] || { openTasks: 0, depCount: 0, cost: 0, alignment: 0 };
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="font-display text-lg">{previewDecision.title}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {/* Status & Priority */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${statusStyles[previewDecision.status]}`}>
                      {statusLabels[previewDecision.status]}
                    </span>
                    <span className={`text-xs font-semibold ${priorityStyles[previewDecision.priority]}`}>
                      {priorityLabels[previewDecision.priority]}
                    </span>
                    <span className="text-xs text-muted-foreground">{categoryLabels[previewDecision.category]}</span>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Beschreibung</p>
                    <p className="text-sm leading-relaxed">{previewDecision.description || "Keine Beschreibung"}</p>
                  </div>

                  {/* AI Summary */}
                  {(previewDecision.ai_risk_score || previewDecision.ai_impact_score) && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Brain className="w-3.5 h-3.5 text-primary" />
                        <p className="text-xs font-semibold text-primary">KI-Analyse</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Risiko</p>
                          <p className="font-bold text-lg">{previewDecision.ai_risk_score || 0}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impact</p>
                          <p className="font-bold text-lg">{previewDecision.ai_impact_score || 0}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Open Tasks */}
                  {meta.openTasks > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                      <p className="text-xs text-warning"><span className="font-semibold">{meta.openTasks} offene Aufgabe{meta.openTasks > 1 ? "n" : ""}</span></p>
                    </div>
                  )}

                  {/* Quick Status Change */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Status ändern</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map(s => (
                        <Button key={s.value} size="sm" variant={previewDecision.status === s.value ? "default" : "outline"}
                          className="text-xs h-7"
                          onClick={async () => {
                            await supabase.from("decisions").update({ status: s.value as any }).eq("id", previewDecision.id);
                            invalidate();
                            setPreviewDecision({ ...previewDecision, status: s.value });
                            toast.success(`→ ${s.label}`);
                          }}>
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Jump to Detail */}
                  <Button className="w-full gap-2" onClick={() => { setPreviewDecision(null); navigate(`/decisions/${previewDecision.id}`); }}>
                    <Eye className="w-4 h-4" /> Zur Detailansicht <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ═══ HELP MODAL ═══ */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Hilfe — Entscheidungen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Lifecycle</h4>
              <p className="text-muted-foreground">Jede Entscheidung durchläuft: Entwurf → Review → Genehmigt → Umgesetzt. Abgelehnte Entscheidungen werden archiviert.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Risk Score</h4>
              <p className="text-muted-foreground">Automatisch berechnet durch KI-Analyse basierend auf Kontext, Kategorie und historischen Mustern. 0–100%, wobei &gt;60% als hohes Risiko gilt.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Alignment Score</h4>
              <p className="text-muted-foreground">Durchschnitt der Impact-Gewichte aller verknüpften strategischen Ziele. Höher = besser auf Strategie ausgerichtet.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Quick Chips</h4>
              <p className="text-muted-foreground">Schnellfilter für kritische Zustände: Überfällig (Deadline überschritten), Eskaliert (SLA verletzt), Needs Review (deine Freigabe nötig), High Risk (&gt;60%), Blockiert (offene Tasks).</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NewDecisionDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreated={invalidate} />
      {editDecision && <EditDecisionDialog decision={editDecision} open={!!editDecision} onOpenChange={(open) => { if (!open) setEditDecision(null); }} onUpdated={invalidate} />}
      {deleteDecision && <DeleteDecisionDialog decision={deleteDecision} open={!!deleteDecision} onOpenChange={(open) => { if (!open) setDeleteDecision(null); }} onDeleted={invalidate} />}
      <ImportDialog open={showImport} onOpenChange={setShowImport} mode="decisions" onImported={invalidate} />
    </AppLayout>
  );
};

export default Decisions;
