import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Trash2, AlertCircle, Clock, ShieldAlert,
  ThumbsUp, ThumbsDown, PlayCircle, ChevronUp, Ban, Replace,
  Brain, DollarSign, Target, Users, Link2, History, Shield,
  ChevronDown, Lightbulb, FileText, MessageSquare, AlertTriangle,
  CheckCircle2, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions, useProfiles, buildProfileMap, useDependencies, useInvalidateDecisions, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useRiskDecisionLinks } from "@/hooks/useRisks";
import WatchlistButton from "@/components/decisions/WatchlistButton";
import DecisionLifecycleBar from "@/components/decisions/DecisionLifecycleBar";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";

// Lazy-loaded panels
import DiscussionPanel from "@/components/decisions/DiscussionPanel";
import ReviewPanel from "@/components/decisions/ReviewPanel";
import AiAnalysisPanel from "@/components/decisions/AiAnalysisPanel";
import AuditTrailPanel from "@/components/decisions/AuditTrailPanel";
import ImpactTrackerPanel from "@/components/decisions/ImpactTrackerPanel";
import StakeholderAlignmentPanel from "@/components/decisions/StakeholderAlignmentPanel";
import DependenciesPanel from "@/components/decisions/DependenciesPanel";
import PostImplementationReview from "@/components/decisions/PostImplementationReview";

const statusOptions = ["draft", "proposed", "review", "approved", "rejected", "implemented", "cancelled", "superseded", "archived"] as const;

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  proposed: "bg-accent text-accent-foreground",
  review: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  implemented: "bg-primary/20 text-primary",
  cancelled: "bg-muted/60 text-muted-foreground line-through",
  superseded: "bg-accent/40 text-accent-foreground",
  archived: "bg-muted/50 text-muted-foreground/60",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-destructive",
};

/* ────────────────── Collapsible Section ────────────────── */
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
      <CollapsibleContent className="pt-2 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ────────────────── MAIN COMPONENT ────────────────── */
const DecisionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: allDeps = [] } = useDependencies();
  const { data: allTasks = [] } = useTasks();
  const { data: allReviews = [] } = useReviews();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);

  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: stakeholderPositions = [] } = useQuery({
    queryKey: ["stakeholder-positions", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("stakeholder_positions").select("*").eq("decision_id", id);
      return data ?? [];
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: goalLinks = [] } = useQuery({
    queryKey: ["decision-goal-links", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("decision_goal_links").select("*").eq("decision_id", id);
      return data ?? [];
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const decision = allDecisions.find(d => d.id === id);

  useEffect(() => {
    if (decision) setStatus(decision.status);
  }, [decision]);

  const { data: riskDecLinks = [] } = useRiskDecisionLinks();

  const computed = useMemo(() => {
    if (!decision) return { openLinkedTasks: 0, depCount: 0, delayCost: 0, reviewCompletion: 0, alignmentScore: 0, riskCount: 0, delayCostPerWeek: 0 };
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    let openTasks = 0;

    allDeps.forEach(dep => {
      if (dep.source_decision_id === decision.id && dep.target_task_id) {
        const task = taskMap.get(dep.target_task_id);
        if (task && task.status !== "done") openTasks++;
      }
      if (dep.target_decision_id === decision.id && dep.source_task_id) {
        const task = taskMap.get(dep.source_task_id);
        if (task && task.status !== "done") openTasks++;
      }
    });

    const deps = allDeps.filter(d =>
      d.source_decision_id === decision.id || d.target_decision_id === decision.id
    );

    const daysOpen = differenceInDays(new Date(), new Date(decision.created_at));
    const mult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    const costPerDay = Math.round(2 * 75 * (mult[decision.priority] || 1.5));
    const cost = daysOpen * costPerDay;
    const costPerWeek = costPerDay * 7;

    const decReviews = allReviews.filter(r => r.decision_id === decision.id);
    const reviewComp = decReviews.length > 0
      ? Math.round((decReviews.filter(r => r.reviewed_at).length / decReviews.length) * 100)
      : 0;

    const alignment = goalLinks.length > 0
      ? Math.round(goalLinks.reduce((s, l) => s + (l.impact_weight || 50), 0) / goalLinks.length)
      : 0;

    const linkedRisks = riskDecLinks.filter(l => l.decision_id === decision.id).length;

    return { openLinkedTasks: openTasks, depCount: deps.length, delayCost: cost, reviewCompletion: reviewComp, alignmentScore: alignment, riskCount: linkedRisks, delayCostPerWeek: costPerWeek };
  }, [decision, allDeps, allTasks, allReviews, goalLinks, riskDecLinks]);

  const slaRemaining = useMemo(() => {
    if (!decision?.due_date || !decision || ["implemented", "rejected"].includes(decision.status)) return null;
    const hoursLeft = differenceInHours(new Date(decision.due_date), new Date());
    if (hoursLeft < 0) return { text: `${Math.abs(hoursLeft)}h überfällig`, overdue: true, days: Math.ceil(Math.abs(hoursLeft) / 24) };
    if (hoursLeft < 24) return { text: `${hoursLeft}h verbleibend`, overdue: false, days: 0 };
    const daysLeft = Math.floor(hoursLeft / 24);
    return { text: `${daysLeft}d`, overdue: false, days: daysLeft };
  }, [decision]);

  const positionSummary = useMemo(() => {
    const support = stakeholderPositions.filter(p => p.position === "support").length;
    const neutral = stakeholderPositions.filter(p => p.position === "neutral").length;
    const oppose = stakeholderPositions.filter(p => p.position === "oppose").length;
    return { support, neutral, oppose, total: stakeholderPositions.length };
  }, [stakeholderPositions]);

  const isOwner = user?.id === decision?.created_by || user?.id === decision?.owner_id;
  const isActive = decision ? !["implemented", "rejected", "cancelled", "superseded", "archived"].includes(decision.status) : false;
  const riskScore = decision?.ai_risk_score || 0;
  const isImplemented = decision?.status === "implemented";
  const isCritical = (decision?.escalation_level || 0) > 0 || slaRemaining?.overdue || riskScore > 70;

  const decReviews = allReviews.filter(r => r.decision_id === decision?.id);
  const missingReviewers = decReviews.filter(r => !r.reviewed_at);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  const focusMessage = useMemo(() => {
    if (!decision) return null;
    const parts: string[] = [];
    if (slaRemaining?.overdue) parts.push(`SLA verletzt seit ${slaRemaining.days} Tag${slaRemaining.days !== 1 ? "en" : ""}`);
    if (missingReviewers.length > 0) parts.push(`${missingReviewers.length} Reviewer ausstehend`);
    if (riskScore > 70) parts.push(`Risiko bei ${riskScore}%`);
    if (computed.delayCostPerWeek > 0 && isActive) parts.push(`Geschätztes Verzögerungsrisiko: ${formatCost(computed.delayCostPerWeek)}/Woche`);
    return parts.length > 0 ? parts.join(". ") + "." : null;
  }, [decision, slaRemaining, missingReviewers, riskScore, computed.delayCostPerWeek, isActive]);

  if (!decision) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Entscheidung nicht gefunden.</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/decisions")}>
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const oldStatus = status;
    const updates: Record<string, any> = { status: newStatus as any, updated_at: new Date().toISOString() };
    if (newStatus === "implemented") updates.implemented_at = new Date().toISOString();
    if (newStatus === "cancelled") updates.cancelled_at = new Date().toISOString();
    const { error } = await supabase.from("decisions").update(updates).eq("id", decision.id);
    if (!error) {
      setStatus(newStatus);
      const { EventTypes } = await import("@/lib/eventTaxonomy");
      await supabase.from("audit_logs").insert({
        decision_id: decision.id, user_id: user!.id, action: EventTypes.DECISION_STATUS_CHANGED,
        field_name: "status", old_value: oldStatus, new_value: newStatus,
      });
      invalidate();
      toast.success(`Status → ${statusLabels[newStatus]}`);
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/decisions")}>
        <ArrowLeft className="w-4 h-4" /> Entscheidungen
      </Button>

      {/* ═══════════ 1. HEADER SECTION ═══════════ */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-display text-2xl font-bold">{decision.title}</h1>
              <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
                <SelectTrigger className={`w-auto h-7 text-xs font-semibold uppercase border-0 ${statusStyles[status]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s} value={s} disabled={!isOwner && s !== "approved" && s !== "rejected"}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="text-[10px]">{categoryLabels[decision.category]}</Badge>
              <span className={`font-semibold ${priorityStyles[decision.priority]}`}>{priorityLabels[decision.priority]}</span>
              <span>·</span>
              <span>Owner: {profileMap[decision.owner_id || decision.created_by] || "—"}</span>
              {decision.assignee_id && decision.assignee_id !== decision.owner_id && (
                <><span>·</span><span>Assignee: {profileMap[decision.assignee_id] || "—"}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <WatchlistButton decisionId={decision.id} />
            {isOwner && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Lifecycle Bar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <DecisionLifecycleBar decision={decision} />
          </CardContent>
        </Card>

        {/* KPI Mini-Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Risk", value: `${riskScore}%`, icon: AlertTriangle, color: riskScore > 60 ? "text-destructive" : riskScore > 40 ? "text-warning" : "text-success", bg: riskScore > 60 ? "bg-destructive/10" : riskScore > 40 ? "bg-warning/10" : "bg-success/10" },
            { label: "Eskalation", value: `Level ${decision.escalation_level || 0}`, icon: ShieldAlert, color: (decision.escalation_level || 0) > 0 ? "text-destructive" : "text-muted-foreground", bg: (decision.escalation_level || 0) > 0 ? "bg-destructive/10" : "bg-muted/50" },
            { label: "Cost of Delay", value: isActive ? formatCost(computed.delayCostPerWeek) + "/Wo" : "—", icon: DollarSign, color: computed.delayCostPerWeek > 3000 ? "text-destructive" : "text-warning", bg: computed.delayCostPerWeek > 3000 ? "bg-destructive/10" : "bg-warning/10" },
            { label: "Fällig in", value: slaRemaining?.text || "—", icon: Clock, color: slaRemaining?.overdue ? "text-destructive" : "text-muted-foreground", bg: slaRemaining?.overdue ? "bg-destructive/10" : "bg-muted/50" },
            { label: "Health", value: `${Math.round(((100 - riskScore) * 0.3 + computed.reviewCompletion * 0.3 + computed.alignmentScore * 0.2 + (slaRemaining?.overdue ? 0 : 80) * 0.2))}/100`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
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

      {/* ═══════════ 2. PRIMARY FOCUS BOX ═══════════ */}
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
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Attention Required</p>
            <p className="text-sm text-destructive font-medium">{focusMessage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (decision.escalation_level || 0) === 0 && (
              <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => {
                await supabase.from("decisions").update({ escalation_level: 1, last_escalated_at: new Date().toISOString() }).eq("id", decision.id);
                invalidate(); toast.success("Eskaliert auf Stufe 1");
              }}>
                <ChevronUp className="w-3 h-3 mr-1" /> Eskalieren
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Terminal state banners */}
      {decision.status === "cancelled" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border mb-6">
          <Ban className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Entscheidung abgebrochen</p>
            <p className="text-xs text-muted-foreground/70">
              {decision.cancelled_at ? `Am ${format(new Date(decision.cancelled_at), "dd.MM.yyyy HH:mm", { locale: de })}` : ""} · Keine weiteren Aktionen möglich.
            </p>
          </div>
        </div>
      )}
      {decision.status === "superseded" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/20 border border-accent/30 mb-6">
          <Replace className="w-5 h-5 text-accent-foreground shrink-0" />
          <div>
            <p className="text-sm font-semibold text-accent-foreground">Entscheidung ersetzt</p>
            {decision.superseded_by && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => navigate(`/decisions/${decision.superseded_by}`)}>
                Nachfolger anzeigen →
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Open tasks warning */}
      {computed.openLinkedTasks > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            <span className="font-semibold">{computed.openLinkedTasks} offene Aufgabe{computed.openLinkedTasks > 1 ? "n" : ""}</span> verknüpft — müssen erledigt werden.
          </p>
        </div>
      )}

      {/* ═══════════ 2-COLUMN LAYOUT ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ══ LEFT COLUMN (2/3) ══ */}
        <div className="lg:col-span-2 space-y-2">

          {/* ═══ 3. CORE INFORMATION ═══ */}
          <Section title="Kontext & Entscheidung" icon={FileText}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Problem / Beschreibung</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {decision.description || "Keine Beschreibung vorhanden."}
                </p>
              </div>
              {decision.context && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Hintergrund</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{decision.context}</p>
                </div>
              )}
              {decision.outcome && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Ergebnis / Empfehlung</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{decision.outcome}</p>
                </div>
              )}
              {/* Options */}
              {decision.options && Array.isArray(decision.options) && (decision.options as any[]).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Entscheidungsoptionen</p>
                  <div className="grid gap-2">
                    {(decision.options as any[]).map((opt: any, i: number) => (
                      <Card key={i} className="border-border/50">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium">{typeof opt === "string" ? opt : opt.title || opt.name || `Option ${i + 1}`}</p>
                          {typeof opt !== "string" && opt.description && (
                            <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Separator />

          {/* ═══ 5. RISK & IMPACT ═══ */}
          <Section title="Risiko & Wirtschaftlicher Impact" icon={Shield}
            badge={riskScore > 60 ? <Badge className="bg-destructive/20 text-destructive text-[10px]">Hoch</Badge> : undefined}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Risk breakdown */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold">Risiko-Profil</p>
                  <div className="space-y-2">
                    <RiskBar label="KI Risk Score" value={riskScore} />
                    <RiskBar label="Abhängigkeiten" value={Math.min(computed.depCount * 15, 100)} />
                    <RiskBar label="Offene Tasks" value={Math.min(computed.openLinkedTasks * 20, 100)} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Confidence: {riskScore > 0 ? "Mittel" : "Keine Daten"} · {computed.riskCount} verknüpfte Risiken</p>
                  {/* Risk/Success factors */}
                  {decision.ai_risk_factors?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-medium text-destructive mb-1">Risikofaktoren</p>
                      <div className="flex flex-wrap gap-1">
                        {decision.ai_risk_factors.map((f: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/20">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {decision.ai_success_factors?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-medium text-success mb-1">Erfolgsfaktoren</p>
                      <div className="flex flex-wrap gap-1">
                        {decision.ai_success_factors.map((f: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-success border-success/20">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Economic impact */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold">Wirtschaftlicher Impact</p>
                  <div className="space-y-2">
                    <KpiRow label="Verzögerungskosten/Woche" value={isActive ? formatCost(computed.delayCostPerWeek) : "—"} color="text-destructive" />
                    <KpiRow label="Gesamt-Delay Cost" value={isActive ? formatCost(computed.delayCost) : "—"} color="text-warning" />
                    <KpiRow label="Budget-Exposure" value={formatCost(computed.delayCost * 1.5)} color="text-muted-foreground" />
                    <KpiRow label="KI Impact Score" value={`${decision.ai_impact_score || 0}%`} color="text-primary" />
                  </div>
                  {isActive && computed.delayCostPerWeek > 2000 && (
                    <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                      <p className="text-[10px] text-destructive font-medium">⚠ Hohe Verzögerungskosten — Priorisierung empfohlen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Section>

          <Separator />

          {/* ═══ 6. DEPENDENCIES ═══ */}
          <Section title="Abhängigkeiten & Aufgaben" icon={Link2}
            badge={computed.depCount > 0 ? <Badge variant="outline" className="text-[10px]">{computed.depCount}</Badge> : undefined}
          >
            <DependenciesPanel decisionId={decision.id} />
          </Section>

          <Separator />

          {/* ═══ DISCUSSION ═══ */}
          <Section title="Diskussion" icon={MessageSquare}>
            <DiscussionPanel decisionId={decision.id} />
          </Section>

          <Separator />

          {/* ═══ 7. AUDIT TRAIL ═══ */}
          <Section title="Aktivität & Audit Trail" icon={History} defaultOpen={false}>
            <AuditTrailPanel decisionId={decision.id} />
          </Section>

          <Separator />

          {/* ═══ IMPACT TRACKER ═══ */}
          <Section title="Impact Tracking" icon={Target} defaultOpen={false}>
            <ImpactTrackerPanel decision={decision} onUpdated={invalidate} />
          </Section>

          {/* ═══ 9. LESSONS LEARNED ═══ */}
          {isImplemented && (
            <>
              <Separator />
              <Section title="Post-Implementation Review" icon={Lightbulb}>
                <PostImplementationReview decision={decision} onCompleted={invalidate} />
              </Section>
            </>
          )}
        </div>

        {/* ══ RIGHT COLUMN (1/3) ══ */}
        <div className="space-y-4">

          {/* ═══ 4. STAKEHOLDER & GOVERNANCE ═══ */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Stakeholder & Governance</p>

              {/* RACI */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: "Owner", userId: decision.owner_id, emoji: "👑" },
                  { role: "Assignee", userId: decision.assignee_id, emoji: "🎯" },
                ].map(r => (
                  <div key={r.role} className="p-2 rounded-lg bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground/60">{r.emoji} {r.role}</p>
                    <p className="text-xs font-semibold truncate">{r.userId ? (profileMap[r.userId] || "—") : "—"}</p>
                  </div>
                ))}
              </div>

              {/* Reviewer status */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">Review Status</p>
                {decReviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Keine Reviewer zugewiesen</p>
                ) : (
                  <div className="space-y-1.5">
                    {decReviews.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <span>{profileMap[r.reviewer_id] || "Unbekannt"}</span>
                        {r.reviewed_at ? (
                          <Badge className="text-[10px] bg-success/20 text-success border-0">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Done
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                            <Circle className="w-3 h-3 mr-0.5" /> Ausstehend
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stakeholder alignment */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">Stakeholder Alignment</p>
                {positionSummary.total === 0 ? (
                  <p className="text-xs text-muted-foreground">Keine Positionen abgegeben</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> {positionSummary.support}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> {positionSummary.neutral}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> {positionSummary.oppose}</span>
                    </div>
                    {/* Alignment bar */}
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                      {positionSummary.support > 0 && <div className="h-full bg-success" style={{ width: `${(positionSummary.support / positionSummary.total) * 100}%` }} />}
                      {positionSummary.neutral > 0 && <div className="h-full bg-warning" style={{ width: `${(positionSummary.neutral / positionSummary.total) * 100}%` }} />}
                      {positionSummary.oppose > 0 && <div className="h-full bg-destructive" style={{ width: `${(positionSummary.oppose / positionSummary.total) * 100}%` }} />}
                    </div>
                    {positionSummary.oppose > 0 && (
                      <p className="text-[10px] text-destructive">⚠ {positionSummary.oppose} Konflikt{positionSummary.oppose > 1 ? "e" : ""} — Alignment-Analyse empfohlen</p>
                    )}
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate(`/decisions/${decision.id}#alignment`)}>
                Alignment-Details öffnen
              </Button>
            </CardContent>
          </Card>

          {/* Alignment panel (expandable) */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> Alignment bearbeiten <ChevronDown className="w-3 h-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <StakeholderAlignmentPanel decisionId={decision.id} />
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* ═══ 8. AI INSIGHT PANEL ═══ */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> KI Insight</p>

              {/* Risk assessment */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Risikoeinschätzung</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${riskScore > 60 ? "bg-destructive" : riskScore > 40 ? "bg-warning" : "bg-success"}`} />
                  <p className="text-sm font-semibold">{riskScore}%</p>
                  <p className="text-xs text-muted-foreground">
                    {riskScore > 60 ? "Hohes Risiko" : riskScore > 40 ? "Mittleres Risiko" : "Niedriges Risiko"}
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 mb-1">Empfehlung</p>
                <p className="text-xs text-foreground">
                  {riskScore > 60
                    ? "Risiko-Review durch zweiten Stakeholder empfohlen. Szenario-Analyse durchführen."
                    : missingReviewers.length > 0
                      ? `${missingReviewers.length} Review${missingReviewers.length > 1 ? "s" : ""} ausstehend — Reviewer benachrichtigen.`
                      : computed.reviewCompletion === 100
                        ? "Alle Reviews abgeschlossen. Entscheidung kann genehmigt werden."
                        : "Entscheidung verläuft planmäßig."}
                </p>
              </div>

              {/* Next step */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Nächster Schritt</p>
                <p className="text-xs text-foreground">
                  {decision.status === "draft" ? "Review starten und Reviewer zuweisen"
                    : decision.status === "review" ? "Offene Reviews einfordern"
                      : decision.status === "approved" ? "Implementierung beginnen und Tasks erstellen"
                        : "Status aktuell halten"}
                </p>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 text-muted-foreground">
                    <Brain className="w-3.5 h-3.5" /> Detaillierte KI-Analyse <ChevronDown className="w-3 h-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <AiAnalysisPanel decision={decision} onUpdated={invalidate} />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Review Panel */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> Review & Genehmigung
              </p>
              <ReviewPanel decision={decision} onUpdated={invalidate} />
            </CardContent>
          </Card>

          {/* Meta info */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-2">Details</p>
              <div className="space-y-1.5 text-xs">
                <MetaRow label="Erstellt" value={format(new Date(decision.created_at), "dd.MM.yyyy HH:mm", { locale: de })} />
                <MetaRow label="Letztes Update" value={format(new Date(decision.updated_at), "dd.MM.yyyy HH:mm", { locale: de })} />
                {decision.due_date && (
                  <MetaRow label="Fällig" value={format(new Date(decision.due_date), "dd.MM.yyyy", { locale: de })} highlight={slaRemaining?.overdue} />
                )}
                {decision.implemented_at && (
                  <MetaRow label="Umgesetzt" value={format(new Date(decision.implemented_at), "dd.MM.yyyy", { locale: de })} />
                )}
                <MetaRow label="Kategorie" value={categoryLabels[decision.category]} />
                <MetaRow label="Priorität" value={priorityLabels[decision.priority]} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════ 10. ACTIONS FOOTER ═══════════ */}
      {isActive && (
        <div className="sticky bottom-0 z-10 mt-8 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-lg border-t border-border flex items-center gap-2 flex-wrap">
          {decision.status === "draft" && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("review")}>
              <PlayCircle className="w-3.5 h-3.5" /> Start Review
            </Button>
          )}
          {decision.status === "review" && (
            <>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("approved")}>
                <ThumbsUp className="w-3.5 h-3.5" /> Genehmigen
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => handleStatusChange("rejected")}>
                <ThumbsDown className="w-3.5 h-3.5" /> Ablehnen
              </Button>
            </>
          )}
          {decision.status === "approved" && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("implemented")}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Als umgesetzt markieren
            </Button>
          )}
          {(decision.escalation_level || 0) === 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-warning" onClick={async () => {
              await supabase.from("decisions").update({ escalation_level: 1, last_escalated_at: new Date().toISOString() }).eq("id", decision.id);
              invalidate(); toast.success("Eskaliert auf Stufe 1");
            }}>
              <ChevronUp className="w-3.5 h-3.5" /> Eskalieren
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => handleStatusChange("cancelled")}>
                <Ban className="w-3.5 h-3.5" /> Abbrechen
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => handleStatusChange("archived")}>
                <History className="w-3.5 h-3.5" /> Archivieren
              </Button>
            </>
          )}
        </div>
      )}

      {isOwner && (
        <>
          <EditDecisionDialog decision={decision} open={showEdit} onOpenChange={setShowEdit} onUpdated={invalidate} />
          <DeleteDecisionDialog decision={decision} open={showDelete} onOpenChange={setShowDelete} onDeleted={() => { invalidate(); navigate("/decisions"); }} />
        </>
      )}
    </AppLayout>
  );
};

/* ────────────────── Helper Components ────────────────── */

const RiskBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] mb-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{Math.min(value, 100)}%</span>
    </div>
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${value > 60 ? "bg-destructive" : value > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

const KpiRow = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-muted-foreground">{label}</span>
    <span className={`text-sm font-bold ${color}`}>{value}</span>
  </div>
);

const MetaRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={highlight ? "text-destructive font-medium" : ""}>{value}</span>
  </div>
);

export default DecisionDetail;
