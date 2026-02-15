import { memo, DragEvent, useMemo } from "react";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { Sunrise, Sun, CloudSun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEKDAYS_LONG } from "./CalendarConstants";
import DecisionPill from "./DecisionPill";

const TIME_SLOTS = [
  { key: "morning", label: "Morgens", subtitle: "06:00 – 12:00", icon: Sunrise },
  { key: "midday", label: "Mittags", subtitle: "12:00 – 14:00", icon: Sun },
  { key: "afternoon", label: "Nachmittags", subtitle: "14:00 – 18:00", icon: CloudSun },
  { key: "evening", label: "Abends", subtitle: "18:00 – 23:59", icon: Moon },
] as const;

/**
 * Distribute decisions across time slots based on created_at time.
 * Decisions without a meaningful time default to morning.
 */
function distributeBySlot(decisions: any[]) {
  const slots: Record<string, any[]> = { morning: [], midday: [], afternoon: [], evening: [] };
  for (const d of decisions) {
    const hour = new Date(d.created_at).getHours();
    if (hour < 12) slots.morning.push(d);
    else if (hour < 14) slots.midday.push(d);
    else if (hour < 18) slots.afternoon.push(d);
    else slots.evening.push(d);
  }
  return slots;
}

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
  const dayOfWeek = (day.getDay() + 6) % 7;

  const slotted = useMemo(() => distributeBySlot(dayDecisions), [dayDecisions]);

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
      </div>

      <div
        onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
        className={cn(
          "transition-all duration-150",
          isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40"
        )}
      >
        {TIME_SLOTS.map(({ key, label, subtitle, icon: Icon }) => {
          const slotDecisions = slotted[key] ?? [];
          return (
            <div key={key} className="border-b border-border last:border-b-0">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-muted/30">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground">{subtitle}</span>
                {slotDecisions.length > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                    {slotDecisions.length}
                  </span>
                )}
              </div>
              <div className="min-h-[80px] px-4 py-2">
                {slotDecisions.length > 0 ? (
                  <div className="space-y-1">
                    {slotDecisions.map((decision) => (
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
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/30 text-center py-4">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

DayView.displayName = "DayView";

export default DayView;
