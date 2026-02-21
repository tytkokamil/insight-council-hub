import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Settings2 } from "lucide-react";

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch", budget: "Budget", hr: "Personal",
  technical: "Technisch", operational: "Operativ", marketing: "Marketing",
};

const reviewFlowLabels: Record<string, string> = {
  fast_track: "Fast Track", standard: "Standard", strategic: "Strategic",
};

interface Props {
  teamId: string;
}

const TeamDefaultsConfig = ({ teamId }: Props) => {
  const [defaults, setDefaults] = useState({
    default_category: "operational",
    default_priority: "medium",
    default_review_flow: "standard",
    default_sla_days: 7,
  });
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("team_defaults")
        .select("*")
        .eq("team_id", teamId)
        .single();
      if (data) {
        setDefaults({
          default_category: data.default_category,
          default_priority: data.default_priority,
          default_review_flow: data.default_review_flow,
          default_sla_days: data.default_sla_days,
        });
        setExists(true);
      }
    };
    if (teamId) fetch();
  }, [teamId]);

  const handleSave = async () => {
    setSaving(true);
    if (exists) {
      await supabase.from("team_defaults").update(defaults).eq("team_id", teamId);
    } else {
      await supabase.from("team_defaults").insert({ team_id: teamId, ...defaults });
      setExists(true);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">Smart Defaults</h4>
        {exists && <Badge variant="outline" className="text-[10px]">Konfiguriert</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">Diese Voreinstellungen werden automatisch übernommen, wenn ein Teammitglied eine neue Entscheidung erstellt.</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default-Kategorie</label>
          <select value={defaults.default_category} onChange={e => setDefaults(d => ({ ...d, default_category: e.target.value }))} className={inputClass}>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default-Priorität</label>
          <select value={defaults.default_priority} onChange={e => setDefaults(d => ({ ...d, default_priority: e.target.value }))} className={inputClass}>
            {["low", "medium", "high", "critical"].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default Review-Flow</label>
          <select value={defaults.default_review_flow} onChange={e => setDefaults(d => ({ ...d, default_review_flow: e.target.value }))} className={inputClass}>
            {Object.entries(reviewFlowLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default SLA (Tage)</label>
          <input type="number" min={1} max={90} value={defaults.default_sla_days} onChange={e => setDefaults(d => ({ ...d, default_sla_days: parseInt(e.target.value) || 7 }))} className={inputClass} />
        </div>
      </div>

      <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5">
        {saved && <CheckCircle2 className="w-3 h-3" />}
        {saving ? "Speichern..." : saved ? "Gespeichert" : "Speichern"}
      </Button>
    </div>
  );
};

export default TeamDefaultsConfig;
