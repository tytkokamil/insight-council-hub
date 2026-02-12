import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Trash2, User } from "lucide-react";

interface Props {
  team: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const ManageTeamDialog = ({ team, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    if (!team) return;
    const { data } = await supabase
      .from("team_members")
      .select("*, profiles!team_members_user_id_fkey(full_name)")
      .eq("team_id", team.id);
    if (data) setMembers(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name");
    if (data) setAllProfiles(data);
  };

  useEffect(() => {
    if (open && team) {
      fetchMembers();
      fetchProfiles();
    }
  }, [open, team]);

  const addMember = async () => {
    if (!selectedUser || !team) return;
    setLoading(true);
    await supabase.from("team_members").insert({ team_id: team.id, user_id: selectedUser });
    setSelectedUser("");
    await fetchMembers();
    onUpdated();
    setLoading(false);
  };

  const removeMember = async (memberId: string) => {
    setLoading(true);
    await supabase.from("team_members").delete().eq("id", memberId);
    await fetchMembers();
    onUpdated();
    setLoading(false);
  };

  if (!team) return null;

  const availableProfiles = allProfiles.filter(
    (p) => !members.some((m) => m.user_id === p.user_id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{team.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{team.description || "Keine Beschreibung"}</p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <h3 className="text-sm font-medium">Mitglieder ({members.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1">{m.profiles?.full_name || "Unbekannt"}</span>
                {m.user_id !== user?.id && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeMember(m.id)} disabled={loading}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
            >
              <option value="">Mitglied hinzufügen...</option>
              {availableProfiles.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id}</option>
              ))}
            </select>
            <Button size="sm" onClick={addMember} disabled={!selectedUser || loading}>
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTeamDialog;
