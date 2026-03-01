import { memo } from "react";
import { CheckSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/useTasks";
import { useTranslation } from "react-i18next";

const STATUS_DOT: Record<string, string> = {
  open: "bg-muted-foreground",
  in_progress: "bg-warning",
  done: "bg-success",
};

const TASK_PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-destructive/70 text-destructive-foreground",
  high: "bg-warning/70 text-warning-foreground",
  medium: "bg-accent text-accent-foreground",
  low: "bg-muted/80 text-muted-foreground",
};

interface TaskPillProps {
  task: Task;
  profileMap?: Record<string, string>;
}

const TaskPill = memo(({ task, profileMap }: TaskPillProps) => {
  const { t } = useTranslation();
  const assigneeName = task.assignee_id && profileMap?.[task.assignee_id];

  const STATUS_LABELS: Record<string, string> = {
    open: t("cal.taskStatusOpen"),
    in_progress: t("cal.taskStatusProgress"),
    done: t("cal.taskStatusDone"),
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className={cn(
          "w-full text-left rounded px-1.5 py-1 text-[11px] font-medium truncate flex items-center gap-1 hover:opacity-90 transition-all cursor-default",
          TASK_PRIORITY_COLOR[task.priority] || TASK_PRIORITY_COLOR.medium
        )}>
          <CheckSquare className="w-3 h-3 shrink-0 opacity-70" />
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[task.status] || STATUS_DOT.open)} />
          <span className="truncate">{task.title}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-64 p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="font-semibold text-sm leading-tight">{t("cal.taskLabel")}</p>
          </div>
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-3">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1", STATUS_DOT[task.status])} />
              {STATUS_LABELS[task.status]}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
          </div>
          {assigneeName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
              <User className="w-3 h-3" />
              <span>{assigneeName}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});

TaskPill.displayName = "TaskPill";

export default TaskPill;
