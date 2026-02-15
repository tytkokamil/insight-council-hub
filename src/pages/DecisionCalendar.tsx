import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions } from "@/hooks/useDecisions";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import { cn } from "@/lib/utils";

const priorityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white dark:bg-orange-600",
  medium: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  review: "bg-yellow-500",
  approved: "bg-green-500",
  implemented: "bg-primary",
  rejected: "bg-destructive",
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const DecisionCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const { data: decisions } = useDecisions();

  // Filter decisions that have a due_date
  const decisionsWithDue = useMemo(() => {
    return (decisions ?? []).filter((d) => d.due_date);
  }, [decisions]);

  // Group decisions by date string
  const decisionsByDate = useMemo(() => {
    const map: Record<string, typeof decisionsWithDue> = {};
    for (const d of decisionsWithDue) {
      const key = d.due_date!;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [decisionsWithDue]);

  // Build calendar grid (always start week on Monday)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedDecisionData = useMemo(
    () => decisions?.find((d) => d.id === selectedDecision) ?? null,
    [decisions, selectedDecision]
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Entscheidungskalender
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Alle Entscheidungen mit Fälligkeitsdatum auf einen Blick
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Heute
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: de })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayDecisions = decisionsByDate[dateKey] ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[100px] md:min-h-[120px] border-b border-r border-border p-1.5 transition-colors",
                    !inMonth && "bg-muted/30",
                    today && "bg-primary/5"
                  )}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        today && "bg-primary text-primary-foreground",
                        !inMonth && "text-muted-foreground/40"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayDecisions.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {dayDecisions.length}
                      </span>
                    )}
                  </div>

                  {/* Decision pills */}
                  <div className="space-y-0.5">
                    {dayDecisions.slice(0, 3).map((decision) => (
                      <Tooltip key={decision.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedDecision(decision.id)}
                            className={cn(
                              "w-full text-left rounded px-1.5 py-0.5 text-[11px] font-medium truncate flex items-center gap-1 hover:opacity-80 transition-opacity",
                              priorityColor[decision.priority] || priorityColor.medium
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                statusDot[decision.status] || statusDot.draft
                              )}
                            />
                            <span className="truncate">{decision.title}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <p className="font-semibold text-sm">{decision.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {decision.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {decision.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {decision.category}
                            </Badge>
                          </div>
                          {decision.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {decision.description}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayDecisions.length > 3 && (
                      <span className="text-[10px] text-muted-foreground pl-1.5">
                        +{dayDecisions.length - 3} weitere
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold">Priorität:</span>
          {Object.entries({ critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" }).map(
            ([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn("w-3 h-2 rounded-sm", priorityColor[key])} />
                {label}
              </div>
            )
          )}
          <span className="ml-4 font-semibold">Status:</span>
          {Object.entries({
            draft: "Entwurf",
            review: "Review",
            approved: "Genehmigt",
            implemented: "Umgesetzt",
            rejected: "Abgelehnt",
          }).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", statusDot[key])} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Decision Detail Dialog */}
      {selectedDecisionData && (
        <DecisionDetailDialog
          decision={selectedDecisionData}
          open={!!selectedDecision}
          onOpenChange={(open) => !open && setSelectedDecision(null)}
          onUpdated={() => {}}
        />
      )}
    </AppLayout>
  );
};

export default DecisionCalendar;
