import { useState, useEffect, useMemo } from "react";
import { formatDate, formatDateTime, formatDateTimeShort } from "@/lib/formatters";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Shield, UserCog, Search, BarChart3, FileText, Activity, Download, Users, TrendingUp, UserPlus, Mail, Settings2, Zap, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from "@/components/shared/UserAvatar";
import { toast } from "@/components/ui/sonner";
import { useDecisions } from "@/hooks/useDecisions";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useTranslation } from "react-i18next";
import RolePermissionsPanel from "@/components/settings/RolePermissionsPanel";
import DemoDataPanel from "@/components/settings/DemoDataPanel";
import type { Database } from "@/integrations/supabase/types";

type OrgRole = Database["public"]["Enums"]["org_role"];

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: OrgRole;
  joined: string;
}

const roleBadgeVariant: Record<OrgRole, string> = {
  org_owner: "bg-destructive/10 text-destructive border-destructive/20",
  org_admin: "bg-primary/10 text-primary border-primary/20",
  org_executive: "bg-accent/50 text-accent-foreground border-accent/30",
  org_member: "bg-muted text-muted-foreground border-border",
  org_reviewer: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  org_viewer: "bg-muted/50 text-muted-foreground/70 border-border/50",
};

const AdminUsers = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "users";
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const { data: decisions = [] } = useDecisions();
  const { flags, loading: flagsLoading, toggleFlag } = useFeatureFlags();

  const roleLabels: Record<OrgRole, string> = {
    org_owner: t("admin.roleOrgOwner"),
    org_admin: t("admin.roleOrgAdmin"),
    org_executive: t("admin.roleOrgExecutive", "Executive"),
    org_member: t("admin.roleOrgMember"),
    org_reviewer: t("admin.roleOrgReviewer", "Reviewer"),
    org_viewer: t("admin.roleOrgViewer", "Viewer"),
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: { email: inviteEmail.trim().toLowerCase() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); }
      else { toast.success(data?.message || t("admin.inviteSent")); setInviteEmail(""); }
    } catch (err: any) {
      toast.error(err.message || t("admin.inviteFailed"));
    }
    setInviting(false);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).single().then(({ data }) => {
      const admin = data?.role === "org_owner" || data?.role === "org_admin";
      setIsAdmin(admin);
      if (!admin) navigate("/dashboard");
    });
  }, [user, navigate]);

  useEffect(() => { if (!isAdmin) return; fetchUsers(); }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (!profiles || !roles) { setLoading(false); return; }
    const roleMap = new Map(roles.map((r) => [r.user_id, r.role as OrgRole]));
    const merged: UserWithRole[] = profiles.map((p) => ({
      user_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url,
      email: p.full_name || p.user_id, role: roleMap.get(p.user_id) || "org_member", joined: p.created_at,
    }));
    setUsers(merged);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: OrgRole) => {
    if (userId === user?.id) { toast.error(t("admin.cantChangeOwnRole")); return; }
    setUpdating(userId);
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) { toast.error(t("admin.roleChangeFailed")); }
    else { toast.success(t("admin.roleChanged", { role: roleLabels[newRole] })); setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))); }
    setUpdating(null);
  };

  const filtered = users.filter((u) => (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || u.user_id.toLowerCase().includes(search.toLowerCase()));

  const orgStats = useMemo(() => {
    const totalDecisions = decisions.length;
    const slaBreaches = decisions.filter(d => (d.escalation_level ?? 0) > 0).length;
    const implemented = decisions.filter(d => d.status === "implemented").length;
    const completionRate = totalDecisions > 0 ? Math.round((implemented / totalDecisions) * 100) : 0;
    return { totalDecisions, slaBreaches, userCount: users.length, completionRate };
  }, [decisions, users]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={t("admin.title")}
          subtitle={t("admin.subtitle")}
          role="system"
          secondaryActions={
            <Badge variant="outline" className="gap-1.5"><UserCog className="w-3.5 h-3.5" />{t("admin.usersCount", { count: users.length })}</Badge>
          }
        />

        <Tabs defaultValue={initialTab}>
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" />{t("admin.usersTab")}</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />{t("admin.analyticsTab")}</TabsTrigger>
            <TabsTrigger value="config" className="gap-1.5"><Settings2 className="w-3.5 h-3.5" />{t("admin.configTab", "Konfiguration")}</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5"><FileText className="w-3.5 h-3.5" />{t("admin.logsTab")}</TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5"><Download className="w-3.5 h-3.5" />{t("admin.dataTab")}</TabsTrigger>
          </TabsList>

          {/* ═══════════════ USERS ═══════════════ */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleInvite} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Mail className="w-4 h-4 text-primary" />{t("admin.inviteLabel")}
                    </label>
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t("admin.invitePlaceholder")} required
                      className="w-full h-10 px-3 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
                  </div>
                  <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="gap-2 h-10">
                    <UserPlus className="w-4 h-4" />{inviting ? t("admin.inviteSending") : t("admin.invite")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={t("admin.searchUsers")} value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("admin.colUser")}</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("admin.colRole")}</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("admin.colJoined")}</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("admin.colChangeRole")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td><td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td><td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td><td className="px-4 py-3"><Skeleton className="h-8 w-32 ml-auto" /></td></tr>
                  )) : filtered.map((u) => (
                    <tr key={u.user_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar avatarUrl={u.avatar_url} fullName={u.full_name} />
                          <div><p className="text-sm font-medium">{u.full_name || t("admin.unknown")}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={roleBadgeVariant[u.role]}>{roleLabels[u.role]}</Badge></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(u.joined)}</td>
                      <td className="px-4 py-3 text-right">
                        {u.user_id === user?.id ? <span className="text-xs text-muted-foreground italic">{t("admin.you")}</span> : (
                          <Select value={u.role} onValueChange={(v) => handleRoleChange(u.user_id, v as OrgRole)} disabled={updating === u.user_id}>
                            <SelectTrigger className="w-[160px] h-8 text-xs ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="org_owner">{t("admin.roleOrgOwner")}</SelectItem>
                              <SelectItem value="org_admin">{t("admin.roleOrgAdmin")}</SelectItem>
                              <SelectItem value="org_executive">{t("admin.roleOrgExecutive", "Executive")}</SelectItem>
                              <SelectItem value="org_member">{t("admin.roleOrgMember")}</SelectItem>
                              <SelectItem value="org_reviewer">{t("admin.roleOrgReviewer", "Reviewer")}</SelectItem>
                              <SelectItem value="org_viewer">{t("admin.roleOrgViewer", "Viewer")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-sm text-muted-foreground py-8">{t("admin.noUsers")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ═══════════════ ANALYTICS ═══════════════ */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary mb-1"><Users className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{orgStats.userCount}</span></div>
                <p className="text-xs text-muted-foreground">{t("admin.registeredUsers")}</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary mb-1"><FileText className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{orgStats.totalDecisions}</span></div>
                <p className="text-xs text-muted-foreground">{t("admin.totalDecisions")}</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-destructive mb-1"><Activity className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{orgStats.slaBreaches}</span></div>
                <p className="text-xs text-muted-foreground">{t("admin.slaBreaches")}</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-success mb-1"><TrendingUp className="w-4 h-4" /><span className="text-2xl font-bold font-display tabular-nums">{orgStats.completionRate}%</span></div>
                <p className="text-xs text-muted-foreground">{t("admin.completionRate")}</p>
              </CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">{t("admin.adoptionRate")}</h3>
                <div className="space-y-2">
                  {(Object.entries(roleLabels) as [OrgRole, string][]).map(([role, label]) => {
                    const count = users.filter(u => u.role === role).length;
                    const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-28">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ CONFIG (Feature Flags + Role Permissions) ═══════════════ */}
          <TabsContent value="config" className="space-y-6 mt-4">
            {/* Feature Flags */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("settings.featureFlags")}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.featureFlagsDesc")}</p>
                {flagsLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-1">
                    {flags.map((flag) => (
                      <div key={flag.feature_key} className={`flex items-center justify-between py-3 ${!flag.enabled ? "opacity-50" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm">{flag.label}</p>
                            <Badge variant="outline" className="text-[10px]">{flag.category}</Badge>
                          </div>
                          {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
                        </div>
                        <Switch checked={flag.enabled} onCheckedChange={(checked) => toggleFlag(flag.feature_key, checked)} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Permissions */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("settings.rolePermsTitle", "Rollen-Berechtigungen")}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.rolePermsDesc", "Passe Berechtigungen pro Rolle an. Änderungen überschreiben die Standard-Rechte.")}</p>
                <RolePermissionsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ LOGS ═══════════════ */}
          <TabsContent value="logs" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">{t("admin.auditTrail")}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t("admin.auditDesc")}</p>
                <AuditLogList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ DATA (Export + Demo Data) ═══════════════ */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">{t("admin.dataExport")}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t("admin.dataExportDesc")}</p>
                <Button size="sm" variant="outline" className="gap-2"><Download className="w-3.5 h-3.5" />{t("admin.exportAll")}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">{t("admin.backup")}</h3>
                <p className="text-xs text-muted-foreground mb-2">{t("admin.backupDesc")}</p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{t("admin.backupStatus")}</Badge>
                  <span className="text-xs text-muted-foreground">{t("admin.lastBackup")}</span>
                </div>
              </CardContent>
            </Card>

            <DemoDataPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const AuditLogList = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("audit_logs").select("*, decisions(title)").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (logs.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">{t("admin.noAuditEntries")}</p>;

  const formatValue = (val: string | null) => {
    if (!val) return "\u2013";
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return formatDateTime(val);
    }
    return val;
  };

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto">
      {logs.map((log) => {
        const decisionTitle = (log as any).decisions?.title;
        return (
          <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 text-xs">
            <span className="text-muted-foreground w-28 shrink-0">{formatDateTimeShort(log.created_at)}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{log.action}</Badge>
            <span className="text-muted-foreground truncate">
              {decisionTitle && <span className="font-medium text-foreground">{decisionTitle}: </span>}
              {log.field_name ? `${log.field_name}: ${formatValue(log.old_value)} \u2192 ${formatValue(log.new_value)}` : log.action}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AdminUsers;