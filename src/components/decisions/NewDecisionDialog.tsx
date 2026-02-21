import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { decisionTemplates, getTemplateByCategory, type DecisionTemplate, type RequiredField } from "@/lib/decisionTemplates";
import { suggestReviewFlow, type ReviewFlowTemplate } from "@/lib/reviewFlowTemplates";
import ReviewFlowSelector from "./ReviewFlowSelector";
import { FileText, Users, Shield, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch", budget: "Budget", hr: "Personal",
  technical: "Technisch", operational: "Operativ", marketing: "Marketing",
};

const NewDecisionDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("operational");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState("");
  const [teamId, setTeamId] = useState<string>(selectedTeamId || "");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DecisionTemplate | null>(null);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reviewFlowId, setReviewFlowId] = useState<string>(() => suggestReviewFlow("operational", "medium"));
  const [selectedReviewFlow, setSelectedReviewFlow] = useState<ReviewFlowTemplate | null>(null);

  useEffect(() => {
    if (open && user) {
      setTeamId(selectedTeamId || "");
      const fetchTeams = async () => {
        const { data: roleData } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", user.id).single();
        const isAdmin = roleData?.role === "org_owner" || roleData?.role === "org_admin";
        if (isAdmin) {
          const { data } = await supabase.from("teams").select("id, name").order("name");
          if (data) setTeams(data);
        } else {
          const { data: memberTeams } = await supabase
            .from("team_members").select("team_id").eq("user_id", user.id);
          const ids = memberTeams?.map((t) => t.team_id) || [];
          if (ids.length > 0) {
            const { data } = await supabase.from("teams").select("id, name").in("id", ids).order("name");
            if (data) setTeams(data);
          } else {
            setTeams([]);
          }
        }
      };
      fetchTeams();
    }
  }, [open, selectedTeamId]);

  const applyTemplate = (t: DecisionTemplate) => {
    setTitle(t.name);
    setDescription(t.description);
    setCategory(t.category);
    setPriority(t.priority);
    const due = new Date();
    due.setDate(due.getDate() + t.defaultDurationDays);
    setDueDate(due.toISOString().split("T")[0]);
    setSelectedTemplate(t);
    setExtraFields({});
    setValidationErrors([]);
    setShowTemplates(false);
    // Auto-suggest review flow based on template
    const suggested = suggestReviewFlow(t.category, t.priority);
    setReviewFlowId(suggested);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const tpl = getTemplateByCategory(newCat);
    if (tpl && selectedTemplate?.category !== newCat) {
      setSelectedTemplate(tpl);
      setExtraFields({});
      setValidationErrors([]);
    }
    // Update review flow suggestion
    setReviewFlowId(suggestReviewFlow(newCat, priority));
  };

  const handlePriorityChange = (newPri: string) => {
    setPriority(newPri);
    setReviewFlowId(suggestReviewFlow(category, newPri));
  };

  const handleReviewFlowSelect = (flow: ReviewFlowTemplate) => {
    setReviewFlowId(flow.id);
    setSelectedReviewFlow(flow);
  };

  const validateRequiredFields = (): boolean => {
    if (!selectedTemplate) return true;
    const missing: string[] = [];
    selectedTemplate.requiredFields.forEach(f => {
      if (!extraFields[f.key]?.trim()) missing.push(f.label);
    });
    setValidationErrors(missing);
    return missing.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    if (!validateRequiredFields()) return;

    setLoading(true);
    setError("");

    // Build context from extra fields
    const contextParts: string[] = [];
    if (description.trim()) contextParts.push(description.trim());
    if (selectedTemplate) {
      selectedTemplate.requiredFields.forEach(f => {
        const val = extraFields[f.key]?.trim();
        if (val) contextParts.push(`**${f.label}:** ${val}`);
      });
      if (selectedTemplate.governanceNotes) {
        contextParts.push(`\n---\n_Governance: ${selectedTemplate.governanceNotes}_`);
      }
    }

    const { data, error: err } = await supabase.from("decisions").insert([{
      title: title.trim(),
      description: description.trim() || null,
      context: contextParts.length > 1 ? contextParts.join("\n\n") : null,
      category: category as any,
      priority: priority as any,
      due_date: dueDate || null,
      team_id: teamId || null,
      created_by: user.id,
    }]).select().single();

    if (err) {
      setError(err.message);
    } else {
      if (data) {
        await supabase.from("audit_logs").insert({
          decision_id: data.id,
          user_id: user.id,
          action: "created",
          new_value: title.trim(),
        });

        // Auto-create review steps from selected Review-Flow
        const { reviewFlowTemplates } = await import("@/lib/reviewFlowTemplates");
        const flow = reviewFlowTemplates.find(f => f.id === reviewFlowId);
        if (flow && flow.steps.length > 0) {
          const flowSteps = flow.steps;
          if (teamId) {
            const { data: members } = await supabase
              .from("team_members")
              .select("user_id")
              .eq("team_id", teamId)
              .neq("user_id", user.id);

            const availableMembers = members?.map(m => m.user_id) || [];

            const reviewSteps = flowSteps.map((step, i) => ({
              decision_id: data.id,
              reviewer_id: availableMembers.length > 0
                ? availableMembers[i % availableMembers.length]
                : user.id,
              step_order: i + 1,
              status: "review" as const,
            }));
            await supabase.from("decision_reviews").insert(reviewSteps);
          } else {
            const reviewSteps = flowSteps.map((step, i) => ({
              decision_id: data.id,
              reviewer_id: user.id,
              step_order: i + 1,
              status: "review" as const,
            }));
            await supabase.from("decision_reviews").insert(reviewSteps);
          }
        }
      }
      resetForm();
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("operational"); setPriority("medium");
    setDueDate(""); setTeamId(""); setShowTemplates(true); setSelectedTemplate(null);
    setExtraFields({}); setValidationErrors([]);
    setReviewFlowId(suggestReviewFlow("operational", "medium")); setSelectedReviewFlow(null);
  };

  const renderExtraField = (field: RequiredField) => {
    const hasError = validationErrors.includes(field.label);
    const baseClass = `w-full px-3 rounded-lg bg-muted/50 border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm ${hasError ? "border-destructive" : "border-border"}`;

    if (field.type === "textarea") {
      return (
        <textarea
          value={extraFields[field.key] || ""}
          onChange={(e) => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
          placeholder={field.placeholder}
          className={`${baseClass} h-20 resize-none py-2`}
        />
      );
    }
    if (field.type === "select" && field.options) {
      return (
        <select
          value={extraFields[field.key] || ""}
          onChange={(e) => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
          className={`${baseClass} h-10`}
        >
          <option value="" className="bg-card">Bitte wählen...</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value} className="bg-card">{o.label}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type="text"
        value={extraFields[field.key] || ""}
        onChange={(e) => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
        placeholder={field.placeholder}
        className={`${baseClass} h-10`}
      />
    );
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="glass-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Neue Entscheidung</DialogTitle>
        </DialogHeader>

        {showTemplates && !title && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground font-medium">Vorlage verwenden:</p>
            <div className="grid grid-cols-2 gap-2">
              {decisionTemplates.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t)}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground capitalize">{categoryLabels[t.category]}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{t.requiredFields.length} Pflichtfelder</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} className="text-xs text-primary hover:underline">
              Ohne Vorlage fortfahren →
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Titel *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entscheidungstitel..." className={inputClass} required />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Beschreibung</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details zur Entscheidung..." className={`${inputClass} h-24 resize-none py-2`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Kategorie</label>
              <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
                {categories.map((c) => (<option key={c} value={c} className="bg-card">{categoryLabels[c]}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Priorität</label>
              <select value={priority} onChange={(e) => handlePriorityChange(e.target.value)} className={inputClass}>
                {priorities.map((p) => (<option key={p} value={p} className="bg-card">{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Fälligkeitsdatum</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Team</span>
              </label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputClass}>
                <option value="" className="bg-card">Kein Team (öffentlich)</option>
                {teams.map((t) => (<option key={t.id} value={t.id} className="bg-card">{t.name}</option>))}
              </select>
            </div>
          </div>

          {/* Review-Flow Selector */}
          <ReviewFlowSelector
            selectedFlowId={reviewFlowId}
            onSelect={handleReviewFlowSelect}
            category={category}
            priority={priority}
          />

          {/* Required fields from template */}
          {selectedTemplate && selectedTemplate.requiredFields.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Pflichtfelder – {categoryLabels[selectedTemplate.category]}</span>
                <Badge variant="outline" className="text-[10px]">{selectedTemplate.requiredFields.length} Felder</Badge>
              </div>
              {selectedTemplate.requiredFields.map(field => (
                <div key={field.key}>
                  <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    {field.label} <span className="text-destructive">*</span>
                  </label>
                  {renderExtraField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Governance notes from template */}
          {selectedTemplate?.governanceNotes && (
            <p className="text-[11px] text-muted-foreground italic p-2 rounded-lg bg-warning/5 border border-warning/20">
              {selectedTemplate.governanceNotes}
            </p>
          )}

          {validationErrors.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Pflichtfelder nicht ausgefüllt:</p>
                <ul className="mt-1 space-y-0.5">
                  {validationErrors.map(e => <li key={e}>• {e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>Abbrechen</Button>
            <Button type="submit" disabled={loading || !title.trim()}>{loading ? "Erstellen..." : "Erstellen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDecisionDialog;
