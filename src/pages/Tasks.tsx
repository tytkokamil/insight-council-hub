import { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import QueryErrorRetry from "@/components/shared/QueryErrorRetry";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTasks, useInvalidateTasks, type Task } from "@/hooks/useTasks";
import { useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Plus, CheckCircle2, Circle, Clock, AlertTriangle, Pencil, Trash2,
  ListTodo, FileUp, Search, LayoutGrid, List, MoreHorizontal, Eye, Filter, X, Zap, Target, GitBranch, Ban, Archive, TrendingUp, Download, FileText,
  Link as LinkIcon,
} from "lucide-react";
import { exportTasksCSV } from "@/lib/exportDecisions";
import { exportTasksExcel } from "@/lib/exportExcel";
import QuickMessageButton from "@/components/shared/QuickMessageButton";
import ImportDialog from "@/components/shared/ImportDialog";
import TaskKanbanBoard from "@/components/tasks/TaskKanbanBoard";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";

const useStatusConfig = () => {
  const { t } = useTranslation();
  return {
    backlog: { label: t("tasksPage.statusBacklog"), icon: Archive, color: "text-muted-foreground/60" },
    open: { label: t("tasksPage.statusOpen"), icon: Circle, color: "text-muted-foreground" },
    in_progress: { label: t("tasksPage.statusInProgress"), icon: Clock, color: "text-warning" },
    blocked: { label: t("tasksPage.statusBlocked"), icon: Ban, color: "text-destructive" },
    done: { label: t("tasksPage.statusDone"), icon: CheckCircle2, color: "text-success" },
  } as const;
};

const statusStyles: Record<string, string> = {
  backlog: "bg-muted/50 text-muted-foreground/60",
  open: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning",
  blocked: "bg-destructive/20 text-destructive",
  done: "bg-success/20 text-success",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-destructive",
};

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const emptyForm = {
  title: "",
  description: "",
  priority: "medium" as string,
  category: "general" as string,
  due_date: "",
  assignee_id: "" as string,
};

const Tasks = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const { data: tasks = [], isLoading, isError: tasksError, refetch: refetchTasks } = useTasks();
  const { data: profiles = [] } = useProfiles();
  const invalidate = useInvalidateTasks();
  const profileMap = buildProfileMap(profiles);
  const STATUS_CONFIG = useStatusConfig();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  // Fetch linked decisions for tasks via decision_dependencies
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);
  const { data: taskDecisionLinks = [] } = useQuery({
    queryKey: ["task-decision-links", taskIds],
    queryFn: async () => {
      if (taskIds.length === 0) return [];
      const { data: deps } = await supabase
        .from("decision_dependencies")
        .select("source_task_id, target_task_id, source_decision_id, target_decision_id")
        .or(`source_task_id.in.(${taskIds.join(",")}),target_task_id.in.(${taskIds.join(",")})`);
      if (!deps || deps.length === 0) return [];
      const decisionIds = new Set<string>();
      for (const d of deps) {
        if (d.source_decision_id) decisionIds.add(d.source_decision_id);
        if (d.target_decision_id) decisionIds.add(d.target_decision_id);
      }
      if (decisionIds.size === 0) return [];
      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, title")
        .in("id", Array.from(decisionIds));
      const decMap = Object.fromEntries((decisions || []).map(d => [d.id, d.title]));
      return deps.map(d => ({
        taskId: d.source_task_id || d.target_task_id,
        decisionId: d.source_decision_id || d.target_decision_id,
        decisionTitle: decMap[d.source_decision_id || d.target_decision_id || ""] || null,
      }));
    },
    enabled: taskIds.length > 0,
    staleTime: 30_000,
  });

  const taskDecisionMap = useMemo(() => {
    const map: Record<string, { decisionId: string; decisionTitle: string }> = {};
    for (const link of taskDecisionLinks) {
      if (link.taskId && link.decisionId && link.decisionTitle) {
        map[link.taskId] = { decisionId: link.decisionId, decisionTitle: link.decisionTitle };
      }
    }
    return map;
  }, [taskDecisionLinks]);

  const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    critical: { color: "bg-destructive/20 text-destructive", label: t("tasksPage.priorityCritical") },
    high: { color: "bg-warning/20 text-warning", label: t("tasksPage.priorityHigh") },
    medium: { color: "bg-primary/20 text-primary", label: t("tasksPage.priorityMedium") },
    low: { color: "bg-muted text-muted-foreground", label: t("tasksPage.priorityLow") },
  };

  const CATEGORY_LABELS: Record<string, string> = {
    general: t("tasksPage.catGeneral"), strategic: t("tasksPage.catStrategic"),
    operational: t("tasksPage.catOperational"), technical: t("tasksPage.catTechnical"),
    hr: t("tasksPage.catHr"), marketing: t("tasksPage.catMarketing"), budget: t("tasksPage.catBudget"),
  };

  const STATUS_OPTIONS = [
    { value: "backlog", label: t("tasksPage.statusBacklog") },
    { value: "open", label: t("tasksPage.statusOpen") },
    { value: "in_progress", label: t("tasksPage.statusInProgress") },
    { value: "blocked", label: t("tasksPage.statusBlocked") },
    { value: "done", label: t("tasksPage.statusDone") },
  ];

  const PRIORITY_OPTIONS = [
    { value: "low", label: t("tasksPage.priorityLow") },
    { value: "medium", label: t("tasksPage.priorityMedium") },
    { value: "high", label: t("tasksPage.priorityHigh") },
    { value: "critical", label: t("tasksPage.priorityCritical") },
  ];

  const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));

  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickChip, setQuickChip] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  const activeFilterCount = filterStatus.length + filterPriority.length + filterCategory.length + (quickChip ? 1 : 0);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearAllFilters = () => { setFilterStatus([]); setFilterPriority([]); setFilterCategory([]); setQuickChip(null); };

  // Quick-chip counts
  const chipCounts = useMemo(() => {
    const now = new Date();
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done").length;
    const critical = tasks.filter(t => t.priority === "critical" && t.status !== "done").length;
    const blocked = tasks.filter(t => t.status === "blocked").length;
    const myOpen = tasks.filter(t => (t.assignee_id === user?.id || t.created_by === user?.id) && t.status !== "done").length;
    return { overdue, critical, blocked, myOpen };
  }, [tasks, user]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (filterStatus.length > 0) result = result.filter(t => filterStatus.includes(t.status));
    if (filterPriority.length > 0) result = result.filter(t => filterPriority.includes(t.priority));
    if (filterCategory.length > 0) result = result.filter(t => filterCategory.includes(t.category));
    // Quick chips
    if (quickChip === "overdue") result = result.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done");
    if (quickChip === "critical") result = result.filter(t => t.priority === "critical" && t.status !== "done");
    if (quickChip === "blocked") result = result.filter(t => t.status === "blocked");
    if (quickChip === "myOpen") result = result.filter(t => (t.assignee_id === user?.id || t.created_by === user?.id) && t.status !== "done");
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tasks, searchQuery, filterStatus, filterPriority, filterCategory, quickChip, user]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTasks.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredTasks.map(t => t.id)));
  };

  const bulkChangeStatus = async (newStatus: string) => {
    const ids = Array.from(selectedIds);
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("tasks").update(updates).in("id", ids);
    if (error) { toast.error(t("tasks.statusChangeError")); return; }
    toast.success(t("tasks.bulkStatusChanged", { count: ids.length }));
    setSelectedIds(new Set());
    invalidate();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (error) { toast.error(t("tasks.deleteError")); return; }
    toast.success(t("tasks.bulkDeleted", { count: ids.length }));
    setSelectedIds(new Set());
    invalidate();
  };

  const openCreate = () => { setForm(emptyForm); setShowCreate(true); };

  const openEdit = (t: Task) => {
    setForm({ title: t.title, description: t.description || "", priority: t.priority, category: t.category, due_date: t.due_date || "", assignee_id: t.assignee_id || "" });
    setEditTask(t);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    if (editTask) {
      const { error } = await supabase.from("tasks").update({ title: form.title.trim(), description: form.description.trim() || null, priority: form.priority as Task["priority"], category: form.category as Task["category"], due_date: form.due_date || null, assignee_id: form.assignee_id || null }).eq("id", editTask.id);
      if (error) toast.error(t("tasks.updateError"));
      else { toast.success(t("tasks.updated")); setEditTask(null); }
    } else {
      const { error } = await supabase.from("tasks").insert([{ title: form.title.trim(), description: form.description.trim() || null, priority: form.priority as Task["priority"], category: form.category as Task["category"], due_date: form.due_date || null, assignee_id: form.assignee_id || null, created_by: user.id, team_id: selectedTeamId || null }]);
      if (error) toast.error(t("tasks.createError"));
      else { toast.success(t("tasks.created")); setShowCreate(false); }
    }
    setSaving(false);
    invalidate();
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTask.id);
    if (error) toast.error(t("tasks.deleteError"));
    else toast.success(t("tasks.deleted"));
    setDeleteTask(null);
    invalidate();
  };

  const changeStatus = async (task: Task, newStatus: string) => {
    const oldStatus = task.status;
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (error) { toast.error(t("tasks.statusChangeError")); return; }
    invalidate();
    toast.success(`Status → ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`, {
      action: {
        label: t("tasks.undo"),
        onClick: async () => {
          const undo: Record<string, any> = { status: oldStatus, updated_at: new Date().toISOString() };
          if (oldStatus === "done") undo.completed_at = task.completed_at;
          else undo.completed_at = null;
          await supabase.from("tasks").update(undo).eq("id", task.id);
          toast.success(t("tasks.statusReverted"));
          invalidate();
        },
      },
    });
  };

  const prepareTaskExport = () => filteredTasks.map((task) => ({
    ...task,
    assignee_name: task.assignee_id ? profileMap[task.assignee_id] : undefined,
  }));

  if (tasksError) return <AppLayout><QueryErrorRetry onRetry={refetchTasks} /></AppLayout>;
  if (isLoading) return <AppLayout><AnalysisPageSkeleton cards={3} sections={1} /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title={t("tasks.title")}
        subtitle={t("tasks.subtitle")}
        role="execution"
        help={{ title: t("tasks.title"), description: t("tasks.helpDesc") }}
        secondaryActions={
          tasks.length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" /> {t("common.export")}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { exportTasksExcel(prepareTaskExport()); toast.success("Excel exportiert"); }} className="gap-2"><FileText className="w-4 h-4" /> Excel (.xlsx)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportTasksCSV(prepareTaskExport()); toast.success(t("decisions.csvExported", "CSV exportiert")); }} className="gap-2"><FileText className="w-4 h-4" /> CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5">
                <FileUp className="w-4 h-4" /> {t("common.import")}
              </Button>
            </>
          ) : undefined
        }
        primaryAction={
          tasks.length > 0 ? (
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="w-4 h-4" /> {t("tasks.newTask")}
            </Button>
          ) : undefined
        }
      />
      {!selectedTeamId && (
        <p className="text-xs text-muted-foreground -mt-3 mb-2">{t("common.personalHint")}</p>
      )}

      {tasks.length === 0 ? (
        <EmptyAnalysisState
          icon={ListTodo}
          title={t("tasks.emptyTitle")}
          description={t("tasks.emptyDesc")}
          ctaLabel={t("tasks.createFirst")}
          onCtaClick={openCreate}
          motivation={t("tasks.emptyMotivation", { defaultValue: "Teams mit strukturiertem Task-Management berichten von deutlich schnellerer Projektabwicklung und weniger vergessenen Aufgaben." })}
          hint={t("tasks.emptyHint", { defaultValue: "Verknüpfe Aufgaben mit Entscheidungen für lückenloses Tracking." })}
          features={[
            { icon: Target, label: t("tasks.featurePriority", { defaultValue: "Priorisierung" }), desc: t("tasks.featurePriorityDesc", { defaultValue: "Kritische Aufgaben automatisch hervorheben" }) },
            { icon: GitBranch, label: t("tasks.featureLink", { defaultValue: "Verknüpfungen" }), desc: t("tasks.featureLinkDesc", { defaultValue: "Aufgaben mit Entscheidungen verbinden" }) },
            { icon: TrendingUp, label: t("tasks.featureKanban", { defaultValue: "Kanban-Board" }), desc: t("tasks.featureKanbanDesc", { defaultValue: "Visuelles Workflow-Management" }) },
          ]}
          quickActions={[
            {
              label: t("tasks.loadDemo", { defaultValue: "Demo laden" }),
              icon: Zap,
              onClick: async () => {
                toast.info(t("tasks.demoCreating"));
                const { data, error } = await supabase.functions.invoke("seed-demo-data");
                if (error || data?.error) { toast.error(data?.error || t("tasks.demoError")); return; }
                toast.success(t("tasks.demoCreated")); window.location.reload();
              },
            },
          ]}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={t("tasks.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 relative">
                  <Filter className="w-4 h-4" />
                  {t("tasksPage.filterLabel")}
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">{t("tasksPage.filterLabel")}</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <X className="w-3 h-3" /> {t("tasks.resetFilters")}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("tasksPage.filterStatus")}</p>
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
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("tasksPage.filterPriority")}</p>
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
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("tasksPage.filterCategory")}</p>
                    <div className="flex flex-wrap gap-1">
                      {CATEGORY_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => toggleFilter(filterCategory, o.value, setFilterCategory)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${filterCategory.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} className="border border-border/60 rounded-lg">
              <ToggleGroupItem value="list" className="px-2 py-1 h-9" aria-label={t("tasksPage.listView")}>
                <List className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="kanban" className="px-2 py-1 h-9" aria-label={t("tasksPage.kanbanView")}>
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Quick-Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">{t("savedViews.quickFilters", "Schnellfilter")}:</span>
            {[
              { key: "overdue", label: t("tasksPage.chipOverdue", "Überfällig"), count: chipCounts.overdue, show: chipCounts.overdue > 0 },
              { key: "critical", label: t("tasksPage.chipCritical", "Kritisch"), count: chipCounts.critical, show: chipCounts.critical > 0 },
              { key: "blocked", label: t("tasksPage.chipBlocked", "Blockiert"), count: chipCounts.blocked, show: chipCounts.blocked > 0 },
              { key: "myOpen", label: t("tasksPage.chipMyOpen", "Meine offenen"), count: chipCounts.myOpen, show: true },
            ].filter(c => c.show).map(chip => (
              <button
                key={chip.key}
                onClick={() => setQuickChip(quickChip === chip.key ? null : chip.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  quickChip === chip.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/60"
                }`}
              >
                {chip.label}
                {chip.count > 0 && (
                  <span className={`px-1 py-0 rounded text-[9px] font-bold ${
                    quickChip === chip.key ? "bg-primary-foreground/20" : chip.key === "overdue" ? "bg-destructive/20 text-destructive" : "bg-muted"
                  }`}>{chip.count}</span>
                )}
              </button>
            ))}
            {quickChip && (
              <button onClick={() => setQuickChip(null)} className="px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3 inline mr-0.5" /> {t("common.reset")}
              </button>
            )}
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-xs font-medium">{selectedIds.size} {t("tasksPage.selected", "ausgewählt")}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                {STATUS_OPTIONS.filter(s => s.value !== "backlog").map(s => (
                  <Button key={s.value} variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => bulkChangeStatus(s.value)}>
                    → {s.label}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10" onClick={bulkDelete}>
                  <Trash2 className="w-3 h-3 mr-1" /> {t("common.delete")}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setSelectedIds(new Set())}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {viewMode === "kanban" ? (
            <TaskKanbanBoard tasks={filteredTasks} profileMap={profileMap} onStatusChange={changeStatus} onEdit={openEdit} onDelete={setDeleteTask} />
          ) : (
            <Card className="overflow-hidden border-border/60">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                     <th className="p-3 w-8">
                       <input type="checkbox" checked={selectedIds.size === filteredTasks.length && filteredTasks.length > 0} onChange={selectAll} className="rounded border-input" />
                     </th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground w-8"></th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("tasks.title")}</th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("decisions.priorityLabel")}</th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("decisions.categoryLabel")}</th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("decisions.owner")}</th>
                     <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("decisions.due")}</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                   {filteredTasks.length === 0 ? (
                    <tr><td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">{t("common.noResults")}</td></tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const sc = STATUS_CONFIG[task.status];
                      const StatusIcon = sc.icon;
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

                      return (
                        <tr key={task.id} className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${isOverdue ? "bg-destructive/[0.03]" : ""}`}>
                          <td className="p-3">
                            <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} className="rounded border-input" />
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                const cycle: Record<string, string> = { backlog: "open", open: "in_progress", in_progress: "done", blocked: "open", done: "backlog" };
                                changeStatus(task, cycle[task.status] || "open");
                              }}
                              className={sc.color}
                              title={t("tasksPage.statusToggle")}
                            >
                              <StatusIcon className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium hover:text-primary transition-colors ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                              {isOverdue && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30">{t("tasksPage.chipOverdue", "Überfällig")}</Badge>}
                            </div>
                            {task.description && <p className="text-xs text-muted-foreground truncate max-w-[300px]">{task.description}</p>}
                            {taskDecisionMap[task.id] && (
                              <Link
                                to={`/decisions/${taskDecisionMap[task.id].decisionId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 mt-0.5 hover:underline text-[11px] text-muted-foreground"
                              >
                                <LinkIcon className="w-3 h-3 text-muted-foreground" />
                                {taskDecisionMap[task.id].decisionTitle}
                              </Link>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${statusStyles[task.status] || ""}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs font-semibold uppercase ${priorityStyles[task.priority] || ""}`}>
                              {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[task.category] || task.category}</span>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{task.assignee_id ? profileMap[task.assignee_id] || <span className="text-[11px] text-muted-foreground">{t("tasksPage.unassigned", "Nicht zugewiesen")}</span> : <span className="text-[11px] text-muted-foreground">{t("tasksPage.unassigned", "Nicht zugewiesen")}</span>}</span>
                              {task.assignee_id && (
                                <QuickMessageButton
                                  teamId={task.team_id}
                                  decisionId={null}
                                  contextLabel={task.title}
                                  recipientName={profileMap[task.assignee_id]}
                                  recipientId={task.assignee_id}
                                />
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs ${!isOverdue ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                              {task.due_date ? format(new Date(task.due_date), "dd.MM.yy", { locale: dateFnsLocale }) : "—"}
                              {isOverdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                            </span>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}`)} className="gap-2">
                                   <Eye className="w-3.5 h-3.5" /> {t("common.open")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => openEdit(task)} className="gap-2">
                                   <Pencil className="w-3.5 h-3.5" /> {t("common.edit")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => setDeleteTask(task)} className="gap-2 text-destructive focus:text-destructive">
                                   <Trash2 className="w-3.5 h-3.5" /> {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      <Dialog open={showCreate || !!editTask} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditTask(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTask ? t("common.edit") : t("tasks.newTask")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("tasksPage.titleLabel")}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("tasksPage.titlePlaceholder")} />
            </div>
            <div>
              <Label>{t("tasksPage.descriptionLabel")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder={t("tasksPage.descriptionPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("tasksPage.priorityLabel")}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("tasksPage.categoryLabel")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("tasksPage.dueLabel")}</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>{t("tasksPage.assigneeLabel")}</Label>
                <Select value={form.assignee_id || "__none__"} onValueChange={(v) => setForm({ ...form, assignee_id: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder={t("tasksPage.assigneeNone")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("tasksPage.assigneeNone")}</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || t("tasksPage.assigneeUnknown")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => { setShowCreate(false); setEditTask(null); }}>{t("common.cancel")}</Button>
             <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
               {saving ? t("settings.saving") : t("settings.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTask} onOpenChange={(o) => !o && setDeleteTask(null)}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>{t("common.delete")}?</DialogTitle>
           </DialogHeader>
           <p className="text-sm text-muted-foreground">
             „{deleteTask?.title}"
           </p>
           <DialogFooter>
             <Button variant="outline" onClick={() => setDeleteTask(null)}>{t("common.cancel")}</Button>
             <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImportDialog open={showImport} onOpenChange={setShowImport} mode="tasks" onImported={invalidate} />
    </AppLayout>
  );
};

export default Tasks;
