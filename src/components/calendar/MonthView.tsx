import { memo, DragEvent } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { WEEKDAYS } from "./CalendarConstants";
import DecisionPill from "./DecisionPill";

interface MonthViewProps {
  monthDays: Date[];
  currentDate: Date;
  decisionsByDate: Record<string, any[]>;
  dragOverDate: string | null;
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent, dateKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent, dateKey: string) => void;
  onDecisionClick: (id: string) => void;
}

const MonthView = memo(({
  monthDays,
  currentDate,
  decisionsByDate,
  dragOverDate,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDecisionClick,
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
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onClick={onDecisionClick}
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
));

MonthView.displayName = "MonthView";

export default MonthView;
