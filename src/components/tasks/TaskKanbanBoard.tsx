import { memo, useMemo, useState, DragEvent } from "react";
import type { Task } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_COLUMNS = [
  { key: "backlog", label: "Backlog", color: "border-t-muted-foreground/40" },
  { key: "open", label: "Offen", color: "border-t-muted-foreground" },
  { key: "in_progress", label: "In Arbeit", color: "border-t-warning" },
  { key: "blocked", label: "Blockiert", color: "border-t-destructive" },
  { key: "done", label: "Erledigt", color: "border-t-success" },
] as const;

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: "bg-destructive/20 text-destructive", label: "Kritisch" },
  high: { color: "bg-warning/20 text-warning", label: "Hoch" },
  medium: { color: "bg-primary/20 text-primary", label: "Mittel" },
  low: { color: "bg-muted text-muted-foreground", label: "Niedrig" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Allgemein",
  strategic: "Strategisch",
  operational: "Operativ",
  technical: "Technisch",
  hr: "Personal",
  marketing: "Marketing",
  budget: "Budget",
};

interface TaskKanbanBoardProps {
  tasks: Task[];
  profileMap: Record<string, string>;
  onStatusChange: (task: Task, newStatus: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const TaskKanbanBoard = memo(({ tasks, profileMap, onStatusChange, onEdit, onDelete }: TaskKanbanBoardProps) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = { backlog: [], open: [], in_progress: [], blocked: [], done: [] };
    tasks.forEach(t => { (map[t.status] ??= []).push(t); });
    return map;
  }, [tasks]);

  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  };

  const handleDrop = (e: DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);
    const taskId = e.dataTransfer.getData("text/plain");
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      onStatusChange(task, status);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {STATUS_COLUMNS.map(col => (
        <div
          key={col.key}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(col.key); }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => handleDrop(e, col.key)}
          className={cn(
            "rounded-xl border border-border/60 border-t-4 bg-card transition-colors min-h-[300px]",
            col.color,
            dragOverCol === col.key && "bg-primary/5 ring-2 ring-inset ring-primary/30"
          )}
        >
          <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-semibold">{col.label}</span>
            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
              {columns[col.key]?.length ?? 0}
            </span>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2 space-y-2">
              {(columns[col.key] ?? []).map(task => {
                const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    className={cn(
                      "rounded-lg border border-border/60 bg-background p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all",
                      draggingId === task.id && "opacity-40 scale-95"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className={cn("text-xs font-medium leading-tight", task.status === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                      {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0", pc.color)}>{pc.label}</Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{CATEGORY_LABELS[task.category]}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {task.due_date && (
                          <span className={cn("flex items-center gap-0.5", isOverdue && "text-destructive")}>
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(task.due_date), "dd.MM", { locale: de })}
                          </span>
                        )}
                        {task.assignee_id && (
                          <span className="truncate max-w-[80px]">{profileMap[task.assignee_id] || "Zugewiesen"}</span>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(task)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(columns[col.key] ?? []).length === 0 && (
                <p className="text-[11px] text-muted-foreground/40 text-center py-8">
                  Aufgaben hierher ziehen
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
});

TaskKanbanBoard.displayName = "TaskKanbanBoard";

export default TaskKanbanBoard;
