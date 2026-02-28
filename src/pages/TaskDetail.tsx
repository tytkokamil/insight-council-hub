import { useState, useEffect, useMemo } from "react";
import { formatCost } from "@/lib/formatters";
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
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import QuickMessageButton from "@/components/shared/QuickMessageButton";

/* ── Config ── */
const statusKeys = ["backlog", "open", "in_progress", "blocked", "done"] as const;
const statusIcons: Record<string, React.ElementType> = {
  backlog: Archive, open: Circle, in_progress: Clock, blocked: Ban, done: CheckCircle2,
};
const statusColors: Record<string, { color: string; bg: string }> = {
  backlog: { color: "text-muted-foreground/60", bg: "bg-muted/50" },
  open: { color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { color: "text-warning", bg: "bg-warning/20" },
  blocked: { color: "text-destructive", bg: "bg-destructive/20" },
  done: { color: "text-success", bg: "bg-success/20" },
};

const priorityColors: Record<string, string> = {
  critical: "text-destructive", high: "text-warning", medium: "text-primary", low: "text-muted-foreground",
};

const statusOptions = statusKeys;

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
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
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

  // Translated config maps
  const statusLabel = (s: string) => t(`taskDetail.status${s.charAt(0).toUpperCase() + s.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`, { defaultValue: s });
  const priorityLabel = (p: string) => t(`taskDetail.priority${p.charAt(0).toUpperCase() + p.slice(1)}`, { defaultValue: p });
  const categoryLabel = (c: string) => t(`taskDetail.cat${c.charAt(0).toUpperCase() + c.slice(1)}`, { defaultValue: c });

  const decStatusLabel = (s: string) => t(`taskDetail.statusDec${s.charAt(0).toUpperCase() + s.slice(1)}`, { defaultValue: s });

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

  /* Linked tasks */
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

  

  /* Focus message */
  const focusMessage = useMemo(() => {
    if (!task || task.status === "done") return null;
    const parts: string[] = [];
    if (computed.isOverdue) parts.push(t("taskDetail.overdueSince", { days: computed.daysOverdue }));
    if (task.status === "blocked") parts.push(t("taskDetail.taskBlocked"));
    if (isBlockingCriticalDecision) parts.push(t("taskDetail.blocksCritical"));
    if (computed.delayCostPerWeek > 0 && linkedDecision) parts.push(t("taskDetail.delayRiskPerWeek", { cost: formatCost(computed.delayCostPerWeek) }));
    return parts.length > 0 ? parts.join(". ") + "." : null;
  }, [task, computed, isBlockingCriticalDecision, linkedDecision, t]);

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
      toast.success(`Status → ${statusLabel(newStatus)}`);
    }
    setSaving(false);
  };

  /* Delete */
  const handleDelete = async () => {
    if (!task) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error) { toast.success(t("taskDetail.deleted")); navigate("/tasks"); }
    else toast.error(t("taskDetail.deleteError"));
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
    if (!error) { toast.success(t("taskDetail.updated")); setShowEdit(false); invalidate(); }
    else toast.error(t("taskDetail.updateError"));
    setSaving(false);
  };

  if (!task) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t("taskDetail.notFound")}</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="w-4 h-4" /> {t("taskDetail.back")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const pc = { color: priorityColors[task.priority] || priorityColors.medium, label: priorityLabel(task.priority) };
  const sc = { color: statusColors[task.status as keyof typeof statusColors]?.color || statusColors.open.color, bg: statusColors[task.status as keyof typeof statusColors]?.bg || statusColors.open.bg, label: statusLabel(task.status), icon: statusIcons[task.status] || Circle };
  const isOwner = user?.id === task.created_by;
  const isActive = task.status !== "done";

  const PRIORITY_CONFIG_ENTRIES = ["critical", "high", "medium", "low"].map(k => [k, { color: priorityColors[k], label: priorityLabel(k) }] as const);
  const CATEGORY_ENTRIES = ["general", "strategic", "operational", "technical", "hr", "marketing", "budget"].map(k => [k, categoryLabel(k)] as const);

  return (
    <AppLayout>
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/tasks")}>
        <ArrowLeft className="w-4 h-4" /> {t("taskDetail.backToTasks")}
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
                      {t("taskDetail.partOfDecision")}
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
                          {decStatusLabel(linkedDecision.status)}
                          {decisionEscalated && " ⚠"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">{t("taskDetail.linkedDecisionStatus")}</p></TooltipContent>
                    </Tooltip>
                    {decisionRiskScore > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn("font-medium", decisionRiskScore > 60 ? "text-destructive" : "text-warning")}>
                            Risk: {decisionRiskScore}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{t("taskDetail.aiRiskAssessment")}</p></TooltipContent>
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
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="text-[10px]">{categoryLabel(task.category)}</Badge>
              <span className={`font-semibold ${pc.color}`}>{pc.label}</span>
              {task.assignee_id && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    {profileMap[task.assignee_id] || t("taskDetail.assigned")}
                    <QuickMessageButton
                      teamId={task.team_id}
                      decisionId={linkedDecision?.id}
                      decisionTitle={linkedDecision?.title}
                      contextLabel={linkedDecision ? linkedDecision.title : task.title}
                      recipientName={profileMap[task.assignee_id]}
                      recipientId={task.assignee_id}
                    />
                  </span>
                </>
              )}
              <span>·</span>
              <span>{t("taskDetail.created", { date: format(new Date(task.created_at), "dd. MMM yyyy", { locale: dateFnsLocale }) })}</span>
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
                const isCurrentStatus = status === s;
                const sColor = statusColors[s]?.color || "";
                return (
                  <span key={s} className={cn(
                    "text-[10px] font-medium",
                    isCurrentStatus ? sColor + " font-bold" : "text-muted-foreground/50"
                  )}>
                    {statusLabel(s)}
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
            { label: t("taskDetail.priority"), value: pc.label, icon: Target, color: pc.color, bg: task.priority === "critical" ? "bg-destructive/10" : task.priority === "high" ? "bg-warning/10" : "bg-primary/10" },
            { label: t("taskDetail.due"), value: task.due_date ? (computed.isOverdue ? t("taskDetail.dueOverdue", { days: computed.daysOverdue }) : t("taskDetail.dueIn", { days: differenceInDays(new Date(task.due_date), new Date()) })) : "—", icon: Clock, color: computed.isOverdue ? "text-destructive" : "text-muted-foreground", bg: computed.isOverdue ? "bg-destructive/10" : "bg-muted/50" },
            { label: t("taskDetail.openDays"), value: `${computed.daysOpen}d`, icon: AlertTriangle, color: computed.daysOpen > 14 ? "text-warning" : "text-muted-foreground", bg: computed.daysOpen > 14 ? "bg-warning/10" : "bg-muted/50" },
            { label: t("taskDetail.delayRisk"), value: linkedDecision && isActive ? formatCost(computed.delayCostPerWeek) + `/${t("taskDetail.perWeekShort")}` : "—", icon: DollarSign, color: computed.delayCostPerWeek > 2000 ? "text-destructive" : "text-warning", bg: linkedDecision ? (computed.delayCostPerWeek > 2000 ? "bg-destructive/10" : "bg-warning/10") : "bg-muted/50" },
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
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">{t("taskDetail.actionRequired")}</p>
            <p className="text-sm text-destructive font-medium">{focusMessage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {task.priority !== "critical" && (
              <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => {
                await supabase.from("tasks").update({ priority: "critical", updated_at: new Date().toISOString() }).eq("id", task.id);
                invalidate(); toast.success(t("taskDetail.prioritySetCritical"));
              }}>
                <ChevronUp className="w-3 h-3 mr-1" /> {t("taskDetail.prioritize")}
              </Button>
            )}
            {linkedDecision && (
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <Link to={`/decisions/${linkedDecision.id}`}>
                  <ExternalLink className="w-3 h-3 mr-1" /> {t("taskDetail.openDecision")}
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
          <Section title={t("taskDetail.descriptionSection")} icon={FileText}>
            {task.description ? (
              <div className="prose prose-sm max-w-none text-sm text-foreground/90 whitespace-pre-wrap">
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t("taskDetail.noDescription")}</p>
            )}
          </Section>

          <Separator />

          <Section title={t("taskDetail.linksSection")} icon={Link2} badge={
            <Badge variant="outline" className="text-[10px]">{(linkedDecision ? 1 : 0) + linkedTasks.length}</Badge>
          }>
            <div className="space-y-2">
              {linkedDecision && (
                <Link to={`/decisions/${linkedDecision.id}`} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/[0.04] border border-primary/15 hover:bg-primary/[0.08] transition-colors">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium">{t("taskDetail.decisionLabel")}</p>
                      <p className="text-sm font-medium truncate">{linkedDecision.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{decStatusLabel(linkedDecision.status)}</Badge>
                  </div>
                </Link>
              )}
              {linkedTasks.map(lt => {
                const ltColor = statusColors[lt.status as keyof typeof statusColors] || statusColors.open;
                const LtIcon = statusIcons[lt.status] || Circle;
                return (
                  <Link key={lt.id} to={`/tasks/${lt.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                      <LtIcon className={`w-4 h-4 ${ltColor.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{t("taskDetail.dependentTask")}</p>
                        <p className="text-sm font-medium truncate">{lt.title}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${ltColor.bg} ${ltColor.color}`}>{statusLabel(lt.status)}</Badge>
                    </div>
                  </Link>
                );
              })}
              {!linkedDecision && linkedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic py-2">{t("taskDetail.noLinks")}</p>
              )}
            </div>
          </Section>

          <Separator />

          <Section title={t("taskDetail.activitySection")} icon={MessageSquare} defaultOpen={false}>
            <div className="space-y-2">
              {task.completed_at && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success">{t("taskDetail.completed")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(task.completed_at), "dd. MMM yyyy, HH:mm", { locale: dateFnsLocale })}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t("taskDetail.lastChange")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(task.updated_at), "dd. MMM yyyy, HH:mm", { locale: dateFnsLocale })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <PlayCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t("taskDetail.createdLabel")}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), "dd. MMM yyyy, HH:mm", { locale: dateFnsLocale })}
                    {" · "}{profileMap[task.created_by] || t("taskDetail.unknown")}
                  </p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("taskDetail.taskHealth")}</h3>
              <div className="space-y-2">
                {[
                  { label: t("taskDetail.priority"), value: pc.label, color: pc.color },
                  { label: "Status", value: sc.label, color: sc.color },
                  { label: t("taskDetail.blocked"), value: task.status === "blocked" ? t("taskDetail.yes") : t("taskDetail.no"), color: task.status === "blocked" ? "text-destructive" : "text-success" },
                  { label: t("taskDetail.overdue"), value: computed.isOverdue ? t("taskDetail.overdueDays", { days: computed.daysOverdue }) : t("taskDetail.no"), color: computed.isOverdue ? "text-destructive" : "text-success" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> {t("taskDetail.economicImpact")}
              </h3>
              {linkedDecision ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("taskDetail.influenceOnDecision")}</span>
                    <span className="font-semibold text-primary">{t("taskDetail.high")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("taskDetail.delayRiskLabel")}</span>
                    <span className={cn("font-bold", computed.delayCostPerWeek > 2000 ? "text-destructive" : "text-warning")}>
                      {formatCost(computed.delayCostPerWeek)}/{t("taskDetail.perWeek")}
                    </span>
                  </div>
                  {decisionRiskScore > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("taskDetail.decisionRisk")}</span>
                      <span className={cn("font-medium", decisionRiskScore > 60 ? "text-destructive" : "text-warning")}>{decisionRiskScore}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("taskDetail.operationalNoImpact")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {t("taskDetail.responsibility")}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("taskDetail.responsible")}</span>
                  <span className="font-medium">{task.assignee_id ? (profileMap[task.assignee_id] || t("taskDetail.assigned")) : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("taskDetail.createdBy")}</span>
                  <span className="font-medium">{profileMap[task.created_by] || t("taskDetail.unknown")}</span>
                </div>
                {task.team_id && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("taskDetail.team")}</span>
                    <span className="font-medium">{t("taskDetail.assigned")}</span>
                  </div>
                )}
              </div>
              {!task.assignee_id && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                  <p className="text-xs text-warning font-medium">{t("taskDetail.noAssigneeWarning")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {linkedDecision && isActive && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> {t("taskDetail.aiRecommendation")}
                </h3>
                <p className="text-sm text-foreground/80">
                  {task.status === "blocked"
                    ? t("taskDetail.aiBlockedMsg")
                    : computed.isOverdue
                    ? t("taskDetail.aiOverdueMsg")
                    : isBlockingCriticalDecision
                    ? t("taskDetail.aiCriticalMsg")
                    : t("taskDetail.aiOnTrackMsg")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Confidence: {task.status === "blocked" || computed.isOverdue ? t("taskDetail.confidenceHigh") : t("taskDetail.confidenceMedium")}
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
                <SelectValue placeholder={t("taskDetail.changeStatus")} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5" /> {t("taskDetail.edit")}
            </Button>
            {linkedDecision && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                <Link to={`/decisions/${linkedDecision.id}`}>
                  <Link2 className="w-3.5 h-3.5" /> {t("taskDetail.decisionLabel")}
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
            <DialogTitle>{t("taskDetail.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("taskDetail.title")}</Label>
              <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>{t("taskDetail.description")}</Label>
              <Textarea rows={4} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("taskDetail.priority")}</Label>
                <Select value={editForm.priority} onValueChange={v => setEditForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_CONFIG_ENTRIES.map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("taskDetail.category")}</Label>
                <Select value={editForm.category} onValueChange={v => setEditForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ENTRIES.map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("taskDetail.dueDate")}</Label>
              <Input type="date" value={editForm.due_date} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>{t("taskDetail.cancel")}</Button>
            <Button onClick={saveEdit} disabled={saving || !editForm.title.trim()}>{saving ? t("taskDetail.saving") : t("taskDetail.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ DELETE DIALOG ═══════════ */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("taskDetail.deleteTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("taskDetail.deleteDesc")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>{t("taskDetail.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("taskDetail.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TaskDetail;
