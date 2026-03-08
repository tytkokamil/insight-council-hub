import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/shared/UserAvatar";
import { UserPlus, Trash2, Mail, Clock, Check, Users, Shield, Eye, UserCog, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import BulkInvitePanel from "@/components/invites/BulkInvitePanel";

interface Props {
  teamId: string;
  teamName: string;
}

const TEAM_ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  lead: Shield,
  member: UserCog,
  viewer: Eye,
};

const TEAM_ROLE_STYLES: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  lead: "bg-primary/10 text-primary border-primary/20",
  member: "bg-muted text-muted-foreground border-border/60",
  viewer: "bg-muted/50 text-muted-foreground/60 border-border/60",
};

const TeamOverviewTab = ({ teamId, teamName }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { teamsAvailable } = useFreemiumLimits();
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [decisionCount, setDecisionCount] = useState(0);

  const TEAM_ROLE_LABELS: Record<string, string> = {
    admin: t("team.roleAdmin"),
    lead: t("team.roleLead"),
    member: t("team.roleMember"),
    viewer: t("team.roleViewer"),
  };

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

  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).single().then(({ data }) => {
      setIsOrgAdmin(data?.role === "org_owner" || data?.role === "org_admin");
    });
  }, [user]);

  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isTeamAdminOrLead = currentUserMember?.role === "lead" || currentUserMember?.role === "admin";
  const isLeadOrAdmin = isTeamAdminOrLead || isOrgAdmin;

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (!teamsAvailable) {
      toast.error(t("freemium.inviteLockedDesc"));
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-team-invite", {
        body: { email: inviteEmail.trim().toLowerCase(), teamId, teamName },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data?.message || t("team.inviteDefault", { email: inviteEmail }));
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
    toast.success(t("team.memberRemoved"));
  };

  const cancelInvite = async (inviteId: string) => {
    await supabase.from("team_invitations").delete().eq("id", inviteId);
    await fetchInvites();
    toast.success(t("team.inviteCancelled"));
  };

  const changeRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole as any })
      .eq("id", memberId);
    if (error) {
      toast.error(t("team.roleChangeFailed"));
    } else {
      toast.success(t("team.roleChangeTo", { role: TEAM_ROLE_LABELS[newRole] }));
      await fetchMembers();
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center min-h-[90px] flex flex-col justify-center">
          <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{members.length}</p>
          <p className="text-[10px] text-muted-foreground">{t("team.members")}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center min-h-[90px] flex flex-col justify-center">
          <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{pendingInvites.length}</p>
          <p className="text-[10px] text-muted-foreground">{t("team.pending")}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-center min-h-[90px] flex flex-col justify-center">
          <Check className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{decisionCount}</p>
          <p className="text-[10px] text-muted-foreground">{t("team.decisions")}</p>
        </div>
      </div>

      {/* Role Legend - only when 2+ members */}
      {members.length >= 2 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="font-semibold">{t("team.roles")}:</span>
          {Object.entries(TEAM_ROLE_LABELS).map(([key, label]) => {
            const Icon = TEAM_ROLE_ICONS[key];
            return (
              <span key={key} className="flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Invite */}
      {isLeadOrAdmin && (
        <div className="space-y-6">
          {/* Single invite */}
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {t("team.inviteByEmail")}
            </h3>
            <form onSubmit={sendInvite} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t("team.emailPlaceholder")}
                className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border/60 focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm"
                required
              />
              <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="w-3.5 h-3.5" />
                {inviting ? "..." : t("team.invite")}
              </Button>
            </form>
          </div>

          {/* Bulk invite */}
          <BulkInvitePanel teamId={teamId} teamName={teamName} />
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="rounded-lg border border-dashed border-border/60 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {t("team.pendingInvites")} ({pendingInvites.length})
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/60">
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
        </div>
      )}

      {/* Members */}
      <div className="rounded-lg border border-border/60 p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Check className="w-4 h-4 text-muted-foreground" />
          {t("team.membersCount", { count: members.length })}
        </h3>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Noch keine Teammitglieder</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Lade Kollegen ein um gemeinsam Entscheidungen zu treffen und Reviews zu verteilen.
            </p>
          </div>
        ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const RoleIcon = TEAM_ROLE_ICONS[m.role] || UserCog;
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors group">
                <UserAvatar
                  avatarUrl={m.profiles?.avatar_url}
                  fullName={m.profiles?.full_name}
                  size="sm"
                />
                <span className="text-sm flex-1 font-medium">{m.profiles?.full_name || t("team.unknown")}</span>

                {m.user_id === user?.id && (
                  <Badge variant="outline" className="text-[10px]">{t("team.you")}</Badge>
                )}

                {isLeadOrAdmin && m.user_id !== user?.id ? (
                  <Select value={m.role} onValueChange={(val) => changeRole(m.id, val)}>
                    <SelectTrigger className={`w-[120px] h-7 text-[10px] font-semibold border ${TEAM_ROLE_STYLES[m.role]}`}>
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
                    {TEAM_ROLE_LABELS[m.role] || m.role}
                  </Badge>
                )}

                {isLeadOrAdmin && m.user_id !== user?.id && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeMember(m.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default TeamOverviewTab;
