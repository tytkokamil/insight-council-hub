import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, UserCog, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/shared/UserAvatar";
import { toast } from "@/components/ui/sonner";
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => {
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

    if (!profiles || !roles) {
      setLoading(false);
      return;
    }

    const roleMap = new Map(roles.map((r) => [r.user_id, r.role as UserRole]));
    const merged: UserWithRole[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      email: p.full_name || p.user_id,
      role: roleMap.get(p.user_id) || "observer",
      joined: p.created_at,
    }));

    setUsers(merged);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === user?.id) {
      toast.error("Du kannst deine eigene Rolle nicht ändern.");
      return;
    }
    setUpdating(userId);
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast.error("Rolle konnte nicht geändert werden.");
    } else {
      toast.success(`Rolle zu ${roleLabels[newRole]} geändert.`);
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)));
    }
    setUpdating(null);
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Nutzerverwaltung
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verwalte Nutzer und weise Rollen zu
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <UserCog className="w-3.5 h-3.5" />
            {users.length} Nutzer
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nutzer suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        {/* Table */}
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Nutzer
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Rolle
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Beigetreten
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Rolle ändern
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-32 ml-auto" /></td>
                    </tr>
                  ))
                : filtered.map((u) => (
                    <tr key={u.user_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar avatarUrl={u.avatar_url} fullName={u.full_name} />
                          <div>
                            <p className="text-sm font-medium">{u.full_name || "Unbekannt"}</p>
                            <p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={roleBadgeVariant[u.role]}
                        >
                          {roleLabels[u.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(u.joined).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.user_id === user?.id ? (
                          <span className="text-xs text-muted-foreground italic">Du</span>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(v) => handleRoleChange(u.user_id, v as UserRole)}
                            disabled={updating === u.user_id}
                          >
                            <SelectTrigger className="w-[160px] h-8 text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
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
                <tr>
                  <td colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    Keine Nutzer gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
