import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setLoading(true);
    setError("");

    const { error: err } = await supabase.from("decisions").insert([{
      title: title.trim(),
      description: description.trim() || null,
      category: category as any,
      priority: priority as any,
      due_date: dueDate || null,
      created_by: user.id,
    }]);

    if (err) {
      setError(err.message);
    } else {
      setTitle("");
      setDescription("");
      setCategory("operational");
      setPriority("medium");
      setDueDate("");
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
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Fälligkeitsdatum</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
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
