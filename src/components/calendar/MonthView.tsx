import { memo, DragEvent } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { WEEKDAYS } from "./CalendarConstants";
import DecisionPill from "./DecisionPill";
import TaskPill from "./TaskPill";
import type { Task } from "@/hooks/useTasks";

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
}: MonthViewProps) => (
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
        const dayTasks = tasksByDate[dateKey] ?? [];
        const totalItems = dayDecisions.length + dayTasks.length;
        const inMonth = isSameMonth(day, currentDate);
        const today = isToday(day);
        const isDropTarget = dragOverDate === dateKey;

        return (
          <div
            key={idx}
            onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
            className={cn(
              "min-h-[100px] md:min-h-[120px] border-b border-r border-border p-1.5 transition-all duration-150",
              !inMonth && "bg-muted/30",
              today && "bg-primary/5",
              isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40",
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
              {totalItems > 0 && (
                <span className="text-[10px] text-muted-foreground">{totalItems}</span>
              )}
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
        );
      })}
    </div>
  </div>
));

MonthView.displayName = "MonthView";

export default MonthView;
