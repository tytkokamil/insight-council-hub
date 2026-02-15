import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useTasks, useInvalidateTasks, type Task } from "@/hooks/useTasks";
import { useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle, Pencil, Trash2, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";

const STATUS_CONFIG = {
  open: { label: "Offen", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "In Arbeit", icon: Clock, color: "text-warning" },
  done: { label: "Erledigt", icon: CheckCircle2, color: "text-success" },
} as const;

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

const emptyForm = {
  title: "",
  description: "",
  priority: "medium" as string,
  category: "general" as string,
  due_date: "",
};

const Tasks = () => {
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: profiles = [] } = useProfiles();
  const invalidate = useInvalidateTasks();
  const profileMap = buildProfileMap(profiles);

  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      category: t.category,
      due_date: t.due_date || "",
    });
    setEditTask(t);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);

    if (editTask) {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          priority: form.priority as Task["priority"],
          category: form.category as Task["category"],
          due_date: form.due_date || null,
        })
        .eq("id", editTask.id);
      if (error) toast.error("Fehler beim Aktualisieren");
      else { toast.success("Aufgabe aktualisiert"); setEditTask(null); }
    } else {
      const { error } = await supabase.from("tasks").insert([{
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority as Task["priority"],
        category: form.category as Task["category"],
        due_date: form.due_date || null,
        created_by: user.id,
        team_id: selectedTeamId || null,
      }]);
      if (error) toast.error("Fehler beim Erstellen");
      else { toast.success("Aufgabe erstellt"); setShowCreate(false); }
    }

    setSaving(false);
    invalidate();
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTask.id);
    if (error) toast.error("Fehler beim Löschen");
    else toast.success("Aufgabe gelöscht");
    setDeleteTask(null);
    invalidate();
  };

  const changeStatus = async (task: Task, newStatus: string) => {
    const oldStatus = task.status;
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (error) { toast.error("Statusänderung fehlgeschlagen"); return; }
    invalidate();
    toast.success(`Status → ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`, {
      action: {
        label: "Rückgängig",
        onClick: async () => {
          const undo: Record<string, any> = { status: oldStatus, updated_at: new Date().toISOString() };
          if (oldStatus === "done") undo.completed_at = task.completed_at;
          else undo.completed_at = null;
          await supabase.from("tasks").update(undo).eq("id", task.id);
          toast.success(`Status zurückgesetzt`);
          invalidate();
        },
      },
    });
  };

  if (isLoading) return <AppLayout><AnalysisPageSkeleton cards={3} sections={1} /></AppLayout>;

  const counts = {
    all: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Aufgaben</p>
            <h1 className="font-display text-xl font-bold">Aufgaben-Board</h1>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Neue Aufgabe
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {([["all", "Alle"], ["open", "Offen"], ["in_progress", "In Arbeit"], ["done", "Erledigt"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <ListTodo className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Keine Aufgaben</p>
            <p className="text-xs text-muted-foreground mt-1">Erstelle deine erste Aufgabe</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const sc = STATUS_CONFIG[task.status];
              const StatusIcon = sc.icon;
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
                  <button
                    onClick={() => changeStatus(task, task.status === "done" ? "open" : task.status === "open" ? "in_progress" : "done")}
                    className={`shrink-0 ${sc.color}`}
                    title="Status wechseln"
                  >
                    <StatusIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${pc.color}`}>{pc.label}</Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">{CATEGORY_LABELS[task.category]}</Badge>
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <Select value={task.status} onValueChange={(v) => changeStatus(task, v)}>
                        <SelectTrigger className="h-6 w-[100px] text-[10px] px-2 border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open" className="text-xs">Offen</SelectItem>
                          <SelectItem value="in_progress" className="text-xs">In Arbeit</SelectItem>
                          <SelectItem value="done" className="text-xs">Erledigt</SelectItem>
                        </SelectContent>
                      </Select>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.due_date), "dd.MM.yy", { locale: de })}
                        </span>
                      )}
                      {task.assignee_id && (
                        <span>{profileMap[task.assignee_id] || "Zugewiesen"}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(task)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => setDeleteTask(task)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!editTask} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditTask(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Was muss erledigt werden?" />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Details..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priorität</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="critical">Kritisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fälligkeitsdatum</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditTask(null); }}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? "Speichern..." : editTask ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTask} onOpenChange={(o) => !o && setDeleteTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            „{deleteTask?.title}" wird unwiderruflich gelöscht.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTask(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Tasks;
