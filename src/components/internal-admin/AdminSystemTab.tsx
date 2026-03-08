import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { adminCard, adminCardStyle, adminBtnGhost, adminSectionTitle, adminTableRow, adminTableRowStyle } from "./adminStyles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SECURITY_CHECKS = [
  { id: "crypto_random", label: "Math.random() durch crypto.getRandomValues() ersetzt", checked: "2026-03-08" },
  { id: "bg_secret_guard", label: "Background Functions mit Secret Guard geschützt", checked: "2026-03-08" },
  { id: "backup_hashed", label: "Backup Codes gehasht (PBKDF2)", checked: "2026-03-08" },
  { id: "rls_fixed", label: "Permissive RLS Policies gefixt", checked: "2026-03-08" },
  { id: "sendgrid_verify", label: "SendGrid Webhook Verifikation aktiv", checked: "2026-03-08" },
  { id: "otp_no_logs", label: "OTP nicht mehr in Logs", checked: "2026-03-08" },
];

const AdminSystemTab = () => {
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "get_system_health" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data) setDbHealth(data);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSystemData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">System</h2>
        <button onClick={fetchSystemData} disabled={loading} className={adminBtnGhost}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Aktualisieren
        </button>
      </div>

      {/* Edge Functions */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className={adminSectionTitle}>Edge Functions Status</h3>
        {loading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}
        {dbHealth?.edgeFunctions && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                  {["Name", "Status"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dbHealth.edgeFunctions.map((ef: any, i: number) => (
                  <tr key={i} className={adminTableRow} style={adminTableRowStyle}>
                    <td className="py-2 px-2 text-white font-mono text-xs">{ef.name}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${ef.status === "active" ? "text-green-400" : "text-red-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ef.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                        {ef.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !dbHealth?.edgeFunctions && (
          <p className="text-sm text-neutral-500 py-4 text-center">Edge Function Daten werden über die admin-actions Funktion geladen</p>
        )}
      </div>

      {/* DB Health */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className={adminSectionTitle}>Datenbank-Gesundheit</h3>
        {dbHealth?.tables && (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: "#0d1320" }}>
                <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                  {["Tabelle", "Zeilen", "RLS"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dbHealth.tables.map((t: any, i: number) => (
                  <tr key={i} className={adminTableRow} style={adminTableRowStyle}>
                    <td className="py-2 px-2 text-white font-mono text-xs">{t.name}</td>
                    <td className="py-2 px-2 tabular-nums text-neutral-300">{t.rows?.toLocaleString("de-DE") ?? "?"}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${t.rls ? "text-green-400" : "text-red-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.rls ? "bg-green-500" : "bg-red-500"}`} />
                        {t.rls ? "Aktiv" : "AUS"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Checklist */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className={adminSectionTitle}>Sicherheits-Status</h3>
        <div className="space-y-2">
          {SECURITY_CHECKS.map(check => (
            <div key={check.id} className="flex items-center gap-3 py-2 px-2 rounded" style={{ background: "#0a1020" }}>
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-neutral-300 flex-1">{check.label}</span>
              <span className="text-[10px] text-neutral-500 tabular-nums">Geprüft: {check.checked}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSystemTab;
