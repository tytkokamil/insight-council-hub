import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Trash2, User, Mail, Clock, Check, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import TeamChat from "./TeamChat";

interface Props {
  team: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const ManageTeamDialog = ({ team, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    if (!team) return;
    const { data } = await supabase
      .from("team_members")
      .select("*, profiles!team_members_user_id_fkey(full_name)")
      .eq("team_id", team.id);
    if (data) setMembers(data);
  };

  const fetchInvites = async () => {
    if (!team) return;
    const { data } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("team_id", team.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setPendingInvites(data);
  };

  useEffect(() => {
    if (open && team) {
      fetchMembers();
      fetchInvites();
    }
  }, [open, team]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !team) return;
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-team-invite", {
        body: { email: inviteEmail.trim().toLowerCase(), teamId: team.id, teamName: team.name },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Hinweis", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Einladung gesendet", description: data?.message || `Einladung an ${inviteEmail} gesendet` });
        setInviteEmail("");
        await fetchMembers();
        await fetchInvites();
        onUpdated();
      }
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    setLoading(true);
    await supabase.from("team_members").delete().eq("id", memberId);
    await fetchMembers();
    onUpdated();
    setLoading(false);
  };

  const cancelInvite = async (inviteId: string) => {
    await supabase.from("team_invitations").delete().eq("id", inviteId);
    await fetchInvites();
  };

  if (!team) return null;

  const inputClass = "w-full h-9 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{team.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{team.description || "Keine Beschreibung"}</p>
        </DialogHeader>

        <Tabs defaultValue="members" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1 gap-1.5">
              <User className="w-3.5 h-3.5" /> Mitglieder
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <div className="space-y-4">
              {/* Invite by email */}
              <form onSubmit={sendInvite} className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Per E-Mail einladen
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@beispiel.de"
                    className={inputClass}
                    required
                  />
                  <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? "..." : <UserPlus className="w-4 h-4" />}
                  </Button>
                </div>
              </form>

              {/* Pending invitations */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Ausstehende Einladungen ({pendingInvites.length})
                  </h3>
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-dashed border-border">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{inv.email}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => cancelInvite(inv.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Current members */}
              <div className="space-y-2 border-t border-border pt-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  Mitglieder ({members.length})
                </h3>
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <TeamChat teamId={team.id} teamName={team.name} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTeamDialog;
