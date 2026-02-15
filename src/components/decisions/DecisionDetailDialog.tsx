import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { MessageSquare, GitPullRequest, Brain, History, Target, Users, GitBranch, Link2, Compass, Crosshair, Pencil, Trash2 } from "lucide-react";

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const statusOptions = ["draft", "review", "approved", "implemented", "rejected"] as const;

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  review: "Review",
  approved: "Genehmigt",
  implemented: "Umgesetzt",
  rejected: "Abgelehnt",
};

const DecisionDetailDialog = ({ decision, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(decision?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("discussion");

  useEffect(() => {
    if (decision) setStatus(decision.status);
  }, [decision]);

  // Reset to first tab when opening
  useEffect(() => {
    if (open) setActiveTab("discussion");
  }, [open]);

  if (!decision) return null;

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const oldStatus = status;
    const { error } = await supabase
      .from("decisions")
      .update({ status: newStatus as any })
      .eq("id", decision.id);
    if (!error) {
      setStatus(newStatus);
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user!.id,
        action: "status_changed",
        field_name: "status",
        old_value: oldStatus,
        new_value: newStatus,
      });
      onUpdated();
    }
    setSaving(false);
  };

  const isOwner = user?.id === decision.created_by;

  // Group tabs into categories for cleaner navigation
  const tabGroups = [
    {
      label: "Kern",
      tabs: [
        { value: "discussion", icon: MessageSquare, label: "Diskussion" },
        { value: "review", icon: GitPullRequest, label: "Review" },
        { value: "ai", icon: Brain, label: "KI-Analyse" },
      ],
    },
    {
      label: "Intelligence",
      tabs: [
        { value: "alignment", icon: Users, label: "Alignment" },
        { value: "whatif", icon: GitBranch, label: "What-If" },
        { value: "dependencies", icon: Link2, label: "Graph" },
        { value: "impact", icon: Target, label: "Impact" },
      ],
    },
    {
      label: "Strategie",
      tabs: [
        { value: "copilot", icon: Compass, label: "Co-Pilot" },
        { value: "strategy", icon: Crosshair, label: "Strategie" },
        { value: "audit", icon: History, label: "Historie" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-display text-xl">{decision.title}</DialogTitle>
            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{decision.description || "Keine Beschreibung"}</p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {statusOptions.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              className="text-xs h-7"
              disabled={saving || (!isOwner && s !== "approved" && s !== "rejected")}
              onClick={() => handleStatusChange(s)}
            >
              {statusLabels[s]}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DecisionDetailDialog;
