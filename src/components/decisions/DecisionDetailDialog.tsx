import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDependencies } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRiskDecisionLinks } from "@/hooks/useRisks";
import DiscussionPanel from "./DiscussionPanel";
import ReviewPanel from "./ReviewPanel";
import AiAnalysisPanel from "./AiAnalysisPanel";
import AuditTrailPanel from "./AuditTrailPanel";
import ImpactTrackerPanel from "./ImpactTrackerPanel";
import StakeholderAlignmentPanel from "./StakeholderAlignmentPanel";
import WhatIfSimulatorPanel from "./WhatIfSimulatorPanel";
import DependenciesPanel from "./DependenciesPanel";
import CoPilotPanel from "./CoPilotPanel";
import StrategyLinkPanel from "./StrategyLinkPanel";
import EditDecisionDialog from "./EditDecisionDialog";
import DeleteDecisionDialog from "./DeleteDecisionDialog";
import ShareDecisionDialog from "./ShareDecisionDialog";
import ChangeReasonDialog from "@/components/audit/ChangeReasonDialog";
import SignatureConfirmDialog from "@/components/audit/SignatureConfirmDialog";
import { MessageSquare, GitPullRequest, Brain, History, Target, Users, GitBranch, Link2, Compass, Crosshair, Pencil, Trash2, AlertCircle, CheckSquare, Share2, Shield, FileText, AlertTriangle, Lock, DollarSign } from "lucide-react";
import LiveCodCounter from "@/components/shared/LiveCodCounter";
import { decisionTemplates } from "@/lib/decisionTemplates";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { EventTypes } from "@/lib/eventTaxonomy";
import { useTranslation } from "react-i18next";
import { useTranslatedLabels } from "@/lib/labels";

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const statusOptions = ["draft", "proposed", "review", "approved", "rejected", "implemented", "cancelled", "superseded", "archived"] as const;

const DecisionDetailDialog = ({ decision, open, onOpenChange, onUpdated }: Props) => {
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const { user } = useAuth();
  const { data: allDeps = [] } = useDependencies();
  const { data: allTasks = [] } = useTasks();
  const { data: riskDecLinks = [] } = useRiskDecisionLinks();
  const [status, setStatus] = useState(decision?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [activeTab, setActiveTab] = useState("discussion");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pendingReason, setPendingReason] = useState("");

  // Count open tasks linked to this decision
  const openLinkedTasks = useMemo(() => {
    if (!decision) return 0;
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    let count = 0;
    allDeps.forEach(dep => {
      if (dep.source_decision_id === decision.id && dep.target_task_id) {
        const task = taskMap.get(dep.target_task_id);
        if (task && task.status !== "done") count++;
      }
      if (dep.target_decision_id === decision.id && dep.source_task_id) {
        const task = taskMap.get(dep.source_task_id);
        if (task && task.status !== "done") count++;
      }
    });
    return count;
  }, [decision, allDeps, allTasks]);

  useEffect(() => {
    if (decision) setStatus(decision.status);
  }, [decision]);

  // Reset to first tab when opening
  useEffect(() => {
    if (open) setActiveTab("discussion");
  }, [open]);

  if (!decision) return null;

  const CRITICAL_STATUSES = new Set(["approved", "implemented", "rejected"]);

  const initiateStatusChange = (newStatus: string) => {
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
    const updates: Record<string, any> = { status: newStatus as any };
    if (newStatus === "archived") updates.archived_at = new Date().toISOString();
    if (newStatus !== "archived" && oldStatus === "archived") updates.archived_at = null;
    if (newStatus === "implemented") updates.implemented_at = new Date().toISOString();
    if (newStatus === "cancelled") updates.cancelled_at = new Date().toISOString();
    const { error } = await supabase
      .from("decisions")
      .update(updates)
      .eq("id", decision.id);
    if (!error) {
      setStatus(newStatus);
      const auditEntry = {
        decision_id: decision.id,
        user_id: user!.id,
        action: newStatus === "archived" ? EventTypes.DECISION_ARCHIVED : EventTypes.DECISION_STATUS_CHANGED,
        field_name: "status",
        old_value: oldStatus,
        new_value: newStatus,
        change_reason: reason,
        signed_by: signatureMethod ? user!.id : undefined,
        signed_at: signatureMethod ? new Date().toISOString() : undefined,
        signature_method: signatureMethod || undefined,
      };
      await supabase.from("audit_logs").insert(auditEntry);
      onUpdated();
    }
    setPendingStatus(null);
    setPendingReason("");
    setSaving(false);
  };

  const isOwner = user?.id === decision.created_by;

  const handleTemplateUpgrade = async () => {
    const currentTpl = decisionTemplates.find(t => t.name === decision.template_used);
    if (!currentTpl || !user) return;

    setUpgrading(true);
    const newSnapshot = {
      name: currentTpl.name,
      version: currentTpl.version,
      category: currentTpl.category,
      priority: currentTpl.priority,
      requiredFields: currentTpl.requiredFields.map(f => ({ key: f.key, label: f.label, type: f.type })),
      approvalSteps: currentTpl.approvalSteps,
      governanceNotes: currentTpl.governanceNotes,
      defaultDurationDays: currentTpl.defaultDurationDays,
    };

    const { error } = await supabase
      .from("decisions")
      .update({
        template_version: currentTpl.version,
        template_snapshot: newSnapshot,
      } as any)
      .eq("id", decision.id);

    if (!error) {
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user.id,
        action: EventTypes.DECISION_TEMPLATE_UPGRADED,
        field_name: "template_version",
        old_value: String(decision.template_version || 0),
        new_value: String(currentTpl.version),
      });
      toast.success(t("decisions.detail.templateUpgraded", { version: currentTpl.version }));
      onUpdated();
    } else {
      toast.error(t("decisions.detail.upgradeFailed"));
    }
    setUpgrading(false);
  };

  // Group tabs into categories for cleaner navigation
  const tabGroups = [
    {
      label: t("decisions.detail.core"),
      tabs: [
        { value: "discussion", icon: MessageSquare, label: t("decisions.detail.discussion") },
        { value: "review", icon: GitPullRequest, label: t("decisions.detail.review") },
        { value: "ai", icon: Brain, label: t("decisions.detail.aiAnalysis") },
      ],
    },
    {
      label: t("decisions.detail.intelligence"),
      tabs: [
        { value: "alignment", icon: Users, label: t("decisions.detail.alignment") },
        { value: "whatif", icon: GitBranch, label: t("decisions.detail.whatIf") },
        { value: "dependencies", icon: Link2, label: t("decisions.detail.graph") },
        { value: "impact", icon: Target, label: t("decisions.detail.impact") },
      ],
    },
    {
      label: t("decisions.detail.strategy"),
      tabs: [
        { value: "copilot", icon: Compass, label: t("decisions.detail.coPilot") },
        { value: "strategy", icon: Crosshair, label: t("decisions.detail.strategyTab") },
        { value: "audit", icon: History, label: t("decisions.detail.history") },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-display text-xl">{decision.title}</DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              {isOwner && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowShare(true)} title={t("decisions.detail.shareWithTeams")}>
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEdit(true)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground flex-1">{decision.description || t("decisions.detail.noDesc")}</p>
            {decision.confidential && (
              <Badge variant="outline" className="text-[10px] gap-1 border-destructive/30 text-destructive bg-destructive/5">
                <Lock className="w-3 h-3" /> {t("decisions.detail.confidential")}
              </Badge>
            )}
            {decision.outcome_type && (
              <Badge variant="outline" className={`text-[10px] gap-1 ${
                decision.outcome_type === "successful" ? "border-success/30 text-success bg-success/5" :
                decision.outcome_type === "partial" ? "border-warning/30 text-warning bg-warning/5" :
                "border-destructive/30 text-destructive bg-destructive/5"
              }`}>
                {decision.outcome_type === "successful" ? t("decisions.detail.outcomeSuccess") :
                 decision.outcome_type === "partial" ? t("decisions.detail.outcomePartial") : t("decisions.detail.outcomeFailed")}
              </Badge>
            )}
          </div>
          {/* Template version info */}
          {decision.template_used && (() => {
            const currentTpl = decisionTemplates.find(t => t.name === decision.template_used);
            const savedVersion = decision.template_version || null;
            const currentVersion = currentTpl?.version || null;
            const isOutdated = savedVersion && currentVersion && savedVersion < currentVersion;
            return (
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px] gap-1">
                  <FileText className="w-3 h-3" /> {decision.template_used}
                  {savedVersion && <span className="text-muted-foreground">v{savedVersion}</span>}
                </Badge>
                {isOutdated && isOwner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 text-[10px] gap-1 border-warning/40 text-warning hover:bg-warning/10 px-2"
                        onClick={handleTemplateUpgrade}
                        disabled={upgrading}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {upgrading ? t("decisions.detail.upgrading") : t("decisions.detail.upgradeToV", { version: currentVersion })}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-56">
                      {t("decisions.detail.upgradeTooltip", { version: currentVersion })}
                    </TooltipContent>
                  </Tooltip>
                )}
                {isOutdated && !isOwner && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-warning/40 text-warning">
                    <AlertTriangle className="w-3 h-3" /> {t("decisions.detail.versionAvailable", { version: currentVersion })}
                  </Badge>
                )}
              </div>
            );
          })()}
          {(() => {
            const rc = riskDecLinks.filter(l => l.decision_id === decision.id).length;
            return rc > 0 ? (
              <div className="flex items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20">
                  <Shield className="w-3 h-3" /> {rc > 1 ? t("decisions.detail.risksLinked", { count: rc }) : t("decisions.detail.riskLinked", { count: rc })}
                </Badge>
              </div>
            ) : null;
          })()}
        </DialogHeader>

        {openLinkedTasks > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mt-2">
            <AlertCircle className="w-4 h-4 text-warning shrink-0" />
            <p className="text-xs text-warning">
              {t("decisions.detail.openTasksWarning", { count: openLinkedTasks })}
            </p>
          </div>
        )}

        {/* Live Cost-of-Delay counter — only for open decisions with cost_per_day */}
        {decision.cost_per_day > 0 && !["implemented", "rejected", "archived", "cancelled"].includes(status) && (() => {
          const dailyCost = decision.cost_per_day;
          const costPerSecond = dailyCost / 86400;
          const daysOpen = (Date.now() - new Date(decision.created_at).getTime()) / (1000 * 60 * 60 * 24);
          const baseCost = Math.round(daysOpen * dailyCost);
          return (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/15 mt-2">
              <DollarSign className="w-4 h-4 text-destructive shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t("cod.totalDelayCost", "Verzögerungskosten")}:</span>
                <LiveCodCounter
                  baseCost={baseCost}
                  costPerSecond={costPerSecond}
                  createdAt={decision.created_at}
                  size="md"
                  dailyCost={dailyCost}
                />
              </div>
            </div>
          );
        })()}

        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-xs text-muted-foreground">{t("decisions.statusLabel")}:</span>
          {statusOptions.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              className="text-xs h-7"
              disabled={saving || (!isOwner && s !== "approved" && s !== "rejected")}
              onClick={() => initiateStatusChange(s)}
            >
              {tl.statusLabels[s]}
            </Button>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          {/* Grouped tab navigation */}
          <div className="space-y-2 mb-4">
            {tabGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-1 px-1">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        activeTab === tab.value
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <TabsContent value="discussion"><DiscussionPanel decisionId={decision.id} /></TabsContent>
          <TabsContent value="review"><ReviewPanel decision={decision} onUpdated={onUpdated} /></TabsContent>
          <TabsContent value="ai"><AiAnalysisPanel decision={decision} onUpdated={onUpdated} /></TabsContent>
          <TabsContent value="alignment"><StakeholderAlignmentPanel decisionId={decision.id} /></TabsContent>
          <TabsContent value="whatif"><WhatIfSimulatorPanel decision={decision} /></TabsContent>
          <TabsContent value="dependencies"><DependenciesPanel decisionId={decision.id} /></TabsContent>
          <TabsContent value="impact"><ImpactTrackerPanel decision={decision} onUpdated={onUpdated} /></TabsContent>
          <TabsContent value="copilot"><CoPilotPanel decision={decision} /></TabsContent>
          <TabsContent value="strategy"><StrategyLinkPanel decisionId={decision.id} /></TabsContent>
          <TabsContent value="audit"><AuditTrailPanel decisionId={decision.id} /></TabsContent>
        </Tabs>

        {isOwner && (
          <>
            <EditDecisionDialog decision={decision} open={showEdit} onOpenChange={setShowEdit} onUpdated={() => { onUpdated(); onOpenChange(false); }} />
            <DeleteDecisionDialog decision={decision} open={showDelete} onOpenChange={setShowDelete} onDeleted={() => { onUpdated(); onOpenChange(false); }} />
            <ShareDecisionDialog decisionId={decision.id} decisionTeamId={decision.team_id} open={showShare} onOpenChange={setShowShare} />
          </>
        )}

        <ChangeReasonDialog
          open={showReasonDialog}
          onOpenChange={(v) => { setShowReasonDialog(v); if (!v) setPendingStatus(null); }}
          title={t("audit.reasonTitle")}
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
      </DialogContent>
    </Dialog>
  );
};

export default DecisionDetailDialog;
