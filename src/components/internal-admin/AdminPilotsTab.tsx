import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { adminCard, adminCardStyle, adminInput, adminInputStyle, adminBtnGhost, adminBtnRed, adminBtnRedStyle, adminTableRow, adminTableRowStyle, adminSectionTitle } from "./adminStyles";
import { useAdminAction } from "./useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PilotCustomer {
  id: string;
  org_id: string;
  org_name: string;
  contact_name: string | null;
  industry: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  enabled_features: string[];
  notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400",
  extended: "text-blue-400",
  converted: "text-emerald-400",
  cancelled: "text-red-400",
};

const AdminPilotsTab = () => {
  const [pilots, setPilots] = useState<PilotCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orgId: "", contactName: "", industry: "", durationDays: "30", notes: "" });
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const { invoke } = useAdminAction();

  const fetchPilots = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "list_pilots" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data?.pilots) setPilots(data.pilots);
      if (data?.orgs) setOrgs(data.orgs);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPilots(); }, [fetchPilots]);

  const createPilot = async () => {
    if (!form.orgId) { toast.error("Bitte Org auswählen"); return; }
    try {
      await invoke("create_pilot", form);
      toast.success("Pilot-Kunde angelegt");
      setShowForm(false);
      setForm({ orgId: "", contactName: "", industry: "", durationDays: "30", notes: "" });
      fetchPilots();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const updateStatus = async (pilotId: string, status: string) => {
    try {
      await invoke("update_pilot_status", { pilotId, status });
      toast.success("Status aktualisiert");
      fetchPilots();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Pilot-Kunden</h2>
        <button className={adminBtnRed} style={adminBtnRedStyle} onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> Neuen Pilot anlegen
        </button>
      </div>

      {showForm && (
        <div className={adminCard + " space-y-3"} style={adminCardStyle}>
          <h3 className={adminSectionTitle}>Neuer Pilot-Kunde</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.orgId} onChange={e => setForm(p => ({ ...p, orgId: e.target.value }))} className={adminInput} style={adminInputStyle}>
              <option value="">Org auswählen…</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Ansprechpartner" className={adminInput} style={adminInputStyle} />
            <input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="Branche" className={adminInput} style={adminInputStyle} />
            <input value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} placeholder="Dauer (Tage)" type="number" className={adminInput} style={adminInputStyle} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Interne Notizen" rows={3} className={adminInput + " resize-none"} style={adminInputStyle} />
          <div className="flex gap-2 justify-end">
            <button className={adminBtnGhost} onClick={() => setShowForm(false)}>Abbrechen</button>
            <button className={adminBtnRed} style={adminBtnRedStyle} onClick={createPilot}>Anlegen</button>
          </div>
        </div>
      )}

      <div className={adminCard} style={adminCardStyle}>
        {loading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                {["Org", "Ansprechpartner", "Branche", "Start", "Ende", "Status", "Notizen", "Aktionen"].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pilots.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-neutral-500 text-xs">Keine Pilot-Kunden</td></tr>}
              {pilots.map(p => (
                <tr key={p.id} className={adminTableRow} style={adminTableRowStyle}>
                  <td className="py-2 px-2 text-white">{p.org_name}</td>
                  <td className="py-2 px-2 text-neutral-300">{p.contact_name || "—"}</td>
                  <td className="py-2 px-2 text-neutral-400">{p.industry || "—"}</td>
                  <td className="py-2 px-2 text-neutral-400 tabular-nums">{formatDate(p.start_date)}</td>
                  <td className="py-2 px-2 text-neutral-400 tabular-nums">{formatDate(p.end_date)}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs font-medium capitalize ${STATUS_COLORS[p.status] || "text-neutral-400"}`}>{p.status}</span>
                  </td>
                  <td className="py-2 px-2 text-neutral-500 text-xs max-w-[200px] truncate">{p.notes || "—"}</td>
                  <td className="py-2 px-2">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value)}
                      className="text-xs bg-transparent border rounded px-1.5 py-0.5"
                      style={{ borderColor: "#1e293b", color: "#e2e8f0" }}
                    >
                      <option value="active">Aktiv</option>
                      <option value="extended">Verlängert</option>
                      <option value="converted">Konvertiert</option>
                      <option value="cancelled">Abgebrochen</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPilotsTab;
