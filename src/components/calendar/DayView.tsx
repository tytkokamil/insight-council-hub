import { memo, DragEvent } from "react";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WEEKDAYS_LONG } from "./CalendarConstants";
import DecisionPill from "./DecisionPill";

interface DayViewProps {
  day: Date;
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

const DayView = memo(({
  day,
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
}: DayViewProps) => {
  const dateKey = format(day, "yyyy-MM-dd");
  const dayDecisions = decisionsByDate[dateKey] ?? [];
  const today = isToday(day);
  const isDropTarget = dragOverDate === dateKey;
  const dayOfWeek = (day.getDay() + 6) % 7; // Monday = 0

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className={cn(
        "px-4 py-4 border-b border-border",
        today && "bg-primary/5"
      )}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {WEEKDAYS_LONG[dayOfWeek]}
        </p>
        <p className={cn(
          "text-2xl font-bold mt-0.5",
          today ? "text-primary" : "text-foreground"
        )}>
          {format(day, "d. MMMM yyyy", { locale: de })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dayDecisions.length} {dayDecisions.length === 1 ? "Entscheidung" : "Entscheidungen"}
        </p>
      </div>
      <div
        onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
        className={cn(
          "min-h-[400px] p-3 transition-all duration-150",
          isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40"
        )}
      >
        <div className="space-y-1.5">
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
            <p className="text-sm text-muted-foreground/40 text-center pt-16">
              Keine Deadlines an diesem Tag
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

DayView.displayName = "DayView";

export default DayView;
