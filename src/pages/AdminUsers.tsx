import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, UserCog, Search, BarChart3, FileText, Activity, Download, Users, TrendingUp, UserPlus, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from "@/components/shared/UserAvatar";
import { toast } from "@/components/ui/sonner";
import { useDecisions } from "@/hooks/useDecisions";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: UserRole;
  joined: string;
}

const roleBadgeVariant: Record<UserRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  decision_maker: "bg-primary/10 text-primary border-primary/20",
  reviewer: "bg-accent/10 text-accent-foreground border-accent/20",
  observer: "bg-muted text-muted-foreground border-border",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  decision_maker: "Decision Maker",
  reviewer: "Reviewer",
  observer: "Observer",
};

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const { data: decisions = [] } = useDecisions();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: { email: inviteEmail.trim().toLowerCase() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data?.message || "Einladung gesendet");
        setInviteEmail("");
      }
    } catch (err: any) {
      toast.error(err.message || "Einladung fehlgeschlagen");
    }
    setInviting(false);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      const admin = (data?.length ?? 0) > 0;
      setIsAdmin(admin);
      if (!admin) navigate("/dashboard");
    });
  }, [user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (!profiles || !roles) { setLoading(false); return; }
    const roleMap = new Map(roles.map((r) => [r.user_id, r.role as UserRole]));
    const merged: UserWithRole[] = profiles.map((p) => ({
      user_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url,
      email: p.full_name || p.user_id, role: roleMap.get(p.user_id) || "observer", joined: p.created_at,
    }));
    setUsers(merged);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === user?.id) { toast.error("Du kannst deine eigene Rolle nicht ändern."); return; }
    setUpdating(userId);
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) { toast.error("Rolle konnte nicht geändert werden."); }
    else { toast.success(`Rolle zu ${roleLabels[newRole]} geändert.`); setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))); }
    setUpdating(null);
  };

  const filtered = users.filter((u) => (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || u.user_id.toLowerCase().includes(search.toLowerCase()));

  // Org analytics
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">Nutzer, Analytics und Systemverwaltung</p>
          </div>
          <Badge variant="outline" className="gap-1.5"><UserCog className="w-3.5 h-3.5" />{users.length} Nutzer</Badge>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" />Nutzer</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Org Analytics</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5"><FileText className="w-3.5 h-3.5" />System Logs</TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5"><Download className="w-3.5 h-3.5" />Daten</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-4">
            {/* Invite user form */}
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleInvite} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Mail className="w-4 h-4 text-primary" />
                      Neuen Nutzer per E-Mail einladen
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@beispiel.de"
                      required
                      className="w-full h-10 px-3 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    />
                  </div>
                  <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="gap-2 h-10">
                    <UserPlus className="w-4 h-4" />
                    {inviting ? "Sende..." : "Einladen"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Nutzer suchen..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Nutzer</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Rolle</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Beigetreten</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Rolle ändern</th>
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
                          <div><p className="text-sm font-medium">{u.full_name || "Unbekannt"}</p><p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={roleBadgeVariant[u.role]}>{roleLabels[u.role]}</Badge></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(u.joined).toLocaleDateString("de-DE")}</td>
                      <td className="px-4 py-3 text-right">
                        {u.user_id === user?.id ? <span className="text-xs text-muted-foreground italic">Du</span> : (
                          <Select value={u.role} onValueChange={(v) => handleRoleChange(u.user_id, v as UserRole)} disabled={updating === u.user_id}>
                            <SelectTrigger className="w-[160px] h-8 text-xs ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="decision_maker">Decision Maker</SelectItem>
                              <SelectItem value="reviewer">Reviewer</SelectItem>
                              <SelectItem value="observer">Observer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-sm text-muted-foreground py-8">Keine Nutzer gefunden.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Org Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary mb-1"><Users className="w-4 h-4" /><span className="text-2xl font-bold font-display">{orgStats.userCount}</span></div>
                <p className="text-xs text-muted-foreground">Registrierte Nutzer</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary mb-1"><FileText className="w-4 h-4" /><span className="text-2xl font-bold font-display">{orgStats.totalDecisions}</span></div>
                <p className="text-xs text-muted-foreground">Entscheidungen gesamt</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-destructive mb-1"><Activity className="w-4 h-4" /><span className="text-2xl font-bold font-display">{orgStats.slaBreaches}</span></div>
                <p className="text-xs text-muted-foreground">SLA Breaches</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 text-success mb-1"><TrendingUp className="w-4 h-4" /><span className="text-2xl font-bold font-display">{orgStats.completionRate}%</span></div>
                <p className="text-xs text-muted-foreground">Abschlussrate</p>
              </CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Adoption Rate</h3>
                <div className="space-y-2">
                  {Object.entries(roleLabels).map(([role, label]) => {
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

          {/* System Logs Tab */}
          <TabsContent value="logs" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Audit Trail</h3>
                <p className="text-xs text-muted-foreground mb-4">Die letzten Systemereignisse aus dem Audit Log.</p>
                <AuditLogList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Datenexport</h3>
                <p className="text-xs text-muted-foreground mb-4">Exportiere alle Entscheidungen und Aufgaben als CSV.</p>
                <Button size="sm" variant="outline" className="gap-2"><Download className="w-3.5 h-3.5" />Alle Daten exportieren</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Backup</h3>
                <p className="text-xs text-muted-foreground">Automatische Backups werden täglich erstellt und 30 Tage aufbewahrt.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Mini audit log component
const AuditLogList = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (logs.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Noch keine Audit-Einträge.</p>;

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 text-xs">
          <span className="text-muted-foreground w-28 shrink-0">{new Date(log.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{log.action}</Badge>
          <span className="text-muted-foreground truncate">{log.field_name ? `${log.field_name}: ${log.old_value || "–"} → ${log.new_value || "–"}` : log.action}</span>
        </div>
      ))}
    </div>
  );
};

export default AdminUsers;
