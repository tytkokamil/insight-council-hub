import { useState } from "react";
import { Search, Filter, X, Bookmark, Pin, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSavedViews, SavedViewFilters } from "@/hooks/useSavedViews";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";

interface DecisionFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: string[];
  setFilterStatus: (v: string[]) => void;
  filterPriority: string[];
  setFilterPriority: (v: string[]) => void;
  filterCategory: string[];
  setFilterCategory: (v: string[]) => void;
  filterTeam: string[];
  setFilterTeam: (v: string[]) => void;
  quickChip: string | null;
  setQuickChip: (v: string | null) => void;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  teams: { id: string; name: string }[];
  chipCounts: { overdue: number; escalated: number; review: number; highRisk: number; blocked: number };
}

const DecisionFilterBar = ({
  searchQuery, onSearchChange,
  filterStatus, setFilterStatus,
  filterPriority, setFilterPriority,
  filterCategory, setFilterCategory,
  filterTeam, setFilterTeam,
  quickChip, setQuickChip,
  statusOptions, priorityOptions, categoryOptions,
  teams, chipCounts,
}: DecisionFilterBarProps) => {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const { views, createView, updateView, deleteView } = useSavedViews("decisions");
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");

  const activeFilterCount = filterStatus.length + filterPriority.length + filterCategory.length + filterTeam.length + (quickChip ? 1 : 0);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setFilterStatus([]); setFilterPriority([]); setFilterCategory([]); setFilterTeam([]); setQuickChip(null);
    setActiveViewId(null);
  };

  const currentFilters: SavedViewFilters = { status: filterStatus, priority: filterPriority, category: filterCategory, team: filterTeam, quickChip };

  const applyView = (filters: SavedViewFilters) => {
    setFilterStatus(filters.status ?? []);
    setFilterPriority(filters.priority ?? []);
    setFilterCategory(filters.category ?? []);
    setFilterTeam(filters.team ?? []);
    setQuickChip(filters.quickChip ?? null);
  };

  // System quick-views (merged from old quick chips + saved views)
  const systemViews: { key: string; label: string; count?: number; filters: SavedViewFilters }[] = [
    { key: "overdue", label: t("savedViews.overdue", "Überfällig"), count: chipCounts.overdue, filters: { quickChip: "overdue" } },
    { key: "review", label: t("savedViews.myReviews", "Meine Reviews"), count: chipCounts.review, filters: { quickChip: "review" } },
    { key: "highRisk", label: t("savedViews.highRisk", "High Risk"), count: chipCounts.highRisk, filters: { quickChip: "highRisk" } },
    { key: "strategic", label: t("savedViews.strategic", "Strategisch"), filters: { category: ["strategic"] } },
    { key: "critical", label: t("savedViews.critical", "Kritisch"), filters: { priority: ["critical"] } },
  ];

  const pinnedViews = views.filter(v => v.is_pinned);
  const unpinnedViews = views.filter(v => !v.is_pinned);

  const filterGroups = [
    { label: t("decisions.statusLabel"), options: statusOptions, state: filterStatus, setter: setFilterStatus },
    { label: t("decisions.priorityLabel"), options: priorityOptions, state: filterPriority, setter: setFilterPriority },
    { label: t("decisions.categoryLabel"), options: categoryOptions, state: filterCategory, setter: setFilterCategory },
  ];

  const handleSave = () => {
    if (!saveName.trim()) return;
    createView.mutate(
      { name: saveName.trim(), filters: currentFilters, is_pinned: true },
      {
        onSuccess: () => {
          toast.success(t("savedViews.viewSaved", { name: saveName }));
          setSaveName("");
          setShowSave(false);
        },
      }
    );
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-3 space-y-2.5 -mx-1 px-1">
      {/* Row 1: Search + Filter Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder={t("decisions.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/40 border border-border/60 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 relative">
              <Filter className="w-4 h-4" /> {t("common.filter")}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="end">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{t("common.filter")}</span>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-primary hover:underline flex items-center gap-1"><X className="w-3 h-3" /> {t("common.reset")}</button>
              )}
            </div>
            <div className="space-y-3">
              {filterGroups.map(group => (
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
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("decisions.teamLabel")}</p>
                  <div className="flex flex-wrap gap-1">
                    {teams.map(tm => (
                      <button key={tm.id} onClick={() => toggleFilter(filterTeam, tm.id, setFilterTeam)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${filterTeam.includes(tm.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"}`}>
                        {tm.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 2: Unified Quick Views + Saved Views (single row) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground mr-1">{t("savedViews.quickFilters", "Schnellfilter")}:</span>

        {systemViews.map(sv => (
          <button
            key={sv.key}
            onClick={() => {
              if (activeViewId === sv.key) {
                clearAll();
              } else {
                setActiveViewId(sv.key);
                applyView(sv.filters);
              }
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              activeViewId === sv.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/60"
            }`}
          >
            {sv.label}
            {sv.count != null && sv.count > 0 && (
              <span className={`px-1 py-0 rounded text-[9px] font-bold ${
                activeViewId === sv.key ? "bg-primary-foreground/20" : "bg-muted"
              }`}>{sv.count}</span>
            )}
          </button>
        ))}

        {pinnedViews.length > 0 && <div className="w-px h-4 bg-border mx-0.5" />}

        {pinnedViews.map(v => (
          <div key={v.id} className="group relative">
            <button
              onClick={() => {
                if (activeViewId === v.id) { clearAll(); } else { setActiveViewId(v.id); applyView(v.filters); }
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                activeViewId === v.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/60"
              }`}
            >
              📌 {v.name}
            </button>
            <button
              onClick={() => { deleteView.mutate(v.id); if (activeViewId === v.id) setActiveViewId(null); }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}

        {unpinnedViews.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/50 bg-muted/40 text-muted-foreground hover:border-primary/30 transition-all">
                +{unpinnedViews.length}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1">
                {unpinnedViews.map(v => (
                  <div key={v.id} className="flex items-center gap-1">
                    <button onClick={() => { setActiveViewId(v.id); applyView(v.filters); }} className="flex-1 text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors truncate">{v.name}</button>
                    <button onClick={() => updateView.mutate({ id: v.id, is_pinned: true })} className="p-1 hover:bg-muted rounded"><Pin className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={() => deleteView.mutate(v.id)} className="p-1 hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {activeFilterCount > 0 && (
          <>
            <div className="w-px h-4 bg-border mx-0.5" />
            {showSave ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder={t("savedViews.viewNamePlaceholder", "View-Name...")}
                  className="h-7 w-28 px-2 rounded-md border border-input text-xs bg-background focus:border-primary focus:outline-none"
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={!saveName.trim()}><Save className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setShowSave(false); setSaveName(""); }}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <button onClick={() => setShowSave(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all">
                <Plus className="w-3 h-3" /> {t("savedViews.saveView", "Speichern")}
              </button>
            )}

            <button onClick={clearAll} className="px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3 inline mr-0.5" /> {t("common.reset")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DecisionFilterBar;
