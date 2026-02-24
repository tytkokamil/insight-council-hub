import { useState } from "react";
import { Search, Filter, X, Clock, ShieldAlert, CheckSquare, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SavedViewsBar from "./SavedViewsBar";
import type { SavedViewFilters } from "@/hooks/useSavedViews";
import { useTranslation } from "react-i18next";

interface ChipCount {
  overdue: number;
  escalated: number;
  review: number;
  highRisk: number;
  blocked: number;
}

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
  chipCounts: ChipCount;
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

  const activeFilterCount = filterStatus.length + filterPriority.length + filterCategory.length + filterTeam.length + (quickChip ? 1 : 0);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setFilterStatus([]); setFilterPriority([]); setFilterCategory([]); setFilterTeam([]); setQuickChip(null);
  };

  const quickChips = [
    { key: "overdue", label: t("decisions.overdue"), count: chipCounts.overdue, icon: Clock, color: "text-destructive" },
    { key: "escalated", label: t("decisions.escalated"), count: chipCounts.escalated, icon: ShieldAlert, color: "text-warning" },
    { key: "review", label: t("decisions.needsReview"), count: chipCounts.review, icon: CheckSquare, color: "text-primary" },
    { key: "highRisk", label: t("decisions.highRisk"), count: chipCounts.highRisk, icon: AlertCircle, color: "text-destructive" },
    { key: "blocked", label: t("decisions.blocked"), count: chipCounts.blocked, icon: Zap, color: "text-warning" },
  ];

  const filterGroups = [
    { label: t("decisions.statusLabel"), options: statusOptions, state: filterStatus, setter: setFilterStatus },
    { label: t("decisions.priorityLabel"), options: priorityOptions, state: filterPriority, setter: setFilterPriority },
    { label: t("decisions.categoryLabel"), options: categoryOptions, state: filterCategory, setter: setFilterCategory },
  ];

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-3 space-y-3">
      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("decisions.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
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
        currentFilters={{ status: filterStatus, priority: filterPriority, category: filterCategory, team: filterTeam, quickChip }}
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
  );
};

export default DecisionFilterBar;
