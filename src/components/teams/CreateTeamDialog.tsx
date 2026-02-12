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

const CreateTeamDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase
      .from("teams")
      .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id })
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      // Add creator as team member
      await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id });
      setName("");
      setDescription("");
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Neues Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Teamname *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Produktteam" className={inputClass} required />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Beschreibung</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Worum geht es in diesem Team?" className={`${inputClass} h-20 resize-none py-2`} />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="glass" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" variant="hero" disabled={loading || !name.trim()}>{loading ? "Erstellen..." : "Erstellen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;
