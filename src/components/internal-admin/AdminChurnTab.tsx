import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, Mail, ExternalLink } from "lucide-react";
import { adminCard, adminCardStyle, adminInput, adminInputStyle, adminBtnGhost, adminBtnRed, adminBtnRedStyle, kpiCard, kpiCardStyle, kpiLabel, kpiValue } from "./adminStyles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChurnEntry {
  id: string;
  org_id: string;
  org_name: string;
  score: number;
  risk_level: string;
  risk_factors: string[];
  calculated_at: string;
  intervention_sent: boolean;
  intervention_type: string | null;
}

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#EF4444", text: "#fff" },
  medium: { bg: "#F59E0B", text: "#000" },
  low: { bg: "#22C55E", text: "#000" },
};

const AdminChurnTab = () => {
  const [entries, setEntries] = useState<ChurnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "medium" | "low">("critical");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Get latest churn entry per org via admin-actions
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "list_churn_risks", filter },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (data?.entries) setEntries(data.entries);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = {
    critical: entries.filter(e => e.risk_level === "critical").length,
    medium: entries.filter(e => e.risk_level === "medium").length,
    low: entries.filter(e => e.risk_level === "low").length,
    avgScore: entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length) : 0,
  };

  const filteredEntries = filter === "all" ? entries : entries.filter(e => e.risk_level === filter);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Churn Risk Monitor</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className={kpiCard} style={kpiCardStyle}>
          <span className={kpiLabel}>Kritisch</span>
          <span className={kpiValue} style={{ color: "#EF4444" }}>{stats.critical}</span>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <span className={kpiLabel}>Medium</span>
          <span className={kpiValue} style={{ color: "#F59E0B" }}>{stats.medium}</span>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <span className={kpiLabel}>Low</span>
          <span className={kpiValue} style={{ color: "#22C55E" }}>{stats.low}</span>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <span className={kpiLabel}>Ø Score</span>
          <span className={kpiValue}>{stats.avgScore}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["critical", "medium", "low", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f ? "text-white" : "text-neutral-400 hover:text-neutral-200"
            }`}
            style={{
              background: filter === f ? (f === "all" ? "#1e293b" : RISK_COLORS[f]?.bg || "#1e293b") : "transparent",
              ...(filter === f && f !== "all" ? { color: RISK_COLORS[f]?.text } : {}),
            }}
          >
            {f === "all" ? "Alle" : f === "critical" ? "Kritisch" : f === "medium" ? "Medium" : "Low"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={adminCard} style={adminCardStyle}>
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#1e293b" }}>
                  {["Organisation", "Score", "Risikostufe", "Hauptfaktor", "Berechnet", "Intervention", "Aktion"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-neutral-500 text-xs">Keine Einträge gefunden</td></tr>
                )}
                {filteredEntries.map((entry) => {
                  const riskColor = RISK_COLORS[entry.risk_level] || RISK_COLORS.low;
                  return (
                    <tr key={entry.id} className="border-b" style={{ borderColor: "#1e293b" }}>
                      <td className="py-2 px-2 text-white font-medium">{entry.org_name}</td>
                      <td className="py-2 px-2 tabular-nums">
                        <span className="font-bold" style={{ color: entry.score > 70 ? "#EF4444" : entry.score > 40 ? "#F59E0B" : "#22C55E" }}>
                          {entry.score}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{ background: riskColor.bg, color: riskColor.text }}
                        >
                          {entry.risk_level}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-neutral-400 text-xs max-w-[200px] truncate">
                        {entry.risk_factors?.[0] || "—"}
                      </td>
                      <td className="py-2 px-2 text-neutral-400 text-xs">{formatDate(entry.calculated_at)}</td>
                      <td className="py-2 px-2">
                        {entry.intervention_sent ? (
                          <span className="text-[10px] text-green-400">✓ {entry.intervention_type}</span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          className={adminBtnGhost}
                          onClick={() => {
                            window.open(`mailto:?subject=Churn Risk: ${entry.org_name}&body=Organisation "${entry.org_name}" hat einen Churn Risk Score von ${entry.score}.%0A%0AHauptfaktoren:%0A${entry.risk_factors?.join("%0A") || "Keine"}`, "_blank");
                          }}
                          title="E-Mail Draft öffnen"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Kontaktieren</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChurnTab;
