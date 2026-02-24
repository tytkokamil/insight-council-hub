import { memo, DragEvent, useMemo } from "react";
import { format, isToday, differenceInCalendarDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Sunrise, Sun, CloudSun, Moon, AlertTriangle, DollarSign, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import DecisionPill from "./DecisionPill";
import TaskPill from "./TaskPill";
import type { Task } from "@/hooks/useTasks";
import { useTranslation } from "react-i18next";

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

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

const DayView = memo(({
  day, decisionsByDate, tasksByDate = {},
  dragOverDate, draggingId, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDecisionClick, profileMap,
}: DayViewProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const TIME_SLOTS = [
    { key: "morning", label: t("cal.morning"), subtitle: t("cal.morningSub"), icon: Sunrise },
    { key: "midday", label: t("cal.midday"), subtitle: t("cal.middaySub"), icon: Sun },
    { key: "afternoon", label: t("cal.afternoon"), subtitle: t("cal.afternoonSub"), icon: CloudSun },
    { key: "evening", label: t("cal.evening"), subtitle: t("cal.eveningSub"), icon: Moon },
  ] as const;

  const dateKey = format(day, "yyyy-MM-dd");
  const dayDecisions = decisionsByDate[dateKey] ?? [];
  const dayTasks = tasksByDate[dateKey] ?? [];
  const today = isToday(day);
  const isDropTarget = dragOverDate === dateKey;
  

  const slotted = useMemo(() => distributeBySlot(dayDecisions), [dayDecisions]);
  const slottedTasks = useMemo(() => distributeBySlot(dayTasks), [dayTasks]);

  const summary = useMemo(() => {
    const critical = dayDecisions.filter((d) => d.priority === "critical" || d.priority === "high").length;
    const escalated = dayDecisions.filter((d) => (d.escalation_level ?? 0) >= 1).length;
    let delayCost = 0;
    for (const d of dayDecisions) {
      if (!d.due_date || ["implemented", "rejected", "archived"].includes(d.status)) continue;
      const days = differenceInCalendarDays(new Date(), new Date(d.due_date));
      if (days > 0) delayCost += days * 120 * (PRIORITY_MULTIPLIER[d.priority] ?? 1);
    }
    return { total: dayDecisions.length, tasks: dayTasks.length, critical, escalated, delayCost };
  }, [dayDecisions, dayTasks]);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className={cn("px-4 py-4 border-b border-border", today && "bg-primary/5")}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {format(day, "EEEE", { locale: dateFnsLocale })}
            </p>
            <p className={cn("text-2xl font-bold mt-0.5", today ? "text-primary" : "text-foreground")}>
              {format(day, "d. MMMM yyyy", { locale: dateFnsLocale })}
            </p>
          </div>

          {(summary.total > 0 || summary.tasks > 0) && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold">{summary.total}</span>
                <span className="text-muted-foreground">{t("cal.decisions")}</span>
              </div>
              {summary.tasks > 0 && (
                <div className="text-muted-foreground">{summary.tasks} {t("cal.tasks")}</div>
              )}
              {summary.critical > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <Zap className="w-3 h-3" />
                  <span className="font-semibold">{summary.critical} {t("cal.criticalLabel")}</span>
                </div>
              )}
              {summary.escalated > 0 && (
                <div className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-semibold">{summary.escalated} {t("cal.escalatedLabel")}</span>
                </div>
              )}
              {summary.delayCost > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <DollarSign className="w-3 h-3" />
                  <span className="font-semibold">{summary.delayCost.toLocaleString()}€</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
        className={cn("transition-all duration-150", isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40")}
      >
        {TIME_SLOTS.map(({ key, label, subtitle, icon: Icon }) => {
          const slotDecisions = slotted[key] ?? [];
          const slotTasks = slottedTasks[key] ?? [];
          const total = slotDecisions.length + slotTasks.length;
          return (
            <div key={key} className="border-b border-border last:border-b-0">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-muted/30">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground">{subtitle}</span>
                {total > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{total}</span>
                )}
              </div>
              <div className="min-h-[80px] px-4 py-2">
                {total > 0 ? (
                  <div className="space-y-1">
                    {slotDecisions.map((decision) => (
                      <DecisionPill key={decision.id} decision={decision} draggingId={draggingId} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onDecisionClick} profileMap={profileMap} showTime />
                    ))}
                    {slotTasks.map((task) => (
                      <TaskPill key={task.id} task={task as Task} profileMap={profileMap} />
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
