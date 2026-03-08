import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { adminCard, adminCardStyle, adminInput, adminInputStyle, adminBtnGhost, adminBtnRed, adminBtnRedStyle, adminTableRow, adminTableRowStyle, adminSectionTitle } from "./adminStyles";
import { useAdminAction } from "./useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  feature_key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: string;
  override_count?: number;
}

interface FlagOverride {
  id: string;
  flag_id: string;
  flag_key: string;
  org_id: string;
  org_name: string;
  enabled: boolean;
  set_by_name: string;
  created_at: string;
}

const AdminFeatureFlagsTab = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [overrides, setOverrides] = useState<FlagOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", label: "", description: "" });
  const [showNew, setShowNew] = useState(false);
  const { invoke } = useAdminAction();

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "list_feature_flags" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data?.flags) setFlags(data.flags);
      if (data?.overrides) setOverrides(data.overrides);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      await invoke("toggle_feature_flag", { flagId, enabled: !enabled });
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, enabled: !enabled } : f));
      toast.success("Flag aktualisiert");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const createFlag = async () => {
    if (!newFlag.key) return;
    try {
      await invoke("create_feature_flag", newFlag);
      toast.success("Flag erstellt");
      setNewFlag({ key: "", label: "", description: "" });
      setShowNew(false);
      fetchFlags();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Feature Flags</h2>

      {/* Global Flags */}
      <div className={adminCard} style={adminCardStyle}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={adminSectionTitle + " mb-0"}>Globale Feature Flags</h3>
          <button className={adminBtnGhost} onClick={() => setShowNew(!showNew)}>
            <Plus className="w-3.5 h-3.5" /> Neuer Flag
          </button>
        </div>

        {showNew && (
          <div className="flex gap-2 mb-4 items-end">
            <input value={newFlag.key} onChange={e => setNewFlag(p => ({ ...p, key: e.target.value }))} placeholder="feature_key" className={adminInput + " w-40"} style={adminInputStyle} />
            <input value={newFlag.label} onChange={e => setNewFlag(p => ({ ...p, label: e.target.value }))} placeholder="Label" className={adminInput + " w-40"} style={adminInputStyle} />
            <input value={newFlag.description} onChange={e => setNewFlag(p => ({ ...p, description: e.target.value }))} placeholder="Beschreibung" className={adminInput + " flex-1"} style={adminInputStyle} />
            <button className={adminBtnRed} style={adminBtnRedStyle} onClick={createFlag}>Erstellen</button>
          </div>
        )}

        {loading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                {["Feature", "Beschreibung", "Kategorie", "Status", "Overrides"].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flags.map(f => (
                <tr key={f.id} className={adminTableRow} style={adminTableRowStyle}>
                  <td className="py-2 px-2 text-white font-mono text-xs">{f.feature_key}</td>
                  <td className="py-2 px-2 text-neutral-400">{f.description || f.label}</td>
                  <td className="py-2 px-2"><span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: "#1e293b" }}>{f.category}</span></td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => toggleFlag(f.id, f.enabled)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${f.enabled ? "bg-green-600" : "bg-neutral-700"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${f.enabled ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="py-2 px-2 tabular-nums text-neutral-400">{f.override_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Org Overrides */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className={adminSectionTitle}>Org-spezifische Overrides</h3>
        {overrides.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">Keine Overrides vorhanden</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                {["Org", "Flag", "Override", "Gesetzt von", "Datum"].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overrides.map(o => (
                <tr key={o.id} className={adminTableRow} style={adminTableRowStyle}>
                  <td className="py-2 px-2 text-white">{o.org_name}</td>
                  <td className="py-2 px-2 font-mono text-xs text-neutral-300">{o.flag_key}</td>
                  <td className="py-2 px-2"><span className={o.enabled ? "text-green-400" : "text-red-400"}>{o.enabled ? "AN" : "AUS"}</span></td>
                  <td className="py-2 px-2 text-neutral-400">{o.set_by_name || "—"}</td>
                  <td className="py-2 px-2 text-neutral-400 tabular-nums">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminFeatureFlagsTab;
