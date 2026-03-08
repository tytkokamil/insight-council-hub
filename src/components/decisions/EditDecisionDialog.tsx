import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Crown } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";

type DecisionCategory = Database["public"]["Enums"]["decision_category"];
type DecisionPriority = Database["public"]["Enums"]["decision_priority"];

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const EditDecisionDialog = ({ decision, open, onOpenChange, onUpdated }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<DecisionCategory>("operational");
  const [priority, setPriority] = useState<DecisionPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [confidentialViewerIds, setConfidentialViewerIds] = useState<string[]>([]);

  const CATEGORY_OPTIONS: { value: DecisionCategory; label: string }[] = [
    { value: "strategic", label: t("decisions.edit.strategic") },
    { value: "budget", label: t("decisions.edit.budget") },
    { value: "hr", label: t("decisions.edit.hr") },
    { value: "technical", label: t("decisions.edit.technical") },
    { value: "operational", label: t("decisions.edit.operational") },
    { value: "marketing", label: t("decisions.edit.marketing") },
  ];

  const PRIORITY_OPTIONS: { value: DecisionPriority; label: string }[] = [
    { value: "low", label: t("decisions.edit.low") },
    { value: "medium", label: t("decisions.edit.medium") },
    { value: "high", label: t("decisions.edit.high") },
    { value: "critical", label: t("decisions.edit.critical") },
  ];

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (decision) {
      setTitle(decision.title || "");
      setDescription(decision.description || "");
      setContext(decision.context || "");
      setCategory(decision.category || "operational");
      setPriority(decision.priority || "medium");
      setDueDate(decision.due_date || "");
      setConfidential(decision.confidential || false);
      setConfidentialViewerIds(decision.confidential_viewer_ids || []);
      setOwnerId(decision.owner_id || decision.created_by || "");
      setChangeReason("");
    }
  }, [decision]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t("decisions.edit.titleRequired"));
      return;
    }
    if (!changeReason.trim()) {
      toast.error(t("decisions.edit.reasonRequired"));
      return;
    }
    setSaving(true);

    const { data: existingVersions } = await supabase
      .from("decision_versions")
      .select("version_number")
      .eq("decision_id", decision.id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1;

    const snapshot = {
      title: decision.title,
      description: decision.description,
      context: decision.context,
      category: decision.category,
      priority: decision.priority,
      due_date: decision.due_date,
      status: decision.status,
    };

    await supabase.from("decision_versions").insert({
      decision_id: decision.id,
      version_number: nextVersion,
      snapshot,
      change_reason: changeReason.trim(),
      created_by: user!.id,
    });

    const { error } = await supabase
      .from("decisions")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        context: context.trim() || null,
        category,
        priority,
        due_date: dueDate || null,
        confidential,
        confidential_viewer_ids: confidential ? confidentialViewerIds : [],
        owner_id: ownerId || undefined,
      } as any)
      .eq("id", decision.id);

    if (error) {
      toast.error(t("decisions.edit.saveError"));
    } else {
      const { EventTypes } = await import("@/lib/eventTaxonomy");
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user!.id,
        action: EventTypes.DECISION_UPDATED,
        field_name: "multiple",
        old_value: `v${nextVersion}`,
        new_value: changeReason.trim(),
      });
      qc.invalidateQueries({ queryKey: ["decision-versions", decision.id] });
      toast.success(t("decisions.edit.updated", { version: nextVersion + 1 }));
      onUpdated();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">{t("decisions.edit.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="form-label">{t("decisions.edit.titleLabel")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">{t("decisions.edit.descriptionLabel")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="form-input" />
          </div>
          <div>
            <label className="form-label">{t("decisions.edit.contextLabel")}</label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{t("decisions.edit.categoryLabel")}</label>
              <Select value={category} onValueChange={(v) => setCategory(v as DecisionCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="form-label">{t("decisions.edit.priorityLabel")}</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as DecisionPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="form-label">{t("decisions.edit.dueDateLabel")}</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-warning" /> {t("decisions.edit.ownerLabel")}
            </label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger><SelectValue placeholder={t("decisions.edit.ownerPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">{t("decisions.edit.ownerHint")}</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">{t("decisions.edit.confidentialTitle")}</p>
                <p className="text-[10px] text-muted-foreground">{t("decisions.edit.confidentialDesc")}</p>
              </div>
            </div>
            <Switch checked={confidential} onCheckedChange={setConfidential} />
          </div>
          {confidential && (
            <div className="space-y-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning">{t("decisions.confidentialWarning")}</p>
              </div>
              <label className="text-xs font-medium text-muted-foreground">{t("decisions.confidentialViewers")}</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {profiles.map(p => {
                  const isSelected = confidentialViewerIds.includes(p.user_id);
                  return (
                    <button
                      key={p.user_id}
                      type="button"
                      onClick={() => setConfidentialViewerIds(prev =>
                        isSelected ? prev.filter(id => id !== p.user_id) : [...prev, p.user_id]
                      )}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        isSelected
                          ? "bg-primary/15 border-primary/30 text-primary font-medium"
                          : "bg-muted/30 border-border text-muted-foreground hover:border-primary/20"
                      }`}
                    >
                      {p.full_name || p.user_id.slice(0, 8)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">{t("decisions.confidentialAdminNote")}</p>
            </div>
          )}
          <div className="border-t border-border pt-4">
            <label className="form-label text-foreground">{t("decisions.edit.changeReasonLabel")}</label>
            <Textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              rows={2}
              placeholder={t("decisions.edit.changeReasonPlaceholder")}
              className="border-primary/30 focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {t("decisions.edit.changeReasonHint")}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="press-scale">{t("decisions.edit.cancel")}</Button>
          <Button onClick={handleSave} disabled={saving || !changeReason.trim()} className="press-scale">
            {saving ? t("decisions.edit.saving") : t("decisions.edit.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDecisionDialog;
