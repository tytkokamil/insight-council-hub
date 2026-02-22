import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, AlertTriangle, AlertCircle, Pencil, Trash2,
  DollarSign, Target, Users, Link2, MessageSquare, ChevronDown,
  CheckCircle2, Circle, Ban, Archive, ShieldAlert, Brain, ChevronUp,
  FileText, ExternalLink, PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, useInvalidateTasks, type Task } from "@/hooks/useTasks";
import { useDecisions, useProfiles, buildProfileMap, useDependencies } from "@/hooks/useDecisions";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Config ── */
const STATUS_CONFIG = {
  backlog: { label: "Backlog", icon: Archive, color: "text-muted-foreground/60", bg: "bg-muted/50" },
  open: { label: "Offen", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { label: "In Arbeit", icon: Clock, color: "text-warning", bg: "bg-warning/20" },
  blocked: { label: "Blockiert", icon: Ban, color: "text-destructive", bg: "bg-destructive/20" },
  done: { label: "Erledigt", icon: CheckCircle2, color: "text-success", bg: "bg-success/20" },
} as const;

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: "text-destructive", label: "Kritisch" },
  high: { color: "text-warning", label: "Hoch" },
  medium: { color: "text-primary", label: "Mittel" },
  low: { color: "text-muted-foreground", label: "Niedrig" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Allgemein", strategic: "Strategisch", operational: "Operativ",
  technical: "Technisch", hr: "Personal", marketing: "Marketing", budget: "Budget",
};

const statusOptions = ["backlog", "open", "in_progress", "blocked", "done"] as const;

/* ── Collapsible Section ── */
const Section = ({ title, icon: Icon, children, defaultOpen = true, badge }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full group py-2">
          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold flex-1 text-left">{title}</h2>
          {badge}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
};

/* ── Lifecycle bar ── */
const TaskLifecycleBar = ({ status }: { status: string }) => {
  const steps = ["backlog", "open", "in_progress", "done"] as const;
  const blocked = status === "blocked";
  const activeIdx = blocked ? 2 : steps.indexOf(status as any);

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;
        return (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={cn(
              "flex-1 h-2 rounded-full transition-colors",
              isPast ? "bg-primary" : isActive ? (blocked ? "bg-destructive" : "bg-primary") : "bg-muted"
            )} />
            {i < steps.length - 1 && <div className="w-1" />}
          </div>
        );
      })}
    </div>
  );
};

/* ══════════════════════════ MAIN COMPONENT ══════════════════════════ */
const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks = [] } = useTasks();
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: allDeps = [] } = useDependencies();
  const invalidate = useInvalidateTasks();
  const profileMap = buildProfileMap(profiles);

  const [status, setStatus] = useState("open");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const task = tasks.find(t => t.id === id);

  useEffect(() => {
    if (task) setStatus(task.status);
  }, [task]);

  /* Linked decision via dependencies */
  const linkedDecision = useMemo(() => {
    if (!task) return null;
    const dep = allDeps.find(d =>
      d.source_task_id === task.id || d.target_task_id === task.id
    );
    if (!dep) return null;
    const decId = dep.source_decision_id || dep.target_decision_id;
    if (!decId) return null;
    return allDecisions.find(d => d.id === decId) || null;
  }, [task, allDeps, allDecisions]);

  /* Linked tasks (other tasks connected via shared decision) */
  const linkedTasks = useMemo(() => {
    if (!task) return [];
    const relatedDeps = allDeps.filter(d =>
      d.source_task_id === task.id || d.target_task_id === task.id
    );
    const taskIds = new Set<string>();
    relatedDeps.forEach(d => {
      if (d.source_task_id && d.source_task_id !== task.id) taskIds.add(d.source_task_id);
      if (d.target_task_id && d.target_task_id !== task.id) taskIds.add(d.target_task_id);
    });
    return tasks.filter(t => taskIds.has(t.id));
  }, [task, allDeps, tasks]);

  /* Computed metrics */
  const computed = useMemo(() => {
    if (!task) return { delayCost: 0, delayCostPerWeek: 0, daysOverdue: 0, isOverdue: false, daysOpen: 0 };

    const daysOpen = differenceInDays(new Date(), new Date(task.created_at));
    const mult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    const costPerDay = Math.round(1.5 * 75 * (mult[task.priority] || 1.5));
    const costPerWeek = costPerDay * 7;

    const isOverdue = !!task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
    const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(task.due_date!)) : 0;

    return { delayCost: daysOpen * costPerDay, delayCostPerWeek: costPerWeek, daysOverdue, isOverdue, daysOpen };
  }, [task]);

  const decisionRiskScore = linkedDecision?.ai_risk_score || 0;
  const decisionEscalated = (linkedDecision?.escalation_level || 0) > 0;
  const isBlockingCriticalDecision = !!(linkedDecision && (linkedDecision.priority === "critical" || linkedDecision.priority === "high") && task?.status !== "done");

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  /* Focus message */
  const focusMessage = useMemo(() => {
    if (!task || task.status === "done") return null;
    const parts: string[] = [];
    if (computed.isOverdue) parts.push(`Überfällig seit ${computed.daysOverdue} Tag${computed.daysOverdue !== 1 ? "en" : ""}`);
    if (task.status === "blocked") parts.push("Aufgabe ist blockiert");
    if (isBlockingCriticalDecision) parts.push(`Blockiert kritische Entscheidung`);
    if (computed.delayCostPerWeek > 0 && linkedDecision) parts.push(`Verzögerungsrisiko: ${formatCost(computed.delayCostPerWeek)}/Woche`);
    return parts.length > 0 ? parts.join(". ") + "." : null;
  }, [task, computed, isBlockingCriticalDecision, linkedDecision]);

  const isCritical = computed.isOverdue || task?.status === "blocked" || isBlockingCriticalDecision;

  /* Status change */
  const handleStatusChange = async (newStatus: string) => {
    if (!task || !user) return;
    setSaving(true);
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (!error) {
      setStatus(newStatus);
      invalidate();
      toast.success(`Status → ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`);
    }
    setSaving(false);
  };

  /* Delete */
  const handleDelete = async () => {
    if (!task) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error) { toast.success("Aufgabe gelöscht"); navigate("/tasks"); }
    else toast.error("Fehler beim Löschen");
    setShowDelete(false);
  };

  /* Edit save */
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "medium", category: "general", due_date: "", assignee_id: "" });

  const openEdit = () => {
    if (!task) return;
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category,
      due_date: task.due_date || "",
      assignee_id: task.assignee_id || "",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!task || !editForm.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").update({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      priority: editForm.priority as Task["priority"],
      category: editForm.category as Task["category"],
      due_date: editForm.due_date || null,
      assignee_id: editForm.assignee_id || null,
    }).eq("id", task.id);
    if (!error) { toast.success("Aufgabe aktualisiert"); setShowEdit(false); invalidate(); }
    else toast.error("Fehler beim Speichern");
    setSaving(false);
  };

  if (!task) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Aufgabe nicht gefunden.</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
        </div>
      </AppLayout>
    );
  }

  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const sc = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const isOwner = user?.id === task.created_by;
  const isActive = task.status !== "done";

  const decStatusLabels: Record<string, string> = {
    draft: "Entwurf", proposed: "Vorgeschlagen", review: "Im Review", approved: "Genehmigt",
    rejected: "Abgelehnt", implemented: "Umgesetzt", cancelled: "Abgebrochen",
    superseded: "Ersetzt", archived: "Archiviert",
  };

  return (
    <AppLayout>
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/tasks")}>
        <ArrowLeft className="w-4 h-4" /> Aufgaben
      </Button>

      {/* ═══════════ 1. HEADER WITH DECISION CONTEXT ═══════════ */}
      <div className="mb-6">
        {/* Decision context banner */}
        {linkedDecision && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={`/decisions/${linkedDecision.id}`}>
              <Card className={cn(
                "mb-4 border-l-4 hover:shadow-md transition-shadow cursor-pointer",
                decisionEscalated ? "border-l-destructive bg-destructive/[0.03]" :
                decisionRiskScore > 60 ? "border-l-warning bg-warning/[0.03]" :
                "border-l-primary bg-primary/[0.03]"
              )}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                      Teil der Entscheidung
                    </p>
                    <p className="text-sm font-semibold truncate">{linkedDecision.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn(
                          "font-medium",
                          decisionEscalated ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {decStatusLabels[linkedDecision.status] || linkedDecision.status}
                          {decisionEscalated && " ⚠"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">Status der verknüpften Entscheidung</p></TooltipContent>
                    </Tooltip>
                    {decisionRiskScore > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn("font-medium", decisionRiskScore > 60 ? "text-destructive" : "text-warning")}>
                            Risk: {decisionRiskScore}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">KI-Risikobewertung der Entscheidung</p></TooltipContent>
                      </Tooltip>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-display text-2xl font-bold">{task.title}</h1>
              <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
                <SelectTrigger className={`w-auto h-7 text-xs font-semibold uppercase border-0 ${sc.bg} ${sc.color}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[task.category]}</Badge>
              <span className={`font-semibold ${pc.color}`}>{pc.label}</span>
              {task.assignee_id && (
                <><span>·</span><span>{profileMap[task.assignee_id] || "Zugewiesen"}</span></>
              )}
              <span>·</span>
              <span>Erstellt {format(new Date(task.created_at), "dd. MMM yyyy", { locale: de })}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={openEdit}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status lifecycle bar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {statusOptions.map(s => {
                const cfg = STATUS_CONFIG[s];
                const isCurrentStatus = status === s;
                return (
                  <span key={s} className={cn(
                    "text-[10px] font-medium",
                    isCurrentStatus ? cfg.color + " font-bold" : "text-muted-foreground/50"
                  )}>
                    {cfg.label}
                  </span>
                );
              })}
            </div>
            <TaskLifecycleBar status={status} />
          </CardContent>
        </Card>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Priorität", value: pc.label, icon: Target, color: pc.color, bg: task.priority === "critical" ? "bg-destructive/10" : task.priority === "high" ? "bg-warning/10" : "bg-primary/10" },
            { label: "Fällig", value: task.due_date ? (computed.isOverdue ? `${computed.daysOverdue}d überfällig` : `${differenceInDays(new Date(task.due_date), new Date())}d`) : "—", icon: Clock, color: computed.isOverdue ? "text-destructive" : "text-muted-foreground", bg: computed.isOverdue ? "bg-destructive/10" : "bg-muted/50" },
            { label: "Offene Tage", value: `${computed.daysOpen}d`, icon: AlertTriangle, color: computed.daysOpen > 14 ? "text-warning" : "text-muted-foreground", bg: computed.daysOpen > 14 ? "bg-warning/10" : "bg-muted/50" },
            { label: "Verzögerungsrisiko", value: linkedDecision && isActive ? formatCost(computed.delayCostPerWeek) + "/Wo" : "—", icon: DollarSign, color: computed.delayCostPerWeek > 2000 ? "text-destructive" : "text-warning", bg: linkedDecision ? (computed.delayCostPerWeek > 2000 ? "bg-destructive/10" : "bg-warning/10") : "bg-muted/50" },
          ].map(kpi => (
            <Tooltip key={kpi.label}>
              <TooltipTrigger asChild>
                <Card className={`${kpi.bg} border-0`}>
                  <CardContent className="p-3 text-center">
                    <kpi.icon className={`w-4 h-4 mx-auto mb-1 ${kpi.color}`} />
                    <p className={`text-base font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{kpi.label}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ═══════════ 3. PRIMARY ACTION STRIP ═══════════ */}
      {isCritical && isActive && focusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/25 bg-destructive/[0.06] p-4 flex items-start gap-3 mb-6"
        >
          <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0 animate-pulse">
            <AlertCircle className="w-4.5 h-4.5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Aktion erforderlich</p>
            <p className="text-sm text-destructive font-medium">{focusMessage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {task.priority !== "critical" && (
              <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => {
                await supabase.from("tasks").update({ priority: "critical", updated_at: new Date().toISOString() }).eq("id", task.id);
                invalidate(); toast.success("Priorität auf Kritisch gesetzt");
              }}>
                <ChevronUp className="w-3 h-3 mr-1" /> Priorisieren
              </Button>
            )}
            {linkedDecision && (
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <Link to={`/decisions/${linkedDecision.id}`}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Entscheidung öffnen
                </Link>
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══════════ 4. MAIN CONTENT – 2 COLUMNS ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-24">
        {/* LEFT COLUMN (3/5) */}
        <div className="lg:col-span-3 space-y-2">
          {/* Description */}
          <Section title="Beschreibung" icon={FileText}>
            {task.description ? (
              <div className="prose prose-sm max-w-none text-sm text-foreground/90 whitespace-pre-wrap">
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Keine Beschreibung hinterlegt.</p>
            )}
          </Section>

          <Separator />

          {/* Dependencies / Links */}
          <Section title="Verknüpfungen" icon={Link2} badge={
            <Badge variant="outline" className="text-[10px]">{(linkedDecision ? 1 : 0) + linkedTasks.length}</Badge>
          }>
            <div className="space-y-2">
              {linkedDecision && (
                <Link to={`/decisions/${linkedDecision.id}`} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/[0.04] border border-primary/15 hover:bg-primary/[0.08] transition-colors">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium">Entscheidung</p>
                      <p className="text-sm font-medium truncate">{linkedDecision.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{decStatusLabels[linkedDecision.status]}</Badge>
                  </div>
                </Link>
              )}
              {linkedTasks.map(lt => {
                const ltCfg = STATUS_CONFIG[lt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
                return (
                  <Link key={lt.id} to={`/tasks/${lt.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                      <ltCfg.icon className={`w-4 h-4 ${ltCfg.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Abhängige Aufgabe</p>
                        <p className="text-sm font-medium truncate">{lt.title}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${ltCfg.bg} ${ltCfg.color}`}>{ltCfg.label}</Badge>
                    </div>
                  </Link>
                );
              })}
              {!linkedDecision && linkedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic py-2">Keine Verknüpfungen vorhanden.</p>
              )}
            </div>
          </Section>

          <Separator />

          {/* Activity */}
          <Section title="Aktivität" icon={MessageSquare} defaultOpen={false}>
            <div className="space-y-2">
              {task.completed_at && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success">Erledigt</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(task.completed_at), "dd. MMM yyyy, HH:mm", { locale: de })}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Letzte Änderung</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(task.updated_at), "dd. MMM yyyy, HH:mm", { locale: de })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <PlayCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Erstellt</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), "dd. MMM yyyy, HH:mm", { locale: de })}
                    {" · "}{profileMap[task.created_by] || "Unbekannt"}
                  </p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Task Health Panel */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Health</h3>
              <div className="space-y-2">
                {[
                  { label: "Priorität", value: pc.label, color: pc.color },
                  { label: "Status", value: sc.label, color: sc.color },
                  { label: "Blockiert", value: task.status === "blocked" ? "Ja" : "Nein", color: task.status === "blocked" ? "text-destructive" : "text-success" },
                  { label: "Überfällig", value: computed.isOverdue ? `${computed.daysOverdue} Tage` : "Nein", color: computed.isOverdue ? "text-destructive" : "text-success" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Panel */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Wirtschaftlicher Impact
              </h3>
              {linkedDecision ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Einfluss auf Entscheidung</span>
                    <span className="font-semibold text-primary">Hoch</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verzögerungsrisiko</span>
                    <span className={cn("font-bold", computed.delayCostPerWeek > 2000 ? "text-destructive" : "text-warning")}>
                      {formatCost(computed.delayCostPerWeek)}/Woche
                    </span>
                  </div>
                  {decisionRiskScore > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Decision Risk</span>
                      <span className={cn("font-medium", decisionRiskScore > 60 ? "text-destructive" : "text-warning")}>{decisionRiskScore}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Operativ – kein direkter Impact verknüpft.</p>
              )}
            </CardContent>
          </Card>

          {/* Responsibility */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Verantwortlichkeit
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zuständig</span>
                  <span className="font-medium">{task.assignee_id ? (profileMap[task.assignee_id] || "Zugewiesen") : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Erstellt von</span>
                  <span className="font-medium">{profileMap[task.created_by] || "Unbekannt"}</span>
                </div>
                {task.team_id && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Team</span>
                    <span className="font-medium">Zugewiesen</span>
                  </div>
                )}
              </div>
              {!task.assignee_id && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                  <p className="text-xs text-warning font-medium">Keine verantwortliche Person zugewiesen</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini KI Insight */}
          {linkedDecision && isActive && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> KI-Empfehlung
                </h3>
                <p className="text-sm text-foreground/80">
                  {task.status === "blocked"
                    ? "Blockade priorisiert lösen – diese Aufgabe beeinflusst den Fortschritt einer verknüpften Entscheidung direkt."
                    : computed.isOverdue
                    ? "Aufgabe ist überfällig und verzögert potenziell die verknüpfte Entscheidung. Sofortige Bearbeitung empfohlen."
                    : isBlockingCriticalDecision
                    ? "Diese Aufgabe ist Teil einer kritischen Entscheidung. Bevorzugte Bearbeitung kann Verzögerungskosten reduzieren."
                    : "Aufgabe liegt im Plan. Fortschritt regelmäßig dokumentieren, um Transparenz für Stakeholder zu gewährleisten."}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Confidence: {task.status === "blocked" || computed.isOverdue ? "Hoch" : "Mittel"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══════════ FIXED FOOTER ACTION BAR ═══════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <sc.icon className={`w-4 h-4 ${sc.color}`} />
            <span className="font-medium">{task.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
              <SelectTrigger className="w-auto h-8 text-xs gap-1.5">
                <SelectValue placeholder="Status ändern" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5" /> Bearbeiten
            </Button>
            {linkedDecision && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                <Link to={`/decisions/${linkedDecision.id}`}>
                  <Link2 className="w-3.5 h-3.5" /> Entscheidung
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ EDIT DIALOG ═══════════ */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel</Label>
              <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea rows={4} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priorität</Label>
                <Select value={editForm.priority} onValueChange={v => setEditForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select value={editForm.category} onValueChange={v => setEditForm(p => ({ ...p, category: v }))}>
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
              <Label>Fällig am</Label>
              <Input type="date" value={editForm.due_date} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Abbrechen</Button>
            <Button onClick={saveEdit} disabled={saving || !editForm.title.trim()}>{saving ? "Speichern..." : "Speichern"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ DELETE DIALOG ═══════════ */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Aufgabe löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TaskDetail;
