import { memo, DragEvent, useMemo } from "react";
import { format, isSameMonth, isToday, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertTriangle, DollarSign } from "lucide-react";
import { WEEKDAYS } from "./CalendarConstants";
import DecisionPill from "./DecisionPill";
import TaskPill from "./TaskPill";
import type { Task } from "@/hooks/useTasks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MonthViewProps {
  monthDays: Date[];
  currentDate: Date;
  decisionsByDate: Record<string, any[]>;
  tasksByDate?: Record<string, Task[]>;
  dragOverDate: string | null;
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent, dateKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent, dateKey: string) => void;
  onDecisionClick: (id: string) => void;
  profileMap?: Record<string, string>;
}

const PRIORITY_MULTIPLIER: Record<string, number> = {
  critical: 4, high: 2.5, medium: 1.5, low: 1,
};

function getDayRiskLevel(decisions: any[]): "none" | "warn" | "danger" {
  const hasEscalated = decisions.some((d) => (d.escalation_level ?? 0) >= 1);
  const hasCritical = decisions.some((d) => d.priority === "critical");
  const hasOverdue = decisions.some(
    (d) => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status)
  );
  if (hasEscalated || (hasCritical && hasOverdue)) return "danger";
  if (hasCritical || hasOverdue) return "warn";
  return "none";
}

function getDayDelayCost(decisions: any[]): number {
  let cost = 0;
  for (const d of decisions) {
    if (!d.due_date || ["implemented", "rejected", "archived"].includes(d.status)) continue;
    const days = differenceInCalendarDays(new Date(), new Date(d.due_date));
    if (days > 0) {
      cost += days * 120 * (PRIORITY_MULTIPLIER[d.priority] ?? 1);
    }
  }
  return cost;
}

// Calculate week momentum (green/yellow/red)
function getWeekMomentum(weekDecisions: any[]): "green" | "yellow" | "red" | null {
  if (weekDecisions.length === 0) return null;
  const escalated = weekDecisions.filter((d) => (d.escalation_level ?? 0) >= 1).length;
  const critical = weekDecisions.filter((d) => d.priority === "critical").length;
  const overdue = weekDecisions.filter(
    (d) => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status)
  ).length;
  if (escalated >= 2 || critical >= 3 || overdue >= 3) return "red";
  if (escalated >= 1 || critical >= 1 || overdue >= 1) return "yellow";
  return "green";
}

const MonthView = memo(({
  monthDays,
  currentDate,
  decisionsByDate,
  tasksByDate = {},
  dragOverDate,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDecisionClick,
  profileMap,
}: MonthViewProps) => {
  // Calculate weekly momentum indicators
  const weekMomentums = useMemo(() => {
    const result: Record<number, "green" | "yellow" | "red" | null> = {};
    const weeks = Math.ceil(monthDays.length / 7);
    for (let w = 0; w < weeks; w++) {
      const weekDays = monthDays.slice(w * 7, (w + 1) * 7);
      const weekDecisions: any[] = [];
      for (const d of weekDays) {
        const key = format(d, "yyyy-MM-dd");
        weekDecisions.push(...(decisionsByDate[key] ?? []));
      }
      result[w] = getWeekMomentum(weekDecisions);
    }
    return result;
  }, [monthDays, decisionsByDate]);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-[28px_repeat(7,1fr)] border-b border-border">
        <div className="px-1 py-2.5" /> {/* momentum column header */}
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[28px_repeat(7,1fr)]">
        {monthDays.map((day, idx) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayDecisions = decisionsByDate[dateKey] ?? [];
          const dayTasks = tasksByDate[dateKey] ?? [];
          const totalItems = dayDecisions.length + dayTasks.length;
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const isDropTarget = dragOverDate === dateKey;

          const riskLevel = getDayRiskLevel(dayDecisions);
          const delayCost = getDayDelayCost(dayDecisions);
          const hasSLAViolation = dayDecisions.some(
            (d) => (d.escalation_level ?? 0) >= 2 || (d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status))
          );

          const weekIdx = Math.floor(idx / 7);
          const isFirstInWeek = idx % 7 === 0;
          const momentum = weekMomentums[weekIdx];

          return (
            <>
              {/* Week momentum indicator */}
              {isFirstInWeek && (
                <div className="row-span-1 flex items-center justify-center border-b border-r border-border">
                  {momentum && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          momentum === "green" && "bg-success",
                          momentum === "yellow" && "bg-warning",
                          momentum === "red" && "bg-destructive animate-pulse",
                        )} />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        {momentum === "green" && "Gute Woche – keine kritischen Engpässe"}
                        {momentum === "yellow" && "Hohe Belastung – kritische Entscheidungen"}
                        {momentum === "red" && "Kritische Woche – Eskalationen & Überfälligkeiten"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
              <div
                key={idx}
                onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
                className={cn(
                  "min-h-[100px] md:min-h-[120px] border-b border-r border-border p-1.5 transition-all duration-150 relative",
                  !inMonth && "bg-muted/30",
                  today && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                  isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40",
                  riskLevel === "danger" && "bg-destructive/5",
                  riskLevel === "warn" && "bg-warning/5",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      today && "bg-primary text-primary-foreground font-bold",
                      !inMonth && "text-muted-foreground/40"
                    )}>
                      {format(day, "d")}
                    </span>
                    {hasSLAViolation && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">SLA-Verletzung aktiv</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {delayCost > 0 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-[9px] font-semibold text-destructive flex items-center gap-0.5">
                            <DollarSign className="w-2.5 h-2.5" />
                            {delayCost >= 1000 ? `${(delayCost / 1000).toFixed(1)}k` : delayCost}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Verzögerungskosten: {delayCost.toLocaleString("de-DE")}€
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {totalItems > 0 && (
                      <span className="text-[10px] text-muted-foreground">{totalItems}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  {dayDecisions.slice(0, 3).map((decision) => (
                    <DecisionPill
                      key={decision.id}
                      decision={decision}
                      draggingId={draggingId}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onClick={onDecisionClick}
                      profileMap={profileMap}
                    />
                  ))}
                  {dayTasks.slice(0, Math.max(0, 3 - dayDecisions.length)).map((task) => (
                    <TaskPill key={task.id} task={task} profileMap={profileMap} />
                  ))}
                  {totalItems > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1.5">
                      +{totalItems - 3} weitere
                    </span>
                  )}
                </div>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
});

MonthView.displayName = "MonthView";

export default MonthView;
