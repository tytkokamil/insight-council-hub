import { useEffect, useState } from "react";
import { RefreshCw, Building2, Users, Target, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { kpiCard, kpiCardStyle, kpiLabel, kpiValue, adminSectionTitle, adminBtnGhost, adminCard, adminCardStyle, adminTableRow, adminTableRowStyle } from "./adminStyles";
import { useAdminAnalytics } from "./useAdminData";
import { supabase } from "@/integrations/supabase/client";

const AdminOverviewTab = () => {
  const { data: metrics, loading, error, fetch } = useAdminAnalytics();
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [topOrgs, setTopOrgs] = useState<any[]>([]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!metrics) return;
    // Fetch growth chart data and top orgs via admin-actions
    const loadExtra = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data } = await supabase.functions.invoke("admin-actions", {
          body: { action: "get_growth_data" },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (data?.growth) setGrowthData(data.growth);
        if (data?.topOrgs) setTopOrgs(data.topOrgs);
      } catch {}
    };
    loadExtra();
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Übersicht</h2>
        <button onClick={fetch} disabled={loading} className={adminBtnGhost}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {error && <div className="p-3 rounded-lg border text-xs" style={{ borderColor: "#ef4444", color: "#ef4444", background: "#ef44440d" }}>{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={kpiCard} style={kpiCardStyle}>
          <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-neutral-500" /><span className={kpiLabel}>Organisationen</span></div>
          <span className={kpiValue}>{metrics?.totalOrgs ?? "—"}</span>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-neutral-500" /><span className={kpiLabel}>Aktive Nutzer (30d)</span></div>
          <span className={kpiValue}>{metrics?.registrations?.total ?? "—"}</span>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-neutral-500" /><span className={kpiLabel}>Entscheidungen</span></div>
          <span className={kpiValue}>{metrics?.totalDecisions ?? "—"}</span>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-neutral-500" /><span className={kpiLabel}>MRR (Schätzung)</span></div>
          <span className={kpiValue}>€{metrics?.mrr?.toLocaleString("de-DE") ?? "0"}</span>
        </div>
      </div>

      {/* Growth Chart */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className={adminSectionTitle}>Wachstum (12 Monate)</h3>
        {growthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={growthData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0d1320", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="orgs" name="Neue Orgs" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="users" name="Neue Nutzer" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="decisions" name="Neue Entsch." stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-neutral-500">
            {loading ? "Lade Daten…" : "Keine Wachstumsdaten verfügbar"}
          </div>
        )}
      </div>

      {/* Top Orgs */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className={adminSectionTitle}>Top 10 aktivste Organisationen</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: "#1e293b" }} className="border-b">
                <th className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">Org</th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium text-xs">Plan</th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium text-xs">Nutzer</th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium text-xs">Entscheidungen</th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium text-xs">Letzte Aktivität</th>
                <th className="text-right py-2 px-2 text-neutral-500 font-medium text-xs">Seit</th>
              </tr>
            </thead>
            <tbody>
              {topOrgs.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-neutral-500 text-xs">Keine Daten</td></tr>
              )}
              {topOrgs.map((org: any, i: number) => (
                <tr key={i} className={adminTableRow} style={adminTableRowStyle}>
                  <td className="py-2 px-2 text-white">{org.name}</td>
                  <td className="py-2 px-2">
                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded" style={{ background: "#1e293b" }}>{org.plan}</span>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{org.users}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{org.decisions}</td>
                  <td className="py-2 px-2 text-right text-neutral-400">{org.lastActivity || "—"}</td>
                  <td className="py-2 px-2 text-right text-neutral-400">{org.since || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
