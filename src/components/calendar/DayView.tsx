import { memo, DragEvent, useMemo } from "react";
import { format, isToday, differenceInCalendarDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { AlertTriangle, DollarSign, Zap, TrendingUp, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import DecisionPill from "./DecisionPill";
import TaskPill from "./TaskPill";
import type { Task } from "@/hooks/useTasks";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

const PRIORITY_DOT_COLOR: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground/50",
};

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

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  proposed: "bg-primary/20 text-primary",
  review: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  implemented: "bg-success/20 text-success",
  archived: "bg-muted text-muted-foreground",
};

const DayView = memo(({
  day, decisionsByDate, tasksByDate = {},
  dragOverDate, draggingId, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDecisionClick, profileMap,
}: DayViewProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const dateKey = format(day, "yyyy-MM-dd");
  const dayDecisions = decisionsByDate[dateKey] ?? [];
  const dayTasks = tasksByDate[dateKey] ?? [];
  const today = isToday(day);
  const isDropTarget = dragOverDate === dateKey;

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

  // Merge decisions and tasks into a single sorted list
  const allItems = useMemo(() => {
    const items: Array<{ type: "decision" | "task"; data: any; sortTime: number }> = [];
    for (const d of dayDecisions) {
      items.push({ type: "decision", data: d, sortTime: new Date(d.created_at).getTime() });
    }
    for (const t of dayTasks) {
      items.push({ type: "task", data: t, sortTime: new Date(t.created_at).getTime() });
    }
    items.sort((a, b) => a.sortTime - b.sortTime);
    return items;
  }, [dayDecisions, dayTasks]);

  const hasItems = allItems.length > 0;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
      <div className={cn("px-4 py-4 border-b border-border/60", today && "bg-primary/5")}>
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
        className={cn(
          "transition-all duration-150 px-4 py-3",
          isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40",
        )}
      >
        {hasItems ? (
          <div className="space-y-1.5">
            {allItems.map((item) => {
              if (item.type === "decision") {
                const d = item.data;
                const cod = d.cost_per_day ? Number(d.cost_per_day) : 0;
                const codWeekly = cod * 7;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer border border-border/30"
                    onClick={() => onDecisionClick(d.id)}
                    draggable
                    onDragStart={(e) => onDragStart(e as unknown as DragEvent, d.id)}
                    onDragEnd={onDragEnd}
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", PRIORITY_DOT_COLOR[d.priority] || "bg-muted-foreground/50")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", STATUS_STYLES[d.status] || "bg-muted text-muted-foreground")}>
                        {d.status}
                      </span>
                      {codWeekly > 0 && (
                        <span className="text-[11px] font-semibold text-destructive">
                          ⏱ {codWeekly >= 1000 ? `${(codWeekly / 1000).toFixed(1)}k` : codWeekly.toFixed(0)}€/Wo
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {t("cal.allDay", "Ganztägig")}
                      </span>
                    </div>
                  </div>
                );
              } else {
                const task = item.data as Task;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors border border-border/30"
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", PRIORITY_DOT_COLOR[task.priority] || "bg-muted-foreground/50")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {task.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {t("cal.allDay", "Ganztägig")}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
            <CalendarOff className="w-10 h-10 mb-2" />
            <p className="text-sm">{t("cal.noDeadlines", "Keine Deadlines für diesen Tag")}</p>
          </div>
        )}
      </div>
    </div>
  );
});

DayView.displayName = "DayView";

export default DayView;