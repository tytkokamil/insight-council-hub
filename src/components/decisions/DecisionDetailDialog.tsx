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
import { MessageSquare, GitPullRequest, Brain, History, Target } from "lucide-react";

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const statusOptions = ["draft", "review", "approved", "implemented", "rejected"] as const;

const DecisionDetailDialog = ({ decision, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(decision?.status || "draft");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (decision) setStatus(decision.status);
  }, [decision]);

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
      // Audit log
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{decision.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{decision.description || "Keine Beschreibung"}</p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {statusOptions.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              className="text-xs capitalize h-7"
              disabled={saving || (!isOwner && s !== "approved" && s !== "rejected")}
              onClick={() => handleStatusChange(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="discussion" className="mt-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="discussion" className="text-xs gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Diskussion
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs gap-1">
              <GitPullRequest className="w-3.5 h-3.5" /> Review
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs gap-1">
              <Brain className="w-3.5 h-3.5" /> KI-Analyse
            </TabsTrigger>
            <TabsTrigger value="impact" className="text-xs gap-1">
              <Target className="w-3.5 h-3.5" /> Impact
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs gap-1">
              <History className="w-3.5 h-3.5" /> Historie
            </TabsTrigger>
          </TabsList>
          <TabsContent value="discussion">
            <DiscussionPanel decisionId={decision.id} />
          </TabsContent>
          <TabsContent value="review">
            <ReviewPanel decision={decision} onUpdated={onUpdated} />
          </TabsContent>
          <TabsContent value="ai">
            <AiAnalysisPanel decision={decision} onUpdated={onUpdated} />
          </TabsContent>
          <TabsContent value="impact">
            <ImpactTrackerPanel decision={decision} onUpdated={onUpdated} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTrailPanel decisionId={decision.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionDetailDialog;
