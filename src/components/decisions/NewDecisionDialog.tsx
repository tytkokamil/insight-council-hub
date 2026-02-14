import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { decisionTemplates } from "@/lib/decisionTemplates";
import { FileText, Users } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;

const NewDecisionDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("operational");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);

  useEffect(() => {
    if (open) {
      supabase.from("teams").select("id, name").order("name").then(({ data }) => {
        if (data) setTeams(data);
      });
    }
  }, [open]);

  const applyTemplate = (t: typeof decisionTemplates[0]) => {
    setTitle(t.name);
    setDescription(t.description);
    setCategory(t.category);
    setPriority(t.priority);
    const due = new Date();
    due.setDate(due.getDate() + t.defaultDurationDays);
    setDueDate(due.toISOString().split("T")[0]);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase.from("decisions").insert([{
      title: title.trim(),
      description: description.trim() || null,
      category: category as any,
      priority: priority as any,
      due_date: dueDate || null,
      team_id: teamId || null,
      created_by: user.id,
    }]).select().single();

    if (err) {
      setError(err.message);
    } else {
      // Audit log
      if (data) {
        await supabase.from("audit_logs").insert({
          decision_id: data.id,
          user_id: user.id,
          action: "created",
          new_value: title.trim(),
        });
      }
      setTitle("");
      setDescription("");
      setCategory("operational");
      setPriority("medium");
      setDueDate("");
      setTeamId("");
      setShowTemplates(true);
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
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
                  <div>
                    <p className="text-xs font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t.category}</p>
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
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {categories.map((c) => (<option key={c} value={c} className="bg-card">{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Priorität</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="glass" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" variant="hero" disabled={loading || !title.trim()}>{loading ? "Erstellen..." : "Erstellen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDecisionDialog;
