import { useState, useEffect, useCallback } from "react";
import { Search, MoreHorizontal, Loader2 } from "lucide-react";
import { adminCard, adminCardStyle, adminInput, adminInputStyle, adminBtnGhost, adminBtnRed, adminBtnRedStyle, adminTableRow, adminTableRowStyle } from "./adminStyles";
import { useAdminAction } from "./useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
  org_name: string;
  role: string;
  plan: string;
  created_at: string;
  last_seen: string | null;
  mfa_active: boolean;
}

const AdminUsersTab = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ userId: string; name: string } | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const { invoke } = useAdminAction();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "list_users", search },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data?.users) setUsers(data.users);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (action: string, user: AdminUser) => {
    if (action === "delete_user") {
      setConfirmDialog({ userId: user.user_id, name: user.full_name || user.email });
      setActionMenu(null);
      return;
    }
    try {
      await invoke(action, { userId: user.user_id });
      toast.success(`Aktion "${action}" erfolgreich`);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
    setActionMenu(null);
  };

  const executeDelete = async () => {
    if (!confirmDialog) return;
    try {
      await invoke("delete_user", { userId: confirmDialog.userId });
      toast.success("Nutzer gelöscht");
      setConfirmDialog(null);
      setConfirmInput("");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "—";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Nutzer</h2>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche nach E-Mail, Name, User-ID…"
          className={adminInput + " pl-9"}
          style={adminInputStyle}
        />
      </div>

      <div className={adminCard} style={adminCardStyle}>
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                  {["Name", "E-Mail", "Org", "Rolle", "Plan", "Registriert", "Letzte Akt.", "MFA", "Aktionen"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-neutral-500 text-xs">Keine Nutzer gefunden</td></tr>}
                {users.map((u) => (
                  <tr key={u.user_id} className={adminTableRow} style={adminTableRowStyle}>
                    <td className="py-2 px-2 text-white">{u.full_name || "—"}</td>
                    <td className="py-2 px-2 text-neutral-300 font-mono text-xs">{u.email}</td>
                    <td className="py-2 px-2 text-neutral-400">{u.org_name || "—"}</td>
                    <td className="py-2 px-2"><span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: "#1e293b" }}>{u.role}</span></td>
                    <td className="py-2 px-2"><span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: "#1e293b" }}>{u.plan}</span></td>
                    <td className="py-2 px-2 text-neutral-400 tabular-nums">{formatDate(u.created_at)}</td>
                    <td className="py-2 px-2 text-neutral-400 tabular-nums">{formatDate(u.last_seen)}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${u.mfa_active ? "bg-green-500" : "bg-neutral-600"}`} />
                    </td>
                    <td className="py-2 px-2 relative">
                      <button className={adminBtnGhost} onClick={() => setActionMenu(actionMenu === u.user_id ? null : u.user_id)}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {actionMenu === u.user_id && (
                        <div className="absolute right-0 top-full z-50 w-52 rounded-lg border shadow-xl py-1" style={{ background: "#0d1320", borderColor: "#1e293b" }}>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("reset_password", u)}>Passwort zurücksetzen</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("verify_email", u)}>E-Mail verifizieren</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("ban_user", u)}>Nutzer sperren</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("make_platform_admin", u)}>Platform-Admin machen</button>
                          <div className="border-t my-1" style={{ borderColor: "#1e293b" }} />
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/10 text-red-400" onClick={() => handleAction("delete_user", u)}>Nutzer löschen</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setConfirmDialog(null); setConfirmInput(""); }} />
          <div className="relative w-full max-w-sm rounded-lg border p-6 space-y-4" style={{ background: "#0d1320", borderColor: "#1e293b" }}>
            <h3 className="text-white font-semibold">Nutzer endgültig löschen?</h3>
            <p className="text-sm text-neutral-400">
              Tippe <strong className="text-red-400">"{confirmDialog.name}"</strong> um fortzufahren. Alle Daten werden unwiderruflich gelöscht.
            </p>
            <input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className={adminInput}
              style={adminInputStyle}
            />
            <div className="flex gap-2 justify-end">
              <button className={adminBtnGhost} onClick={() => { setConfirmDialog(null); setConfirmInput(""); }}>Abbrechen</button>
              <button
                className={adminBtnRed}
                style={{ ...adminBtnRedStyle, opacity: confirmInput !== confirmDialog.name ? 0.5 : 1 }}
                disabled={confirmInput !== confirmDialog.name}
                onClick={executeDelete}
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
