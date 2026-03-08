import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Trash2, AlertCircle, Clock, ShieldAlert,
  ThumbsUp, ThumbsDown, PlayCircle, ChevronUp, Ban, Replace,
  Brain, DollarSign, Target, Users, Link2, History, Shield,
  ChevronDown, Lightbulb, FileText, MessageSquare, AlertTriangle,
  CheckCircle2, Circle, UserPlus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
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
import { useTranslatedLabels } from "@/lib/labels";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useRiskDecisionLinks } from "@/hooks/useRisks";
import WatchlistButton from "@/components/decisions/WatchlistButton";
import DecisionLifecycleBar from "@/components/decisions/DecisionLifecycleBar";
import ChangeReasonDialog from "@/components/audit/ChangeReasonDialog";
import SignatureConfirmDialog from "@/components/audit/SignatureConfirmDialog";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";
import { useTranslation } from "react-i18next";

// Lazy-loaded panels
import DiscussionPanel from "@/components/decisions/DiscussionPanel";
import ReviewPanel from "@/components/decisions/ReviewPanel";
import AiAnalysisPanel from "@/components/decisions/AiAnalysisPanel";
import AuditTrailPanel from "@/components/decisions/AuditTrailPanel";
import ImpactTrackerPanel from "@/components/decisions/ImpactTrackerPanel";
import StakeholderAlignmentPanel from "@/components/decisions/StakeholderAlignmentPanel";
import DependenciesPanel from "@/components/decisions/DependenciesPanel";
import PostImplementationReview from "@/components/decisions/PostImplementationReview";
import QuickMessageButton from "@/components/shared/QuickMessageButton";
import ArchiveSummaryBox from "@/components/decisions/ArchiveSummaryBox";
import InviteExternalReviewerDialog from "@/components/decisions/InviteExternalReviewerDialog";
import DecisionAttachmentsPanel from "@/components/decisions/DecisionAttachmentsPanel";
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
        <button className="flex items-center gap-2.5 w-full group py-2.5 px-1 rounded-lg hover:bg-muted/40 transition-colors -mx-1">
          <div className="w-7 h-7 rounded-md bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold flex-1 text-left tracking-tight">{title}</h2>
          {badge}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 pb-4 animate-accordion-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ────────────────── Live CoD KPI Panel ────────────────── */
const DetailKpiPanel = ({ riskScore, decision, isActive, computed, slaRemaining, formatCost, t }: any) => {
  const [sessionAccrued, setSessionAccrued] = useState(0);
  const startRef = useRef(Date.now());
  const costPerSecond = useMemo(() => {
    // hourlyRate × 8h × persons × overhead / 86400
    const hourlyRate = 85, persons = 3, overhead = 1.5;
    return (hourlyRate * 8 * persons * overhead) / 86400;
  }, []);
  const weeklyRate = computed.delayCostPerWeek;
  const liveWeeklyCost = weeklyRate + sessionAccrued * 7;

  useEffect(() => {
    if (!isActive || weeklyRate <= 0) return;
    const tick = () => {
      if (document.visibilityState === "visible") {
        setSessionAccrued((Date.now() - startRef.current) / 1000 * costPerSecond);
      }
    };
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [isActive, costPerSecond, weeklyRate]);

  const codColor = liveWeeklyCost > 1000 ? "hsl(var(--destructive))" : liveWeeklyCost >= 500 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";

  const kpis = [
    { label: "Risk", value: `${riskScore}%`, icon: AlertTriangle, color: riskScore > 60 ? "text-destructive" : riskScore > 40 ? "text-warning" : "text-success", bg: riskScore > 60 ? "bg-destructive/10" : riskScore > 40 ? "bg-warning/10" : "bg-success/10" },
    { label: t("decisionDetail.escalate"), value: `Level ${decision.escalation_level || 0}`, icon: ShieldAlert, color: (decision.escalation_level || 0) > 0 ? "text-destructive" : "text-muted-foreground", bg: (decision.escalation_level || 0) > 0 ? "bg-destructive/10" : "bg-muted/50" },
    { label: t("decisionDetail.metaDue"), value: slaRemaining?.text || "—", icon: Clock, color: slaRemaining?.overdue ? "text-destructive" : "text-muted-foreground", bg: slaRemaining?.overdue ? "bg-destructive/10" : "bg-muted/50" },
    { label: "Health", value: `${Math.round(((100 - riskScore) * 0.3 + computed.reviewCompletion * 0.3 + computed.alignmentScore * 0.2 + (slaRemaining?.overdue ? 0 : 80) * 0.2))}/100`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger-children">
      {kpis.map(kpi => (
        <Tooltip key={kpi.label}>
          <TooltipTrigger asChild>
            <Card className={`${kpi.bg} border-0 card-interactive`}>
              <CardContent className="p-3 text-center">
                <div className="w-7 h-7 rounded-md bg-background/60 flex items-center justify-center mx-auto mb-1.5">
                  <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
                <p className={`text-base font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">{kpi.label}</p></TooltipContent>
        </Tooltip>
      ))}
      {/* Live CoD Card */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`border-0 card-interactive`} style={{ backgroundColor: liveWeeklyCost > 1000 ? "hsl(0 84% 60% / 0.1)" : liveWeeklyCost >= 500 ? "hsl(38 92% 50% / 0.1)" : "hsl(var(--muted) / 0.5)" }}>
            <CardContent className="p-3 text-center">
              <div className="w-7 h-7 rounded-md bg-background/60 flex items-center justify-center mx-auto mb-1.5">
                <DollarSign className="w-3.5 h-3.5" style={{ color: codColor }} />
              </div>
              <p className="text-base font-bold tabular-nums" style={{ color: codColor }}>
                {isActive ? formatCost(Math.round(liveWeeklyCost)) + "/Wo" : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Cost of Delay</p>
              {isActive && sessionAccrued > 0 && (
                <p className="text-[9px] mt-1" style={{ color: codColor }}>
                  ↑ {sessionAccrued.toFixed(2)}€ seit Seitenöffnung
                </p>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent><p className="text-xs">Echtzeit Cost-of-Delay: Stundensatz × 8h × Personen × Overhead</p></TooltipContent>
      </Tooltip>
    </div>
  );
};

/* ────────────────── MAIN COMPONENT ────────────────── */
const DecisionDetail = () => {
  const { t, i18n } = useTranslation();
  const tl = useTranslatedLabels(t);
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

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
  const [showExternalInvite, setShowExternalInvite] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pendingReason, setPendingReason] = useState("");

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
    if (hoursLeft < 0) return { text: t("decisionDetail.slaOverdue", { hours: Math.abs(hoursLeft) }), overdue: true, days: Math.ceil(Math.abs(hoursLeft) / 24) };
    if (hoursLeft < 24) return { text: t("decisionDetail.slaRemaining", { hours: hoursLeft }), overdue: false, days: 0 };
    const daysLeft = Math.floor(hoursLeft / 24);
    return { text: t("decisionDetail.slaDays", { days: daysLeft }), overdue: false, days: daysLeft };
  }, [decision, t]);

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
    if (slaRemaining?.overdue) parts.push(t("decisionDetail.slaViolated", { days: slaRemaining.days }));
    if (missingReviewers.length > 0) parts.push(t("decisionDetail.reviewersPending", { count: missingReviewers.length }));
    if (riskScore > 70) parts.push(t("decisionDetail.riskAt", { score: riskScore }));
    if (computed.delayCostPerWeek > 0 && isActive) parts.push(t("decisionDetail.delayRiskPerWeek", { cost: formatCost(computed.delayCostPerWeek) }));
    return parts.length > 0 ? parts.join(". ") + "." : null;
  }, [decision, slaRemaining, missingReviewers, riskScore, computed.delayCostPerWeek, isActive, t]);

  if (!decision) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t("decisionDetail.notFound")}</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/decisions")}>
            <ArrowLeft className="w-4 h-4" /> {t("decisionDetail.back")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const CRITICAL_STATUSES = new Set(["approved", "implemented", "rejected"]);

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowReasonDialog(true);
  };

  const handleReasonConfirm = (reason: string) => {
    setPendingReason(reason);
    setShowReasonDialog(false);
    if (pendingStatus && CRITICAL_STATUSES.has(pendingStatus)) {
      setShowSignatureDialog(true);
    } else {
      executeStatusChange(reason, null);
    }
  };

  const handleSignatureConfirm = (method: string) => {
    setShowSignatureDialog(false);
    executeStatusChange(pendingReason, method);
  };

  const executeStatusChange = async (reason: string, signatureMethod: string | null) => {
    if (!pendingStatus) return;
    setSaving(true);
    const newStatus = pendingStatus;
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
        change_reason: reason,
        signed_by: signatureMethod ? user!.id : undefined,
        signed_at: signatureMethod ? new Date().toISOString() : undefined,
        signature_method: signatureMethod || undefined,
      });
      invalidate();
      toast.success(`Status → ${tl.statusLabels[newStatus]}`);
    }
    setPendingStatus(null);
    setPendingReason("");
    setSaving(false);
  };

  return (
    <AppLayout>
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/decisions")}>
        <ArrowLeft className="w-4 h-4" /> {t("decisionDetail.backToDecisions")}
      </Button>

      {/* ═══════════ ARCHIVE SUMMARY (auto for decisions > 90 days) ═══════════ */}
      <ArchiveSummaryBox decision={decision} />

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
                      {tl.statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="text-[10px]">{tl.categoryLabels[decision.category]}</Badge>
              <span className={`font-semibold ${priorityStyles[decision.priority]}`}>{tl.priorityLabels[decision.priority]}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                Owner: {profileMap[decision.owner_id || decision.created_by] || "—"}
                <QuickMessageButton
                  teamId={decision.team_id}
                  decisionId={decision.id}
                  decisionTitle={decision.title}
                  recipientName={profileMap[decision.owner_id || decision.created_by]}
                  recipientId={decision.owner_id || decision.created_by}
                />
              </span>
              {decision.assignee_id && decision.assignee_id !== decision.owner_id && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    Assignee: {profileMap[decision.assignee_id] || "—"}
                    <QuickMessageButton
                      teamId={decision.team_id}
                      decisionId={decision.id}
                      decisionTitle={decision.title}
                      recipientName={profileMap[decision.assignee_id]}
                      recipientId={decision.assignee_id}
                    />
                  </span>
                </>
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

        {/* KPI Mini-Panel with live CoD */}
        <DetailKpiPanel
          riskScore={riskScore}
          decision={decision}
          isActive={isActive}
          computed={computed}
          slaRemaining={slaRemaining}
          formatCost={formatCost}
          t={t}
        />
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
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">{t("decisionDetail.attentionRequired")}</p>
            <p className="text-sm text-destructive font-medium">{focusMessage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (decision.escalation_level || 0) === 0 && (
              <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => {
                await supabase.from("decisions").update({ escalation_level: 1, last_escalated_at: new Date().toISOString() }).eq("id", decision.id);
                invalidate(); toast.success(t("decisionDetail.escalated"));
              }}>
                <ChevronUp className="w-3 h-3 mr-1" /> {t("decisionDetail.escalate")}
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
            <p className="text-sm font-semibold text-muted-foreground">{t("decisionDetail.cancelled")}</p>
            <p className="text-xs text-muted-foreground/70">
              {decision.cancelled_at ? t("decisionDetail.cancelledAt", { date: format(new Date(decision.cancelled_at), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale }) }) : ""}
            </p>
          </div>
        </div>
      )}
      {decision.status === "superseded" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/20 border border-accent/30 mb-6">
          <Replace className="w-5 h-5 text-accent-foreground shrink-0" />
          <div>
            <p className="text-sm font-semibold text-accent-foreground">{t("decisionDetail.superseded")}</p>
            {decision.superseded_by && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => navigate(`/decisions/${decision.superseded_by}`)}>
                {t("decisionDetail.showSuccessor")}
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
            {t("decisionDetail.openTasksWarning", { count: computed.openLinkedTasks })}
          </p>
        </div>
      )}

      {/* ═══════════ 2-COLUMN LAYOUT ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ══ LEFT COLUMN (2/3) ══ */}
        <div className="lg:col-span-2 space-y-2">

          {/* ═══ 3. CORE INFORMATION ═══ */}
          <Section title={t("decisionDetail.contextSection")} icon={FileText}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{t("decisionDetail.problemDesc")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {decision.description || t("decisionDetail.noDescription")}
                </p>
              </div>
              {decision.context && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{t("decisionDetail.background")}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{decision.context}</p>
                </div>
              )}
              {decision.outcome && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{t("decisionDetail.outcomeRec")}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{decision.outcome}</p>
                </div>
              )}
              {/* Options */}
              {decision.options && Array.isArray(decision.options) && (decision.options as any[]).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">{t("decisionDetail.optionsTitle")}</p>
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
          <Section title={t("decisionDetail.riskImpact")} icon={Shield}
            badge={riskScore > 60 ? <Badge className="bg-destructive/20 text-destructive text-[10px]">{t("decisionDetail.highRisk")}</Badge> : undefined}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Risk breakdown */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold">{t("decisionDetail.riskProfile")}</p>
                  <div className="space-y-2">
                    <RiskBar label={t("decisionDetail.aiRiskScore")} value={riskScore} />
                    <RiskBar label={t("decisionDetail.dependencies")} value={Math.min(computed.depCount * 15, 100)} />
                    <RiskBar label={t("decisionDetail.openTasks")} value={Math.min(computed.openLinkedTasks * 20, 100)} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("decisionDetail.confidenceLabel")}: {riskScore > 0 ? t("decisionDetail.confidenceMedium") : t("decisionDetail.confidenceNone")} · {computed.riskCount} {t("decisionDetail.linkedRisks")}</p>
                  {/* Risk/Success factors */}
                  {decision.ai_risk_factors?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-medium text-destructive mb-1">{t("decisionDetail.riskFactors")}</p>
                      <div className="flex flex-wrap gap-1">
                        {decision.ai_risk_factors.map((f: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/20">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {decision.ai_success_factors?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-medium text-success mb-1">{t("decisionDetail.successFactors")}</p>
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
                  <p className="text-xs font-semibold">{t("decisionDetail.economicImpact")}</p>
                  <div className="space-y-2">
                    <KpiRow label={t("decisionDetail.delayCostPerWeek")} value={isActive ? formatCost(computed.delayCostPerWeek) : "—"} color="text-destructive" />
                    <KpiRow label={t("decisionDetail.totalDelayCost")} value={isActive ? formatCost(computed.delayCost) : "—"} color="text-warning" />
                    <KpiRow label={t("decisionDetail.budgetExposure")} value={formatCost(computed.delayCost * 1.5)} color="text-muted-foreground" />
                    <KpiRow label={t("decisionDetail.aiImpactScore")} value={`${decision.ai_impact_score || 0}%`} color="text-primary" />
                  </div>
                  {isActive && computed.delayCostPerWeek > 2000 && (
                    <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                      <p className="text-[10px] text-destructive font-medium">{t("decisionDetail.highDelayCost")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Section>

          <Separator />

          {/* ═══ 6. DEPENDENCIES ═══ */}
          <Section title={t("decisionDetail.depsSection")} icon={Link2}
            badge={computed.depCount > 0 ? <Badge variant="outline" className="text-[10px]">{computed.depCount}</Badge> : undefined}
          >
            <DependenciesPanel decisionId={decision.id} />
          </Section>

          <Separator />

          {/* ═══ DISCUSSION & AUDIT TRAIL TABS ═══ */}
          <DecisionThreadTabs decisionId={decision.id} decision={decision} dateFnsLocale={dateFnsLocale} tl={tl} />

          <Separator />

          {/* ═══ IMPACT TRACKER ═══ */}
          <Section title={t("decisionDetail.impactSection")} icon={Target} defaultOpen={false}>
            <ImpactTrackerPanel decision={decision} onUpdated={invalidate} />
          </Section>

          {/* ═══ 9. LESSONS LEARNED ═══ */}
          {isImplemented && (
            <>
              <Separator />
              <Section title={t("decisionDetail.pirSection")} icon={Lightbulb}>
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
              <p className="text-xs font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> {t("decisionDetail.stakeholderGov")}</p>

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
                  <p className="text-xs text-muted-foreground">{t("decisionDetail.noReviewers")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {decReviews.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <span>{profileMap[r.reviewer_id] || t("common.unknown", "Unbekannt")}</span>
                        {r.reviewed_at ? (
                          <Badge className="text-[10px] bg-success/20 text-success border-0">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Done
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                            <Circle className="w-3 h-3 mr-0.5" /> {t("decisionDetail.reviewPending")}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stakeholder alignment */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">{t("decisionDetail.stakeholderAlignment")}</p>
                {positionSummary.total === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("decisionDetail.noPositions")}</p>
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
                      <p className="text-[10px] text-destructive">⚠ {t("decisionDetail.conflictsWarning", { count: positionSummary.oppose })}</p>
                    )}
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate(`/decisions/${decision.id}#alignment`)}>
                {t("decisionDetail.alignmentDetails")}
              </Button>
            </CardContent>
          </Card>

          {/* Alignment panel (expandable) */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> {t("decisionDetail.editAlignment")} <ChevronDown className="w-3 h-3" />
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
              <p className="text-xs font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> {t("decisionDetail.aiInsight")}</p>

              {/* Risk assessment */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{t("decisionDetail.riskAssessment")}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${riskScore > 60 ? "bg-destructive" : riskScore > 40 ? "bg-warning" : "bg-success"}`} />
                  <p className="text-sm font-semibold">{riskScore}%</p>
                  <p className="text-xs text-muted-foreground">
                    {riskScore > 60 ? t("decisionDetail.highRisk") : riskScore > 40 ? t("decisionDetail.mediumRisk") : t("decisionDetail.lowRisk")}
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 mb-1">{t("decisionDetail.recommendation")}</p>
                <p className="text-xs text-foreground">
                  {riskScore > 60
                    ? t("decisionDetail.recHighRisk")
                    : missingReviewers.length > 0
                      ? t("decisionDetail.recPendingReviews", { count: missingReviewers.length })
                      : computed.reviewCompletion === 100
                        ? t("decisionDetail.recAllComplete")
                        : t("decisionDetail.recOnTrack")}
                </p>
              </div>

              {/* Next step */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{t("decisionDetail.nextStep")}</p>
                <p className="text-xs text-foreground">
                  {decision.status === "draft" ? t("decisionDetail.nextDraft")
                    : decision.status === "review" ? t("decisionDetail.nextReview")
                      : decision.status === "approved" ? t("decisionDetail.nextApproved")
                        : t("decisionDetail.nextDefault")}
                </p>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 text-muted-foreground">
                    <Brain className="w-3.5 h-3.5" /> {t("decisionDetail.detailedAi")} <ChevronDown className="w-3 h-3" />
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> {t("decisionDetail.reviewApproval")}
                </p>
                <Button variant="ghost" size="sm" className="text-[10px] gap-1 h-6" onClick={() => setShowExternalInvite(true)}>
                  <UserPlus className="w-3 h-3" /> {t("decisions.externalInviteTitle")}
                </Button>
              </div>
              <ReviewPanel decision={decision} onUpdated={invalidate} />
            </CardContent>
          </Card>

          {/* ═══ ATTACHMENTS ═══ */}
          <Card>
            <CardContent className="p-4">
              <DecisionAttachmentsPanel
                decisionId={decision.id}
                orgId={decision.org_id}
                profileMap={profileMap}
              />
            </CardContent>
          </Card>

          {/* Meta info */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-2">{t("decisionDetail.details")}</p>
              <div className="space-y-1.5 text-xs">
                <MetaRow label={t("decisionDetail.metaCreated")} value={format(new Date(decision.created_at), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale })} />
                <MetaRow label={t("decisionDetail.metaUpdated")} value={format(new Date(decision.updated_at), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale })} />
                {decision.due_date && (
                  <MetaRow label={t("decisionDetail.metaDue")} value={format(new Date(decision.due_date), "dd.MM.yyyy", { locale: dateFnsLocale })} highlight={slaRemaining?.overdue} />
                )}
                {decision.implemented_at && (
                  <MetaRow label={t("decisionDetail.metaImplemented")} value={format(new Date(decision.implemented_at), "dd.MM.yyyy", { locale: dateFnsLocale })} />
                )}
                <MetaRow label={t("decisionDetail.metaCategory")} value={tl.categoryLabels[decision.category]} />
                <MetaRow label={t("decisionDetail.metaPriority")} value={tl.priorityLabels[decision.priority]} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════ 10. ACTIONS FOOTER ═══════════ */}
      {isActive && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-0 z-10 mt-8 -mx-4 px-6 py-3 bg-background border-t border-border flex items-center gap-2 flex-wrap"
        >
          {decision.status === "draft" && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("review")}>
              <PlayCircle className="w-3.5 h-3.5" /> {t("decisionDetail.startReview")}
            </Button>
          )}
          {decision.status === "review" && (
            <>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("approved")}>
                <ThumbsUp className="w-3.5 h-3.5" /> {t("decisionDetail.approve")}
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => handleStatusChange("rejected")}>
                <ThumbsDown className="w-3.5 h-3.5" /> {t("decisionDetail.reject")}
              </Button>
            </>
          )}
          {decision.status === "approved" && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("implemented")}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {t("decisionDetail.markImplemented")}
            </Button>
          )}
          {(decision.escalation_level || 0) === 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-warning" onClick={async () => {
              await supabase.from("decisions").update({ escalation_level: 1, last_escalated_at: new Date().toISOString() }).eq("id", decision.id);
              invalidate(); toast.success(t("decisionDetail.escalated"));
            }}>
              <ChevronUp className="w-3.5 h-3.5" /> {t("decisionDetail.escalate")}
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => handleStatusChange("cancelled")}>
                <Ban className="w-3.5 h-3.5" /> {t("decisionDetail.cancelDecision")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => handleStatusChange("archived")}>
                <History className="w-3.5 h-3.5" /> {t("decisionDetail.archiveDecision")}
              </Button>
            </>
          )}
        </motion.div>
      )}

      {isOwner && (
        <>
          <EditDecisionDialog decision={decision} open={showEdit} onOpenChange={setShowEdit} onUpdated={invalidate} />
          <DeleteDecisionDialog decision={decision} open={showDelete} onOpenChange={setShowDelete} onDeleted={() => { invalidate(); navigate("/decisions"); }} />
          <InviteExternalReviewerDialog decisionId={decision.id} decisionTitle={decision.title} dueDate={decision.due_date} open={showExternalInvite} onOpenChange={setShowExternalInvite} onInvited={invalidate} />
        </>
      )}

      <ChangeReasonDialog
        open={showReasonDialog}
        onOpenChange={(v) => { setShowReasonDialog(v); if (!v) setPendingStatus(null); }}
        changeDescription={pendingStatus ? `${t("audit.statusChange")}: ${tl.statusLabels[status]} → ${tl.statusLabels[pendingStatus]}` : undefined}
        onConfirm={handleReasonConfirm}
        loading={saving}
      />
      <SignatureConfirmDialog
        open={showSignatureDialog}
        onOpenChange={(v) => { setShowSignatureDialog(v); if (!v) { setPendingStatus(null); setPendingReason(""); } }}
        actionDescription={pendingStatus ? `${t("audit.statusChange")}: ${tl.statusLabels[status]} → ${tl.statusLabels[pendingStatus]}` : ""}
        onConfirm={handleSignatureConfirm}
        loading={saving}
      />
    </AppLayout>
  );
};

/* ────────────────── Decision Thread Tabs ────────────────── */
const DecisionThreadTabs = ({ decisionId, decision, dateFnsLocale, tl }: { decisionId: string; decision?: any; dateFnsLocale?: any; tl?: any }) => {
  const { t } = useTranslation();
  const { data: commentCount = 0 } = useQuery({
    queryKey: ["comment-count", decisionId],
    queryFn: async () => {
      const { count } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("decision_id", decisionId);
      return count || 0;
    },
    staleTime: 15_000,
  });

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="details" className="text-xs gap-1.5">
          <FileText className="w-3.5 h-3.5" /> {t("decisionDetail.details")}
        </TabsTrigger>
        <TabsTrigger value="discussion" className="text-xs gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> {t("decisionDetail.discussionSection")}
          {commentCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 min-w-4 px-1">{commentCount}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="audit" className="text-xs gap-1.5">
          <History className="w-3.5 h-3.5" /> Audit Trail
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        {decision && dateFnsLocale && tl ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-4 text-xs">
            <MetaRow label={t("decisionDetail.metaCreated")} value={format(new Date(decision.created_at), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale })} />
            <MetaRow label={t("decisionDetail.metaUpdated")} value={format(new Date(decision.updated_at), "dd.MM.yyyy HH:mm", { locale: dateFnsLocale })} />
            {decision.due_date && (
              <MetaRow label={t("decisionDetail.metaDue")} value={format(new Date(decision.due_date), "dd.MM.yyyy", { locale: dateFnsLocale })} />
            )}
            <MetaRow label={t("decisionDetail.metaCategory")} value={tl.categoryLabels[decision.category]} />
            <MetaRow label={t("decisionDetail.metaPriority")} value={tl.priorityLabels[decision.priority]} />
            {decision.implemented_at && (
              <MetaRow label={t("decisionDetail.metaImplemented")} value={format(new Date(decision.implemented_at), "dd.MM.yyyy", { locale: dateFnsLocale })} />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("decisionDetail.detailsAbove")}</p>
        )}
      </TabsContent>
      <TabsContent value="discussion">
        <DiscussionPanel decisionId={decisionId} />
      </TabsContent>
      <TabsContent value="audit">
        <AuditTrailPanel decisionId={decisionId} />
      </TabsContent>
    </Tabs>
  );
};

/* ────────────────── Helper Components ────────────────── */

const RiskBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{Math.min(value, 100)}%</span>
    </div>
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${value > 60 ? "bg-destructive" : value > 40 ? "bg-warning" : "bg-success"}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
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
