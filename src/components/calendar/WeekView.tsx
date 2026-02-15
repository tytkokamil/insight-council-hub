import { memo, DragEvent } from "react";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WEEKDAYS_LONG } from "./CalendarConstants";
import DecisionPill from "./DecisionPill";

interface WeekViewProps {
  weekDays: Date[];
  decisionsByDate: Record<string, any[]>;
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

const WeekView = memo(({
  weekDays,
  decisionsByDate,
  dragOverDate,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDecisionClick,
  profileMap,
}: WeekViewProps) => (
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
            onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
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
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onClick={onDecisionClick}
                  profileMap={profileMap}
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
));

WeekView.displayName = "WeekView";

export default WeekView;
