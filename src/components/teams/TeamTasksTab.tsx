import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/shared/UserAvatar";
import { ListTodo, User, Clock, AlertTriangle, Pencil, Trash2, Plus, CheckCircle2, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";
import type { Task } from "@/hooks/useTasks";

interface Props {
  teamId: string;
}

const emptyForm = { title: "", description: "", priority: "medium", category: "general", due_date: "" };

const TeamTasksTab = ({ teamId }: Props) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const STATUS_OPTIONS = [
    { value: "backlog", label: t("teamTasks.backlog"), icon: Circle },
    { value: "open", label: t("teamTasks.open"), icon: Circle },
    { value: "in_progress", label: t("teamTasks.inProgress"), icon: Clock },
    { value: "blocked", label: t("teamTasks.blocked"), icon: Circle },
    { value: "done", label: t("teamTasks.done"), icon: CheckCircle2 },
  ] as const;

  const statusLabels: Record<string, string> = {
    backlog: t("teamTasks.backlog"),
    open: t("teamTasks.open"),
    in_progress: t("teamTasks.inProgress"),
    blocked: t("teamTasks.blocked"),
    done: t("teamTasks.done"),
  };

  const priorityConfig: Record<string, { color: string; label: string }> = {
    critical: { color: "bg-destructive/20 text-destructive", label: t("teamTasks.critical") },
    high: { color: "bg-warning/20 text-warning", label: t("teamTasks.high") },
    medium: { color: "bg-primary/20 text-primary", label: t("teamTasks.medium") },
    low: { color: "bg-muted text-muted-foreground", label: t("teamTasks.low") },
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [{ data: taskData }, { data: mems }, { data: profileData }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("team_id", teamId)
        .neq("status", "done")
        .order("created_at", { ascending: false }),
      supabase.from("team_members").select("*").eq("team_id", teamId),
      supabase.from("profiles").select("user_id, full_name, avatar_url"),
    ]);

    const enrichedMembers = (mems || []).map((m: any) => ({
      ...m,
      profile: (profileData || []).find((p: any) => p.user_id === m.user_id),
    }));

    setTasks((taskData || []) as Task[]);
    setMembers(enrichedMembers);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [teamId]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = { unassigned: [] };
    members.forEach((m) => { map[m.user_id] = []; });
    tasks.forEach((tk) => {
      if (tk.assignee_id && map[tk.assignee_id]) {
        map[tk.assignee_id].push(tk);
      } else {
        map.unassigned.push(tk);
      }
    });
    return map;
  }, [tasks, members]);

  const changeStatus = async (taskId: string, newStatus: string) => {
    const oldTask = tasks.find((tk) => tk.id === taskId);
    const oldStatus = oldTask?.status;
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
    if (error) { toast.error(t("teamTasks.statusChangeFailed")); return; }
    fetchData();
    toast.success(t("teamTasks.statusChanged", { status: statusLabels[newStatus] || newStatus }), {
      action: oldStatus ? {
        label: t("teamTasks.undo"),
        onClick: async () => {
          const undo: Record<string, any> = { status: oldStatus, updated_at: new Date().toISOString() };
          if (oldStatus !== "done") undo.completed_at = null;
          await supabase.from("tasks").update(undo).eq("id", taskId);
          toast.success(t("teamTasks.statusReset"));
          fetchData();
        },
      } : undefined,
    });
  };

  const assignTask = async (taskId: string, assigneeId: string | null) => {
    const { error } = await supabase
      .from("tasks")
      .update({ assignee_id: assigneeId, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) { toast.error(t("teamTasks.assignFailed")); return; }
    toast.success(t("teamTasks.assignUpdated"));
    fetchData();
  };

  const handleSave = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    if (editTask) {
      const { error } = await supabase.from("tasks").update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority as Task["priority"],
        category: form.category as Task["category"],
        due_date: form.due_date || null,
      }).eq("id", editTask.id);
      if (error) toast.error(t("teamTasks.updateError"));
      else { toast.success(t("teamTasks.taskUpdated")); setEditTask(null); }
    } else {
      const { error } = await supabase.from("tasks").insert([{
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority as Task["priority"],
        category: form.category as Task["category"],
        due_date: form.due_date || null,
        created_by: user.id,
        team_id: teamId,
      }]);
      if (error) toast.error(t("teamTasks.createError"));
      else { toast.success(t("teamTasks.taskCreated")); setShowCreate(false); }
    }
    setSaving(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTask.id);
    if (error) toast.error(t("teamTasks.deleteError"));
    else toast.success(t("teamTasks.taskDeleted"));
    setDeleteTask(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />)}
      </div>
    );
  }

  const renderTask = (tk: Task) => {
    const pc = priorityConfig[tk.priority] || priorityConfig.medium;
    const isOverdue = tk.due_date && new Date(tk.due_date) < new Date();

    return (
      <div key={tk.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{tk.title}</span>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${pc.color}`}>{pc.label}</Badge>
            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <Select value={tk.status} onValueChange={(v) => changeStatus(tk.id, v)}>
              <SelectTrigger className="h-6 w-[100px] text-[10px] px-2 border-dashed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tk.due_date && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                <Clock className="w-3 h-3" />
                {format(new Date(tk.due_date), "dd.MM.yy", { locale: dateFnsLocale })}
              </span>
            )}
          </div>
        </div>
        <Select
          value={tk.assignee_id || "unassigned"}
          onValueChange={(v) => assignTask(tk.id, v === "unassigned" ? null : v)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder={t("teamTasks.assign")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">{t("teamTasks.unassigned")}</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profile?.full_name || t("team.unknown")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setForm({ title: tk.title, description: tk.description || "", priority: tk.priority, category: tk.category, due_date: tk.due_date || "" }); setEditTask(tk); }}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => setDeleteTask(tk)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("teamTasks.openTasks", { count: tasks.length })}
        </p>
        <Button size="sm" variant="outline" onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {t("teamTasks.newTask")}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <ListTodo className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">{t("teamTasks.noTasks")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("teamTasks.noTasksHint")}</p>
        </div>
      ) : (
        <>
          {grouped.unassigned.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5" />
                {t("teamTasks.unassigned")} ({grouped.unassigned.length})
              </h3>
              <div className="space-y-2">{grouped.unassigned.map(renderTask)}</div>
            </div>
          )}

          {members.map((m) => {
            const memberTasks = grouped[m.user_id] || [];
            if (memberTasks.length === 0) return null;
            return (
              <div key={m.user_id}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <UserAvatar avatarUrl={m.profile?.avatar_url} fullName={m.profile?.full_name} size="sm" />
                  {m.profile?.full_name || t("team.unknown")} ({memberTasks.length})
                </h3>
                <div className="space-y-2">{memberTasks.map(renderTask)}</div>
              </div>
            );
          })}

          {members.filter((m) => (grouped[m.user_id] || []).length === 0).length > 0 && (
            <div className="rounded-lg border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground text-center">
                {members.filter((m) => (grouped[m.user_id] || []).length === 0).map((m) => m.profile?.full_name).join(", ")} – {t("team.noAssignedTasks")}
              </p>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!editTask} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditTask(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTask ? t("teamTasks.editTask") : t("teamTasks.createTask")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("teamTasks.title")} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("teamTasks.titlePlaceholder")} />
            </div>
            <div>
              <Label>{t("teamTasks.description")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("teamTasks.priority")}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("teamTasks.low")}</SelectItem>
                    <SelectItem value="medium">{t("teamTasks.medium")}</SelectItem>
                    <SelectItem value="high">{t("teamTasks.high")}</SelectItem>
                    <SelectItem value="critical">{t("teamTasks.critical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("teamTasks.dueDate")}</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditTask(null); }}>{t("teamTasks.cancel")}</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? t("teamTasks.saving") : editTask ? t("teamTasks.update") : t("teamTasks.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTask} onOpenChange={(o) => !o && setDeleteTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("teamTasks.deleteTask")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("teamTasks.deleteConfirm", { title: deleteTask?.title })}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTask(null)}>{t("teamTasks.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("teamTasks.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamTasksTab;
