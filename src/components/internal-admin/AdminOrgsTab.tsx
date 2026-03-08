import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreHorizontal, X, Loader2 } from "lucide-react";
import { adminCard, adminCardStyle, adminInput, adminInputStyle, adminBtnGhost, adminBtnRed, adminBtnRedStyle, adminTableRow, adminTableRowStyle, adminSectionTitle } from "./adminStyles";
import { useAdminAction } from "./useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  decisions: number;
  created_at: string;
  last_activity: string | null;
  is_active: boolean;
  support_notes: string | null;
}

const PLAN_OPTIONS = ["free", "starter", "professional", "enterprise"];

const AdminOrgsTab = () => {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; org: Org; confirmText: string } | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const { invoke } = useAdminAction();

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "list_orgs", search, planFilter },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data?.orgs) setOrgs(data.orgs);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [search, planFilter]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleAction = async (action: string, org: Org, extra?: any) => {
    if (action === "deactivate" || action === "delete_org") {
      setConfirmDialog({ type: action, org, confirmText: org.name });
      setActionMenu(null);
      return;
    }
    try {
      await invoke(action, { orgId: org.id, ...extra });
      toast.success(`Aktion "${action}" erfolgreich`);
      fetchOrgs();
    } catch (e: any) {
      toast.error(e.message);
    }
    setActionMenu(null);
  };

  const executeConfirmed = async () => {
    if (!confirmDialog) return;
    try {
      await invoke(confirmDialog.type === "deactivate" ? "deactivate_org" : confirmDialog.type, { orgId: confirmDialog.org.id });
      toast.success("Aktion erfolgreich");
      setConfirmDialog(null);
      setConfirmInput("");
      fetchOrgs();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "—";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Organisationen</h2>

      {/* Search + Filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Name, Slug, E-Mail…"
            className={adminInput + " pl-9"}
            style={adminInputStyle}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className={adminInput + " w-40"}
          style={adminInputStyle}
        >
          <option value="all">Alle Pläne</option>
          {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={adminCard} style={adminCardStyle}>
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                  {["Name", "Slug", "Plan", "Nutzer", "Entsch.", "Erstellt", "Letzte Akt.", "Aktionen"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-neutral-500 text-xs">Keine Organisationen gefunden</td></tr>}
                {orgs.map((org) => (
                  <tr key={org.id} className={adminTableRow} style={adminTableRowStyle}>
                    <td className="py-2 px-2">
                      <button className="text-white hover:text-red-400 transition-colors text-left" onClick={() => setSelectedOrg(org)}>
                        {org.name}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-neutral-400 font-mono text-xs">{org.slug}</td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded" style={{ background: "#1e293b" }}>{org.plan}</span>
                    </td>
                    <td className="py-2 px-2 tabular-nums">{org.users}</td>
                    <td className="py-2 px-2 tabular-nums">{org.decisions}</td>
                    <td className="py-2 px-2 text-neutral-400">{formatDate(org.created_at)}</td>
                    <td className="py-2 px-2 text-neutral-400">{formatDate(org.last_activity)}</td>
                    <td className="py-2 px-2 relative">
                      <button className={adminBtnGhost} onClick={() => setActionMenu(actionMenu === org.id ? null : org.id)}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {actionMenu === org.id && (
                        <div className="absolute right-0 top-full z-50 w-52 rounded-lg border shadow-xl py-1" style={{ background: "#0d1320", borderColor: "#1e293b" }}>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("change_plan", org, { plan: "professional" })}>Plan ändern</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("extend_trial", org, { days: 14 })}>Trial +14 Tage</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("toggle_pilot", org)}>Pilot-Modus</button>
                          <div className="border-t my-1" style={{ borderColor: "#1e293b" }} />
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => { setActionMenu(null); window.open(`/roi-report`, '_blank'); }}>ROI Report generieren</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/10 text-red-400" onClick={() => handleAction("deactivate", org)}>Org deaktivieren</button>
                          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-neutral-300" onClick={() => handleAction("export_org", org)}>Daten exportieren</button>
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

      {/* Org Detail Slide-Over */}
      {selectedOrg && (
        <div className="fixed inset-0 z-[100] flex justify-end" onClick={() => setSelectedOrg(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-lg h-full overflow-y-auto p-6 space-y-4" style={{ background: "#0A0F1A" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{selectedOrg.name}</h3>
              <button onClick={() => setSelectedOrg(null)} className={adminBtnGhost}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-neutral-500">Slug:</span> <span className="text-neutral-300 font-mono">{selectedOrg.slug}</span></div>
              <div><span className="text-neutral-500">Plan:</span> <span className="text-neutral-300">{selectedOrg.plan}</span></div>
              <div><span className="text-neutral-500">Nutzer:</span> <span className="text-neutral-300 tabular-nums">{selectedOrg.users}</span></div>
              <div><span className="text-neutral-500">Entscheidungen:</span> <span className="text-neutral-300 tabular-nums">{selectedOrg.decisions}</span></div>
              <div><span className="text-neutral-500">Aktiv:</span> <span className={selectedOrg.is_active ? "text-green-400" : "text-red-400"}>{selectedOrg.is_active ? "Ja" : "Nein"}</span></div>
              <div><span className="text-neutral-500">Erstellt:</span> <span className="text-neutral-300">{formatDate(selectedOrg.created_at)}</span></div>
              {/* Branding Preview */}
              {(selectedOrg as any).branding && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: "#1e293b" }}>
                  <h5 className="text-xs font-medium text-neutral-400 mb-2">Custom Branding</h5>
                  <div className="flex items-center gap-3">
                    {(selectedOrg as any).branding?.logoUrl && (
                      <img src={(selectedOrg as any).branding.logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain bg-neutral-800 p-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      {(selectedOrg as any).branding?.companyName && (
                        <div><span className="text-neutral-500">Name:</span> <span className="text-neutral-300">{(selectedOrg as any).branding.companyName}</span></div>
                      )}
                      {(selectedOrg as any).branding?.primaryColor && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500">Farbe:</span>
                          <div className="w-3 h-3 rounded" style={{ background: (selectedOrg as any).branding.primaryColor }} />
                          <span className="text-neutral-300 font-mono">{(selectedOrg as any).branding.primaryColor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h4 className={adminSectionTitle}>Support-Notizen</h4>
              <textarea
                defaultValue={selectedOrg.support_notes || ""}
                rows={4}
                className={adminInput + " resize-none"}
                style={adminInputStyle}
                onBlur={async (e) => {
                  try {
                    await invoke("update_support_notes", { orgId: selectedOrg.id, notes: e.target.value });
                    toast.success("Notizen gespeichert");
                  } catch {}
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setConfirmDialog(null); setConfirmInput(""); }} />
          <div className="relative w-full max-w-sm rounded-lg border p-6 space-y-4" style={{ background: "#0d1320", borderColor: "#1e293b" }}>
            <h3 className="text-white font-semibold">Bestätigung erforderlich</h3>
            <p className="text-sm text-neutral-400">
              Tippe <strong className="text-red-400">"{confirmDialog.confirmText}"</strong> um fortzufahren.
            </p>
            <input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className={adminInput}
              style={adminInputStyle}
              placeholder={confirmDialog.confirmText}
            />
            <div className="flex gap-2 justify-end">
              <button className={adminBtnGhost} onClick={() => { setConfirmDialog(null); setConfirmInput(""); }}>Abbrechen</button>
              <button
                className={adminBtnRed}
                style={{ ...adminBtnRedStyle, opacity: confirmInput !== confirmDialog.confirmText ? 0.5 : 1 }}
                disabled={confirmInput !== confirmDialog.confirmText}
                onClick={executeConfirmed}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrgsTab;
