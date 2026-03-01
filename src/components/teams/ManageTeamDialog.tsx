import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Trash2, User, Mail, Clock, Check, MessageCircle, Shield, Eye, UserCog } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import TeamChat from "./TeamChat";
import { useTranslation } from "react-i18next";

interface Props {
  team: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const TEAM_ROLE_KEYS: Record<string, string> = {
  admin: "team.roleAdmin",
  lead: "team.roleLead",
  member: "team.roleMember",
  viewer: "team.roleViewer",
};

const TEAM_ROLE_STYLES: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  lead: "bg-primary/10 text-primary border-primary/20",
  member: "bg-muted text-muted-foreground border-border/60",
  viewer: "bg-muted/50 text-muted-foreground/60 border-border/60",
};

const TEAM_ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  lead: Shield,
  member: UserCog,
  viewer: Eye,
};

const ManageTeamDialog = ({ team, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isLeadOrAdmin = currentUserMember?.role === "lead" || currentUserMember?.role === "admin";

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
        toast({ title: t("team.notice"), description: data.error, variant: "destructive" });
      } else {
        toast({ title: t("team.inviteSent"), description: data?.message || t("team.inviteDefault", { email: inviteEmail }) });
        setInviteEmail("");
        await fetchMembers();
        await fetchInvites();
        onUpdated();
      }
    } catch (err: any) {
      toast({ title: t("team.error"), description: err.message, variant: "destructive" });
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

  const changeRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole as any })
      .eq("id", memberId);
    if (error) {
      toast({ title: t("team.error"), description: t("team.roleChangeFailed"), variant: "destructive" });
    } else {
      toast({ title: t("team.roleChanged"), description: t("team.roleChangeTo", { role: t(TEAM_ROLE_KEYS[newRole]) }) });
      await fetchMembers();
      onUpdated();
    }
  };

  if (!team) return null;

  const inputClass = "w-full h-9 px-3 rounded-lg bg-muted/50 border border-border/60 focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{team.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{team.description || t("team.noDescription")}</p>
        </DialogHeader>

        <Tabs defaultValue="members" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1 gap-1.5">
              <User className="w-3.5 h-3.5" /> {t("team.members")}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> {t("team.chat")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <div className="space-y-4">
              {/* Invite by email — only for leads */}
              {isLeadOrAdmin && (
                <form onSubmit={sendInvite} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t("team.inviteByEmail")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t("team.emailPlaceholder")}
                      className={inputClass}
                      required
                    />
                    <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()}>
                      {inviting ? "..." : <UserPlus className="w-4 h-4" />}
                    </Button>
                  </div>
                </form>
              )}

              {/* Pending invitations */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {t("team.pendingInvites")} ({pendingInvites.length})
                  </h3>
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-dashed border-border/60">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{inv.email}</span>
                      {isLeadOrAdmin && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => cancelInvite(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Current members */}
              <div className="space-y-2 border-t border-border/60 pt-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  {t("team.membersCount", { count: members.length })}
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((m) => {
                    const RoleIcon = TEAM_ROLE_ICONS[m.role] || UserCog;
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 group">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1">{m.profiles?.full_name || t("team.unknown")}</span>

                        {m.user_id === user?.id && (
                          <Badge variant="outline" className="text-[10px]">{t("team.you")}</Badge>
                        )}

                        {/* Role select for leads, badge for others */}
                        {isLeadOrAdmin && m.user_id !== user?.id ? (
                          <Select value={m.role} onValueChange={(val) => changeRole(m.id, val)}>
                            <SelectTrigger className={`w-[110px] h-6 text-[10px] font-semibold border ${TEAM_ROLE_STYLES[m.role]}`}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{t("team.roleAdmin")}</SelectItem>
                              <SelectItem value="lead">{t("team.roleLead")}</SelectItem>
                              <SelectItem value="member">{t("team.roleMember")}</SelectItem>
                              <SelectItem value="viewer">{t("team.roleViewer")}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] ${TEAM_ROLE_STYLES[m.role]}`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {t(TEAM_ROLE_KEYS[m.role]) || m.role}
                          </Badge>
                        )}

                        {isLeadOrAdmin && m.user_id !== user?.id && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeMember(m.id)} disabled={loading}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
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
