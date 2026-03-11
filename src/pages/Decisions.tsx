import { useState, useMemo, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import type { SortField, SortDir } from "@/components/decisions/DecisionTable";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import DecisionsPageSkeleton from "@/components/decisions/DecisionsPageSkeleton";
import { Plus, Download, FileText, FileUp } from "lucide-react";
import QueryErrorRetry from "@/components/shared/QueryErrorRetry";
import { useTranslatedLabels } from "@/lib/labels";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import NewDecisionDialog from "@/components/decisions/NewDecisionDialog";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";
import ImportDialog from "@/components/shared/ImportDialog";
import DecisionFilterBar from "@/components/decisions/DecisionFilterBar";
import DecisionTable from "@/components/decisions/DecisionTable";
import DecisionBulkActions from "@/components/decisions/DecisionBulkActions";
import DecisionSideDrawer from "@/components/decisions/DecisionSideDrawer";
import DecisionEmptyState from "@/components/decisions/DecisionEmptyState";
import DemoBanner from "@/components/shared/DemoBanner";
import { useDecisions, useTeams, useProfiles, buildProfileMap, useInvalidateDecisions, useDependencies, useReviews } from "@/hooks/useDecisions";
import { usePredictiveSla } from "@/components/decisions/PredictiveSlaWarning";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTasks } from "@/hooks/useTasks";
import { exportCSV, exportPDF } from "@/lib/exportDecisions";
import { exportDecisionsExcel } from "@/lib/exportExcel";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Decisions = () => {
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const STATUS_OPTIONS = Object.entries(tl.statusLabels).map(([value, label]) => ({ value, label }));
  const PRIORITY_OPTIONS = Object.entries(tl.priorityLabels).map(([value, label]) => ({ value, label }));
  const CATEGORY_OPTIONS = Object.entries(tl.categoryLabels).map(([value, label]) => ({ value, label }));

  const { data: decisions = [], isLoading: decisionsLoading, isError: decisionsError, refetch: refetchDecisions } = useDecisions();
  const { data: teams = [] } = useTeams();
  const { data: profiles = [] } = useProfiles();
  const { data: allDeps = [] } = useDependencies();
  const { data: allTasks = [] } = useTasks();
  const { data: allReviews = [] } = useReviews();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedTeamId } = useTeamContext();
  const { user } = useAuth();
  const teamMap: Record<string, string> = {};
  teams.forEach(t => { teamMap[t.id] = t.name; });

  const { data: goalLinks = [] } = useQuery({
    queryKey: ["decision-goal-links"],
    queryFn: async () => {
      const { data } = await supabase.from("decision_goal_links").select("decision_id, impact_weight");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // ── Per-decision metadata ──
  const decisionMeta = useMemo(() => {
    const meta: Record<string, { openTasks: number; depCount: number; cost: number; alignment: number; isOverdue: boolean; isEscalated: boolean; needsReview: boolean; isBlocked: boolean; isHighRisk: boolean }> = {};
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    const now = new Date();
    const priorityMult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

    decisions.forEach(d => {
      let openTasks = 0, depCount = 0, isBlocked = false;
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

  // ── Filter state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterTeam, setFilterTeam] = useState<string[]>([]);
  const [quickChip, setQuickChip] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // ── Dialog state ──
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editDecision, setEditDecision] = useState<any>(null);
  const [deleteDecision, setDeleteDecision] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [previewDecision, setPreviewDecision] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Auto-open new decision dialog from onboarding
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      searchParams.delete("create");
      setSearchParams(searchParams, { replace: true });
      setShowNewDialog(true);
    }
  }, [searchParams, setSearchParams]);

  // ── Chip counts ──
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  // ── Filtered + sorted decisions ──
  const filtered = useMemo(() => {
    let result = decisions.filter((d) => {
      if (debouncedSearch && !d.title.toLowerCase().includes(debouncedSearch.toLowerCase()) && !d.description?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (filterStatus.length > 0 && !filterStatus.includes(d.status)) return false;
      if (filterPriority.length > 0 && !filterPriority.includes(d.priority)) return false;
      if (filterCategory.length > 0 && !filterCategory.includes(d.category)) return false;
      if (filterTeam.length > 0 && (!d.team_id || !filterTeam.includes(d.team_id))) return false;
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
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "title": cmp = a.title.localeCompare(b.title); break;
          case "status": cmp = a.status.localeCompare(b.status); break;
          case "priority": cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9); break;
          case "risk": cmp = (a.ai_risk_score || 0) - (b.ai_risk_score || 0); break;
          case "due_date": {
            const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
            const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
            cmp = da - db; break;
          }
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    }
    return result;
  }, [decisions, debouncedSearch, filterStatus, filterPriority, filterCategory, filterTeam, quickChip, decisionMeta, sortField, sortDir]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterStatus, filterPriority, filterCategory, filterTeam, quickChip]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedDecisions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Actions ──
  const clearAllFilters = () => {
    setFilterStatus([]); setFilterPriority([]); setFilterCategory([]); setFilterTeam([]); setQuickChip(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(d => d.id)));
  };

  const handleBulkStatus = async (newStatus: string) => {
    const ids = Array.from(selectedIds);
    const updates: Record<string, any> = { status: newStatus as any, updated_at: new Date().toISOString() };
    if (newStatus === "implemented") updates.implemented_at = new Date().toISOString();
    if (newStatus === "archived") updates.archived_at = new Date().toISOString();
    const { error } = await supabase.from("decisions").update(updates).in("id", ids);
    if (!error) { toast.success(`${ids.length} ${t("decisions.title")} → ${tl.statusLabels[newStatus]}`); setSelectedIds(new Set()); invalidate(); }
  };

  const handleBulkTeam = async (teamId: string | null) => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("decisions").update({ team_id: teamId, updated_at: new Date().toISOString() } as any).in("id", ids);
    if (!error) { toast.success(`${ids.length} ${t("decisions.title")} → ${teamId ? teamMap[teamId] : t("common.personal")}`); setSelectedIds(new Set()); invalidate(); }
  };

  const prepareExport = () => filtered.map((d) => ({
    ...d, team_name: d.team_id ? teamMap[d.team_id] : undefined,
    assignee_name: d.assignee_id ? profileMap[d.assignee_id] : undefined,
    creator_name: profileMap[d.created_by],
  }));

  if (decisionsError) {
    return (
      <AppLayout>
        <QueryErrorRetry onRetry={refetchDecisions} message={t("decisions.loadError", "Entscheidungen konnten nicht geladen werden")} />
      </AppLayout>
    );
  }

  if (decisionsLoading) {
    return <AppLayout><DecisionsPageSkeleton /></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader
        title={t("decisions.title")}
        subtitle={decisions.length === 0 ? t("decisions.overviewSubtitle", "Überblick über alle Entscheidungen") : filtered.length < decisions.length ? t("decisions.countShown", { total: decisions.length, shown: filtered.length }) : t("decisions.subtitle", { total: decisions.length })}
        role="execution"
        help={{ title: t("decisions.title"), description: t("decisions.helpDesc") }}
        secondaryActions={
          decisions.length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-3.5 h-3.5" /> {t("common.export")}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { exportDecisionsExcel(prepareExport()); toast.success("Excel exportiert"); }} className="gap-2"><FileText className="w-3.5 h-3.5" /> Excel (.xlsx)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportCSV(prepareExport()); toast.success(t("decisions.csvExported")); }} className="gap-2"><FileText className="w-3.5 h-3.5" /> CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportPDF(prepareExport())} className="gap-2"><FileText className="w-3.5 h-3.5" /> PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5"><FileUp className="w-3.5 h-3.5" /> {t("common.import")}</Button>
            </>
          ) : undefined
        }
        primaryAction={
          decisions.length > 0 ? (
            <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> {t("decisions.newButton")}</Button>
          ) : undefined
        }
      />
      {!selectedTeamId && decisions.length > 0 && (
        <p className="text-[11px] text-muted-foreground/60 -mt-3 mb-2">{t("common.personalHint")}</p>
      )}

      <DemoBanner />
      {decisions.length === 0 ? (
        <DecisionEmptyState onNewDecision={() => setShowNewDialog(true)} />
      ) : (
        <>
          <DecisionFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterPriority={filterPriority} setFilterPriority={setFilterPriority}
            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
            filterTeam={filterTeam} setFilterTeam={setFilterTeam}
            quickChip={quickChip} setQuickChip={setQuickChip}
            statusOptions={STATUS_OPTIONS}
            priorityOptions={PRIORITY_OPTIONS}
            categoryOptions={CATEGORY_OPTIONS}
            teams={teams}
            chipCounts={chipCounts}
          />

          <AnimatePresence>
            {selectedIds.size > 0 && (
              <DecisionBulkActions
                selectedCount={selectedIds.size}
                statusOptions={STATUS_OPTIONS}
                teams={teams}
                teamMap={teamMap}
                onBulkStatus={handleBulkStatus}
                onBulkTeam={handleBulkTeam}
                onExportSelected={() => { exportCSV(prepareExport().filter(d => selectedIds.has(d.id))); toast.success("Exportiert"); }}
                onClear={() => setSelectedIds(new Set())}
              />
            )}
          </AnimatePresence>

          <DecisionTableWithPredictions
            filtered={paginatedDecisions}
            decisionMeta={decisionMeta}
            profileMap={profileMap}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            setPreviewDecision={setPreviewDecision}
            setEditDecision={setEditDecision}
            setDeleteDecision={setDeleteDecision}
            STATUS_OPTIONS={STATUS_OPTIONS}
            tl={tl}
            userId={user?.id}
            invalidate={invalidate}
            clearAllFilters={clearAllFilters}
            sortField={sortField}
            sortDir={sortDir}
            handleSort={handleSort}
            allDecisions={decisions}
            allReviews={allReviews}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                {t("decisions.showingRange", {
                  from: (currentPage - 1) * PAGE_SIZE + 1,
                  to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                  defaultValue: `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} von ${filtered.length}`,
                })}
              </p>
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setCurrentPage(p => p - 1)} className="cursor-pointer" />
                    </PaginationItem>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <span key={p} className="contents">
                          {showEllipsis && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                          <PaginationItem>
                            <PaginationLink isActive={p === currentPage} onClick={() => setCurrentPage(p)} className="cursor-pointer">
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        </span>
                      );
                    })}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext onClick={() => setCurrentPage(p => p + 1)} className="cursor-pointer" />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <DecisionSideDrawer
        decision={previewDecision}
        meta={previewDecision ? decisionMeta[previewDecision.id] : null}
        onClose={() => setPreviewDecision(null)}
        onUpdate={setPreviewDecision}
        statusOptions={STATUS_OPTIONS}
        statusLabels={tl.statusLabels}
        priorityLabels={tl.priorityLabels}
        categoryLabels={tl.categoryLabels}
        onInvalidate={invalidate}
      />

      <NewDecisionDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreated={invalidate} />
      {editDecision && <EditDecisionDialog decision={editDecision} open={!!editDecision} onOpenChange={(open) => { if (!open) setEditDecision(null); }} onUpdated={invalidate} />}
      {deleteDecision && <DeleteDecisionDialog decision={deleteDecision} open={!!deleteDecision} onOpenChange={(open) => { if (!open) setDeleteDecision(null); }} onDeleted={invalidate} />}
      <ImportDialog open={showImport} onOpenChange={setShowImport} mode="decisions" onImported={invalidate} />
    </AppLayout>
  );
};

/* Wrapper to compute predictions and pass to DecisionTable */
const DecisionTableWithPredictions = ({ filtered, decisionMeta, profileMap, selectedIds, toggleSelect, toggleSelectAll, setPreviewDecision, setEditDecision, setDeleteDecision, STATUS_OPTIONS, tl, userId, invalidate, clearAllFilters, sortField, sortDir, handleSort, allDecisions, allReviews }: any) => {
  const { predictions } = usePredictiveSla(allDecisions, allReviews);
  return (
    <DecisionTable
      decisions={filtered}
      decisionMeta={decisionMeta}
      profileMap={profileMap}
      selectedIds={selectedIds}
      onToggleSelect={toggleSelect}
      onToggleSelectAll={toggleSelectAll}
      onPreview={setPreviewDecision}
      onEdit={setEditDecision}
      onDelete={setDeleteDecision}
      statusOptions={STATUS_OPTIONS}
      statusLabels={tl.statusLabels}
      priorityLabels={tl.priorityLabels}
      categoryLabels={tl.categoryLabels}
      userId={userId}
      onInvalidate={invalidate}
      onClearFilters={clearAllFilters}
      sortField={sortField}
      sortDir={sortDir}
      onSort={handleSort}
      slaPredictions={predictions}
    />
  );
};

export default Decisions;
