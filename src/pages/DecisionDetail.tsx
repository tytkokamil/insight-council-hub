import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Trash2, AlertCircle, MessageSquare,
  GitPullRequest, Brain, History, Target, Users, GitBranch, Link2,
  Compass, Crosshair, Clock, ShieldAlert, AlertTriangle, DollarSign,
  ThumbsUp, ThumbsDown, PlayCircle, ChevronUp, HelpCircle, CheckSquare, Shield,
  GitCommit, ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Panels
import DecisionHealthScore from "@/components/decisions/DecisionHealthScore";
import DiscussionPanel from "@/components/decisions/DiscussionPanel";
import ReviewPanel from "@/components/decisions/ReviewPanel";
import AiAnalysisPanel from "@/components/decisions/AiAnalysisPanel";
import AuditTrailPanel from "@/components/decisions/AuditTrailPanel";
import ImpactTrackerPanel from "@/components/decisions/ImpactTrackerPanel";
import StakeholderAlignmentPanel from "@/components/decisions/StakeholderAlignmentPanel";
import WhatIfSimulatorPanel from "@/components/decisions/WhatIfSimulatorPanel";
import DependenciesPanel from "@/components/decisions/DependenciesPanel";
import CoPilotPanel from "@/components/decisions/CoPilotPanel";
import StrategyLinkPanel from "@/components/decisions/StrategyLinkPanel";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";
import VersionHistoryPanel from "@/components/decisions/VersionHistoryPanel";
import PostImplementationReview from "@/components/decisions/PostImplementationReview";

const statusOptions = ["draft", "proposed", "review", "approved", "rejected", "implemented", "archived"] as const;

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  proposed: "bg-accent text-accent-foreground",
  review: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  implemented: "bg-primary/20 text-primary",
  archived: "bg-muted/50 text-muted-foreground/60",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-destructive",
};

const tabGroups = [
  {
    label: "Überblick",
    tabs: [
      { value: "overview", icon: Target, label: "Overview" },
      { value: "discussion", icon: MessageSquare, label: "Diskussion" },
    ],
  },
  {
    label: "Governance",
    tabs: [
      { value: "review", icon: GitPullRequest, label: "Review" },
      { value: "alignment", icon: Users, label: "Alignment" },
    ],
  },
  {
    label: "Analyse",
    tabs: [
      { value: "dependencies", icon: Link2, label: "Dependencies" },
      { value: "impact", icon: DollarSign, label: "Impact" },
      { value: "pir", icon: ClipboardCheck, label: "PIR" },
      { value: "ai", icon: Brain, label: "KI Insights" },
      { value: "whatif", icon: GitBranch, label: "What-If" },
    ],
  },
  {
    label: "Strategie",
    tabs: [
      { value: "copilot", icon: Compass, label: "Co-Pilot" },
      { value: "strategy", icon: Crosshair, label: "Strategie" },
      { value: "versions", icon: GitCommit, label: "Versionen" },
      { value: "audit", icon: History, label: "Audit" },
    ],
  },
];

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

  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Stakeholder positions
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

  // Goal links for alignment
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

  // Linked data computation
  const { data: riskDecLinks = [] } = useRiskDecisionLinks();

  const { openLinkedTasks, depCount, delayCost, reviewCompletion, alignmentScore, riskCount } = useMemo(() => {
    if (!decision) return { openLinkedTasks: 0, depCount: 0, delayCost: 0, reviewCompletion: 0, alignmentScore: 0, riskCount: 0 };
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
    const cost = Math.round(daysOpen * 2 * 75 * (mult[decision.priority] || 1.5));

    const decReviews = allReviews.filter(r => r.decision_id === decision.id);
    const reviewComp = decReviews.length > 0
      ? Math.round((decReviews.filter(r => r.reviewed_at).length / decReviews.length) * 100)
      : 0;

    const alignment = goalLinks.length > 0
      ? Math.round(goalLinks.reduce((s, l) => s + (l.impact_weight || 50), 0) / goalLinks.length)
      : 0;

    const linkedRisks = riskDecLinks.filter(l => l.decision_id === decision.id).length;

    return { openLinkedTasks: openTasks, depCount: deps.length, delayCost: cost, reviewCompletion: reviewComp, alignmentScore: alignment, riskCount: linkedRisks };
  }, [decision, allDeps, allTasks, allReviews, goalLinks, riskDecLinks]);

  // SLA timer
  const slaRemaining = useMemo(() => {
    if (!decision?.due_date || !decision || ["implemented", "rejected"].includes(decision.status)) return null;
    const hoursLeft = differenceInHours(new Date(decision.due_date), new Date());
    if (hoursLeft < 0) return { text: `${Math.abs(hoursLeft)}h überfällig`, overdue: true };
    if (hoursLeft < 24) return { text: `${hoursLeft}h verbleibend`, overdue: false };
    const daysLeft = Math.floor(hoursLeft / 24);
    return { text: `${daysLeft}d ${hoursLeft % 24}h`, overdue: false };
  }, [decision]);

  // Timeline steps
  const timelineSteps = useMemo(() => {
    const s = decision?.status || status;
    return [
      { label: "Erstellt", date: decision?.created_at, done: true },
      { label: "Review", date: null, done: ["review", "approved", "implemented"].includes(s) },
      { label: "Genehmigt", date: null, done: ["approved", "implemented"].includes(s) },
      { label: "Umgesetzt", date: decision?.implemented_at, done: s === "implemented" },
    ];
  }, [decision, status]);

  // Stakeholder position summary
  const positionSummary = useMemo(() => {
    const support = stakeholderPositions.filter(p => p.position === "support").length;
    const neutral = stakeholderPositions.filter(p => p.position === "neutral").length;
    const oppose = stakeholderPositions.filter(p => p.position === "oppose").length;
    return { support, neutral, oppose, total: stakeholderPositions.length };
  }, [stakeholderPositions]);
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

  const isOwner = user?.id === decision.created_by;
  const isActive = !["implemented", "rejected"].includes(decision.status);
  const riskScore = decision.ai_risk_score || 0;

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const oldStatus = status;
    const updates: Record<string, any> = { status: newStatus as any, updated_at: new Date().toISOString() };
    if (newStatus === "implemented") updates.implemented_at = new Date().toISOString();
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

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  return (
    <AppLayout>
      {/* Back navigation */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/decisions")}>
        <ArrowLeft className="w-4 h-4" /> Entscheidungen
      </Button>

      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-display text-2xl font-bold">{decision.title}</h1>
            {/* Status Dropdown */}
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
            <span className={`text-xs font-semibold ${priorityStyles[decision.priority]}`}>
              {priorityLabels[decision.priority]}
            </span>
            {(decision.escalation_level || 0) > 0 && (
              <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">
                <ShieldAlert className="w-3 h-3 mr-1" /> Eskalation Stufe {decision.escalation_level}
              </Badge>
            )}
            {slaRemaining && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={slaRemaining.overdue ? "destructive" : "outline"} className="text-[10px] gap-1">
                    <Clock className="w-3 h-3" /> {slaRemaining.text}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">SLA-Timer: Zeit bis Fälligkeit</p></TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">{decision.description || "Keine Beschreibung"}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span>Owner: {profileMap[decision.assignee_id || decision.created_by] || "Unbekannt"}</span>
            <span>{categoryLabels[decision.category]}</span>
            {decision.due_date && (
              <span className={slaRemaining?.overdue ? "text-destructive font-medium" : ""}>
                Fällig: {format(new Date(decision.due_date), "dd.MM.yyyy", { locale: de })}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-4 h-4" />
          </Button>
          {decision.status === "draft" && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusChange("review")}>
              <PlayCircle className="w-3.5 h-3.5" /> Start Review
            </Button>
          )}
          {decision.status === "review" && (
            <>
              <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={() => handleStatusChange("approved")}>
                <ThumbsUp className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => handleStatusChange("rejected")}>
                <ThumbsDown className="w-3.5 h-3.5" /> Reject
              </Button>
            </>
          )}
          {isActive && (decision.escalation_level || 0) === 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-warning" onClick={async () => {
              await supabase.from("decisions").update({ escalation_level: 1, last_escalated_at: new Date().toISOString() }).eq("id", decision.id);
              invalidate(); toast.success("Eskaliert auf Stufe 1");
            }}>
              <ChevronUp className="w-3.5 h-3.5" /> Eskalieren
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowEdit(true)}>
                <Pencil className="w-3.5 h-3.5" /> Bearbeiten
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Open tasks warning */}
      {openLinkedTasks > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            <span className="font-semibold">{openLinkedTasks} offene Aufgabe{openLinkedTasks > 1 ? "n" : ""}</span> verknüpft — müssen erledigt werden.
          </p>
        </div>
      )}

      {/* ═══ DECISION HEALTH SCORE ═══ */}
      <DecisionHealthScore
        decision={decision}
        reviewCompletion={reviewCompletion}
        alignmentScore={alignmentScore}
        riskScore={riskScore}
        depCount={depCount}
        riskCount={riskCount}
        delayCost={delayCost}
        openLinkedTasks={openLinkedTasks}
        isActive={isActive}
        stakeholderPositions={stakeholderPositions}
      />

      {/* ═══ TABBED CONTENT ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 border-b border-border pb-3">
          {tabGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-1.5">{group.label}</p>
              <div className="flex gap-1">
                {group.tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === tab.value
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ TAB 1: OVERVIEW ═══ */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Summary */}
            <div className="space-y-4">
              {/* A) Summary Section */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Problembeschreibung</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {decision.description || "Keine Beschreibung vorhanden."}
                    </p>
                  </div>
                  {decision.context && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Kontext & Hintergrund</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{decision.context}</p>
                    </div>
                  )}
                  {decision.outcome && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Entscheidungsempfehlung / Ergebnis</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{decision.outcome}</p>
                      {decision.outcome_notes && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border italic">{decision.outcome_notes}</p>
                      )}
                    </div>
                  )}

                  {/* Options */}
                  {decision.options && Array.isArray(decision.options) && (decision.options as any[]).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Optionen</h3>
                      <div className="space-y-2">
                        {(decision.options as any[]).map((opt: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border text-sm">
                            <p className="font-medium">{typeof opt === "string" ? opt : opt.title || opt.name || `Option ${i + 1}`}</p>
                            {typeof opt !== "string" && opt.description && (
                              <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* B) Stakeholder Matrix */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Stakeholder-Matrix</h3>
                  {stakeholderPositions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Noch keine Positionen abgegeben. Nutze den Alignment-Tab.</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-3 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Support: {positionSummary.support}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Neutral: {positionSummary.neutral}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Oppose: {positionSummary.oppose}</span>
                      </div>
                      <div className="space-y-2">
                        {stakeholderPositions.slice(0, 5).map(sp => (
                          <div key={sp.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20">
                            <span className="font-medium">{profileMap[sp.user_id] || "Unbekannt"}</span>
                            <Badge variant="outline" className={`text-[10px] ${
                              sp.position === "support" ? "text-success border-success/30" :
                              sp.position === "oppose" ? "text-destructive border-destructive/30" :
                              "text-warning border-warning/30"
                            }`}>{sp.position === "support" ? "Unterstützt" : sp.position === "oppose" ? "Dagegen" : "Neutral"}</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* C) Health Indicators */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Decision Health</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Risiko", value: riskScore, color: riskScore > 60 ? "bg-destructive" : riskScore > 40 ? "bg-warning" : "bg-success" },
                      { label: "KI-Impact", value: decision.ai_impact_score || 0, color: "bg-primary" },
                      { label: "Alignment", value: alignmentScore, color: "bg-primary" },
                      { label: "Review-Fortschritt", value: reviewCompletion, color: reviewCompletion === 100 ? "bg-success" : "bg-warning" },
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <span className="font-semibold">{metric.value}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${metric.color}`} style={{ width: `${metric.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Risk/Success factors */}
                  {(decision.ai_risk_factors?.length > 0 || decision.ai_success_factors?.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-border space-y-3">
                      {decision.ai_risk_factors?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-destructive mb-1">Risikofaktoren</p>
                          <div className="flex flex-wrap gap-1">
                            {decision.ai_risk_factors.map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/20">{f}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {decision.ai_success_factors?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-success mb-1">Erfolgsfaktoren</p>
                          <div className="flex flex-wrap gap-1">
                            {decision.ai_success_factors.map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] text-success border-success/20">{f}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* D) Timeline Visual */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Timeline</h3>
                  {/* Visual pipeline */}
                  <div className="flex items-center gap-1 mb-4">
                    {timelineSteps.map((step, i) => (
                      <div key={step.label} className="flex-1 flex items-center">
                        <div className={`flex-1 h-1.5 rounded-full ${step.done ? "bg-primary" : "bg-muted"}`} />
                        {i < timelineSteps.length - 1 && <div className="w-1" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
                    {timelineSteps.map(step => (
                      <span key={step.label} className={step.done ? "text-primary font-medium" : ""}>{step.label}</span>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Erstellt</span>
                      <span>{format(new Date(decision.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Letztes Update</span>
                      <span>{format(new Date(decision.updated_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                    </div>
                    {decision.due_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fällig</span>
                        <span className={slaRemaining?.overdue ? "text-destructive font-medium" : ""}>
                          {format(new Date(decision.due_date), "dd.MM.yyyy", { locale: de })}
                        </span>
                      </div>
                    )}
                    {decision.implemented_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Umgesetzt</span>
                        <span className="text-success">{format(new Date(decision.implemented_at), "dd.MM.yyyy", { locale: de })}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Laufzeit</span>
                      <span className="font-semibold number-highlight">{differenceInDays(new Date(), new Date(decision.created_at))}d</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Remaining tabs */}
        <TabsContent value="discussion"><DiscussionPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="review"><ReviewPanel decision={decision} onUpdated={invalidate} /></TabsContent>
        <TabsContent value="ai"><AiAnalysisPanel decision={decision} onUpdated={invalidate} /></TabsContent>
        <TabsContent value="alignment"><StakeholderAlignmentPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="whatif"><WhatIfSimulatorPanel decision={decision} /></TabsContent>
        <TabsContent value="dependencies"><DependenciesPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="impact"><ImpactTrackerPanel decision={decision} onUpdated={invalidate} /></TabsContent>
        <TabsContent value="pir"><PostImplementationReview decision={decision} onCompleted={invalidate} /></TabsContent>
        <TabsContent value="copilot"><CoPilotPanel decision={decision} /></TabsContent>
        <TabsContent value="strategy"><StrategyLinkPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="versions"><VersionHistoryPanel decisionId={decision.id} currentDecision={decision} /></TabsContent>
        <TabsContent value="audit"><AuditTrailPanel decisionId={decision.id} /></TabsContent>
      </Tabs>

      {/* ═══ HELP MODAL ═══ */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Hilfe — Decision Detail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Lifecycle</h4>
              <p className="text-muted-foreground">Entwurf → Review → Genehmigt → Umgesetzt. Nutze die Buttons in der Header-Leiste für schnelle Statuswechsel.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Risk Score</h4>
              <p className="text-muted-foreground">KI-basiert, 0–100%. Berücksichtigt Kategorie, Kontext, Stakeholder-Alignment und historische Muster.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Alignment Score</h4>
              <p className="text-muted-foreground">Durchschnitt der Impact-Gewichte verknüpfter strategischer Ziele. Über den Strategie-Tab verknüpfbar.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">SLA-Timer</h4>
              <p className="text-muted-foreground">Countdown bis zum Fälligkeitsdatum. Überfällige Entscheidungen werden rot markiert und können eskaliert werden.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isOwner && (
        <>
          <EditDecisionDialog decision={decision} open={showEdit} onOpenChange={setShowEdit} onUpdated={() => { invalidate(); }} />
          <DeleteDecisionDialog decision={decision} open={showDelete} onOpenChange={setShowDelete} onDeleted={() => { invalidate(); navigate("/decisions"); }} />
        </>
      )}
    </AppLayout>
  );
};

export default DecisionDetail;
