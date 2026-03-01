import { memo, DragEvent, useMemo } from "react";
import { format, isSameMonth, isToday, differenceInCalendarDays, addDays, startOfWeek } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import DecisionPill from "./DecisionPill";
import TaskPill from "./TaskPill";
import CompliancePill from "./CompliancePill";
import type { Task } from "@/hooks/useTasks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface SlaConfig {
  priority: string;
  category: string;
  escalation_hours_warn: number;
  escalation_hours_urgent: number;
  escalation_hours_overdue: number;
}

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
  slaConfigs?: SlaConfig[];
  complianceByDate?: Record<string, any[]>;
  predictedViolationDates?: Set<string>;
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
  monthDays, currentDate, decisionsByDate, tasksByDate = {}, complianceByDate = {},
  dragOverDate, draggingId, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDecisionClick, profileMap,
  slaConfigs = [], predictedViolationDates = new Set(),
}: MonthViewProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const weekdayHeaders = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), "EEEEEE", { locale: dateFnsLocale }));
  }, [dateFnsLocale]);

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
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-7 border-b border-border/60">
        {weekdayHeaders.map((day) => (
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
          const dayCompliance = complianceByDate[dateKey] ?? [];
          const totalItems = dayDecisions.length + dayTasks.length + dayCompliance.length;
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const isDropTarget = dragOverDate === dateKey;
          const riskLevel = getDayRiskLevel(dayDecisions);
          const delayCost = getDayDelayCost(dayDecisions);
          const isPredictedViolation = predictedViolationDates.has(dateKey);
          const hasSLAViolation = dayDecisions.some((d) => {
            // Dynamic SLA check using sla_configs
            if (slaConfigs.length > 0) {
              const config = slaConfigs.find(c => c.priority === d.priority && c.category === d.category)
                || slaConfigs.find(c => c.priority === d.priority);
              if (config && d.due_date) {
                const hoursOverdue = (Date.now() - new Date(d.due_date).getTime()) / (1000 * 60 * 60);
                if (hoursOverdue > config.escalation_hours_overdue) return true;
              }
            }
            return (d.escalation_level ?? 0) >= 2 || (d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status));
          });
          const weekIdx = Math.floor(idx / 7);
          const isFirstInWeek = idx % 7 === 0;
          const momentum = weekMomentums[weekIdx];

          return (
              <div
                key={idx}
                onDragOver={(e) => onDragOver(e as unknown as DragEvent, dateKey)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e as unknown as DragEvent, dateKey)}
                className={cn(
                  "min-h-[100px] md:min-h-[120px] border-b border-r border-border/40 p-1.5 transition-all duration-150 relative",
                  !inMonth && "bg-muted/30",
                  today && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                  isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/40",
                  riskLevel === "danger" && "bg-destructive/5",
                  riskLevel === "warn" && "bg-warning/5",
                  isPredictedViolation && !hasSLAViolation && "ring-2 ring-inset ring-warning/50",
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
                        <TooltipContent className="text-xs">{t("cal.slaViolation")}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {delayCost > 0 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-[9px] font-semibold text-destructive">
                            {delayCost >= 1000 ? `${(delayCost / 1000).toFixed(1)}k €` : `${delayCost} €`}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {t("cal.delayCost", { cost: delayCost.toLocaleString() })}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {totalItems > 0 && (
                      <span className="text-[10px] text-muted-foreground">{totalItems}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  {dayCompliance.map((ev: any) => (
                    <CompliancePill key={ev.id} event={ev} />
                  ))}
                  {dayDecisions.slice(0, Math.max(0, 3 - dayCompliance.length)).map((decision) => (
                    <DecisionPill key={decision.id} decision={decision} draggingId={draggingId} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onDecisionClick} profileMap={profileMap} />
                  ))}
                  {dayTasks.slice(0, Math.max(0, 3 - dayDecisions.length - dayCompliance.length)).map((task) => (
                    <TaskPill key={task.id} task={task} profileMap={profileMap} />
                  ))}
                  {totalItems > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1.5">
                      {t("cal.more", { count: totalItems - 3 })}
                    </span>
                  )}
                </div>
              </div>
          );
        })}
      </div>
    </div>
  );
});

MonthView.displayName = "MonthView";

export default MonthView;
