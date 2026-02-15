import { memo } from "react";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityColor, statusDot } from "./CalendarConstants";

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  review: "Review",
  approved: "Genehmigt",
  implemented: "Umgesetzt",
  rejected: "Abgelehnt",
};

const CalendarLegend = memo(() => (
  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
    <span className="font-semibold">Priorität:</span>
    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
      <div key={key} className="flex items-center gap-1.5">
        <span className={cn("w-3 h-2 rounded-sm", priorityColor[key])} />
        {label}
      </div>
    ))}
    <span className="ml-4 font-semibold">Status:</span>
    {Object.entries(STATUS_LABELS).map(([key, label]) => (
      <div key={key} className="flex items-center gap-1.5">
        <span className={cn("w-2 h-2 rounded-full", statusDot[key])} />
        {label}
      </div>
    ))}
    <span className="ml-4 font-semibold flex items-center gap-1">
      <CheckSquare className="w-3 h-3" />
      = Aufgabe
    </span>
  </div>
));

CalendarLegend.displayName = "CalendarLegend";

export default CalendarLegend;
