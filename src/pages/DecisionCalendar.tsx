import { useState, useMemo, useCallback, useEffect, DragEvent, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns";
import { de } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Rows3, CalendarRange, Download, CheckSquare, Layers, Users2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useTasks, type Task } from "@/hooks/useTasks";
import DecisionDetailDialog from "@/components/decisions/DecisionDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { ViewMode } from "@/components/calendar/CalendarConstants";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import CalendarLegend from "@/components/calendar/CalendarLegend";
import CalendarFilterBar, { type CalendarFilters } from "@/components/calendar/CalendarFilterBar";
import UnscheduledSidebar from "@/components/calendar/UnscheduledSidebar";
import { exportDecisionsAsICS } from "@/components/calendar/exportICS";
import { ScrollArea } from "@/components/ui/scroll-area";
import TaskPill from "@/components/calendar/TaskPill";
import CalendarSummaryBar from "@/components/calendar/CalendarSummaryBar";
import { usePredictiveSla, getPredictedViolationDates } from "@/components/decisions/PredictiveSlaWarning";
import { useReviews } from "@/hooks/useDecisions";
import CalendarLayerToggles, { type CalendarLayers, DEFAULT_LAYERS } from "@/components/calendar/CalendarLayerToggles";
import MeetingPlannerDialog from "@/components/calendar/MeetingPlannerDialog";

const DecisionCalendar = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [layers, setLayers] = useState<CalendarLayers>(DEFAULT_LAYERS);
  const [meetingPlannerOpen, setMeetingPlannerOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    status: new Set(),
    priority: new Set(),
    category: new Set(),
  });
  const { data: decisions } = useDecisions();
  const { data: allTasks = [] } = useTasks();
  const { data: profiles } = useProfiles();
  const [slaConfigs, setSlaConfigs] = useState<any[]>([]);
  const [complianceEvents, setComplianceEvents] = useState<any[]>([]);
  const { data: calReviews = [] } = useReviews();
  const { predictions: slaPredictions } = usePredictiveSla(decisions ?? [], calReviews);
  const predictedViolationDates = useMemo(() => getPredictedViolationDates(slaPredictions), [slaPredictions]);
  const queryClient = useQueryClient();

  // Load SLA configs and compliance events
  useEffect(() => {
    supabase.from("sla_configs").select("*").then(({ data }) => {
      if (data) setSlaConfigs(data);
    });
    supabase.from("compliance_events").select("*").then(({ data }) => {
      if (data) setComplianceEvents(data);
    });
  }, []);

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

  const applyFilters = useCallback((d: any) => {
    if (filters.status.size > 0 && !filters.status.has(d.status)) return false;
    if (filters.priority.size > 0 && !filters.priority.has(d.priority)) return false;
    if (filters.category.size > 0 && !filters.category.has(d.category)) return false;
    return true;
  }, [filters]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const tk of allTasks) {
      if (!tk.due_date) continue;
      const key = tk.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(tk);
    }
    return map;
  }, [allTasks]);

  // Layer-filtered decisions
  const decisionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const d of decisions ?? []) {
      if (!d.due_date) continue;
      if (!applyFilters(d)) continue;

      // Layer filtering
      const isApproved = d.status === "approved" || d.status === "implemented";
      const isOverdue = d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status);
      
      // If only showing approved layer, skip non-approved
      if (!layers.deadlines && !isApproved && !isOverdue) continue;
      if (!layers.approved && isApproved && !isOverdue) continue;

      const key = d.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [decisions, applyFilters, layers]);

  // SLA events layer
  const slaByDate = useMemo(() => {
    if (!layers.sla) return {};
    // SLA dates come from predictedViolationDates
    return Object.fromEntries(
      Array.from(predictedViolationDates).map(d => [d, true])
    );
  }, [predictedViolationDates, layers.sla]);

  // Compliance events layer
  const filteredComplianceByDate = useMemo(() => {
    if (!layers.compliance) return {};
    const map: Record<string, any[]> = {};
    for (const ev of complianceEvents) {
      if (!ev.event_date) continue;
      const key = ev.event_date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [complianceEvents, layers.compliance]);

  const unscheduledDecisions = useMemo(() => {
    return (decisions ?? []).filter((d) => !d.due_date && applyFilters(d));
  }, [decisions, applyFilters]);

  const unscheduledTasks = useMemo(() => {
    return allTasks.filter((tk) => !tk.due_date);
  }, [allTasks]);

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
    setCurrentDate((d) => {
      if (viewMode === "month") return subMonths(d, 1);
      if (viewMode === "week") return subWeeks(d, 1);
      return subDays(d, 1);
    });
  }, [viewMode]);

  const goForward = useCallback(() => {
    setCurrentDate((d) => {
      if (viewMode === "month") return addMonths(d, 1);
      if (viewMode === "week") return addWeeks(d, 1);
      return addDays(d, 1);
    });
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const headerLabel = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: dateFnsLocale });
    if (viewMode === "day") return format(currentDate, "EEEE, d. MMMM yyyy", { locale: dateFnsLocale });
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const we = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(ws, "d. MMM", { locale: dateFnsLocale })} – ${format(we, "d. MMM yyyy", { locale: dateFnsLocale })}`;
  }, [currentDate, viewMode, dateFnsLocale]);

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
    const formattedNew = format(new Date(newDateKey), "dd.MM.yyyy", { locale: dateFnsLocale });

    const { error } = await supabase
      .from("decisions")
      .update({ due_date: newDateKey })
      .eq("id", decisionId);

    if (error) {
      toast.error(t("calendar.moveError"), { description: error.message });
    } else {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      toast.success(t("calendar.dateChanged"), {
        description: `„${decision.title}" → ${formattedNew}`,
        action: {
          label: t("calendar.undo"),
          onClick: async () => {
            const { error: undoError } = await supabase
              .from("decisions")
              .update({ due_date: oldDate })
              .eq("id", decisionId);
            if (undoError) {
              toast.error(t("calendar.undoFailed"));
            } else {
              toast.success(t("calendar.undone"));
              queryClient.invalidateQueries({ queryKey: ["decisions"] });
            }
          },
        },
      });
    }
  }, [decisions, queryClient, dateFnsLocale, t]);

  const handleExportICS = useCallback(() => {
    if (!decisions?.length) {
      toast.error(t("calendar.noExportData"));
      return;
    }
    exportDecisionsAsICS(decisions);
    toast.success(t("calendar.exported"), { description: t("calendar.exportedDesc") });
  }, [decisions, t]);

  const sharedDragProps = {
    dragOverDate,
    draggingId,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onDecisionClick: setSelectedDecision,
    profileMap,
    tasksByDate,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={t("calendar.title")}
          subtitle={t("calendar.subtitle")}
          role="execution"
          help={{ title: t("calendar.title"), description: t("calendar.help") }}
          secondaryActions={
            <>
              <CalendarLayerToggles layers={layers} onChange={setLayers} />
              <CalendarFilterBar filters={filters} onToggle={handleFilterToggle} onClear={handleFilterClear} />
              <Button variant="outline" size="sm" onClick={() => setMeetingPlannerOpen(true)} className="gap-1.5 text-xs">
                <Users2 className="w-3.5 h-3.5" />
                Meeting planen
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportICS} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" />
                {t("calendar.exportCalendar")}
              </Button>
            </>
          }
        />
        <div className="flex items-center justify-between gap-2 flex-wrap -mt-4 mb-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="border border-border/60 rounded-lg"
          >
            <ToggleGroupItem value="month" aria-label={t("calendar.monthView")} className="px-2.5 py-1.5 text-xs gap-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              {t("calendar.month")}
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label={t("calendar.weekView")} className="px-2.5 py-1.5 text-xs gap-1">
              <Rows3 className="w-3.5 h-3.5" />
              {t("calendar.week")}
            </ToggleGroupItem>
            <ToggleGroupItem value="day" aria-label={t("calendar.dayView")} className="px-2.5 py-1.5 text-xs gap-1">
              <CalendarRange className="w-3.5 h-3.5" />
              {t("calendar.day")}
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>{t("calendar.today")}</Button>
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[160px] text-center">{headerLabel}</span>
            <Button variant="ghost" size="icon" onClick={goForward}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary bar */}
        <CalendarSummaryBar
          decisions={decisions ?? []}
          tasks={allTasks}
          currentDate={currentDate}
          viewMode={viewMode}
        />

        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {viewMode === "month" && (
                <MonthView
                  monthDays={monthDays}
                  currentDate={currentDate}
                  decisionsByDate={decisionsByDate}
                  slaConfigs={slaConfigs}
                  complianceByDate={filteredComplianceByDate}
                  predictedViolationDates={layers.sla ? predictedViolationDates : new Set()}
                  {...sharedDragProps}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  weekDays={weekDays}
                  decisionsByDate={decisionsByDate}
                  {...sharedDragProps}
                />
              )}
              {viewMode === "day" && (
                <DayView
                  day={currentDate}
                  decisionsByDate={decisionsByDate}
                  {...sharedDragProps}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Unscheduled section below calendar */}
        {(unscheduledDecisions.length > 0 || unscheduledTasks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unscheduledDecisions.length > 0 && (
              <UnscheduledSidebar
                decisions={unscheduledDecisions}
                draggingId={draggingId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDecisionClick={setSelectedDecision}
                profileMap={profileMap}
              />
            )}
            {unscheduledTasks.length > 0 && (
              <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border/60 flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">{t("calendar.unscheduledTasks")}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                    {unscheduledTasks.length}
                  </span>
                </div>
                <ScrollArea className="max-h-[300px]">
                  <div className="p-2 space-y-1">
                    {unscheduledTasks.map((task) => (
                      <TaskPill key={task.id} task={task} profileMap={profileMap} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
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

      <MeetingPlannerDialog
        open={meetingPlannerOpen}
        onOpenChange={setMeetingPlannerOpen}
        decisions={decisions ?? []}
        profileMap={profileMap}
      />
    </AppLayout>
  );
};

export default DecisionCalendar;
