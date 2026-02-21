import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DecisionCategory = Database["public"]["Enums"]["decision_category"];
type DecisionPriority = Database["public"]["Enums"]["decision_priority"];

interface Props {
  decision: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const CATEGORY_OPTIONS: { value: DecisionCategory; label: string }[] = [
  { value: "strategic", label: "Strategisch" },
  { value: "budget", label: "Budget" },
  { value: "hr", label: "Personal" },
  { value: "technical", label: "Technisch" },
  { value: "operational", label: "Operativ" },
  { value: "marketing", label: "Marketing" },
];

const PRIORITY_OPTIONS: { value: DecisionPriority; label: string }[] = [
  { value: "low", label: "Niedrig" },
  { value: "medium", label: "Mittel" },
  { value: "high", label: "Hoch" },
  { value: "critical", label: "Kritisch" },
];

const EditDecisionDialog = ({ decision, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<DecisionCategory>("operational");
  const [priority, setPriority] = useState<DecisionPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [changeReason, setChangeReason] = useState("");

  useEffect(() => {
    if (decision) {
      setTitle(decision.title || "");
      setDescription(decision.description || "");
      setContext(decision.context || "");
      setCategory(decision.category || "operational");
      setPriority(decision.priority || "medium");
      setDueDate(decision.due_date || "");
      setChangeReason("");
    }
  }, [decision]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Titel ist erforderlich");
      return;
    }
    if (!changeReason.trim()) {
      toast.error("Bitte gib eine Änderungsbegründung an");
      return;
    }
    setSaving(true);

    // 1. Determine next version number
    const { data: existingVersions } = await supabase
      .from("decision_versions")
      .select("version_number")
      .eq("decision_id", decision.id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1;

    // 2. Snapshot current state BEFORE updating
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

    // 3. Update the decision
    const { error } = await supabase
      .from("decisions")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        context: context.trim() || null,
        category,
        priority,
        due_date: dueDate || null,
      })
      .eq("id", decision.id);

    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      // Audit log with standardized event
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
      toast.success(`Entscheidung aktualisiert (Version ${nextVersion + 1})`);
      onUpdated();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Entscheidung bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Titel</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Beschreibung</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Kontext</label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Kategorie</label>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Priorität</label>
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
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Fälligkeitsdatum</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="border-t border-border pt-4">
            <label className="text-xs font-medium text-foreground mb-1 block">Änderungsbegründung *</label>
            <Textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              rows={2}
              placeholder="Warum wird diese Änderung vorgenommen?"
              className="border-primary/30 focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Wird in der Versionshistorie dokumentiert (Governance-Pflicht).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={saving || !changeReason.trim()}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDecisionDialog;
