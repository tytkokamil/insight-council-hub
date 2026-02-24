import { memo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { priorityColor, statusDot } from "./CalendarConstants";
import { useTranslation } from "react-i18next";

export interface CalendarFilters {
  status: Set<string>;
  priority: Set<string>;
  category: Set<string>;
}

interface CalendarFilterBarProps {
  filters: CalendarFilters;
  onToggle: (type: keyof CalendarFilters, value: string) => void;
  onClear: () => void;
}

const FilterSection = ({
  title, options, selected, type, onToggle, renderIndicator,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  type: keyof CalendarFilters;
  onToggle: (type: keyof CalendarFilters, value: string) => void;
  renderIndicator?: (value: string) => React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{title}</p>
    <div className="space-y-1">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1 transition-colors">
          <Checkbox checked={selected.has(opt.value)} onCheckedChange={() => onToggle(type, opt.value)} className="h-3.5 w-3.5" />
          {renderIndicator?.(opt.value)}
          <span className="text-xs">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const CalendarFilterBar = memo(({ filters, onToggle, onClear }: CalendarFilterBarProps) => {
  const { t } = useTranslation();
  const activeCount = filters.status.size + filters.priority.size + filters.category.size;

  const STATUS_OPTIONS = [
    { value: "draft", label: t("cal.statusDraft") },
    { value: "proposed", label: t("cal.statusProposed") },
    { value: "review", label: t("cal.statusReview") },
    { value: "approved", label: t("cal.statusApproved") },
    { value: "rejected", label: t("cal.statusRejected") },
    { value: "implemented", label: t("cal.statusImplemented") },
    { value: "archived", label: t("cal.statusArchived") },
  ];

  const PRIORITY_OPTIONS = [
    { value: "critical", label: t("cal.prioCritical") },
    { value: "high", label: t("cal.prioHigh") },
    { value: "medium", label: t("cal.prioMedium") },
    { value: "low", label: t("cal.prioLow") },
  ];

  const CATEGORY_OPTIONS = [
    { value: "strategic", label: t("cal.catStrategic") },
    { value: "budget", label: t("cal.catBudget") },
    { value: "hr", label: t("cal.catHr") },
    { value: "technical", label: t("cal.catTechnical") },
    { value: "operational", label: t("cal.catOperational") },
    { value: "marketing", label: t("cal.catMarketing") },
  ];

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5" />
            {t("cal.filter")}
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{activeCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t("cal.filter")}</p>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear} className="h-6 text-[10px] px-2 gap-1">
                <X className="w-3 h-3" /> {t("cal.reset")}
              </Button>
            )}
          </div>
          <FilterSection title={t("cal.statusLabel")} options={STATUS_OPTIONS} selected={filters.status} type="status" onToggle={onToggle}
            renderIndicator={(v) => <span className={cn("w-2 h-2 rounded-full shrink-0", statusDot[v])} />} />
          <FilterSection title={t("cal.priorityLabel")} options={PRIORITY_OPTIONS} selected={filters.priority} type="priority" onToggle={onToggle}
            renderIndicator={(v) => <span className={cn("w-3 h-2 rounded-sm shrink-0", priorityColor[v])} />} />
          <FilterSection title={t("cal.categoryLabel")} options={CATEGORY_OPTIONS} selected={filters.category} type="category" onToggle={onToggle} />
        </PopoverContent>
      </Popover>
    </div>
  );
});

CalendarFilterBar.displayName = "CalendarFilterBar";

export default CalendarFilterBar;
