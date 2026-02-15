import { useState, useMemo, useCallback, DragEvent } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, GripVertical, LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions } from "@/hooks/useDecisions";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
const WEEKDAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

type ViewMode = "month" | "week";

// Shared decision pill component
const DecisionPill = ({
  decision,
  draggingId,
  onDragStart,
  onDragEnd,
  onClick,
  showTime,
}: {
  decision: any;
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: (id: string) => void;
  showTime?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, decision.id)}
        onDragEnd={onDragEnd}
        onClick={() => onClick(decision.id)}
        className={cn(
          "w-full text-left rounded px-1.5 py-1 text-[11px] font-medium truncate flex items-center gap-1 cursor-grab active:cursor-grabbing hover:opacity-90 transition-all",
          priorityColor[decision.priority] || priorityColor.medium,
          draggingId === decision.id && "opacity-40 scale-95"
        )}
      >
        <GripVertical className="w-3 h-3 shrink-0 opacity-50" />
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot[decision.status] || statusDot.draft)} />
        <span className="truncate">{decision.title}</span>
      </div>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-[250px]">
      <p className="font-semibold text-sm">{decision.title}</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="outline" className="text-[10px] capitalize">{decision.status}</Badge>
        <Badge variant="outline" className="text-[10px] capitalize">{decision.priority}</Badge>
        <Badge variant="outline" className="text-[10px] capitalize">{decision.category}</Badge>
      </div>
      {decision.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{decision.description}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-1.5 italic">Ziehen zum Verschieben</p>
    </TooltipContent>
  </Tooltip>
);

const DecisionCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { data: decisions } = useDecisions();
  const queryClient = useQueryClient();

  const decisionsWithDue = useMemo(() => {
    return (decisions ?? []).filter((d) => d.due_date);
  }, [decisions]);

  const decisionsByDate = useMemo(() => {
    const map: Record<string, typeof decisionsWithDue> = {};
    for (const d of decisionsWithDue) {
      const key = d.due_date!;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [decisionsWithDue]);

  // Month view days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const selectedDecisionData = useMemo(
    () => decisions?.find((d) => d.id === selectedDecision) ?? null,
    [decisions, selectedDecision]
  );

  // Navigation
  const goBack = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const goForward = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: de });
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const we = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(ws, "d. MMM", { locale: de })} – ${format(we, "d. MMM yyyy", { locale: de })}`;
  }, [currentDate, viewMode]);

  // Drag handlers
  const handleDragStart = useCallback((e: DragEvent, decisionId: string) => {
    e.dataTransfer.setData("text/plain", decisionId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(decisionId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent, newDateKey: string) => {
    e.preventDefault();
    setDragOverDate(null);
    setDraggingId(null);

    const decisionId = e.dataTransfer.getData("text/plain");
    if (!decisionId) return;

    const decision = decisions?.find((d) => d.id === decisionId);
    if (!decision || decision.due_date === newDateKey) return;

    const oldDate = decision.due_date;
    const formattedNew = format(new Date(newDateKey), "dd.MM.yyyy", { locale: de });

    const { error } = await supabase
      .from("decisions")
      .update({ due_date: newDateKey })
      .eq("id", decisionId);

    if (error) {
      toast.error("Fehler beim Verschieben", { description: error.message });
    } else {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      toast.success("Fälligkeitsdatum geändert", {
        description: `„${decision.title}" → ${formattedNew}`,
        action: {
          label: "Rückgängig",
          onClick: async () => {
            const { error: undoError } = await supabase
              .from("decisions")
              .update({ due_date: oldDate })
              .eq("id", decisionId);
            if (undoError) {
              toast.error("Rückgängig fehlgeschlagen");
            } else {
              toast.success("Rückgängig gemacht");
              queryClient.invalidateQueries({ queryKey: ["decisions"] });
            }
          },
        },
      });
    }
  }, [decisions, queryClient]);

  // Shared drop zone props
  const dropZoneProps = (dateKey: string) => ({
    onDragOver: (e: DragEvent<HTMLDivElement>) => handleDragOver(e, dateKey),
    onDragLeave: handleDragLeave,
    onDrop: (e: DragEvent<HTMLDivElement>) => handleDrop(e, dateKey),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Entscheidungskalender
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & Drop zum Verschieben von Deadlines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="border border-border rounded-lg"
            >
              <ToggleGroupItem value="month" aria-label="Monatsansicht" className="px-2.5 py-1.5 text-xs gap-1">
                <LayoutGrid className="w-3.5 h-3.5" />
                Monat
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Wochenansicht" className="px-2.5 py-1.5 text-xs gap-1">
                <Rows3 className="w-3.5 h-3.5" />
                Woche
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="w-px h-6 bg-border" />
            <Button variant="outline" size="sm" onClick={goToday}>
              Heute
            </Button>
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[160px] text-center">
              {headerLabel}
            </span>
            <Button variant="ghost" size="icon" onClick={goForward}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* === MONTH VIEW === */}
        {viewMode === "month" && (
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayDecisions = decisionsByDate[dateKey] ?? [];
                const inMonth = isSameMonth(day, currentDate);
                const today = isToday(day);
                const isDropTarget = dragOverDate === dateKey;

                return (
                  <div
                    key={idx}
                    {...dropZoneProps(dateKey)}
                    className={cn(
                      "min-h-[100px] md:min-h-[120px] border-b border-r border-border p-1.5 transition-all duration-150",
                      !inMonth && "bg-muted/30",
                      today && "bg-primary/5",
                      isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        today && "bg-primary text-primary-foreground",
                        !inMonth && "text-muted-foreground/40"
                      )}>
                        {format(day, "d")}
                      </span>
                      {dayDecisions.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{dayDecisions.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayDecisions.slice(0, 3).map((decision) => (
                        <DecisionPill
                          key={decision.id}
                          decision={decision}
                          draggingId={draggingId}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onClick={setSelectedDecision}
                        />
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
        )}

        {/* === WEEK VIEW === */}
        {viewMode === "week" && (
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="grid grid-cols-7 border-b border-border">
              {weekDays.map((day, idx) => {
                const today = isToday(day);
                return (
                  <div key={idx} className={cn(
                    "px-3 py-3 text-center border-r border-border last:border-r-0",
                    today && "bg-primary/5"
                  )}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {WEEKDAYS_LONG[idx]}
                    </p>
                    <p className={cn(
                      "text-lg font-bold mt-0.5",
                      today ? "text-primary" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(day, "MMM", { locale: de })}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayDecisions = decisionsByDate[dateKey] ?? [];
                const today = isToday(day);
                const isDropTarget = dragOverDate === dateKey;

                return (
                  <div
                    key={idx}
                    {...dropZoneProps(dateKey)}
                    className={cn(
                      "min-h-[300px] border-r border-border last:border-r-0 p-2 transition-all duration-150",
                      today && "bg-primary/5",
                      isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40"
                    )}
                  >
                    <div className="space-y-1">
                      {dayDecisions.map((decision) => (
                        <DecisionPill
                          key={decision.id}
                          decision={decision}
                          draggingId={draggingId}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onClick={setSelectedDecision}
                          showTime
                        />
                      ))}
                      {dayDecisions.length === 0 && (
                        <p className="text-[11px] text-muted-foreground/40 text-center pt-8">
                          Keine Deadlines
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
