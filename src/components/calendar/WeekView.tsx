import { memo, DragEvent } from "react";
import { formatCost, formatNumber } from "@/lib/formatters";
import { format, isToday, differenceInCalendarDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AlertTriangle, DollarSign } from "lucide-react";
import DecisionPill from "./DecisionPill";
import TaskPill from "./TaskPill";
import type { Task } from "@/hooks/useTasks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface WeekViewProps {
  weekDays: Date[];
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

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

const WeekView = memo(({
  weekDays, decisionsByDate, tasksByDate = {},
  dragOverDate, draggingId, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDecisionClick, profileMap,
}: WeekViewProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-7 border-b border-border/60">
        {weekDays.map((day, idx) => {
          const today = isToday(day);
          const dateKey = format(day, "yyyy-MM-dd");
          const dayDecisions = decisionsByDate[dateKey] ?? [];
          const hasEscalated = dayDecisions.some((d) => (d.escalation_level ?? 0) >= 1);
          const hasOverdue = dayDecisions.some(
            (d) => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status)
          );

          return (
            <div key={idx} className={cn("px-3 py-3 text-center border-r border-border/40 last:border-r-0", today && "bg-primary/5")}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {format(day, "EEEE", { locale: dateFnsLocale })}
              </p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <p className={cn("text-lg font-bold", today ? "text-primary" : "text-foreground")}>{format(day, "d")}</p>
                {(hasEscalated || hasOverdue) && <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />}
              </div>
              <p className="text-[10px] text-muted-foreground">{format(day, "MMM", { locale: dateFnsLocale })}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayDecisions = decisionsByDate[dateKey] ?? [];
          const dayTasks = tasksByDate[dateKey] ?? [];
          const today = isToday(day);
          const isDropTarget = dragOverDate === dateKey;
          const hasEscalated = dayDecisions.some((d) => (d.escalation_level ?? 0) >= 1);
          const hasCritical = dayDecisions.some((d) => d.priority === "critical");
          const hasOverdue = dayDecisions.some(
            (d) => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status)
          );
          let delayCost = 0;
          for (const d of dayDecisions) {
            if (!d.due_date || ["implemented", "rejected", "archived"].includes(d.status)) continue;
            const days = differenceInCalendarDays(new Date(), new Date(d.due_date));
            if (days > 0) delayCost += days * 120 * (PRIORITY_MULTIPLIER[d.priority] ?? 1);
          }

          return (
            <div
              key={idx}
              onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
              className={cn(
                "min-h-[300px] border-r border-border/40 last:border-r-0 p-2 transition-all duration-150",
                today && "bg-primary/5",
                isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40",
                (hasEscalated || (hasCritical && hasOverdue)) && "bg-destructive/5",
                !hasEscalated && (hasCritical || hasOverdue) && "bg-warning/5",
              )}
            >
              {delayCost > 0 && (
                <div className="flex items-center gap-0.5 mb-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-[9px] font-semibold text-destructive flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5" />
                        {formatCost(delayCost)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {t("cal.delayCost", { cost: formatNumber(delayCost) })}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              <div className="space-y-1">
                {dayDecisions.map((decision) => (
                  <DecisionPill key={decision.id} decision={decision} draggingId={draggingId} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onDecisionClick} profileMap={profileMap} showTime />
                ))}
                {dayTasks.map((task) => (
                  <TaskPill key={task.id} task={task} profileMap={profileMap} />
                ))}
                {dayDecisions.length === 0 && dayTasks.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/40 text-center pt-8">{t("cal.noEntries")}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

WeekView.displayName = "WeekView";

export default WeekView;
