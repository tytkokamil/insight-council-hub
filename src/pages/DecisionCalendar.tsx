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
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ViewMode } from "@/components/calendar/CalendarConstants";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import CalendarLegend from "@/components/calendar/CalendarLegend";
import CalendarFilterBar, { type CalendarFilters } from "@/components/calendar/CalendarFilterBar";

const DecisionCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    status: new Set(),
    priority: new Set(),
    category: new Set(),
  });
  const { data: decisions } = useDecisions();
  const { data: profiles } = useProfiles();
  const queryClient = useQueryClient();

  const profileMap = useMemo(() => buildProfileMap(profiles ?? []), [profiles]);

  const handleFilterToggle = useCallback((type: keyof CalendarFilters, value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[type]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [type]: next };
    });
  }, []);

  const handleFilterClear = useCallback(() => {
    setFilters({ status: new Set(), priority: new Set(), category: new Set() });
  }, []);

  const decisionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const d of decisions ?? []) {
      if (!d.due_date) continue;
      // Apply filters
      if (filters.status.size > 0 && !filters.status.has(d.status)) continue;
      if (filters.priority.size > 0 && !filters.priority.has(d.priority)) continue;
      if (filters.category.size > 0 && !filters.category.has(d.category)) continue;
      const key = d.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [decisions, filters]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const selectedDecisionData = useMemo(
    () => decisions?.find((d) => d.id === selectedDecision) ?? null,
    [decisions, selectedDecision]
  );

  const goBack = useCallback(() => {
    setCurrentDate((d) => (viewMode === "month" ? subMonths(d, 1) : subWeeks(d, 1)));
  }, [viewMode]);

  const goForward = useCallback(() => {
    setCurrentDate((d) => (viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1)));
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const headerLabel = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: de });
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const we = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(ws, "d. MMM", { locale: de })} – ${format(we, "d. MMM yyyy", { locale: de })}`;
  }, [currentDate, viewMode]);

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

  const handleDragLeave = useCallback(() => setDragOverDate(null), []);

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
            <CalendarFilterBar filters={filters} onToggle={handleFilterToggle} onClear={handleFilterClear} />
            <div className="w-px h-6 bg-border" />
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
            <Button variant="outline" size="sm" onClick={goToday}>Heute</Button>
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[160px] text-center">{headerLabel}</span>
            <Button variant="ghost" size="icon" onClick={goForward}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === "month" ? (
          <MonthView
            monthDays={monthDays}
            currentDate={currentDate}
            decisionsByDate={decisionsByDate}
            dragOverDate={dragOverDate}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDecisionClick={setSelectedDecision}
            profileMap={profileMap}
          />
        ) : (
          <WeekView
            weekDays={weekDays}
            decisionsByDate={decisionsByDate}
            dragOverDate={dragOverDate}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDecisionClick={setSelectedDecision}
            profileMap={profileMap}
          />
        )}

        <CalendarLegend />
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
