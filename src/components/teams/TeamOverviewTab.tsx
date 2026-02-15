import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/shared/UserAvatar";
import { UserPlus, Trash2, Mail, Clock, Check, Users } from "lucide-react";
import { toast } from "sonner";

interface Props {
  teamId: string;
  teamName: string;
}

const TeamOverviewTab = ({ teamId, teamName }: Props) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [decisionCount, setDecisionCount] = useState(0);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("*, profiles!team_members_user_id_fkey(full_name, avatar_url)")
      .eq("team_id", teamId);
    if (data) setMembers(data);
  };

  const fetchInvites = async () => {
    const { data } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setPendingInvites(data);
  };

  const fetchStats = async () => {
    const { count } = await supabase
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);
    setDecisionCount(count || 0);
  };

  useEffect(() => {
    fetchMembers();
    fetchInvites();
    fetchStats();
  }, [teamId]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-team-invite", {
        body: { email: inviteEmail.trim().toLowerCase(), teamId, teamName },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data?.message || `Einladung an ${inviteEmail} gesendet`);
        setInviteEmail("");
        await fetchMembers();
        await fetchInvites();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    await supabase.from("team_members").delete().eq("id", memberId);
    await fetchMembers();
    toast.success("Mitglied entfernt");
  };

  const cancelInvite = async (inviteId: string) => {
    await supabase.from("team_invitations").delete().eq("id", inviteId);
    await fetchInvites();
    toast.success("Einladung zurückgezogen");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
          <Users className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold font-display">{members.length}</p>
          <p className="text-[10px] text-muted-foreground">Mitglieder</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
          <Clock className="w-5 h-5 mx-auto text-warning mb-1" />
          <p className="text-2xl font-bold font-display">{pendingInvites.length}</p>
          <p className="text-[10px] text-muted-foreground">Ausstehend</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
          <Check className="w-5 h-5 mx-auto text-success mb-1" />
          <p className="text-2xl font-bold font-display">{decisionCount}</p>
          <p className="text-[10px] text-muted-foreground">Entscheidungen</p>
        </div>
      </div>

      {/* Invite */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-primary" />
          Per E-Mail einladen
        </h3>
        <form onSubmit={sendInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@beispiel.de"
            className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm"
            required
          />
          <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()} className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            {inviting ? "..." : "Einladen"}
          </Button>
        </form>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="rounded-lg border border-dashed border-warning/30 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-warning">
            <Clock className="w-4 h-4" />
            Ausstehende Einladungen ({pendingInvites.length})
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{inv.email}</span>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => cancelInvite(inv.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Check className="w-4 h-4 text-success" />
          Mitglieder ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
              <UserAvatar
                avatarUrl={m.profiles?.avatar_url}
                fullName={m.profiles?.full_name}
                size="sm"
              />
              <span className="text-sm flex-1 font-medium">{m.profiles?.full_name || "Unbekannt"}</span>
              {m.user_id === user?.id && (
                <Badge variant="outline" className="text-[10px]">Du</Badge>
              )}
              {m.user_id !== user?.id && (
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeMember(m.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewTab;
